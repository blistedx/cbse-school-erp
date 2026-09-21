/*! EduSuite Unified Fast App Initializer v1.0.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { getSchoolReceipts } from '@/lib/fees-engine/collection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const startTs = Date.now();
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';

    // Fast parallel fetching on server side using warm database connection pool
    const [overview, students, teachers, classes, notices, attendance, receipts] = await Promise.all([
      Database.getSchoolOverview(tenant, session),
      Database.getStudents(tenant, session),
      Database.getTeachers(tenant, session),
      Database.getClasses(tenant, session),
      Database.getNotices(tenant, session),
      Database.getAttendance(tenant, session),
      getSchoolReceipts(tenant, session, 500)
    ]);

    const timingMs = Date.now() - startTs;

    return NextResponse.json({
      success: true,
      school_id: tenant,
      session,
      overview,
      students,
      teachers,
      classes,
      notices,
      attendance,
      receipts,
      timingMs
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'Netlify-CDN-Cache-Control': 'no-store'
      }
    });
  } catch (err: any) {
    console.error('[API_APP_INIT_ERROR]', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to initialize app state'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}
