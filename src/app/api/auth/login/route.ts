/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { createSessionToken } from '@/lib/auth-guard';

// In-memory rate limiter: generous limits during dev and field operations
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 25;
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
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'unknown';
    const record = loginAttempts.get(ip);

    // Check if within rate limit window (skip strict block on localhost/dev)
    if (!isLocal && record && now - record.firstAttempt < WINDOW_MS) {
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
    } else if (record && now - record.firstAttempt >= WINDOW_MS) {
      // Reset window
      loginAttempts.delete(ip);
    }

    const body = await req.json();
    let { school_code, username, password, role } = body;
    const effectiveSchoolCode = (school_code && typeof school_code === 'string' && school_code.trim()) ? school_code.trim().toUpperCase() : 'DPS2026';

    const auth = await Database.authenticateUser(effectiveSchoolCode, username, password, role);

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

    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: auth.user,
      school: auth.school,
      session_token: sessionToken
    });

    // Set cookie for browser fetch auto-attachment
    response.cookies.set('erp_session_token', sessionToken, {
      path: '/',
      maxAge: 43200,
      sameSite: 'lax',
      httpOnly: false
    });

    return response;
  } catch (err: any) {
    console.error('[AUTH_LOGIN_ERROR]', err);
    return NextResponse.json({ success: false, error: `Login error: ${err?.message || 'Unknown server error'}` }, { status: 500 });
  }
}
