/*! Giterp Fee Master — Ledger API v1.0.0 */
import { NextResponse } from 'next/server';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import {
  postLedgerLines,
  getStudentLedger,
  getStudentFeeSummaryFromLedger,
  getFeeAggregate,
  getSchoolLedgerLines,
  cancelLedgerLine,
} from '@/lib/fee-ledger';
import { PRESET_BY_ID } from '@/lib/fee-report-presets';
import type { FeeAggregateFilters, GroupByDimension } from '@/lib/types';

/**
 * GET /api/fee-master
 * 
 * Query params:
 *   action: 'student_ledger' | 'student_summary' | 'aggregate' | 'preset' | 'lines'
 *   session: academic session (default '2026-27')
 *   student_id: for student_ledger/student_summary
 *   preset_id: for preset reports
 *   ...filters: for aggregate
 *   group_by: comma-separated dimensions for aggregate
 */
export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id'));
    if (tenant instanceof NextResponse) return tenant;

    const action = searchParams.get('action') || 'aggregate';
    const session = searchParams.get('session') || '2026-27';

    // ─── Student Ledger ───
    if (action === 'student_ledger') {
      const studentId = searchParams.get('student_id');
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }
      const includeCancelled = searchParams.get('include_cancelled') === 'true';
      const lines = await getStudentLedger(tenant, studentId, session, includeCancelled);
      return NextResponse.json({ success: true, count: lines.length, lines });
    }

    // ─── Student Summary ───
    if (action === 'student_summary') {
      const studentId = searchParams.get('student_id');
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }
      const summary = await getStudentFeeSummaryFromLedger(tenant, studentId, session);
      return NextResponse.json({ success: true, summary });
    }

    // ─── Preset Report ───
    if (action === 'preset') {
      const presetId = searchParams.get('preset_id');
      if (!presetId) {
        return NextResponse.json({ success: false, error: 'preset_id is required' }, { status: 400 });
      }
      const preset = PRESET_BY_ID.get(presetId);
      if (!preset) {
        return NextResponse.json({ success: false, error: `Unknown preset: ${presetId}` }, { status: 400 });
      }

      // Build filters by merging preset overrides with query params
      const filters: FeeAggregateFilters = {
        session,
        ...preset.filterOverrides,
      };
      // Apply user filters from query params
      if (searchParams.get('date_from')) filters.dateFrom = searchParams.get('date_from')!;
      if (searchParams.get('date_to')) filters.dateTo = searchParams.get('date_to')!;
      if (searchParams.get('months')) filters.months = searchParams.get('months')!.split(',') as any;
      if (searchParams.get('classes')) filters.classes = searchParams.get('classes')!.split(',');
      if (searchParams.get('sections')) filters.sections = searchParams.get('sections')!.split(',');
      if (searchParams.get('fee_heads')) filters.feeHeads = searchParams.get('fee_heads')!.split(',') as any;
      if (searchParams.get('payment_modes')) filters.paymentModes = searchParams.get('payment_modes')!.split(',') as any;
      if (searchParams.get('concession_types')) filters.concessionTypes = searchParams.get('concession_types')!.split(',') as any;
      if (searchParams.get('collected_by')) filters.collectedBy = searchParams.get('collected_by')!.split(',');

      const rows = await getFeeAggregate(tenant, filters, preset.groupBy);
      return NextResponse.json({
        success: true,
        preset: { id: preset.id, name: preset.name, category: preset.category },
        count: rows.length,
        rows,
      });
    }

    // ─── Generic Aggregate ───
    if (action === 'aggregate') {
      const filters: FeeAggregateFilters = { session };
      if (searchParams.get('date_from')) filters.dateFrom = searchParams.get('date_from')!;
      if (searchParams.get('date_to')) filters.dateTo = searchParams.get('date_to')!;
      if (searchParams.get('months')) filters.months = searchParams.get('months')!.split(',') as any;
      if (searchParams.get('classes')) filters.classes = searchParams.get('classes')!.split(',');
      if (searchParams.get('sections')) filters.sections = searchParams.get('sections')!.split(',');
      if (searchParams.get('student_ids')) filters.studentIds = searchParams.get('student_ids')!.split(',');
      if (searchParams.get('fee_heads')) filters.feeHeads = searchParams.get('fee_heads')!.split(',') as any;
      if (searchParams.get('line_types')) filters.lineTypes = searchParams.get('line_types')!.split(',') as any;
      if (searchParams.get('payment_modes')) filters.paymentModes = searchParams.get('payment_modes')!.split(',') as any;
      if (searchParams.get('concession_types')) filters.concessionTypes = searchParams.get('concession_types')!.split(',') as any;
      if (searchParams.get('collected_by')) filters.collectedBy = searchParams.get('collected_by')!.split(',');
      if (searchParams.get('include_cancelled') === 'true') filters.includeCancelled = true;

      const groupByStr = searchParams.get('group_by') || '';
      const groupBy = groupByStr ? groupByStr.split(',') as GroupByDimension[] : [];

      const rows = await getFeeAggregate(tenant, filters, groupBy);
      return NextResponse.json({ success: true, count: rows.length, rows });
    }

    // ─── Raw Lines (for exports) ───
    if (action === 'lines') {
      const additionalFilter: Record<string, any> = {};
      if (searchParams.get('line_type')) additionalFilter.line_type = searchParams.get('line_type');
      if (searchParams.get('fee_head')) additionalFilter.fee_head = searchParams.get('fee_head');
      if (searchParams.get('student_id')) additionalFilter.student_id = searchParams.get('student_id');

      const lines = await getSchoolLedgerLines(tenant, session, additionalFilter);
      return NextResponse.json({ success: true, count: lines.length, lines });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_FEE_MASTER_GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/fee-master
 * Body: { lines: FeeLedgerLine[] }
 * 
 * Posts one or more ledger lines transactionally.
 * Roles: ACCOUNTANT can post PAYMENT/DEMAND; only PRINCIPAL/SUPERADMIN can post WAIVER/REFUND.
 */
export async function POST(req: Request) {
  try {
    const auth = requireRole(req, [...ADMIN_ROLES, 'ACCOUNTANT']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, body.school_id || searchParams.get('school_id'));
    if (tenant instanceof NextResponse) return tenant;

    const rawLines = body.lines;
    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return NextResponse.json({ success: false, error: 'lines array is required' }, { status: 400 });
    }

    // Role-based permission check for privileged operations
    const userRole = ((auth as any).role || '').toUpperCase();
    const isPrivileged = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);

    for (const line of rawLines) {
      const lt = (line.line_type || '').toUpperCase();
      if (['WAIVER', 'REFUND'].includes(lt) && !isPrivileged) {
        return NextResponse.json(
          { success: false, error: `Forbidden: Only Principal/Superadmin can post ${lt} lines.` },
          { status: 403 }
        );
      }
    }

    const posted = await postLedgerLines(tenant, rawLines, (auth as any).userId);
    return NextResponse.json({
      success: true,
      message: `${posted.length} ledger line(s) posted successfully`,
      count: posted.length,
      lines: posted,
    });
  } catch (error: any) {
    console.error('[API_FEE_MASTER_POST]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to post ledger lines' }, { status: 500 });
  }
}

/**
 * PATCH /api/fee-master
 * Body: { line_id, action: 'cancel', reason }
 * 
 * Cancel a ledger line (only Principal/Superadmin).
 */
export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    if (body.action === 'cancel') {
      if (!body.line_id) {
        return NextResponse.json({ success: false, error: 'line_id is required' }, { status: 400 });
      }
      if (!body.reason) {
        return NextResponse.json({ success: false, error: 'reason is required for cancellation' }, { status: 400 });
      }

      const cancelled = await cancelLedgerLine(tenant, body.line_id, body.reason, (auth as any).userId);
      if (!cancelled) {
        return NextResponse.json({ success: false, error: 'Line not found or already cancelled' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Line cancelled', line: cancelled });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_FEE_MASTER_PATCH]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update' }, { status: 500 });
  }
}
