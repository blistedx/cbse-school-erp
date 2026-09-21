/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { createSessionToken, canonicalizeSchoolId } from '@/lib/auth-guard';
import { checkRateLimit, checkAccountLockout, resetRateLimit } from '@/lib/rate-limiter';
import { validateBody, authLoginSchema, sanitizeNoSqlInput } from '@/lib/validation-schemas';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    // Strict Zod schema validation — rejects unknown fields like 'passcode' or object injections
    const validation = validateBody(authLoginSchema, sanitizeNoSqlInput(rawBody));
    if (!validation.success) {
      return validation.response;
    }

    const { school_code, username, password, role } = validation.data;
    const cleanSchoolCode = school_code ? school_code.trim().toUpperCase() : '';
    const cleanUsername = username.trim();

    // 1. Check IP-based rate limiting (Max 25 attempts / 15 mins)
    const ipRate = checkRateLimit(req, {
      bucketName: 'auth-login-ip',
      maxAttempts: 25,
      windowMs: 15 * 60 * 1000,
      skipLocalhost: process.env.NODE_ENV !== 'production'
    });
    if (!ipRate.allowed) return ipRate.response!;

    // 2. Check Account-based lockout (Max 5 failed attempts per account / 15 mins)
    const accountLock = checkAccountLockout(cleanSchoolCode || 'SYSTEM', cleanUsername, 5, 15 * 60 * 1000);
    if (accountLock.locked) {
      return accountLock.response!;
    }

    const auth = await Database.authenticateUser(cleanSchoolCode, cleanUsername, password, role);

    if (!auth) {
      // Record failed attempt for account lockout
      checkRateLimit(req, {
        bucketName: 'account-lockout',
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        customKey: `${(cleanSchoolCode || 'SYSTEM').toUpperCase()}:${cleanUsername.toUpperCase()}`
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials or unauthorized school access.' },
        { status: 401 }
      );
    }

    // Successful login — clear rate limit and lockout records
    resetRateLimit('auth-login-ip', req);
    resetRateLimit('account-lockout', undefined, `${(cleanSchoolCode || 'SYSTEM').toUpperCase()}:${cleanUsername.toUpperCase()}`);

    const canonicalSchool = canonicalizeSchoolId(auth.user.school_id || auth.school?.id || cleanSchoolCode || 'DPS2026');

    // Issue a signed session token (12h validity)
    const sessionToken = createSessionToken(
      auth.user.id,
      canonicalSchool,
      auth.user.role
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        ...auth.user,
        must_change_password: (auth.user as any).must_change_password === true
      },
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
    return NextResponse.json(
      { success: false, error: 'An unexpected server error occurred during authentication.' },
      { status: 500 }
    );
  }
}

