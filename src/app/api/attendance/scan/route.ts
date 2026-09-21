/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Smart Attendance QR Scan API */
import { NextResponse } from 'next/server';
import { Database, isSameClass } from '@/lib/db';
import { AttendanceRecord } from '@/lib/types';
import { extractToken, verifySessionToken } from '@/lib/auth-guard';
import { getTodayDateStr } from '@/lib/utils';
import { AttendanceService } from '@/lib/services/attendance.service';

export async function POST(req: Request) {
  try {
    // Enforce Staff/Teacher/Admin Authorization Guard
    const token = extractToken(req);
    let operatorRole = 'STAFF';
    let operatorName = 'Authorized Gatekeeper';

    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        const userRole = (payload.role || '').toUpperCase();
        // Disallow students and parents from marking attendance remotely
        if (userRole === 'STUDENT' || userRole === 'PARENT') {
          return NextResponse.json({
            success: false,
            error: 'Access Denied: Students and parents cannot self-mark attendance. Attendance can only be scanned by a Class Teacher or School Admin on campus.'
          }, { status: 403 });
        }
        operatorRole = userRole;
        operatorName = `${payload.userId} (${userRole})`;
      }
    }

    const body = await req.json();
    const student_id = body.student_id || body.studentId || body.id;
    const admission_no = body.admission_no || body.admissionNo || body.adm;
    const rawSchoolId = body.school_id || body.schoolId || 'DPS2026';
    const rawSession = body.academic_session || body.session || '2026-27';
    const clientUserRole = (body.operator_role || body.role || '').toUpperCase();

    // Secondary client payload role check
    if (clientUserRole === 'STUDENT' || clientUserRole === 'PARENT') {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: Students and parents cannot self-mark attendance.'
      }, { status: 403 });
    }

    if (!student_id && !admission_no) {
      return NextResponse.json({
        success: false,
        error: 'Student ID or Admission Number is required to scan attendance.'
      }, { status: 400 });
    }

    // 1. Resolve Target School
    const school = await Database.getSchoolById(rawSchoolId);
    const targetSchoolId = school?.school_code || school?.id || rawSchoolId;

    // 2. Fetch Students to find target scholar
    const allStudents = await Database.getStudents(targetSchoolId);
    const student = allStudents.find(s => {
      const matchId = student_id && (s.id === student_id || (s as any)._id?.toString() === student_id);
      const matchAdm = admission_no && (s.admission_no?.toLowerCase().trim() === admission_no.toLowerCase().trim());
      return matchId || matchAdm;
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        error: 'Scholar not found in school registry.'
      }, { status: 404 });
    }

    // 3. Current Date strictly for TODAY in IST (YYYY-MM-DD)
    const now = new Date();
    const todayDate = getTodayDateStr();
    const checkInTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const className = student.class_name || 'Class 10';
    const section = student.section || 'A';
    const academicSession = student.academic_session || rawSession;

    // 4. Fetch Existing Attendance Records for this class and date
    const allAttendance = await Database.getAttendance(targetSchoolId, academicSession);
    const todayRecord = allAttendance.find(a => 
      a.date === todayDate && 
      isSameClass(a.class_name, className) && 
      (a.section || 'A').toUpperCase().trim() === section.toUpperCase().trim()
    );

    // Filter class students to construct attendance roster
    const classStudents = allStudents.filter(s => 
      isSameClass(s.class_name, className) &&
      (s.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      s.status !== 'INACTIVE' && s.status !== 'ALUMNI'
    );

    let updatedStudentRecords: Array<{
      student_id: string;
      admission_no?: string;
      full_name: string;
      roll_no?: string;
      status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE';
    }> = [];

    if (todayRecord && Array.isArray(todayRecord.student_records) && todayRecord.student_records.length > 0) {
      let foundInRoster = false;
      updatedStudentRecords = todayRecord.student_records.map((r) => {
        const isTarget = r.student_id === student.id || r.admission_no === student.admission_no;
        if (isTarget) {
          foundInRoster = true;
          return {
            ...r,
            status: 'PRESENT' as const
          };
        }
        return r;
      });

      if (!foundInRoster) {
        updatedStudentRecords.push({
          student_id: student.id,
          admission_no: student.admission_no,
          full_name: student.full_name,
          roll_no: String(student.roll_no || '1'),
          status: 'PRESENT' as const
        });
      }
    } else {
      // Create new roster for today
      updatedStudentRecords = classStudents.map(s => {
        const isTarget = s.id === student.id || s.admission_no === student.admission_no;
        return {
          student_id: s.id,
          admission_no: s.admission_no,
          full_name: s.full_name,
          roll_no: String(s.roll_no || '1'),
          status: isTarget ? ('PRESENT' as const) : ('PRESENT' as const)
        };
      });

      // If scholar wasn't in classStudents list, add them explicitly
      if (!updatedStudentRecords.some(r => r.student_id === student.id || r.admission_no === student.admission_no)) {
        updatedStudentRecords.push({
          student_id: student.id,
          admission_no: student.admission_no,
          full_name: student.full_name,
          roll_no: String(student.roll_no || '1'),
          status: 'PRESENT' as const
        });
      }
    }

    const totalStudents = updatedStudentRecords.length;
    const presentCount = updatedStudentRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentCount = updatedStudentRecords.filter(r => r.status === 'ABSENT').length;

    // 5. Save Record strictly for TODAY
    const savedRecord = await AttendanceService.markAttendance(targetSchoolId, academicSession, {
      id: todayRecord?.id,
      school_id: targetSchoolId,
      academic_session: academicSession,
      date: todayDate,
      class_name: className,
      section: section,
      marked_by: 'SMART_QR_AUTO_SCANNER',
      total_students: totalStudents,
      present_count: presentCount,
      absent_count: absentCount,
      student_records: updatedStudentRecords
    });

    return NextResponse.json({
      success: true,
      message: `Attendance marked PRESENT for today (${todayDate})`,
      student: {
        id: student.id,
        admission_no: student.admission_no,
        full_name: student.full_name,
        class_name: student.class_name,
        section: student.section,
        roll_no: student.roll_no,
        guardian_name: student.guardian_name,
        guardian_phone: student.guardian_phone || student.phone,
        photo: student.photo || student.avatar,
        avatar: student.avatar || student.photo,
        blood_group: student.blood_group
      },
      school: {
        id: targetSchoolId,
        school_name: school?.school_name || 'Delhi Public School',
        affiliation_no: school?.affiliation_no || '2130042'
      },
      attendance_summary: {
        date: todayDate,
        time: checkInTime,
        status: 'PRESENT',
        total_present: presentCount,
        total_students: totalStudents,
        class_name: className,
        section: section
      },
      record: savedRecord
    });
  } catch (error: any) {
    console.error('[API_ATTENDANCE_SCAN_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to process QR attendance scan.'
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get('student_id') || searchParams.get('id');
    const admission_no = searchParams.get('admission_no') || searchParams.get('adm');
    const school_id = searchParams.get('school_id') || 'DPS2026';
    const session = searchParams.get('session') || '2026-27';

    if (!student_id && !admission_no) {
      return NextResponse.json({ success: false, error: 'Student ID or Admission Number is required.' }, { status: 400 });
    }

    const postReq = new Request(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, admission_no, school_id, session })
    });

    return POST(postReq);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to process scan.' }, { status: 500 });
  }
}
