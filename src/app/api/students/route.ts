/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { validateBody, createStudentSchema, updateStudentSchema } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const role = auth.role;
    const isAdmin = ADMIN_ROLES.includes((role || '').toUpperCase());

    const rawStudents = await Database.getStudents(tenant, session);
    const students = rawStudents.map(s => {
      if (isAdmin) return s;
      const { passcode, ...safeStudent } = s as any;
      return safeStudent;
    });

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error: any) {
    console.error('[API_STUDENTS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to load students.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(createStudentSchema, rawBody);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    if (body.action === 'UPDATE' || (body.id && body.is_update)) {
      const { id, ...updates } = body;
      const updated = await Database.updateStudent(id!, updates);
      return NextResponse.json({ success: true, message: 'Student profile updated!', student: updated });
    }

    const student = await Database.createStudent({ ...body, school_id: tenant });
    return NextResponse.json({ success: true, message: 'Student registered successfully!', student });
  } catch (error: any) {
    console.error('[API_STUDENTS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to register student.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(updateStudentSchema, rawBody);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }

    const tenant = resolveTenantSchoolId(auth, updates.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const updated = await Database.updateStudent(id, updates);
    return NextResponse.json({ success: true, message: 'Student profile updated!', student: updated });
  } catch (error: any) {
    console.error('[API_STUDENTS_PUT_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update student profile.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(updateStudentSchema, rawBody);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }

    const tenant = resolveTenantSchoolId(auth, updates.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const updated = await Database.updateStudent(id, updates);
    return NextResponse.json({ success: true, message: 'Student profile updated!', student: updated });
  } catch (error: any) {
    console.error('[API_STUDENTS_PATCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update student profile.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }
    await Database.deleteStudent(id);
    return NextResponse.json({ success: true, message: 'Student deleted successfully!' });
  } catch (error: any) {
    console.error('[API_STUDENTS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete student.' }, { status: 500 });
  }
}
