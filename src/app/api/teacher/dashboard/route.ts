/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { getTodayDateStr, isSameClass } from '@/lib/utils';
import { AttendanceService } from '@/lib/services/attendance.service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access restricted to authorized faculty members.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const todayStr = getTodayDateStr();

    // 1. Resolve teacher assignments
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

    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher profile not found.' }, { status: 404 });
    }

    const { teacher, isClassTeacher, classTeacherSection, allocatedSubjects } = assignments;

    // 2. Timetable for Today
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const allTimetable = await Database.getTimetable(tenant, session);
    const myTodayTimetable = allTimetable.filter(t => {
      const matchDay = (t.day || '').toLowerCase() === todayDayName.toLowerCase();
      const matchTeacher = (t.teacher_name || '').toLowerCase().trim() === teacher.full_name.toLowerCase().trim() ||
                           (t.teacher_name || '').toLowerCase().trim() === (teacher.staff_code || '').toLowerCase().trim() ||
                           (t as any).teacher_id === teacher.id;
      return matchDay && matchTeacher;
    }).sort((a, b) => (a.period_no || 0) - (b.period_no || 0));

    // 3. Biometric Status Today
    const allAttendance = await AttendanceService.getAllAttendanceRecords(tenant, session);
    const facultyTodayRecord = allAttendance.find(a => 
      a.date === todayStr && 
      (/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || '') || (Array.isArray(a.teacher_records) && a.teacher_records.length > 0))
    );

    let biometricToday: {
      date: string;
      status: 'PRESENT' | 'ABSENT' | 'NOT_MARKED' | 'REGULARIZED';
      in_time?: string;
      out_time?: string;
      remarks?: string;
    } = {
      date: todayStr,
      status: 'NOT_MARKED'
    };

    if (facultyTodayRecord && Array.isArray(facultyTodayRecord.teacher_records)) {
      const myRecord = facultyTodayRecord.teacher_records.find(tr => 
        tr.teacher_id === teacher.id || 
        (teacher.staff_code && tr.staff_code === teacher.staff_code)
      );
      if (myRecord) {
        biometricToday = {
          date: todayStr,
          status: (myRecord as any).is_regularized ? 'REGULARIZED' : myRecord.status as any,
          in_time: (myRecord as any).in_time || '08:15 AM',
          out_time: (myRecord as any).out_time || undefined,
          remarks: (myRecord as any).regularization_remark
        };
      }
    }

    // 4. Pending Tasks & Counts
    // A) Overdue syllabus topics
    const syllabusPlans = await Database.getSyllabusPlans(tenant, session);
    const syllabusProgress = await Database.getSyllabusProgress(tenant, teacher.id);
    let overdueSyllabusCount = 0;
    for (const alloc of allocatedSubjects) {
      const plans = syllabusPlans.filter(p => 
        isSameClass(p.class_name, alloc.class_name) && 
        p.subject_name.toLowerCase().trim() === alloc.subject_name.toLowerCase().trim()
      );
      for (const p of plans) {
        for (const topic of p.topics || []) {
          const prog = syllabusProgress.find(pr => pr.topic_id === topic.id);
          const isCompleted = prog?.status === 'COMPLETED';
          if (!isCompleted && topic.target_date && topic.target_date < todayStr) {
            overdueSyllabusCount++;
          }
        }
      }
    }

    // B) Homework active
    const myHomework = await Database.getHomework(tenant, teacher.id);
    const activeHomeworkCount = myHomework.filter(h => !h.due_date || h.due_date >= todayStr).length;

    // C) Pending requests (biometric + staff leaves)
    const bioRequests = await Database.getBiometricRequests(tenant, teacher.id);
    const myPendingBioRequests = bioRequests.filter(r => r.status === 'PENDING');

    const approvals = await Database.getApprovals(tenant, session, 'STAFF_LEAVE');
    const myPendingLeaveRequests = approvals.filter(a => 
      a.status === 'PENDING' && 
      (a.requested_by?.id === teacher.id || a.details?.staff_id === teacher.id || a.details?.staff_code === teacher.staff_code)
    );

    // 5. Latest Notices
    const notices = await Database.getNotices(tenant, session);
    const latestNotices = notices.slice(0, 5);

    // 6. If Class Teacher: Today's class stats & student leaves
    let classTeacherStats: {
      class_name: string;
      section: string;
      total_students: number;
      present_count: number;
      absent_count: number;
      attendance_percent: number;
      is_marked_today: boolean;
      absent_students: Array<{
        student_id: string;
        student_name: string;
        admission_no: string;
        roll_no?: string;
        parent_phone?: string;
      }>;
      pending_leaves_count: number;
    } | null = null;

    if (isClassTeacher && classTeacherSection) {
      const classRecord = allAttendance.find(a => 
        a.date === todayStr &&
        isSameClass(a.class_name, classTeacherSection.class_name) &&
        (a.section || 'A').toUpperCase().trim() === classTeacherSection.section.toUpperCase().trim()
      );

      const allStudents = await Database.getStudents(tenant, session);
      const myStudents = allStudents.filter(s => 
        isSameClass(s.class_name, classTeacherSection.class_name) &&
        (s.section || 'A').toUpperCase().trim() === classTeacherSection.section.toUpperCase().trim()
      );

      const isMarked = !!classRecord;
      const presentCount = classRecord ? Number(classRecord.present_count) || 0 : 0;
      const absentCount = classRecord ? Number(classRecord.absent_count) || 0 : 0;
      const totalStudents = myStudents.length || (classRecord ? Number(classRecord.total_students) || 0 : 0);
      const attPercent = isMarked && totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

      const absentStudents: any[] = [];
      if (classRecord && Array.isArray(classRecord.student_records)) {
        for (const sr of classRecord.student_records) {
          if (sr.status === 'ABSENT' || sr.status === 'LEAVE') {
            const studentDoc = myStudents.find(s => s.id === sr.student_id);
            absentStudents.push({
              student_id: sr.student_id,
              student_name: sr.full_name,
              admission_no: sr.admission_no || studentDoc?.admission_no || '',
              roll_no: sr.roll_no || (studentDoc as any)?.roll_no || '',
              parent_phone: studentDoc?.guardian_phone || studentDoc?.parent_phone || studentDoc?.phone || ''
            });
          }
        }
      }

      const pendingLeaves = await Database.getStudentLeaves(
        tenant,
        classTeacherSection.class_name,
        classTeacherSection.section,
        'PENDING'
      );

      classTeacherStats = {
        class_name: classTeacherSection.class_name,
        section: classTeacherSection.section,
        total_students: totalStudents,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_percent: attPercent,
        is_marked_today: isMarked,
        absent_students: absentStudents,
        pending_leaves_count: pendingLeaves.length
      };
    }

    return NextResponse.json({
      success: true,
      school_id: tenant,
      teacher: {
        id: teacher.id,
        staff_code: teacher.staff_code,
        full_name: teacher.full_name,
        email: teacher.email,
        phone: teacher.phone,
        designation: teacher.designation,
        department: teacher.department,
        avatar: teacher.avatar || teacher.photo || ''
      },
      is_class_teacher: isClassTeacher,
      class_teacher_section: classTeacherSection,
      allocated_subjects: allocatedSubjects,
      biometric_today: biometricToday,
      today_timetable: myTodayTimetable,
      pending_tasks: {
        overdue_syllabus_count: overdueSyllabusCount,
        active_homework_count: activeHomeworkCount,
        pending_biometric_requests_count: myPendingBioRequests.length,
        pending_leave_requests_count: myPendingLeaveRequests.length
      },
      class_teacher_stats: classTeacherStats,
      latest_notices: latestNotices
    });
  } catch (error: any) {
    console.error('[API_TEACHER_DASHBOARD_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assemble teacher dashboard metrics.' },
      { status: 500 }
    );
  }
}
