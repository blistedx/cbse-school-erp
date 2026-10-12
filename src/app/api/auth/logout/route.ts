/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { extractToken, revokeToken, revokeTokenAsync, verifySessionToken } from '@/lib/auth-guard';
import { logAuditEvent } from '@/lib/audit-logger';

/**
 * POST /api/auth/logout
 * Invalidates the session token on the server-side blocklist and clears the HttpOnly cookie.
 */
export async function POST(req: Request) {
  const token = extractToken(req);
  if (token) {
    const payload = verifySessionToken(token);
    revokeToken(token);
    revokeTokenAsync(token).catch(() => {});
    logAuditEvent({
      schoolId: payload?.schoolId || 'DPS2026',
      userId: payload?.userId || 'anonymous',
      role: payload?.role || 'USER',
      module: 'AUDIT_LOGS',
      action: 'SESSION_REVOKED',
      severity: 'INFO',
      summary: `Session revoked / User "${payload?.userId || 'unknown'}" logged out`,
      details: { userId: payload?.userId, role: payload?.role, schoolId: payload?.schoolId }
    });
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.'
  });

  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('erp_session_token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
    httpOnly: true,
    secure: isProd
  });

  return response;
}
