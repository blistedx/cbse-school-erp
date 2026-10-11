/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit-logger';

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

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({ success: false, error: 'Access Denied: Class teacher privileges required.' }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;
    const allNotices = await Database.getNotices(tenant, session);
    const classNotices = allNotices.filter(n => 
      !n.target_classes || n.target_classes.length === 0 || n.target_classes.includes(class_name)
    );

    return NextResponse.json({
      success: true,
      class_name,
      section,
      notices: classNotices
    });
  } catch (error: any) {
    console.error('[API_CLASS_NOTICES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve class notices.' }, { status: 500 });
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

    const { title, content, target_audience, priority } = body;
    const session = body.academic_session || '2026-27';

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Notice title and content are required.' }, { status: 400 });
    }

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments || !assignments.isClassTeacher || !assignments.classTeacherSection) {
      return NextResponse.json({ success: false, error: 'Access Denied: Class teacher privileges required.' }, { status: 403 });
    }

    const { class_name, section } = assignments.classTeacherSection;

    const notice = await Database.createNotice({
      school_id: tenant,
      academic_session: session,
      title: title.trim(),
      category: 'ACADEMIC' as any,
      content: content.trim(),
      target_audience: target_audience || 'ALL',
      target_classes: [class_name],
      is_pinned: false,
      is_published: true,
      priority: priority || 'NORMAL',
      author_name: `${assignments.teacher.full_name} (Class Teacher, ${class_name}-${section})`
    });

    logAuditEvent({
      actor: { id: assignments.teacher.id, name: assignments.teacher.full_name, role: 'TEACHER' },
      module: 'NOTICES',
      action: 'CLASS_NOTICE_PUBLISHED',
      severity: 'INFO',
      summary: `Class notice published for ${class_name}-${section}: '${title}'`,
      targetId: notice.id,
      school_id: tenant,
      session,
      details: { title, class_name, section }
    });

    return NextResponse.json({
      success: true,
      message: 'Notice broadcasted to class scholars and parents.',
      notice
    });
  } catch (error: any) {
    console.error('[API_CLASS_NOTICES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to publish class notice.' }, { status: 500 });
  }
}
