/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireRole, ADMIN_ROLES } from '@/lib/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const {
      school_id,
      school_name,
      board,
      city,
      state,
      address,
      pincode,
      udise_code,
      oasis_code,
      affiliation_no,
      phone,
      email,
      website,
      established_year,
      principal_name,
      admin_name,
      admin_id,
      username,
      full_name,
      admin_pin,
      logo,
      logo_url,
      avatar,
      theme
    } = body;

    if (!school_id) {
      return NextResponse.json({ success: false, error: 'School ID is required' }, { status: 400 });
    }

    const updated = await Database.updateSchoolSettings(school_id, {
      school_name,
      board,
      city,
      state,
      address,
      pincode,
      udise_code,
      oasis_code,
      affiliation_no,
      phone,
      email,
      website,
      established_year,
      principal_name: principal_name || full_name || admin_name,
      admin_name: admin_name || full_name || principal_name,
      admin_id: admin_id || username,
      admin_pin,
      logo,
      logo_url
    });

    return NextResponse.json({ success: true, school: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
