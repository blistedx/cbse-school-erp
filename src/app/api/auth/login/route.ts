/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { createSessionToken, canonicalizeSchoolId } from '@/lib/auth-guard';
import { checkRateLimit, checkAccountLockout, resetRateLimit } from '@/lib/rate-limiter';
import { validateBody, authLoginSchema, sanitizeNoSqlInput } from '@/lib/validation-schemas';
import { logAuditEvent } from '@/lib/audit-logger';

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

    const { school_code, username, password, role, remember } = validation.data;
    const cleanSchoolCode = school_code ? school_code.trim().toUpperCase() : '';
    const cleanUsername = username.trim();
    const shouldRemember = remember !== false; // Default to true unless explicitly false

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // 1. Check IP-based rate limiting (Max 60 attempts / 15 mins)
    const ipRate = checkRateLimit(req, {
      bucketName: 'auth-login-ip',
      maxAttempts: 60,
      windowMs: 15 * 60 * 1000,
      skipLocalhost: true
    });
    if (!ipRate.allowed) {
      logAuditEvent({
        schoolId: cleanSchoolCode || 'DPS2026',
        userId: cleanUsername || 'anonymous',
        role: role || 'UNKNOWN',
        module: 'AUDIT_LOGS',
        action: 'BRUTE_FORCE_BLOCKED',
        severity: 'SECURITY',
        summary: `Brute force attack blocked: IP rate limit exceeded for ${clientIp}`,
        details: { ip: clientIp, userAgent, username: cleanUsername, school_code: cleanSchoolCode },
        ip: clientIp,
        userAgent
      });
      return ipRate.response!;
    }

    // 2. Check Account-based lockout (Max 20 attempts per account / 15 mins)
    const accountLock = checkAccountLockout(cleanSchoolCode || 'SYSTEM', cleanUsername, 20, 15 * 60 * 1000);
    if (accountLock.locked) {
      logAuditEvent({
        schoolId: cleanSchoolCode || 'DPS2026',
        userId: cleanUsername,
        role: role || 'UNKNOWN',
        module: 'AUDIT_LOGS',
        action: 'BRUTE_FORCE_BLOCKED',
        severity: 'SECURITY',
        summary: `Repeated login failure lockout: Account ${cleanUsername} locked due to repeated invalid attempts`,
        details: { ip: clientIp, userAgent, username: cleanUsername, school_code: cleanSchoolCode },
        ip: clientIp,
        userAgent
      });
      return accountLock.response!;
    }

    const auth = await Database.authenticateUser(cleanSchoolCode, cleanUsername, password, role);

    if (!auth) {
      // Record failed attempt for account lockout
      checkRateLimit(req, {
        bucketName: 'account-lockout',
        maxAttempts: 20,
        windowMs: 15 * 60 * 1000,
        customKey: `${(cleanSchoolCode || 'SYSTEM').toUpperCase()}:${cleanUsername.toUpperCase()}`
      });

      logAuditEvent({
        schoolId: cleanSchoolCode || 'DPS2026',
        userId: cleanUsername,
        role: role || 'UNKNOWN',
        module: 'AUDIT_LOGS',
        action: 'LOGIN_FAILED',
        severity: 'WARNING',
        summary: `Failed login attempt for user "${cleanUsername}" (School: ${cleanSchoolCode || 'DEFAULT'})`,
        details: { username: cleanUsername, school_code: cleanSchoolCode, role },
        ip: clientIp,
        userAgent
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

    // Issue a signed session token (30 days if remember is true, 24h if false)
    const sessionToken = createSessionToken(
      auth.user.id,
      canonicalSchool,
      auth.user.role,
      shouldRemember
    );

    logAuditEvent({
      schoolId: canonicalSchool,
      userId: auth.user.id,
      role: auth.user.role,
      module: 'AUDIT_LOGS',
      action: 'LOGIN_SUCCESS',
      severity: 'INFO',
      summary: `User "${(auth.user as any).name || (auth.user as any).full_name || auth.user.id}" (${auth.user.role}) logged in successfully`,
      details: { username: (auth.user as any).username || auth.user.id, role: auth.user.role },
      ip: clientIp,
      userAgent
    });

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

    // Set cookie for browser fetch auto-attachment (30 days if remember is true)
    const isProd = process.env.NODE_ENV === 'production';
    const cookieMaxAge = shouldRemember ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    response.cookies.set('erp_session_token', sessionToken, {
      path: '/',
      maxAge: cookieMaxAge,
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

