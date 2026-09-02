/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, STAFF_ROLES, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const attendance = await Database.getAttendance(schoolId, session);
    return NextResponse.json({ success: true, count: attendance.length, attendance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, STAFF_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const schoolId = body.school_id || body.schoolId;
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'school_id is required.' }, { status: 400 });
    }

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
        c.class_name.toLowerCase().trim() === (body.class_name || '').toLowerCase().trim() &&
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
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const success = await Database.deleteAttendance(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
