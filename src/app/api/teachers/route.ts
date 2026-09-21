/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database, hashPassword } from '@/lib/db';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { validateBody, createTeacherSchema, updateTeacherSchema, sanitizeNoSqlInput } from '@/lib/validation-schemas';

function sanitizeTeacherResponse(teacher: any) {
  if (!teacher) return teacher;
  const { passcode, password, salary, ...safe } = teacher;
  return safe;
}

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, [...ADMIN_ROLES, 'TEACHER', 'ACCOUNTANT']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const rawTeachers = await Database.getTeachers(tenant, session);
    
    // Unconditionally strip passcodes & passwords from all responses
    const teachers = rawTeachers.map(sanitizeTeacherResponse);

    return NextResponse.json({ success: true, count: teachers.length, teachers });
  } catch (error: any) {
    console.error('[API_TEACHERS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to load teachers.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(createTeacherSchema, sanitizeNoSqlInput(rawBody));
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
            error: `Teacher profile picture (${sizeKb} KB) exceeds maximum allowed limit of 200 KB.`
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
      const updated = await Database.updateTeacher(id!, updates);
      return NextResponse.json({ success: true, message: 'Teacher profile updated!', teacher: sanitizeTeacherResponse(updated) });
    }

    let initialPasscode = body.passcode;
    let mustChange = false;
    if (initialPasscode) {
      initialPasscode = await hashPassword(initialPasscode);
      mustChange = true;
    }

    const teacher = await Database.createTeacher({
      ...body,
      passcode: initialPasscode,
      must_change_password: mustChange,
      school_id: tenant
    });
    return NextResponse.json({ success: true, message: 'Teacher registered successfully!', teacher: sanitizeTeacherResponse(teacher) });
  } catch (error: any) {
    console.error('[API_TEACHERS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to register teacher.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(updateTeacherSchema, sanitizeNoSqlInput(rawBody));
    if (!validation.success) return validation.response;

    const body = validation.data;
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Teacher ID is required.' }, { status: 400 });
    }

    const tenant = resolveTenantSchoolId(auth, updates.school_id);
    if (tenant instanceof NextResponse) return tenant;

    if (updates.passcode) {
      updates.passcode = await hashPassword(updates.passcode);
      (updates as any).must_change_password = true;
    }

    const updated = await Database.updateTeacher(id, updates);
    return NextResponse.json({ success: true, message: 'Teacher profile updated!', teacher: sanitizeTeacherResponse(updated) });
  } catch (error: any) {
    console.error('[API_TEACHERS_PUT_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update teacher profile.' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Teacher ID is required.' }, { status: 400 });
    }
    await Database.deleteTeacher(id);
    return NextResponse.json({ success: true, message: 'Teacher deleted successfully!' });
  } catch (error: any) {
    console.error('[API_TEACHERS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete teacher.' }, { status: 500 });
  }
}
