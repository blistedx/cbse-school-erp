/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';

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

    const allExams = await Database.getExams(tenant, session);
    const targetExam = examId ? allExams.find(e => e.id === examId) : allExams[0];

    if (!targetExam) {
      return NextResponse.json({
        success: true,
        exams: allExams.map(e => ({ id: e.id, name: e.name })),
        message: 'No exams scheduled yet.'
      });
    }

    // Fetch marks
    const examMarks = await Database.getExamMarks(tenant, session, targetExam.id, class_name);
    const sectionMarks = examMarks.filter(m => (m.section || 'A').toUpperCase().trim() === section.toUpperCase().trim());

    // Fetch students
    const allStudents = await Database.getStudents(tenant, session);
    const myStudents = allStudents.filter(s => 
      isSameClass(s.class_name, class_name) &&
      (s.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      s.status === 'ACTIVE'
    );

    // Group marks by student
    const studentAggregates: any[] = [];
    for (const student of myStudents) {
      const marks = sectionMarks.filter(m => m.student_id === student.id && m.attendance_status !== 'ABSENT');
      const totalObtained = marks.reduce((acc, curr) => acc + (Number(curr.total_marks) || 0), 0);
      const totalMax = marks.reduce((acc, curr) => acc + (Number(curr.max_marks) || 100), 0);
      const pct = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
      const isFailing = marks.some(m => ((Number(m.total_marks) || 0) / (Number(m.max_marks) || 100)) < 0.33);

      studentAggregates.push({
        student_id: student.id,
        admission_no: student.admission_no,
        student_name: student.full_name,
        roll_no: student.roll_no || '',
        total_obtained: totalObtained,
        total_max: totalMax,
        percentage: pct,
        is_failing: isFailing,
        subjects_appeared: marks.length
      });
    }

    const appearedStudents = studentAggregates.filter(s => s.subjects_appeared > 0);
    const totalClassPct = appearedStudents.reduce((acc, curr) => acc + curr.percentage, 0);
    const classAverage = appearedStudents.length > 0 ? Number((totalClassPct / appearedStudents.length).toFixed(1)) : 0;

    // Toppers
    const toppers = [...appearedStudents]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    // Failing students
    const failingStudents = appearedStudents.filter(s => s.is_failing || s.percentage < 33);

    // Subject-wise comparison
    const subjectsMap = new Map<string, { totalMarks: number; maxMarks: number; count: number; passCount: number }>();
    for (const m of sectionMarks) {
      if (m.attendance_status === 'ABSENT' || m.attendance_status === 'EXEMPT') continue;
      const sName = m.subject_name;
      const cur = subjectsMap.get(sName) || { totalMarks: 0, maxMarks: 0, count: 0, passCount: 0 };
      const tot = Number(m.total_marks) || 0;
      const max = Number(m.max_marks) || 100;
      cur.totalMarks += tot;
      cur.maxMarks += max;
      cur.count += 1;
      if ((tot / max) >= 0.33) cur.passCount += 1;
      subjectsMap.set(sName, cur);
    }

    const subjectComparison: any[] = [];
    subjectsMap.forEach((val, name) => {
      const avg = val.count > 0 ? Number((val.totalMarks / val.count).toFixed(1)) : 0;
      const passPct = val.count > 0 ? Number(((val.passCount / val.count) * 100).toFixed(1)) : 0;
      subjectComparison.push({
        subject_name: name,
        students_evaluated: val.count,
        subject_average: avg,
        pass_percent: passPct
      });
    });

    return NextResponse.json({
      success: true,
      class_name,
      section,
      exams: allExams.map(e => ({ id: e.id, name: e.name })),
      active_exam: { id: targetExam.id, name: targetExam.name },
      stats: {
        total_students: myStudents.length,
        evaluated_students: appearedStudents.length,
        class_average: classAverage,
        toppers,
        failing_students: failingStudents,
        pass_percent: appearedStudents.length > 0 ? Number((((appearedStudents.length - failingStudents.length) / appearedStudents.length) * 100).toFixed(1)) : 0
      },
      subject_comparison: subjectComparison,
      scholars: studentAggregates
    });
  } catch (error: any) {
    console.error('[API_CLASS_RESULTS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to compute class result analysis.' }, { status: 500 });
  }
}
