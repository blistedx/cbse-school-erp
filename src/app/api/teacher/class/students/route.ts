/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
import { AttendanceService } from '@/lib/services/attendance.service';
import { FeesService } from '@/lib/services/fees.service';

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
    const studentId = searchParams.get('student_id');
    const reqClass = searchParams.get('class_name') || searchParams.get('class');
    const reqSection = searchParams.get('section');

    // 1. Resolve Teacher Assignments with fallback
    let assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      const teachers = await Database.getTeachers(tenant);
      const matched = teachers.find(t => 
        (t.staff_code && t.staff_code.toUpperCase() === (auth.userId || '').toUpperCase()) ||
        (t.id && t.id.toUpperCase() === (auth.userId || '').toUpperCase()) ||
        (t.email && t.email.toLowerCase() === (auth.userId || '').toLowerCase())
      );
      if (matched) {
        assignments = await Database.getTeacherAssignments(tenant, matched.id);
      }
    }

    // Determine available classes for this teacher or admin
    const allClasses = await Database.getClasses(tenant);
    const isSuperOrAdmin = ['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN', 'PRINCIPAL', 'ADMIN'].includes(userRole);

    let targetClassName = '';
    let targetSection = 'A';
    const availableClasses: Array<{ class_name: string; section: string; is_class_teacher: boolean; label: string }> = [];

    if (assignments?.isClassTeacher && assignments.classTeacherSection) {
      availableClasses.push({
        class_name: assignments.classTeacherSection.class_name,
        section: assignments.classTeacherSection.section,
        is_class_teacher: true,
        label: `${assignments.classTeacherSection.class_name}-${assignments.classTeacherSection.section} (Class Teacher)`
      });
      targetClassName = assignments.classTeacherSection.class_name;
      targetSection = assignments.classTeacherSection.section;
    }

    if (Array.isArray(assignments?.allocatedSubjects)) {
      assignments.allocatedSubjects.forEach(s => {
        const exists = availableClasses.some(
          ac => isSameClass(ac.class_name, s.class_name) && ac.section.toUpperCase() === s.section.toUpperCase()
        );
        if (!exists) {
          availableClasses.push({
            class_name: s.class_name,
            section: s.section,
            is_class_teacher: false,
            label: `${s.class_name}-${s.section} (${s.subject_name || 'Subject'})`
          });
        }
      });
    }

    // If superadmin or admin, or if teacher has no specific class, add all school classes
    if (isSuperOrAdmin || availableClasses.length === 0) {
      allClasses.forEach(c => {
        const exists = availableClasses.some(
          ac => isSameClass(ac.class_name, c.class_name) && ac.section.toUpperCase() === (c.section || 'A').toUpperCase()
        );
        if (!exists) {
          availableClasses.push({
            class_name: c.class_name,
            section: c.section || 'A',
            is_class_teacher: false,
            label: `${c.class_name}-${c.section || 'A'}`
          });
        }
      });
    }

    // Override with requested class if provided and valid
    if (reqClass) {
      targetClassName = reqClass;
      targetSection = reqSection || 'A';
    } else if (!targetClassName && availableClasses.length > 0) {
      targetClassName = availableClasses[0].class_name;
      targetSection = availableClasses[0].section;
    }

    if (!targetClassName) {
      targetClassName = 'Class 10';
      targetSection = 'A';
    }

    const class_name = targetClassName;
    const section = targetSection;

    // 2. Fetch all students in class
    const allStudents = await Database.getStudents(tenant, session);
    const myStudents = allStudents.filter(s => 
      isSameClass(s.class_name, class_name) &&
      (s.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      s.status === 'ACTIVE'
    ).sort((a, b) => Number(a.roll_no || 999) - Number(b.roll_no || 999));

    // If single student dossier requested:
    if (studentId) {
      const targetStudent = myStudents.find(s => s.id === studentId);
      if (!targetStudent) {
        return NextResponse.json({
          success: false,
          error: 'Scholar not found in your assigned class.'
        }, { status: 404 });
      }

      // Unified attendance summary
      const attSummary = await AttendanceService.getStudentAttendance(tenant, targetStudent.id, session);

      // Unified fee status (read-only)
      const feeSummary = await FeesService.getStudentFeeSummary(tenant, targetStudent.id, session);

      // Marks summary
      const marksRecords = await Database.getExamMarks(tenant, session, undefined, class_name, targetStudent.id);

      // Behavior remarks
      const remarks = await Database.getStudentRemarks(tenant, class_name, section, targetStudent.id);

      return NextResponse.json({
        success: true,
        student: {
          ...targetStudent,
          attendance_percent: attSummary?.attendancePercent || targetStudent.attendance_percent || 0,
          attendance_summary: attSummary,
          fee_summary: {
            total_receivable: feeSummary?.total_receivable || 0,
            total_collected: feeSummary?.total_collected || 0,
            total_pending: feeSummary?.total_pending || 0,
            fee_status: feeSummary?.status || targetStudent.fee_status || 'PAID'
          },
          marks: marksRecords,
          remarks
        }
      });
    }

    // Return list with high-level metrics for all students in class
    const studentRoster = await Promise.all(
      myStudents.map(async s => {
        let attPct = s.attendance_percent || 0;
        let feePending = 0;
        let feeStatus = s.fee_status || 'PAID';

        try {
          const fee = await FeesService.getStudentFeeSummary(tenant, s.id, session);
          if (fee) {
            feePending = fee.total_pending || 0;
            feeStatus = fee.status || 'PAID';
          }
        } catch {}

        try {
          const att = await AttendanceService.getStudentAttendance(tenant, s.id, session);
          if (att) attPct = att.attendancePercent;
        } catch {}

        return {
          id: s.id,
          admission_no: s.admission_no,
          full_name: s.full_name,
          roll_no: s.roll_no || '',
          gender: s.gender || 'Not specified',
          guardian_name: s.guardian_name || (s as any).father_name || '',
          guardian_phone: s.guardian_phone || (s as any).parent_phone || (s as any).phone || '',
          guardian_email: (s as any).guardian_email || '',
          attendance_percent: attPct,
          fee_status: feeStatus,
          fee_pending_amount: feePending,
          avatar: s.avatar || s.photo || ''
        };
      })
    );

    return NextResponse.json({
      success: true,
      class_name,
      section,
      available_classes: availableClasses,
      total_students: studentRoster.length,
      students: studentRoster
    });
  } catch (error: any) {
    console.error('[API_CLASS_STUDENTS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve class scholars roster.' }, { status: 500 });
  }
}
