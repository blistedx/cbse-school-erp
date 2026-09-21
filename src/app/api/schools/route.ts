/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database, hashPassword } from '@/lib/db';
import { extractToken, verifySessionToken, requireRole, AGENCY_ONLY } from '@/lib/auth-guard';
import { validateBody, createSchoolSchema, sanitizeNoSqlInput } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    const payload = token ? verifySessionToken(token) : null;

    const rawSchools = await Database.getSchools();

    // 1. Unauthenticated / Public Request: Return minimal non-sensitive data needed for login portal
    if (!payload) {
      const publicSchools = rawSchools
        .filter(s => s.status === 'ACTIVE')
        .map(s => ({
          id: s.id,
          school_code: s.school_code,
          school_name: s.school_name,
          city: s.city,
          state: s.state,
          board: s.board,
          logo_url: s.logo_url || (s as any).logo || ''
        }));
      return NextResponse.json({ success: true, count: publicSchools.length, schools: publicSchools });
    }

    // 2. Authenticated Request: Scoped by tenant or AGENCY_SUPERADMIN
    const isAgencyAdmin = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'].includes((payload.role || '').toUpperCase());

    const filtered = isAgencyAdmin
      ? rawSchools
      : rawSchools.filter(s => s.id === payload.schoolId || s.school_code === payload.schoolId);

    // Passcodes & Admin PINs are never exposed over the wire
    const schools = filtered.map(s => {
      const { admin_pin, passcode, password, ...safeSchool } = s as any;
      return safeSchool;
    });

    return NextResponse.json({ success: true, count: schools.length, schools });
  } catch (error: any) {
    console.error('[API_SCHOOLS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve schools.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, AGENCY_ONLY);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json().catch(() => ({}));
    const validation = validateBody(createSchoolSchema, sanitizeNoSqlInput(rawBody));
    if (!validation.success) return validation.response;

    const data = validation.data;
    if (data.admin_pin) {
      data.admin_pin = await hashPassword(data.admin_pin);
    }

    const school = await Database.createSchool(data);
    const { admin_pin, passcode, password, ...safeSchool } = school as any;
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
