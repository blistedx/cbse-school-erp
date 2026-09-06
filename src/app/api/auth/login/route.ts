/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { createSessionToken } from '@/lib/auth-guard';

import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req, {
      bucketName: 'auth-login',
      maxAttempts: 15,
      windowMs: 15 * 60 * 1000
    });
    if (!rate.allowed) return rate.response!;

    const body = await req.json();
    let { school_code, username, password, role } = body;
    const effectiveSchoolCode = (school_code && typeof school_code === 'string' && school_code.trim()) ? school_code.trim().toUpperCase() : 'DPS2026';

    const auth = await Database.authenticateUser(effectiveSchoolCode, username, password, role);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or unauthorized school access.' },
        { status: 401 }
      );
    }

    // Successful login — clear rate limit record
    resetRateLimit('auth-login', req);

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
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('erp_session_token', sessionToken, {
      path: '/',
      maxAge: 43200,
      sameSite: 'lax',
      httpOnly: true,
      secure: isProd
    });

    return response;
  } catch (err: any) {
    console.error('[AUTH_LOGIN_ERROR]', err);
    return NextResponse.json({ success: false, error: `Login error: ${err?.message || 'Unknown server error'}` }, { status: 500 });
  }
}
