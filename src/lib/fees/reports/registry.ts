/*! EduSuite Fee Master — Strongly-Typed Report Registry Engine v5.0.0 */

import type { ReportQueryResult, ReportColumnDef, ReportSummaryKpi } from '@/lib/fees-engine/report-configs';
import { REPORT_CONFIGS } from '@/lib/fees-engine/report-configs';
import { computeStudentFeeState, AS_OF_TODAY_DATE } from '../metrics';
import type { FeeDemandRecord, FeePaymentRecord } from '../fee-service';
import type { Student } from '@/lib/types';

export interface ReportBuildContext {
  schoolId: string;
  session: string;
  asOfDate: string;
  students: Student[];
  demands: FeeDemandRecord[];
  payments: FeePaymentRecord[];
  filters: {
    month?: string;
    className?: string;
    section?: string;
    groupBy?: 'class' | 'section';
    paymentMode?: string;
    search?: string;
  };
}

export type ReportBuilderFn = (ctx: ReportBuildContext) => {
  rows: Record<string, any>[];
  grandTotalRow: Record<string, any>;
  summaryKpis: ReportSummaryKpi[];
};

const formatCurrency = (paise: number) => `₹${(Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN')}`;

// Canonical sorting order for CBSE Classes
export const CLASS_ORDER = [
  'Playgroup', 'PG', 'Nursery', 'LKG', 'UKG', 'KG', 'Pre-Primary',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

function normalizeClassKey(c: string = ''): string {
  const s = String(c).trim();
  return s;
}

function classComparator(a: string, b: string): number {
  const idxA = CLASS_ORDER.findIndex(k => a.toLowerCase() === k.toLowerCase() || a.toLowerCase().startsWith(k.toLowerCase() + ' '));
  const idxB = CLASS_ORDER.findIndex(k => b.toLowerCase() === k.toLowerCase() || b.toLowerCase().startsWith(k.toLowerCase() + ' '));
  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return a.localeCompare(b);
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

export const REPORT_BUILDERS: Record<string, ReportBuilderFn> = {
  // ─── 1. Month-wise Class-wise Collection ───
  month_class_collection: (ctx) => {
    const targetMonth = (ctx.filters.month || 'SEP').toUpperCase();
    const isGroupByClass = ctx.filters.groupBy === 'class';
    
    // Group students by Class + Section (default: 18 rows) or Class (16 rows)
    const classSecMap = new Map<string, {
      className: string;
      totalStudents: number;
      submittedCount: number;
      notSubmittedCount: number;
      demandPaise: number;
      collectedPaise: number;
      pendingPaise: number;
    }>();

    // Map demands and payments for target month
    const demandsByStudent = new Map<string, FeeDemandRecord[]>();
    for (const d of ctx.demands) {
      if (!demandsByStudent.has(d.studentId)) demandsByStudent.set(d.studentId, []);
      demandsByStudent.get(d.studentId)!.push(d);
    }

    const paymentsByStudent = new Map<string, FeePaymentRecord[]>();
    for (const p of ctx.payments) {
      if (p.cancelled) continue;
      if (!paymentsByStudent.has(p.studentId)) paymentsByStudent.set(p.studentId, []);
      paymentsByStudent.get(p.studentId)!.push(p);
    }

    for (const s of ctx.students) {
      if (ctx.filters.className && s.class_name !== ctx.filters.className) continue;
      if (ctx.filters.section && (s.section || 'A') !== ctx.filters.section) continue;

      const cls = s.class_name || 'Class 1';
      const sec = s.section || 'A';
      const key = isGroupByClass ? cls : `${cls} - ${sec}`;

      if (!classSecMap.has(key)) {
        classSecMap.set(key, {
          className: key,
          totalStudents: 0,
          submittedCount: 0,
          notSubmittedCount: 0,
          demandPaise: 0,
          collectedPaise: 0,
          pendingPaise: 0,
        });
      }

      const entry = classSecMap.get(key)!;
      entry.totalStudents++;

      const sDemands = (demandsByStudent.get(s.id) || []).filter(d =>
        d.period === targetMonth ||
        (targetMonth === 'SEP' && (d.period === 'SEP' || d.period === 'SEP_FEB')) ||
        (targetMonth === 'APR' && (d.period === 'APR' || d.period === 'ONE_TIME')) ||
        (targetMonth === 'MAY' && (d.period === 'MAY' || d.period === 'MAY_JUN'))
      );

      const demandPeriods = new Set(sDemands.map(d => d.period));
      let sPaidTotal = 0;
      for (const p of (paymentsByStudent.get(s.id) || [])) {
        for (const alloc of p.allocatedHeads || []) {
          if (demandPeriods.has(alloc.period)) {
            sPaidTotal += (alloc.amountPaise || 0);
          }
        }
      }

      const sDemandTotal = sDemands.reduce((sum, d) => sum + (d.netAmount || 0), 0);
      // Cap realization to demand so rate doesn't exceed 100%
      const effectivePaid = Math.min(sDemandTotal, sPaidTotal);
      const sPending = Math.max(0, sDemandTotal - effectivePaid);

      entry.demandPaise += sDemandTotal;
      entry.collectedPaise += effectivePaid;
      entry.pendingPaise += sPending;

      if (sPending === 0 && sDemandTotal > 0) {
        entry.submittedCount++;
      } else {
        entry.notSubmittedCount++;
      }
    }

    const sortedKeys = Array.from(classSecMap.keys()).sort(classComparator);
    let grandStudents = 0;
    let grandSubmitted = 0;
    let grandNotSubmitted = 0;
    let grandDemand = 0;
    let grandCollected = 0;
    let grandPending = 0;

    const rows = sortedKeys.map(k => {
      const e = classSecMap.get(k)!;
      grandStudents += e.totalStudents;
      grandSubmitted += e.submittedCount;
      grandNotSubmitted += e.notSubmittedCount;
      grandDemand += e.demandPaise;
      grandCollected += e.collectedPaise;
      grandPending += e.pendingPaise;

      const rate = e.demandPaise > 0
        ? `${Math.round((e.collectedPaise / e.demandPaise) * 100)}%`
        : '0%';

      return {
        className: e.className,
        totalStudents: e.totalStudents,
        submittedCount: e.submittedCount,
        notSubmittedCount: e.notSubmittedCount,
        demandPaise: e.demandPaise,
        collectedPaise: e.collectedPaise,
        pendingPaise: e.pendingPaise,
        realizationRate: rate,
      };
    });

    const grandRate = grandDemand > 0 ? `${Math.round((grandCollected / grandDemand) * 100)}%` : '0%';

    return {
      rows,
      grandTotalRow: {
        className: 'Grand Total',
        totalStudents: grandStudents,
        submittedCount: grandSubmitted,
        notSubmittedCount: grandNotSubmitted,
        demandPaise: grandDemand,
        collectedPaise: grandCollected,
        pendingPaise: grandPending,
        realizationRate: grandRate,
      },
      summaryKpis: [
        { label: `Total Students (${targetMonth})`, value: grandStudents.toString() },
        { label: 'Total Submitted', value: grandSubmitted.toString(), color: 'text-emerald-700' },
        { label: 'Not Submitted', value: grandNotSubmitted.toString(), color: 'text-rose-700' },
        { label: 'Total Collected', value: formatCurrency(grandCollected), color: 'text-emerald-700' },
        { label: 'Outstanding Dues', value: formatCurrency(grandPending), color: 'text-rose-800' },
        { label: 'Realization %', value: grandRate, color: 'text-blue-700' },
      ],
    };
  },

  // ─── 2. Daily Collection (Day Book) ───
  daily_collection: (ctx) => {
    let activePayments = ctx.payments.filter(p => !p.cancelled);
    if (ctx.filters.paymentMode && ctx.filters.paymentMode !== 'ALL') {
      activePayments = activePayments.filter(p => p.mode === ctx.filters.paymentMode);
    }
    if (ctx.filters.search && ctx.filters.search.trim()) {
      const q = ctx.filters.search.toLowerCase();
      activePayments = activePayments.filter(p =>
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.receiptNo || '').toLowerCase().includes(q) ||
        (p.className || '').toLowerCase().includes(q)
      );
    }

    let grandTotal = 0;
    const rows = activePayments.map(p => {
      grandTotal += p.amountPaid;
      return {
        txnDate: p.paidOn ? p.paidOn.slice(0, 10) : '2026-09-10',
        receiptNo: p.receiptNo,
        studentName: p.studentName || 'Scholar',
        className: `${p.className} - ${p.section || 'A'}`,
        paymentMode: p.mode,
        collectedBy: p.collectedBy || 'ACCOUNTS_OFFICE',
        amountPaise: p.amountPaid,
      };
    });

    return {
      rows,
      grandTotalRow: {
        txnDate: 'Total',
        receiptNo: `${rows.length} Vouchers`,
        studentName: '',
        className: '',
        paymentMode: '',
        collectedBy: '',
        amountPaise: grandTotal,
      },
      summaryKpis: [
        { label: 'Total Receipts Issued', value: rows.length.toString(), color: 'text-emerald-700' },
        { label: 'Total Cash & Bank Inflow', value: formatCurrency(grandTotal), color: 'text-emerald-800' },
      ],
    };
  },

  // ─── 3. Receipt Register (with Cancelled) ───
  receipt_register: (ctx) => {
    let list = ctx.payments;
    if (ctx.filters.paymentMode && ctx.filters.paymentMode !== 'ALL') {
      list = list.filter(p => p.mode === ctx.filters.paymentMode);
    }
    if (ctx.filters.search && ctx.filters.search.trim()) {
      const q = ctx.filters.search.toLowerCase();
      list = list.filter(p =>
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.receiptNo || '').toLowerCase().includes(q) ||
        (p.className || '').toLowerCase().includes(q)
      );
    }

    let grandActive = 0;
    let grandCancelled = 0;

    const rows = list.map(p => {
      if (p.cancelled) grandCancelled += p.amountPaid;
      else grandActive += p.amountPaid;

      return {
        receiptNo: p.receiptNo,
        paymentDate: p.paidOn ? p.paidOn.slice(0, 10) : '2026-09-10',
        studentName: p.studentName || 'Scholar',
        admissionNo: p.admissionNo || p.studentId,
        className: `${p.className} - ${p.section || 'A'}`,
        paymentMode: p.mode,
        amountPaise: p.amountPaid,
        status: p.cancelled ? 'CANCELLED' : 'PAID',
        cancelledReason: p.cancelled ? (p.cancelledReason || 'Cancelled Voucher') : (p.remarks || 'Active Receipt'),
      };
    });

    return {
      rows,
      grandTotalRow: {
        receiptNo: 'Total',
        paymentDate: `${rows.length} Receipts`,
        studentName: '',
        admissionNo: '',
        className: '',
        paymentMode: '',
        amountPaise: grandActive + grandCancelled,
        status: '',
        cancelledReason: '',
      },
      summaryKpis: [
        { label: 'Active Receipts', value: rows.filter(r => r.status === 'PAID').length.toString(), color: 'text-emerald-700' },
        { label: 'Active Inflow', value: formatCurrency(grandActive), color: 'text-emerald-800' },
        { label: 'Cancelled Receipts', value: rows.filter(r => r.status === 'CANCELLED').length.toString(), color: 'text-rose-700' },
        { label: 'Cancelled Value', value: formatCurrency(grandCancelled), color: 'text-rose-800' },
      ],
    };
  },

  // ─── 4. Payment Mode Summary ───
  payment_mode_summary: (ctx) => {
    const modeMap = new Map<string, { count: number; amount: number }>();
    const allModes = ['CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'ONLINE'];
    allModes.forEach(m => modeMap.set(m, { count: 0, amount: 0 }));

    let grandTotal = 0;
    let grandCount = 0;

    for (const p of ctx.payments) {
      if (p.cancelled) continue;
      const m = p.mode || 'CASH';
      if (!modeMap.has(m)) modeMap.set(m, { count: 0, amount: 0 });
      const entry = modeMap.get(m)!;
      entry.count++;
      entry.amount += p.amountPaid;
      grandTotal += p.amountPaid;
      grandCount++;
    }

    const rows = Array.from(modeMap.entries())
      .filter(([_, v]) => v.count > 0 || ['CASH', 'UPI', 'CHEQUE'].includes(_))
      .map(([mode, data]) => {
        const pct = grandTotal > 0 ? `${Math.round((data.amount / grandTotal) * 100)}%` : '0%';
        return {
          mode,
          receiptCount: data.count,
          amountPaise: data.amount,
          percentage: pct,
        };
      });

    return {
      rows,
      grandTotalRow: {
        mode: 'Grand Total',
        receiptCount: grandCount,
        amountPaise: grandTotal,
        percentage: '100%',
      },
      summaryKpis: [
        { label: 'Total Collections', value: formatCurrency(grandTotal), color: 'text-emerald-700' },
        { label: 'Total Transactions', value: grandCount.toString() },
      ],
    };
  },

  // ─── 5. Pending Fees List (WhatsApp Enabled) ───
  pending_fees_list: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandPending = 0;
    let sr = 1;

    for (const s of ctx.students) {
      const state = computeStudentFeeState(s.id, ctx.demands, ctx.payments, ctx.asOfDate);
      if (state.pendingDues > 0) {
        grandPending += state.pendingDues;
        const pendingMonths = state.demands.filter(d => d.dueDate <= ctx.asOfDate && d.balance > 0).length;
        const lastP = state.payments[0];

        rows.push({
          srNo: sr++,
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          fatherName: s.father_name || s.guardian_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
          monthsPending: pendingMonths > 0 ? `${pendingMonths} Installment(s)` : 'Current Dues',
          pendingPaise: state.pendingDues,
          lastPaidDate: lastP ? (lastP.paidOn ? lastP.paidOn.slice(0, 10) : '2026-08-10') : 'Never Paid',
        });
      }
    }

    return {
      rows,
      grandTotalRow: {
        srNo: '',
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Scholars`,
        classSection: '',
        fatherName: '',
        mobile: '',
        monthsPending: '',
        pendingPaise: grandPending,
        lastPaidDate: '',
      },
      summaryKpis: [
        { label: 'Total Pending Scholars', value: rows.length.toString(), color: 'text-amber-700' },
        { label: 'Outstanding Dues (As of Today)', value: formatCurrency(grandPending), color: 'text-rose-800' },
      ],
    };
  },

  // ─── 6. Never Paid Students (Defaulters) ───
  never_paid_defaulters: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandPending = 0;

    for (const s of ctx.students) {
      const state = computeStudentFeeState(s.id, ctx.demands, ctx.payments, ctx.asOfDate);
      if (state.status === 'NEVER_PAID' || (state.totalCollected === 0 && state.billedDueToDate > 0)) {
        grandPending += state.pendingDues;
        rows.push({
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          fatherName: s.father_name || s.guardian_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || 'N/A',
          totalDemandPaise: state.billedDueToDate,
          pendingPaise: state.pendingDues,
          status: 'NEVER_PAID',
        });
      }
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Scholars`,
        classSection: '',
        fatherName: '',
        mobile: '',
        totalDemandPaise: grandPending,
        pendingPaise: grandPending,
        status: '',
      },
      summaryKpis: [
        { label: 'Never Paid Scholars', value: rows.length.toString(), color: 'text-rose-700' },
        { label: 'Uncollected Dues', value: formatCurrency(grandPending), color: 'text-rose-900' },
      ],
    };
  },

  // ─── 7. Annual Fee Pending Report ───
  annual_fee_pending: (ctx) => {
    const rows: Record<string, any>[] = [];
    let totalDue = 0;

    for (const s of ctx.students) {
      const state = computeStudentFeeState(s.id, ctx.demands, ctx.payments, ctx.asOfDate);
      const annualDemand = state.demands.find(d => d.feeHead === 'ANNUAL');
      const bal = annualDemand ? annualDemand.balance : 0;

      if (bal > 0) {
        totalDue += bal;
        rows.push({
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          fatherName: s.father_name || s.guardian_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || 'N/A',
          annualDuePaise: bal,
          status: 'ANNUAL_DUE',
        });
      }
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Students`,
        classSection: '',
        fatherName: '',
        mobile: '',
        annualDuePaise: totalDue,
        status: '',
      },
      summaryKpis: [
        { label: 'Annual Fee Pending Count', value: rows.length.toString(), color: 'text-amber-700' },
        { label: 'Annual Fee Outstanding', value: formatCurrency(totalDue), color: 'text-rose-800' },
      ],
    };
  },

  // ─── 8. Admission & Registration Pending Report ───
  admission_fee_pending: (ctx) => {
    const rows: Record<string, any>[] = [];
    let totalAdmDue = 0;
    let totalRegDue = 0;
    let grandOneTimeDue = 0;

    for (const s of ctx.students) {
      const state = computeStudentFeeState(s.id, ctx.demands, ctx.payments, ctx.asOfDate);
      const admDemand = state.demands.find(d => d.feeHead === 'ADMISSION');
      const regDemand = state.demands.find(d => d.feeHead === 'REGISTRATION');

      const admDue = admDemand ? admDemand.balance : 0;
      const regDue = regDemand ? regDemand.balance : 0;
      const totalDue = admDue + regDue;

      if (totalDue > 0) {
        totalAdmDue += admDue;
        totalRegDue += regDue;
        grandOneTimeDue += totalDue;
        rows.push({
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          fatherName: s.father_name || s.guardian_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || 'N/A',
          admissionDuePaise: admDue,
          registrationDuePaise: regDue,
          totalOneTimeDuePaise: totalDue,
          status: 'ADMISSION_DUE',
        });
      }
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Students`,
        classSection: '',
        fatherName: '',
        mobile: '',
        admissionDuePaise: totalAdmDue,
        registrationDuePaise: totalRegDue,
        totalOneTimeDuePaise: grandOneTimeDue,
        status: '',
      },
      summaryKpis: [
        { label: 'Scholars with One-Time Dues', value: rows.length.toString(), color: 'text-amber-700' },
        { label: 'Total One-Time Dues', value: formatCurrency(grandOneTimeDue), color: 'text-rose-950' },
      ],
    };
  },

  // ─── 9. Advance Payment Students ───
  advance_payers: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandAdvance = 0;
    let grandPaidDue = 0;
    let grandTotalPaid = 0;

    for (const s of ctx.students) {
      const state = computeStudentFeeState(s.id, ctx.demands, ctx.payments, ctx.asOfDate);
      
      let studentPaidDue = 0;
      let studentPaidFuture = 0;

      for (const d of state.demands) {
        if (d.dueDate <= ctx.asOfDate) {
          studentPaidDue += d.paid;
        } else {
          studentPaidFuture += d.paid;
        }
      }

      const advanceInflow = studentPaidFuture;
      if (advanceInflow > 0) {
        grandAdvance += advanceInflow;
        grandPaidDue += studentPaidDue;
        grandTotalPaid += (studentPaidDue + advanceInflow);

        rows.push({
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          fatherName: s.father_name || s.guardian_name || 'Parent',
          paidPaise: studentPaidDue + advanceInflow,
          billedToDatePaise: studentPaidDue,
          advancePaise: advanceInflow,
          status: 'ADVANCE',
        });
      }
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Scholars`,
        classSection: '',
        fatherName: '',
        paidPaise: grandTotalPaid,
        billedToDatePaise: grandPaidDue,
        advancePaise: grandAdvance,
        status: '',
      },
      summaryKpis: [
        { label: 'Advance Payer Scholars', value: rows.length.toString(), color: 'text-blue-700' },
        { label: 'Total Advance Inflow', value: formatCurrency(grandAdvance), color: 'text-blue-900' },
      ],
    };
  },

  // ─── 9. Fee Head Summary ───
  fee_head_summary: (ctx) => {
    const HEAD_CATALOG: { code: string; name: string; type: string; confirmed: boolean }[] = [
      { code: 'TUITION', name: 'Academic Tuition Fee', type: 'RECURRING', confirmed: true },
      { code: 'ANNUAL', name: 'Annual Composite Fee', type: 'RECURRING', confirmed: true },
      { code: 'TRANSPORT', name: 'Transport Service Fee', type: 'RECURRING', confirmed: true },
      { code: 'EXAM', name: 'Examination Fee (Placeholder)', type: 'RECURRING', confirmed: false },
      { code: 'LAB', name: 'Science & Computer Lab Fee (Placeholder)', type: 'RECURRING', confirmed: false },
      { code: 'HOSTEL', name: 'Hostel & Mess Boarding (Placeholder)', type: 'RECURRING', confirmed: false },
      { code: 'REGISTRATION', name: 'Prospectus + Registration Fee', type: 'ONE_TIME', confirmed: true },
      { code: 'ADMISSION', name: 'Admission Fee', type: 'ONE_TIME', confirmed: true },
    ];

    const demandsByStudent = new Map<string, FeeDemandRecord[]>();
    for (const d of ctx.demands) {
      if (!demandsByStudent.has(d.studentId)) demandsByStudent.set(d.studentId, []);
      demandsByStudent.get(d.studentId)!.push(d);
    }

    const paymentsByStudent = new Map<string, FeePaymentRecord[]>();
    for (const p of ctx.payments) {
      if (p.cancelled) continue;
      if (!paymentsByStudent.has(p.studentId)) paymentsByStudent.set(p.studentId, []);
      paymentsByStudent.get(p.studentId)!.push(p);
    }

    const headStats: Record<string, {
      billedFull: number;
      billedDue: number;
      collected: number;
      pending: number;
      upcoming: number;
    }> = {};

    for (const h of HEAD_CATALOG) {
      headStats[h.code] = { billedFull: 0, billedDue: 0, collected: 0, pending: 0, upcoming: 0 };
    }

    for (const s of ctx.students) {
      const sDemands = demandsByStudent.get(s.id) || [];
      const sPayments = paymentsByStudent.get(s.id) || [];
      const state = computeStudentFeeState(s.id, sDemands, sPayments, ctx.asOfDate);

      for (const d of state.demands) {
        if (!headStats[d.feeHead]) continue;
        const entry = headStats[d.feeHead];
        entry.billedFull += (d.netAmount || 0);

        if (d.dueDate <= ctx.asOfDate) {
          entry.billedDue += (d.netAmount || 0);
          entry.collected += (d.paid || 0);
          entry.pending += (d.balance || 0);
        } else {
          entry.upcoming += (d.balance || 0);
        }
      }
    }

    let grandBilledFull = 0;
    let grandBilledDue = 0;
    let grandCollected = 0;
    let grandPending = 0;
    let grandUpcoming = 0;

    const rows = HEAD_CATALOG.map((h) => {
      const stat = headStats[h.code] || { billedFull: 0, billedDue: 0, collected: 0, pending: 0, upcoming: 0 };
      grandBilledFull += stat.billedFull;
      grandBilledDue += stat.billedDue;
      grandCollected += stat.collected;
      grandPending += stat.pending;
      grandUpcoming += stat.upcoming;

      const rate = stat.billedDue > 0 ? `${Math.round((stat.collected / stat.billedDue) * 100)}%` : '0%';

      return {
        feeHead: h.name,
        headCode: h.code,
        headType: h.type,
        status: h.confirmed ? 'Confirmed' : 'Placeholder',
        billedFullSessionPaise: stat.billedFull,
        billedDuePaise: stat.billedDue,
        collectedPaise: stat.collected,
        pendingPaise: stat.pending,
        upcomingPaise: stat.upcoming,
        realizationRate: rate,
      };
    });

    const grandRealization = grandBilledDue > 0 ? `${Math.round((grandCollected / grandBilledDue) * 100)}%` : '0%';

    // Refundable deposits check
    let refundableHeldPaise = 0;
    for (const p of ctx.payments) {
      if (p.cancelled) continue;
      for (const alloc of p.allocatedHeads || []) {
        if ((alloc.feeHead as string) === 'SECURITY_DEPOSIT') {
          refundableHeldPaise += (alloc.amountPaise || 0);
        }
      }
    }

    return {
      rows,
      grandTotalRow: {
        feeHead: 'Grand Total',
        headCode: '',
        headType: '',
        status: '',
        billedFullSessionPaise: grandBilledFull,
        billedDuePaise: grandBilledDue,
        collectedPaise: grandCollected,
        pendingPaise: grandPending,
        upcomingPaise: grandUpcoming,
        realizationRate: grandRealization,
      },
      summaryKpis: [
        { label: 'Total Billed Due', value: formatCurrency(grandBilledDue) },
        { label: 'Total Collected (Revenue)', value: formatCurrency(grandCollected), color: 'text-emerald-700' },
        { label: 'Total Pending Dues', value: formatCurrency(grandPending), color: 'text-rose-700' },
        { label: 'Refundable Deposits Held', value: formatCurrency(refundableHeldPaise), badge: 'Liability', color: 'text-blue-700' },
      ],
    };
  },

  // ─── 10. Exam Fee Collection & Dues ───
  exam_fee_report: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandDemand = 0;
    let grandPaid = 0;
    let grandDue = 0;

    for (const s of ctx.students) {
      const sDemands = ctx.demands.filter(d => d.studentId === s.id && d.feeHead === 'EXAM');
      const sPayments = ctx.payments.filter(p => !p.cancelled && p.studentId === s.id);

      const demand = sDemands.reduce((a, b) => a + b.netAmount, 0);
      let paid = 0;
      for (const p of sPayments) {
        for (const alloc of p.allocatedHeads || []) {
          if (alloc.feeHead === 'EXAM') paid += alloc.amountPaise;
        }
      }

      const due = Math.max(0, demand - paid);
      grandDemand += demand;
      grandPaid += paid;
      grandDue += due;

      rows.push({
        studentName: s.full_name || 'Scholar',
        admissionNo: s.admission_no || s.id,
        classSection: `${s.class_name} - ${s.section || 'A'}`,
        demandPaise: demand,
        paidPaise: paid,
        duePaise: due,
        status: due === 0 ? 'CLEARED' : paid > 0 ? 'PARTIAL' : 'DUE',
      });
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Scholars`,
        classSection: '',
        demandPaise: grandDemand,
        paidPaise: grandPaid,
        duePaise: grandDue,
        status: '',
      },
      summaryKpis: [
        { label: 'Total Exam Demanded', value: formatCurrency(grandDemand) },
        { label: 'Total Exam Collected', value: formatCurrency(grandPaid), color: 'text-emerald-700' },
        { label: 'Exam Fees Pending', value: formatCurrency(grandDue), color: 'text-rose-700' },
      ],
    };
  },

  // ─── 11. Transport Fee Collection & Dues ───
  transport_fee_report: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandDemand = 0;
    let grandPaid = 0;
    let grandDue = 0;

    for (const s of ctx.students) {
      if (String(s.transport_opted || '').toUpperCase() !== 'YES') continue;

      const sDemands = ctx.demands.filter(d => d.studentId === s.id && d.feeHead === 'TRANSPORT');
      const sPayments = ctx.payments.filter(p => !p.cancelled && p.studentId === s.id);

      const demand = sDemands.reduce((a, b) => a + b.netAmount, 0);
      let paid = 0;
      for (const p of sPayments) {
        for (const alloc of p.allocatedHeads || []) {
          if (alloc.feeHead === 'TRANSPORT') paid += alloc.amountPaise;
        }
      }

      const due = Math.max(0, demand - paid);
      grandDemand += demand;
      grandPaid += paid;
      grandDue += due;

      rows.push({
        studentName: s.full_name || 'Scholar',
        admissionNo: s.admission_no || s.id,
        classSection: `${s.class_name} - ${s.section || 'A'}`,
        slab: `Slab ${s.transport_slab_id || '1'}`,
        monthlyRate: demand > 0 ? Math.round(demand / 12) : 90000,
        demandPaise: demand,
        paidPaise: paid,
        duePaise: due,
        status: due === 0 ? 'CLEARED' : paid > 0 ? 'PARTIAL' : 'DUE',
      });
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Bus Commuters`,
        classSection: '',
        slab: '',
        monthlyRate: 0,
        demandPaise: grandDemand,
        paidPaise: grandPaid,
        duePaise: grandDue,
        status: '',
      },
      summaryKpis: [
        { label: 'Bus Commuters Count', value: rows.length.toString() },
        { label: 'Transport Billed', value: formatCurrency(grandDemand) },
        { label: 'Transport Collected', value: formatCurrency(grandPaid), color: 'text-emerald-700' },
        { label: 'Transport Pending', value: formatCurrency(grandDue), color: 'text-rose-700' },
      ],
    };
  },

  // ─── 12. Hostel Fee Collection & Dues ───
  hostel_fee_report: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandDemand = 0;
    let grandPaid = 0;
    let grandDue = 0;

    for (const s of ctx.students) {
      if (String((s as any).hostel_opted || '').toUpperCase() !== 'YES') continue;

      const sDemands = ctx.demands.filter(d => d.studentId === s.id && d.feeHead === 'HOSTEL');
      const sPayments = ctx.payments.filter(p => !p.cancelled && p.studentId === s.id);

      const demand = sDemands.reduce((a, b) => a + b.netAmount, 0);
      let paid = 0;
      for (const p of sPayments) {
        for (const alloc of p.allocatedHeads || []) {
          if (alloc.feeHead === 'HOSTEL') paid += alloc.amountPaise;
        }
      }

      const due = Math.max(0, demand - paid);
      grandDemand += demand;
      grandPaid += paid;
      grandDue += due;

      rows.push({
        studentName: s.full_name || 'Scholar',
        admissionNo: s.admission_no || s.id,
        classSection: `${s.class_name} - ${s.section || 'A'}`,
        roomNo: (s as any).hostel_room || 'Room 101',
        demandPaise: demand,
        paidPaise: paid,
        duePaise: due,
        status: due === 0 ? 'CLEARED' : 'DUE',
      });
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Hostellers`,
        classSection: '',
        roomNo: '',
        demandPaise: grandDemand,
        paidPaise: grandPaid,
        duePaise: grandDue,
        status: '',
      },
      summaryKpis: [
        { label: 'Hostel Students', value: rows.length.toString() },
        { label: 'Hostel Billed', value: formatCurrency(grandDemand) },
        { label: 'Hostel Collected', value: formatCurrency(grandPaid), color: 'text-emerald-700' },
      ],
    };
  },

  // ─── 13. Annual Fee Master Register (Class-wise) ───
  annual_fee_head_report: (ctx) => {
    const classMap = new Map<string, {
      totalStudents: number;
      annualDemandPaise: number;
      collectedPaise: number;
      pendingPaise: number;
    }>();

    for (const s of ctx.students) {
      const cls = s.class_name || 'Class 1';
      if (!classMap.has(cls)) {
        classMap.set(cls, { totalStudents: 0, annualDemandPaise: 0, collectedPaise: 0, pendingPaise: 0 });
      }
      const entry = classMap.get(cls)!;
      entry.totalStudents++;

      const sDemands = ctx.demands.filter(d => d.studentId === s.id && d.feeHead === 'ANNUAL');
      const sPayments = ctx.payments.filter(p => !p.cancelled && p.studentId === s.id);

      const billed = sDemands.reduce((a, b) => a + b.netAmount, 0);
      let paid = 0;
      for (const p of sPayments) {
        for (const alloc of p.allocatedHeads || []) {
          if (alloc.feeHead === 'ANNUAL') paid += alloc.amountPaise;
        }
      }

      const due = Math.max(0, billed - paid);
      entry.annualDemandPaise += billed;
      entry.collectedPaise += paid;
      entry.pendingPaise += due;
    }

    const sortedClasses = Array.from(classMap.keys()).sort(classComparator);

    let grandStudents = 0;
    let grandDemand = 0;
    let grandCollected = 0;
    let grandPending = 0;

    const rows = sortedClasses.map(cls => {
      const stat = classMap.get(cls)!;
      grandStudents += stat.totalStudents;
      grandDemand += stat.annualDemandPaise;
      grandCollected += stat.collectedPaise;
      grandPending += stat.pendingPaise;

      const rate = stat.annualDemandPaise > 0
        ? `${Math.round((stat.collectedPaise / stat.annualDemandPaise) * 100)}%`
        : '0%';

      return {
        className: cls,
        totalStudents: stat.totalStudents,
        annualDemandPaise: stat.annualDemandPaise,
        collectedPaise: stat.collectedPaise,
        pendingPaise: stat.pendingPaise,
        realizationRate: rate,
      };
    });

    const grandRate = grandDemand > 0 ? `${Math.round((grandCollected / grandDemand) * 100)}%` : '0%';

    return {
      rows,
      grandTotalRow: {
        className: 'Grand Total',
        totalStudents: grandStudents,
        annualDemandPaise: grandDemand,
        collectedPaise: grandCollected,
        pendingPaise: grandPending,
        realizationRate: grandRate,
      },
      summaryKpis: [
        { label: 'Total Annual Fee Billed', value: formatCurrency(grandDemand) },
        { label: 'Total Annual Fee Collected', value: formatCurrency(grandCollected), color: 'text-emerald-700' },
        { label: 'Total Annual Fee Dues', value: formatCurrency(grandPending), color: 'text-rose-700' },
        { label: 'Realization %', value: grandRate, color: 'text-blue-700' },
      ],
    };
  },

  // ─── 14. Sibling Discount Report ───
  sibling_discount_report: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandTuitionDisc = 0;
    let grandTransportDisc = 0;
    let grandTotalDisc = 0;

    for (const s of ctx.students) {
      const sDemands = ctx.demands.filter(d => d.studentId === s.id);
      const tuitionDiscDemands = sDemands.filter(d => d.feeHead === 'TUITION' && d.discountAmount > 0 && d.discountReason?.includes('Sibling'));
      const transDiscDemands = sDemands.filter(d => d.feeHead === 'TRANSPORT' && d.discountAmount > 0 && d.discountReason?.includes('Free Transport'));

      const tDisc = tuitionDiscDemands.reduce((a, b) => a + b.discountAmount, 0);
      const trDisc = transDiscDemands.reduce((a, b) => a + b.discountAmount, 0);
      const totDisc = tDisc + trDisc;

      if (totDisc > 0) {
        grandTuitionDisc += tDisc;
        grandTransportDisc += trDisc;
        grandTotalDisc += totDisc;

        const sampleReason = tuitionDiscDemands[0]?.discountReason || transDiscDemands[0]?.discountReason || 'Sibling Concession';

        rows.push({
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          fatherName: s.father_name || s.guardian_name || 'Parent',
          childOrder: sampleReason.includes('20%') ? '2nd Child' : sampleReason.includes('30%') ? '3rd Child' : '4th Child',
          concessionRule: sampleReason,
          tuitionDiscountPaise: tDisc,
          transportDiscountPaise: trDisc,
          totalDiscountPaise: totDisc,
        });
      }
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Beneficiaries`,
        classSection: '',
        fatherName: '',
        childOrder: '',
        concessionRule: '',
        tuitionDiscountPaise: grandTuitionDisc,
        transportDiscountPaise: grandTransportDisc,
        totalDiscountPaise: grandTotalDisc,
      },
      summaryKpis: [
        { label: 'Sibling Beneficiaries', value: rows.length.toString() },
        { label: 'Tuition Concessions', value: formatCurrency(grandTuitionDisc) },
        { label: 'Transport Concessions', value: formatCurrency(grandTransportDisc) },
        { label: 'Total Sibling Concessions', value: formatCurrency(grandTotalDisc), color: 'text-indigo-700' },
      ],
    };
  },

  // ─── 15. Month-wise Discount & Waiver Summary ───
  month_wise_discount: (ctx) => {
    const monthOrder = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
    const monthMap = new Map<string, { siblingDisc: number; otherDisc: number; students: Set<string> }>();
    monthOrder.forEach(m => monthMap.set(m, { siblingDisc: 0, otherDisc: 0, students: new Set() }));

    for (const d of ctx.demands) {
      const p = d.period;
      if (!monthMap.has(p)) continue;
      if (d.discountAmount > 0) {
        const entry = monthMap.get(p)!;
        if (d.discountReason?.includes('Sibling') || d.discountReason?.includes('Free Transport')) {
          entry.siblingDisc += d.discountAmount;
        } else {
          entry.otherDisc += d.discountAmount;
        }
        entry.students.add(d.studentId);
      }
    }

    let grandSibling = 0;
    let grandOther = 0;
    let grandTotal = 0;
    const allUniqueBeneficiaries = new Set<string>();

    const rows = monthOrder.map(m => {
      const data = monthMap.get(m)!;
      const totalMonthDisc = data.siblingDisc + data.otherDisc;
      grandSibling += data.siblingDisc;
      grandOther += data.otherDisc;
      grandTotal += totalMonthDisc;
      data.students.forEach(id => allUniqueBeneficiaries.add(id));

      return {
        monthName: m,
        siblingDiscountPaise: data.siblingDisc,
        otherDiscountsPaise: data.otherDisc,
        totalConcessionPaise: totalMonthDisc,
        beneficiaryCount: data.students.size,
      };
    });

    const totalBeneficiaryAppearances = rows.reduce((s, r) => s + r.beneficiaryCount, 0);

    return {
      rows,
      grandTotalRow: {
        monthName: 'Grand Total',
        siblingDiscountPaise: grandSibling,
        otherDiscountsPaise: grandOther,
        totalConcessionPaise: grandTotal,
        beneficiaryCount: totalBeneficiaryAppearances,
      },
      summaryKpis: [
        { label: 'Unique Beneficiaries', value: allUniqueBeneficiaries.size.toString() },
        { label: 'Sibling Concessions', value: formatCurrency(grandSibling) },
        { label: 'Manual & Discretionary', value: formatCurrency(grandOther) },
        { label: 'Total Concessions Billed', value: formatCurrency(grandTotal), color: 'text-indigo-700' },
      ],
    };
  },

  // ─── 16. Manual Concessions & Waivers ───
  manual_concessions: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandAmount = 0;

    for (const s of ctx.students) {
      const sDemands = ctx.demands.filter(d => 
        d.studentId === s.id && 
        d.discountAmount > 0 && 
        !d.discountReason?.includes('Sibling') &&
        !d.discountReason?.includes('Free Transport')
      );
      for (const d of sDemands) {
        grandAmount += d.discountAmount;
        rows.push({
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          concessionType: d.feeHead,
          amountPaise: d.discountAmount,
          approvedBy: d.discountReason?.includes('Principal') ? 'PRINCIPAL' : 'MANAGEMENT / ACCOUNTS',
          remarks: d.discountReason || 'Manual Fee Concession',
        });
      }
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Concession Vouchers`,
        classSection: '',
        concessionType: '',
        amountPaise: grandAmount,
        approvedBy: '',
        remarks: '',
      },
      summaryKpis: [
        { label: 'Total Vouchers Approved', value: rows.length.toString() },
        { label: 'Total Value Waived', value: formatCurrency(grandAmount), color: 'text-indigo-700' },
      ],
    };
  },

  // ─── 17. Class-wise Fee Summary (DCB Master Summary) ───
  class_wise_summary: (ctx) => {
    const classMap = new Map<string, {
      totalStudents: number;
      demand: number;
      discount: number;
      collected: number;
      balance: number;
    }>();

    for (const s of ctx.students) {
      const cls = s.class_name || 'Class 1';
      if (!classMap.has(cls)) {
        classMap.set(cls, { totalStudents: 0, demand: 0, discount: 0, collected: 0, balance: 0 });
      }
      const entry = classMap.get(cls)!;
      entry.totalStudents++;

      const sDemands = ctx.demands.filter(d => d.studentId === s.id);
      const sPayments = ctx.payments.filter(p => !p.cancelled && p.studentId === s.id);

      const gross = sDemands.reduce((a, b) => a + b.grossAmount, 0);
      const disc = sDemands.reduce((a, b) => a + b.discountAmount, 0);
      const paid = sPayments.reduce((a, b) => a + b.amountPaid, 0);
      const net = gross - disc;

      entry.demand += gross;
      entry.discount += disc;
      entry.collected += paid;
      entry.balance += Math.max(0, net - paid);
    }

    const sortedClasses = Array.from(classMap.keys()).sort(classComparator);

    let grandDemand = 0;
    let grandDisc = 0;
    let grandColl = 0;
    let grandBal = 0;
    let grandStudents = 0;

    const rows = sortedClasses.map(cls => {
      const stat = classMap.get(cls)!;
      grandDemand += stat.demand;
      grandDisc += stat.discount;
      grandColl += stat.collected;
      grandBal += stat.balance;
      grandStudents += stat.totalStudents;

      const net = stat.demand - stat.discount;
      const rate = net > 0 ? `${Math.round((stat.collected / net) * 100)}%` : '0%';

      return {
        className: cls,
        totalStudents: stat.totalStudents,
        demandPaise: stat.demand,
        discountPaise: stat.discount,
        collectedPaise: stat.collected,
        pendingPaise: stat.balance,
        realizationRate: rate,
      };
    });

    const grandNet = grandDemand - grandDisc;
    const grandRate = grandNet > 0 ? `${Math.round((grandColl / grandNet) * 100)}%` : '0%';

    return {
      rows,
      grandTotalRow: {
        className: 'Grand Total',
        totalStudents: grandStudents,
        demandPaise: grandDemand,
        discountPaise: grandDisc,
        collectedPaise: grandColl,
        pendingPaise: grandBal,
        realizationRate: grandRate,
      },
      summaryKpis: [
        { label: 'Total Demand Billed', value: formatCurrency(grandDemand) },
        { label: 'Concessions Given', value: formatCurrency(grandDisc), color: 'text-indigo-700' },
        { label: 'Total Realized Collections', value: formatCurrency(grandColl), color: 'text-emerald-700' },
        { label: 'Net Outstanding Dues', value: formatCurrency(grandBal), color: 'text-rose-700' },
        { label: 'Realization %', value: grandRate, color: 'text-blue-700' },
      ],
    };
  },

  // ─── 18. Student-wise Ledger Statement ───
  student_statement: (ctx) => {
    const rows: Record<string, any>[] = [];
    let grandBilled = 0;
    let grandPaid = 0;
    let grandPending = 0;

    for (const s of ctx.students) {
      const state = computeStudentFeeState(s.id, ctx.demands, ctx.payments, ctx.asOfDate);
      grandBilled += state.billedFullSession;
      grandPaid += state.totalCollected;
      grandPending += state.pendingDues;

      rows.push({
        studentName: s.full_name || 'Scholar',
        admissionNo: s.admission_no || s.id,
        classSection: `${s.class_name} - ${s.section || 'A'}`,
        demandPaise: state.billedFullSession,
        discountPaise: 0,
        paidPaise: state.totalCollected,
        pendingPaise: state.pendingDues,
        status: state.status,
      });
    }

    return {
      rows,
      grandTotalRow: {
        studentName: 'Grand Total',
        admissionNo: `${rows.length} Scholars`,
        classSection: '',
        demandPaise: grandBilled,
        discountPaise: 0,
        paidPaise: grandPaid,
        pendingPaise: grandPending,
        status: '',
      },
      summaryKpis: [
        { label: 'Total Scholars', value: rows.length.toString() },
        { label: 'Total Demand Billed', value: formatCurrency(grandBilled) },
        { label: 'Total Collected', value: formatCurrency(grandPaid), color: 'text-emerald-700' },
        { label: 'Pending Dues (Today)', value: formatCurrency(grandPending), color: 'text-rose-700' },
      ],
    };
  },
};

