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
    const className = searchParams.get('class_name');
    const section = searchParams.get('section') || 'A';
    const subjectName = searchParams.get('subject_name');

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    const allExams = await Database.getExams(tenant, session);

    // If query not specified, provide filter options
    if (!examId || !className || !subjectName) {
      return NextResponse.json({
        success: true,
        exams: allExams.map(e => ({ id: e.id, name: e.name })),
        allocated_subjects: assignments.allocatedSubjects
      });
    }

    // Verify teacher is allocated
    const isAllocated = assignments.allocatedSubjects.some(alloc => 
      isSameClass(alloc.class_name, className) &&
      (alloc.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      alloc.subject_name.toLowerCase().trim() === subjectName.toLowerCase().trim()
    );

    if (!isAllocated && userRole === 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: You may only view subject performance reports for your allocated subjects.'
      }, { status: 403 });
    }

    // Fetch marks for this class, exam, and subject
    const allMarks = await Database.getExamMarks(tenant, session, examId, className);
    const subjectMarks = allMarks.filter(m => 
      (m.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      m.subject_name.toLowerCase().trim() === subjectName.toLowerCase().trim()
    );

    if (subjectMarks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No marks recorded yet for this exam and subject.',
        stats: {
          total_students: 0,
          appeared: 0,
          absent: 0,
          average: 0,
          highest: 0,
          lowest: 0,
          pass_percent: 0,
          toppers: [],
          weak_students: [],
          grade_distribution: {}
        },
        records: []
      });
    }

    const appearedMarks = subjectMarks.filter(m => m.attendance_status !== 'ABSENT' && m.attendance_status !== 'EXEMPT');
    const absentCount = subjectMarks.length - appearedMarks.length;

    const scores = appearedMarks.map(m => Number(m.total_marks) || 0);
    const maxScores = appearedMarks.map(m => Number(m.max_marks) || 100);

    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = scores.length > 0 ? Number((sum / scores.length).toFixed(1)) : 0;

    const passing = appearedMarks.filter(m => {
      const max = Number(m.max_marks) || 100;
      return (Number(m.total_marks) / max) >= 0.33;
    });
    const passPercent = scores.length > 0 ? Number(((passing.length / scores.length) * 100).toFixed(1)) : 0;

    // Weak students (< 40%)
    const weakStudents = appearedMarks.filter(m => {
      const max = Number(m.max_marks) || 100;
      return (Number(m.total_marks) / max) < 0.40;
    }).map(m => ({
      student_id: m.student_id,
      student_name: m.student_name,
      roll_no: m.roll_no,
      total_marks: m.total_marks,
      max_marks: m.max_marks,
      percent: Math.round((Number(m.total_marks) / (Number(m.max_marks) || 100)) * 100),
      grade: m.grade
    }));

    // Top 3 Toppers
    const toppers = [...appearedMarks]
      .sort((a, b) => Number(b.total_marks) - Number(a.total_marks))
      .slice(0, 3)
      .map(m => ({
        student_id: m.student_id,
        student_name: m.student_name,
        roll_no: m.roll_no,
        total_marks: m.total_marks,
        max_marks: m.max_marks,
        grade: m.grade
      }));

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    for (const m of appearedMarks) {
      const g = m.grade || 'NA';
      gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      exam_name: allExams.find(e => e.id === examId)?.name || examId,
      class_name: className,
      section,
      subject_name: subjectName,
      stats: {
        total_students: subjectMarks.length,
        appeared: appearedMarks.length,
        absent: absentCount,
        average,
        highest,
        lowest,
        pass_percent: passPercent,
        toppers,
        weak_students: weakStudents,
        grade_distribution: gradeDistribution
      },
      records: subjectMarks
    });
  } catch (error: any) {
    console.error('[API_TEACHER_REPORTS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to generate performance report.' }, { status: 500 });
  }
}
