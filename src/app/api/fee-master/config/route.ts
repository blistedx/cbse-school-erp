/*! Giterp Fee Master — Config API v1.0.0 */
import { NextResponse } from 'next/server';
import { requireAuth, requireRole, resolveTenantSchoolId } from '@/lib/auth-guard';
import { getFeeConfig, upsertFeeConfig } from '@/lib/fee-config';

/**
 * GET /api/fee-master/config
 * Returns fee configuration for a school+session.
 */
export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || '2026-27';
    const config = await getFeeConfig(tenant, session);
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('[API_FEE_CONFIG_GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee configuration' }, { status: 500 });
  }
}

/**
 * PUT /api/fee-master/config
 * Update fee configuration. Only Principal/Admin.
 */
export async function PUT(req: Request) {
  try {
    const auth = requireRole(req, ['PRINCIPAL', 'ADMIN', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const session = body.session || body.academic_session || '2026-27';
    const updated = await upsertFeeConfig(tenant, session, body.config || body, (auth as any).userId || 'SYSTEM');
    return NextResponse.json({ success: true, message: 'Fee configuration updated', config: updated });
  } catch (error: any) {
    console.error('[API_FEE_CONFIG_PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update fee configuration' }, { status: 500 });
  }
}
