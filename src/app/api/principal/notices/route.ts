/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit-logger';
import { dispatchWebPushToAudience } from '@/lib/web-push';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access strictly reserved for the School Principal.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const notices = await Database.getNotices(tenant, session);

    return NextResponse.json({
      success: true,
      count: notices.length,
      notices
    });
  } catch (error: any) {
    console.error('[API_PRINCIPAL_NOTICES_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load notices.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Notice creation strictly reserved for the School Principal.' },
        { status: 403 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ success: false, error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const { title, content, target_audience, category, is_urgent } = rawBody;
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Circular / Notice title is required.' }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Circular / Notice body text is required.' }, { status: 400 });
    }

    const tenant = resolveTenantSchoolId(auth, rawBody.school_id || rawBody.schoolId);
    if (tenant instanceof NextResponse) return tenant;

    const principalName = (auth as any).full_name || (auth as any).username || 'Abhishek Shukla (Principal)';
    const audience = target_audience || 'ALL';

    const newNotice = await Database.createNotice({
      school_id: tenant,
      title: title.trim(),
      content: content.trim(),
      target_audience: audience,
      posted_by: principalName,
      academic_session: rawBody.academic_session || '2026-27',
      is_pinned: Boolean(is_urgent),
      category: category || 'OFFICIAL'
    });

    // Write audit event
    logAuditEvent({
      actor: {
        id: auth.userId || 'principal_admin',
        name: principalName,
        role: 'PRINCIPAL'
      },
      module: 'BROADCAST',
      action: 'CIRCULAR_ISSUED',
      severity: is_urgent ? 'WARNING' : 'INFO',
      summary: `Principal issued official circular "${title.trim()}" to ${audience}`,
      details: {
        notice_id: newNotice.id,
        audience,
        is_urgent: Boolean(is_urgent)
      },
      school_id: tenant,
      session: newNotice.academic_session
    });

    // Trigger web push notifications asynchronously
    try {
      dispatchWebPushToAudience({
        schoolId: tenant,
        audience: audience as any,
        title: `📢 ${title.trim()}`,
        body: content.trim().substring(0, 140),
        data: { noticeId: newNotice.id, url: '/principal/notices' },
        senderRole: 'PRINCIPAL'
      }).catch(() => {});
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Notice successfully broadcast and archived.',
      notice: newNotice
    });
  } catch (error: any) {
    console.error('[API_PRINCIPAL_NOTICES_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to broadcast circular.' },
      { status: 500 }
    );
  }
}
