/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireRole, ADMIN_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { promotions, school_id } = body;

    const schoolId = resolveTenantSchoolId(auth, school_id);
    if (schoolId instanceof NextResponse) return schoolId;

    if (!Array.isArray(promotions) || promotions.length === 0) {
      return NextResponse.json({ success: false, error: 'Promotions array is required.' }, { status: 400 });
    }

    // Tenant Isolation Check for student promotions
    if (auth.role !== 'AGENCY_SUPERADMIN') {
      const allStudents = await Database.getStudents(auth.schoolId);
      const studentIdSet = new Set(allStudents.map(s => s.id));
      for (const p of promotions) {
        if (!studentIdSet.has(p.student_id)) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: Cannot promote students outside your school institution' },
            { status: 403 }
          );
        }
      }
    }

    const result = await Database.bulkPromoteStudents(promotions);

    return NextResponse.json({
      success: true,
      message: `Promotion Studio executed successfully: ${result.promoted} Promoted, ${result.retained} Retained, ${result.graduated} Graduated, ${result.left} TC Issued.`,
      result
    });
  } catch (error: any) {
    console.error('[API_STUDENTS_PROMOTE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
