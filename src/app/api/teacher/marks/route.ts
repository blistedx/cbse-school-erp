/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit-logger';
import { ExamMarkRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

function calculateGrade(total: number, max: number): { grade: string; gp: number } {
  if (!max || max <= 0) return { grade: 'E', gp: 0 };
  const pct = (total / max) * 100;
  if (pct >= 91) return { grade: 'A1', gp: 10 };
  if (pct >= 81) return { grade: 'A2', gp: 9 };
  if (pct >= 71) return { grade: 'B1', gp: 8 };
  if (pct >= 61) return { grade: 'B2', gp: 7 };
  if (pct >= 51) return { grade: 'C1', gp: 6 };
  if (pct >= 41) return { grade: 'C2', gp: 5 };
  if (pct >= 33) return { grade: 'D', gp: 4 };
  return { grade: 'E', gp: 0 };
}

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

    // 1. Get Teacher Allocations
    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    const allExams = await Database.getExams(tenant, session);

    // If query parameters not provided, return available exams and teacher's allocated subjects
    if (!examId || !className || !subjectName) {
      return NextResponse.json({
        success: true,
        exams: allExams.map(e => ({
          id: e.id,
          name: (e as any).name || e.title || 'Scheduled Assessment',
          title: e.title || (e as any).name || 'Scheduled Assessment',
          type: e.type || 'SCHOOL_EXAM',
          class_name: e.class_name,
          section: e.section,
          subject_name: e.subject_name,
          max_marks: e.max_marks,
          pass_marks: e.pass_marks,
          date: e.date,
          time: e.time,
          status: e.status,
          is_locked: (e as any).is_locked || false,
          deadline: (e as any).marks_entry_deadline
        })),
        allocated_subjects: assignments.allocatedSubjects
      });
    }

    // 2. Strict Security: Verify the teacher is allocated to this class-subject-section
    const isAllocated = assignments.allocatedSubjects.some(alloc => 
      isSameClass(alloc.class_name, className) &&
      (alloc.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      alloc.subject_name.toLowerCase().trim() === subjectName.toLowerCase().trim()
    );

    if (!isAllocated && userRole === 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: `Access Denied: You are not authorized to access marks entry for ${className}-${section} (${subjectName}). You may only enter marks for your allocated subjects.`
      }, { status: 403 });
    }

    // 3. Get students in this class-section
    const allStudents = await Database.getStudents(tenant, session);
    const classStudents = allStudents.filter(s => 
      isSameClass(s.class_name, className) &&
      (s.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      s.status === 'ACTIVE'
    ).sort((a, b) => Number(a.roll_no || 999) - Number(b.roll_no || 999));

    // 4. Fetch existing marks for this exam and class
    const existingMarks = await Database.getExamMarks(tenant, session, examId, className);
    const subjectMarks = existingMarks.filter(m => 
      (m.section || 'A').toUpperCase().trim() === section.toUpperCase().trim() &&
      m.subject_name.toLowerCase().trim() === subjectName.toLowerCase().trim()
    );

    const targetExam = allExams.find(e => e.id === examId);
    const isLocked = (targetExam as any)?.is_locked || false;

    // Resolve max marks from class subjects definition if available
    const classes = await Database.getClasses(tenant);
    const targetClass = classes.find(c => isSameClass(c.class_name, className));
    const targetSubject = targetClass?.subjects?.find(s => s.name.toLowerCase().trim() === subjectName.toLowerCase().trim());
    const defaultMaxMarks = targetSubject?.max_marks || (targetExam as any)?.max_marks || 100;

    const studentRows = classStudents.map(s => {
      const mark = subjectMarks.find(m => m.student_id === s.id);
      return {
        student_id: s.id,
        student_name: s.full_name,
        admission_no: s.admission_no,
        roll_no: s.roll_no || '',
        theory_marks: mark ? mark.theory_marks : 0,
        practical_marks: mark ? mark.practical_marks : 0,
        total_marks: mark ? mark.total_marks : 0,
        max_marks: mark ? mark.max_marks : defaultMaxMarks,
        grade: mark ? mark.grade : '--',
        attendance_status: mark?.attendance_status || 'PRESENT',
        remarks: mark?.remarks || '',
        is_saved: !!mark
      };
    });

    return NextResponse.json({
      success: true,
      exam: targetExam,
      class_name: className,
      section,
      subject_name: subjectName,
      max_marks: defaultMaxMarks,
      is_locked: isLocked,
      students: studentRows
    });
  } catch (error: any) {
    console.error('[API_TEACHER_MARKS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve marks sheet.' }, { status: 500 });
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
    const { exam_id, class_name, section, subject_name, max_marks, records, is_draft } = body;

    if (!exam_id || !class_name || !subject_name || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: 'Missing required exam or student mark records.' }, { status: 400 });
    }

    // 1. Strict Security: Verify Teacher is allocated to this class-subject-section
    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    const isAllocated = assignments.allocatedSubjects.some(alloc => 
      isSameClass(alloc.class_name, class_name) &&
      (alloc.section || 'A').toUpperCase().trim() === (section || 'A').toUpperCase().trim() &&
      alloc.subject_name.toLowerCase().trim() === subject_name.toLowerCase().trim()
    );

    if (!isAllocated && userRole === 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: `Security Violation: You are not assigned to teach ${class_name}-${section} (${subject_name}). Marks entry rejected.`
      }, { status: 403 });
    }

    // 2. Check if Exam is locked
    const allExams = await Database.getExams(tenant, session);
    const targetExam = allExams.find(e => e.id === exam_id);
    if ((targetExam as any)?.is_locked) {
      return NextResponse.json({
        success: false,
        error: 'Marks entry is locked by administration for this exam. No further edits permitted.'
      }, { status: 403 });
    }

    const defaultMaxMarks = Number(max_marks) || 100;

    // 3. Build & Validate Records
    const marksToSave: ExamMarkRecord[] = [];
    for (const r of records) {
      const theory = Number(r.theory_marks) || 0;
      const practical = Number(r.practical_marks) || 0;
      const total = r.attendance_status === 'ABSENT' || r.attendance_status === 'EXEMPT' ? 0 : (theory + practical);
      const studentMax = Number(r.max_marks) || defaultMaxMarks;

      if (total > studentMax) {
        return NextResponse.json({
          success: false,
          error: `Marks validation error: Student ${r.student_name || r.student_id} total marks (${total}) exceeds maximum allowed (${studentMax}).`
        }, { status: 400 });
      }

      const { grade, gp } = calculateGrade(total, studentMax);

      marksToSave.push({
        id: `MK-${exam_id}-${r.student_id}-${subject_name.replace(/\s+/g, '')}`,
        school_id: tenant,
        academic_session: session,
        exam_id,
        class_name,
        section: section || 'A',
        student_id: r.student_id,
        student_name: r.student_name || '',
        roll_no: r.roll_no || '',
        subject_name,
        theory_marks: theory,
        practical_marks: practical,
        total_marks: total,
        max_marks: studentMax,
        grade,
        gp,
        attendance_status: r.attendance_status || 'PRESENT',
        remarks: (r.remarks || '').trim(),
        graded_by: assignments.teacher.full_name,
        updated_at: new Date().toISOString()
      });
    }

    const savedMarks = await Database.saveExamMarks(marksToSave);

    if (!is_draft) {
      try {
        await Database.updateScheduledExam(exam_id, { status: 'MARKS_FILLED' });
      } catch (e) {
        console.warn('[SyncMarksStatus] Note:', e);
      }
    }

    logAuditEvent({
      actor: { id: assignments.teacher.id, name: assignments.teacher.full_name, role: 'TEACHER' },
      module: 'EXAMS',
      action: is_draft ? 'MARKS_DRAFT_SAVED' : 'MARKS_SUBMITTED',
      severity: 'INFO',
      summary: `Marks ${is_draft ? 'draft saved' : 'submitted'} by ${assignments.teacher.full_name} for ${class_name}-${section} ${subject_name} (${records.length} scholars)`,
      targetId: exam_id,
      school_id: tenant,
      session,
      details: { class_name, section, subject_name, exam_id, recordsCount: records.length, isDraft: !!is_draft }
    });

    return NextResponse.json({
      success: true,
      message: `Marks successfully ${is_draft ? 'saved as draft' : 'submitted and recorded'} for ${records.length} scholars.`,
      count: savedMarks.length
    });
  } catch (error: any) {
    console.error('[API_TEACHER_MARKS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record marks entry.' }, { status: 500 });
  }
}
