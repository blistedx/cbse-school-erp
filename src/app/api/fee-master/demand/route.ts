/*! Giterp Fee Master — Demand Generation API v1.0.0 */
import { NextResponse } from 'next/server';
import { requireRole, resolveTenantSchoolId } from '@/lib/auth-guard';
import { generateMonthlyDemand } from '@/lib/fee-ledger';
import { Database } from '@/lib/db';
import type { AcademicMonth } from '@/lib/types';

/**
 * POST /api/fee-master/demand
 * Body: { session, month, class_name?, section? }
 *
 * Generates monthly demand for all active students.
 * Idempotent: will not create duplicate demands.
 * Only Principal/Admin can generate demand.
 */
export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ['PRINCIPAL', 'ADMIN', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS', 'ACCOUNTANT']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const session = body.session || body.academic_session || '2026-27';
    const month = (body.month || '').toUpperCase() as AcademicMonth;

    const validMonths: AcademicMonth[] = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
    if (!validMonths.includes(month)) {
      return NextResponse.json(
        { success: false, error: `Invalid month: ${body.month}. Use APR, MAY, JUN, ..., MAR` },
        { status: 400 }
      );
    }

    // Get active students (optionally filtered by class/section)
    let students = await Database.getStudents(tenant, session);
    students = students.filter(s => s.status === 'ACTIVE');

    if (body.class_name) {
      students = students.filter(s =>
        (s.class_name || '').toLowerCase().includes(body.class_name.toLowerCase())
      );
    }
    if (body.section) {
      students = students.filter(s =>
        (s.section || '').toLowerCase() === body.section.toLowerCase()
      );
    }

    if (students.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active students found matching criteria',
        created: 0,
        skipped: 0,
      });
    }

    const result = await generateMonthlyDemand(
      tenant,
      session,
      month,
      students,
      (auth as any).userId || 'SYSTEM'
    );

    return NextResponse.json({
      success: true,
      message: `Monthly demand generated for ${month}`,
      created: result.created,
      skipped: result.skipped,
      totalStudents: students.length,
    });
  } catch (error: any) {
    console.error('[API_FEE_DEMAND_POST]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate demand' },
      { status: 500 }
    );
  }
}
