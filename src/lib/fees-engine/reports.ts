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
import { getFeeAggregate, getSchoolLedgerLines, computeSummaryFromLines, getStudentLedger } from './ledger';
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

  // Group lines by student
  const linesByStudent = new Map<string, FeeLedgerLine[]>();
  for (const line of lines) {
    if (!linesByStudent.has(line.student_id)) linesByStudent.set(line.student_id, []);
    linesByStudent.get(line.student_id)!.push(line);
  }

  // Pre-calculate per-student summary
  const summaryByStudent = new Map<string, LedgerFeeSummary>();
  for (const s of students) {
    const sLines = linesByStudent.get(s.id) || [];
    summaryByStudent.set(s.id, computeSummaryFromLines(sLines));
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
      const sib = siblingMap.get(s.id);
      return filters.siblingOpted ? (sib && sib.childOrder >= 2) : (!sib || sib.childOrder === 1);
    });
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filteredStudents = filteredStudents.filter(s =>
      (s.full_name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase().includes(q) ||
      (s.admission_no || '').toLowerCase().includes(q) ||
      (s.father_name || '').toLowerCase().includes(q) ||
      (s.emergency_contact_phone || s.phone || s.guardian_phone || s.mobile || s.emergency_contact || '').includes(q)
    );
  }

  const getStudentName = (st: Student) => st.full_name || `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_no || 'Student';
  const getStudentMobile = (st: Student) => st.emergency_contact_phone || st.phone || st.guardian_phone || st.mobile || st.emergency_contact || 'N/A';

  // ─── EXECUTE REPORT CONFIG ───
  switch (config.id) {
    case 'month_class_collection': {
      const selectedMonth = (filters.months && filters.months[0]) || 'APR';
      const monthIdx = ACADEMIC_MONTHS.indexOf(selectedMonth);

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

        const sum = summaryByStudent.get(st.id);
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
        { label: `Fees Submitted (${MONTH_FULL_NAMES[selectedMonth]})`, value: grandTotal.submittedCount.toString(), color: 'text-emerald-700' },
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

    case 'pending_fees_list': {
      const rows: Record<string, any>[] = [];
      let totalPendingPaise = 0;
      let defaulterCount = 0;

      filteredStudents.forEach((st, idx) => {
        const sum = summaryByStudent.get(st.id);
        if (!sum || sum.balance <= 0) return;

        defaulterCount++;
        totalPendingPaise += sum.balance;

        const stLines = linesByStudent.get(st.id) || [];
        const payLines = stLines.filter(l => l.line_type === 'PAYMENT' && !l.is_cancelled);
        const lastPaid = payLines.length > 0 ? payLines[payLines.length - 1].txn_date : 'Never';

        const pendingMonths = sum.monthWise.filter(m => m.status === 'OVERDUE' || m.status === 'PARTIAL' || m.status === 'PENDING').map(m => m.month);

        rows.push({
          srNo: defaulterCount,
          studentName: getStudentName(st),
          admissionNo: st.admission_no,
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || 'N/A',
          mobile: getStudentMobile(st),
          monthsPending: pendingMonths.length > 0 ? `${pendingMonths.length} Mo (${pendingMonths.slice(0, 3).join(', ')}${pendingMonths.length > 3 ? '...' : ''})` : 'Annual/Misc',
          pendingPaise: sum.balance,
          lastPaidOn: lastPaid,
          studentId: st.id,
        });
      });

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
          lastPaidOn: '',
        },
        totalRowCount: rows.length,
      };
    }

    case 'never_paid_defaulters': {
      const rows: Record<string, any>[] = [];
      let totalBilledPaise = 0;
      let totalPendingPaise = 0;

      for (const st of filteredStudents) {
        const sum = summaryByStudent.get(st.id);
        if (!sum || sum.totalPaid > 0 || sum.totalDemand === 0) continue;

        totalBilledPaise += sum.totalDemand;
        totalPendingPaise += sum.balance;

        rows.push({
          studentName: getStudentName(st),
          admissionNo: st.admission_no,
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || 'N/A',
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

    case 'annual_fee_pending': {
      const rows: Record<string, any>[] = [];
      let totalAnnualPending = 0;

      for (const st of filteredStudents) {
        const sum = summaryByStudent.get(st.id);
        const annualHead = sum?.headWise.find(h => h.fee_head === 'ANNUAL');
        if (!annualHead || annualHead.balance <= 0) continue;

        totalAnnualPending += annualHead.balance;

        rows.push({
          studentName: getStudentName(st),
          admissionNo: st.admission_no,
          classSection: `${st.class_name} - ${st.section || 'A'}`,
          fatherName: st.father_name || 'N/A',
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

    case 'class_wise_summary':
    default: {
      // General Class-Wise Fee Summary (DCB)
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

        const sum = summaryByStudent.get(st.id);
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
