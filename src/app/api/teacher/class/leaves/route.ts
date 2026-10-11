/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';

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

    const status = searchParams.get('status') || undefined;

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You are not assigned as a Class Teacher.'
      }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;
    const leaves = await Database.getStudentLeaves(tenant, class_name, section, status);

    return NextResponse.json({
      success: true,
      class_name,
      section,
      count: leaves.length,
      leaves
    });
  } catch (error: any) {
    console.error('[API_CLASS_LEAVES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve leave applications.' }, { status: 500 });
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

    const { id, action, remarks } = body;
    if (!id || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Leave application ID and action (APPROVE/REJECT) are required.' }, { status: 400 });
    }

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: Only assigned Class Teachers can approve or reject scholar leave petitions.'
      }, { status: 403 });
    }

    const updated = await Database.actionStudentLeave(
      id,
      action as 'APPROVE' | 'REJECT',
      remarks || (action === 'APPROVE' ? 'Approved by Class Teacher' : 'Rejected per academic policy'),
      { id: assignments.teacher.id, name: assignments.teacher.full_name }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Leave application not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Leave application ${action === 'APPROVE' ? 'approved and synchronized with attendance records' : 'rejected'}.`,
      leave: updated
    });
  } catch (error: any) {
    console.error('[API_CLASS_LEAVES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to process leave decision.' }, { status: 500 });
  }
}
