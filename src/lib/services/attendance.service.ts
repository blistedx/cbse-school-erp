/*! EduSuite Unified Attendance Service v1.0.0 */
/**
 * Single source of truth for all Attendance data across CBSE School ERP.
 * No other file or API route may calculate or query attendance directly.
 */

import { getDatabase, sanitizeDocNoBinary as sanitizeDoc } from '@/lib/mongodb';
import { AttendanceRecord, Holiday, Student, Teacher } from '@/lib/types';
import { getTodayDateStr, normalizeClassName, isSameClass } from '@/lib/utils';
import { Database, invalidateServerCache, expandSchoolIds } from '@/lib/db';
import { AggregatesService } from '@/lib/services/aggregates.service';

export interface StudentAttendanceSummary {
  studentId: string;
  admissionNo: string;
  fullName: string;
  className: string;
  section: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  holidayDays: number;
  attendancePercent: number;
  records: Array<{
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE';
    markedBy?: string;
  }>;
}

export interface SchoolAttendanceDaySummary {
  date: string;
  studentPresent: number;
  studentTotal: number;
  studentPercent: number;
  facultyPresent: number;
  facultyTotal: number;
  facultyPercent: number;
  isStudentMarked: boolean;
  isFacultyMarked: boolean;
}

export interface AbsentStudentInfo {
  studentId: string;
  admissionNo: string;
  fullName: string;
  className: string;
  section: string;
  rollNo?: string;
  parentPhone?: string;
  parentEmail?: string;
  date: string;
  status: 'ABSENT' | 'LEAVE';
}

