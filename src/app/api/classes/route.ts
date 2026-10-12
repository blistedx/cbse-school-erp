/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, requirePermission, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { validateBody, createClassSchema, updateClassSchema } from '@/lib/validation-schemas';
import { logAuditEvent } from '@/lib/audit-logger';

export async function GET(req: Request) {
  try {
    const auth = await requirePermission(req, 'classes', 'view');
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const classes = await Database.getClasses(tenant, session);
    return NextResponse.json({ success: true, count: classes.length, classes });
  } catch (error: any) {
    console.error('[API_CLASSES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to load classes.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePermission(req, 'classes', 'add');
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(createClassSchema, rawBody);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const newClass = await Database.createClass({
      ...body,
      school_id: tenant,
      academic_session: (rawBody as any).academic_session || (rawBody as any).session || '2026-27'
    });

    logAuditEvent({
      schoolId: tenant,
      userId: auth.userId,
      role: auth.role,
      module: 'CLASSES',
      action: 'CREATE',
      severity: 'INFO',
      summary: `Created class roster "${newClass.name} - ${newClass.section}"`,
      targetId: newClass.id,
      targetName: `${newClass.name} - ${newClass.section}`,
      before: null,
      after: newClass
    });

    return NextResponse.json({ success: true, class: newClass });
  } catch (error: any) {
    console.error('[API_CLASSES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create class.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requirePermission(req, 'classes', 'edit');
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const { id } = rawBody;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Class ID is required for updates' }, { status: 400 });
    }

    const validation = validateBody(updateClassSchema, rawBody);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const existing = (await Database.getClasses(tenant)).find(c => c.id === id);
    const updated = await Database.updateClass(id, body);

    logAuditEvent({
      schoolId: tenant,
      userId: auth.userId,
      role: auth.role,
      module: 'CLASSES',
      action: 'UPDATE',
      severity: 'INFO',
      summary: `Updated class structure "${updated?.name || id} - ${updated?.section || ''}"`,
      targetId: id,
      targetName: `${updated?.name || id} - ${updated?.section || ''}`,
      before: existing,
      after: updated
    });

    return NextResponse.json({ success: true, class: updated });
  } catch (error: any) {
    console.error('[API_CLASSES_PUT_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update class.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requirePermission(req, 'classes', 'delete');
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Class ID is required' }, { status: 400 });

    const existing = (await Database.getClasses(tenant)).find(c => c.id === id);
    const deleted = await Database.deleteClass(id);

    logAuditEvent({
      schoolId: tenant,
      userId: auth.userId,
      role: auth.role,
      module: 'CLASSES',
      action: 'DELETE',
      severity: 'WARNING',
      summary: `Deleted class "${existing?.name || id} - ${existing?.section || ''}"`,
      targetId: id,
      targetName: `${existing?.name || id} - ${existing?.section || ''}`,
      before: existing,
      after: null
    });

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('[API_CLASSES_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete class.' }, { status: 500 });
  }
}
