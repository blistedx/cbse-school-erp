/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { SyllabusPlan } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const className = searchParams.get('class_name') || undefined;
    const subjectName = searchParams.get('subject_name') || undefined;
    const month = searchParams.get('month') || undefined;

    const plans = await Database.getSyllabusPlans(tenant, session, className, subjectName, month);

    return NextResponse.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error: any) {
    console.error('[API_ADMIN_SYLLABUS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve syllabus plans.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (tenant instanceof NextResponse) return tenant;

    const { action, copy_to_classes } = body;
    const session = body.academic_session || '2026-27';

    // Handle Copy to Other Classes
    if (action === 'copy_to_classes' && Array.isArray(copy_to_classes) && body.plan) {
      const sourcePlan = body.plan as SyllabusPlan;
      for (const targetClass of copy_to_classes) {
        await Database.saveSyllabusPlan({
          ...sourcePlan,
          id: `SYL-${targetClass.replace(/\s+/g, '')}-${sourcePlan.subject_name.replace(/\s+/g, '')}-${sourcePlan.month}`,
          school_id: tenant,
          academic_session: session,
          class_name: targetClass,
          topics: (sourcePlan.topics || []).map(t => ({
            ...t,
            id: `TOPIC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          }))
        });
      }

      return NextResponse.json({
        success: true,
        message: `Syllabus copied successfully to ${copy_to_classes.length} classes.`
      });
    }

    // Standard Create / Update Plan
    const { id, class_name, subject_name, month, month_order, topics } = body;

    if (!class_name || !subject_name || !month) {
      return NextResponse.json({ success: false, error: 'Class, subject, and month are required.' }, { status: 400 });
    }

    const saved = await Database.saveSyllabusPlan({
      id: id || `SYL-${class_name.replace(/\s+/g, '')}-${subject_name.replace(/\s+/g, '')}-${month}`,
      school_id: tenant,
      academic_session: session,
      class_name,
      subject_name,
      month,
      month_order: Number(month_order) || 1,
      topics: Array.isArray(topics) ? topics.map((t: any, idx: number) => ({
        id: t.id || `TOPIC-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        chapter_no: t.chapter_no || idx + 1,
        chapter_title: t.chapter_title || `Chapter ${idx + 1}`,
        topic_title: t.topic_title || `Topic ${idx + 1}`,
        description: t.description || '',
        planned_periods: Number(t.planned_periods) || 4,
        target_date: t.target_date,
        order: Number(t.order) || idx + 1
      })) : []
    });

    logAuditEvent({
      actor: { id: auth.userId, name: auth.name || 'Admin', role: auth.role },
      module: 'SYSTEM',
      action: 'SYLLABUS_PLAN_SAVED',
      severity: 'INFO',
      summary: `Admin saved syllabus plan for ${class_name} ${subject_name} (${month})`,
      targetId: saved.id,
      school_id: tenant,
      session,
      details: { class_name, subject_name, month, topicsCount: saved.topics.length }
    });

    return NextResponse.json({
      success: true,
      message: 'Syllabus plan saved successfully.',
      plan: saved
    });
  } catch (error: any) {
    console.error('[API_ADMIN_SYLLABUS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to save syllabus plan.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Plan ID required.' }, { status: 400 });

    await Database.deleteSyllabusPlan(id);

    return NextResponse.json({ success: true, message: 'Syllabus plan deleted.' });
  } catch (error: any) {
    console.error('[API_ADMIN_SYLLABUS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete syllabus plan.' }, { status: 500 });
  }
}
