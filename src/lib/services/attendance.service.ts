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

    if (Array.isArray(data.student_records) && data.student_records.length > 0) {
      data.student_records.forEach(s => {
        const st = (s.status || 'PRESENT').toUpperCase();
        if (st === 'PRESENT' || st === 'LATE') presentCount++;
        else if (st === 'ABSENT') absentCount++;
        else if (st === 'LEAVE') leaveCount++;
        else if (st === 'HOLIDAY') holidayCount++;
      });
    } else if (Array.isArray(data.teacher_records) && data.teacher_records.length > 0) {
      data.teacher_records.forEach(t => {
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

    const totalCount = Number(data.total_students) || (presentCount + absentCount + leaveCount + holidayCount);

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
      student_records: data.student_records,
      teacher_records: data.teacher_records,
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
    AggregatesService.invalidateMemoryCache(targetSchoolId, targetSession);

    // Update pre-aggregated attendance snapshot immediately
    try {
      const summary = await this.getSchoolSummary(targetSchoolId, targetSession, date);
      await AggregatesService.updateAttendanceSnapshot(targetSchoolId, targetSession, summary);
    } catch (_) {}

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
    await Database.autoRecordHolidayAttendance(schoolId, session, holiday);
  }

  /**
   * Ensure database indexes for Attendance collection
   */
  static async ensureAttendanceIndexes(): Promise<void> {
    const db = await getDatabase();
    if (!db) return;
    try {
      await db.collection('attendance').createIndex({ school_id: 1, session: 1, date: -1 });
      await db.collection('attendance').createIndex({ school_id: 1, class_name: 1, section: 1, date: 1 });
      await db.collection('attendance').createIndex({ id: 1 }, { unique: true });
    } catch (err: any) {
      console.warn('[AttendanceService] Index creation non-fatal error:', err?.message);
    }
  }
}
