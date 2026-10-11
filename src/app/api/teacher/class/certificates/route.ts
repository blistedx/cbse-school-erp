/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
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

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({ success: false, error: 'Access Denied: Class teacher privileges required.' }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;

    // Fetch certificate petitions raised for this class
    const approvals = await Database.getApprovals(tenant, session, 'CERTIFICATE_TC');
    const classCertificates = approvals.filter(a => 
      isSameClass(a.details?.class_name, class_name) &&
      (a.details?.section || 'A').toUpperCase().trim() === section.toUpperCase().trim()
    );

    return NextResponse.json({
      success: true,
      class_name,
      section,
      count: classCertificates.length,
      certificates: classCertificates
    });
  } catch (error: any) {
    console.error('[API_CLASS_CERTIFICATES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve certificate petitions.' }, { status: 500 });
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
    const { student_id, student_name, admission_no, certificate_type, reason, conduct } = body;

    if (!student_id || !certificate_type || !reason) {
      return NextResponse.json({ success: false, error: 'Student ID, certificate type, and reason are required.' }, { status: 400 });
    }

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({ success: false, error: 'Access Denied: Class teacher privileges required.' }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;

    const newApproval = await Database.createApproval({
      school_id: tenant,
      academic_session: session,
      type: 'CERTIFICATE_TC',
      status: 'PENDING',
      title: `${certificate_type || 'Transfer Certificate'} Request: ${student_name} (${class_name}-${section})`,
      requested_by: {
        id: assignments.teacher.id,
        name: assignments.teacher.full_name,
        role: 'TEACHER',
        email: assignments.teacher.email
      },
      details: {
        student_id,
        student_name: student_name || '',
        admission_no: admission_no || '',
        class_name,
        section,
        certificate_type: certificate_type || 'TRANSFER_CERTIFICATE',
        reason: reason.trim(),
        conduct: conduct || 'Exemplary Conduct & Character'
      }
    });

    logAuditEvent({
      actor: { id: assignments.teacher.id, name: assignments.teacher.full_name, role: 'TEACHER' },
      module: 'STUDENTS',
      action: 'CERTIFICATE_PETITION_SUBMITTED',
      severity: 'INFO',
      summary: `Class teacher raised ${certificate_type} request for scholar ${student_name} (${class_name}-${section})`,
      targetId: newApproval.id,
      targetName: student_name,
      school_id: tenant,
      session,
      details: { certificateType: certificate_type, reason }
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate request submitted successfully for Principal approval.',
      approval: newApproval
    });
  } catch (error: any) {
    console.error('[API_CLASS_CERTIFICATES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to submit certificate petition.' }, { status: 500 });
  }
}
