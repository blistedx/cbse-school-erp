/*! EduSuite Fee Master — Unified Single Source of Truth Fee Engine v4.0.0 */
import { Student } from '../types';
import { getDatabase, sanitizeDocNoBinary } from '../mongodb';
import {
  REPORT_CONFIGS,
  type ReportConfig,
  type ReportQueryResult,
  type ReportSummaryKpi,
} from '../fees-engine/report-configs';
import { buildReportFromRegistry } from './reports/registry';
import { AS_OF_TODAY_DATE, getSchoolFeeMetrics } from './metrics';

export type FeeHeadType =
  | 'TUITION'
  | 'ANNUAL'
  | 'TRANSPORT'
  | 'EXAM'
  | 'HOSTEL'
  | 'ADMISSION'
  | 'REGISTRATION'
  | 'LAB'
  | 'LATE_FEE'
  | 'FILE_MISC'
  | 'OTHER';

export type DemandStatus = 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE' | 'ADVANCE';

export interface FeeDemandRecord {
  id: string;
  schoolId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  feeHead: FeeHeadType;
  period: string; // e.g. 'APR', 'MAY', 'ONE_TIME', 'TERM1'
  periodLabel: string; // e.g. 'April 2026', 'One-Time'
  grossAmount: number; // in paise
  discountAmount: number; // in paise
  discountReason?: string | null;
  netAmount: number; // gross - discount in paise
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface FeePaymentRecord {
  id: string;
  receiptNo: string;
  schoolId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  fatherName: string;
  mobile: string;
  demandIds?: string[];
  allocatedHeads: Array<{
    feeHead: FeeHeadType;
    period: string;
    amountPaise: number;
  }>;
  amountPaid: number; // in paise
  mode: 'CASH' | 'UPI' | 'CHEQUE' | 'ONLINE' | 'DD' | 'NEFT';
  paidOn: string; // YYYY-MM-DD
  txnRef?: string | null;
  chequeNo?: string | null;
  collectedBy: string;
  remarks?: string | null;
  cancelled: boolean;
  cancelledReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
}

export interface StudentLedgerItem {
  id: string;
  feeHead: FeeHeadType;
  period: string;
  periodLabel: string;
  grossPaise: number;
  discountPaise: number;
  discountReason?: string | null;
  netPaise: number;
  paidPaise: number;
  duePaise: number;
  status: DemandStatus;
  dueDate: string;
  receiptNo?: string | null;
  receipts: Array<{
    receiptNo: string;
    amountPaise: number;
    paidOn: string;
    mode: string;
  }>;
}

export interface StudentLedgerSummary {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  totalBilled: number; // in paise
  totalDiscount: number; // in paise
  netBilled: number; // in paise
  totalPaid: number; // in paise
  balanceDue: number; // in paise
  advanceCredit: number; // in paise
  status: DemandStatus;
  headWise: Array<{
    feeHead: FeeHeadType;
    billed: number;
    paid: number;
    balance: number;
  }>;
}

export interface SchoolFeeOverview {
  totalStudents: number;
  grossBilledPaise: number;
  discountsPaise: number;
  netBilledPaise: number;
  totalCollectedPaise: number;
  outstandingDuesPaise: number;
  advanceCollectedPaise: number;
  collectionRate: number; // percentage 0-100
  headBreakdown: Record<string, { billed: number; collected: number; due: number }>;
}

export const MONTH_SCHEDULE = [
  { key: 'APR', label: 'April 2026', due: '2026-04-15', slot: 'SLOT_1_APR' },
  { key: 'MAY', label: 'May 2026', due: '2026-05-15', slot: 'SLOT_2_MAY_JUN' },
  { key: 'JUN', label: 'June 2026', due: '2026-05-15', slot: 'SLOT_2_MAY_JUN' },
  { key: 'JUL', label: 'July 2026', due: '2026-07-15', slot: 'SLOT_3_JUL' },
  { key: 'AUG', label: 'August 2026', due: '2026-08-15', slot: 'SLOT_4_AUG' },
  { key: 'SEP', label: 'September 2026', due: '2026-09-15', slot: 'SLOT_5_SEP_FEB' },
  { key: 'OCT', label: 'October 2026', due: '2026-10-15', slot: 'SLOT_6_OCT' },
  { key: 'NOV', label: 'November 2026', due: '2026-11-15', slot: 'SLOT_7_NOV' },
  { key: 'DEC', label: 'December 2026', due: '2026-12-15', slot: 'SLOT_8_DEC_MAR' },
  { key: 'JAN', label: 'January 2027', due: '2027-01-15', slot: 'SLOT_9_JAN' },
  { key: 'FEB', label: 'February 2027', due: '2027-02-15', slot: 'SLOT_5_SEP_FEB' },
  { key: 'MAR', label: 'March 2027', due: '2027-03-15', slot: 'SLOT_8_DEC_MAR' },
];

export function getTuitionRatePaise(className: string): number {
  const c = String(className || '').toUpperCase().trim();
  if (['PG', 'PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'KG', 'PRE-PRIMARY'].some(k => c.includes(k))) return 100000; // ₹1,000/mo
  if (['1', 'I', '2', 'II', 'CLASS 1', 'CLASS 2', 'CLASS I', 'CLASS II'].some(k => c === k || c.startsWith(k + ' '))) return 140000; // ₹1,400/mo
  if (['3', 'III', '4', 'IV', '5', 'V', 'CLASS 3', 'CLASS 4', 'CLASS 5'].some(k => c === k || c.startsWith(k + ' '))) return 160000; // ₹1,600/mo
  if (['6', 'VI', '7', 'VII', '8', 'VIII', 'CLASS 6', 'CLASS 7', 'CLASS 8'].some(k => c === k || c.startsWith(k + ' '))) return 180000; // ₹1,800/mo
  if (['9', 'IX', '10', 'X', 'CLASS 9', 'CLASS 10'].some(k => c === k || c.startsWith(k + ' '))) return 200000; // ₹2,000/mo
  if (['11', 'XI', '12', 'XII', 'CLASS 11', 'CLASS 12'].some(k => c === k || c.startsWith(k + ' '))) return 240000; // ₹2,400/mo
  return 160000;
}

export function getAnnualFeePaise(className: string): number {
  const c = String(className || '').toUpperCase().trim();
  if (['9', '10', '11', '12', 'IX', 'X', 'XI', 'XII', 'CLASS 9', 'CLASS 10', 'CLASS 11', 'CLASS 12'].some(k => c === k || c.startsWith(k + ' '))) {
    return 600000; // ₹6,000/yr for Class IX-XII
  }
  return 500000; // ₹5,000/yr for PG-VIII
}

export function getTransportRatePaise(slabId: string | number): number {
  const s = String(slabId || '1');
  if (s === '1') return 80000; // ₹800 (1-3 km)
  if (s === '2') return 90000; // ₹900 (4-6 km)
  if (s === '3') return 110000; // ₹1,100 (7-12 km)
  if (s === '4') return 130000; // ₹1,300 (13-16 km)
  if (s === '5') return 180000; // ₹1,800 (16-20 km)
  return 90000;
}

export function generateDemandsForStudent(
  student: Student,
  session: string = '2026-27',
  siblingTier?: { order: number; tuitionDiscountPct: number; freeTransport: boolean } | null
): FeeDemandRecord[] {
  const schoolId = student.school_id || 'DPS2026';
  const isRte = String(student.is_rte || '').toUpperCase() === 'YES';
  const isTransport = String(student.transport_opted || '').toUpperCase() === 'YES';
  const transportSlab = student.transport_slab_id || '1';
  const isNewAdmission = !!(student.admission_no && (student.admission_no.includes('2026') || student.admission_no.includes('ADM-')));

  const tuitionMonthly = getTuitionRatePaise(student.class_name);
  const annualFee = getAnnualFeePaise(student.class_name);
  const transportMonthly = getTransportRatePaise(transportSlab);

  const demands: FeeDemandRecord[] = [];
  const studentName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Scholar';
  const admNo = student.admission_no || '';
  const cls = student.class_name || 'Class 1';
  const sec = student.section || 'A';
  const now = '2026-04-01T09:00:00.000Z';

  // 1. Annual Fee (Charged in April)
  if (!isRte) {
    demands.push({
      id: `DEM-${student.id}-ANNUAL-APR`,
      schoolId,
      sessionId: session,
      studentId: student.id,
      studentName,
      admissionNo: admNo,
      className: cls,
      section: sec,
      feeHead: 'ANNUAL',
      period: 'APR',
      periodLabel: 'April 2026 (Annual Fee)',
      grossAmount: annualFee,
      discountAmount: 0,
      discountReason: null,
      netAmount: annualFee,
      dueDate: '2026-04-15',
      createdAt: now,
    });
  }

  // 2. One-Time Charges (Admission & Registration)
  if (isNewAdmission && !isRte) {
    demands.push({
      id: `DEM-${student.id}-REGISTRATION-ONETIME`,
      schoolId,
      sessionId: session,
      studentId: student.id,
      studentName,
      admissionNo: admNo,
      className: cls,
      section: sec,
      feeHead: 'REGISTRATION',
      period: 'ONE_TIME',
      periodLabel: 'Registration / Prospectus',
      grossAmount: 100000,
      discountAmount: 0,
      discountReason: null,
      netAmount: 100000,
      dueDate: '2026-04-01',
      createdAt: now,
    });
    demands.push({
      id: `DEM-${student.id}-ADMISSION-ONETIME`,
      schoolId,
      sessionId: session,
      studentId: student.id,
      studentName,
      admissionNo: admNo,
      className: cls,
      section: sec,
      feeHead: 'ADMISSION',
      period: 'ONE_TIME',
      periodLabel: 'Admission Fee',
      grossAmount: 500000,
      discountAmount: 0,
      discountReason: null,
      netAmount: 500000,
      dueDate: '2026-04-01',
      createdAt: now,
    });
  }

  // 3. 12 Academic Months (Tuition & Transport)
  for (const m of MONTH_SCHEDULE) {
    if (!isRte) {
      let tuitionDisc = 0;
      let tuitionDiscReason: string | null = null;
      if (siblingTier && siblingTier.tuitionDiscountPct > 0) {
        tuitionDisc = Math.round((tuitionMonthly * siblingTier.tuitionDiscountPct) / 100);
        tuitionDiscReason = `Sibling Concession (${siblingTier.tuitionDiscountPct}% on tuition)`;
      }

      demands.push({
        id: `DEM-${student.id}-TUITION-${m.key}`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'TUITION',
        period: m.key,
        periodLabel: m.label,
        grossAmount: tuitionMonthly,
        discountAmount: tuitionDisc,
        discountReason: tuitionDiscReason,
        netAmount: Math.max(0, tuitionMonthly - tuitionDisc),
        dueDate: m.due,
        createdAt: now,
      });
    }

    // Transport if opted
    if (isTransport) {
      let transDisc = 0;
      let transDiscReason: string | null = null;
      if (siblingTier && siblingTier.freeTransport) {
        transDisc = transportMonthly;
        transDiscReason = '4th Child Free Transport Policy';
      }

      demands.push({
        id: `DEM-${student.id}-TRANSPORT-${m.key}`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'TRANSPORT',
        period: m.key,
        periodLabel: `${m.label} (Bus)`,
        grossAmount: transportMonthly,
        discountAmount: transDisc,
        discountReason: transDiscReason,
        netAmount: Math.max(0, transportMonthly - transDisc),
        dueDate: m.due,
        createdAt: now,
      });
    }

    // Exam Fee (July Unit Test ₹500, September Half Yearly ₹1000, February Annual Board ₹1000)
    if (m.key === 'JUL' && !isRte) {
      demands.push({
        id: `DEM-${student.id}-EXAM-JUL`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'EXAM',
        period: 'JUL',
        periodLabel: 'July Unit Test Exam',
        grossAmount: 50000,
        discountAmount: 0,
        discountReason: null,
        netAmount: 50000,
        dueDate: m.due,
        createdAt: now,
      });
    } else if (m.key === 'SEP' && !isRte) {
      demands.push({
        id: `DEM-${student.id}-EXAM-SEP`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'EXAM',
        period: 'SEP',
        periodLabel: 'Half-Yearly Examination',
        grossAmount: 100000,
        discountAmount: 0,
        discountReason: null,
        netAmount: 100000,
        dueDate: m.due,
        createdAt: now,
      });
      // Class 9-12 Lab Charges in September
      if (['9', '10', '11', '12', 'IX', 'X', 'XI', 'XII', 'CLASS 9', 'CLASS 10', 'CLASS 11', 'CLASS 12'].some(k => cls.toUpperCase().includes(k))) {
        demands.push({
          id: `DEM-${student.id}-LAB-SEP`,
          schoolId,
          sessionId: session,
          studentId: student.id,
          studentName,
          admissionNo: admNo,
          className: cls,
          section: sec,
          feeHead: 'LAB',
          period: 'SEP',
          periodLabel: 'Science & Computer Lab Fee',
          grossAmount: 150000,
          discountAmount: 0,
          discountReason: null,
          netAmount: 150000,
          dueDate: m.due,
          createdAt: now,
        });
      }
    } else if (m.key === 'FEB' && !isRte) {
      demands.push({
        id: `DEM-${student.id}-EXAM-FEB`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'EXAM',
        period: 'FEB',
        periodLabel: 'Annual Board Assessment',
        grossAmount: 100000,
        discountAmount: 0,
        discountReason: null,
        netAmount: 100000,
        dueDate: m.due,
        createdAt: now,
      });
    }
  }

  return demands;
}

export async function getStudentLedger(
  schoolId: string,
  studentId: string,
  session: string = '2026-27'
): Promise<{
  items: StudentLedgerItem[];
  summary: StudentLedgerSummary;
  receipts: FeePaymentRecord[];
}> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database connection unavailable');
  }

  // 1. Query Demands
  const demands = (await db
    .collection('fee_demands')
    .find({ schoolId, studentId, sessionId: session })
    .toArray()) as unknown as FeeDemandRecord[];

  // 2. Query Payments (non-cancelled)
  const payments = (await db
    .collection('fee_payments')
    .find({ schoolId, studentId, sessionId: session, cancelled: { $ne: true } })
    .sort({ paidOn: 1, createdAt: 1 })
    .toArray()) as unknown as FeePaymentRecord[];

  // 3. Map allocation per demand
  const paymentAllocMap = new Map<string, { totalPaid: number; receipts: FeePaymentRecord[] }>();

  for (const p of payments) {
    for (const alloc of p.allocatedHeads || []) {
      const demandKey = `${alloc.feeHead}_${alloc.period}`;
      if (!paymentAllocMap.has(demandKey)) {
        paymentAllocMap.set(demandKey, { totalPaid: 0, receipts: [] });
      }
      const entry = paymentAllocMap.get(demandKey)!;
      entry.totalPaid += (alloc.amountPaise || 0);
      entry.receipts.push(p);
    }
  }

  let totalBilled = 0;
  let totalDiscount = 0;
  let netBilled = 0;
  let totalPaid = 0;

  const headMap = new Map<FeeHeadType, { billed: number; paid: number }>();
  const today = new Date().toISOString().split('T')[0];

  const items: StudentLedgerItem[] = demands.map(d => {
    const demandKey = `${d.feeHead}_${d.period}`;
    const alloc = paymentAllocMap.get(demandKey) || { totalPaid: 0, receipts: [] };
    const paidPaise = alloc.totalPaid;
    const duePaise = Math.max(0, d.netAmount - paidPaise);

    totalBilled += d.grossAmount;
    totalDiscount += d.discountAmount;
    netBilled += d.netAmount;
    totalPaid += paidPaise;

    if (!headMap.has(d.feeHead)) headMap.set(d.feeHead, { billed: 0, paid: 0 });
    const h = headMap.get(d.feeHead)!;
    h.billed += d.netAmount;
    h.paid += paidPaise;

    let status: DemandStatus = 'DUE';
    if (duePaise === 0 && d.netAmount > 0) {
      status = 'PAID';
    } else if (paidPaise > 0 && duePaise > 0) {
      status = 'PARTIAL';
    } else if (duePaise > 0) {
      status = d.dueDate < today ? 'OVERDUE' : 'DUE';
    }

    return {
      id: d.id,
      feeHead: d.feeHead,
      period: d.period,
      periodLabel: d.periodLabel,
      grossPaise: d.grossAmount,
      discountPaise: d.discountAmount,
      discountReason: d.discountReason,
      netPaise: d.netAmount,
      paidPaise,
      duePaise,
      status,
      dueDate: d.dueDate,
      receiptNo: alloc.receipts[0]?.receiptNo || null,
      receipts: alloc.receipts.map(r => ({
        receiptNo: r.receiptNo,
        amountPaise: r.amountPaid,
        paidOn: r.paidOn,
        mode: r.mode,
      })),
    };
  });

  const balanceDue = Math.max(0, netBilled - totalPaid);
  const advanceCredit = Math.max(0, totalPaid - netBilled);

  let overallStatus: DemandStatus = 'PAID';
  if (balanceDue === 0 && netBilled > 0) overallStatus = 'PAID';
  else if (totalPaid > 0 && balanceDue > 0) overallStatus = 'PARTIAL';
  else if (balanceDue > 0) overallStatus = 'OVERDUE';

  const summary: StudentLedgerSummary = {
    studentId,
    studentName: demands[0]?.studentName || 'Scholar',
    admissionNo: demands[0]?.admissionNo || '',
    className: demands[0]?.className || 'Class 1',
    section: demands[0]?.section || 'A',
    totalBilled,
    totalDiscount,
    netBilled,
    totalPaid,
    balanceDue,
    advanceCredit,
    status: overallStatus,
    headWise: Array.from(headMap.entries()).map(([feeHead, val]) => ({
      feeHead,
      billed: val.billed,
      paid: val.paid,
      balance: Math.max(0, val.billed - val.paid),
    })),
  };

  return { items, summary, receipts: payments };
}

export async function getSchoolFeeOverview(
  schoolId: string,
  session: string = '2026-27'
): Promise<SchoolFeeOverview> {
  const metrics = await getSchoolFeeMetrics(schoolId, session);
  return {
    totalStudents: metrics.totalStudents,
    grossBilledPaise: metrics.grossBilledFullSessionPaise,
    discountsPaise: metrics.discountFullSessionPaise,
    netBilledPaise: metrics.billedFullSessionPaise,
    totalCollectedPaise: metrics.totalCollectedPaise,
    outstandingDuesPaise: metrics.pendingDuesPaise,
    advanceCollectedPaise: metrics.advanceCollectedPaise,
    collectionRate: metrics.collectionRate,
    headBreakdown: metrics.headBreakdown,
  };
}

// ⚡ High-Speed Server-Side Report Snapshot Cache (0ms response time, invalidated on fee collection/cancellation)
const REPORT_CACHE = new Map<string, { result: ReportQueryResult; timestamp: number }>();
const REPORT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL (event-driven invalidation)

export function invalidateReportCache(schoolId?: string) {
  if (schoolId) {
    const cleanId = schoolId.replace(/[^A-Z0-9]/gi, '');
    for (const key of Array.from(REPORT_CACHE.keys())) {
      if (key.includes(schoolId) || key.includes(cleanId) || key.includes('DPS2026')) {
        REPORT_CACHE.delete(key);
      }
    }
  } else {
    REPORT_CACHE.clear();
  }
}

export async function queryReport(
  reportKey: string,
  filters: {
    schoolId?: string;
    session?: string;
    className?: string;
    section?: string;
    groupBy?: 'class' | 'section';
    month?: string;
    paymentMode?: string;
    search?: string;
  } = {}
): Promise<ReportQueryResult> {
  const schoolId = filters.schoolId || 'DPS2026';
  const session = filters.session || '2026-27';

  // ⚡ 0ms Fast Cache Hit: return snapshot immediately if available
  const cacheKey = `${schoolId}_${session}_${reportKey}_${JSON.stringify(filters)}`;
  const cached = REPORT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < REPORT_CACHE_TTL_MS) {
    return cached.result;
  }

