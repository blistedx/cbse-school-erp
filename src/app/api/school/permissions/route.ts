/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { DEFAULT_ROLE_PERMISSIONS, RolePermissionMatrix } from '@/lib/types';
import { requireRole, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || searchParams.get('school') || 'DPS2026';

    const school = await Database.getSchoolById(schoolId);
    if (!school) {
      return NextResponse.json({
        success: true,
        permissions: DEFAULT_ROLE_PERMISSIONS
      });
    }

    const permissions = school.role_permissions || DEFAULT_ROLE_PERMISSIONS;
    return NextResponse.json({
      success: true,
      permissions
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      permissions: DEFAULT_ROLE_PERMISSIONS
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { school_id, permissions } = body;

    if (!school_id) {
      return NextResponse.json({ success: false, error: 'School ID is required' }, { status: 400 });
    }

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ success: false, error: 'Valid permissions object is required' }, { status: 400 });
    }

    const updated = await Database.updateSchoolSettings(school_id, {
      role_permissions: permissions as RolePermissionMatrix
    });

    return NextResponse.json({
      success: true,
      message: 'Role-Based Access Control permissions updated successfully',
      permissions: updated?.role_permissions || permissions
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
