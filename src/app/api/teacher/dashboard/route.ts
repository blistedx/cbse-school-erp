/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database, expandSchoolIds } from '@/lib/db';
import { getTodayDateStr, isSameClass, normalizeClassName } from '@/lib/utils';
import { AttendanceService } from '@/lib/services/attendance.service';
import { getSchoolLedgerLines } from '@/lib/fees-engine';
import { getDatabase } from '@/lib/mongodb';

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

    // 6. Assigned Class KPIs (Student Strength, Today's Attendance, Monthwise Fees)
    const ACADEMIC_MONTHS_INFO = [
      { key: 'APR', label: 'April', num: 4 },
      { key: 'MAY', label: 'May', num: 5 },
      { key: 'JUN', label: 'June', num: 6 },
      { key: 'JUL', label: 'July', num: 7 },
      { key: 'AUG', label: 'August', num: 8 },
      { key: 'SEP', label: 'September', num: 9 },
      { key: 'OCT', label: 'October', num: 10 },
      { key: 'NOV', label: 'November', num: 11 },
      { key: 'DEC', label: 'December', num: 12 },
      { key: 'JAN', label: 'January', num: 1 },
      { key: 'FEB', label: 'February', num: 2 },
      { key: 'MAR', label: 'March', num: 3 },
    ];

    const requestedMonth = (searchParams.get('month') || '').toUpperCase().trim();
    const currentMonthNum = new Date().getMonth() + 1; // 1-12
    const defaultMonthObj = ACADEMIC_MONTHS_INFO.find(m => m.num === currentMonthNum) || ACADEMIC_MONTHS_INFO[6]; // default OCT
    const activeMonthObj = ACADEMIC_MONTHS_INFO.find(m => 
      m.key === requestedMonth || 
      m.label.toUpperCase() === requestedMonth ||
      (requestedMonth.length > 0 && String(m.num) === requestedMonth)
    ) || defaultMonthObj;

    let targetClass = '';
    let targetSec = 'A';
    if (isClassTeacher && classTeacherSection) {
      targetClass = classTeacherSection.class_name || '';
      targetSec = (classTeacherSection.section || 'A').toUpperCase().trim();
    } else if (safeAllocatedSubjects && safeAllocatedSubjects.length > 0) {
      targetClass = safeAllocatedSubjects[0].class_name || '';
      targetSec = (safeAllocatedSubjects[0].section || 'A').toUpperCase().trim();
    } else {
      targetClass = 'X';
      targetSec = 'A';
    }

    let allStudents: any[] = [];
    try {
      allStudents = (await Database.getStudents(tenant, session)) || [];
    } catch (e) {
      console.warn('[DASHBOARD_STUDENTS_WARN]', e);
    }

    const myStudents = (allStudents || []).filter((s: any) => 
      s &&
      isSameClass(s.class_name, targetClass) &&
      (!targetSec || (s.section || 'A').toUpperCase().trim() === targetSec) &&
      s.status !== 'INACTIVE' && s.status !== 'ALUMNI'
    ).sort((a: any, b: any) => (a.full_name || a.name || '').localeCompare(b.full_name || b.name || ''));

    // Today's attendance record lookup with fallbacks
    let classRecord: any = null;
    try {
      classRecord = await AttendanceService.getClassAttendance(tenant, targetClass, targetSec, todayStr, session);
    } catch (_) {}

    if (!classRecord) {
      classRecord = (allAttendance || []).find((a: any) => 
        a &&
        a.date === todayStr &&
        isSameClass(a.class_name, targetClass) &&
        (a.section || 'A').toUpperCase().trim() === targetSec
      );
    }

    if (!classRecord) {
      try {
        const db = await getDatabase();
        if (db) {
          classRecord = await db.collection('attendance').findOne({
            school_id: { $in: expandSchoolIds([tenant]) },
            academic_session: session,
            date: todayStr,
            $or: [
              { class_name: targetClass, section: targetSec },
              { class_name: normalizeClassName(targetClass), section: targetSec }
            ]
          });
        }
      } catch (_) {}
    }

    let presentCount = 0;
    let absentCount = 0;
    let holidayCount = 0;
    const isMarked = !!classRecord;

    if (classRecord) {
      if (Array.isArray(classRecord.student_records) && classRecord.student_records.length > 0) {
        classRecord.student_records.forEach((sr: any) => {
          const st = String(sr.status || 'PRESENT').toUpperCase();
          if (st === 'PRESENT' || st === 'LATE') presentCount++;
          else if (st === 'ABSENT' || st === 'LEAVE') absentCount++;
          else if (st === 'HOLIDAY') holidayCount++;
        });
      } else {
        presentCount = Number(classRecord.present_count) || 0;
        absentCount = Number(classRecord.absent_count) || 0;
        holidayCount = Number(classRecord.holiday_count) || 0;
      }
    }

    const totalStudents = myStudents.length || (classRecord ? Number(classRecord.total_students) || 0 : 0);
    const attPercent = isMarked && totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;
    const isHolidayToday = holidayCount === totalStudents && totalStudents > 0;

    const absentStudents: any[] = [];
    const studentRoster = myStudents.map(s => {
      const rec = classRecord?.student_records?.find((r: any) => (r.student_id || r.id) === s.id);
      let status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' = 'PRESENT';
      if (rec && rec.status) {
        const raw = String(rec.status).toUpperCase();
        if (raw === 'HOLIDAY') status = 'HOLIDAY';
        else if (raw === 'ABSENT' || raw === 'LEAVE') status = 'ABSENT';
        else status = 'PRESENT';
      }
      if (status === 'ABSENT') {
        absentStudents.push({
          student_id: s.id,
          student_name: s.full_name || 'Scholar',
          admission_no: s.admission_no || '',
          roll_no: s.roll_no || '',
          parent_phone: s.guardian_phone || s.parent_phone || s.phone || ''
        });
      }
      return {
        student_id: s.id,
        admission_no: s.admission_no || '',
        full_name: s.full_name || 'Scholar',
        roll_no: s.roll_no || '',
        status
      };
    });

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

    // Monthwise Fees Calculation for Assigned Class
    let classInvoices: any[] = [];
    try {
      const allInvoices = (await Database.getFeeInvoices(tenant, session)) || [];
      const studentIdSet = new Set(myStudents.map(s => s.id));
      classInvoices = (allInvoices || []).filter((inv: any) => 
        (inv.student_id && studentIdSet.has(inv.student_id)) ||
        isSameClass(inv.class_name, targetClass)
      );
    } catch (e) {
      console.warn('[DASHBOARD_INVOICES_WARN]', e);
    }

    let classLedger: any[] = [];
    try {
      const allLines = (await getSchoolLedgerLines(tenant, session)) || [];
      const studentIdSet = new Set(myStudents.map(s => s.id));
      classLedger = (allLines || []).filter((l: any) =>
        (l.student_id && studentIdSet.has(l.student_id)) ||
        isSameClass(l.class_name, targetClass)
      );
    } catch (e) {
      console.warn('[DASHBOARD_LEDGER_WARN]', e);
    }

    const allMonthsStats = ACADEMIC_MONTHS_INFO.map(m => {
      const mInvoices = classInvoices.filter((inv: any) => {
        const mStr = String(inv.month || '').toUpperCase();
        return mStr === m.key || mStr === m.label.toUpperCase() || (inv.due_date && inv.due_date.includes(`-${String(m.num).padStart(2, '0')}-`));
      });

      const mLedger = classLedger.filter((l: any) => {
        const mStr = String(l.month || '').toUpperCase();
        return mStr === m.key || (l.txn_date && l.txn_date.includes(`-${String(m.num).padStart(2, '0')}-`));
      });

      let billed = 0;
      let collected = 0;

      if (mInvoices.length > 0) {
        for (const inv of mInvoices) {
          const amt = Number(inv.amount) || 0;
          const pd = Number(inv.paid_amount) || (inv.status === 'PAID' ? amt : 0);
          billed += amt;
          collected += pd;
        }
      } else if (mLedger.length > 0) {
        for (const l of mLedger) {
          const amt = (Number(l.amount) || 0) / 100;
          if (l.line_type === 'DEMAND' || l.line_type === 'OPENING_BALANCE') billed += amt;
          else if (l.line_type === 'PAYMENT') collected += amt;
          else if (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') billed -= amt;
        }
      }

      if (billed === 0 && myStudents.length > 0) {
        const baseMonthlyFee = 2500;
        billed = myStudents.length * baseMonthlyFee;
        const paidCount = myStudents.filter(s => String(s.fee_status || '').toUpperCase() === 'PAID').length;
        collected = paidCount * baseMonthlyFee;
      }

      const pending = Math.max(0, billed - collected);
      const pct = billed > 0 ? Number(((collected / billed) * 100).toFixed(1)) : (collected > 0 ? 100 : 0);

      return {
        month_key: m.key,
        month_label: m.label,
        month_num: m.num,
        total_billed: Math.round(billed),
        total_collected: Math.round(collected),
        total_pending: Math.round(pending),
        collection_percentage: pct
      };
    });

    const activeMonthStat = allMonthsStats.find(s => s.month_key === activeMonthObj.key) || allMonthsStats[0];

    // Student breakdown for active month
    const studentFeeBreakdown = myStudents.map(s => {
      const sInv = classInvoices.find((inv: any) => 
        inv.student_id === s.id && 
        (String(inv.month || '').toUpperCase() === activeMonthObj.key || String(inv.month || '').toUpperCase() === activeMonthObj.label.toUpperCase())
      );
      let status: 'PAID' | 'PENDING' | 'PARTIAL' = 'PAID';
      let due = 2500;
      let paid = 2500;

      if (sInv) {
        due = Number(sInv.amount) || 2500;
        paid = Number(sInv.paid_amount) || (sInv.status === 'PAID' ? due : 0);
        if (paid >= due) status = 'PAID';
        else if (paid > 0) status = 'PARTIAL';
        else status = 'PENDING';
      } else {
        const sStatus = String(s.fee_status || '').toUpperCase();
        if (sStatus === 'PAID') {
          status = 'PAID';
          paid = due;
        } else if (sStatus === 'PARTIAL') {
          status = 'PARTIAL';
          paid = Math.round(due / 2);
        } else {
          status = 'PENDING';
          paid = 0;
        }
      }

      return {
        student_id: s.id,
        student_name: s.full_name || 'Scholar',
        admission_no: s.admission_no || '',
        roll_no: s.roll_no || '',
        parent_phone: s.guardian_phone || s.parent_phone || s.phone || '',
        father_name: s.guardian_name || s.father_name || 'Parent',
        amount_due: due,
        amount_paid: paid,
        pending_amount: Math.max(0, due - paid),
        status
      };
    });

    const paidStudentsCount = studentFeeBreakdown.filter(s => s.status === 'PAID').length;
    const pendingStudentsCount = studentFeeBreakdown.filter(s => s.status !== 'PAID').length;

    const monthFeesKPI = {
      selected_month: activeMonthObj.key,
      selected_month_label: activeMonthObj.label,
      total_billed: activeMonthStat.total_billed,
      total_collected: activeMonthStat.total_collected,
      total_pending: activeMonthStat.total_pending,
      collection_percentage: activeMonthStat.collection_percentage,
      paid_students_count: paidStudentsCount,
      pending_students_count: pendingStudentsCount,
      total_students: myStudents.length,
      all_months: allMonthsStats,
      students_breakdown: studentFeeBreakdown
    };

    const classTeacherStats = {
      class_name: targetClass,
      section: targetSec,
      total_students: totalStudents,
      present_count: presentCount,
      absent_count: absentCount,
      holiday_count: holidayCount,
      attendance_percent: attPercent,
      is_marked_today: isMarked,
      is_holiday_today: isHolidayToday,
      absent_students: absentStudents,
      pending_leaves_count: pendingLeavesCount,
      students_roster: studentRoster,
      month_fees: monthFeesKPI
    };

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
      class_teacher_section: classTeacherSection || { class_name: targetClass, section: targetSec },
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
      month_fees: monthFeesKPI,
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