  const db = await getDatabase();
  if (!db) {
    const config = REPORT_CONFIGS.find(r => r.id === reportKey);
    return {
      reportId: config?.id || reportKey,
      reportName: config?.name || reportKey,
      generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      session,
      filtersUsed: filters,
      summaryKpis: [],
      columns: config?.columns || [],
      rows: [],
      totalRowCount: 0,
    };
  }

  // 1. Build targeted query for live receipts
  const receiptsQuery: any = {
    $or: [{ school_id: schoolId }, { school_id: 'DPS2026' }],
    academic_session: session,
    is_cancelled: { $ne: true }
  };

  const isDemandReport = ['defaulter_list', 'demand_vs_collection', 'month_class_collection', 'student_wise_collection', 'head_wise_collection', 'pending_fees_list', 'class_summary'].includes(reportKey);

  if (!isDemandReport && filters.month && filters.month !== 'ALL') {
    const m = filters.month.toUpperCase();
    const monthNumMap: Record<string, string> = {
      'APR': '04', 'APRIL': '04', '04': '04',
      'MAY': '05', '05': '05',
      'JUN': '06', 'JUNE': '06', '06': '06',
      'JUL': '07', 'JULY': '07', '07': '07',
      'AUG': '08', 'AUGUST': '08', '08': '08',
      'SEP': '09', 'SEPTEMBER': '09', '09': '09',
      'OCT': '10', 'OCTOBER': '10', '10': '10',
      'NOV': '11', 'NOVEMBER': '11', '11': '11',
      'DEC': '12', 'DECEMBER': '12', '12': '12',
      'JAN': '01', 'JANUARY': '01', '01': '01',
      'FEB': '02', 'FEBRUARY': '02', '02': '02',
      'MAR': '03', 'MARCH': '03', '03': '03',
    };
    const num = monthNumMap[m];
    if (num) {
      const year = ['01', '02', '03'].includes(num) ? '2027' : '2026';
      const lastDay = num === '02' ? '28' : ['04', '06', '09', '11'].includes(num) ? '30' : '31';
      receiptsQuery.payment_date = {
        $gte: `${year}-${num}-01`,
        $lte: `${year}-${num}-${lastDay}`
      };
    }
  }

