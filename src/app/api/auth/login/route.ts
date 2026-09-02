/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { createSessionToken } from '@/lib/auth-guard';

// In-memory rate limiter: max 5 failed attempts per IP per 15 minutes [M5]
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();
    const record = loginAttempts.get(ip);

    // Check if within rate limit window
    if (record && now - record.firstAttempt < WINDOW_MS) {
      if (record.count >= MAX_ATTEMPTS) {
        const retryAfterMs = WINDOW_MS - (now - record.firstAttempt);
        return NextResponse.json(
          {
            success: false,
            error: `Too many login attempts. Please try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).`
          },
          { status: 429 }
        );
      }
    } else {
      // Reset window
      loginAttempts.delete(ip);
    }

    const body = await req.json();
    const { school_code, username, password, role } = body;

    const auth = await Database.authenticateUser(school_code, username, password, role);

    if (!auth) {
      // Increment failure count
      const current = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
      loginAttempts.set(ip, { count: current.count + 1, firstAttempt: current.firstAttempt });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials or unauthorized school access.' },
        { status: 401 }
      );
    }

    // Successful login — clear rate limit record
    loginAttempts.delete(ip);

    // Issue a signed session token (12h validity)
    const sessionToken = createSessionToken(
      auth.user.id,
      auth.user.school_id || auth.school?.id || '',
      auth.user.role
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: auth.user,
      school: auth.school,
      session_token: sessionToken
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
