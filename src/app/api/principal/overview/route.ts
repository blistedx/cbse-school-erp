/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, requireRole, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { AttendanceService } from '@/lib/services/attendance.service';
import { AggregatesService } from '@/lib/services/aggregates.service';
import { getTodayDateStr } from '@/lib/utils';
import { PrincipalOverviewData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Strict Principal Guard: only PRINCIPAL or Superadmin
    const userRole = (auth.role || '').toUpperCase();
    const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: The Principal Panel is strictly reserved for the School Principal.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const today = getTodayDateStr();

    // 1. Fetch aggregate & today's attendance & school info in parallel
    const [aggregate, attSummary, school, approvals, notices] = await Promise.all([
      AggregatesService.getSchoolAggregate(tenant, session),
      AttendanceService.getSchoolSummary(tenant, session, today),
      Database.getSchoolById(tenant),
      Database.getApprovals(tenant, session),
      Database.getNotices(tenant, session)
    ]);

    // 2. Compute 7-day attendance trend
    const sevenDayTrend: Array<{ date: string; day: string; studentPercent: number; staffPercent: number }> = [];
    const dateObj = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      if (dStr === today) {
        sevenDayTrend.push({
          date: dStr,
          day: dayName,
          studentPercent: attSummary.studentPercent,
          staffPercent: attSummary.facultyPercent
        });
      } else {
        const histAtt = await AttendanceService.getSchoolSummary(tenant, session, dStr);
        sevenDayTrend.push({
          date: dStr,
          day: dayName,
          studentPercent: histAtt.studentPercent,
          staffPercent: histAtt.facultyPercent
        });
      }
    }

    // 3. Compute Month-wise fee collection & this month collected
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentMonthIdx = dateObj.getMonth();
    const currentMonthAbbr = monthNames[currentMonthIdx];

    const rawTrend = aggregate.financials?.monthWiseTrend || [];
    const monthWiseTrend = rawTrend.map(m => ({
      month: m.month,
      collected: Math.round((m.collected || 0) / 100),
      billed: Math.round((m.billed || 0) / 100),
      pending: Math.round((m.pending || 0) / 100)
    }));

    // Find this month collected
    const thisMonthData = rawTrend.find(m => m.month.toUpperCase().includes(currentMonthAbbr));
    const thisMonthCollected = thisMonthData
      ? Math.round((thisMonthData.collected || 0) / 100)
      : (monthWiseTrend.length > 0 ? monthWiseTrend[monthWiseTrend.length - 1].collected : 0);

    const pendingFees = Math.round((aggregate.financials?.totalPendingPaise || 0) / 100);

    // 4. Pending approvals breakdown
    const pendingList = approvals.filter(a => a.status === 'PENDING');
    const tcCount = pendingList.filter(a => a.type === 'CERTIFICATE_TC').length;
    const feeConcCount = pendingList.filter(a => a.type === 'FEE_CONCESSION').length;
    const leaveCount = pendingList.filter(a => a.type === 'STAFF_LEAVE').length;
    const admCount = pendingList.filter(a => a.type === 'ADMISSION').length;

    const overviewData: PrincipalOverviewData = {
      school_id: tenant,
      school_name: school?.school_name || school?.name || 'Delhi Public School',
      academic_session: session,
      kpis: {
        student_attendance_percent: attSummary.studentPercent,
        staff_attendance_percent: attSummary.facultyPercent,
        total_students: aggregate.total_students,
        total_staff: aggregate.total_teachers,
        fees_collected_this_month: thisMonthCollected,
        fees_pending: pendingFees,
        pending_approvals_count: pendingList.length
      },
      charts: {
        attendance_trend_7_days: sevenDayTrend,
        month_wise_fee_collection: monthWiseTrend
      },
      recent_notices: notices.slice(0, 5),
      approval_breakdown: {
        certificate_tc: tcCount,
        fee_concession: feeConcCount,
        staff_leave: leaveCount,
        admission: admCount,
        total_pending: pendingList.length
      }
    };

    return NextResponse.json({
      success: true,
      data: overviewData
    });
  } catch (error: any) {
    console.error('[API_PRINCIPAL_OVERVIEW_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load Principal Overview analytics.' },
      { status: 500 }
    );
  }
}
