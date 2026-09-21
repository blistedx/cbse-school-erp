import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAuth, requireRole, resolveTenantSchoolId, STAFF_ROLES, ADMIN_ROLES } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
import { AttendanceService } from '@/lib/services/attendance.service';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const action = searchParams.get('action');

    // 1. Single Student Attendance Query
    const studentId = searchParams.get('student_id');
    if (studentId || action === 'student') {
      const targetId = studentId || (auth.role === 'STUDENT' ? auth.userId : undefined);
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }
      const from = searchParams.get('from') || undefined;
      const to = searchParams.get('to') || undefined;
      const summary = await AttendanceService.getStudentAttendance(tenant, targetId, session, { from, to });
      return NextResponse.json({ success: true, summary });
    }

    // 2. School-wide Summary for a date
    if (action === 'summary') {
      const date = searchParams.get('date') || undefined;
      const summary = await AttendanceService.getSchoolSummary(tenant, session, date);
      return NextResponse.json({ success: true, summary });
    }

    // 3. Absent List for a date
    if (action === 'absent_list') {
      const date = searchParams.get('date') || undefined;
      const className = searchParams.get('class_name') || undefined;
      const section = searchParams.get('section') || undefined;
      const absents = await AttendanceService.getAbsentList(tenant, date, session, className, section);
      return NextResponse.json({ success: true, count: absents.length, absents });
    }

    // 4. Specific Class & Date Query
    const className = searchParams.get('class_name') || searchParams.get('class');
    const section = searchParams.get('section');
    const date = searchParams.get('date');
    if (className && section && date) {
      const record = await AttendanceService.getClassAttendance(tenant, className, section, date, session);
      return NextResponse.json({ success: true, record });
    }

    // 5. Default: Return all records for session
    const attendance = await AttendanceService.getAllAttendanceRecords(tenant, session);
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

    const record = await AttendanceService.markAttendance(schoolId, body.academic_session || '2026-27', { ...body, school_id: schoolId });
    try {
      revalidateTag('attendance', { expire: 0 });
      revalidateTag('overview', { expire: 0 });
    } catch {}
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
    try {
      revalidateTag('attendance', { expire: 0 });
      revalidateTag('overview', { expire: 0 });
    } catch {}
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('[API_ATTENDANCE_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete attendance.' }, { status: 500 });
  }
}
