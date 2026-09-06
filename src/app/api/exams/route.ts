/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { ScheduledExamItem } from '@/lib/types';
import { requireAuth, requireRole, STAFF_ROLES, ADMIN_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';
import { validateBody, createScheduledExamItemSchema, batchScheduledExamSchema, updateScheduledExamSchema } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const school_id = resolveTenantSchoolId(auth, requestedSchoolId);
    if (school_id instanceof NextResponse) return school_id;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const class_name = searchParams.get('class_name') || searchParams.get('className') || undefined;
    const type = searchParams.get('type') || undefined;

    const exams = await Database.getScheduledExams(school_id, session, class_name, type);
    return NextResponse.json({ success: true, count: exams.length, exams });
  } catch (error: any) {
    console.error('[API_EXAMS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, STAFF_ROLES);
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();

    // 1. Array of exams to batch insert
    if (Array.isArray(rawBody?.exams)) {
      const validation = validateBody(batchScheduledExamSchema, rawBody);
      if (!validation.success) return validation.response;
      const { exams } = validation.data;

      // Check permissions for teacher
      if (auth.role === 'TEACHER') {
        const hasSchoolExam = exams.some(e => e.type === 'SCHOOL_EXAM');
        if (hasSchoolExam) {
          return NextResponse.json({
            success: false,
            error: 'Access Denied: Teachers can only schedule classroom tests and unit quizzes. Official School Examinations must be scheduled by School Administration.'
          }, { status: 403 });
        }
      }

      // Force tenant isolation
      const tenantExams: ScheduledExamItem[] = [];
      for (const e of exams) {
        const school_id = resolveTenantSchoolId(auth, e.school_id);
        if (school_id instanceof NextResponse) return school_id;
        tenantExams.push({
          id: e.id || `ex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          school_id: school_id || 'DPS2026',
          academic_session: e.academic_session || '2026-27',
          title: e.title,
          type: e.type || 'CLASS_TEST',
          class_name: e.class_name,
          section: e.section || 'A',
          subject_name: e.subject_name,
          subject_code: e.subject_code || 'CORE',
          date: e.date || new Date().toISOString().split('T')[0],
          time: e.time || '09:30 AM',
          max_marks: Number(e.max_marks) || 20,
          pass_marks: Number(e.pass_marks) || Math.ceil((Number(e.max_marks) || 20) * 0.33),
          status: e.status || 'PENDING',
          created_at: new Date().toISOString()
        });
      }

      const inserted = await Database.createScheduledExams(tenantExams);
      return NextResponse.json({ success: true, count: inserted.length, exams: inserted });
    }

    // 2. Single exam insertion
    const validation = validateBody(createScheduledExamItemSchema, rawBody);
    if (!validation.success) return validation.response;
    const body = validation.data;

    // 🔒 RESTRICTION: Teachers can ONLY schedule classroom tests and unit quizzes (CLASS_TEST).
    if (auth.role === 'TEACHER' && body.type === 'SCHOOL_EXAM') {
      return NextResponse.json({
        success: false,
        error: 'Access Denied: Teachers can only schedule classroom tests and unit quizzes. Official School Examinations must be scheduled by School Administration.'
      }, { status: 403 });
    }

    const school_id = resolveTenantSchoolId(auth, body.school_id);
    if (school_id instanceof NextResponse) return school_id;

    const newExam: ScheduledExamItem = {
      id: body.id || `ex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      school_id: school_id || 'DPS2026',
      academic_session: body.academic_session || '2026-27',
      title: body.title,
      type: body.type || 'CLASS_TEST',
      class_name: body.class_name,
      section: body.section || 'A',
      subject_name: body.subject_name,
      subject_code: body.subject_code || 'CORE',
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || '09:30 AM',
      max_marks: Number(body.max_marks) || 20,
      pass_marks: Number(body.pass_marks) || Math.ceil((Number(body.max_marks) || 20) * 0.33),
      status: body.status || 'PENDING',
      created_at: new Date().toISOString()
    };

    const inserted = await Database.createScheduledExams([newExam]);
    return NextResponse.json({ success: true, exam: inserted[0] });
  } catch (error: any) {
    console.error('[API_EXAMS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();
    const validation = validateBody(updateScheduledExamSchema, rawBody);
    if (!validation.success) return validation.response;

    const { id, ...updates } = validation.data;
    const updated = await Database.updateScheduledExam(id, updates);
    return NextResponse.json({ success: updated });
  } catch (error: any) {
    console.error('[API_EXAMS_PATCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 });
    }

    const deleted = await Database.deleteScheduledExam(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('[API_EXAMS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
