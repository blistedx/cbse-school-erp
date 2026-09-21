/*! EduSuite Dedicated Fast Stats Endpoint v1.0.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { getSchoolFinancialStats, getFilteredFeeBreakdown, invalidateStatsCache } from '@/lib/stats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const range = searchParams.get('range');
    const forceFresh = searchParams.get('fresh') === 'true';

    if (range) {
      const breakdown = await getFilteredFeeBreakdown(tenant, session, range);
      return NextResponse.json({ success: true, ...breakdown }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    const stats = await getSchoolFinancialStats(tenant, session, forceFresh);
    return NextResponse.json({ success: true, stats }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    console.error('[API_STATS_GET_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch financial stats' }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    invalidateStatsCache(tenant);
    return NextResponse.json({ success: true, message: 'Stats cache invalidated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
