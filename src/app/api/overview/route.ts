/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || searchParams.get('schoolId');
    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'school_id is required.' },
        { status: 400 }
      );
    }

    const overview = await Database.getSchoolOverview(schoolId, session);
    return NextResponse.json({ success: true, ...overview });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch overview.' }, { status: 500 });
  }
}
