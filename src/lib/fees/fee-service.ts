/*! EduSuite Fee Master — Unified Single Source of Truth Fee Engine v4.0.0 */
import { Student } from '../types';
import { getDatabase, sanitizeDocNoBinary } from '../mongodb';
import {
  REPORT_CONFIGS,
  type ReportConfig,
  type ReportQueryResult,
  type ReportSummaryKpi,
} from '../fees-engine/report-configs';

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
  const db = await getDatabase();
  if (!db) {
    return {
      totalStudents: 0,
      grossBilledPaise: 0,
      discountsPaise: 0,
      netBilledPaise: 0,
      totalCollectedPaise: 0,
      outstandingDuesPaise: 0,
      advanceCollectedPaise: 0,
      collectionRate: 0,
      headBreakdown: {},
    };
  }

  const [demands, payments, studentCount] = await Promise.all([
    db.collection('fee_demands').find({ schoolId, sessionId: session }).toArray() as unknown as Promise<FeeDemandRecord[]>,
    db.collection('fee_payments').find({ schoolId, sessionId: session, cancelled: { $ne: true } }).toArray() as unknown as Promise<FeePaymentRecord[]>,
    db.collection('students').countDocuments({ school_id: schoolId }),
  ]);

  let grossBilledPaise = 0;
  let discountsPaise = 0;
  let netBilledPaise = 0;
  const headBreakdown: Record<string, { billed: number; collected: number; due: number }> = {};

  for (const d of demands) {
    grossBilledPaise += (d.grossAmount || 0);
    discountsPaise += (d.discountAmount || 0);
    netBilledPaise += (d.netAmount || 0);

    if (!headBreakdown[d.feeHead]) {
      headBreakdown[d.feeHead] = { billed: 0, collected: 0, due: 0 };
    }
    headBreakdown[d.feeHead].billed += (d.netAmount || 0);
  }

  let totalCollectedPaise = 0;
  for (const p of payments) {
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

  const outstandingDuesPaise = Math.max(0, netBilledPaise - totalCollectedPaise);
  const advanceCollectedPaise = Math.max(0, totalCollectedPaise - netBilledPaise);
  const collectionRate = netBilledPaise > 0 ? Math.round((totalCollectedPaise / netBilledPaise) * 1000) / 10 : 0;

  return {
    totalStudents: studentCount || 505,
    grossBilledPaise,
    discountsPaise,
    netBilledPaise,
    totalCollectedPaise,
    outstandingDuesPaise,
    advanceCollectedPaise,
    collectionRate,
    headBreakdown,
  };
}

