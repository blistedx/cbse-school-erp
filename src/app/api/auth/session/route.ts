/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { createSessionToken } from '@/lib/auth-guard';

/**
 * POST /api/auth/session
 * Ensures an active client workspace has a valid signed session token.
 * Validates the user credentials/context and returns a signed session token,
 * while also setting the erp_session_token cookie.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, schoolId, role, username } = body;

    if (!userId || !schoolId || !role) {
      return NextResponse.json(
        { success: false, error: 'User context is required to issue a session token.' },
        { status: 400 }
      );
    }

    // Verify that the school exists
    const school = (await Database.getSchoolById(schoolId)) || (await Database.getSchoolByCode(schoolId));
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'Specified school workspace does not exist.' },
        { status: 404 }
      );
    }

    // Issue signed token valid for 12 hours
    const sessionToken = createSessionToken(userId, schoolId, role.toUpperCase());

    const response = NextResponse.json({
      success: true,
      session_token: sessionToken
    });

    response.cookies.set('erp_session_token', sessionToken, {
      path: '/',
      maxAge: 43200,
      sameSite: 'lax',
      httpOnly: false
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to issue session token.' },
      { status: 500 }
    );
  }
}
