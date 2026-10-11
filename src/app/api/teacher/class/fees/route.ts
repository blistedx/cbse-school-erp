/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass, getTodayDateStr } from '@/lib/utils';
import { FeesService } from '@/lib/services/fees.service';
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

    // Verify Class Teacher Assignment
    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You are not assigned as a Class Teacher.'
      }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;

    // Use unified FeesService report engine (strictly read-only, no parallel calculations)
    const pendingList = await FeesService.getPendingList(tenant, session, {
      className: class_name,
      section
    });

    const totalPendingAmount = pendingList.reduce((acc, curr) => acc + (Number(curr.pendingPaise) || 0) / 100, 0);

    return NextResponse.json({
      success: true,
      class_name,
      section,
      total_defaulters: pendingList.length,
      total_pending_amount: totalPendingAmount,
      defaulters: pendingList.map(d => ({
        student_id: d.studentId,
        admission_no: d.admissionNo,
        student_name: d.studentName,
        roll_no: '',
        father_name: d.fatherName || 'Father / Guardian',
        mobile: d.mobile || '',
        pending_amount: (d.pendingPaise || 0) / 100,
        fee_head: 'Composite School Fee'
      }))
    });
  } catch (error: any) {
    console.error('[API_CLASS_FEES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve class fee status.' }, { status: 500 });
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

    const { student_id, student_name, pending_amount, father_name } = body;
    const session = body.academic_session || '2026-27';

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({ success: false, error: 'Access Denied: Class teacher privileges required.' }, { status: 403 });
    }

    // Trigger parent reminder notice
    const notice = await Database.createNotice({
      school_id: tenant,
      academic_session: session,
      title: `Fee Due Advisory: ${student_name}`,
      category: 'FEES' as any,
      content: `Dear ${father_name || 'Parent'}, this is a gentle academic advisory regarding outstanding fee balance of ₹${Number(pending_amount).toLocaleString('en-IN')} for ${student_name} (${assignments.classTeacherSection.class_name}-${assignments.classTeacherSection.section}). Kindly remit the dues at your earliest convenience to avoid administrative inconvenience.`,
      target_audience: 'PARENTS',
      target_classes: [assignments.classTeacherSection.class_name],
      is_pinned: false,
      is_published: true,
      priority: 'HIGH',
      author_name: `Class Incharge (${assignments.teacher.full_name})`
    });

    logAuditEvent({
      actor: { id: assignments.teacher.id, name: assignments.teacher.full_name, role: 'TEACHER' },
      module: 'FEES',
      action: 'FEE_REMINDER_NOTICE_SENT',
      severity: 'INFO',
      summary: `Class teacher sent fee reminder notice for ${student_name} (₹${pending_amount})`,
      targetId: student_id,
      targetName: student_name,
      school_id: tenant,
      session,
      details: { pendingAmount: pending_amount }
    });

    return NextResponse.json({
      success: true,
      message: `Parent reminder advisory issued for ${student_name}.`,
      notice
    });
  } catch (error: any) {
    console.error('[API_CLASS_FEES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to dispatch fee reminder notice.' }, { status: 500 });
  }
}