export async function queryReport(
  reportKey: string,
  filters: {
    schoolId?: string;
    session?: string;
    className?: string;
    section?: string;
    month?: string;
    paymentMode?: string;
    search?: string;
  } = {}
): Promise<ReportQueryResult> {
  const schoolId = filters.schoolId || 'DPS2026';
  const session = filters.session || '2026-27';
  const config = REPORT_CONFIGS.find(r => r.id === reportKey) || REPORT_CONFIGS[0];
  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const db = await getDatabase();
  if (!db) {
    return {
      reportId: config.id,
      reportName: config.name,
      generatedAt,
      session,
      filtersUsed: filters,
      summaryKpis: [],
      columns: config.columns,
      rows: [],
      totalRowCount: 0,
    };
  }

  // Load all students and demands
  const [students, demands, payments] = await Promise.all([
    db.collection('students').find({ school_id: schoolId }).toArray() as unknown as Promise<Student[]>,
    db.collection('fee_demands').find({ schoolId, sessionId: session }).toArray() as unknown as Promise<FeeDemandRecord[]>,
    db.collection('fee_payments').find({ schoolId, sessionId: session }).sort({ paidOn: -1 }).toArray() as unknown as Promise<FeePaymentRecord[]>,
  ]);

  // Build student ledger maps
  const studentDemandMap = new Map<string, FeeDemandRecord[]>();
  for (const d of demands) {
    if (!studentDemandMap.has(d.studentId)) studentDemandMap.set(d.studentId, []);
    studentDemandMap.get(d.studentId)!.push(d);
  }

  const studentPaymentMap = new Map<string, FeePaymentRecord[]>();
  for (const p of payments) {
    if (p.cancelled) continue;
    if (!studentPaymentMap.has(p.studentId)) studentPaymentMap.set(p.studentId, []);
    studentPaymentMap.get(p.studentId)!.push(p);
  }

  // Apply basic filters
  let filteredStudents = students;
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

  const formatCurrency = (paise: number) => `₹${(Math.round(paise) / 100).toLocaleString('en-IN')}`;

  switch (reportKey) {
    // ─── 1. Annual Fee Pending Report ───
    case 'annual_fee_pending': {
      const rows: Record<string, any>[] = [];
      let totalDue = 0;

      for (const s of filteredStudents) {
        const sDemands = (studentDemandMap.get(s.id) || []).filter(d => d.feeHead === 'ANNUAL');
        const sPayments = studentPaymentMap.get(s.id) || [];
        
        const billed = sDemands.reduce((acc, d) => acc + d.netAmount, 0);
        let paid = 0;
        for (const p of sPayments) {
          for (const a of p.allocatedHeads || []) {
            if (a.feeHead === 'ANNUAL') paid += a.amountPaise;
          }
        }

        const bal = Math.max(0, billed - paid);
        if (bal > 0) {
          totalDue += bal;
          rows.push({
            studentName: s.full_name || 'Scholar',
            admissionNo: s.admission_no || s.id,
            classSection: `${s.class_name} - ${s.section || 'A'}`,
            fatherName: s.father_name || 'Parent',
            mobile: s.father_phone || s.guardian_phone || s.phone || 'N/A',
            annualDuePaise: bal,
            status: 'ANNUAL_DUE',
          });
        }
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Annual Fee Pending Count', value: rows.length.toString(), color: 'text-amber-700' },
        { label: 'Annual Fee Outstanding', value: formatCurrency(totalDue), color: 'text-rose-800' },
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
          admissionNo: `${rows.length} Students`,
          classSection: '',
          fatherName: '',
          mobile: '',
          annualDuePaise: totalDue,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // ─── 2. Admission & Registration Pending Report ───
    case 'admission_fee_pending': {
      const rows: Record<string, any>[] = [];
      let totalAdmDue = 0;
      let totalRegDue = 0;
      let grandOneTimeDue = 0;

      for (const s of filteredStudents) {
        const sDemands = studentDemandMap.get(s.id) || [];
        const sPayments = studentPaymentMap.get(s.id) || [];

        const admBilled = sDemands.filter(d => d.feeHead === 'ADMISSION').reduce((a, b) => a + b.netAmount, 0);
        const regBilled = sDemands.filter(d => d.feeHead === 'REGISTRATION').reduce((a, b) => a + b.netAmount, 0);

        let admPaid = 0;
        let regPaid = 0;
        for (const p of sPayments) {
          for (const a of p.allocatedHeads || []) {
            if (a.feeHead === 'ADMISSION') admPaid += a.amountPaise;
            if (a.feeHead === 'REGISTRATION') regPaid += a.amountPaise;
          }
        }

        const admDue = Math.max(0, admBilled - admPaid);
        const regDue = Math.max(0, regBilled - regPaid);
        const totalDue = admDue + regDue;

        if (totalDue > 0) {
          totalAdmDue += admDue;
          totalRegDue += regDue;
          grandOneTimeDue += totalDue;
          rows.push({
            studentName: s.full_name || 'Scholar',
            admissionNo: s.admission_no || s.id,
            classSection: `${s.class_name} - ${s.section || 'A'}`,
            fatherName: s.father_name || 'Parent',
            mobile: s.father_phone || s.guardian_phone || s.phone || 'N/A',
            admissionDuePaise: admDue,
            registrationDuePaise: regDue,
            totalOneTimeDuePaise: totalDue,
            status: 'ADMISSION_DUE',
          });
        }
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Scholars with Admission Dues', value: rows.length.toString(), color: 'text-amber-700' },
        { label: 'Admission Fee Outstanding', value: formatCurrency(totalAdmDue), color: 'text-rose-800' },
        { label: 'Registration Fee Outstanding', value: formatCurrency(totalRegDue), color: 'text-indigo-800' },
        { label: 'Total One-Time Dues', value: formatCurrency(grandOneTimeDue), color: 'text-rose-950' },
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
          admissionNo: `${rows.length} Students`,
          classSection: '',
          fatherName: '',
          mobile: '',
          admissionDuePaise: totalAdmDue,
          registrationDuePaise: totalRegDue,
          totalOneTimeDuePaise: grandOneTimeDue,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // ─── 3. Pending Fees List (Comprehensive Defaulters with WhatsApp reminder) ───
    case 'pending_fees_list': {
      const rows: Record<string, any>[] = [];
      let grandPending = 0;
      let sr = 1;

      for (const s of filteredStudents) {
        const sDemands = studentDemandMap.get(s.id) || [];
        const sPayments = studentPaymentMap.get(s.id) || [];

        const netBilled = sDemands.reduce((a, b) => a + b.netAmount, 0);
        const totalPaid = sPayments.reduce((a, b) => a + b.amountPaid, 0);
        const bal = Math.max(0, netBilled - totalPaid);

        if (bal > 0) {
          grandPending += bal;
          // Count pending months
          const pendingMonths = sDemands
            .filter(d => d.feeHead === 'TUITION' && d.dueDate < '2026-09-20')
            .length;

          const lastPayment = sPayments[0];

          rows.push({
            srNo: sr++,
            studentName: s.full_name || 'Scholar',
            admissionNo: s.admission_no || s.id,
            classSection: `${s.class_name} - ${s.section || 'A'}`,
            fatherName: s.father_name || 'Parent',
            mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
            monthsPending: pendingMonths > 0 ? `${pendingMonths} Months` : 'One-Time / Current',
            pendingPaise: bal,
            lastPaidDate: lastPayment ? lastPayment.paidOn : 'Never Paid',
          });
        }
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Pending Scholars', value: rows.length.toString(), color: 'text-amber-700' },
        { label: 'Total Outstanding Dues', value: formatCurrency(grandPending), color: 'text-rose-800' },
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
        totalRowCount: rows.length,
      };
    }

    // ─── 4. Never Paid Students ───
    case 'never_paid_defaulters': {
      const rows: Record<string, any>[] = [];
      let grandPending = 0;

      for (const s of filteredStudents) {
        const sDemands = studentDemandMap.get(s.id) || [];
        const sPayments = studentPaymentMap.get(s.id) || [];

        const netBilled = sDemands.reduce((a, b) => a + b.netAmount, 0);
        const totalPaid = sPayments.reduce((a, b) => a + b.amountPaid, 0);

        if (totalPaid === 0 && netBilled > 0) {
          grandPending += netBilled;
          rows.push({
            studentName: s.full_name || 'Scholar',
            admissionNo: s.admission_no || s.id,
            classSection: `${s.class_name} - ${s.section || 'A'}`,
            fatherName: s.father_name || 'Parent',
            mobile: s.father_phone || s.guardian_phone || s.phone || 'N/A',
            totalDemandPaise: netBilled,
            pendingPaise: netBilled,
            status: 'NEVER_PAID',
          });
        }
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Never Paid Scholars', value: rows.length.toString(), color: 'text-rose-700' },
        { label: 'Uncollected Dues', value: formatCurrency(grandPending), color: 'text-rose-900' },
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
          mobile: '',
          totalDemandPaise: grandPending,
          pendingPaise: grandPending,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }

    // ─── 5. Class-wise Fee Summary (DCB Master Summary) ───
    case 'class_wise_summary': {
      const classMap = new Map<string, { totalStudents: number; demand: number; discount: number; collected: number; balance: number }>();

      for (const s of filteredStudents) {
        const cls = s.class_name || 'Class 1';
        if (!classMap.has(cls)) {
          classMap.set(cls, { totalStudents: 0, demand: 0, discount: 0, collected: 0, balance: 0 });
        }
        const cEntry = classMap.get(cls)!;
        cEntry.totalStudents++;

        const sDemands = studentDemandMap.get(s.id) || [];
        const sPayments = studentPaymentMap.get(s.id) || [];

        const gross = sDemands.reduce((a, b) => a + b.grossAmount, 0);
        const disc = sDemands.reduce((a, b) => a + b.discountAmount, 0);
        const paid = sPayments.reduce((a, b) => a + b.amountPaid, 0);
        const net = gross - disc;

        cEntry.demand += gross;
        cEntry.discount += disc;
        cEntry.collected += paid;
        cEntry.balance += Math.max(0, net - paid);
      }

      let grandDemand = 0;
      let grandDisc = 0;
      let grandColl = 0;
      let grandBal = 0;
      let grandStudents = 0;

      const rows = Array.from(classMap.entries()).map(([className, stat]) => {
        grandDemand += stat.demand;
        grandDisc += stat.discount;
        grandColl += stat.collected;
        grandBal += stat.balance;
        grandStudents += stat.totalStudents;

        const net = stat.demand - stat.discount;
        const rate = net > 0 ? `${Math.round((stat.collected / net) * 100)}%` : '0%';

        return {
          className,
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

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Billed', value: formatCurrency(grandDemand) },
        { label: 'Concessions Given', value: formatCurrency(grandDisc), color: 'text-indigo-700' },
        { label: 'Total Collected', value: formatCurrency(grandColl), color: 'text-emerald-700' },
        { label: 'Pending Dues', value: formatCurrency(grandBal), color: 'text-rose-700' },
        { label: 'Collection %', value: grandRate, color: 'text-blue-700' },
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
          demandPaise: grandDemand,
          discountPaise: grandDisc,
          collectedPaise: grandColl,
          pendingPaise: grandBal,
          realizationRate: grandRate,
        },
        totalRowCount: rows.length,
      };
    }

    // ─── 6. Daily Collection (Day Book) ───
    case 'daily_collection': {
      let activePayments = payments.filter(p => !p.cancelled);
      if (filters.paymentMode && filters.paymentMode !== 'ALL') {
        activePayments = activePayments.filter(p => p.mode === filters.paymentMode);
      }

      let grandTotal = 0;
      const rows = activePayments.map(p => {
        grandTotal += p.amountPaid;
        return {
          txnDate: p.paidOn,
          receiptNo: p.receiptNo,
          studentName: p.studentName,
          className: `${p.className} - ${p.section || 'A'}`,
          paymentMode: p.mode,
          collectedBy: p.collectedBy || 'ACCOUNTS_OFFICE',
          amountPaise: p.amountPaid,
        };
      });

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Receipts Issued', value: rows.length.toString(), color: 'text-emerald-700' },
        { label: 'Total Cash & Bank Inflow', value: formatCurrency(grandTotal), color: 'text-emerald-800' },
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
          amountPaise: grandTotal,
        },
        totalRowCount: rows.length,
      };
    }

    // ─── 7. Receipt Register (with Cancelled) ───
    case 'receipt_register': {
      let grandActive = 0;
      let grandCancelled = 0;

      const rows = payments.map(p => {
        if (p.cancelled) grandCancelled += p.amountPaid;
        else grandActive += p.amountPaid;

        return {
          receiptNo: p.receiptNo,
          paymentDate: p.paidOn,
          studentName: p.studentName,
          admissionNo: p.admissionNo,
          className: `${p.className} - ${p.section || 'A'}`,
          paymentMode: p.mode,
          amountPaise: p.amountPaid,
          status: p.cancelled ? 'CANCELLED' : 'PAID',
          cancelledReason: p.cancelled ? p.cancelledReason || 'Cancelled Voucher' : p.remarks || 'Active Receipt',
        };
      });

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Active Receipts', value: rows.filter(r => r.status === 'PAID').length.toString(), color: 'text-emerald-700' },
        { label: 'Active Inflow', value: formatCurrency(grandActive), color: 'text-emerald-800' },
        { label: 'Cancelled Receipts', value: rows.filter(r => r.status === 'CANCELLED').length.toString(), color: 'text-rose-700' },
        { label: 'Cancelled Value', value: formatCurrency(grandCancelled), color: 'text-rose-800' },
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
          paymentDate: `${rows.length} Receipts`,
          studentName: '',
          admissionNo: '',
          className: '',
          paymentMode: '',
          amountPaise: grandActive,
          status: '',
          cancelledReason: '',
        },
        totalRowCount: rows.length,
      };
    }

    // ─── Fallback / Other Reports: Student Ledger Statement, Exam, Transport, Sibling ───
    default: {
      // Delegate to standard report runner or generic builder
      const rows: Record<string, any>[] = [];
      let grandBilled = 0;
      let grandPaid = 0;
      let grandPending = 0;

      for (const s of filteredStudents) {
        const sDemands = studentDemandMap.get(s.id) || [];
        const sPayments = studentPaymentMap.get(s.id) || [];

        const billed = sDemands.reduce((a, b) => a + b.grossAmount, 0);
        const disc = sDemands.reduce((a, b) => a + b.discountAmount, 0);
        const net = billed - disc;
        const paid = sPayments.reduce((a, b) => a + b.amountPaid, 0);
        const bal = Math.max(0, net - paid);

        grandBilled += net;
        grandPaid += paid;
        grandPending += bal;

        rows.push({
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          classSection: `${s.class_name} - ${s.section || 'A'}`,
          fatherName: s.father_name || 'Parent',
          demandPaise: net,
          discountPaise: disc,
          paidPaise: paid,
          pendingPaise: bal,
          status: bal === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'DUE',
        });
      }

      const summaryKpis: ReportSummaryKpi[] = [
        { label: 'Total Scholars', value: rows.length.toString() },
        { label: 'Net Billed', value: formatCurrency(grandBilled) },
        { label: 'Total Collected', value: formatCurrency(grandPaid), color: 'text-emerald-700' },
        { label: 'Outstanding Dues', value: formatCurrency(grandPending), color: 'text-rose-700' },
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
          demandPaise: grandBilled,
          discountPaise: 0,
          paidPaise: grandPaid,
          pendingPaise: grandPending,
          status: '',
        },
        totalRowCount: rows.length,
      };
    }
  }
}
