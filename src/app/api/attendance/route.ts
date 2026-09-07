/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database, isSameClass } from '@/lib/db';
import { requireAuth, requireRole, resolveTenantSchoolId, STAFF_ROLES, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const attendance = await Database.getAttendance(tenant, session);
    return NextResponse.json({ success: true, count: attendance.length, attendance });
  } catch (error: any) {
    console.error('[API_ATTENDANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to load attendance.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, STAFF_ROLES);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (tenant instanceof NextResponse) return tenant;

    const schoolId = tenant;

    // 🔒 TEACHER ATTENDANCE RESTRICTION:
    // Teachers can ONLY mark student attendance for their designated assigned class.
    // Subject teachers (with no assigned class) cannot mark attendance.
    // Teachers cannot mark faculty attendance.
    if (auth.role === 'TEACHER') {
      if (body.type === 'FACULTY') {
        return NextResponse.json({
          success: false,
          error: 'Access Denied: Only school administrators can record faculty attendance.'
        }, { status: 403 });
      }

      const classes = await Database.getClasses(schoolId);
      const targetClass = classes.find(c =>
        isSameClass(c.class_name, body.class_name) &&
        (c.section || 'A').toUpperCase().trim() === (body.section || 'A').toUpperCase().trim()
      );

      if (!targetClass) {
        return NextResponse.json({ success: false, error: 'Specified class does not exist.' }, { status: 404 });
      }

      const teachers = await Database.getTeachers(schoolId);
      const currentTeacher = teachers.find(t => t.id === auth.userId || t.staff_code === auth.userId);

      const tId = (auth.userId || '').toLowerCase().trim();
      const tName = (currentTeacher?.full_name || '').toLowerCase().trim();
      const tCode = (currentTeacher?.staff_code || '').toLowerCase().trim();

      const cTeacherId = ((targetClass as any).class_teacher_id || '').toLowerCase().trim();
      const cTeacherName = ((targetClass as any).class_teacher_name || targetClass.class_teacher || '').toLowerCase().trim();
      const cTeacher = (targetClass.class_teacher || '').toLowerCase().trim();

      const isAuthorized = (
        (cTeacherId && (cTeacherId === tId || cTeacherId === currentTeacher?.id?.toLowerCase().trim())) ||
        (cTeacherName && (cTeacherName === tName || cTeacherName === tCode)) ||
        (cTeacher && (cTeacher === tName || cTeacher === tCode))
      );

      if (!isAuthorized) {
        return NextResponse.json({
          success: false,
          error: `Access Denied: You are not assigned as the Class Teacher for ${targetClass.class_name}-${targetClass.section}. Subject teachers and unauthorized faculty cannot mark daily attendance.`
        }, { status: 403 });
      }
    }

    const record = await Database.recordAttendance({ ...body, school_id: schoolId });
    return NextResponse.json({ success: true, message: 'Attendance recorded!', record });
  } catch (error: any) {
    console.error('[API_ATTENDANCE_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record attendance.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const success = await Database.deleteAttendance(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('[API_ATTENDANCE_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete attendance.' }, { status: 500 });
  }
}
