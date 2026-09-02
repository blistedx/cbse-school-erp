/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { extractToken, verifySessionToken, requireRole, AGENCY_ONLY } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    const auth = token ? verifySessionToken(token) : null;
    const isAgencyAdmin = auth?.role === 'AGENCY_SUPERADMIN';

    const rawSchools = await Database.getSchools();
    const schools = rawSchools.map(s => {
      if (isAgencyAdmin) return s;
      const { admin_pin, ...safeSchool } = s as any;
      return safeSchool;
    });

    return NextResponse.json({ success: true, schools });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, AGENCY_ONLY);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const school = await Database.createSchool(body);
    return NextResponse.json({
      success: true,
      message: `School "${school.school_name}" [${school.school_code}] created successfully!`,
      school
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
