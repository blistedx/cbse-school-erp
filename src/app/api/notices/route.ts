/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const notices = await Database.getNotices(school_id, session);
    return NextResponse.json({ success: true, count: notices.length, notices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { school_id, title, content, target_audience, posted_by } = body;

    if (!school_id || !title || !content) {
      return NextResponse.json({ success: false, error: 'School ID, Title, and Content are required' }, { status: 400 });
    }

    const notice = await Database.createNotice({
      school_id,
      title,
      content,
      target_audience: target_audience || 'ALL',
      posted_by: posted_by || 'Principal Office'
    });

    return NextResponse.json({ success: true, notice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Notice ID is required' }, { status: 400 });

    const deleted = await Database.deleteNotice(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
