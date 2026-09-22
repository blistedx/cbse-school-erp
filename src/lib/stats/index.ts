import { getDatabase } from '@/lib/mongodb';
import { ACADEMIC_MONTHS, MONTH_FULL_NAMES } from '@/lib/fees-engine/constants';
import type { AcademicMonth, FeeLedgerLine, ReceiptRecord } from '@/lib/fees-engine/types';
import { AggregatesService } from '@/lib/services/aggregates.service';

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
  { id: 'cycle-all', cycleNumber: 'ALL', name: 'All Cycles: Full Academic Year (Annual)', shortLabel: 'All Cycles (Annual)', months: ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'] as AcademicMonth[], multiplier: 12 },
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

  const aggregate = await AggregatesService.getSchoolAggregate(schoolId, session, forceFresh);
  const formatted: SchoolFinancialStats = {
    schoolId,
    session,
    totalBilledPaise: aggregate.financials.totalBilledPaise,
    totalCollectedPaise: aggregate.financials.totalCollectedPaise,
    totalPendingPaise: aggregate.financials.totalPendingPaise,
    totalDiscountPaise: aggregate.financials.totalDiscountPaise,
    totalAdvancePaise: 0,
    collectionPercentage: aggregate.financials.collectionPercentage,
    studentsWithNothingPaid: aggregate.financials.studentsWithNothingPaid,
    totalStudentsCount: aggregate.total_students,
    topPending: aggregate.financials.topPending || [],
    thisMonthBreakdown: aggregate.financials.thisMonthBreakdown || [],
    monthWiseTrend: (aggregate.financials.monthWiseTrend || []).map(m => ({
      month: m.month as AcademicMonth,
      label: m.month,
      period: m.month,
      demandRupees: m.billed,
      collectedRupees: m.collected,
      paidRupees: m.collected,
      duesRupees: m.pending,
      discountRupees: 0,
      paidStudentsCount: 0,
      totalStudentsCount: aggregate.total_students
    })),
    cycleMetrics: {},
    cachedAt: aggregate.updated_at || new Date().toISOString()
  };

  statsMemoryCache.set(cacheKey, { stats: formatted, expiresAt: Date.now() + 60000 });
  return formatted;
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
