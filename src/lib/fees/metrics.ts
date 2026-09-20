/*! EduSuite Fee Master — Unified Single Source Metrics Engine v5.0.0 */

import { getDatabase } from '../mongodb';
import type { FeeDemandRecord, FeePaymentRecord } from './fee-service';

export interface StudentFeeState {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  fatherName?: string;
  mobile?: string;
  billedFullSession: number; // paise
  billedDueToDate: number;   // paise (dueDate <= asOfDate)
  upcomingBilled: number;    // paise (dueDate > asOfDate)
  totalCollected: number;    // paise
  pendingDues: number;       // paise (sum of max(0, net - paid) for dueDate <= asOfDate)
  upcomingDues: number;      // paise (sum of max(0, net - paid) for dueDate > asOfDate)
  advanceAmount: number;     // paise
  status: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE' | 'NEVER_PAID' | 'ADVANCE';
  demands: (FeeDemandRecord & { paid: number; balance: number })[];
  payments: FeePaymentRecord[];
}

export interface SchoolFeeMetricsSummary {
  schoolId: string;
  session: string;
  asOfDate: string;
  totalStudents: number;
  totalEnrolled: number;
  // Billed
  grossBilledFullSessionPaise: number;
  discountFullSessionPaise: number;
  billedFullSessionPaise: number;
  billedDueToDatePaise: number;
  upcomingBilledPaise: number;
  // Collected
  totalCollectedPaise: number;
  advanceCollectedPaise: number;
  // Dues
  pendingDuesPaise: number; // Statutory definition: Balance(asOf today)
  upcomingDuesPaise: number;
  fullYearBalancePaise: number;
  // Rates & Counts
  collectionRate: number; // percentage (Collected / BilledDueToDate * 100)
  neverPaidCount: number;
  partialPaidCount: number;
  fullyPaidCount: number;
  advancePayerCount: number;
  // Sub-aggregates
  headBreakdown: Record<string, { billed: number; collected: number; due: number }>;
  classBreakdown: Record<string, {
    className: string;
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    demandPaise: number;
    discountPaise: number;
    collectedPaise: number;
    pendingPaise: number;
    upcomingPaise: number;
    realizationRate: string;
  }>;
}

export const AS_OF_TODAY_DATE = '2026-09-20';

/**
 * Compute student ledger state by allocating non-cancelled payments chronologically to demands
 */
export function computeStudentFeeState(
  studentId: string,
  demands: FeeDemandRecord[],
  payments: FeePaymentRecord[],
  asOfDate: string = AS_OF_TODAY_DATE
): StudentFeeState {
  const activePayments = payments.filter(p => !p.cancelled && p.studentId === studentId);
  const studentDemands = demands.filter(d => d.studentId === studentId);

  // Sort demands chronologically by dueDate
  const sortedDemands = [...studentDemands].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  let totalCollected = activePayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  let availablePayment = totalCollected;

  let billedFullSession = 0;
  let billedDueToDate = 0;
  let upcomingBilled = 0;
  let pendingDues = 0;
  let upcomingDues = 0;

  const processedDemands: (FeeDemandRecord & { paid: number; balance: number })[] = [];

  for (const d of sortedDemands) {
    const net = d.netAmount || 0;
    billedFullSession += net;

    const isDue = d.dueDate <= asOfDate;
    if (isDue) {
      billedDueToDate += net;
    } else {
      upcomingBilled += net;
    }

    const alloc = Math.min(availablePayment, net);
    const balance = Math.max(0, net - alloc);
    availablePayment -= alloc;

    if (isDue) {
      pendingDues += balance;
    } else {
      upcomingDues += balance;
    }

    processedDemands.push({
      ...d,
      paid: alloc,
      balance,
    });
  }

  const advanceInflow = Math.max(availablePayment, Math.max(0, totalCollected - billedDueToDate));

  let status: StudentFeeState['status'] = 'DUE';
  if (totalCollected === 0 && billedDueToDate > 0) {
    status = 'NEVER_PAID';
  } else if (pendingDues === 0 && advanceInflow > 0) {
    status = 'ADVANCE';
  } else if (pendingDues === 0) {
    status = 'PAID';
  } else if (totalCollected > 0) {
    status = 'PARTIAL';
  } else {
    status = 'OVERDUE';
  }

  const firstD = sortedDemands[0];
  const firstP = activePayments[0];

  return {
    studentId,
    studentName: firstD?.studentName || (firstP as any)?.studentName || 'Scholar',
    admissionNo: firstD?.admissionNo || (firstP as any)?.admissionNo || studentId,
    className: firstD?.className || (firstP as any)?.className || 'Class 1',
    section: firstD?.section || (firstP as any)?.section || 'A',
    billedFullSession,
    billedDueToDate,
    upcomingBilled,
    totalCollected,
    pendingDues,
    upcomingDues,
    advanceAmount: advanceInflow,
    status,
    demands: processedDemands,
    payments: activePayments,
  };
}

