/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { validateBody, updateSchoolSettingsSchema } from '@/lib/validation-schemas';

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(updateSchoolSettingsSchema, rawBody);
    if (!validation.success) return validation.response;
    const body = validation.data;

    const school_id = resolveTenantSchoolId(auth, body.school_id);
    if (school_id instanceof NextResponse) return school_id;
    if (!school_id) {
      return NextResponse.json({ success: false, error: 'School ID is required' }, { status: 400 });
    }

    const {
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
      photo,
      principal_avatar
    } = body;

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
      logo_url,
      avatar,
      photo,
      principal_avatar
    });

    return NextResponse.json({ success: true, school: updated });
  } catch (error: any) {
    console.error('[API_SCHOOL_SETTINGS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
