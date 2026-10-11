/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit-logger';

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
    const examId = searchParams.get('exam_id');

    // 1. Verify Class Teacher Assignment
    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You are not assigned as a Class Teacher.'
      }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;

    // Available exams
    const allExams = await Database.getExams(tenant, session);
    const targetExam = examId ? allExams.find(e => e.id === examId) : allExams[0];

    // Class subjects
    const classes = await Database.getClasses(tenant);
    const myClassDoc = classes.find(c => isSameClass(c.class_name, class_name));
    const subjects = myClassDoc?.subjects || [];

    // Class students
    const allStudents = await Database.getStudents(tenant, session);
    const myStudents = allStudents.filter(s => 
      isSameClass(s.class_name, class_name) &&
      (s.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      s.status === 'ACTIVE'
    ).sort((a, b) => Number(a.roll_no || 999) - Number(b.roll_no || 999));

    // Fetch marks for this exam and class
    const examMarks = targetExam ? await Database.getExamMarks(tenant, session, targetExam.id, class_name) : [];
    const sectionMarks = examMarks.filter(m => (m.section || 'A').toUpperCase().trim() === section.toUpperCase().trim());

    // Fetch report card remarks
    const remarks = await Database.getReportCardRemarks(tenant, session);

    // Build consolidated sheet
    const consolidatedRows = myStudents.map(student => {
      const studentMarks = sectionMarks.filter(m => m.student_id === student.id);
      const studentRemarks = remarks.find(r => r.student_id === student.id && (!r.exam_id || r.exam_id === targetExam?.id));

      const subjectMarksMap: Record<string, { total_marks: number; max_marks: number; grade: string; is_absent: boolean }> = {};
      let totalObtained = 0;
      let totalMax = 0;

      for (const subj of subjects) {
        const mark = studentMarks.find(m => m.subject_name.toLowerCase().trim() === subj.name.toLowerCase().trim());
        if (mark) {
          const isAbsent = mark.attendance_status === 'ABSENT';
          const tot = isAbsent ? 0 : Number(mark.total_marks) || 0;
          const max = Number(mark.max_marks) || 100;
          subjectMarksMap[subj.name] = {
            total_marks: tot,
            max_marks: max,
            grade: mark.grade || '--',
            is_absent: isAbsent
          };
          totalObtained += tot;
          totalMax += max;
        } else {
          subjectMarksMap[subj.name] = {
            total_marks: 0,
            max_marks: subj.max_marks || 100,
            grade: '--',
            is_absent: false
          };
          totalMax += (subj.max_marks || 100);
        }
      }

      const percent = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;

      return {
        student_id: student.id,
        admission_no: student.admission_no,
        student_name: student.full_name,
        roll_no: student.roll_no || '',
        subjects: subjectMarksMap,
        total_obtained: totalObtained,
        total_max: totalMax,
        percentage: percent,
        conduct: studentRemarks?.conduct || 'Good',
        attendance_remark: studentRemarks?.attendance_remark || 'Regular & Punctual',
        class_teacher_remark: studentRemarks?.class_teacher_remark || ''
      };
    });

    return NextResponse.json({
      success: true,
      class_name,
      section,
      exams: allExams.map(e => ({ id: e.id, name: e.name, date: e.date })),
      active_exam: targetExam,
      subjects: subjects.map(s => ({ name: s.name, code: s.code, max_marks: s.max_marks || 100 })),
      consolidated_sheet: consolidatedRows
    });
  } catch (error: any) {
    console.error('[API_CLASS_REPORT_CARD_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to assemble consolidated report card sheet.' }, { status: 500 });
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
    const { student_id, exam_id, conduct, attendance_remark, class_teacher_remark } = body;

    if (!student_id || !class_teacher_remark) {
      return NextResponse.json({ success: false, error: 'Student ID and class teacher remark are required.' }, { status: 400 });
    }

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({ success: false, error: 'Access Denied: Class teacher privileges required.' }, { status: 403 });
    }

    const saved = await Database.saveReportCardRemark({
      id: body.id,
      school_id: tenant,
      academic_session: session,
      student_id,
      exam_id,
      conduct: conduct || 'Good',
      attendance_remark: attendance_remark || 'Regular & Punctual',
      class_teacher_remark: class_teacher_remark.trim(),
      updated_by_teacher_id: assignments.teacher.id,
      updated_at: new Date().toISOString()
    });

    logAuditEvent({
      actor: { id: assignments.teacher.id, name: assignments.teacher.full_name, role: 'TEACHER' },
      module: 'EXAMS',
      action: 'REPORT_CARD_REMARK_SAVED',
      severity: 'INFO',
      summary: `Class teacher saved report card remarks for scholar ${student_id}`,
      targetId: student_id,
      school_id: tenant,
      session,
      details: { conduct, remark: class_teacher_remark }
    });

    return NextResponse.json({
      success: true,
      message: 'Report card remarks recorded successfully.',
      remark: saved
    });
  } catch (error: any) {
    console.error('[API_CLASS_REPORT_CARD_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record report card remark.' }, { status: 500 });
  }
}
