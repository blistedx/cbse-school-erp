/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken, createSessionToken } from '@/lib/auth-guard';

/**
 * POST /api/auth/session
 * Strictly verifies and refreshes an active, valid session token.
 * Never accepts user id, role, or school from the request body.
 * Returns 401 Unauthorized if no valid session exists.
 */
export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session token found. Please log in.' },
        { status: 401 }
      );
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session token is invalid, expired, or revoked.' },
        { status: 401 }
      );
    }

    // Refresh valid session token (preserve remember setting)
    const isRemembered = payload.rem !== false;
    const refreshedToken = createSessionToken(
      payload.userId,
      payload.schoolId,
      payload.role,
      isRemembered
    );

    const response = NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: payload.userId,
        school_id: payload.schoolId,
        role: payload.role
      },
      session_token: refreshedToken
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieMaxAge = isRemembered ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    response.cookies.set('erp_session_token', refreshedToken, {
      path: '/',
      maxAge: cookieMaxAge,
      sameSite: 'lax',
      httpOnly: true,
      secure: isProd
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to refresh session.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}

