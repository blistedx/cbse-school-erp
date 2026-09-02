/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const classes = await Database.getClasses(school_id, session);
    return NextResponse.json({ success: true, count: classes.length, classes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { school_id, class_name, section, class_teacher, room_no, capacity, subjects, academic_session } = body;

    if (!school_id || !class_name) {
      return NextResponse.json({ success: false, error: 'School ID and Class Name are required' }, { status: 400 });
    }

    const newClass = await Database.createClass({
      school_id,
      academic_session: academic_session || body.session || '2026-27',
      class_name,
      section: section || 'A',
      class_teacher,
      room_no,
      capacity: Number(capacity) || 40,
      subjects
    });

    return NextResponse.json({ success: true, class: newClass });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { id, class_name, section, class_teacher, room_no, capacity, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Class ID is required for updates' }, { status: 400 });
    }

    const updated = await Database.updateClass(id, {
      class_name,
      section,
      class_teacher,
      room_no,
      capacity: Number(capacity) || 40,
      status
    });

    return NextResponse.json({ success: true, class: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Class ID is required' }, { status: 400 });

    const deleted = await Database.deleteClass(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
