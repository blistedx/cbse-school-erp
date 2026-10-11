/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass, getTodayDateStr } from '@/lib/utils';
import { HomeworkItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const className = searchParams.get('class_name') || undefined;
    const section = searchParams.get('section') || undefined;
    const subjectName = searchParams.get('subject_name') || undefined;

    const items = await Database.getHomework(tenant, auth.userId, className, section, subjectName);

    return NextResponse.json({
      success: true,
      count: items.length,
      homework: items
    });
  } catch (error: any) {
    console.error('[API_TEACHER_HOMEWORK_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve homework.' }, { status: 500 });
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

    const { id, class_name, section, subject_name, title, description, due_date, attachment_url, attachment_name } = body;

    if (!class_name || !subject_name || !title || !due_date) {
      return NextResponse.json({ success: false, error: 'Class, subject, title, and due date are required.' }, { status: 400 });
    }

    // Verify teacher is allocated
    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    const isAllocated = assignments.allocatedSubjects.some(alloc => 
      isSameClass(alloc.class_name, class_name) &&
      (alloc.section || 'A').toUpperCase().trim() === (section || 'A').toUpperCase().trim() &&
      alloc.subject_name.toLowerCase().trim() === subject_name.toLowerCase().trim()
    );

    if (!isAllocated && userRole === 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: `Security Violation: You cannot assign homework for ${class_name}-${section} ${subject_name} as you are not the allocated subject teacher.`
      }, { status: 403 });
    }

    const saved = await Database.saveHomework({
      id,
      school_id: tenant,
      academic_session: body.academic_session || '2026-27',
      teacher_id: assignments.teacher.id,
      teacher_name: assignments.teacher.full_name,
      class_name,
      section: section || 'A',
      subject_name,
      title: title.trim(),
      description: (description || '').trim(),
      assigned_date: body.assigned_date || getTodayDateStr(),
      due_date,
      attachment_url,
      attachment_name,
      status: 'ACTIVE',
      created_at: body.created_at || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Homework published successfully for scholars.',
      homework: saved
    });
  } catch (error: any) {
    console.error('[API_TEACHER_HOMEWORK_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to save homework.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Homework ID is required.' }, { status: 400 });

    const assignments = await Database.getTeacherAssignments(auth.schoolId || 'DPS2026', auth.userId);
    await Database.deleteHomework(id, assignments?.teacher?.id || auth.userId);

    return NextResponse.json({ success: true, message: 'Homework removed successfully.' });
  } catch (error: any) {
    console.error('[API_TEACHER_HOMEWORK_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete homework.' }, { status: 500 });
  }
}
