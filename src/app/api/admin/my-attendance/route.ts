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
    const isRestricted = ['STUDENT', 'PARENT'].includes(userRole);
    if (isRestricted) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access restricted to staff and administrators.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const currentYm = new Date().toISOString().slice(0, 7);
    const month = searchParams.get('month') || currentYm; // e.g. '2026-08' or '2026-10'

    // Resolve School Info
    const schools = await Database.getSchools();
    const school = schools.find(s => s.id === tenant || s.school_code === tenant);

    // Resolve Admin / Staff Identity
    const teachers = await Database.getTeachers(tenant, session);
    const matchedTeacher = teachers.find(t => 
      t.id === auth.userId || 
      (t.staff_code && t.staff_code === auth.userId) ||
      (t.email && t.email === auth.username) ||
      (t.staff_code && t.staff_code === (auth as any).username)
    );

    const adminProfile = {
      id: matchedTeacher?.id || auth.userId || 'admin',
      staff_code: matchedTeacher?.staff_code || (auth as any).staff_code || (auth.userId === 'admin' ? 'ADM01' : auth.userId || 'ADM01'),
      full_name: matchedTeacher?.full_name || (auth as any).full_name || school?.admin_name || 'School Administrator',
      designation: matchedTeacher?.designation || (userRole === 'ADMIN' ? 'School Administrator' : userRole.replace('_', ' ')),
      role: userRole || 'ADMIN'
    };

    // Read unified staff attendance records
    const allRecords = await AttendanceService.getAllAttendanceRecords(tenant, session);
    const facultyRecords = allRecords.filter(a => 
      /faculty|staff/i.test(a.class_name || '') || 
      /faculty|staff/i.test(a.section || '') || 
      (Array.isArray(a.teacher_records) && a.teacher_records.length > 0)
    );

    // Get holidays for context
    const holidays = await Database.getHolidays(tenant, session);
    const holidayMap = new Map<string, string>();
    holidays.forEach(h => {
      holidayMap.set(h.date, h.title || h.name || 'School Holiday');
    });

    // Existing biometric requests for this admin/staff member
    const bioRequests = await Database.getBiometricRequests(tenant, adminProfile.id);

    // Filter faculty records for the selected month
    const targetFacultyRecords = facultyRecords.filter(r => r.date.startsWith(month));
    const recordsByDate = new Map<string, any>();
    targetFacultyRecords.forEach(r => {
      recordsByDate.set(r.date, r);
    });

    // Build complete ledger for the requested month
    const [yearStr, monthStr] = month.split('-');
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const todayStr = getTodayDateStr();

    const dayLedger: any[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayPadded = String(day).padStart(2, '0');
      const dateStr = `${month}-${dayPadded}`;
      const dayDate = new Date(yearNum, monthNum - 1, day);
      const isSunday = dayDate.getDay() === 0;
      const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const holidayName = holidayMap.get(dateStr);

      const r = recordsByDate.get(dateStr);
      const myRecord = r?.teacher_records?.find((tr: any) => 
        tr.teacher_id === adminProfile.id || 
        (adminProfile.staff_code && tr.staff_code === adminProfile.staff_code) ||
        (adminProfile.id === 'admin' && (tr.teacher_id === 'admin' || tr.staff_code === 'ADM01'))
      );

      const reqForDay = bioRequests.find(br => br.date === dateStr);

      let status = 'ABSENT';
      let inTime = '--:--';
      let outTime = '--:--';
      let workHours = '0h 0m';
      let isRegularized = false;
      let regularizationRemark: string | undefined = undefined;

      if (isSunday) {
        status = 'WEEKLY_OFF';
      } else if (holidayName) {
        status = 'HOLIDAY';
      } else if (myRecord) {
        isRegularized = !!(myRecord as any).is_regularized;
        status = isRegularized ? 'PRESENT' : myRecord.status;
        inTime = (myRecord as any).in_time || (status === 'PRESENT' ? '08:15 AM' : '--:--');
        outTime = (myRecord as any).out_time || (status === 'PRESENT' ? '03:30 PM' : '--:--');
        workHours = (myRecord as any).working_hours || (status === 'PRESENT' ? '7h 15m' : '0h 0m');
        regularizationRemark = (myRecord as any).regularization_remark;
      } else if (dateStr > todayStr) {
        status = 'UPCOMING';
      } else if (dateStr === todayStr) {
        status = 'NOT_PUNCHED';
      }

      // Check if missed punch can be regularized
      const isMissedPunch = !isRegularized && !isSunday && !holidayName && dateStr < todayStr && (
        status === 'ABSENT' ||
        (inTime !== '--:--' && outTime === '--:--') ||
        (inTime === '--:--' && outTime !== '--:--')
      );

      dayLedger.push({
        date: dateStr,
        day_of_week: dayOfWeek,
        status: isRegularized ? 'PRESENT (Regularized)' : status,
        raw_status: status,
        in_time: inTime,
        out_time: outTime,
        working_hours: workHours,
        is_regularized: isRegularized,
        regularization_remark: regularizationRemark,
        holiday_name: holidayName,
        can_raise_request: isMissedPunch,
        existing_request: reqForDay ? {
          id: reqForDay.id,
          status: reqForDay.status,
          request_type: reqForDay.request_type,
          reason: reqForDay.reason,
          created_at: reqForDay.created_at,
          principal_remarks: reqForDay.principal_remarks
        } : null
      });
    }

    // Sort descending by date
    dayLedger.sort((a, b) => b.date.localeCompare(a.date));

    // Summary statistics for working days elapsed or recorded
    const workingDaysList = dayLedger.filter(d => d.status !== 'WEEKLY_OFF' && d.status !== 'HOLIDAY' && d.status !== 'UPCOMING');
    const totalWorkingDays = workingDaysList.length;
    const presentDays = workingDaysList.filter(d => d.status.startsWith('PRESENT')).length;
    const absentDays = workingDaysList.filter(d => d.status === 'ABSENT' || d.status === 'NOT_PUNCHED').length;
    const leaveDays = workingDaysList.filter(d => d.status === 'LEAVE' || d.status === 'ON_LEAVE').length;
    const regularizedDays = workingDaysList.filter(d => d.is_regularized).length;
    const punctualityPercent = totalWorkingDays > 0 ? Number(((presentDays / totalWorkingDays) * 100).toFixed(1)) : 0;

    // Today's live punch status
    const todayFacultyRecord = facultyRecords.find(r => r.date === todayStr);
    const myTodayRecord = todayFacultyRecord?.teacher_records?.find((tr: any) => 
      tr.teacher_id === adminProfile.id || 
      (adminProfile.staff_code && tr.staff_code === adminProfile.staff_code) ||
      (adminProfile.id === 'admin' && (tr.teacher_id === 'admin' || tr.staff_code === 'ADM01'))
    );

    // Leave Quota & Balance
    const leaveApprovals = await Database.getApprovals(tenant, session, 'STAFF_LEAVE');
    const myLeaves = (leaveApprovals || []).filter(al => 
      al.status === 'APPROVED' && 
      (al.details?.staff_id === adminProfile.id || al.details?.staff_code === adminProfile.staff_code || al.requested_by?.id === adminProfile.id)
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
      admin: adminProfile,
      today_punch: todayPunch,
      summary: {
        total_working_days: totalWorkingDays,
        present_days: presentDays,
        absent_days: absentDays,
        leave_days: leaveDays,
        regularized_days: regularizedDays,
        punctuality_percent: punctualityPercent
      },
      ledger: dayLedger
    });
  } catch (error: any) {
    console.error('[API_ADMIN_ATTENDANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve administrator attendance records.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    const isRestricted = ['STUDENT', 'PARENT'].includes(userRole);
    if (isRestricted) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access restricted to staff and administrators.' }, { status: 403 });
    }

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (tenant instanceof NextResponse) return tenant;

    const session = body.academic_session || '2026-27';

    // Resolve School Info
    const schools = await Database.getSchools();
    const school = schools.find(s => s.id === tenant || s.school_code === tenant);

    // Resolve Admin / Staff Identity
    const teachers = await Database.getTeachers(tenant, session);
    const matchedTeacher = teachers.find(t => 
      t.id === auth.userId || 
      (t.staff_code && t.staff_code === auth.userId) ||
      (t.email && t.email === auth.username) ||
      (t.staff_code && t.staff_code === (auth as any).username)
    );

    const adminProfile = {
      id: matchedTeacher?.id || auth.userId || 'admin',
      staff_code: matchedTeacher?.staff_code || (auth as any).staff_code || (auth.userId === 'admin' ? 'ADM01' : auth.userId || 'ADM01'),
      full_name: matchedTeacher?.full_name || (auth as any).full_name || school?.admin_name || 'School Administrator',
      designation: matchedTeacher?.designation || 'School Administrator',
      role: userRole || 'ADMIN'
    };

    // 1. Live Self Clock-In / Punch-Out / Leave Action
    if (body.action === 'PUNCH_IN' || body.action === 'PUNCH_OUT' || body.action === 'LEAVE') {
      const punchResult = await AttendanceService.punchTeacherAttendance({
        schoolId: tenant,
        session,
        teacherId: adminProfile.id,
        staffCode: adminProfile.staff_code,
        teacherName: adminProfile.full_name,
        action: body.action,
        timeStr: body.time,
        leaveType: body.leave_type,
        remarks: body.remarks
      });

      return NextResponse.json(punchResult);
    }

    // 2. Missed Punch Regularization Petition to Principal
    const { date, request_type, expected_in, expected_out, reason, attachment_url } = body;
    const todayStr = getTodayDateStr();

    if (!date || date >= todayStr) {
      return NextResponse.json({
        success: false,
        error: 'Missed Punch Regularization petition can only be submitted for past dates.'
      }, { status: 400 });
    }

    if (!reason || reason.trim().length < 15) {
      return NextResponse.json({
        success: false,
        error: 'A mandatory justification reason of at least 15 characters is required for Principal review.'
      }, { status: 400 });
    }

    // Check no duplicate pending petition for same date
    const existingReqs = await Database.getBiometricRequests(tenant, adminProfile.id);
    const duplicate = existingReqs.find(r => r.date === date && r.status === 'PENDING');
    if (duplicate) {
      return NextResponse.json({
        success: false,
        error: `A pending regularization petition (Ref: ${duplicate.id}) already exists for ${date}.`
      }, { status: 400 });
    }

    const newReq = await Database.createBiometricRequest({
      school_id: tenant,
      academic_session: session,
      teacher_id: adminProfile.id,
      teacher_code: adminProfile.staff_code,
      teacher_name: adminProfile.full_name,
      date,
      request_type: request_type || 'MISSED_IN',
      expected_in: expected_in || '08:30 AM',
      expected_out: expected_out || '03:30 PM',
      reason: reason.trim(),
      attachment_url,
      applicant_role: userRole || 'ADMIN'
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Missed Biometric Regularization petition successfully submitted to Principal for executive approval.',
      request: newReq
    });
  } catch (error: any) {
    console.error('[API_ADMIN_ATTENDANCE_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to submit regularization petition.' }, { status: 500 });
  }
}
