/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { DEFAULT_ROLE_PERMISSIONS, RolePermissionMatrix } from '@/lib/types';
import { requireRole, ADMIN_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';
import { validateBody, updateSchoolPermissionsSchema } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id') || searchParams.get('school') || undefined;
    const schoolId = resolveTenantSchoolId(auth, requestedSchoolId);
    if (schoolId instanceof NextResponse) return schoolId;

    const school = await Database.getSchoolById(schoolId || 'DPS2026');
    if (!school) {
      return NextResponse.json({
        success: true,
        permissions: DEFAULT_ROLE_PERMISSIONS
      });
    }

    const rawPermissions = (school.role_permissions || {}) as any;
    const permissions: RolePermissionMatrix = {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...rawPermissions,
      ADMIN: { ...DEFAULT_ROLE_PERMISSIONS.ADMIN, ...(rawPermissions.ADMIN || {}) },
      VICE_PRINCIPAL: { ...DEFAULT_ROLE_PERMISSIONS.VICE_PRINCIPAL, ...(rawPermissions.VICE_PRINCIPAL || {}) },
      TEACHER: { ...DEFAULT_ROLE_PERMISSIONS.TEACHER, ...(rawPermissions.TEACHER || {}) },
      STUDENT: { ...DEFAULT_ROLE_PERMISSIONS.STUDENT, ...(rawPermissions.STUDENT || {}) },
      PARENT: { ...DEFAULT_ROLE_PERMISSIONS.PARENT, ...(rawPermissions.PARENT || {}) }
    };
    return NextResponse.json({
      success: true,
      permissions
    });
  } catch (err: any) {
    console.error('[API_SCHOOL_PERMISSIONS_GET_ERROR]', err);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      permissions: DEFAULT_ROLE_PERMISSIONS
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const rawBody = await req.json();

    const validation = validateBody(updateSchoolPermissionsSchema, rawBody);
    if (!validation.success) return validation.response;
    const body = validation.data;

    const school_id = resolveTenantSchoolId(auth, body.school_id);
    if (school_id instanceof NextResponse) return school_id;
    if (!school_id) {
      return NextResponse.json({ success: false, error: 'School ID is required' }, { status: 400 });
    }

    const updated = await Database.updateSchoolSettings(school_id, {
      role_permissions: body.permissions as RolePermissionMatrix
    });

    return NextResponse.json({
      success: true,
      message: 'Role-Based Access Control permissions updated successfully',
      permissions: updated?.role_permissions || body.permissions
    });
  } catch (err: any) {
    console.error('[API_SCHOOL_PERMISSIONS_POST_ERROR]', err);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
