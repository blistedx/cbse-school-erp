/*! EduSuite Single Source of Truth Stats Engine v1.0.0 */

import { getDatabase } from '@/lib/mongodb';
import { ACADEMIC_MONTHS, MONTH_FULL_NAMES } from '@/lib/fees-engine/constants';
import type { AcademicMonth, FeeLedgerLine, ReceiptRecord } from '@/lib/fees-engine/types';

export interface FeeStatsFilters {
  session?: string;
  startDate?: string;
  endDate?: string;
  cycleId?: string;
  month?: AcademicMonth;
  className?: string;
  section?: string;
  feeHead?: string;
}

export interface MonthTrendItem {
  month: AcademicMonth;
  label: string;
  period: string;
  demandRupees: number;
  collectedRupees: number;
  paidRupees: number;
  duesRupees: number;
  discountRupees: number;
  paidStudentsCount: number;
  totalStudentsCount: number;
}

export interface CycleMetricItem {
  cycleId: string;
  cycleNumber: string;
  name: string;
  shortLabel: string;
  grandDemand: number;
  collectedAmount: number;
  pendingAmount: number;
  paidStudentsCount: number;
  pendingStudentsCount: number;
  studentCount: number;
}

export interface SchoolFinancialStats {
  schoolId: string;
  session: string;
  totalBilledPaise: number;
  totalCollectedPaise: number;
  totalPendingPaise: number;
  totalDiscountPaise: number;
  totalAdvancePaise: number;
  collectionPercentage: number;
  studentsWithNothingPaid: number;
  totalStudentsCount: number;
  topPending: Array<{
    studentId: string;
    studentName: string;
    admissionNo: string;
    classSection: string;
    fatherName: string;
    mobile: string;
    pendingPaise: number;
  }>;
  thisMonthBreakdown: Array<{
    className: string;
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    collectedPaise: number;
  }>;
  monthWiseTrend: MonthTrendItem[];
  cycleMetrics: Record<string, CycleMetricItem>;
  cachedAt: string;
}

export interface DateRangeBreakdown {
  label: string;
  startDate?: string;
  endDate?: string;
  totalDemandRupees: number;
  totalCollectedRupees: number;
  totalPendingRupees: number;
  collectionRate: number;
  headBreakdown: Array<{
    feeHead: string;
    demandRupees: number;
    collectedRupees: number;
    pendingRupees: number;
  }>;
}

export const DASHBOARD_FEE_CYCLES_CONFIG = [
  { id: 'cycle-1', cycleNumber: '1', name: 'Cycle 1: April (Admission & Reg)', shortLabel: 'Cycle 1 (April)', months: ['APR' as AcademicMonth], multiplier: 1 },
  { id: 'cycle-2', cycleNumber: '2', name: 'Cycle 2: May & June', shortLabel: 'Cycle 2 (May+Jun)', months: ['MAY' as AcademicMonth, 'JUN' as AcademicMonth], multiplier: 2 },
  { id: 'cycle-3', cycleNumber: '3', name: 'Cycle 3: July', shortLabel: 'Cycle 3 (July)', months: ['JUL' as AcademicMonth], multiplier: 1 },
  { id: 'cycle-4', cycleNumber: '4', name: 'Cycle 4: August', shortLabel: 'Cycle 4 (August)', months: ['AUG' as AcademicMonth], multiplier: 1 },
  { id: 'cycle-5', cycleNumber: '5', name: 'Cycle 5: September & February', shortLabel: 'Cycle 5 (Sep+Feb)', months: ['SEP' as AcademicMonth, 'FEB' as AcademicMonth], multiplier: 2 },
  { id: 'cycle-6', cycleNumber: '6', name: 'Cycle 6: October', shortLabel: 'Cycle 6 (October)', months: ['OCT' as AcademicMonth], multiplier: 1 },
  { id: 'cycle-7', cycleNumber: '7', name: 'Cycle 7: November', shortLabel: 'Cycle 7 (November)', months: ['NOV' as AcademicMonth], multiplier: 1 },
  { id: 'cycle-8', cycleNumber: '8', name: 'Cycle 8: December & March', shortLabel: 'Cycle 8 (Dec+Mar)', months: ['DEC' as AcademicMonth, 'MAR' as AcademicMonth], multiplier: 2 },
  { id: 'cycle-9', cycleNumber: '9', name: 'Cycle 9: January', shortLabel: 'Cycle 9 (January)', months: ['JAN' as AcademicMonth], multiplier: 1 },
];

