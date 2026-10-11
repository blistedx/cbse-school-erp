/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { AttendanceService } from '@/lib/services/attendance.service';
import { getTodayDateStr } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Strictly restricted to Principal and School Leadership.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const date = searchParams.get('date') || getTodayDateStr();

    const ledger = await AttendanceService.getFacultyAttendanceLedger(tenant, session, date);

    return NextResponse.json({
      success: true,
      school_id: tenant,
      session,
      ...ledger
    });
  } catch (error: any) {
    console.error('[API_PRINCIPAL_FACULTY_ATTENDANCE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve faculty attendance ledger.' }, { status: 500 });
  }
}
