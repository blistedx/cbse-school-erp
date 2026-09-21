import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { FeesService } from '@/lib/services/fees.service';
import type { GroupByDimension } from '@/lib/fees-engine';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const action = searchParams.get('action') || 'overview';
    const session = searchParams.get('session') || '2026-27';

    // 1. Student Fee Status & Ledger View
    if (action === 'student_ledger' || action === 'student_status') {
      const studentId = searchParams.get('student_id');
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
      }

      // If student role, ensure they are requesting their own ID
      if (auth.role === 'STUDENT' && auth.userId && auth.userId !== studentId) {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot access other student fees' }, { status: 403 });
      }

      const res = await FeesService.getStudentFeeStatus(tenant, studentId, session);
      return NextResponse.json({ success: true, ...res });
    }

    // Role Guard for school-wide financial actions
    if (![...ADMIN_ROLES, 'ACCOUNTANT'].includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions to view school-wide fee records' },
        { status: 403 }
      );
    }

    // 2. School Fee Overview & Financial KPIs
    if (action === 'overview' || action === 'summary') {
      const overview = await FeesService.getSchoolFeeSummary(tenant, session);
      return NextResponse.json({ success: true, overview });
    }

    // 3. Annual Fee Pending Report
    if (action === 'annual_pending') {
      const className = searchParams.get('class_name') || undefined;
      const section = searchParams.get('section') || undefined;
      const search = searchParams.get('search') || undefined;
      const res = await FeesService.getAnnualFeePending(tenant, session, { className, section, search });
      return NextResponse.json({ success: true, ...res });
    }

    // 4. Pending & Defaulters List
    if (action === 'pending_list') {
      const className = searchParams.get('class_name') || undefined;
      const section = searchParams.get('section') || undefined;
      const search = searchParams.get('search') || undefined;
      const pending = await FeesService.getPendingList(tenant, session, { className, section, search });
      return NextResponse.json({ success: true, count: pending.length, pending });
    }

    // 5. Single Receipt Lookup
    if (action === 'receipt') {
      const receiptNo = searchParams.get('receipt_no') || searchParams.get('no') || '';
      if (!receiptNo) {
        return NextResponse.json({ success: false, error: 'receipt_no is required' }, { status: 400 });
      }
      const receipt = await FeesService.getReceipt(tenant, receiptNo);
      if (!receipt) {
        return NextResponse.json({ success: false, error: `Receipt "${receiptNo}" not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, receipt });
    }

    // 6. Generic Collections / Aggregate
    if (action === 'aggregate' || action === 'collections') {
      const groupByStr = searchParams.get('group_by') || 'month';
      const groupBy = groupByStr.split(',') as GroupByDimension[];
      const rows = await FeesService.getCollection(tenant, session, groupBy);
      return NextResponse.json({ success: true, count: rows.length, rows });
    }

    // 7. Fee Configuration
    if (action === 'config') {
      const config = await FeesService.getFeeConfig(tenant, session);
      return NextResponse.json({ success: true, config });
    }

    // 8. Execute Report
    if (action === 'report') {
      const reportId = searchParams.get('report_id') || 'annual_fee_pending';
      const report = await FeesService.executeReport(tenant, reportId, {
        session,
        search: searchParams.get('search') || undefined,
        classes: searchParams.get('classes') ? searchParams.get('classes')!.split(',') : undefined,
        sections: searchParams.get('sections') ? searchParams.get('sections')!.split(',') : undefined,
      });
      return NextResponse.json({ success: true, report });
    }

    // Default: Return overview
    const overview = await FeesService.getSchoolFeeSummary(tenant, session);
    return NextResponse.json({ success: true, overview });
  } catch (error: any) {
    console.error('[API_FEES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to load fee data.' }, { status: 500 });
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

    const action = body.action || searchParams.get('action') || 'collect';
    const actorId = (auth as any)?.userId || (auth as any)?.user?.username || 'ADMIN';

    // 1. Collect Fee Payment
    if (action === 'collect' || action === 'collect_payment') {
      const result = await FeesService.collectFee({
        schoolId: tenant,
        studentId: body.student_id,
        session: body.session || '2026-27',
        amountPaise: Number(body.amount_paise) || 0,
        paymentMode: body.payment_mode || 'CASH',
        txnRef: body.txn_ref,
        chequeNo: body.cheque_no,
        remarks: body.remarks,
        collectedBy: actorId,
        selectedHeadPeriodKeys: body.selected_keys,
        autoAllocate: body.auto_allocate ?? true,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      try {
        revalidateTag('fees', { expire: 0 });
        revalidateTag('overview', { expire: 0 });
      } catch {}

      return NextResponse.json({ success: true, ...result });
    }

    // 2. Save Fee Config
    if (action === 'save_config') {
      const saved = await FeesService.saveFeeConfig(tenant, body.session || '2026-27', body.config, actorId);
      try {
        revalidateTag('fees', { expire: 0 });
        revalidateTag('overview', { expire: 0 });
      } catch {}
      return NextResponse.json({ success: true, config: saved });
    }

    // 3. Cancel Receipt
    if (action === 'cancel_receipt') {
      const receiptNo = body.receipt_no;
      const reason = body.reason || 'Cancelled by Admin';
      const result = await FeesService.cancelFeeReceipt(tenant, receiptNo, reason, actorId);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      try {
        revalidateTag('fees', { expire: 0 });
        revalidateTag('overview', { expire: 0 });
      } catch {}
      return NextResponse.json({ success: true, message: `Receipt ${receiptNo} cancelled.` });
    }

    return NextResponse.json({ success: false, error: `Unsupported fee action "${action}"` }, { status: 400 });
  } catch (error: any) {
    console.error('[API_FEES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process fee request.' }, { status: 500 });
  }
}
