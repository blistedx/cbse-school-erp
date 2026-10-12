/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { ScheduledExamItem } from '@/lib/types';
import { requireAuth, requireRole, requirePermission, STAFF_ROLES, ADMIN_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';
import { validateBody, createScheduledExamItemSchema, batchScheduledExamSchema, updateScheduledExamSchema } from '@/lib/validation-schemas';
import { logAuditEvent } from '@/lib/audit-logger';

export async function GET(req: Request) {
  try {
    const auth = await requirePermission(req, 'exams', 'view');
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
    const auth = await requirePermission(req, 'exams', 'add');
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
      let resolvedSchool = 'DPS2026';
      for (const e of exams) {
        const school_id = resolveTenantSchoolId(auth, e.school_id);
        if (school_id instanceof NextResponse) return school_id;
        resolvedSchool = school_id || resolvedSchool;
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

      logAuditEvent({
        schoolId: resolvedSchool,
        userId: auth.userId,
        role: auth.role,
        module: 'EXAMS',
        action: 'BATCH_CREATE',
        severity: 'INFO',
        summary: `Batch scheduled ${inserted.length} examination slots`,
        before: null,
        after: inserted
      });

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

    logAuditEvent({
      schoolId: school_id || 'DPS2026',
      userId: auth.userId,
      role: auth.role,
      module: 'EXAMS',
      action: 'CREATE',
      severity: 'INFO',
      summary: `Scheduled exam "${newExam.title}" (${newExam.class_name}-${newExam.section} ${newExam.subject_name})`,
      targetId: newExam.id,
      targetName: newExam.title,
      before: null,
      after: newExam
    });

    return NextResponse.json({ success: true, exam: inserted[0] });
  } catch (error: any) {
    console.error('[API_EXAMS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requirePermission(req, 'exams', 'edit');
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();
    const validation = validateBody(updateScheduledExamSchema, rawBody);
    if (!validation.success) return validation.response;

    const { id, ...updates } = validation.data;
    const updated = await Database.updateScheduledExam(id, updates);

    logAuditEvent({
      schoolId: auth.schoolId || 'DPS2026',
      userId: auth.userId,
      role: auth.role,
      module: 'EXAMS',
      action: 'UPDATE',
      severity: 'INFO',
      summary: `Updated scheduled exam ID ${id}`,
      targetId: id,
      before: { id },
      after: updates
    });

    return NextResponse.json({ success: updated });
  } catch (error: any) {
    console.error('[API_EXAMS_PATCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requirePermission(req, 'exams', 'delete');
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 });
    }

    const deleted = await Database.deleteScheduledExam(id);

    logAuditEvent({
      schoolId: auth.schoolId || 'DPS2026',
      userId: auth.userId,
      role: auth.role,
      module: 'EXAMS',
      action: 'DELETE',
      severity: 'WARNING',
      summary: `Deleted exam schedule ID ${id}`,
      targetId: id,
      before: { id },
      after: null
    });

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('[API_EXAMS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
