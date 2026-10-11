/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';

    const teachers = await Database.getTeachers(tenant);
    const teacher = teachers.find(t => 
      t.id === auth.userId || 
      (t.staff_code && t.staff_code === auth.userId) ||
      (t.email && t.email === auth.username)
    );

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Teacher not found.' }, { status: 404 });
    }

    // Biometric requests
    const bioRequests = await Database.getBiometricRequests(tenant, teacher.id);

    // Staff leave requests
    const allApprovals = await Database.getApprovals(tenant, session, 'STAFF_LEAVE');
    const myLeaveRequests = allApprovals.filter(a => 
      a.requested_by?.id === teacher.id || 
      a.details?.staff_id === teacher.id || 
      a.details?.staff_code === teacher.staff_code
    );

    return NextResponse.json({
      success: true,
      school_id: tenant,
      teacher: {
        id: teacher.id,
        staff_code: teacher.staff_code,
        full_name: teacher.full_name
      },
      biometric_requests: bioRequests,
      leave_requests: myLeaveRequests
    });
  } catch (error: any) {
    console.error('[API_TEACHER_REQUESTS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve requests.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (tenant instanceof NextResponse) return tenant;

    const session = body.academic_session || '2026-27';
    const { leave_type, start_date, end_date, days, reason, substitution_required } = body;

    if (!start_date || !end_date) {
      return NextResponse.json({ success: false, error: 'Start date and end date are required.' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Reason of at least 10 characters is required.' }, { status: 400 });
    }

    const teachers = await Database.getTeachers(tenant);
    const teacher = teachers.find(t => 
      t.id === auth.userId || 
      (t.staff_code && t.staff_code === auth.userId) ||
      (t.email && t.email === auth.username)
    );

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Teacher not found.' }, { status: 404 });
    }

    const calculatedDays = Number(days) || 1;

    const newApproval = await Database.createApproval({
      school_id: tenant,
      academic_session: session,
      type: 'STAFF_LEAVE',
      status: 'PENDING',
      title: `Staff Leave Petition: ${teacher.full_name} (${leave_type || 'Casual Leave'}, ${calculatedDays} days)`,
      requested_by: {
        id: teacher.id,
        name: teacher.full_name,
        role: 'TEACHER',
        email: teacher.email
      },
      details: {
        staff_id: teacher.id,
        staff_code: teacher.staff_code,
        staff_name: teacher.full_name,
        department: teacher.department,
        designation: teacher.designation,
        leave_type: leave_type || 'Casual Leave',
        start_date,
        end_date,
        days: calculatedDays,
        reason: reason.trim(),
        substitution_required: !!substitution_required
      }
    });

    logAuditEvent({
      actor: { id: teacher.id, name: teacher.full_name, role: 'TEACHER' },
      module: 'STAFF',
      action: 'LEAVE_APPLICATION_SUBMITTED',
      severity: 'INFO',
      summary: `Staff leave application submitted by ${teacher.full_name} (${start_date} to ${end_date})`,
      targetId: newApproval.id,
      school_id: tenant,
      session,
      details: { leaveType: leave_type, days: calculatedDays, reason }
    });

    return NextResponse.json({
      success: true,
      message: 'Staff leave application submitted successfully for Principal approval.',
      approval: newApproval
    });
  } catch (error: any) {
    console.error('[API_TEACHER_REQUESTS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to submit leave petition.' }, { status: 500 });
  }
}
