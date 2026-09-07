/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { extractToken, revokeToken } from '@/lib/auth-guard';

/**
 * POST /api/auth/logout
 * Invalidates the session token on the server-side blocklist and clears the HttpOnly cookie.
 */
export async function POST(req: Request) {
  const token = extractToken(req);
  if (token) {
    revokeToken(token);
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
