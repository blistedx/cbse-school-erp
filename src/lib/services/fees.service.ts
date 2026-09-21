/*! EduSuite Unified Fees Service v1.0.0 */
/**
 * Single source of truth for all Fee calculations, Demands, Ledger,
 * Collections, Receipts, and Reports across CBSE School ERP.
 * 
 * Double-Entry Accounting Model:
 *  - DEBIT lines  = Invoiced fee obligations (Tuition, Annual, Transport, Exam, Admission)
 *  - CREDIT lines = Payments received (CASH, UPI, CHEQUE, ONLINE) or authorized Concessions
 *  - Balance = Sum(DEBIT) - Sum(CREDIT)
 */

import { Database, invalidateServerCache } from '@/lib/db';
import {
  FeeLedgerLine,
  ReceiptRecord as FeeReceipt,
  FeeConfig as FeeMasterConfig,
  LedgerFeeSummary as StudentFeeSummary,
  StudentLedgerViewItem,
  FeeAggregateFilters,
  FeeAggregateRow,
  GroupByDimension,
  SchoolFeeOverviewAggregate as SchoolFeeOverviewAggregation,
  PaymentMode,
  ReportQueryResult,
  REPORT_CONFIGS,
  getStudentLedger,
  getStudentFeeSummary,
  getStudentLedgerView,
  getFeeAggregate,
  getSchoolLedgerLines,
  postLedgerLines,
  cancelLedgerLine,
  collectFeePayment,
  cancelReceipt,
  getStudentReceipts,
  getSchoolReceipts,
  getReceiptByNo,
  searchReceipts,
  bulkMapFees,
  getFeeConfig,
  saveFeeConfig,
  getSchoolFeeOverviewAggregation,
  invalidateFeeOverviewMemoryCache,
} from '@/lib/fees-engine';
import { normalizeClassName, isSameClass, formatCurrency } from '@/lib/utils';
import { AggregatesService } from '@/lib/services/aggregates.service';

export interface PendingStudentItem {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  fatherName?: string;
  mobile?: string;
  totalBilledPaise: number;
  totalPaidPaise: number;
  pendingPaise: number;
  status: 'PENDING' | 'PARTIAL' | 'OVERDUE' | 'PAID' | 'ADVANCE';
}

export interface AnnualFeePendingItem {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  fatherName: string;
  mobile: string;
  annualBilledPaise: number;
  annualPaidPaise: number;
  annualDuePaise: number;
  status: 'ANNUAL_DUE' | 'PARTIAL' | 'PAID';
}

export interface CollectFeeInput {
  schoolId: string;
  studentId: string;
  session?: string;
  amountPaise: number;
  paymentMode: PaymentMode;
  txnRef?: string;
  chequeNo?: string;
  remarks?: string;
  collectedBy: string;
  selectedHeadPeriodKeys?: string[];
  isAdvanceYearly?: boolean;
  autoAllocate?: boolean;
}

export class FeesService {
  /**
   * 1. Get detailed student fee status, ledger view, and receipts
   */
  static async getStudentFeeStatus(
    schoolId: string,
    studentId: string,
    session: string = '2026-27'
  ): Promise<{
    summary: StudentFeeSummary;
    ledgerView: StudentLedgerViewItem[];
    receipts: FeeReceipt[];
  }> {
    const [ledgerView, summary, receipts] = await Promise.all([
      getStudentLedgerView(schoolId, studentId, session),
      getStudentFeeSummary(schoolId, studentId, session),
      getStudentReceipts(schoolId, studentId, session)
    ]);

    return { summary, ledgerView, receipts };
  }