export class AttendanceService {
  /**
   * Ensure compound indexes on MongoDB attendance collection
   */
  static async ensureIndexes(): Promise<void> {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('attendance').createIndex(
          { school_id: 1, academic_session: 1, date: -1, class_name: 1, section: 1 },
          { name: 'idx_att_school_session_date_class' }
        );
        await db.collection('attendance').createIndex(
          { school_id: 1, academic_session: 1, "student_records.student_id": 1 },
          { name: 'idx_att_student_lookup' }
        );
      }
    } catch (e) {
      console.warn('[AttendanceService.ensureIndexes]', e);
    }
  }

  /**
   * Mark or update class / faculty attendance record
   */
  static async markAttendance(
    schoolId: string,
    session: string = '2026-27',
    data: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> {
    await this.ensureIndexes();

    const targetSchoolId = schoolId || data.school_id || 'DPS2026';
    const targetSession = session || data.academic_session || '2026-27';
    const date = data.date || getTodayDateStr();
    const rawClassName = (data.class_name || 'Class 10').trim();
    const rawSection = (data.section || 'A').trim();

    // Compute status counts
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let holidayCount = 0;

    const studentRecords = (Array.isArray(data.student_records) && data.student_records.length > 0)
      ? data.student_records
      : (Array.isArray((data as any).records) && (data as any).records.length > 0)
      ? (data as any).records
      : [];

    const teacherRecords = Array.isArray(data.teacher_records) ? data.teacher_records : [];

    if (studentRecords.length > 0) {
      studentRecords.forEach((s: any) => {
        const st = (s.status || 'PRESENT').toUpperCase();
        if (st === 'PRESENT' || st === 'LATE') presentCount++;
        else if (st === 'ABSENT') absentCount++;
        else if (st === 'LEAVE') leaveCount++;
        else if (st === 'HOLIDAY') holidayCount++;
      });
    } else if (teacherRecords.length > 0) {
      teacherRecords.forEach((t: any) => {
        const st = (t.status || 'PRESENT').toUpperCase();
        if (st === 'PRESENT' || st === 'LATE') presentCount++;
        else if (st === 'ABSENT') absentCount++;
        else if (st === 'LEAVE') leaveCount++;
        else if (st === 'HOLIDAY') holidayCount++;
      });
    } else {
      presentCount = Number(data.present_count) || 0;
      absentCount = Number(data.absent_count) || 0;
      leaveCount = Number(data.leave_count) || 0;
      holidayCount = Number(data.holiday_count) || 0;
    }

    const totalCount = Number(data.total_students) || (studentRecords.length > 0 ? studentRecords.length : (teacherRecords.length > 0 ? teacherRecords.length : (presentCount + absentCount + leaveCount + holidayCount)));

    const record: AttendanceRecord = {
      id: data.id || `ATT-${targetSchoolId}-${targetSession}-${date}-${normalizeClassName(rawClassName)}-${rawSection}`.replace(/[^A-Za-z0-9_-]/g, '_'),
      school_id: targetSchoolId,
      academic_session: targetSession,
      date,
      class_name: rawClassName,
      section: rawSection,
      total_students: totalCount,
      present_count: presentCount,
      absent_count: absentCount,
      leave_count: leaveCount,
      holiday_count: holidayCount,
      marked_by: data.marked_by || 'Class Teacher',
      student_records: studentRecords.length > 0 ? studentRecords : undefined,
      teacher_records: teacherRecords.length > 0 ? teacherRecords : undefined,
      created_at: new Date().toISOString()
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('attendance').updateOne(
          {
            school_id: targetSchoolId,
            academic_session: targetSession,
            date,
            class_name: rawClassName,
            section: rawSection
          },
          { $set: record },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error('[AttendanceService.markAttendance DB Error]', err);
    }

    // Invalidate caches
    invalidateServerCache('attendance');
    invalidateServerCache('overview');
    invalidateServerCache('students');
    AggregatesService.invalidateMemoryCache(targetSchoolId, targetSession);

    // Update pre-aggregated attendance snapshot immediately
    try {
      const summary = await this.getSchoolSummary(targetSchoolId, targetSession, date);
      await AggregatesService.updateAttendanceSnapshot(targetSchoolId, targetSession, summary);
    } catch (_) {}

    // Synchronize individual scholar attendance percentages in background
    if (studentRecords.length > 0) {
      Promise.resolve().then(async () => {
        try {
          const db = await getDatabase();
          if (!db) return;
          for (const s of studentRecords) {
            const sid = s.student_id || s.id;
            if (sid) {
              const summary = await this.getStudentAttendance(targetSchoolId, sid, targetSession);
              await db.collection('students').updateOne(
                { id: sid },
                { $set: { attendance_percent: summary.attendancePercent } }
              );
            }
          }
        } catch (_) {}
      });
    }

    return record;
  }

  /**
   * Get all attendance documents for a school and session (deduplicated)
   */
  static async getAllAttendanceRecords(
    schoolId: string,
    session: string = '2026-27'
  ): Promise<AttendanceRecord[]> {
    return Database.getAttendance(schoolId, session);
  }

  /**
   * Get specific class attendance for a given date
   */
  static async getClassAttendance(
    schoolId: string,
    className: string,
    section: string,
    date: string = getTodayDateStr(),
    session: string = '2026-27'
  ): Promise<AttendanceRecord | null> {
    const all = await this.getAllAttendanceRecords(schoolId, session);
    const normClass = normalizeClassName(className);
    const normSec = (section || 'A').toLowerCase().trim();

    const matched = all.find(a =>
      a.date === date &&
      normalizeClassName(a.class_name) === normClass &&
      (a.section || 'A').toLowerCase().trim() === normSec
    );

    return matched || null;
  }

  /**
   * Get comprehensive student attendance history and percentage
   */
  static async getStudentAttendance(
    schoolId: string,
    studentId: string,
    session: string = '2026-27',
    dateRange?: { from?: string; to?: string }
  ): Promise<StudentAttendanceSummary> {
    const [allRecords, students] = await Promise.all([
      this.getAllAttendanceRecords(schoolId, session),
      Database.getStudents(schoolId, session)
    ]);

    const student = students.find(s => s.id === studentId || s.admission_no === studentId);
    const targetStudentId = student?.id || studentId;
    const admissionNo = student?.admission_no || '';
    const fullName = student?.full_name || 'Scholar';
    const className = student?.class_name || 'Class 10';
    const section = student?.section || 'A';

    let filteredRecords = allRecords.filter(a => {
      if (dateRange?.from && a.date < dateRange.from) return false;
      if (dateRange?.to && a.date > dateRange.to) return false;
      return true;
    });

    // Sort chronologically
    filteredRecords.sort((a, b) => a.date.localeCompare(b.date));

    const records: StudentAttendanceSummary['records'] = [];
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let holidayDays = 0;

    for (const att of filteredRecords) {
      // Check if this attendance is for the student's class
      const matchesClass = isSameClass(att.class_name, className) &&
        (!section || !att.section || att.section.toUpperCase().trim() === section.toUpperCase().trim());

      let status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE' | null = null;

      if (Array.isArray(att.student_records) && att.student_records.length > 0) {
        const item = att.student_records.find(sr =>
          sr.student_id === targetStudentId ||
          (sr.admission_no && admissionNo && sr.admission_no.trim() === admissionNo.trim())
        );
        if (item) {
          status = item.status;
        }
      }

      // If no specific student record inside class attendance doc, infer from overall class status
      if (!status && matchesClass) {
        if (att.holiday_count && att.holiday_count > 0 && att.present_count === 0) {
          status = 'HOLIDAY';
        }
      }

      if (status) {
        records.push({
          date: att.date,
          status,
          markedBy: att.marked_by
        });

        if (status === 'PRESENT' || status === 'LATE') presentDays++;
        else if (status === 'ABSENT') absentDays++;
        else if (status === 'LEAVE') leaveDays++;
        else if (status === 'HOLIDAY') holidayDays++;
      }
    }

    const totalWorkingDays = presentDays + absentDays + leaveDays;
    const attendancePercent = totalWorkingDays > 0
      ? Number(((presentDays / totalWorkingDays) * 100).toFixed(1))
      : (student?.attendance_percent || 100);

    return {
      studentId: targetStudentId,
      admissionNo,
      fullName,
      className,
      section,
      totalWorkingDays,
      presentDays,
      absentDays,
      leaveDays,
      holidayDays,
      attendancePercent,
      records
    };
  }

  /**
   * Get attendance percentage for a student, class, or whole school
   */
  static async getAttendancePercent(
    schoolId: string,
    targetType: 'STUDENT' | 'CLASS' | 'SCHOOL',
    targetId: string,
    session: string = '2026-27',
    dateRange?: { from?: string; to?: string }
  ): Promise<number> {
    if (targetType === 'STUDENT') {
      const res = await this.getStudentAttendance(schoolId, targetId, session, dateRange);
      return res.attendancePercent;
    }

    if (targetType === 'CLASS') {
      const all = await this.getAllAttendanceRecords(schoolId, session);
      let present = 0;
      let total = 0;
      for (const a of all) {
        if (dateRange?.from && a.date < dateRange.from) continue;
        if (dateRange?.to && a.date > dateRange.to) continue;
        if (isSameClass(a.class_name, targetId)) {
          present += (Number(a.present_count) || 0);
          total += (Number(a.total_students) || 0);
        }
      }
      return total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;
    }

    // Whole school summary
    const summary = await this.getSchoolSummary(schoolId, session, dateRange?.from ? dateRange.from : getTodayDateStr());
    return summary.studentPercent;
  }

  /**
   * Get school-wide attendance metrics for a specific date or date range
   */
  static async getSchoolSummary(
    schoolId: string,
    session: string = '2026-27',
    dateStr: string = getTodayDateStr()
  ): Promise<SchoolAttendanceDaySummary> {
    const db = await getDatabase();
    if (db) {
      const cleanIds = [schoolId, ...expandSchoolIds([schoolId])].filter(Boolean);
      const [todayRecords, totalStudents, totalTeachers] = await Promise.all([
        db.collection('attendance').find(
          {
            school_id: { $in: cleanIds },
            $or: [
              { academic_session: session },
              { academic_session: { $exists: false } },
              { academic_session: null },
              { academic_session: '' }
            ],
            date: dateStr
          },
          { projection: { student_records: 0 } }
        ).toArray(),
        db.collection('students').countDocuments({ school_id: { $in: cleanIds }, status: { $nin: ['INACTIVE', 'ALUMNI'] } }),
        db.collection('teachers').countDocuments({ school_id: { $in: cleanIds } })
      ]);

      const dateMap = new Map<string, AttendanceRecord>();
      for (const raw of todayRecords) {
        const a = sanitizeDoc(raw) as unknown as AttendanceRecord;
        const normClass = normalizeClassName(a.class_name);
        const key = `${normClass}_${(a.section || '').toLowerCase().trim()}`;
        if (!dateMap.has(key)) {
          dateMap.set(key, a);
        }
      }

      const uniqueDateRecords = Array.from(dateMap.values());

      // Student records
      const studentRecords = uniqueDateRecords.filter(a =>
        (a.class_name || '').toLowerCase() !== 'faculty' &&
        (a.class_name || '').toLowerCase() !== 'staff' &&
        !(/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || ''))
      );
      const isStudentMarked = studentRecords.length > 0;
      const studentPresent = isStudentMarked
        ? studentRecords.reduce((acc, curr) => acc + (Number(curr.present_count) || 0), 0)
        : 0;
      const enrolledInLogged = studentRecords.reduce((acc, curr) => acc + (Number(curr.total_students) || 0), 0);
      const studentTotal = totalStudents > 0 ? totalStudents : enrolledInLogged;
      const studentPercent = isStudentMarked && enrolledInLogged > 0
        ? Number(((studentPresent / enrolledInLogged) * 100).toFixed(1))
        : 0;

      // Faculty records
      const facultyRecords = uniqueDateRecords.filter(a =>
        /faculty|staff/i.test(a.class_name || '') ||
        /faculty|staff/i.test(a.section || '') ||
        (Array.isArray((a as any).teacher_records) && (a as any).teacher_records.length > 0)
      );
      const isFacultyMarked = facultyRecords.length > 0;
      const latestFacultyRecord = isFacultyMarked ? facultyRecords[facultyRecords.length - 1] : null;
      const facultyPresent = latestFacultyRecord
        ? Math.min(totalTeachers, Number(latestFacultyRecord.present_count) || 0)
        : 0;
      const facultyTotal = totalTeachers;
      const facultyPercent = isFacultyMarked && totalTeachers > 0
        ? Number(((facultyPresent / totalTeachers) * 100).toFixed(1))
        : 0;

      return {
        date: dateStr,
        studentPresent,
        studentTotal,
        studentPercent,
        facultyPresent,
        facultyTotal,
        facultyPercent,
        isStudentMarked,
        isFacultyMarked
      };
    }

    const [allRecords, students, teachers] = await Promise.all([
      this.getAllAttendanceRecords(schoolId, session),
      Database.getStudents(schoolId, session),
      Database.getTeachers(schoolId, session)
    ]);

    const totalStudents = students.length;
    const totalTeachers = teachers.length;

    // Deduplicate records for dateStr
    const dateMap = new Map<string, AttendanceRecord>();
    for (const a of allRecords) {
      if (a.date === dateStr) {
        const normClass = normalizeClassName(a.class_name);
        const key = `${normClass}_${(a.section || '').toLowerCase().trim()}`;
        if (!dateMap.has(key)) {
          dateMap.set(key, a);
        }
      }
    }

    const uniqueDateRecords = Array.from(dateMap.values());

    // Student records
    const studentRecords = uniqueDateRecords.filter(a =>
      (a.class_name || '').toLowerCase() !== 'faculty' &&
      (a.class_name || '').toLowerCase() !== 'staff' &&
      !(/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || ''))
    );
    const isStudentMarked = studentRecords.length > 0;
    const studentPresent = isStudentMarked
      ? studentRecords.reduce((acc, curr) => acc + (Number(curr.present_count) || 0), 0)
      : 0;
    const enrolledInLogged = studentRecords.reduce((acc, curr) => acc + (Number(curr.total_students) || 0), 0);
    const studentTotal = totalStudents > 0 ? totalStudents : enrolledInLogged;
    const studentPercent = isStudentMarked && enrolledInLogged > 0
      ? Number(((studentPresent / enrolledInLogged) * 100).toFixed(1))
      : 0;

    // Faculty records
    const facultyRecords = uniqueDateRecords.filter(a =>
      /faculty|staff/i.test(a.class_name || '') ||
      /faculty|staff/i.test(a.section || '') ||
      (Array.isArray((a as any).teacher_records) && (a as any).teacher_records.length > 0)
    );
    const isFacultyMarked = facultyRecords.length > 0;
    const latestFacultyRecord = isFacultyMarked ? facultyRecords[facultyRecords.length - 1] : null;
    const facultyPresent = latestFacultyRecord
      ? Math.min(totalTeachers, Number(latestFacultyRecord.present_count) || 0)
      : 0;
    const facultyTotal = totalTeachers;
    const facultyPercent = isFacultyMarked && totalTeachers > 0
      ? Number(((facultyPresent / totalTeachers) * 100).toFixed(1))
      : 0;

    return {
      date: dateStr,
      studentPresent,
      studentTotal,
      studentPercent,
      facultyPresent,
      facultyTotal,
      facultyPercent,
      isStudentMarked,
      isFacultyMarked
    };
  }

  /**
   * Get list of absent / on-leave students for a given date
   */
  static async getAbsentList(
    schoolId: string,
    date: string = getTodayDateStr(),
    session: string = '2026-27',
    className?: string,
    section?: string
  ): Promise<AbsentStudentInfo[]> {
    const [allRecords, students] = await Promise.all([
      this.getAllAttendanceRecords(schoolId, session),
      Database.getStudents(schoolId, session)
    ]);

    const studentMap = new Map<string, Student>();
    students.forEach(s => {
      studentMap.set(s.id, s);
      if (s.admission_no) studentMap.set(s.admission_no.trim(), s);
    });

    const absentList: AbsentStudentInfo[] = [];

    const dateRecords = allRecords.filter(a => a.date === date);
    for (const att of dateRecords) {
      if (className && !isSameClass(att.class_name, className)) continue;
      if (section && (att.section || '').toUpperCase().trim() !== section.toUpperCase().trim()) continue;

      if (Array.isArray(att.student_records)) {
        for (const sr of att.student_records) {
          if (sr.status === 'ABSENT' || sr.status === 'LEAVE') {
            const stu = studentMap.get(sr.student_id) || (sr.admission_no ? studentMap.get(sr.admission_no.trim()) : undefined);
            absentList.push({
              studentId: sr.student_id,
              admissionNo: sr.admission_no || stu?.admission_no || '',
              fullName: sr.full_name || stu?.full_name || 'Scholar',
              className: att.class_name,
              section: att.section || 'A',
              rollNo: sr.roll_no || stu?.roll_no?.toString(),
              parentPhone: stu?.guardian_phone || stu?.phone || stu?.parent_phone,
              parentEmail: stu?.guardian_email || stu?.email,
              date,
              status: sr.status
            });
          }
        }
      }
    }

    return absentList;
  }

  /**
   * Centralized Holidays Handler
   */
  static async getHolidayList(schoolId: string, session: string = '2026-27'): Promise<Holiday[]> {
    return Database.getHolidays(schoolId, session);
  }

  /**
   * Automatically record holiday attendance across all classes & faculty
   */
  static async autoRecordHolidayAttendance(
    schoolId: string,
    session: string = '2026-27',
    holiday: Holiday
  ): Promise<void> {
    if (typeof (Database as any).autoRecordHolidayAttendance === 'function') {
      await (Database as any).autoRecordHolidayAttendance(schoolId, session, holiday);
    }
  }

  /**
   * Parse 12-hour or 24-hour time string into minutes from midnight (0..1439)
   */
  static parseTimeToMinutes(timeStr?: string): number {
    if (!timeStr) return 0;
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = (match[3] || '').toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  /**
   * Direct Teacher Punch In / Clock Out / Leave Mark from Teacher Portal
   */
  static async punchTeacherAttendance(params: {
    schoolId: string;
    session?: string;
    teacherId: string;
    staffCode?: string;
    teacherName?: string;
    date?: string;
    action: 'PUNCH_IN' | 'PUNCH_OUT' | 'LEAVE';
    timeStr?: string;
    leaveType?: string;
    remarks?: string;
  }): Promise<{
    success: boolean;
    status: string;
    in_time?: string;
    out_time?: string;
    is_late?: boolean;
    late_minutes?: number;
    working_hours?: string;
    message: string;
  }> {
    const { schoolId, session = '2026-27', teacherId, staffCode, teacherName, action, leaveType, remarks } = params;
    const date = params.date || getTodayDateStr();

    // Default time to Indian Standard Time
    const nowTimeStr = params.timeStr || new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const [teachers, allAttendance] = await Promise.all([
      Database.getTeachers(schoolId, session),
      this.getAllAttendanceRecords(schoolId, session)
    ]);

    const targetTeacher = teachers.find(t => 
      t.id === teacherId || 
      (staffCode && t.staff_code === staffCode) ||
      (teacherName && t.full_name?.toLowerCase() === teacherName.toLowerCase())
    );

    const actualStaffCode = targetTeacher?.staff_code || staffCode || 'EMP-01';
    const actualName = targetTeacher?.full_name || teacherName || 'Faculty Member';
    const actualId = targetTeacher?.id || teacherId;

    // Reporting threshold: 08:00 AM. Grace period ends at 08:05 AM (485 minutes).
    const punchMinutes = this.parseTimeToMinutes(nowTimeStr);
    const isLate = action === 'PUNCH_IN' && punchMinutes > 485;
    const lateMinutes = isLate ? Math.max(0, punchMinutes - 480) : 0;

    // Locate or initialize today's faculty attendance record
    let facultyRecord = allAttendance.find(a => 
      a.date === date && 
      (/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || '') || (Array.isArray(a.teacher_records) && a.teacher_records.length > 0))
    );

    let tRecords: any[] = [];
    if (facultyRecord && Array.isArray(facultyRecord.teacher_records)) {
      tRecords = [...facultyRecord.teacher_records];
    } else {
      // Seed with all teachers if first punch of the day
      tRecords = teachers.map(t => ({
        teacher_id: t.id,
        staff_code: t.staff_code,
        full_name: t.full_name,
        status: 'ABSENT',
        in_time: undefined,
        out_time: undefined,
        is_late: false,
        late_minutes: 0,
        working_hours: '0h 0m',
        punch_type: 'PENDING'
      }));
    }

    const idx = tRecords.findIndex(tr => tr.teacher_id === actualId || tr.staff_code === actualStaffCode);
    const existingEntry = idx >= 0 ? tRecords[idx] : null;

    let finalStatus = 'PRESENT';
    let inTime = existingEntry?.in_time;
    let outTime = existingEntry?.out_time;
    let workingHours = existingEntry?.working_hours || 'In Progress';

    if (action === 'PUNCH_IN') {
      inTime = nowTimeStr;
      finalStatus = isLate ? 'LATE' : 'PRESENT';
      workingHours = 'In Progress';
    } else if (action === 'PUNCH_OUT') {
      outTime = nowTimeStr;
      finalStatus = existingEntry?.status || 'PRESENT';
      if (inTime) {
        const inMins = this.parseTimeToMinutes(inTime);
        const outMins = this.parseTimeToMinutes(outTime);
        const diffMins = Math.max(0, outMins - inMins);
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        workingHours = `${h}h ${m}m`;
      }
    } else if (action === 'LEAVE') {
      finalStatus = 'ON_LEAVE';
      inTime = undefined;
      outTime = undefined;
      workingHours = '0h 0m';
    }

    const updatedEntry = {
      teacher_id: actualId,
      staff_code: actualStaffCode,
      full_name: actualName,
      status: finalStatus,
      in_time: inTime,
      out_time: outTime,
      is_late: finalStatus === 'LATE' || isLate,
      late_minutes: isLate ? lateMinutes : (existingEntry?.late_minutes || 0),
      working_hours: workingHours,
      punch_type: action,
      remarks: remarks || (isLate ? `Late by ${lateMinutes}m` : (finalStatus === 'ON_LEAVE' ? (leaveType || 'Casual Leave') : 'On Time'))
    };

    if (idx >= 0) {
      tRecords[idx] = updatedEntry;
    } else {
      tRecords.push(updatedEntry);
    }

    const presentCount = tRecords.filter(t => t.status === 'PRESENT' || t.status === 'LATE').length;
    const absentCount = tRecords.filter(t => t.status === 'ABSENT').length;
    const leaveCount = tRecords.filter(t => t.status === 'ON_LEAVE' || t.status === 'LEAVE').length;

    const payload: Partial<AttendanceRecord> = {
      id: facultyRecord?.id || `ATT-${schoolId}-${session}-${date}-Faculty_Staff`.replace(/[^A-Za-z0-9_-]/g, '_'),
      school_id: schoolId,
      academic_session: session,
      date,
      class_name: 'Faculty',
      section: 'Staff',
      total_students: teachers.length > 0 ? teachers.length : tRecords.length,
      present_count: presentCount,
      absent_count: absentCount,
      leave_count: leaveCount,
      marked_by: `Live Biometric Engine (${actualName})`,
      teacher_records: tRecords
    };

    await this.markAttendance(schoolId, session, payload);

    return {
      success: true,
      status: finalStatus,
      in_time: inTime,
      out_time: outTime,
      is_late: isLate,
      late_minutes: lateMinutes,
      working_hours: workingHours,
      message: action === 'PUNCH_IN' 
        ? (isLate ? `Checked in late at ${nowTimeStr} (${lateMinutes} mins late). Recorded in Institutional Ledger.` : `Checked in on time at ${nowTimeStr}. Recorded in Institutional Ledger.`)
        : action === 'PUNCH_OUT'
        ? `Checked out at ${nowTimeStr}. Total time logged: ${workingHours}.`
        : `Marked on leave for ${date}.`
    };
  }

  /**
   * Principal & Admin: Comprehensive Faculty Attendance & Punctuality Ledger
   */
  static async getFacultyAttendanceLedger(
    schoolId: string,
    session: string = '2026-27',
    date: string = getTodayDateStr()
  ) {
    const [teachers, allAttendance, leaveApprovals] = await Promise.all([
      Database.getTeachers(schoolId, session),
      this.getAllAttendanceRecords(schoolId, session),
      Database.getApprovals(schoolId, session, 'STAFF_LEAVE')
    ]);

    const approvedLeaves = (leaveApprovals || []).filter(a => a.status === 'APPROVED');

    // Find attendance record for requested date
    const facultyRecord = allAttendance.find(a => 
      a.date === date && 
      (/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || '') || (Array.isArray(a.teacher_records) && a.teacher_records.length > 0))
    );

    const loggedMap = new Map<string, any>();
    if (facultyRecord && Array.isArray(facultyRecord.teacher_records)) {
      facultyRecord.teacher_records.forEach((tr: any) => {
        if (tr.teacher_id) loggedMap.set(tr.teacher_id, tr);
        if (tr.staff_code) loggedMap.set(tr.staff_code, tr);
      });
    }

    const rows = teachers.map(t => {
      const entry = loggedMap.get(t.id) || (t.staff_code ? loggedMap.get(t.staff_code) : null);
      
      // Calculate approved leave quota
      const teacherLeaves = approvedLeaves.filter(al => 
        al.details?.staff_id === t.id || 
        al.details?.staff_code === t.staff_code ||
        al.requested_by?.id === t.id
      );
      const takenDays = teacherLeaves.reduce((acc, curr) => acc + (Number(curr.details?.days) || 1), 0);
      const totalQuota = 12;
      const remainingQuota = Math.max(0, totalQuota - takenDays);

      // Check if on leave on this specific date
      const isOnLeaveToday = (t.status || '').toUpperCase() === 'ON_LEAVE' || teacherLeaves.some(al => {
        const start = al.details?.start_date;
        const end = al.details?.end_date;
        return (start && end && date >= start && date <= end) || (al.details?.date === date);
      });

      let status = 'ABSENT';
      let inTime = entry?.in_time || null;
      let outTime = entry?.out_time || null;
      let isLate = false;
      let lateMinutes = 0;
      let workingHours = entry?.working_hours || (inTime ? 'In Progress' : '0h 0m');

      if (entry) {
        status = entry.status;
        isLate = !!entry.is_late || entry.status === 'LATE';
        lateMinutes = entry.late_minutes || 0;
      } else if (isOnLeaveToday) {
        status = 'ON_LEAVE';
      }

      return {
        id: t.id,
        staff_code: t.staff_code || t.employee_code || 'EMP',
        full_name: t.full_name,
        photo: t.photo || t.avatar || '',
        avatar: t.avatar || t.photo || '',
        designation: t.designation || 'Faculty',
        department: t.department || 'Academics',
        assigned_class: t.assigned_class || 'None',
        shift: '08:00 AM - 02:30 PM',
        in_time: inTime,
        out_time: outTime,
        status, // 'PRESENT' | 'LATE' | 'ON_LEAVE' | 'ABSENT'
        is_late: isLate,
        late_minutes: lateMinutes,
        working_hours: workingHours,
        remarks: entry?.remarks || (isLate ? `Late by ${lateMinutes}m` : (status === 'ON_LEAVE' ? 'Approved Leave' : (status === 'PRESENT' ? 'On Time' : 'Not Punched'))),
        leave_ledger: {
          total_quota: totalQuota,
          taken_days: takenDays,
          remaining_quota: remainingQuota
        }
      };
    });

    const totalFaculty = rows.length;
    const presentCount = rows.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const onTimeCount = rows.filter(r => r.status === 'PRESENT' && !r.is_late).length;
    const lateCount = rows.filter(r => r.status === 'LATE' || r.is_late).length;
    const onLeaveCount = rows.filter(r => r.status === 'ON_LEAVE').length;
    const absentCount = rows.filter(r => r.status === 'ABSENT').length;
    const punctualityRate = presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 0;

    return {
      date,
      total_faculty: totalFaculty,
      present_count: presentCount,
      on_time_count: onTimeCount,
      late_count: lateCount,
      on_leave_count: onLeaveCount,
      absent_count: absentCount,
      punctuality_rate: punctualityRate,
      faculty_records: rows
    };
  }

  /**
   * Get all students marked ABSENT on a given date for a school.
   * Useful for daily morning absentee alerts and parental communication.
   */
  static async getAbsentStudents(
    schoolId: string,
    session: string = '2026-27',
    date: string = getTodayDateStr()
  ): Promise<AbsentStudentInfo[]> {
    const db = await getDatabase();
    if (!db) return [];

    const dayRecords = await db.collection('attendance')
      .find({
        school_id: { $in: expandSchoolIds([schoolId]) },
        academic_session: session,
        date
      })
      .toArray();

    const absentList: AbsentStudentInfo[] = [];
    const allStudents = await Database.getStudents(schoolId);
    const studentMap = new Map<string, Student>();
    for (const s of allStudents) {
      studentMap.set(s.id, s);
      if (s.admission_no) studentMap.set(s.admission_no, s);
    }

    for (const rec of dayRecords) {
      if (Array.isArray(rec.student_records)) {
        for (const sr of rec.student_records) {
          const status = (sr.status || '').toUpperCase();
          if (status === 'ABSENT' || status === 'LEAVE') {
            const studentId = sr.student_id || sr.id;
            const fullStudent = studentMap.get(studentId);
            absentList.push({
              studentId,
              admissionNo: sr.admission_no || fullStudent?.admission_no || studentId,
              fullName: sr.student_name || sr.full_name || fullStudent?.full_name || 'Scholar',
              className: rec.class_name || fullStudent?.class_name || 'General',
              section: rec.section || fullStudent?.section || 'A',
              rollNo: sr.roll_no || (fullStudent?.roll_no ? String(fullStudent.roll_no) : undefined),
              parentPhone: (fullStudent as any)?.father_mobile || (fullStudent as any)?.mother_mobile || fullStudent?.guardian_phone || fullStudent?.emergency_contact_phone || fullStudent?.mobile,
              parentEmail: (fullStudent as any)?.father_email || (fullStudent as any)?.mother_email || fullStudent?.email,
              date,
              status: status as 'ABSENT' | 'LEAVE'
            });
          }
        }
      }
    }

    return absentList;
  }

  /**
   * Hardware biometric / RFID punch ingestion
   * Processes hardware scan logs from ZKTeco, Essl, or RFID gate swipe readers.
   */
  static async recordHardwarePunches(
    schoolId: string,
    session: string = '2026-27',
    punches: Array<{
      identifier: string; // rfid_card_id, admission_no, staff_code, or student_id
      timestamp?: string;
      device_id?: string;
      in_out_type?: 'IN' | 'OUT' | 'CHECK';
      punch_time?: string;
    }>
  ): Promise<{
    success: boolean;
    total: number;
    matched: number;
    unmatched: number;
    studentsMarked: number;
    facultyMarked: number;
    logs: string[];
  }> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not connected');

    const allStudents = await Database.getStudents(schoolId);
    const allTeachers = await Database.getTeachers(schoolId);

    const studentById = new Map<string, Student>();
    const studentByRfid = new Map<string, Student>();
    const studentByAdm = new Map<string, Student>();

    for (const s of allStudents) {
      studentById.set(s.id, s);
      if (s.admission_no) studentByAdm.set(s.admission_no.toLowerCase().trim(), s);
      if (s.rfid_card_id) studentByRfid.set(s.rfid_card_id.toLowerCase().trim(), s);
    }

    const teacherById = new Map<string, Teacher>();
    const teacherByCode = new Map<string, Teacher>();
    const teacherByRfid = new Map<string, Teacher>();

    for (const t of allTeachers) {
      teacherById.set(t.id, t);
      if (t.staff_code) teacherByCode.set(t.staff_code.toLowerCase().trim(), t);
      if (t.rfid_card_id) teacherByRfid.set(t.rfid_card_id.toLowerCase().trim(), t);
    }

    let matchedCount = 0;
    let unmatchedCount = 0;
    let studentsMarked = 0;
    let facultyMarked = 0;
    const logs: string[] = [];
    const date = getTodayDateStr();

    const studentPunchesByClass = new Map<string, Array<{ student: Student; time: string }>>();
    const facultyPunches: Array<{ teacher: Teacher; time: string; inOut: string }> = [];

    for (const punch of punches) {
      const rawId = (punch.identifier || '').toLowerCase().trim();
      if (!rawId) {
        unmatchedCount++;
        continue;
      }

      const punchTime = punch.punch_time || punch.timestamp || new Date().toISOString();
      const timeStr = punchTime.includes('T') ? punchTime.split('T')[1].slice(0, 5) : punchTime.slice(0, 5);

      const teacher = teacherById.get(rawId) || teacherByCode.get(rawId) || teacherByRfid.get(rawId);
      if (teacher) {
        matchedCount++;
        facultyMarked++;
        facultyPunches.push({ teacher, time: timeStr, inOut: punch.in_out_type || 'IN' });
        logs.push(`Matched Staff: ${teacher.full_name} (${teacher.staff_code}) at ${timeStr}`);
        continue;
      }

      const student = studentById.get(rawId) || studentByAdm.get(rawId) || studentByRfid.get(rawId);
      if (student) {
        matchedCount++;
        studentsMarked++;
        const classKey = `${student.class_name || 'Class 10'}_${student.section || 'A'}`;
        if (!studentPunchesByClass.has(classKey)) {
          studentPunchesByClass.set(classKey, []);
        }
        studentPunchesByClass.get(classKey)!.push({ student, time: timeStr });
        logs.push(`Matched Scholar: ${student.full_name} (${student.admission_no}) at ${timeStr}`);
        continue;
      }

      unmatchedCount++;
      logs.push(`Unmatched identifier: ${punch.identifier}`);
    }

    for (const [classKey, pList] of studentPunchesByClass.entries()) {
      const [className, section] = classKey.split('_');
      const existingRecord = await db.collection('attendance').findOne({
        school_id: { $in: expandSchoolIds([schoolId]) },
        academic_session: session,
        date,
        class_name: className,
        section
      });

      const classStudents = allStudents.filter(
        s => isSameClass(s.class_name, className) && (s.section || 'A').toUpperCase() === section.toUpperCase()
      );

      const punchedIds = new Set(pList.map(p => p.student.id));

      const updatedStudentRecords = classStudents.map(s => {
        const existingStudentRec = (existingRecord?.student_records as any[])?.find((r: any) => (r.student_id || r.id) === s.id);
        const wasPunched = punchedIds.has(s.id);
        const currentStatus = wasPunched ? 'PRESENT' : (existingStudentRec?.status || 'ABSENT');
        return {
          student_id: s.id,
          admission_no: s.admission_no || s.id,
          full_name: s.full_name,
          roll_no: s.roll_no ? String(s.roll_no) : '',
          status: currentStatus as 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'LATE',
          marked_by: wasPunched ? 'Biometric/RFID Gateway' : (existingStudentRec?.marked_by || 'Auto-Roll')
        };
      });

      await this.markAttendance(schoolId, session, {
        date,
        class_name: className,
        section,
        marked_by: 'Hardware Biometric Gateway',
        student_records: updatedStudentRecords as any
      });
    }

    if (facultyPunches.length > 0) {
      const existingFacultyRec = await db.collection('attendance').findOne({
        school_id: { $in: expandSchoolIds([schoolId]) },
        academic_session: session,
        date,
        class_name: 'FACULTY',
        section: 'ALL'
      });

      const punchedTeacherMap = new Map(facultyPunches.map(p => [p.teacher.id, p]));

      const updatedTeacherRecords = allTeachers.map(t => {
        const punch = punchedTeacherMap.get(t.id);
        const existingTeacherRec = (existingFacultyRec?.teacher_records as any[])?.find((r: any) => (r.teacher_id || r.id) === t.id);

        if (punch) {
          return {
            id: t.id,
            teacher_id: t.id,
            staff_code: t.staff_code || t.employee_code || 'EMP',
            name: t.full_name,
            status: 'PRESENT' as const,
            in_time: existingTeacherRec?.in_time || punch.time,
            out_time: punch.inOut === 'OUT' ? punch.time : (existingTeacherRec?.out_time || null),
            is_late: false,
            marked_by: 'Biometric/RFID Gateway'
          };
        }

        return existingTeacherRec || {
          id: t.id,
          teacher_id: t.id,
          staff_code: t.staff_code || t.employee_code || 'EMP',
          name: t.full_name,
          status: 'ABSENT' as const,
          marked_by: 'System'
        };
      });

      await this.markAttendance(schoolId, session, {
        date,
        class_name: 'FACULTY',
        section: 'ALL',
        marked_by: 'Hardware Biometric Gateway',
        teacher_records: updatedTeacherRecords
      });
    }

    return {
      success: true,
      total: punches.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
      studentsMarked,
      facultyMarked,
      logs
    };
  }
}
