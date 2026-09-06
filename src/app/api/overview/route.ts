/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const overview = await Database.getSchoolOverview(tenant, session);
    return NextResponse.json({ success: true, ...overview });
  } catch (err: any) {
    console.error('[API_OVERVIEW_GET_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch overview.' }, { status: 500 });
  }
}
