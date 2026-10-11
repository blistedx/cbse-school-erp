/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access restricted to authorized faculty members.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      // Try to find teacher by full_name or username if userId did not match directly
      const teachers = await Database.getTeachers(tenant);
      const matched = teachers.find(t => 
        (t.staff_code && t.staff_code.toUpperCase() === (auth.username || '').toUpperCase()) ||
        (t.id && t.id.toUpperCase() === (auth.username || '').toUpperCase()) ||
        (t.full_name && t.full_name.toLowerCase() === (auth.name || '').toLowerCase())
      );
      if (matched) {
        const fallbackAssignments = await Database.getTeacherAssignments(tenant, matched.id);
        if (fallbackAssignments) {
          return NextResponse.json({
            success: true,
            school_id: tenant,
            assignments: fallbackAssignments
          });
        }
      }

      return NextResponse.json(
        { success: false, error: 'Teacher profile or assignments not found for this account.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      school_id: tenant,
      assignments
    });
  } catch (error: any) {
    console.error('[API_TEACHER_ME_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve teacher assignments.' },
      { status: 500 }
    );
  }
}
