/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database, hashPassword } from '@/lib/db';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { validateBody, createStudentSchema, updateStudentSchema, sanitizeNoSqlInput } from '@/lib/validation-schemas';

function sanitizeStudentResponse(student: any) {
  if (!student) return student;
  const { passcode, password, ...safe } = student;
  return safe;
}

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const rawStudents = await Database.getStudents(tenant, session);
    
    // Unconditionally strip passcodes & passwords from all responses
    const students = rawStudents.map(sanitizeStudentResponse);

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

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(createStudentSchema, sanitizeNoSqlInput(rawBody));
    if (!validation.success) return validation.response;

    const body = validation.data;
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    // Validate photo size (Max 200 KB limit)
    const photoData = body.photo || body.avatar;
    if (photoData && photoData.startsWith('data:')) {
      const base64Part = photoData.split(',')[1] || '';
      const estimatedBytes = Math.ceil((base64Part.length * 3) / 4);
      const MAX_PHOTO_BYTES = 200 * 1024;
      if (estimatedBytes > MAX_PHOTO_BYTES) {
        const sizeKb = (estimatedBytes / 1024).toFixed(1);
        return NextResponse.json(
          {
            success: false,
            error: `Student profile picture (${sizeKb} KB) exceeds maximum allowed limit of 200 KB.`
          },
          { status: 400 }
        );
      }
    }

    if (body.action === 'UPDATE' || (body.id && body.is_update)) {
      const { id, ...updates } = body;
      if (updates.passcode) {
        updates.passcode = await hashPassword(updates.passcode);
        (updates as any).must_change_password = true;
      }
      const updated = await Database.updateStudent(id!, updates);
      return NextResponse.json({ success: true, message: 'Student profile updated!', student: sanitizeStudentResponse(updated) });
    }

    let initialPasscode = body.passcode;
    let mustChange = false;
    if (initialPasscode) {
      initialPasscode = await hashPassword(initialPasscode);
      mustChange = true;
    }

    const student = await Database.createStudent({
      ...body,
      passcode: initialPasscode,
      must_change_password: mustChange,
      school_id: tenant
    });
    return NextResponse.json({ success: true, message: 'Student registered successfully!', student: sanitizeStudentResponse(student) });
  } catch (error: any) {
    console.error('[API_STUDENTS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to register student.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(updateStudentSchema, sanitizeNoSqlInput(rawBody));
    if (!validation.success) return validation.response;

    const body = validation.data;
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }

    const tenant = resolveTenantSchoolId(auth, updates.school_id);
    if (tenant instanceof NextResponse) return tenant;

    if (updates.passcode) {
      updates.passcode = await hashPassword(updates.passcode);
      (updates as any).must_change_password = true;
    }

    const updated = await Database.updateStudent(id, updates);
    return NextResponse.json({ success: true, message: 'Student profile updated!', student: sanitizeStudentResponse(updated) });
  } catch (error: any) {
    console.error('[API_STUDENTS_PUT_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update student profile.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return PUT(req);
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