  if (filters.className && filters.className !== 'ALL') {
    receiptsQuery.class_name = new RegExp(`^${filters.className}$`, 'i');
  }
  if (filters.section && filters.section !== 'ALL') {
    receiptsQuery.section = new RegExp(`^${filters.section}$`, 'i');
  }
  if (filters.paymentMode && filters.paymentMode !== 'ALL') {
    receiptsQuery.payment_mode = filters.paymentMode;
  }

  // 2. Fetch lightweight students, demands (if needed), and live receipts in parallel
  const [studentsDocs, demandsDocs, rawReceipts] = await Promise.all([
    db.collection('students').find(
      { $or: [{ school_id: schoolId }, { school_id: 'DPS2026' }] },
      {
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
          phone: 1,
          guardian_phone: 1,
          is_rte: 1,
          transport_opted: 1,
          transport_slab_id: 1,
          sibling_order: 1,
          status: 1
        }
      }
    ).toArray() as unknown as Promise<Student[]>,

    isDemandReport
      ? (db.collection('fee_demands').find(
          { $or: [{ schoolId }, { schoolId: 'DPS2026' }], sessionId: session },
          {
            projection: {
              id: 1,
              studentId: 1,
              studentName: 1,
              admissionNo: 1,
              className: 1,
              section: 1,
              feeHead: 1,
              period: 1,
              grossAmount: 1,
              discountAmount: 1,
              netAmount: 1,
              dueDate: 1,
            }
          }
        ).toArray() as unknown as Promise<FeeDemandRecord[]>)
      : Promise.resolve([] as FeeDemandRecord[]),

    db.collection('fee_receipts').find(
      receiptsQuery,
      {
        projection: {
          _id: 1,
          receipt_no: 1,
          school_id: 1,
          academic_session: 1,
          student_id: 1,
          student_name: 1,
          admission_no: 1,
          class_name: 1,
          section: 1,
          father_name: 1,
          mobile: 1,
          payment_date: 1,
          payment_mode: 1,
          amount_paise: 1,
          collected_by: 1,
          is_cancelled: 1,
          allocated_heads: 1,
          created_at: 1
        }
      }
    ).sort({ payment_date: -1, created_at: -1 }).toArray()
  ]);

  // Convert live fee_receipts into normalized FeePaymentRecord format
  const payments: FeePaymentRecord[] = rawReceipts.map((r: any) => ({
    id: String(r._id || r.receipt_no),
    receiptNo: r.receipt_no || '',
    schoolId: r.school_id || schoolId,
    sessionId: r.academic_session || session,
    studentId: r.student_id || '',
    studentName: r.student_name || 'Scholar',
    admissionNo: r.admission_no || '',
    className: r.class_name || '',
    section: r.section || 'A',
    fatherName: r.father_name || '',
    mobile: r.mobile || '',
    amountPaid: Number(r.amount_paise) || 0,
    mode: (r.payment_mode || 'CASH') as any,
    paidOn: r.payment_date || (r.created_at ? r.created_at.split('T')[0] : '2026-09-21'),
    collectedBy: r.collected_by || 'admin',
    cancelled: Boolean(r.is_cancelled),
    allocatedHeads: Array.isArray(r.allocated_heads) ? r.allocated_heads.map((h: any) => ({
      feeHead: h.fee_head || 'TUITION',
      period: h.period || h.month || '',
      amountPaise: Number(h.amount_paise) || 0
    })) : [],
    createdAt: r.created_at || new Date().toISOString()
  }));

  // Apply student metadata filters
  let filteredStudents = studentsDocs;
  if (filters.className && filters.className !== 'ALL') {
    filteredStudents = filteredStudents.filter(s => (s.class_name || '').toLowerCase() === filters.className!.toLowerCase());
  }
  if (filters.section && filters.section !== 'ALL') {
    filteredStudents = filteredStudents.filter(s => (s.section || '').toLowerCase() === filters.section!.toLowerCase());
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    filteredStudents = filteredStudents.filter(s =>
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.admission_no || '').toLowerCase().includes(q) ||
      (s.father_name || '').toLowerCase().includes(q)
    );
  }

  const result = buildReportFromRegistry(reportKey, {
    schoolId,
    session,
    asOfDate: AS_OF_TODAY_DATE,
    students: filteredStudents,
    demands: demandsDocs,
    payments,
    filters,
  });

  REPORT_CACHE.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}
