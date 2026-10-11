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
    const safeTeacher = teacher || {} as any;
    const teacherNameNorm = (safeTeacher.full_name || '').toLowerCase().trim();
    const staffCodeNorm = (safeTeacher.staff_code || '').toLowerCase().trim();
    const teacherId = safeTeacher.id || '';
    const safeAllocatedSubjects = Array.isArray(allocatedSubjects) ? allocatedSubjects : [];

    // 2. Timetable for Today
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let allTimetable: any[] = [];
    try {
      allTimetable = (await Database.getTimetable(tenant, session)) || [];
    } catch (e) {
      console.warn('[DASHBOARD_TIMETABLE_WARN]', e);
    }

    const myTodayTimetable = (allTimetable || []).filter(t => {
      if (!t) return false;
      const matchDay = (t.day || '').toLowerCase() === todayDayName.toLowerCase();
      const tName = (t.teacher_name || '').toLowerCase().trim();
      const matchTeacher = (teacherNameNorm && tName === teacherNameNorm) ||
                           (staffCodeNorm && tName === staffCodeNorm) ||
                           (teacherId && (t as any).teacher_id === teacherId);
      return matchDay && matchTeacher;
    }).sort((a, b) => (a?.period_no || 0) - (b?.period_no || 0));

    // 3. Biometric Status Today
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

    let allAttendance: any[] = [];
    try {
      allAttendance = (await AttendanceService.getAllAttendanceRecords(tenant, session)) || [];
    } catch (e) {
      console.warn('[DASHBOARD_ATTENDANCE_WARN]', e);
    }

    const facultyTodayRecord = (allAttendance || []).find(a => 
      a &&
      a.date === todayStr && 
      (/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || '') || (Array.isArray(a.teacher_records) && a.teacher_records.length > 0))
    );

    if (facultyTodayRecord && Array.isArray(facultyTodayRecord.teacher_records)) {
      const myRecord = facultyTodayRecord.teacher_records.find((tr: any) => 
        tr && (
          (teacherId && tr.teacher_id === teacherId) || 
          (staffCodeNorm && (tr.staff_code || '').toLowerCase().trim() === staffCodeNorm)
        )
      );
      if (myRecord) {
        biometricToday = {
          date: todayStr,
          status: (myRecord as any).is_regularized ? 'REGULARIZED' : ((myRecord.status || 'PRESENT') as any),
          in_time: (myRecord as any).in_time || '08:15 AM',
          out_time: (myRecord as any).out_time || undefined,
          remarks: (myRecord as any).regularization_remark
        };
      }
    }

    // 4. Pending Tasks & Counts
    // A) Overdue syllabus topics
    let overdueSyllabusCount = 0;
    try {
      const syllabusPlans = (await Database.getSyllabusPlans(tenant, session)) || [];
      const syllabusProgress = (await Database.getSyllabusProgress(tenant, teacherId)) || [];
      for (const alloc of safeAllocatedSubjects) {
        if (!alloc) continue;
        const allocSubj = (alloc.subject_name || '').toLowerCase().trim();
        const plans = (syllabusPlans || []).filter((p: any) => 
          p &&
          isSameClass(p.class_name, alloc.class_name) && 
          (!allocSubj || (p.subject_name || '').toLowerCase().trim() === allocSubj)
        );
        for (const p of plans) {
          for (const topic of (p?.topics || [])) {
            if (!topic) continue;
            const prog = (syllabusProgress || []).find((pr: any) => pr?.topic_id === topic?.id);
            const isCompleted = prog?.status === 'COMPLETED';
            if (!isCompleted && topic?.target_date && topic.target_date < todayStr) {
              overdueSyllabusCount++;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[DASHBOARD_SYLLABUS_WARN]', e);
    }

    // B) Homework active
    let activeHomeworkCount = 0;
    try {
      const myHomework = (await Database.getHomework(tenant, teacherId)) || [];
      activeHomeworkCount = (myHomework || []).filter((h: any) => h && (!h.due_date || h.due_date >= todayStr)).length;
    } catch (e) {
      console.warn('[DASHBOARD_HOMEWORK_WARN]', e);
    }

    // C) Pending requests (biometric + staff leaves)
    let myPendingBioRequestsCount = 0;
    try {
      const bioRequests = (await Database.getBiometricRequests(tenant, teacherId)) || [];
      myPendingBioRequestsCount = (bioRequests || []).filter((r: any) => r?.status === 'PENDING').length;
    } catch (e) {
      console.warn('[DASHBOARD_BIO_REQ_WARN]', e);
    }

    let myPendingLeaveRequestsCount = 0;
    try {
      const approvals = (await Database.getApprovals(tenant, session, 'STAFF_LEAVE')) || [];
      myPendingLeaveRequestsCount = (approvals || []).filter((a: any) => 
        a &&
        a.status === 'PENDING' && 
        (a.requested_by?.id === teacherId || a.details?.staff_id === teacherId || (staffCodeNorm && (a.details?.staff_code || '').toLowerCase().trim() === staffCodeNorm))
      ).length;
    } catch (e) {
      console.warn('[DASHBOARD_APPROVALS_WARN]', e);
    }

    // 5. Latest Notices
    let latestNotices: any[] = [];
    try {
      const notices = (await Database.getNotices(tenant, session)) || [];
      latestNotices = (notices || []).slice(0, 5);
    } catch (e) {
      console.warn('[DASHBOARD_NOTICES_WARN]', e);
    }

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
      try {
        const targetClass = classTeacherSection.class_name || '';
        const targetSec = (classTeacherSection.section || 'A').toUpperCase().trim();

        const classRecord = (allAttendance || []).find((a: any) => 
          a &&
          a.date === todayStr &&
          isSameClass(a.class_name, targetClass) &&
          (a.section || 'A').toUpperCase().trim() === targetSec
        );

        let allStudents: any[] = [];
        try {
          allStudents = (await Database.getStudents(tenant, session)) || [];
        } catch (e) {
          console.warn('[DASHBOARD_STUDENTS_WARN]', e);
        }

        const myStudents = (allStudents || []).filter((s: any) => 
          s &&
          isSameClass(s.class_name, targetClass) &&
          (s.section || 'A').toUpperCase().trim() === targetSec
        );

        const isMarked = !!classRecord;
        const presentCount = classRecord ? Number(classRecord.present_count) || 0 : 0;
        const absentCount = classRecord ? Number(classRecord.absent_count) || 0 : 0;
        const totalStudents = myStudents.length || (classRecord ? Number(classRecord.total_students) || 0 : 0);
        const attPercent = isMarked && totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

        const absentStudents: any[] = [];
        if (classRecord && Array.isArray(classRecord.student_records)) {
          for (const sr of classRecord.student_records) {
            if (sr && (sr.status === 'ABSENT' || sr.status === 'LEAVE')) {
              const studentDoc = myStudents.find((s: any) => s && s.id === sr.student_id);
              absentStudents.push({
                student_id: sr.student_id || '',
                student_name: sr.full_name || (studentDoc as any)?.name || 'Student',
                admission_no: sr.admission_no || studentDoc?.admission_no || '',
                roll_no: sr.roll_no || (studentDoc as any)?.roll_no || '',
                parent_phone: studentDoc?.guardian_phone || studentDoc?.parent_phone || studentDoc?.phone || ''
              });
            }
          }
        }

        let pendingLeavesCount = 0;
        try {
          const pendingLeaves = await Database.getStudentLeaves(
            tenant,
            targetClass,
            targetSec,
            'PENDING'
          );
          pendingLeavesCount = Array.isArray(pendingLeaves) ? pendingLeaves.length : 0;
        } catch (e) {
          console.warn('[DASHBOARD_LEAVES_WARN]', e);
        }

        classTeacherStats = {
          class_name: targetClass,
          section: targetSec,
          total_students: totalStudents,
          present_count: presentCount,
          absent_count: absentCount,
          attendance_percent: attPercent,
          is_marked_today: isMarked,
          absent_students: absentStudents,
          pending_leaves_count: pendingLeavesCount
        };
      } catch (e) {
        console.warn('[DASHBOARD_CLASS_STATS_WARN]', e);
      }
    }

    return NextResponse.json({
      success: true,
      school_id: tenant,
      teacher: {
        id: safeTeacher.id || teacherId,
        staff_code: safeTeacher.staff_code || staffCodeNorm || 'EMP-FACULTY',
        full_name: safeTeacher.full_name || 'Faculty Member',
        email: safeTeacher.email || '',
        phone: safeTeacher.phone || '',
        designation: safeTeacher.designation || 'Teacher',
        department: safeTeacher.department || 'Academic Department',
        avatar: safeTeacher.avatar || safeTeacher.photo || ''
      },
      is_class_teacher: isClassTeacher,
      class_teacher_section: classTeacherSection,
      allocated_subjects: safeAllocatedSubjects,
      biometric_today: biometricToday,
      today_timetable: myTodayTimetable,
      pending_tasks: {
        overdue_syllabus_count: overdueSyllabusCount,
        active_homework_count: activeHomeworkCount,
        pending_biometric_requests_count: myPendingBioRequestsCount,
        pending_leave_requests_count: myPendingLeaveRequestsCount
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
