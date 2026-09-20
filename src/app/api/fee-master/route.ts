/*! EduSuite Fee Master — Unified Ledger & Engine API v3.0.0 */

import { NextResponse } from 'next/server';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import {
  postLedgerLines,
  getStudentLedger,
  getStudentFeeSummary,
  getStudentLedgerView,
  getFeeAggregate,
  getSchoolLedgerLines,
  cancelLedgerLine,
  getFeeConfig,
  saveFeeConfig,
  collectFeePayment,
  cancelReceipt,
  getStudentReceipts,
  getSchoolReceipts,
  getReceiptByNo,
  searchReceipts,
  bulkMapFees,
  seedRealisticFeeData,
  executeReport,
  REPORT_CONFIGS,
} from '@/lib/fees-engine';
import { getSchoolFeeMetrics } from '@/lib/fees/metrics';
import { Database } from '@/lib/db';
import type { FeeAggregateFilters, GroupByDimension } from '@/lib/fees-engine';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id'));
    if (tenant instanceof NextResponse) return tenant;

    const action = searchParams.get('action') || 'aggregate';
    const session = searchParams.get('session') || '2026-27';

    // 1. Fee Configuration
    if (action === 'config') {
      const config = await getFeeConfig(tenant, session);
      return NextResponse.json({ success: true, config });
    }

    // 2. Student Ledger View
    if (action === 'student_ledger_view' || action === 'student_ledger') {
      const studentId = searchParams.get('student_id');
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }
      const ledgerView = await getStudentLedgerView(tenant, studentId, session);
      const summary = await getStudentFeeSummary(tenant, studentId, session);
      const receipts = await getStudentReceipts(tenant, studentId, session);
      return NextResponse.json({ success: true, ledgerView, summary, receipts });
    }

    // 3. Student Summary
    if (action === 'student_summary') {
      const studentId = searchParams.get('student_id');
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }
      const summary = await getStudentFeeSummary(tenant, studentId, session);
      return NextResponse.json({ success: true, summary });
    }

    // 4. Student Receipts
    if (action === 'student_receipts') {
      const studentId = searchParams.get('student_id');
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }
      const receipts = await getStudentReceipts(tenant, studentId, session);
      return NextResponse.json({ success: true, count: receipts.length, receipts });
    }

    // 5. School Receipts Search or List
    if (action === 'receipts' || action === 'search_receipt') {
      const q = searchParams.get('q') || searchParams.get('search') || '';
      const limit = parseInt(searchParams.get('limit') || '500', 10);
      if (q.trim()) {
        const receipts = await searchReceipts(tenant, q, session, limit);
        return NextResponse.json({ success: true, count: receipts.length, receipts });
      }
      const receipts = await getSchoolReceipts(tenant, session, limit);
      return NextResponse.json({ success: true, count: receipts.length, receipts });
    }

    // 5.1 Single Receipt Lookup by Receipt Number
    if (action === 'receipt_by_no' || action === 'get_receipt') {
      const receiptNo = searchParams.get('receipt_no') || searchParams.get('no') || '';
      if (!receiptNo) {
        return NextResponse.json({ success: false, error: 'receipt_no is required' }, { status: 400 });
      }
      const receipt = await getReceiptByNo(tenant, receiptNo);
      if (!receipt) {
        return NextResponse.json({ success: false, error: `Receipt "${receiptNo}" not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, receipt });
    }

    // 6. Reports Engine Query
    if (action === 'report') {
      const reportId = searchParams.get('report_id') || 'month_class_collection';
      const students = await Database.getStudents(tenant, session);

      const filters: FeeAggregateFilters = { session };
      if (searchParams.get('month')) filters.months = [searchParams.get('month') as any];
      if (searchParams.get('classes')) filters.classes = searchParams.get('classes')!.split(',');
      if (searchParams.get('sections')) filters.sections = searchParams.get('sections')!.split(',');
      if (searchParams.get('transport')) filters.transportOpted = searchParams.get('transport') === 'true';
      if (searchParams.get('sibling')) filters.siblingOpted = searchParams.get('sibling') === 'true';
      if (searchParams.get('search')) filters.search = searchParams.get('search')!;

      const reportResult = await executeReport(tenant, reportId, filters, students);
      return NextResponse.json({ success: true, report: reportResult });
    }

    // 7. Report Configurations List
    if (action === 'report_configs') {
      return NextResponse.json({ success: true, configs: REPORT_CONFIGS });
    }

    // 8. Overview KPIs and Mini-Tables
    if (action === 'overview') {
      const [feeMetrics, thisMonthReport] = await Promise.all([
        getSchoolFeeMetrics(tenant, session),
        executeReport(tenant, 'month_class_collection', { session, months: ['SEP'] }),
      ]);

      return NextResponse.json({
        success: true,
        overview: {
          totalBilledPaise: feeMetrics.billedDueToDatePaise,
          totalCollectedPaise: feeMetrics.totalCollectedPaise,
          totalPendingPaise: feeMetrics.pendingDuesPaise,
          totalDiscountPaise: feeMetrics.discountFullSessionPaise,
          totalAdvancePaise: feeMetrics.advanceCollectedPaise,
          collectionPercentage: feeMetrics.collectionRate,
          studentsWithNothingPaid: feeMetrics.neverPaidCount,
          thisMonthBreakdown: thisMonthReport.rows,
          topPending: [],
          headBreakdown: feeMetrics.headBreakdown,
        },
      });
    }

    // 9. Generic Aggregate
    const filters: FeeAggregateFilters = { session };
    const groupByStr = searchParams.get('group_by') || '';
    const groupBy = groupByStr ? groupByStr.split(',') as GroupByDimension[] : [];

    const rows = await getFeeAggregate(tenant, filters, groupBy);
    return NextResponse.json({ success: true, count: rows.length, rows });
  } catch (error: any) {
    console.error('[API_FEE_MASTER_GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, [...ADMIN_ROLES, 'ACCOUNTANT']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, body.school_id || searchParams.get('school_id'));
    if (tenant instanceof NextResponse) return tenant;

    const action = body.action || searchParams.get('action') || 'post_lines';
    const actorId = (auth as any)?.userId || (auth as any)?.user?.username || 'ADMIN';

    // 1. Collect Fee Payment
    if (action === 'collect_payment') {
      const studentId = body.student_id;
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }

      const students = await Database.getStudents(tenant);
      const student = students.find(s => s.id === studentId);
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }

      const res = await collectFeePayment({
        schoolId: tenant,
        student,
        session: body.session || '2026-27',
        amountPaise: Number(body.amount_paise) || 0,
        paymentMode: body.payment_mode || 'CASH',
        txnRef: body.txn_ref,
        chequeNo: body.cheque_no,
        remarks: body.remarks,
        collectedBy: actorId,
        selectedHeadPeriodKeys: body.selected_keys,
        isAdvanceYearly: body.is_advance_yearly,
      });

      return NextResponse.json({
        success: true,
        message: `Payment collected successfully. Receipt No: ${res.receipt.receipt_no}`,
        receipt: res.receipt,
        postedLinesCount: res.postedLines.length,
      });
    }

    // 2. Cancel Receipt
    if (action === 'cancel_receipt') {
      const userRole = ((auth as any).role || '').toUpperCase();
      const isAdminOrPrincipal = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN'].includes(userRole);
      if (!isAdminOrPrincipal) {
        return NextResponse.json({ success: false, error: 'Only Administrators or Principal can cancel receipts' }, { status: 403 });
      }

      const receiptNo = body.receipt_no;
      const reason = body.reason;
      if (!receiptNo || !reason) {
        return NextResponse.json({ success: false, error: 'receipt_no and reason are required' }, { status: 400 });
      }

      const res = await cancelReceipt(tenant, receiptNo, reason, actorId);
      return NextResponse.json(res);
    }

    // 3. Save Fee Structure Config
    if (action === 'save_config') {
      const updatedConfig = await saveFeeConfig(tenant, body.config, actorId);
      return NextResponse.json({ success: true, message: 'Fee configuration saved successfully', config: updatedConfig });
    }

    // 4. Bulk Map Fees to Students
    if (action === 'bulk_map') {
      const students = await Database.getStudents(tenant);
      const session = body.session || '2026-27';
      const res = await bulkMapFees(tenant, students, session, {
        classGroup: body.class_group,
        studentId: body.student_id,
      }, actorId);

      return NextResponse.json({
        success: true,
        message: `Mapped fees for ${res.mappedStudents} active students (${res.totalLinesCreated} ledger entries created, ${res.totalLinesSkipped} existing skipped).`,
        result: res,
      });
    }

    // 5. Load Demo Seed Data
    if (action === 'seed_demo_data') {
      const students = await Database.getStudents(tenant);
      const session = body.session || '2026-27';
      const res = await seedRealisticFeeData(tenant, students, session, actorId);

      return NextResponse.json({
        success: true,
        message: `Realistic fee dataset seeded: ${res.paymentsCount} transactions processed, ₹${res.totalCollectedRupees.toLocaleString('en-IN')} collected as of Sept 10.`,
        result: res,
      });
    }

    // 6. Post Raw Lines
    const rawLines = body.lines;
    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return NextResponse.json({ success: false, error: 'lines array is required' }, { status: 400 });
    }

    const posted = await postLedgerLines(tenant, rawLines, actorId);
    return NextResponse.json({
      success: true,
      message: `${posted.length} ledger line(s) posted successfully`,
      count: posted.length,
      lines: posted,
    });
  } catch (error: any) {
    console.error('[API_FEE_MASTER_POST]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to execute operation' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN', 'GOD_ACCESS']);
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
