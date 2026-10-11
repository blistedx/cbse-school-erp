/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
import { StudentBehaviorRemark } from '@/lib/types';

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

    const studentId = searchParams.get('student_id') || undefined;

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You are not assigned as a Class Teacher.'
      }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;
    const remarks = await Database.getStudentRemarks(tenant, class_name, section, studentId);

    return NextResponse.json({
      success: true,
      class_name,
      section,
      count: remarks.length,
      remarks
    });
  } catch (error: any) {
    console.error('[API_CLASS_REMARKS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve student remarks.' }, { status: 500 });
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

    const { student_id, student_name, admission_no, category, severity, remark, visible_to_parents } = body;

    if (!student_id || !remark || remark.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Student ID and remark of at least 5 characters are required.' }, { status: 400 });
    }

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({ success: false, error: 'Access Denied: Class teacher privileges required.' }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;

    const saved = await Database.saveStudentRemark({
      id: body.id,
      school_id: tenant,
      academic_session: body.academic_session || '2026-27',
      student_id,
      student_name: student_name || '',
      admission_no: admission_no || '',
      class_name,
      section,
      category: category || 'BEHAVIOR',
      severity: severity || 'POSITIVE',
      remark: remark.trim(),
      created_by_teacher_id: assignments.teacher.id,
      created_by_teacher_name: assignments.teacher.full_name,
      visible_to_parents: visible_to_parents !== false,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Student conduct remark saved.',
      remark: saved
    });
  } catch (error: any) {
    console.error('[API_CLASS_REMARKS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to save student remark.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Remark ID is required.' }, { status: 400 });

    const assignments = await Database.getTeacherAssignments(auth.schoolId || 'DPS2026', auth.userId);
    await Database.deleteStudentRemark(id, assignments?.teacher?.id || auth.userId);

    return NextResponse.json({ success: true, message: 'Student remark removed.' });
  } catch (error: any) {
    console.error('[API_CLASS_REMARKS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to remove student remark.' }, { status: 500 });
  }
}