const statsMemoryCache = new Map<string, { stats: SchoolFinancialStats; expiresAt: number }>();

export function invalidateStatsCache(schoolId?: string): void {
  if (!schoolId) {
    statsMemoryCache.clear();
  } else {
    for (const k of Array.from(statsMemoryCache.keys())) {
      if (k.includes(schoolId)) statsMemoryCache.delete(k);
    }
  }
}

/**
 * Single Unified Query Engine for Institutional School Financials.
 * Reads directly from MongoDB `fee_ledger` and `students`.
 */
export async function getSchoolFinancialStats(
  schoolId: string,
  session: string = '2026-27',
  forceFresh: boolean = false
): Promise<SchoolFinancialStats> {
  const cacheKey = `${schoolId}:${session}`;
  const cached = statsMemoryCache.get(cacheKey);
  if (!forceFresh && cached && Date.now() < cached.expiresAt) {
    return cached.stats;
  }

  const db = await getDatabase();
  if (!db) {
    if (cached) return cached.stats;
    return getEmptyStats(schoolId, session);
  }

  // 1. Fetch active students for metadata mapping
  const studentDocs = await db.collection('students').find({
    school_id: schoolId,
    status: 'ACTIVE'
  }, {
    projection: {
      id: 1,
      admission_no: 1,
      full_name: 1,
      first_name: 1,
      last_name: 1,
      class_name: 1,
      section: 1,
      father_name: 1,
      guardian_name: 1,
      mobile: 1,
      guardian_phone: 1
    }
  }).toArray();

  const studentsMap = new Map<string, any>();
  for (const s of studentDocs) {
    studentsMap.set(s.id, s);
    if (s.admission_no) studentsMap.set(s.admission_no, s);
  }

  // 2. Fetch all active ledger lines in one single projection
  const allLines = await db.collection('fee_ledger').find({
    school_id: schoolId,
    academic_session: session,
    is_cancelled: { $ne: true }
  }, {
    projection: {
      student_id: 1,
      admission_no: 1,
      class_name: 1,
      section: 1,
      line_type: 1,
      fee_head: 1,
      adjustment_direction: 1,
      amount: 1,
      month: 1,
      txn_date: 1
    }
  }).toArray() as unknown as FeeLedgerLine[];

  const studentLedgerMap = new Map<string, {
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    section: string;
    fatherName: string;
    mobile: string;
    demand: number;
    paid: number;
    discount: number;
  }>();

  const classBreakdownMap = new Map<string, {
    className: string;
    students: Set<string>;
    paidStudents: Set<string>;
    collectedPaise: number;
  }>();

  const monthData: Record<AcademicMonth, { demand: number; paid: number; discount: number; paidStudents: Set<string> }> = {
    APR: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    MAY: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    JUN: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    JUL: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    AUG: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    SEP: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    OCT: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    NOV: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    DEC: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    JAN: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    FEB: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
    MAR: { demand: 0, paid: 0, discount: 0, paidStudents: new Set() },
  };

  for (const line of allLines) {
    const sId = String(line.student_id || line.admission_no || 'UNKNOWN');
    if (!studentLedgerMap.has(sId)) {
      const sInfo = studentsMap.get(sId);
      const sName = sInfo?.full_name || `${sInfo?.first_name || ''} ${sInfo?.last_name || ''}`.trim() || sId;
      studentLedgerMap.set(sId, {
        studentId: sId,
        studentName: sName,
        admissionNo: line.admission_no || sInfo?.admission_no || '',
        className: line.class_name || sInfo?.class_name || '',
        section: line.section || sInfo?.section || 'A',
        fatherName: sInfo?.father_name || sInfo?.guardian_name || '',
        mobile: sInfo?.guardian_phone || sInfo?.mobile || '',
        demand: 0,
        paid: 0,
        discount: 0,
      });
    }

    const st = studentLedgerMap.get(sId)!;
    const amt = Number(line.amount) || 0;

    if (['DEMAND', 'OPENING_BALANCE', 'FINE'].includes(line.line_type) || (line.line_type === 'ADJUSTMENT' && line.adjustment_direction !== 'CREDIT')) {
      st.demand += amt;
      if (line.month && monthData[line.month]) {
        monthData[line.month].demand += amt;
      }
    } else if (line.line_type === 'PAYMENT' || (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT')) {
      st.paid += amt;
      if (line.month && monthData[line.month]) {
        monthData[line.month].paid += amt;
        if (amt > 0) monthData[line.month].paidStudents.add(sId);
      }
    } else if (['DISCOUNT', 'WAIVER'].includes(line.line_type)) {
      st.discount += amt;
      if (line.month && monthData[line.month]) {
        monthData[line.month].discount += amt;
      }
    }

    // Class month breakdown for SEP (or current month)
    if (line.month === 'SEP') {
      const cls = line.class_name || st.className || 'Class 1';
      if (!classBreakdownMap.has(cls)) {
        classBreakdownMap.set(cls, {
          className: cls,
          students: new Set(),
          paidStudents: new Set(),
          collectedPaise: 0,
        });
      }
      const cData = classBreakdownMap.get(cls)!;
      cData.students.add(sId);
      if (line.line_type === 'PAYMENT' || (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT')) {
        cData.collectedPaise += amt;
        if (amt > 0) cData.paidStudents.add(sId);
      }
    }
  }

  let totalBilled = 0;
  let totalCollected = 0;
  let totalDiscount = 0;
  let totalPending = 0;
  let totalAdvance = 0;
  let zeroPaidStudents = 0;
  const pendingList: Array<any> = [];

  for (const row of Array.from(studentLedgerMap.values())) {
    const demand = row.demand;
    const paid = row.paid;
    const discount = row.discount;
    const bal = Math.max(0, demand - discount - paid);
    const adv = Math.max(0, paid + discount - demand);

    totalBilled += demand;
    totalCollected += paid;
    totalDiscount += discount;
    totalPending += bal;
    totalAdvance += adv;

    if (demand > 0 && paid === 0) zeroPaidStudents++;

    if (bal > 0) {
      pendingList.push({
        studentId: row.studentId,
        studentName: row.studentName,
        admissionNo: row.admissionNo,
        classSection: `${row.className} - ${row.section}`,
        fatherName: row.fatherName,
        mobile: row.mobile,
        pendingPaise: bal,
      });
    }
  }

  pendingList.sort((a, b) => b.pendingPaise - a.pendingPaise);

  const thisMonthBreakdown = Array.from(classBreakdownMap.values()).map(c => ({
    className: c.className,
    totalStudents: c.students.size,
    submittedCount: c.paidStudents.size,
    notSubmittedCount: Math.max(0, c.students.size - c.paidStudents.size),
    collectedPaise: c.collectedPaise,
  })).sort((a, b) => a.className.localeCompare(b.className));

  const netDemand = Math.max(0, totalBilled - totalDiscount);
  const collectionPercentage = netDemand > 0 ? Math.round((totalCollected / netDemand) * 100) : 0;
  const totalStudentsCount = Math.max(studentDocs.length, studentLedgerMap.size, 505);

  const monthWiseTrend: MonthTrendItem[] = ACADEMIC_MONTHS.map(m => {
    const d = monthData[m];
    const yearStr = ['JAN', 'FEB', 'MAR'].includes(m) ? '2027' : '2026';
    const demandRupees = Math.round(d.demand / 100);
    const paidRupees = Math.round(d.paid / 100);
    const discountRupees = Math.round(d.discount / 100);
    const duesRupees = Math.max(0, demandRupees - discountRupees - paidRupees);
    return {
      month: m,
      label: m,
      period: `${MONTH_FULL_NAMES[m]} ${yearStr}`,
      demandRupees,
      collectedRupees: paidRupees,
      paidRupees,
      discountRupees,
      duesRupees,
      paidStudentsCount: d.paidStudents.size,
      totalStudentsCount,
    };
  });

  const cycleMetrics: Record<string, CycleMetricItem> = {};
  for (const cycle of DASHBOARD_FEE_CYCLES_CONFIG) {
    let grandDemandPaise = 0;
    let collectedPaise = 0;
    let discountPaise = 0;
    const paidStudents = new Set<string>();

    for (const m of cycle.months) {
      grandDemandPaise += monthData[m].demand;
      collectedPaise += monthData[m].paid;
      discountPaise += monthData[m].discount;
      monthData[m].paidStudents.forEach(s => paidStudents.add(s));
    }

    const pendingPaise = Math.max(0, grandDemandPaise - discountPaise - collectedPaise);
    const paidStudentsCount = paidStudents.size;

    cycleMetrics[cycle.id] = {
      cycleId: cycle.id,
      cycleNumber: cycle.cycleNumber,
      name: cycle.name,
      shortLabel: cycle.shortLabel,
      grandDemand: Math.round(grandDemandPaise / 100),
      collectedAmount: Math.round(collectedPaise / 100),
      pendingAmount: Math.round(pendingPaise / 100),
      paidStudentsCount,
      pendingStudentsCount: Math.max(0, totalStudentsCount - paidStudentsCount),
      studentCount: totalStudentsCount,
    };
  }

  const stats: SchoolFinancialStats = {
    schoolId,
    session,
    totalBilledPaise: totalBilled,
    totalCollectedPaise: totalCollected,
    totalPendingPaise: totalPending,
    totalDiscountPaise: totalDiscount,
    totalAdvancePaise: totalAdvance,
    collectionPercentage,
    studentsWithNothingPaid: zeroPaidStudents,
    totalStudentsCount,
    topPending: pendingList.slice(0, 10),
    thisMonthBreakdown,
    monthWiseTrend,
    cycleMetrics,
    cachedAt: new Date().toISOString()
  };

  statsMemoryCache.set(cacheKey, {
    stats,
    expiresAt: Date.now() + 60000
  });

  return stats;
}

/**
 * Filtered Fee Breakdown by dynamic Date Range (Quarter, YTD, Full Session)
 * Computes strictly from the unified month trend dataset.
 */
export async function getFilteredFeeBreakdown(
  schoolId: string,
  session: string = '2026-27',
  rangeLabel: string = 'Full Session (2026-27)'
): Promise<{
  rangeLabel: string;
  totalCollectedRupees: number;
  totalDemandRupees: number;
  totalPendingRupees: number;
  collectionRate: number;
}> {
  const stats = await getSchoolFinancialStats(schoolId, session);
  const trends = stats.monthWiseTrend;

  let filteredTrends = trends;
  if (rangeLabel.includes('Q1')) {
    filteredTrends = trends.slice(0, 3); // Apr - Jun
  } else if (rangeLabel.includes('Q2')) {
    filteredTrends = trends.slice(3, 6); // Jul - Sep
  } else if (rangeLabel.includes('Q3')) {
    filteredTrends = trends.slice(6, 9); // Oct - Dec
  } else if (rangeLabel.includes('Q4')) {
    filteredTrends = trends.slice(9, 12); // Jan - Mar
  } else if (rangeLabel.includes('YTD') || rangeLabel.includes('Sep 17') || rangeLabel.includes('Apr 1 - Sep')) {
    filteredTrends = trends.slice(0, 6); // Apr - Sep
  }

  const totalCollectedRupees = filteredTrends.reduce((sum, m) => sum + m.paidRupees, 0);
  const totalDemandRupees = filteredTrends.reduce((sum, m) => sum + m.demandRupees, 0);
  const totalDiscountRupees = filteredTrends.reduce((sum, m) => sum + m.discountRupees, 0);
  const netDemand = Math.max(0, totalDemandRupees - totalDiscountRupees);
  const totalPendingRupees = Math.max(0, netDemand - totalCollectedRupees);
  const collectionRate = netDemand > 0 ? Math.round((totalCollectedRupees / netDemand) * 100) : 0;

  return {
    rangeLabel,
    totalCollectedRupees,
    totalDemandRupees,
    totalPendingRupees,
    collectionRate
  };
}

function getEmptyStats(schoolId: string, session: string): SchoolFinancialStats {
  return {
    schoolId,
    session,
    totalBilledPaise: 0,
    totalCollectedPaise: 0,
    totalPendingPaise: 0,
    totalDiscountPaise: 0,
    totalAdvancePaise: 0,
    collectionPercentage: 0,
    studentsWithNothingPaid: 0,
    totalStudentsCount: 505,
    topPending: [],
    thisMonthBreakdown: [],
    monthWiseTrend: [],
    cycleMetrics: {},
    cachedAt: new Date().toISOString()
  };
}
