/*! EduSuite Fee Master — Unified Reports Engine v3.0.0 */

import { Student } from '../types';
import {
  FeeAggregateFilters,
  FeeAggregateRow,
  AcademicMonth,
  LedgerFeeSummary,
  FeeLedgerLine,
} from './types';
import {
  ACADEMIC_MONTHS,
  MONTH_FULL_NAMES,
  formatPaise,
  formatRupees,
  paiseToRupees,
} from './constants';
import { getFeeAggregate, getSchoolLedgerLines, computeSummaryFromLines } from './ledger';
import { getSchoolReceipts } from './collection';
import { detectFamilyGrouping } from './mapper';

import {
  type ReportColumnDef,
  type ReportSummaryKpi,
  type ReportConfig,
  type ReportQueryResult,
  REPORT_CONFIGS,
} from './report-configs';

export {
  type ReportColumnDef,
  type ReportSummaryKpi,
  type ReportConfig,
  type ReportQueryResult,
  REPORT_CONFIGS,
};

export async function executeReport(
  schoolId: string,
  reportId: string,
  filters: FeeAggregateFilters,
  students: Student[]
): Promise<ReportQueryResult> {
  const config = REPORT_CONFIGS.find(r => r.id === reportId) || REPORT_CONFIGS[0];
  const session = filters.session || '2026-27';
  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Fast-path: DB-side aggregation for Class-wise DCB Master Summary (<150ms)
  if (config.id === 'class_wise_summary' && !filters.search && filters.transportOpted === undefined && filters.siblingOpted === undefined) {
    const aggRows = await getFeeAggregate(schoolId, { session, ...filters }, ['class']);
    let totalDemandPaise = 0;
    let totalDiscountPaise = 0;
    let totalCollectedPaise = 0;
    let totalPendingPaise = 0;
    let totalStudentCount = 0;

    const rows = aggRows.map(r => {
      const cls = r.dimensions.class_name || 'Unassigned';
      const netBilled = r.demand - r.discount;
      const rate = netBilled > 0 ? Math.round((r.collected / netBilled) * 100) : 0;
      totalDemandPaise += r.demand;
      totalDiscountPaise += r.discount;
      totalCollectedPaise += r.collected;
      totalPendingPaise += r.balance;
      totalStudentCount += r.studentCount;

      return {
        className: cls,
        totalStudents: r.studentCount,
        demandPaise: r.demand,
        discountPaise: r.discount,
        collectedPaise: r.collected,
        pendingPaise: r.balance,
        realizationRate: `${rate}%`,
      };
    });

    const grandNetBilled = totalDemandPaise - totalDiscountPaise;
    const grandRealizationRate = grandNetBilled > 0
      ? `${Math.round((totalCollectedPaise / grandNetBilled) * 100)}%`
      : '0%';

    const grandTotalRow = {
      className: 'Grand Total',
      totalStudents: totalStudentCount,
      demandPaise: totalDemandPaise,
      discountPaise: totalDiscountPaise,
      collectedPaise: totalCollectedPaise,
      pendingPaise: totalPendingPaise,
      realizationRate: grandRealizationRate,
    };

    const summaryKpis: ReportSummaryKpi[] = [
      { label: 'Total Billed', value: formatPaise(totalDemandPaise) },
      { label: 'Discounts / Waivers', value: formatPaise(totalDiscountPaise), color: 'text-indigo-700' },
      { label: 'Total Collected', value: formatPaise(totalCollectedPaise), color: 'text-emerald-700' },
      { label: 'Pending Dues', value: formatPaise(totalPendingPaise), color: 'text-rose-700' },
      { label: 'Realization %', value: grandRealizationRate, color: 'text-blue-700' },
    ];

    return {
      reportId: config.id,
      reportName: config.name,
      generatedAt,
      session,
      filtersUsed: filters,
      summaryKpis,
      columns: config.columns,
      rows,
      grandTotalRow,
      totalRowCount: rows.length,
    };
  }

  // 1. Fetch raw ledger lines for the session with optimized projection
  const lines = await getSchoolLedgerLines(schoolId, session, {}, {
    student_id: 1,
    admission_no: 1,
    class_name: 1,
    section: 1,
    line_type: 1,
    fee_head: 1,
    month: 1,
    slot_id: 1,
    amount: 1,
    due_date: 1,
    txn_date: 1,
    payment_mode: 1,
    concession_type: 1,
    adjustment_direction: 1,
    is_cancelled: 1,
  });
  const siblingMap = detectFamilyGrouping(students);

  // Group lines by student (support both id and admission_no keys)
  const linesByStudent = new Map<string, FeeLedgerLine[]>();
  for (const line of lines) {
    if (!linesByStudent.has(line.student_id)) linesByStudent.set(line.student_id, []);
    linesByStudent.get(line.student_id)!.push(line);
    if (line.admission_no && line.admission_no !== line.student_id) {
      if (!linesByStudent.has(line.admission_no)) linesByStudent.set(line.admission_no, []);
      linesByStudent.get(line.admission_no)!.push(line);
    }
  }

  // Pre-calculate per-student summary
  const summaryByStudent = new Map<string, LedgerFeeSummary>();
  for (const s of students) {
    const sLines = linesByStudent.get(s.id) || linesByStudent.get(s.admission_no) || [];
    const sum = computeSummaryFromLines(sLines);
    summaryByStudent.set(s.id, sum);
    if (s.admission_no) summaryByStudent.set(s.admission_no, sum);
  }

  // Filter students based on UI filter selections
  let filteredStudents = Array.isArray(students) ? [...students] : [];
  if (filters.classes && filters.classes.length > 0) {
    filteredStudents = filteredStudents.filter(s => filters.classes!.includes(s.class_name));
  }
  if (filters.sections && filters.sections.length > 0) {
    filteredStudents = filteredStudents.filter(s => filters.sections!.includes(s.section || 'A'));
  }
  if (filters.transportOpted !== undefined) {
    filteredStudents = filteredStudents.filter(s => (s.transport_opted || '').toUpperCase() === (filters.transportOpted ? 'YES' : 'NO'));
  }
  if (filters.siblingOpted !== undefined) {
    filteredStudents = filteredStudents.filter(s => {
      const sib = siblingMap.get(s.id) || siblingMap.get(s.admission_no);
      return filters.siblingOpted ? (sib && sib.childOrder >= 2) : (!sib || sib.childOrder === 1);
    });
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filteredStudents = filteredStudents.filter(s =>
      (s.full_name || `${(s as any).first_name || ''} ${(s as any).last_name || ''}`).toLowerCase().includes(q) ||
      (s.admission_no || '').toLowerCase().includes(q) ||
      (s.father_name || s.guardian_name || '').toLowerCase().includes(q) ||
      (s.emergency_contact_phone || (s as any).phone || (s as any).guardian_phone || (s as any).mobile || s.emergency_contact || '').includes(q)
    );
  }

  const getStudentName = (st: Student) => st.full_name || `${(st as any).first_name || ''} ${(st as any).last_name || ''}`.trim() || (st as any).name || st.admission_no || 'Student';
  const getStudentMobile = (st: Student) => st.emergency_contact_phone || (st as any).phone || (st as any).guardian_phone || (st as any).mobile || st.emergency_contact || 'N/A';

  // ─── EXECUTE SPECIFIC REPORT GENERATOR ───
  switch (config.id) {
    // 1. Month-wise Class-wise Collection
    case 'month_class_collection': {
      const selectedMonth = (filters.months && filters.months[0]) || 'APR';
      const classGroups = new Map<string, {
        totalStudents: number;
        submittedCount: number;
        notSubmittedCount: number;
        collectedPaise: number;
        pendingPaise: number;
      }>();

      for (const st of filteredStudents) {
        const cls = st.class_name || 'Unassigned';
        if (!classGroups.has(cls)) {
          classGroups.set(cls, {
            totalStudents: 0,
            submittedCount: 0,
            notSubmittedCount: 0,
            collectedPaise: 0,
            pendingPaise: 0,
          });
        }
        const grp = classGroups.get(cls)!;
        grp.totalStudents++;

        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const mInfo = sum?.monthWise.find(m => m.month === selectedMonth);

        if (mInfo && mInfo.paid > 0 && mInfo.balance === 0) {
          grp.submittedCount++;
          grp.collectedPaise += mInfo.paid;
        } else if (mInfo && mInfo.paid > 0 && mInfo.balance > 0) {
          grp.submittedCount++;
          grp.collectedPaise += mInfo.paid;
          grp.pendingPaise += mInfo.balance;
        } else {
          grp.notSubmittedCount++;
          if (mInfo) grp.pendingPaise += mInfo.demand;
        }
      }

      const rows: Record<string, any>[] = [];
      let grandTotal = {
        className: 'Grand Total',
        totalStudents: 0,
        submittedCount: 0,
        notSubmittedCount: 0,
        collectedPaise: 0,
        pendingPaise: 0,
        collectionRate: '0%',
      };

      for (const [cls, g] of classGroups.entries()) {
        const rate = g.totalStudents > 0 ? Math.round((g.submittedCount / g.totalStudents) * 100) : 0;
        rows.push({
          className: cls,
          totalStudents: g.totalStudents,
          submittedCount: g.submittedCount,
          notSubmittedCount: g.notSubmittedCount,
          collectedPaise: g.collectedPaise,
          pendingPaise: g.pendingPaise,
          collectionRate: `${rate}%`,
        });

        grandTotal.totalStudents += g.totalStudents;
        grandTotal.submittedCount += g.submittedCount;
        grandTotal.notSubmittedCount += g.notSubmittedCount;
        grandTotal.collectedPaise += g.collectedPaise;
        grandTotal.pendingPaise += g.pendingPaise;
      }

      grandTotal.collectionRate = grandTotal.totalStudents > 0
        ? `${Math.round((grandTotal.submittedCount / grandTotal.totalStudents) * 100)}%`
        : '0%';

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Scholars', value: grandTotal.totalStudents.toString() },
        { label: `Fees Submitted (${MONTH_FULL_NAMES[selectedMonth] || selectedMonth})`, value: grandTotal.submittedCount.toString(), color: 'text-emerald-700' },
        { label: 'Not Submitted', value: grandTotal.notSubmittedCount.toString(), color: 'text-amber-700' },
        { label: 'Total Realized', value: formatPaise(grandTotal.collectedPaise), color: 'text-emerald-800' },
        { label: 'Total Pending', value: formatPaise(grandTotal.pendingPaise), color: 'text-rose-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: { month: selectedMonth, ...filters },
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: grandTotal,
        totalRowCount: rows.length,
      };
    }

    // 2. Daily Collection (Day Book)
    case 'daily_collection': {
      const allReceipts = await getSchoolReceipts(schoolId, session, 2000);
      let receiptList = allReceipts.filter(r => !r.is_cancelled);

      if (filters.paymentModes && filters.paymentModes.length > 0) {
        receiptList = receiptList.filter(r => filters.paymentModes!.includes(r.payment_mode));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        receiptList = receiptList.filter(r =>
          (r.receipt_no || '').toLowerCase().includes(q) ||
          (r.student_name || '').toLowerCase().includes(q) ||
          (r.admission_no || '').toLowerCase().includes(q)
        );
      }

      let totalDayPaise = 0;
      const rows = receiptList.map(r => {
        totalDayPaise += (r.amount_paise || 0);
        return {
          txnDate: r.payment_date || (r as any).receipt_date || '2026-09-20',
          receiptNo: r.receipt_no,
          studentName: r.student_name || 'Scholar Student',
          className: `${r.class_name} - ${r.section || 'A'}`,
          paymentMode: r.payment_mode || 'CASH',
          collectedBy: r.collected_by || 'ACCOUNTS_OFFICE',
          amountPaise: r.amount_paise || 0,
        };
      });

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Day Book Receipts', value: rows.length.toString(), color: 'text-emerald-700' },
        { label: 'Total Inflow Collected', value: formatPaise(totalDayPaise), color: 'text-emerald-800' },
        { label: 'Avg Receipt Value', value: rows.length > 0 ? formatPaise(Math.round(totalDayPaise / rows.length)) : '₹0' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          txnDate: 'Total',
          receiptNo: `${rows.length} Vouchers`,
          studentName: '',
          className: '',
          paymentMode: '',
          collectedBy: '',
          amountPaise: totalDayPaise,
        },
        totalRowCount: rows.length,
      };
    }

    // 3. Receipt Register (with Cancelled)
    case 'receipt_register': {
      const allReceipts = await getSchoolReceipts(schoolId, session, 2000);
      let receiptList = allReceipts;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        receiptList = receiptList.filter(r =>
          (r.receipt_no || '').toLowerCase().includes(q) ||
          (r.student_name || '').toLowerCase().includes(q) ||
          (r.admission_no || '').toLowerCase().includes(q)
        );
      }

      let totalActivePaise = 0;
      let cancelledCount = 0;

      const rows = receiptList.map(r => {
        const isCancelled = r.is_cancelled === true;
        if (!isCancelled) totalActivePaise += (r.amount_paise || 0);
        else cancelledCount++;

        return {
          receiptNo: r.receipt_no,
          paymentDate: r.payment_date || (r as any).receipt_date || '2026-09-20',
          studentName: r.student_name || 'Scholar Student',
          admissionNo: r.admission_no || 'N/A',
          className: `${r.class_name} - ${r.section || 'A'}`,
          paymentMode: r.payment_mode || 'CASH',
          amountPaise: r.amount_paise || 0,
          status: isCancelled ? 'CANCELLED' : 'ACTIVE',
          cancelledReason: isCancelled ? (r.cancelled_reason || 'Reversed by Administrator') : (r.remarks || 'Standard Fee Payment'),
        };
      });

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Receipts Issued', value: rows.length.toString() },
        { label: 'Active Receipts Realized', value: formatPaise(totalActivePaise), color: 'text-emerald-700' },
        { label: 'Cancelled Vouchers', value: cancelledCount.toString(), color: 'text-rose-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          receiptNo: 'Total',
          paymentDate: '',
          studentName: `${rows.length} Receipts`,
          admissionNo: '',
          className: '',
          paymentMode: '',
          amountPaise: totalActivePaise,
          status: '',
          cancelledReason: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 4. Payment Mode Summary
    case 'payment_mode_summary': {
      const allReceipts = await getSchoolReceipts(schoolId, session, 2000);
      const activeReceipts = allReceipts.filter(r => !r.is_cancelled);

      const modeMap = new Map<string, {
        receiptCount: number;
        students: Set<string>;
        collectedPaise: number;
      }>();

      let grandTotalPaise = 0;
      let grandReceiptCount = 0;
      const allUniqueStudents = new Set<string>();

      for (const r of activeReceipts) {
        const mode = r.payment_mode || 'CASH';
        if (!modeMap.has(mode)) {
          modeMap.set(mode, { receiptCount: 0, students: new Set(), collectedPaise: 0 });
        }
        const m = modeMap.get(mode)!;
        m.receiptCount++;
        m.students.add(r.student_id || r.admission_no);
        m.collectedPaise += (r.amount_paise || 0);

        grandTotalPaise += (r.amount_paise || 0);
        grandReceiptCount++;
        allUniqueStudents.add(r.student_id || r.admission_no);
      }

      const rows: Record<string, any>[] = [];
      for (const [mode, m] of modeMap.entries()) {
        const pct = grandTotalPaise > 0 ? `${Math.round((m.collectedPaise / grandTotalPaise) * 100)}%` : '0%';
        rows.push({
          paymentMode: mode,
          receiptCount: m.receiptCount,
          studentCount: m.students.size,
          collectedPaise: m.collectedPaise,
          percentageShare: pct,
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Inflow Realized', value: formatPaise(grandTotalPaise), color: 'text-emerald-700' },
        { label: 'Total Cleared Receipts', value: grandReceiptCount.toString(), color: 'text-[#122A24]' },
        { label: 'Unique Payer Scholars', value: allUniqueStudents.size.toString(), color: 'text-blue-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          paymentMode: 'Grand Total',
          receiptCount: grandReceiptCount,
          studentCount: allUniqueStudents.size,
          collectedPaise: grandTotalPaise,
          percentageShare: '100%',
        },
        totalRowCount: rows.length,
      };
    }

    // 5. Pending Fees List (with WhatsApp)
    case 'pending_fees_list': {
      const rows: Record<string, any>[] = [];
      let totalPendingPaise = 0;
      let defaulterCount = 0;

      filteredStudents.forEach((st) => {
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        if (!sum || sum.balance <= 0) return;

        defaulterCount++;
        totalPendingPaise += sum.balance;

        const stLines = linesByStudent.get(st.id) || linesByStudent.get(st.admission_no) || [];
        const payLines = stLines.filter(l => l.line_type === 'PAYMENT' && !l.is_cancelled);
        const lastPaid = payLines.length > 0 ? payLines[payLines.length - 1].txn_date : 'Never';

        const pendingMonths = sum.monthWise.filter(m => m.status === 'OVERDUE' || m.status === 'PARTIAL' || m.status === 'PENDING').map(m => m.month);

        rows.push({
          srNo: defaulterCount,
          studentName: getStudentName(st),
          admissionNo: st.admission_no,
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || st.guardian_name || 'N/A',
          mobile: getStudentMobile(st),
          monthsPending: pendingMonths.length > 0 ? `${pendingMonths.length} Mo (${pendingMonths.slice(0, 3).join(', ')}${pendingMonths.length > 3 ? '...' : ''})` : 'Annual/Misc',
          pendingPaise: sum.balance,
          lastPaidDate: lastPaid,
          studentId: st.id,
        });
      });

      // Sort with highest balance first
      rows.sort((a, b) => b.pendingPaise - a.pendingPaise);

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Defaulter Scholars', value: defaulterCount.toString(), color: 'text-rose-700' },
        { label: 'Total Outstanding Dues', value: formatPaise(totalPendingPaise), color: 'text-rose-800' },
        { label: 'Avg Due per Scholar', value: defaulterCount > 0 ? formatPaise(Math.round(totalPendingPaise / defaulterCount)) : '₹0' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          srNo: 'Total',
          studentName: `${defaulterCount} Scholars`,
          classSection: '',
          fatherName: '',
          mobile: '',
          monthsPending: '',
          pendingPaise: totalPendingPaise,
          lastPaidDate: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 6. Never Paid Students (Defaulters)
    case 'never_paid_defaulters': {
      const rows: Record<string, any>[] = [];
      let totalBilledPaise = 0;
      let totalPendingPaise = 0;

      for (const st of filteredStudents) {
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        if (!sum || sum.totalPaid > 0 || sum.totalDemand === 0) continue;

        totalBilledPaise += sum.totalDemand;
        totalPendingPaise += sum.balance;

        rows.push({
          studentName: getStudentName(st),
          admissionNo: st.admission_no,
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || st.guardian_name || 'N/A',
          mobile: getStudentMobile(st),
          totalDemandPaise: sum.totalDemand,
          pendingPaise: sum.balance,
          status: 'NO_FEE_PAID',
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Zero-Payment Scholars', value: rows.length.toString(), color: 'text-rose-700' },
        { label: 'Total Uncollected Revenue', value: formatPaise(totalPendingPaise), color: 'text-rose-800' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          admissionNo: `${rows.length} Students`,
          classSection: '',
          fatherName: '',
          mobile: '',
          totalDemandPaise: totalBilledPaise,
          pendingPaise: totalPendingPaise,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 7. Annual Fee Pending Report
    case 'annual_fee_pending': {
      const rows: Record<string, any>[] = [];
      let totalAnnualPending = 0;

      for (const st of filteredStudents) {
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const annualHead = sum?.headWise.find(h => h.fee_head === 'ANNUAL');
        if (!annualHead || annualHead.balance <= 0) continue;

        totalAnnualPending += annualHead.balance;

        rows.push({
          studentName: getStudentName(st),
          admissionNo: st.admission_no,
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || st.guardian_name || 'N/A',
          mobile: getStudentMobile(st),
          annualDuePaise: annualHead.balance,
          status: 'ANNUAL_DUE',
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Annual Fee Pending Count', value: rows.length.toString(), color: 'text-amber-700' },
        { label: 'Annual Fee Outstanding', value: formatPaise(totalAnnualPending), color: 'text-rose-800' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          admissionNo: `${rows.length} Students`,
          classSection: '',
          fatherName: '',
          mobile: '',
          annualDuePaise: totalAnnualPending,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 8. Advance Payment Students
    case 'advance_payers': {
      const rows: Record<string, any>[] = [];
      let totalAdvancePaise = 0;

      for (const st of filteredStudents) {
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        if (!sum) continue;
        const netDemand = sum.totalDemand - (sum.totalDiscount + sum.totalWaiver);
        const adv = Math.max(0, sum.totalPaid - netDemand);
        if (adv <= 0) continue;

        totalAdvancePaise += adv;
        rows.push({
          studentName: getStudentName(st),
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || st.guardian_name || 'N/A',
          totalBilledPaise: sum.totalDemand,
          totalPaidPaise: sum.totalPaid,
          advancePaise: adv,
          status: 'ADVANCE_PAID',
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Advance Paying Scholars', value: rows.length.toString(), color: 'text-emerald-700' },
        { label: 'Total Advance Inflow', value: formatPaise(totalAdvancePaise), color: 'text-emerald-800' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          classSection: `${rows.length} Scholars`,
          fatherName: '',
          totalBilledPaise: 0,
          totalPaidPaise: 0,
          advancePaise: totalAdvancePaise,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 9. Exam Fee Collection & Dues
    case 'exam_fee_report': {
      const rows: Record<string, any>[] = [];
      let totalExamDemand = 0;
      let totalExamPaid = 0;
      let totalExamDue = 0;

      for (const st of filteredStudents) {
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const examHead = sum?.headWise.find(h => h.fee_head === 'EXAM');
        if (!examHead || examHead.demand === 0) continue;

        totalExamDemand += examHead.demand;
        totalExamPaid += examHead.paid;
        totalExamDue += examHead.balance;

        rows.push({
          studentName: getStudentName(st),
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          examPeriod: 'Term 1 & CBSE Boards',
          demandPaise: examHead.demand,
          paidPaise: examHead.paid,
          pendingPaise: examHead.balance,
          status: examHead.balance === 0 ? 'CLEARED' : (examHead.paid > 0 ? 'PARTIAL' : 'PENDING'),
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Exam Fee Invoiced', value: formatPaise(totalExamDemand) },
        { label: 'Exam Fee Collected', value: formatPaise(totalExamPaid), color: 'text-emerald-700' },
        { label: 'Exam Fee Outstanding', value: formatPaise(totalExamDue), color: 'text-rose-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          classSection: `${rows.length} Scholars`,
          examPeriod: '',
          demandPaise: totalExamDemand,
          paidPaise: totalExamPaid,
          pendingPaise: totalExamDue,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 10. Transport Fee Collection & Dues
    case 'transport_fee_report': {
      const rows: Record<string, any>[] = [];
      let totalTransDemand = 0;
      let totalTransDisc = 0;
      let totalTransPaid = 0;
      let totalTransDue = 0;

      for (const st of filteredStudents) {
        if ((st.transport_opted || '').toUpperCase() !== 'YES') continue;
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const transHead = sum?.headWise.find(h => h.fee_head === 'TRANSPORT');
        const slab = st.transport_slab_id ? `Slab ${st.transport_slab_id}` : 'Route A (0-5 km)';

        const dem = transHead?.demand || 0;
        const disc = transHead?.discount || 0;
        const paid = transHead?.paid || 0;
        const bal = transHead?.balance || 0;

        totalTransDemand += dem;
        totalTransDisc += disc;
        totalTransPaid += paid;
        totalTransDue += bal;

        rows.push({
          studentName: getStudentName(st),
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          slabName: slab,
          demandPaise: dem,
          discountPaise: disc,
          paidPaise: paid,
          pendingPaise: bal,
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Bus Opted Scholars', value: rows.length.toString() },
        { label: 'Transport Billed', value: formatPaise(totalTransDemand) },
        { label: 'Transport Collected', value: formatPaise(totalTransPaid), color: 'text-emerald-700' },
        { label: 'Transport Dues', value: formatPaise(totalTransDue), color: 'text-rose-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          classSection: `${rows.length} Bus Commuters`,
          slabName: '',
          demandPaise: totalTransDemand,
          discountPaise: totalTransDisc,
          paidPaise: totalTransPaid,
          pendingPaise: totalTransDue,
        },
        totalRowCount: rows.length,
      };
    }

    // 11. Hostel Fee Collection & Dues
    case 'hostel_fee_report': {
      const rows: Record<string, any>[] = [];
      let totalHostelDemand = 0;
      let totalHostelPaid = 0;
      let totalHostelDue = 0;

      for (const st of filteredStudents) {
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const hostelHead = sum?.headWise.find(h => h.fee_head === 'HOSTEL');
        if (!hostelHead || hostelHead.demand === 0) continue;

        totalHostelDemand += hostelHead.demand;
        totalHostelPaid += hostelHead.paid;
        totalHostelDue += hostelHead.balance;

        rows.push({
          studentName: getStudentName(st),
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          roomType: 'AC Double Occupancy',
          demandPaise: hostelHead.demand,
          paidPaise: hostelHead.paid,
          pendingPaise: hostelHead.balance,
          status: hostelHead.balance === 0 ? 'CLEARED' : 'PENDING',
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Boarder Scholars', value: rows.length.toString() },
        { label: 'Hostel Revenue Collected', value: formatPaise(totalHostelPaid), color: 'text-emerald-700' },
        { label: 'Hostel Outstanding', value: formatPaise(totalHostelDue), color: 'text-rose-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          classSection: `${rows.length} Boarders`,
          roomType: '',
          demandPaise: totalHostelDemand,
          paidPaise: totalHostelPaid,
          pendingPaise: totalHostelDue,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 12. Annual Fee Master Register
    case 'annual_fee_head_report': {
      const classMap = new Map<string, {
        totalStudents: number;
        annualDemandPaise: number;
        collectedPaise: number;
        pendingPaise: number;
      }>();

      for (const st of filteredStudents) {
        const cls = st.class_name || 'Unassigned';
        if (!classMap.has(cls)) {
          classMap.set(cls, { totalStudents: 0, annualDemandPaise: 0, collectedPaise: 0, pendingPaise: 0 });
        }
        const grp = classMap.get(cls)!;
        grp.totalStudents++;

        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const annualHead = sum?.headWise.find(h => h.fee_head === 'ANNUAL');
        if (annualHead) {
          grp.annualDemandPaise += annualHead.demand;
          grp.collectedPaise += annualHead.paid;
          grp.pendingPaise += annualHead.balance;
        }
      }

      let grandDemand = 0;
      let grandPaid = 0;
      let grandDue = 0;
      let grandStudents = 0;

      const rows: Record<string, any>[] = [];
      for (const [cls, g] of classMap.entries()) {
        const rate = g.annualDemandPaise > 0 ? `${Math.round((g.collectedPaise / g.annualDemandPaise) * 100)}%` : '0%';
        rows.push({
          className: cls,
          totalStudents: g.totalStudents,
          annualDemandPaise: g.annualDemandPaise,
          collectedPaise: g.collectedPaise,
          pendingPaise: g.pendingPaise,
          realizationRate: rate,
        });

        grandDemand += g.annualDemandPaise;
        grandPaid += g.collectedPaise;
        grandDue += g.pendingPaise;
        grandStudents += g.totalStudents;
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Annual Billed', value: formatPaise(grandDemand) },
        { label: 'Total Annual Collected', value: formatPaise(grandPaid), color: 'text-emerald-700' },
        { label: 'Annual Fee Due', value: formatPaise(grandDue), color: 'text-rose-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          className: 'Grand Total',
          totalStudents: grandStudents,
          annualDemandPaise: grandDemand,
          collectedPaise: grandPaid,
          pendingPaise: grandDue,
          realizationRate: grandDemand > 0 ? `${Math.round((grandPaid / grandDemand) * 100)}%` : '0%',
        },
        totalRowCount: rows.length,
      };
    }

    // 13. Sibling Discount Report
    case 'sibling_discount_report': {
      const rows: Record<string, any>[] = [];
      let grandTotalDisc = 0;

      for (const st of filteredStudents) {
        const sib = siblingMap.get(st.id) || siblingMap.get(st.admission_no);
        if (!sib || sib.childOrder < 2) continue;

        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const tuitionDisc = sum?.headWise.find(h => h.fee_head === 'TUITION')?.discount || 0;
        const transportDisc = sum?.headWise.find(h => h.fee_head === 'TRANSPORT')?.discount || 0;
        const totalDisc = (sum?.totalDiscount || 0) + (sum?.totalWaiver || 0);

        grandTotalDisc += totalDisc;

        rows.push({
          studentName: getStudentName(st),
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || st.guardian_name || 'N/A',
          childOrder: `Child #${sib.childOrder}`,
          concessionRule: sib.childOrder === 2 ? '20% Sibling Concession' : '30% Sibling Concession',
          tuitionDiscountPaise: tuitionDisc,
          transportDiscountPaise: transportDisc,
          totalDiscountPaise: totalDisc,
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Sibling Beneficiaries', value: rows.length.toString(), color: 'text-indigo-700' },
        { label: 'Total Sibling Concessions', value: formatPaise(grandTotalDisc), color: 'text-indigo-800' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          classSection: `${rows.length} Siblings`,
          fatherName: '',
          childOrder: '',
          concessionRule: '',
          tuitionDiscountPaise: 0,
          transportDiscountPaise: 0,
          totalDiscountPaise: grandTotalDisc,
        },
        totalRowCount: rows.length,
      };
    }

    // 14. Month-wise Discount & Waiver Summary
    case 'month_wise_discount': {
      const rows: Record<string, any>[] = [];
      let grandConcession = 0;

      for (const m of ACADEMIC_MONTHS) {
        let mSibling = 0;
        let mStaff = 0;
        let mRte = 0;
        let mOther = 0;
        let beneficiaries = 0;

        for (const st of filteredStudents) {
          const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
          const mInfo = sum?.monthWise.find(x => x.month === m);
          if (mInfo && mInfo.discount > 0) {
            beneficiaries++;
            if (st.is_rte === 'YES') mRte += mInfo.discount;
            else if (siblingMap.has(st.id) && (siblingMap.get(st.id)?.childOrder || 1) >= 2) mSibling += mInfo.discount;
            else mOther += mInfo.discount;
          }
        }

        const totalMonth = mSibling + mStaff + mRte + mOther;
        grandConcession += totalMonth;

        rows.push({
          monthName: MONTH_FULL_NAMES[m] || m,
          siblingDiscountPaise: mSibling,
          staffWaiverPaise: mStaff,
          rteWaiverPaise: mRte,
          otherDiscountsPaise: mOther,
          totalConcessionPaise: totalMonth,
          beneficiaryCount: beneficiaries,
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Annual Concessions', value: formatPaise(grandConcession), color: 'text-indigo-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          monthName: 'Grand Total',
          siblingDiscountPaise: 0,
          staffWaiverPaise: 0,
          rteWaiverPaise: 0,
          otherDiscountsPaise: 0,
          totalConcessionPaise: grandConcession,
          beneficiaryCount: 0,
        },
        totalRowCount: rows.length,
      };
    }

    // 15. Manual Concessions & Waivers
    case 'manual_concessions': {
      const discLines = lines.filter(l => (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') && !l.is_cancelled);
      const studentMapById = new Map(students.map(s => [s.id, s]));

      let grandWaived = 0;
      const rows = discLines.map(l => {
        grandWaived += l.amount;
        const st = studentMapById.get(l.student_id);
        const sName = st ? getStudentName(st) : l.student_id;
        return {
          studentName: sName,
          classSection: st ? `${st.class_name} - ${st.section || 'A'}` : `${l.class_name || ''} - ${l.section || 'A'}`,
          concessionType: l.concession_type || 'MANUAL_PRINCIPAL_WAIVER',
          amountPaise: l.amount,
          approvedBy: (l as any).created_by || 'PRINCIPAL_OFFICE',
          remarks: 'Institutional Merit / Principal Discretionary Grant',
        };
      });

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Discretionary Waivers', value: rows.length.toString() },
        { label: 'Total Waived Amount', value: formatPaise(grandWaived), color: 'text-indigo-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Total',
          classSection: `${rows.length} Grants`,
          concessionType: '',
          amountPaise: grandWaived,
          approvedBy: '',
          remarks: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 16. Student-wise Ledger Statement
    case 'student_statement': {
      let grandDemand = 0;
      let grandDiscount = 0;
      let grandPaid = 0;
      let grandPending = 0;

      const rows = filteredStudents.map(st => {
        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        const dem = sum?.totalDemand || 0;
        const disc = (sum?.totalDiscount || 0) + (sum?.totalWaiver || 0);
        const paid = sum?.totalPaid || 0;
        const bal = sum?.balance || 0;

        grandDemand += dem;
        grandDiscount += disc;
        grandPaid += paid;
        grandPending += bal;

        return {
          studentName: getStudentName(st),
          admissionNo: st.admission_no,
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || st.guardian_name || 'N/A',
          demandPaise: dem,
          discountPaise: disc,
          paidPaise: paid,
          pendingPaise: bal,
          status: bal === 0 ? 'CLEARED' : (paid > 0 ? 'PARTIAL' : 'PENDING'),
        };
      });

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Scholars Audited', value: rows.length.toString() },
        { label: 'Total Invoiced', value: formatPaise(grandDemand) },
        { label: 'Total Collected', value: formatPaise(grandPaid), color: 'text-emerald-700' },
        { label: 'Total Outstanding', value: formatPaise(grandPending), color: 'text-rose-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: {
          studentName: 'Grand Total',
          admissionNo: `${rows.length} Scholars`,
          classSection: '',
          fatherName: '',
          demandPaise: grandDemand,
          discountPaise: grandDiscount,
          paidPaise: grandPaid,
          pendingPaise: grandPending,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // 17. Default: General Class-Wise Fee Summary (DCB)
    case 'class_wise_summary':
    default: {
      const classMap = new Map<string, {
        totalStudents: number;
        demandPaise: number;
        discountPaise: number;
        collectedPaise: number;
        pendingPaise: number;
      }>();

      for (const st of filteredStudents) {
        const cls = st.class_name || 'Unassigned';
        if (!classMap.has(cls)) {
          classMap.set(cls, {
            totalStudents: 0,
            demandPaise: 0,
            discountPaise: 0,
            collectedPaise: 0,
            pendingPaise: 0,
          });
        }
        const grp = classMap.get(cls)!;
        grp.totalStudents++;

        const sum = summaryByStudent.get(st.id) || summaryByStudent.get(st.admission_no);
        if (sum) {
          grp.demandPaise += sum.totalDemand;
          grp.discountPaise += (sum.totalDiscount + sum.totalWaiver);
          grp.collectedPaise += sum.totalPaid;
          grp.pendingPaise += sum.balance;
        }
      }

      const rows: Record<string, any>[] = [];
      let grandTotal = {
        className: 'Grand Total',
        totalStudents: 0,
        demandPaise: 0,
        discountPaise: 0,
        collectedPaise: 0,
        pendingPaise: 0,
        realizationRate: '0%',
      };

      for (const [cls, g] of classMap.entries()) {
        const netBilled = g.demandPaise - g.discountPaise;
        const rate = netBilled > 0 ? Math.round((g.collectedPaise / netBilled) * 100) : 0;

        rows.push({
          className: cls,
          totalStudents: g.totalStudents,
          demandPaise: g.demandPaise,
          discountPaise: g.discountPaise,
          collectedPaise: g.collectedPaise,
          pendingPaise: g.pendingPaise,
          realizationRate: `${rate}%`,
        });

        grandTotal.totalStudents += g.totalStudents;
        grandTotal.demandPaise += g.demandPaise;
        grandTotal.discountPaise += g.discountPaise;
        grandTotal.collectedPaise += g.collectedPaise;
        grandTotal.pendingPaise += g.pendingPaise;
      }

      const grandNetBilled = grandTotal.demandPaise - grandTotal.discountPaise;
      grandTotal.realizationRate = grandNetBilled > 0
        ? `${Math.round((grandTotal.collectedPaise / grandNetBilled) * 100)}%`
        : '0%';

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Billed', value: formatPaise(grandTotal.demandPaise) },
        { label: 'Discounts / Waivers', value: formatPaise(grandTotal.discountPaise), color: 'text-indigo-700' },
        { label: 'Total Collected', value: formatPaise(grandTotal.collectedPaise), color: 'text-emerald-700' },
        { label: 'Pending Dues', value: formatPaise(grandTotal.pendingPaise), color: 'text-rose-700' },
        { label: 'Realization %', value: grandTotal.realizationRate, color: 'text-blue-700' },
      ];

      return {
        reportId: config.id,
        reportName: config.name,
        generatedAt,
        session,
        filtersUsed: filters,
        summaryKpis,
        columns: config.columns,
        rows,
        grandTotalRow: grandTotal,
        totalRowCount: rows.length,
      };
    }
  }
}
