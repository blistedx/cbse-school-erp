/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, ADMIN_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';
import { validateBody, createNoticeSchema } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const school_id = resolveTenantSchoolId(auth, requestedSchoolId);
    if (school_id instanceof NextResponse) return school_id;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    let notices = await Database.getNotices(school_id, session);
    if (auth.role === 'STUDENT') {
      notices = notices.filter(n => {
        const aud = (n.target_audience || '').toUpperCase();
        return aud === 'STUDENTS' || aud === 'ALL' || aud === 'PARENTS_STUDENTS' || aud === 'PUBLIC';
      });
    }
    return NextResponse.json({ success: true, count: notices.length, notices });
  } catch (error: any) {
    console.error('[API_NOTICES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();

    const validation = validateBody(createNoticeSchema, rawBody);
    if (!validation.success) return validation.response;
    const body = validation.data;

    const school_id = resolveTenantSchoolId(auth, body.school_id);
    if (school_id instanceof NextResponse) return school_id;
    if (!school_id) {
      return NextResponse.json({ success: false, error: 'School ID is required' }, { status: 400 });
    }

    const notice = await Database.createNotice({
      school_id,
      title: body.title,
      content: body.content,
      target_audience: body.target_audience || body.audience || 'ALL',
      posted_by: body.posted_by || body.author || 'Principal Office'
    });

    return NextResponse.json({ success: true, notice });
  } catch (error: any) {
    console.error('[API_NOTICES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Notice ID is required' }, { status: 400 });

    const deleted = await Database.deleteNotice(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('[API_NOTICES_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
