/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Clears the HttpOnly erp_session_token cookie and invalidates client session state.
 */
export async function POST() {
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
