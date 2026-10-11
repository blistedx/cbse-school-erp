/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
import { AttendanceService } from '@/lib/services/attendance.service';

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
    const className = searchParams.get('class_name');
    const section = searchParams.get('section') || 'A';

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    // Filter to allocated class-sections only
    const allocatedClassSections = Array.from(new Set(
      assignments.allocatedSubjects.map(a => `${a.class_name}___${a.section || 'A'}`)
    )).map(key => {
      const [cName, sSec] = key.split('___');
      return { class_name: cName, section: sSec };
    });

    if (!className) {
      return NextResponse.json({
        success: true,
        allocated_classes: allocatedClassSections
      });
    }

    // Verify teacher teaches this class-section
    const isAllocated = allocatedClassSections.some(a => 
      isSameClass(a.class_name, className) && 
      (a.section || 'A').toUpperCase().trim() === section.toUpperCase().trim()
    );

    if (!isAllocated && userRole === 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You may only view student attendance % for classes you are allocated to teach.'
      }, { status: 403 });
    }

    // Read student roster
    const allStudents = await Database.getStudents(tenant, session);
    const classStudents = allStudents.filter(s => 
      isSameClass(s.class_name, className) &&
      (s.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      s.status === 'ACTIVE'
    ).sort((a, b) => Number(a.roll_no || 999) - Number(b.roll_no || 999));

    // Calculate attendance % for each student from unified attendance
    const studentAttendanceRows = await Promise.all(
      classStudents.map(async s => {
        try {
          const summary = await AttendanceService.getStudentAttendance(tenant, s.id, session);
          return {
            student_id: s.id,
            admission_no: s.admission_no,
            full_name: s.full_name,
            roll_no: s.roll_no || '',
            attendance_percent: summary?.attendancePercent || s.attendance_percent || 0,
            present_days: summary?.presentDays || 0,
            total_working_days: summary?.totalWorkingDays || 0,
            is_defaulter: (summary?.attendancePercent || s.attendance_percent || 0) < 75
          };
        } catch {
          return {
            student_id: s.id,
            admission_no: s.admission_no,
            full_name: s.full_name,
            roll_no: s.roll_no || '',
            attendance_percent: s.attendance_percent || 0,
            present_days: 0,
            total_working_days: 0,
            is_defaulter: (s.attendance_percent || 0) < 75
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      class_name: className,
      section,
      total_students: studentAttendanceRows.length,
      defaulters_count: studentAttendanceRows.filter(s => s.is_defaulter).length,
      students: studentAttendanceRows
    });
  } catch (error: any) {
    console.error('[API_TEACHER_STUDENT_ATTENDANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve student attendance percentages.' }, { status: 500 });
  }
}

// Strictly block any write attempts from subject teacher
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Access Denied: Subject teachers have ZERO attendance write access. Only assigned Class Teachers may record daily attendance.'
  }, { status: 403 });
}