  /**
   * 2. Collect fee payment and record receipt & credit ledger lines
   */
  static async collectFee(
    input: CollectFeeInput
  ): Promise<{
    success: boolean;
    receipt?: FeeReceipt;
    ledgerLines?: FeeLedgerLine[];
    error?: string;
  }> {
    const schoolId = input.schoolId || 'DPS2026';
    const session = input.session || '2026-27';

    const students = await Database.getStudents(schoolId, session);
    const student = students.find(s => s.id === input.studentId || s.admission_no === input.studentId);
    if (!student) {
      return { success: false, error: 'Student record not found in school directory' };
    }

    try {
      const result = await collectFeePayment({
        schoolId,
        student,
        session,
        amountPaise: input.amountPaise,
        paymentMode: input.paymentMode,
        txnRef: input.txnRef,
        chequeNo: input.chequeNo,
        remarks: input.remarks,
        collectedBy: input.collectedBy,
        selectedHeadPeriodKeys: input.selectedHeadPeriodKeys,
        isAdvanceYearly: input.isAdvanceYearly,
      });

      if (result.receipt) {
        // Invalidate caches
        invalidateFeeOverviewMemoryCache(schoolId);
        invalidateServerCache('fees');
        invalidateServerCache('overview');
        invalidateServerCache('students');

        // Atomically increment pre-aggregated summary
        AggregatesService.recordFeeDelta(schoolId, session, {
          collectedPaiseDelta: input.amountPaise,
          pendingPaiseDelta: -input.amountPaise,
          receiptsDelta: 1
        }).catch(() => {});

        // Sync student fee status on student document
        await Database.syncStudentFeeStatus(student.id, student.admission_no, schoolId);
      }

      return {
        success: Boolean(result.receipt),
        receipt: result.receipt,
        ledgerLines: result.postedLines,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to process fee collection'
      };
    }
  }

  /**
   * 3. Get pending / defaulters list across the school
   */
  static async getPendingList(
    schoolId: string,
    session: string = '2026-27',
    filters: {
      className?: string;
      section?: string;
      month?: string;
      search?: string;
    } = {}
  ): Promise<PendingStudentItem[]> {
    const [students, lines] = await Promise.all([
      Database.getStudents(schoolId, session),
      getSchoolLedgerLines(schoolId, session)
    ]);

    // Group lines by student_id
    const linesByStudent = new Map<string, FeeLedgerLine[]>();
    for (const l of lines) {
      if (l.is_cancelled) continue;
      const arr = linesByStudent.get(l.student_id) || [];
      arr.push(l);
      linesByStudent.set(l.student_id, arr);
    }

    const pendingList: PendingStudentItem[] = [];

    for (const s of students) {
      if (s.status === 'INACTIVE' || s.status === 'ALUMNI') continue;

      if (filters.className && !isSameClass(s.class_name, filters.className)) continue;
      if (filters.section && (s.section || 'A').toUpperCase().trim() !== filters.section.toUpperCase().trim()) continue;
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matchName = (s.full_name || '').toLowerCase().includes(q);
        const matchAdm = (s.admission_no || '').toLowerCase().includes(q);
        if (!matchName && !matchAdm) continue;
      }

      const sLines = linesByStudent.get(s.id) || [];
      let totalBilled = 0;
      let totalPaid = 0;

      for (const l of sLines) {
        const amt = Number(l.amount) || 0;
        if (['DEMAND', 'OPENING_BALANCE', 'FINE'].includes(l.line_type) || (l.line_type === 'ADJUSTMENT' && l.adjustment_direction !== 'CREDIT')) {
          totalBilled += amt;
        } else if (l.line_type === 'PAYMENT' || (l.line_type === 'ADJUSTMENT' && l.adjustment_direction === 'CREDIT')) {
          totalPaid += amt;
        } else if (['DISCOUNT', 'WAIVER'].includes(l.line_type)) {
          totalBilled -= amt;
        }
      }

      const pendingPaise = Math.max(0, totalBilled - totalPaid);
      if (pendingPaise > 0) {
        let status: PendingStudentItem['status'] = 'PENDING';
        if (totalPaid > 0) status = 'PARTIAL';
        else status = 'OVERDUE';

        pendingList.push({
          studentId: s.id,
          admissionNo: s.admission_no || '',
          studentName: s.full_name || 'Scholar',
          className: s.class_name || 'Class 1',
          section: s.section || 'A',
          fatherName: s.father_name || s.guardian_name || '',
          mobile: s.guardian_phone || s.phone || '',
          totalBilledPaise: totalBilled,
          totalPaidPaise: totalPaid,
          pendingPaise,
          status
        });
      }
    }