/**
 * Execute report through the registry with strict typing and schema validation
 */
export function buildReportFromRegistry(
  reportKey: string,
  ctx: ReportBuildContext
): ReportQueryResult {
  const config = REPORT_CONFIGS.find(r => r.id === reportKey);
  const builder = REPORT_BUILDERS[reportKey];

  if (!builder) {
    throw new Error(`[ReportsEngine] Unknown report key: "${reportKey}". All reports must be registered in REPORT_BUILDERS.`);
  }

  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const result = builder(ctx);

  // Validate and normalize that every row and grandTotalRow has every column defined in report config
  if (config && config.columns) {
    const aliasMap: Record<string, string[]> = {
      monthName: ['month', 'period'],
      month: ['monthName', 'period'],
      childOrder: ['siblingOrder'],
      siblingOrder: ['childOrder'],
      remarks: ['reason', 'cancelledReason'],
      reason: ['remarks', 'discountReason'],
      paymentMode: ['mode'],
      mode: ['paymentMode'],
      collectedPaise: ['amountPaise', 'paidPaise'],
      amountPaise: ['collectedPaise', 'paidPaise'],
      pendingPaise: ['duePaise', 'balancePaise'],
      duePaise: ['pendingPaise', 'balancePaise'],
      totalBilledPaise: ['demandPaise', 'grossPaise', 'netPaise'],
      totalPaidPaise: ['paidPaise', 'collectedPaise'],
      realizationRate: ['collectionRate', 'percentageShare', 'rate'],
      collectionRate: ['realizationRate', 'percentageShare'],
      percentageShare: ['realizationRate', 'percentage'],
      percentage: ['percentageShare', 'realizationRate'],
      slabName: ['slab'],
      slab: ['slabName'],
      roomType: ['roomNo'],
      roomNo: ['roomType'],
      annualDemandPaise: ['grossPaise', 'netPaise', 'demandPaise'],
      examPeriod: ['period', 'periodLabel'],
      tuitionDiscountPaise: ['discountPaise'],
      totalDiscountPaise: ['discountPaise'],
      totalConcessionPaise: ['discountPaise'],
      beneficiaryCount: ['totalStudents'],
    };

    const normalizeRow = (r: Record<string, any>) => {
      for (const col of config.columns) {
        if (r[col.key] === undefined || r[col.key] === null) {
          const aliases = aliasMap[col.key] || [];
          for (const a of aliases) {
            if (r[a] !== undefined && r[a] !== null) {
              r[col.key] = r[a];
              break;
            }
          }
        }
        if (r[col.key] === undefined || r[col.key] === null) {
          r[col.key] = col.format === 'currency' || col.format === 'number' ? 0 : '';
        }
      }
    };

    result.rows.forEach(normalizeRow);
    if (result.grandTotalRow) normalizeRow(result.grandTotalRow);
  }

  return {
    reportId: config?.id || reportKey,
    reportName: config?.name || reportKey,
    generatedAt,
    session: ctx.session,
    filtersUsed: ctx.filters,
    summaryKpis: result.summaryKpis,
    columns: config?.columns || [],
    rows: result.rows,
    grandTotalRow: result.grandTotalRow,
    totalRowCount: result.rows.length,
  };
}
