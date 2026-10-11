import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { AttendanceService } from '@/lib/services/attendance.service';
import { AggregatesService } from '@/lib/services/aggregates.service';
import { getSchoolReceipts } from '@/lib/fees-engine/collection';
import { getTodayDateStr, isSameClass } from '@/lib/utils';
import { PrincipalOverviewData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Strict Principal Guard: only PRINCIPAL or Superadmin
    const userRole = (auth.role || '').toUpperCase();
    const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: The Principal Panel is strictly reserved for the School Principal.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const today = getTodayDateStr();

    // 1. Fetch aggregates, attendance, school, approvals, notices, classes, students, teachers & receipts in parallel
    const [aggregate, attSummary, school, approvals, notices, classes, students, teachers, receipts, allAttendance] = await Promise.all([
      AggregatesService.getSchoolAggregate(tenant, session),
      AttendanceService.getSchoolSummary(tenant, session, today),
      Database.getSchoolById(tenant),
      Database.getApprovals(tenant, session),
      Database.getNotices(tenant, session),
      Database.getClasses(tenant, session),
      Database.getStudents(tenant, session),
      Database.getTeachers(tenant, session),
      getSchoolReceipts(tenant, session, 500),
      Database.getAttendance(tenant, session)
    ]);

    // 2. Compute 7-day attendance trend
    const sevenDayTrend: Array<{ date: string; day: string; studentPercent: number; staffPercent: number }> = [];
    const dateObj = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      if (dStr === today) {
        sevenDayTrend.push({
          date: dStr,
          day: dayName,
          studentPercent: attSummary.studentPercent,
          staffPercent: attSummary.facultyPercent
        });
      } else {
        const histAtt = await AttendanceService.getSchoolSummary(tenant, session, dStr);
        sevenDayTrend.push({
          date: dStr,
          day: dayName,
          studentPercent: histAtt.studentPercent,
          staffPercent: histAtt.facultyPercent
        });
      }
    }

    // 3. Compute Month-wise fee collection & this month collected
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentMonthIdx = dateObj.getMonth();
    const currentMonthAbbr = monthNames[currentMonthIdx];

    const rawTrend = aggregate.financials?.monthWiseTrend || [];
    const monthWiseTrend = rawTrend.map(m => ({
      month: m.month,
      collected: Math.round((m.collected || 0) / 100),
      billed: Math.round((m.billed || 0) / 100),
      pending: Math.round((m.pending || 0) / 100)
    }));

    // Find this month collected
    const thisMonthData = rawTrend.find(m => m.month.toUpperCase().includes(currentMonthAbbr));
    const thisMonthCollected = thisMonthData
      ? Math.round((thisMonthData.collected || 0) / 100)
      : (monthWiseTrend.length > 0 ? monthWiseTrend[monthWiseTrend.length - 1].collected : 0);

    const pendingFees = Math.round((aggregate.financials?.totalPendingPaise || 0) / 100);
    const totalBilled = Math.round((aggregate.financials?.totalBilledPaise || 0) / 100);
    const totalCollected = Math.round((aggregate.financials?.totalCollectedPaise || 0) / 100);

    // 4. Pending approvals breakdown & photo enrichment
    const pendingList = approvals.filter(a => a.status === 'PENDING').map(req => {
      let studentPhoto = (req.details as any)?.student_photo;
      if (!studentPhoto && req.details?.student_name) {
        const matched = (students || []).find(s => 
          (req.details?.admission_no && s.admission_no === req.details.admission_no) ||
          s.full_name?.toLowerCase() === req.details.student_name?.toLowerCase()
        );
        if (matched) studentPhoto = matched.photo || matched.avatar;
      }
      let teacherPhoto = (req.details as any)?.staff_photo;
      if (!teacherPhoto && (req.details?.staff_name || req.details?.teacher_name)) {
        const nameToMatch = req.details?.staff_name || req.details?.teacher_name;
        const matched = (teachers || []).find(t => 
          (req.details?.staff_code && t.staff_code === req.details.staff_code) ||
          t.full_name?.toLowerCase() === nameToMatch?.toLowerCase()
        );
        if (matched) teacherPhoto = matched.photo || matched.avatar;
      }
      return {
        ...req,
        details: {
          ...req.details,
          student_photo: studentPhoto,
          staff_photo: teacherPhoto,
          photo: studentPhoto || teacherPhoto
        }
      };
    });
    const tcCount = pendingList.filter(a => a.type === 'CERTIFICATE_TC').length;
    const feeConcCount = pendingList.filter(a => a.type === 'FEE_CONCESSION').length;
    const leaveCount = pendingList.filter(a => a.type === 'STAFF_LEAVE').length;
    const bioCount = pendingList.filter(a => a.type === 'BIOMETRIC_REGULARIZATION').length;
    const admCount = pendingList.filter(a => a.type === 'ADMISSION').length;

    // 5. Class-wise roll call status today
    const todayRecords = (allAttendance || []).filter(a => a.date === today);
    const classRollCalls = (classes || []).map(c => {
      const match = todayRecords.find(a => isSameClass(a.class_name, c.name || c.class_name) && (!c.section || a.section === c.section));
      const classTeacher = (teachers || []).find(t => t.id === c.teacher_id || t.full_name === c.teacher_name);
      const totalStudentsInClass = (students || []).filter(s => isSameClass(s.class_name, c.name || c.class_name) && (!c.section || s.section === c.section)).length || 30;
      const presentCount = match ? (match.present_count || (match.student_records?.filter(s => s.status === 'PRESENT' || s.status === 'LATE').length) || 0) : 0;
      return {
        class_id: c.id,
        class_name: c.name || c.class_name,
        section: c.section || 'A',
        class_teacher_name: classTeacher?.full_name || c.teacher_name || 'Class Teacher',
        is_marked: !!match,
        present_count: presentCount,
        total_count: match?.total_count || totalStudentsInClass,
        marked_time: match?.created_at ? new Date(match.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined
      };
    });

    const activeStudents = (students || []).filter(s => s.status !== 'INACTIVE' && s.status !== 'ALUMNI');
    const enquiriesCount = (students || []).filter(s => s.status === 'INACTIVE' || /enquiry|provisional/i.test(s.admission_no || '')).length;

    // 6. Live Faculty & Staff Turnout, Punctuality & Leave Ledger
    const facultyTurnout = await AttendanceService.getFacultyAttendanceLedger(tenant, session, today);
    const facultySubLabel = facultyTurnout.present_count > 0
      ? `${facultyTurnout.on_time_count} On Time • ${facultyTurnout.late_count} Late • ${facultyTurnout.on_leave_count} On Leave`
      : (attSummary.isFacultyMarked ? `${attSummary.facultyPresent}/${attSummary.facultyTotal} on duty` : 'Staff turnout pending');

    // Sanitized students and teachers
    const sanitizedStudents = (students || []).map((s: any) => {
      const { passcode, password, password_hash, salt, ...safe } = s;
      return safe;
    });
    const sanitizedTeachers = (teachers || []).map((t: any) => {
      const { passcode, password, password_hash, salt, salary, ...safe } = t;
      return safe;
    });

    const overviewData: PrincipalOverviewData = {
      school_id: tenant,
      school_name: school?.school_name || school?.name || 'Delhi Public School',
      academic_session: session,
      kpis: {
        student_attendance_percent: attSummary.studentPercent,
        staff_attendance_percent: facultyTurnout.total_faculty > 0 
          ? Math.round((facultyTurnout.present_count / facultyTurnout.total_faculty) * 100)
          : attSummary.facultyPercent,
        total_students: activeStudents.length || aggregate.total_students || 513,
        total_staff: (teachers || []).length || aggregate.total_teachers || 33,
        fees_collected_this_month: thisMonthCollected,
        fees_pending: pendingFees,
        pending_approvals_count: pendingList.length,
        classes_count: (classes || []).length || 18,
        upcoming_exams_count: 4,
        new_enquiries_count: enquiriesCount,
        fees_collected_annual: totalCollected,
        fees_demand_annual: totalBilled,
        paid_students_count: activeStudents.length ? Math.max(1, activeStudents.length - (aggregate.financials?.studentsWithNothingPaid || 0)) : 513,
        pending_students_count: aggregate.financials?.studentsWithNothingPaid || 0,
        attendance_today: {
          is_student_marked: attSummary.isStudentMarked,
          student_display: attSummary.isStudentMarked && attSummary.studentPercent > 0 ? `${attSummary.studentPercent}%` : 'Not Marked',
          student_sublabel: attSummary.isStudentMarked ? `${attSummary.studentPresent}/${attSummary.studentTotal} scholars present` : 'Roll call pending',
          is_faculty_marked: facultyTurnout.present_count > 0 || attSummary.isFacultyMarked,
          faculty_sublabel: facultySubLabel,
          student_present: attSummary.studentPresent,
          student_total: attSummary.studentTotal,
          faculty_present: facultyTurnout.present_count || attSummary.facultyPresent,
          faculty_total: facultyTurnout.total_faculty || attSummary.facultyTotal,
          faculty_on_time: facultyTurnout.on_time_count,
          faculty_late: facultyTurnout.late_count,
          faculty_leave: facultyTurnout.on_leave_count
        }
      },
      charts: {
        attendance_trend_7_days: sevenDayTrend,
        month_wise_fee_collection: monthWiseTrend
      },
      recent_notices: notices.slice(0, 5),
      approval_breakdown: {
        certificate_tc: tcCount,
        fee_concession: feeConcCount,
        staff_leave: leaveCount,
        biometric_regularization: bioCount,
        admission: admCount,
        total_pending: pendingList.length
      },
      pending_requests: pendingList,
      class_roll_calls: classRollCalls,
      faculty_turnout: facultyTurnout,
      students: sanitizedStudents,
      teachers: sanitizedTeachers,
      classes: classes || [],
      receipts: receipts || []
    };

    return NextResponse.json({
      success: true,
      data: overviewData
    });
  } catch (error: any) {
    console.error('[API_PRINCIPAL_OVERVIEW_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load Principal Overview analytics.' },
      { status: 500 }
    );
  }
}
