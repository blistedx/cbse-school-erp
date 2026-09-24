/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, STAFF_ROLES, ADMIN_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';
import { validateBody, createReportCardTemplateSchema, updateReportCardTemplateSchema } from '@/lib/validation-schemas';
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
    const class_name = searchParams.get('class_name') || searchParams.get('className') || undefined;
    const id = searchParams.get('id') || undefined;

    if (id) {
      const template = await Database.getReportCardTemplateById(id);
      if (!template) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, template });
    }

    const templates = await Database.getReportCardTemplates(school_id, session, class_name);
    return NextResponse.json({ success: true, count: templates.length, templates });
  } catch (error: any) {
    console.error('[API_REPORT_CARD_TEMPLATES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();

    const validation = validateBody(createReportCardTemplateSchema, rawBody);
    if (!validation.success) return validation.response;
    const body = validation.data;

    const school_id = resolveTenantSchoolId(auth, body.school_id);
    if (school_id instanceof NextResponse) return school_id;

    // Validate weightage sum
    const totalWeightage = (body.selected_exams || []).reduce((acc, ex) => acc + (Number(ex.weightage_percent) || 0), 0);
    if (Math.round(totalWeightage) !== 100) {
      return NextResponse.json({
        success: false,
        error: `Total assessment weightage must equal exactly 100%. Current sum: ${totalWeightage}%`
      }, { status: 400 });
    }

    const saved = await Database.saveReportCardTemplate({
      ...body,
      school_id: school_id || 'DPS2026',
      created_by: auth.username || auth.role
    });

    logAuditEvent({
      actor: {
        id: auth.userId || auth.username,
        name: auth.username || 'School Administrator',
        role: auth.role
      },
      module: 'EXAMINATION',
      action: 'REPORT_CARD_TEMPLATE_CREATED',
      summary: `Created Report Card Template "${saved.template_name}" for ${saved.class_name} (${saved.selected_exams.length} assessments, 100% weightage)`,
      details: {
        template_id: saved.id,
        template_name: saved.template_name,
        class_name: saved.class_name,
        exams_count: saved.selected_exams.length,
        exams: saved.selected_exams.map(e => ({ title: e.exam_title, weightage: e.weightage_percent }))
      },
      targetId: saved.id,
      targetName: saved.template_name,
      school_id: saved.school_id,
      session: saved.academic_session
    });

    return NextResponse.json({ success: true, template: saved });
  } catch (error: any) {
    console.error('[API_REPORT_CARD_TEMPLATES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();

    const validation = validateBody(updateReportCardTemplateSchema, rawBody);
    if (!validation.success) return validation.response;
    const { id, ...updates } = validation.data;

    const existing = await Database.getReportCardTemplateById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    // If template is locked and user is attempting modifications other than unlocking
    if (existing.is_locked && updates.is_locked !== false && Object.keys(updates).some(k => k !== 'is_locked')) {
      return NextResponse.json({
        success: false,
        error: 'This template is locked. Please unlock it first before modifying assessment criteria.'
      }, { status: 403 });
    }

    // Validate weightage if selected_exams are being updated
    if (updates.selected_exams && Array.isArray(updates.selected_exams)) {
      const totalWeightage = updates.selected_exams.reduce((acc, ex) => acc + (Number(ex.weightage_percent) || 0), 0);
      if (Math.round(totalWeightage) !== 100) {
        return NextResponse.json({
          success: false,
          error: `Total assessment weightage must equal exactly 100%. Current sum: ${totalWeightage}%`
        }, { status: 400 });
      }
    }

    const updated = await Database.saveReportCardTemplate({
      ...existing,
      ...updates,
      id
    });

    logAuditEvent({
      actor: {
        id: auth.userId || auth.username,
        name: auth.username || 'School Administrator',
        role: auth.role
      },
      module: 'EXAMINATION',
      action: updates.is_locked !== undefined && Object.keys(updates).length === 1 
        ? (updates.is_locked ? 'REPORT_CARD_TEMPLATE_LOCKED' : 'REPORT_CARD_TEMPLATE_UNLOCKED')
        : 'REPORT_CARD_TEMPLATE_UPDATED',
      summary: `${updates.is_locked !== undefined && Object.keys(updates).length === 1 ? (updates.is_locked ? 'Locked' : 'Unlocked') : 'Updated'} Report Card Template "${updated.template_name}" (${updated.class_name})`,
      details: {
        template_id: updated.id,
        is_locked: updated.is_locked,
        updates
      },
      targetId: updated.id,
      targetName: updated.template_name,
      school_id: updated.school_id,
      session: updated.academic_session
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    console.error('[API_REPORT_CARD_TEMPLATES_PATCH_ERROR]', error);
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
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    const existing = await Database.getReportCardTemplateById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    if (existing.is_locked) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete a locked template. Please unlock it first.'
      }, { status: 403 });
    }

    const deleted = await Database.deleteReportCardTemplate(id);

    logAuditEvent({
      actor: {
        id: auth.userId || auth.username,
        name: auth.username || 'School Administrator',
        role: auth.role
      },
      module: 'EXAMINATION',
      action: 'REPORT_CARD_TEMPLATE_DELETED',
      summary: `Deleted Report Card Template "${existing.template_name}" for ${existing.class_name}`,
      details: { template_id: id, template_name: existing.template_name, class_name: existing.class_name },
      targetId: id,
      targetName: existing.template_name,
      school_id: existing.school_id,
      session: existing.academic_session
    });

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('[API_REPORT_CARD_TEMPLATES_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
