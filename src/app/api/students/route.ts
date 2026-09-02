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
    const role = auth.role;
    const isAdmin = role === 'PRINCIPAL' || role === 'AGENCY_SUPERADMIN';

    const rawStudents = await Database.getStudents(schoolId, session);
    const students = rawStudents.map(s => {
      if (isAdmin) return s;
      const { passcode, ...safeStudent } = s as any;
      return safeStudent;
    });

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    if (body.action === 'UPDATE' || (body.id && body.is_update)) {
      const { id, ...updates } = body;
      const updated = await Database.updateStudent(id, updates);
      return NextResponse.json({ success: true, message: 'Student profile updated!', student: updated });
    }
    const schoolId = body.school_id || body.schoolId;
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'school_id is required.' }, { status: 400 });
    }
    const student = await Database.createStudent({ ...body, school_id: schoolId });
    return NextResponse.json({ success: true, message: 'Student registered successfully!', student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }
    const updated = await Database.updateStudent(id, updates);
    return NextResponse.json({ success: true, message: 'Student profile updated!', student: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }
    const updated = await Database.updateStudent(id, updates);
    return NextResponse.json({ success: true, message: 'Student profile updated!', student: updated });
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
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }
    await Database.deleteStudent(id);
    return NextResponse.json({ success: true, message: 'Student deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
