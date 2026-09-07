/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, AGENCY_ONLY } from '@/lib/auth-guard';
import { validateBody, createSchoolSchema } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const isAgencyAdmin = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'].includes((auth.role || '').toUpperCase());

    const rawSchools = await Database.getSchools();
    const filtered = isAgencyAdmin
      ? rawSchools
      : rawSchools.filter(s => s.id === auth.schoolId || s.school_code === auth.schoolId);

    // Admin PINs must NEVER be exposed over the wire, even to admins
    const schools = filtered.map(s => {
      const { admin_pin, ...safeSchool } = s as any;
      return safeSchool;
    });

    return NextResponse.json({ success: true, schools });
  } catch (error: any) {
    console.error('[API_SCHOOLS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, AGENCY_ONLY);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(createSchoolSchema, rawBody);
    if (!validation.success) return validation.response;

    const school = await Database.createSchool(validation.data);
    const { admin_pin, ...safeSchool } = school as any;
    return NextResponse.json({
      success: true,
      message: `School "${school.school_name}" [${school.school_code}] created successfully!`,
      school: safeSchool
    });
  } catch (error: any) {
    console.error('[API_SCHOOLS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