/**
 * Load and compute complete statutory school fee metrics from Single Source of Truth
 */
export async function getSchoolFeeMetrics(
  schoolId: string = 'DPS2026',
  session: string = '2026-27',
  asOfDate: string = AS_OF_TODAY_DATE
): Promise<SchoolFeeMetricsSummary> {
  const db = await getDatabase();
  if (!db) {
    return {
      schoolId,
      session,
      asOfDate,
      totalStudents: 0,
      totalEnrolled: 0,
      grossBilledFullSessionPaise: 0,
      discountFullSessionPaise: 0,
      billedFullSessionPaise: 0,
      billedDueToDatePaise: 0,
      upcomingBilledPaise: 0,
      totalCollectedPaise: 0,
      advanceCollectedPaise: 0,
      pendingDuesPaise: 0,
      upcomingDuesPaise: 0,
      fullYearBalancePaise: 0,
      collectionRate: 0,
      neverPaidCount: 0,
      partialPaidCount: 0,
      fullyPaidCount: 0,
      advancePayerCount: 0,
      headBreakdown: {},
      classBreakdown: {},
    };
  }

  const [students, demands, payments] = await Promise.all([
    db.collection('students').find({ school_id: schoolId }).toArray(),
    db.collection('fee_demands').find({ schoolId, sessionId: session }).toArray() as unknown as Promise<FeeDemandRecord[]>,
    db.collection('fee_payments').find({ schoolId, sessionId: session, cancelled: { $ne: true } }).toArray() as unknown as Promise<FeePaymentRecord[]>,
  ]);

  const studentMap = new Map<string, any>();
  for (const s of students) {
    studentMap.set(String(s.id || s._id), s);
  }

  const demandsByStudent = new Map<string, FeeDemandRecord[]>();
  let grossBilledFullSessionPaise = 0;
  let discountFullSessionPaise = 0;
  let billedFullSessionPaise = 0;
  let billedDueToDatePaise = 0;
  let upcomingBilledPaise = 0;
  const headBreakdown: Record<string, { billed: number; collected: number; due: number }> = {};

  for (const d of demands) {
    if (!demandsByStudent.has(d.studentId)) demandsByStudent.set(d.studentId, []);
    demandsByStudent.get(d.studentId)!.push(d);

    grossBilledFullSessionPaise += (d.grossAmount || 0);
    discountFullSessionPaise += (d.discountAmount || 0);
    billedFullSessionPaise += (d.netAmount || 0);

    if (d.dueDate <= asOfDate) {
      billedDueToDatePaise += (d.netAmount || 0);
    } else {
      upcomingBilledPaise += (d.netAmount || 0);
    }

    if (!headBreakdown[d.feeHead]) {
      headBreakdown[d.feeHead] = { billed: 0, collected: 0, due: 0 };
    }
    headBreakdown[d.feeHead].billed += (d.netAmount || 0);
  }

  const paymentsByStudent = new Map<string, FeePaymentRecord[]>();
  let totalCollectedPaise = 0;

  for (const p of payments) {
    if (!paymentsByStudent.has(p.studentId)) paymentsByStudent.set(p.studentId, []);
    paymentsByStudent.get(p.studentId)!.push(p);

    totalCollectedPaise += (p.amountPaid || 0);

    for (const alloc of p.allocatedHeads || []) {
      if (!headBreakdown[alloc.feeHead]) {
        headBreakdown[alloc.feeHead] = { billed: 0, collected: 0, due: 0 };
      }
      headBreakdown[alloc.feeHead].collected += (alloc.amountPaise || 0);
    }
  }

  for (const k of Object.keys(headBreakdown)) {
    headBreakdown[k].due = Math.max(0, headBreakdown[k].billed - headBreakdown[k].collected);
  }

  // Student level states & Class breakdowns
  const classBreakdown: SchoolFeeMetricsSummary['classBreakdown'] = {};
  let pendingDuesPaise = 0;
  let upcomingDuesPaise = 0;
  let advanceCollectedPaise = 0;
  let neverPaidCount = 0;
  let partialPaidCount = 0;
  let fullyPaidCount = 0;
  let advancePayerCount = 0;

  for (const s of students) {
    const sId = String(s.id || s._id);
    const sDemands = demandsByStudent.get(sId) || [];
    const sPayments = paymentsByStudent.get(sId) || [];

    const state = computeStudentFeeState(sId, sDemands, sPayments, asOfDate);
    state.studentName = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || state.studentName;
    state.admissionNo = s.admission_no || state.admissionNo;
    state.className = s.class_name || state.className;
    state.section = s.section || state.section;
    state.fatherName = s.father_name || s.guardian_name;
    state.mobile = s.father_phone || s.guardian_phone || s.phone;

    pendingDuesPaise += state.pendingDues;
    upcomingDuesPaise += state.upcomingDues;
    advanceCollectedPaise += state.advanceAmount;

    if (state.status === 'NEVER_PAID') neverPaidCount++;
    else if (state.status === 'PARTIAL' || state.status === 'OVERDUE') partialPaidCount++;
    else if (state.status === 'PAID') fullyPaidCount++;
    else if (state.status === 'ADVANCE') advancePayerCount++;

    const clsKey = state.className || 'Unassigned';
    if (!classBreakdown[clsKey]) {
      classBreakdown[clsKey] = {
        className: clsKey,
        totalStudents: 0,
        submittedCount: 0,
        notSubmittedCount: 0,
        demandPaise: 0,
        discountPaise: 0,
        collectedPaise: 0,
        pendingPaise: 0,
        upcomingPaise: 0,
        realizationRate: '0%',
      };
    }

    const cEntry = classBreakdown[clsKey];
    cEntry.totalStudents++;
    cEntry.demandPaise += state.billedDueToDate;
    cEntry.collectedPaise += state.totalCollected;
    cEntry.pendingPaise += state.pendingDues;
    cEntry.upcomingPaise += state.upcomingDues;

    if (state.pendingDues === 0) {
      cEntry.submittedCount++;
    } else {
      cEntry.notSubmittedCount++;
    }
  }

  for (const k of Object.keys(classBreakdown)) {
    const c = classBreakdown[k];
    c.realizationRate = c.demandPaise > 0 ? `${Math.round((c.collectedPaise / c.demandPaise) * 100)}%` : '0%';
  }

  const collectionRate = billedDueToDatePaise > 0
    ? Number(((totalCollectedPaise / billedDueToDatePaise) * 100).toFixed(1))
    : 0;

  const fullYearBalancePaise = Math.max(0, billedFullSessionPaise - totalCollectedPaise);

  return {
    schoolId,
    session,
    asOfDate,
    totalStudents: students.length,
    totalEnrolled: students.length,
    grossBilledFullSessionPaise,
    discountFullSessionPaise,
    billedFullSessionPaise,
    billedDueToDatePaise,
    upcomingBilledPaise,
    totalCollectedPaise,
    advanceCollectedPaise,
    pendingDuesPaise,
    upcomingDuesPaise,
    fullYearBalancePaise,
    collectionRate,
    neverPaidCount,
    partialPaidCount,
    fullyPaidCount,
    advancePayerCount,
    headBreakdown,
    classBreakdown,
  };
}
