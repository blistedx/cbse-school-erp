/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass, getTodayDateStr } from '@/lib/utils';
import { AttendanceService } from '@/lib/services/attendance.service';
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
    const date = searchParams.get('date') || getTodayDateStr();

    // 1. Strict Security: Verify Class Teacher Assignment
    let assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      const teachers = await Database.getTeachers(tenant);
      const matched = teachers.find(t => 
        (t.staff_code && t.staff_code.toUpperCase() === (auth.username || '').toUpperCase()) ||
        (t.id && t.id.toUpperCase() === (auth.username || '').toUpperCase()) ||
        (t.full_name && t.full_name.toLowerCase() === (auth.name || '').toLowerCase())
      );
      if (matched) {
        assignments = await Database.getTeacherAssignments(tenant, matched.id);
      }
    }

    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You are not assigned as a Class Teacher of any class-section.'
      }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;

    // 2. Fetch class students
    const allStudents = await Database.getStudents(tenant, session);
    const myStudents = allStudents.filter(s => 
      isSameClass(s.class_name, class_name) &&
      (s.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      s.status === 'ACTIVE'
    ).sort((a: any, b: any) => (a.full_name || a.name || '').localeCompare(b.full_name || b.name || ''));

    // 3. Fetch existing attendance record for this date
    const allAttendance = await AttendanceService.getAllAttendanceRecords(tenant, session);
    const dateRecord = allAttendance.find(a => 
      a.date === date &&
      isSameClass(a.class_name, class_name) &&
      (a.section || 'A').toUpperCase().trim() === section.toUpperCase().trim()
    );

    // Check if locked by Admin
    const isLockedByAdmin = dateRecord && dateRecord.marked_by && (
      dateRecord.marked_by.toLowerCase().includes('admin') ||
      dateRecord.marked_by.toLowerCase().includes('principal')
    );

    // Map student records for the selected date (Strictly PRESENT, ABSENT, HOLIDAY - No LEAVE)
    const studentRows = myStudents.map(s => {
      const recorded = dateRecord?.student_records?.find(sr => sr.student_id === s.id);
      let status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' = 'PRESENT';
      if (recorded && recorded.status) {
        const rawStatus = String(recorded.status).toUpperCase();
        if (rawStatus === 'HOLIDAY') status = 'HOLIDAY';
        else if (rawStatus === 'ABSENT' || rawStatus === 'LEAVE') status = 'ABSENT';
        else status = 'PRESENT';
      }
      return {
        student_id: s.id,
        admission_no: s.admission_no,
        full_name: s.full_name,
        roll_no: s.roll_no || '',
        parent_phone: s.guardian_phone || (s as any).parent_phone || (s as any).phone || '',
        status,
        is_recorded: !!recorded
      };
    });

    // 4. Calculate monthly summary & defaulters (<75%)
    const monthPrefix = date.substring(0, 7); // e.g., '2026-08'
    const monthRecords = allAttendance.filter(a => 
      a.date.startsWith(monthPrefix) &&
      isSameClass(a.class_name, class_name) &&
      (a.section || 'A').toUpperCase().trim() === section.toUpperCase().trim()
    );

    const defaulters: any[] = [];
    const monthlyStudentSummaries = await Promise.all(
      myStudents.map(async s => {
        try {
          const sum = await AttendanceService.getStudentAttendance(tenant, s.id, session);
          const attPct = sum?.attendancePercent || s.attendance_percent || 0;
          if (attPct < 75) {
            defaulters.push({
              student_id: s.id,
              admission_no: s.admission_no,
              full_name: s.full_name,
              roll_no: s.roll_no,
              parent_phone: s.guardian_phone || (s as any).parent_phone || '',
              attendance_percent: attPct,
              absent_days: sum?.absentDays || 0,
              total_days: sum?.totalWorkingDays || 0
            });
          }
          return {
            student_id: s.id,
            admission_no: s.admission_no,
            full_name: s.full_name,
            attendance_percent: attPct
          };
        } catch {
          return { student_id: s.id, admission_no: s.admission_no, full_name: s.full_name, attendance_percent: 0 };
        }
      })
    );

    return NextResponse.json({
      success: true,
      class_name,
      section,
      date,
      is_marked: !!dateRecord,
      is_locked_by_admin: isLockedByAdmin,
      marked_by: dateRecord?.marked_by,
      summary: {
        total_students: myStudents.length,
        present_count: dateRecord ? dateRecord.present_count : myStudents.length,
        absent_count: dateRecord ? dateRecord.absent_count : 0,
        holiday_count: dateRecord ? (dateRecord.holiday_count || 0) : 0,
        defaulters_count: defaulters.length
      },
      students: studentRows,
      defaulters,
      month_total_working_days: monthRecords.length
    });
  } catch (error: any) {
    console.error('[API_CLASS_ATTENDANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve class attendance.' }, { status: 500 });
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
    const { date, class_name, section, records } = body;

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: 'Date and student attendance records are required.' }, { status: 400 });
    }

    // 1. Strict Security: Server verifies logged in teacher is assigned Class Teacher of this class-section
    let assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      const teachers = await Database.getTeachers(tenant);
      const matched = teachers.find(t => 
        (t.staff_code && t.staff_code.toUpperCase() === (auth.username || '').toUpperCase()) ||
        (t.id && t.id.toUpperCase() === (auth.username || '').toUpperCase()) ||
        (t.full_name && t.full_name.toLowerCase() === (auth.name || '').toLowerCase())
      );
      if (matched) {
        assignments = await Database.getTeacherAssignments(tenant, matched.id);
      }
    }

    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You are not assigned as a Class Teacher. Only Class Teachers can record student attendance.'
      }, { status: 403 });
    }

    const assignedSection = assignments.classTeacherSection;
    const isTargetMatch = isSameClass(assignedSection.class_name, class_name) &&
      (assignedSection.section || 'A').toUpperCase().trim() === (section || 'A').toUpperCase().trim();

    if (!isTargetMatch && userRole === 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: `Security Violation: You are the Class Teacher for ${assignedSection.class_name}-${assignedSection.section}. You cannot mark attendance for ${class_name}-${section}.`
      }, { status: 403 });
    }

    // 2. Check if admin has locked or already marked this date
    const allAttendance = await AttendanceService.getAllAttendanceRecords(tenant, session);
    const existingDateRecord = allAttendance.find(a => 
      a.date === date &&
      isSameClass(a.class_name, assignedSection.class_name) &&
      (a.section || 'A').toUpperCase().trim() === assignedSection.section.toUpperCase().trim()
    );

    if (existingDateRecord && existingDateRecord.marked_by && (
      existingDateRecord.marked_by.toLowerCase().includes('admin locked') ||
      existingDateRecord.marked_by.toLowerCase().includes('principal locked')
    )) {
      return NextResponse.json({
        success: false,
        error: 'Cannot override attendance: This date has been locked by School Administration.'
      }, { status: 403 });
    }

    // 3. Call existing unified AttendanceService.markAttendance
    const attendancePayload = {
      school_id: tenant,
      academic_session: session,
      date,
      class_name: assignedSection.class_name,
      section: assignedSection.section,
      marked_by: `Class Teacher (${assignments.teacher.full_name})`,
      records: records.map((r: any) => {
        let status = 'PRESENT';
        const raw = String(r.status || 'PRESENT').toUpperCase();
        if (raw === 'HOLIDAY') status = 'HOLIDAY';
        else if (raw === 'ABSENT' || raw === 'LEAVE') status = 'ABSENT';
        else status = 'PRESENT';
        return {
          student_id: r.student_id,
          admission_no: r.admission_no,
          full_name: r.full_name || r.student_name,
          roll_no: r.roll_no,
          status
        };
      })
    };

    const savedRecord = await AttendanceService.markAttendance(tenant, session, attendancePayload);

    // 4. Audit Log
    logAuditEvent({
      actor: { id: assignments.teacher.id, name: assignments.teacher.full_name, role: 'TEACHER' },
      module: 'ATTENDANCE',
      action: 'CLASS_ATTENDANCE_MARKED',
      severity: 'INFO',
      summary: `Class attendance marked for ${assignedSection.class_name}-${assignedSection.section} on ${date} (${savedRecord.present_count} Present, ${savedRecord.absent_count} Absent)`,
      targetId: `${assignedSection.class_name}-${assignedSection.section}`,
      school_id: tenant,
      session,
      details: {
        date,
        class_name: assignedSection.class_name,
        section: assignedSection.section,
        presentCount: savedRecord.present_count,
        absentCount: savedRecord.absent_count,
        recordsCount: records.length
      }
    });

    return NextResponse.json({
      success: true,
      message: `Daily attendance for ${assignedSection.class_name}-${assignedSection.section} recorded successfully.`,
      record: savedRecord
    });
  } catch (error: any) {
    console.error('[API_CLASS_ATTENDANCE_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record class attendance.' }, { status: 500 });
  }
}
