/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass } from '@/lib/utils';
import { StudyMaterialItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const className = searchParams.get('class_name') || undefined;
    const subjectName = searchParams.get('subject_name') || undefined;

    const materials = await Database.getStudyMaterials(tenant, className, subjectName);

    return NextResponse.json({
      success: true,
      count: materials.length,
      materials
    });
  } catch (error: any) {
    console.error('[API_TEACHER_MATERIALS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve study materials.' }, { status: 500 });
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

    const { class_name, section, subject_name, chapter_title, title, description, file_url, file_type, file_size } = body;

    if (!class_name || !subject_name || !title || !chapter_title) {
      return NextResponse.json({ success: false, error: 'Class, subject, chapter, and title are required.' }, { status: 400 });
    }

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    const saved = await Database.saveStudyMaterial({
      id: body.id,
      school_id: tenant,
      academic_session: body.academic_session || '2026-27',
      teacher_id: assignments.teacher.id,
      teacher_name: assignments.teacher.full_name,
      class_name,
      section: section || 'All Sections',
      subject_name,
      chapter_title: chapter_title.trim(),
      title: title.trim(),
      description: (description || '').trim(),
      file_url: file_url || '',
      file_type: file_type || 'PDF',
      file_size: file_size || '1.2 MB',
      created_at: body.created_at || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Study material uploaded successfully and made accessible to students.',
      material: saved
    });
  } catch (error: any) {
    console.error('[API_TEACHER_MATERIALS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to upload study material.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Material ID is required.' }, { status: 400 });

    const assignments = await Database.getTeacherAssignments(auth.schoolId || 'DPS2026', auth.userId);
    await Database.deleteStudyMaterial(id, assignments?.teacher?.id || auth.userId);

    return NextResponse.json({ success: true, message: 'Study material deleted.' });
  } catch (error: any) {
    console.error('[API_TEACHER_MATERIALS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete material.' }, { status: 500 });
  }
}
