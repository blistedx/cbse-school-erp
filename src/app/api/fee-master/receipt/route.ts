/*! Giterp Fee Master — Receipt & Refund API v1.0.0 */
import { NextResponse } from 'next/server';
import { requireRole, resolveTenantSchoolId } from '@/lib/auth-guard';
import { cancelLedgerLine, postLedgerLines, getLineByReceiptNo } from '@/lib/fee-ledger';

/**
 * POST /api/fee-master/receipt
 * Actions: cancel_receipt, issue_refund
 *
 * cancel_receipt: Cancels a receipt (PAYMENT line) — Principal/Superadmin only
 * issue_refund: Posts a REFUND line linked to original PAYMENT — Principal/Superadmin only
 */
export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const action = body.action;

    // ─── Cancel Receipt ───
    if (action === 'cancel_receipt') {
      const { receipt_no, line_id, reason } = body;
      if (!reason) {
        return NextResponse.json({ success: false, error: 'reason is required' }, { status: 400 });
      }

      let targetLineId = line_id;
      if (!targetLineId && receipt_no) {
        const line = await getLineByReceiptNo(tenant, receipt_no);
        if (!line) {
          return NextResponse.json({ success: false, error: `Receipt ${receipt_no} not found` }, { status: 404 });
        }
        targetLineId = line.id;
      }

      if (!targetLineId) {
        return NextResponse.json({ success: false, error: 'line_id or receipt_no is required' }, { status: 400 });
      }

      const cancelled = await cancelLedgerLine(tenant, targetLineId, reason, (auth as any).userId);
      if (!cancelled) {
        return NextResponse.json({ success: false, error: 'Line not found or already cancelled' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Receipt cancelled successfully',
        line: cancelled,
      });
    }

    // ─── Issue Refund ───
    if (action === 'issue_refund') {
      const { student_id, amount, fee_head, month, payment_mode, linked_line_id, remarks } = body;
      if (!student_id || !amount) {
        return NextResponse.json({ success: false, error: 'student_id and amount are required' }, { status: 400 });
      }

      const refundLines = await postLedgerLines(tenant, [{
        student_id,
        class_name: body.class_name || '',
        section: body.section || '',
        admission_no: body.admission_no || '',
        academic_session: body.session || '2026-27',
        line_type: 'REFUND',
        fee_head: fee_head || 'MISC',
        month: month || null,
        amount: Math.round(Number(amount)),
        payment_mode: payment_mode || null,
        linked_line_id: linked_line_id || null,
        approved_by: (auth as any).userId,
        remarks: remarks || 'Refund issued',
      }], (auth as any).userId);

      return NextResponse.json({
        success: true,
        message: 'Refund issued successfully',
        lines: refundLines,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use cancel_receipt or issue_refund' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_FEE_RECEIPT_POST]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process' }, { status: 500 });
  }
}
