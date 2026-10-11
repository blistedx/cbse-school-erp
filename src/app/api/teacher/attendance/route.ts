/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { getTodayDateStr } from '@/lib/utils';
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
    const month = searchParams.get('month'); // e.g. '2026-08' or undefined

    // Resolve teacher
    const teachers = await Database.getTeachers(tenant);
    const teacher = teachers.find(t => 
      t.id === auth.userId || 
      (t.staff_code && t.staff_code === auth.userId) ||
      (t.email && t.email === auth.username)
    );

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Teacher profile not found.' }, { status: 404 });
    }

    // Read ONLY from unified staff attendance records (READ-ONLY)
    const allRecords = await AttendanceService.getAllAttendanceRecords(tenant, session);
    const facultyRecords = allRecords.filter(a => 
      /faculty|staff/i.test(a.class_name || '') || 
      /faculty|staff/i.test(a.section || '') || 
      (Array.isArray(a.teacher_records) && a.teacher_records.length > 0)
    );

    // Get holidays for context
    const holidays = await Database.getHolidays(tenant, session);

    // Filter by month if provided
    const targetFacultyRecords = month 
      ? facultyRecords.filter(r => r.date.startsWith(month))
      : facultyRecords;

    // Existing biometric requests for this teacher
    const bioRequests = await Database.getBiometricRequests(tenant, teacher.id);

    // Map each day's attendance
    const dayLedger = targetFacultyRecords.map(r => {
      const myRecord = (r.teacher_records || []).find(tr => 
        tr.teacher_id === teacher.id || 
        (teacher.staff_code && tr.staff_code === teacher.staff_code)
      );

      const reqForDay = bioRequests.find(br => br.date === r.date);

      let status = myRecord ? myRecord.status : 'ABSENT';
      const isRegularized = (myRecord as any)?.is_regularized || false;
      if (isRegularized) status = 'PRESENT';

      const inTime = (myRecord as any)?.in_time || (status === 'PRESENT' ? '08:15 AM' : undefined);
      const outTime = (myRecord as any)?.out_time || (status === 'PRESENT' ? '03:30 PM' : undefined);
      const workHours = (myRecord as any)?.work_hours || (status === 'PRESENT' ? '7h 15m' : '0h 0m');

      // Check if missed punch
      const isMissedPunch = !isRegularized && (
        status === 'ABSENT' ||
        (inTime && !outTime) ||
        (!inTime && outTime)
      );

      return {
        date: r.date,
        day_of_week: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' }),
        status: isRegularized ? 'PRESENT (Regularized)' : status,
        in_time: inTime || '--:--',
        out_time: outTime || '--:--',
        working_hours: workHours,
        is_regularized: isRegularized,
        regularization_remark: (myRecord as any)?.regularization_remark,
        can_raise_request: isMissedPunch && r.date < getTodayDateStr(),
        existing_request: reqForDay ? {
          id: reqForDay.id,
          status: reqForDay.status,
          request_type: reqForDay.request_type,
          principal_remarks: reqForDay.principal_remarks
        } : null
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    // Summary statistics
    const totalRecordedDays = dayLedger.length;
    const presentDays = dayLedger.filter(d => d.status.startsWith('PRESENT')).length;
    const absentDays = dayLedger.filter(d => d.status === 'ABSENT').length;
    const leaveDays = dayLedger.filter(d => d.status === 'LEAVE').length;
    const regularizedDays = dayLedger.filter(d => d.is_regularized).length;
    const punctualityPercent = totalRecordedDays > 0 ? Number(((presentDays / totalRecordedDays) * 100).toFixed(1)) : 0;

    // Today's live punch status & leave ledger
    const todayStr = getTodayDateStr();
    const todayFacultyRecord = facultyRecords.find(r => r.date === todayStr);
    const myTodayRecord = todayFacultyRecord?.teacher_records?.find(tr => 
      tr.teacher_id === teacher.id || 
      (teacher.staff_code && tr.staff_code === teacher.staff_code)
    );

    const leaveApprovals = await Database.getApprovals(tenant, session, 'STAFF_LEAVE');
    const myLeaves = (leaveApprovals || []).filter(al => 
      al.status === 'APPROVED' && 
      (al.details?.staff_id === teacher.id || al.details?.staff_code === teacher.staff_code)
    );
    const takenLeaves = myLeaves.reduce((acc, curr) => acc + (Number(curr.details?.days) || 1), 0);
    const leaveBalance = Math.max(0, 12 - takenLeaves);

    const todayPunch = {
      date: todayStr,
      status: myTodayRecord?.status || 'NOT_PUNCHED',
      in_time: myTodayRecord?.in_time || null,
      out_time: myTodayRecord?.out_time || null,
      is_late: !!myTodayRecord?.is_late,
      late_minutes: myTodayRecord?.late_minutes || 0,
      working_hours: myTodayRecord?.working_hours || (myTodayRecord?.in_time ? 'In Progress' : '0h 0m'),
      is_punched_in: !!myTodayRecord?.in_time,
      is_punched_out: !!myTodayRecord?.out_time,
      leave_balance: leaveBalance,
      leaves_taken: takenLeaves,
      total_quota: 12
    };

    return NextResponse.json({
      success: true,
      school_id: tenant,
      teacher: {
        id: teacher.id,
        staff_code: teacher.staff_code,
        full_name: teacher.full_name
      },
      today_punch: todayPunch,
      summary: {
        total_working_days: totalRecordedDays,
        present_days: presentDays,
        absent_days: absentDays,
        leave_days: leaveDays,
        regularized_days: regularizedDays,
        punctuality_percent: punctualityPercent
      },
      ledger: dayLedger
    });
  } catch (error: any) {
    console.error('[API_TEACHER_ATTENDANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve biometric attendance records.' }, { status: 500 });
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

    // Resolve teacher
    const teachers = await Database.getTeachers(tenant);
    const teacher = teachers.find(t => 
      t.id === auth.userId || 
      (t.staff_code && t.staff_code === auth.userId) ||
      (t.email && t.email === auth.username)
    );

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Teacher profile not found.' }, { status: 404 });
    }

    // 1. Live Self Clock-In / Punch-Out / Leave Action
    if (body.action === 'PUNCH_IN' || body.action === 'PUNCH_OUT' || body.action === 'LEAVE') {
      const punchResult = await AttendanceService.punchTeacherAttendance({
        schoolId: tenant,
        session,
        teacherId: teacher.id,
        staffCode: teacher.staff_code,
        teacherName: teacher.full_name,
        action: body.action,
        timeStr: body.time,
        leaveType: body.leave_type,
        remarks: body.remarks
      });

      return NextResponse.json(punchResult);
    }

    // 2. Otherwise: Regularization Request for Past Dates
    const { date, request_type, expected_in, expected_out, reason, attachment_url } = body;
    const todayStr = getTodayDateStr();

    if (!date || date >= todayStr) {
      return NextResponse.json({
        success: false,
        error: 'Missed Biometric Regularization can only be raised for past dates.'
      }, { status: 400 });
    }

    if (!reason || reason.trim().length < 15) {
      return NextResponse.json({
        success: false,
        error: 'A mandatory justification reason of at least 15 characters is required.'
      }, { status: 400 });
    }

    // Check no duplicate pending request for same date
    const existingReqs = await Database.getBiometricRequests(tenant, teacher.id);
    const duplicate = existingReqs.find(r => r.date === date && r.status === 'PENDING');
    if (duplicate) {
      return NextResponse.json({
        success: false,
        error: `A pending regularization petition (Ref: ${duplicate.id}) already exists for ${date}.`
      }, { status: 400 });
    }

    const newReq = await Database.createBiometricRequest({
      school_id: tenant,
      academic_session: body.academic_session || '2026-27',
      teacher_id: teacher.id,
      teacher_code: teacher.staff_code,
      teacher_name: teacher.full_name,
      date,
      request_type: request_type || 'MISSED_IN',
      expected_in: expected_in || '08:30 AM',
      expected_out: expected_out || '03:30 PM',
      reason: reason.trim(),
      attachment_url
    });

    return NextResponse.json({
      success: true,
      message: 'Missed Biometric Regularization request submitted successfully for Principal approval.',
      request: newReq
    });
  } catch (error: any) {
    console.error('[API_TEACHER_ATTENDANCE_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to submit regularization request.' }, { status: 500 });
  }
}
