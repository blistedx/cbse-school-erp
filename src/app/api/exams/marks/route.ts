/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, STAFF_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';
import { validateBody, batchSaveExamMarksSchema } from '@/lib/validation-schemas';
import { logAuditEvent } from '@/lib/audit-logger';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const school_id = resolveTenantSchoolId(auth, requestedSchoolId);
    if (school_id instanceof NextResponse) return school_id;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const exam_id = searchParams.get('exam_id') || searchParams.get('examId') || undefined;
    const class_name = searchParams.get('class_name') || searchParams.get('className') || undefined;
    const student_id = searchParams.get('student_id') || searchParams.get('studentId') || undefined;

    const marks = await Database.getExamMarks(school_id, session, exam_id, class_name, student_id);
    return NextResponse.json({ success: true, count: marks.length, marks });
  } catch (error: any) {
    console.error('[API_EXAMS_MARKS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, STAFF_ROLES);
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();

    const validation = validateBody(batchSaveExamMarksSchema, rawBody);
    if (!validation.success) return validation.response;
    const { marks } = validation.data;

    // Apply tenant school_id and author
    const tenantMarks = [];
    for (const m of marks) {
      const school_id = resolveTenantSchoolId(auth, m.school_id);
      if (school_id instanceof NextResponse) return school_id;
      tenantMarks.push({
        ...m,
        school_id: school_id || 'DPS2026',
        graded_by: auth.username || auth.role
      });
    }

    const saved = await Database.saveExamMarks(tenantMarks);

    // If teacher or staff, log audit event
    if (saved.length > 0) {
      const sample = saved[0];
      logAuditEvent({
        actor: {
          id: auth.userId || auth.username,
          name: auth.username || 'Assigned Faculty',
          role: auth.role
        },
        module: 'EXAMINATION',
        action: 'MARKS_SUBMITTED',
        summary: `Submitted marks for ${sample.class_name} - Section ${sample.section} (${sample.subject_name}, ${saved.length} scholar records)`,
        details: {
          class_name: sample.class_name,
          section: sample.section,
          subject_name: sample.subject_name,
          exam_id: sample.exam_id,
          count: saved.length
        },
        targetId: sample.exam_id,
        targetName: `${sample.class_name} - ${sample.subject_name}`,
        school_id: sample.school_id,
        session: sample.academic_session
      });
    }

    return NextResponse.json({ success: true, count: saved.length, marks: saved });
  } catch (error: any) {
    console.error('[API_EXAMS_MARKS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