    return pendingList.sort((a, b) => b.pendingPaise - a.pendingPaise);
  }

  /**
   * 4. Get Annual Fee Pending Report — Single Source of Truth
   * Fixes Bug: Computes net Annual Fee dues specifically for fee_head === 'ANNUAL'
   */
  static async getAnnualFeePending(
    schoolId: string,
    session: string = '2026-27',
    filters: {
      className?: string;
      section?: string;
      search?: string;
    } = {}
  ): Promise<{
    items: AnnualFeePendingItem[];
    totalDuePaise: number;
    totalPendingCount: number;
  }> {
    const [students, lines] = await Promise.all([
      Database.getStudents(schoolId, session),
      getSchoolLedgerLines(schoolId, session, { fee_head: 'ANNUAL' })
    ]);

    // Group annual lines by student_id
    const annualLinesByStudent = new Map<string, { billed: number; paid: number; discount: number }>();
    for (const l of lines) {
      if (l.is_cancelled) continue;
      if (l.fee_head !== 'ANNUAL') continue;

      const current = annualLinesByStudent.get(l.student_id) || { billed: 0, paid: 0, discount: 0 };
      const amt = Number(l.amount) || 0;
      if (['DEMAND', 'OPENING_BALANCE', 'FINE'].includes(l.line_type) || (l.line_type === 'ADJUSTMENT' && l.adjustment_direction !== 'CREDIT')) {
        current.billed += amt;
      } else if (l.line_type === 'PAYMENT' || (l.line_type === 'ADJUSTMENT' && l.adjustment_direction === 'CREDIT')) {
        current.paid += amt;
      } else if (['DISCOUNT', 'WAIVER'].includes(l.line_type)) {
        current.discount += amt;
      }
      annualLinesByStudent.set(l.student_id, current);
    }

    const items: AnnualFeePendingItem[] = [];
    let totalDuePaise = 0;

    for (const s of students) {
      if (s.status === 'INACTIVE' || s.status === 'ALUMNI') continue;
      if (String(s.is_rte || '').toUpperCase() === 'YES') continue; // RTE is exempt

      if (filters.className && !isSameClass(s.class_name, filters.className)) continue;
      if (filters.section && (s.section || 'A').toUpperCase().trim() !== filters.section.toUpperCase().trim()) continue;
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matchName = (s.full_name || '').toLowerCase().includes(q);
        const matchAdm = (s.admission_no || '').toLowerCase().includes(q);
        if (!matchName && !matchAdm) continue;
      }

      const annualData = annualLinesByStudent.get(s.id) || { billed: 0, paid: 0, discount: 0 };
      const billed = annualData.billed > 0 ? annualData.billed : 500000; // Standard annual fee if unmapped
      const netBilled = Math.max(0, billed - annualData.discount);
      const paid = annualData.paid;
      const due = Math.max(0, netBilled - paid);

      if (due > 0) {
        totalDuePaise += due;
        items.push({
          studentId: s.id,
          admissionNo: s.admission_no || '',
          studentName: s.full_name || 'Scholar',
          className: s.class_name || 'Class 1',
          section: s.section || 'A',
          fatherName: s.father_name || s.guardian_name || 'Parent',
          mobile: s.guardian_phone || s.phone || s.parent_phone || 'N/A',
          annualBilledPaise: netBilled,
          annualPaidPaise: paid,
          annualDuePaise: due,
          status: paid > 0 ? 'PARTIAL' : 'ANNUAL_DUE',
        });
      }
    }

    return {
      items: items.sort((a, b) => b.annualDuePaise - a.annualDuePaise),
      totalDuePaise,
      totalPendingCount: items.length
    };
  }

  /**
   * 5. Get canonical School Fee Summary & KPIs (Used by Overview Dashboard & Fee Master)
   */
  static async getSchoolFeeSummary(
    schoolId: string,
    session: string = '2026-27'
  ): Promise<SchoolFeeOverviewAggregation> {
    const aggregate = await AggregatesService.getSchoolAggregate(schoolId, session);
    return {
      totalBilledPaise: aggregate.financials.totalBilledPaise,
      totalCollectedPaise: aggregate.financials.totalCollectedPaise,
      totalPendingPaise: aggregate.financials.totalPendingPaise,
      totalDiscountPaise: aggregate.financials.totalDiscountPaise,
      totalAdvancePaise: 0,
      totalWaiverPaise: aggregate.financials.totalWaiverPaise,
      totalFinePaise: aggregate.financials.totalFinePaise,
      collectionPercentage: aggregate.financials.collectionPercentage,
      studentsWithNothingPaid: aggregate.financials.studentsWithNothingPaid,
      monthWiseTrend: aggregate.financials.monthWiseTrend as any,
      topPending: [],
      classBreakdown: [],
      cycleMetrics: {},
    } as SchoolFeeOverviewAggregation;
  }

  /**
   * 6. Query Collections & Aggregate
   */
  static async getCollection(
    schoolId: string,
    session: string = '2026-27',
    groupBy: GroupByDimension[] = ['month'],
    filters: Partial<FeeAggregateFilters> = {}
  ): Promise<FeeAggregateRow[]> {
    return getFeeAggregate(schoolId, { ...filters, session }, groupBy);
  }

  /**
   * 6.1 Get School Receipts List
   */
  static async getReceipts(
    schoolId: string,
    session: string = '2026-27',
    limit: number = 1000
  ): Promise<FeeReceipt[]> {
    return getSchoolReceipts(schoolId, session, limit);
  }

  /**
   * 7. Get Single Receipt
   */
  static async getReceipt(
    schoolId: string,
    receiptNo: string
  ): Promise<FeeReceipt | null> {
    return getReceiptByNo(schoolId, receiptNo);
  }

  /**
   * 8. Cancel Receipt
   */
  static async cancelFeeReceipt(
    schoolId: string,
    receiptNo: string,
    reason: string,
    actorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await cancelReceipt(schoolId, receiptNo, reason, actorId);

    if (result.success) {
      invalidateFeeOverviewMemoryCache(schoolId);
      invalidateServerCache('fees');
      invalidateServerCache('overview');
      AggregatesService.rebuildSchoolAggregate(schoolId).catch(() => {});
    }

    return result;
  }

  /**
   * 9. Execute Any Standard Fee Report
   */
  static async executeReport(
    schoolId: string,
    reportId: string,
    filters: Partial<FeeAggregateFilters> = {}
  ): Promise<ReportQueryResult> {
    const session = filters.session || '2026-27';
    const config = REPORT_CONFIGS.find(r => r.id === reportId) || {
      id: reportId,
      name: reportId.replace(/_/g, ' ').toUpperCase(),
      group: 'COLLECTION_REALIZATION' as const,
      groupLabel: 'Collection & Realization',
      description: 'Custom Fee Report',
      supportedFilters: ['session', 'month', 'class', 'search'],
      exportFilenamePrefix: reportId,
      columns: [
        { key: 'studentName', header: 'Student Name', align: 'left' as const },
        { key: 'admissionNo', header: 'Adm No', align: 'left' as const },
        { key: 'classSection', header: 'Class-Sec', align: 'center' as const },
        { key: 'amountPaise', header: 'Amount', align: 'right' as const, format: 'currency' as const },
      ]
    };

    // Special Case: Annual Fee Pending Report
    if (reportId === 'annual_fee_pending') {
      const { items, totalDuePaise } = await this.getAnnualFeePending(schoolId, session, {
        className: filters.classes && filters.classes.length === 1 ? filters.classes[0] : undefined,
        section: filters.sections && filters.sections.length === 1 ? filters.sections[0] : undefined,
        search: filters.search
      });

      const rows = items.map(item => ({
        studentName: item.studentName,
        admissionNo: item.admissionNo,
        classSection: `${item.className} - ${item.section}`,
        fatherName: item.fatherName,
        mobile: item.mobile,
        annualDuePaise: item.annualDuePaise,
        status: item.status,
      }));

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        session,
        filtersUsed: { ...filters, session },
        summaryKpis: [
          { label: 'Annual Fee Pending Count', value: rows.length.toString(), color: 'text-amber-700' },
          { label: 'Annual Fee Outstanding', value: formatCurrency(totalDuePaise), color: 'text-rose-800' },
        ],
        columns: config.columns,
        rows,
        totalRowCount: rows.length,
        grandTotalRow: {
          studentName: 'Grand Total',
          admissionNo: `${rows.length} Students`,
          classSection: '',
          fatherName: '',
          mobile: '',
          annualDuePaise: totalDuePaise,
          status: '',
        }
      };
    }

    // Standard Report via Fee Aggregate / Receipts
    const receipts = await getSchoolReceipts(schoolId, session, 2000);
    const filteredReceipts = receipts.filter(r => {
      if (filters.classes && filters.classes.length > 0 && !filters.classes.includes(r.class_name)) return false;
      if (filters.sections && filters.sections.length > 0 && !filters.sections.includes(r.section)) return false;
      if (filters.paymentModes && filters.paymentModes.length > 0 && !filters.paymentModes.includes(r.payment_mode)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const m1 = (r.student_name || '').toLowerCase().includes(q);
        const m2 = (r.admission_no || '').toLowerCase().includes(q);
        const m3 = (r.receipt_no || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });

    let totalCollectedPaise = 0;
    const rows = filteredReceipts.map(r => {
      totalCollectedPaise += r.amount_paise;
      return {
        receiptNo: r.receipt_no,
        date: r.payment_date,
        studentName: r.student_name,
        admissionNo: r.admission_no,
        classSection: `${r.class_name} - ${r.section}`,
        mode: r.payment_mode,
        amountPaise: r.amount_paise,
        collectedBy: r.collected_by,
        status: r.is_cancelled ? 'CANCELLED' : 'CLEARED'
      };
    });

    return {
      reportId: config.id,
      reportName: config.name,
      generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      session,
      filtersUsed: { ...filters, session },
      summaryKpis: [
        { label: 'Total Transactions', value: rows.length.toString(), color: 'text-slate-800' },
        { label: 'Total Realized', value: formatCurrency(totalCollectedPaise), color: 'text-emerald-700' }
      ],
      columns: config.columns,
      rows,
      totalRowCount: rows.length,
      grandTotalRow: {
        receiptNo: 'Grand Total',
        date: '',
        studentName: `${rows.length} Receipts`,
        admissionNo: '',
        classSection: '',
        mode: '',
        amountPaise: totalCollectedPaise,
        collectedBy: '',
        status: ''
      }
    };
  }

  /**
   * 10. Fee Master Configuration
   */
  static async getFeeConfig(schoolId: string, session: string = '2026-27'): Promise<FeeMasterConfig> {
    return getFeeConfig(schoolId, session);
  }

  static async saveFeeConfig(
    schoolId: string,
    session: string = '2026-27',
    config: Partial<FeeMasterConfig>,
    updatedBy: string = 'ADMIN'
  ): Promise<FeeMasterConfig> {
    const saved = await saveFeeConfig(schoolId, { ...config, academic_session: session }, updatedBy);
    invalidateFeeOverviewMemoryCache(schoolId);
    invalidateServerCache('fees');
    invalidateServerCache('overview');
    return saved;
  }

  /**
   * 11. Ensure MongoDB Indexes for Fees & Receipts
   */
  static async ensureFeeIndexes(): Promise<void> {
    const { ensureLedgerIndexes } = await import('@/lib/fees-engine/ledger');
    await ensureLedgerIndexes();
  }
}
