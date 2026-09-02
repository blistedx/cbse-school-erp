/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const holidays = await Database.getHolidays(schoolId, session);
    return NextResponse.json({ success: true, count: holidays.length, holidays });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const schoolId = body.school_id || body.schoolId;
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'school_id is required.' }, { status: 400 });
    }
    if (!body.title || !body.start_date) {
      return NextResponse.json({ success: false, error: 'Holiday title and start date are required.' }, { status: 400 });
    }

    const autoNotice = body.auto_notice !== false;
    const holiday = await Database.createHoliday({ ...body, school_id: schoolId }, autoNotice);
    return NextResponse.json({ success: true, message: 'Holiday declared successfully!', holiday });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const success = await Database.deleteHoliday(id);
    return NextResponse.json({ success, message: success ? 'Holiday deleted' : 'Holiday not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
