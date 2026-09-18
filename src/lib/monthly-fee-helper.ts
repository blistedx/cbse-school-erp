/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { Student, FeeInvoice } from './types';

export interface MonthlyFeeItem {
  id: string;
  month: string;              // e.g. "April 2026", "May 2026"
  monthShort: string;         // e.g. "Apr", "May"
  monthIndex: number;         // 1 to 12 (1 = April, 12 = March)
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  cycleName: string;          // e.g. "Cycle 1: April + Annual Term Fee"
  invoiceNo: string;
  dueDate: string;
  paidDate?: string;
  paymentMode?: string;
  tuitionFee: number;
  annualFee: number;
  transportFee: number;
  examFee: number;
  activityFee: number;
  concessionAmount: number;
  totalBilled: number;
  paidAmount: number;         // "jama ki"
  balanceDue: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
  isOverdue?: boolean;
}

export interface StudentMonthlyFeeSchedule {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  totalAnnualBilled: number;
  totalPaidToDate: number;    // "kul jama"
  currentBalanceDue: number;  // "kul baki"
  months: MonthlyFeeItem[];
}

export interface OneTimeFeeHead {
  id: string;
  particulars: string;
  amount: number;
}

export interface TuitionFeeHead {
  id: string;
  className: string;
  monthlyFee: number;
  quarterlyFee: number;
}

export interface TransportFeeHead {
  id: string;
  slab: string;
  monthlyFee: number;
}

export interface HostelFeeStructure {
  securityMoney: number; // ₹10,000 (Refundable)
  withoutAcAnnual: number; // ₹72,000 (₹6,000/mo)
  withoutAcMonthly: number; // ₹6,000
  withAcAnnual: number; // ₹94,000 (~₹7,833/mo)
  withAcMonthly: number; // ₹7,833
}

export const DEFAULT_HOSTEL_FEES: HostelFeeStructure = {
  securityMoney: 10000,
  withoutAcAnnual: 72000,
  withoutAcMonthly: 6000,
  withAcAnnual: 94000,
  withAcMonthly: 7833,
};

export const DEFAULT_ONE_TIME_FEES: OneTimeFeeHead[] = [
  { id: '1', particulars: 'Prospectus + Registration Fees', amount: 1000 },
  { id: '2', particulars: 'Admission Fee (Non-Refundable)', amount: 5000 },
  { id: '3', particulars: 'Annual Fee (PG to VIII)', amount: 5000 },
  { id: '4', particulars: 'Annual Fee (IX to XII)', amount: 6000 },
  { id: '5', particulars: 'Hostel Security Money (Refundable)', amount: 10000 },
  { id: '6', particulars: 'Transfer Certificate / Character Certificate', amount: 1000 },
];

export const DEFAULT_TUITION_FEES: TuitionFeeHead[] = [
  { id: '1', className: 'PG, LKG & UKG', monthlyFee: 1200, quarterlyFee: 3600 },
  { id: '2', className: 'Class I & II', monthlyFee: 1400, quarterlyFee: 4200 },
  { id: '3', className: 'Class III to V', monthlyFee: 1600, quarterlyFee: 4800 },
  { id: '4', className: 'Class VI to VIII', monthlyFee: 1800, quarterlyFee: 5400 },
  { id: '5', className: 'Class IX & X', monthlyFee: 2000, quarterlyFee: 6000 },
  { id: '6', className: 'Class XI & XII', monthlyFee: 2400, quarterlyFee: 7200 },
];

export const DEFAULT_TRANSPORT_FEES: TransportFeeHead[] = [
  { id: '1', slab: '1 to 3 km', monthlyFee: 800 },
  { id: '2', slab: '4 to 6 km', monthlyFee: 900 },
  { id: '3', slab: '7 to 12 km', monthlyFee: 1100 },
  { id: '4', slab: '13 to 16 km', monthlyFee: 1300 },
  { id: '5', slab: '16 to 20 km', monthlyFee: 1800 },
];

export const CBSE_ACADEMIC_MONTHS = [
  { name: 'April 2026', short: 'Apr', index: 1, quarter: 'Q1' as const, cycleName: 'Cycle 1: April + Annual Term Fee', hasAnnual: true, hasExam: false, defaultDueDate: '2026-04-15' },
  { name: 'May 2026', short: 'May', index: 2, quarter: 'Q1' as const, cycleName: 'Cycle 2: May Tuition & Transport', hasAnnual: false, hasExam: false, defaultDueDate: '2026-05-15' },
  { name: 'June 2026', short: 'Jun', index: 3, quarter: 'Q1' as const, cycleName: 'Cycle 3: June Tuition & Summer Lab', hasAnnual: false, hasExam: false, defaultDueDate: '2026-06-15' },
  { name: 'July 2026', short: 'Jul', index: 4, quarter: 'Q2' as const, cycleName: 'Cycle 4: July Tuition & Transport', hasAnnual: false, hasExam: false, defaultDueDate: '2026-07-15' },
  { name: 'August 2026', short: 'Aug', index: 5, quarter: 'Q2' as const, cycleName: 'Cycle 5: August Tuition & Sports Term', hasAnnual: false, hasExam: false, defaultDueDate: '2026-08-15' },
  { name: 'September 2026', short: 'Sep', index: 6, quarter: 'Q2' as const, cycleName: 'Cycle 6: September Half-Yearly Exam Fee', hasAnnual: false, hasExam: true, defaultDueDate: '2026-09-15' },
  { name: 'October 2026', short: 'Oct', index: 7, quarter: 'Q3' as const, cycleName: 'Cycle 7: October Tuition & Transport', hasAnnual: false, hasExam: false, defaultDueDate: '2026-10-15' },
  { name: 'November 2026', short: 'Nov', index: 8, quarter: 'Q3' as const, cycleName: 'Cycle 8: November Tuition & Lab Term', hasAnnual: false, hasExam: false, defaultDueDate: '2026-11-15' },
  { name: 'December 2026', short: 'Dec', index: 9, quarter: 'Q3' as const, cycleName: 'Cycle 9: December Winter Session Fee', hasAnnual: false, hasExam: false, defaultDueDate: '2026-12-15' },
  { name: 'January 2027', short: 'Jan', index: 10, quarter: 'Q4' as const, cycleName: 'Cycle 10: January Pre-Board / New Year', hasAnnual: false, hasExam: false, defaultDueDate: '2027-01-15' },
  { name: 'February 2027', short: 'Feb', index: 11, quarter: 'Q4' as const, cycleName: 'Cycle 11: February CBSE Final Exam Fee', hasAnnual: false, hasExam: true, defaultDueDate: '2027-02-15' },
  { name: 'March 2027', short: 'Mar', index: 12, quarter: 'Q4' as const, cycleName: 'Cycle 12: March Final Session Clearance', hasAnnual: false, hasExam: false, defaultDueDate: '2027-03-15' },
];

/**
 * Standard class base fee rates (monthly tuition)
 */
export function getStandardTuitionRate(className: string): number {
  const norm = (className || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('pg') || norm.includes('play') || norm.includes('nursery') || norm.includes('lkg') || norm.includes('ukg')) return 1200;
  if (norm.includes('1') || norm.includes('2') || norm.includes('i') || norm.includes('ii')) return 1400;
  if (norm.includes('3') || norm.includes('4') || norm.includes('5') || norm.includes('iii') || norm.includes('iv') || norm.includes('v')) return 1600;
  if (norm.includes('6') || norm.includes('7') || norm.includes('8') || norm.includes('vi') || norm.includes('vii') || norm.includes('viii')) return 1800;
  if (norm.includes('9') || norm.includes('10') || norm.includes('ix') || norm.includes('x')) return 2000;
  if (norm.includes('11') || norm.includes('12') || norm.includes('xi') || norm.includes('xii')) return 2400;
  return 1500;
}

/**
 * Standard annual fee rate
 */
export function getStandardAnnualFeeRate(className: string): number {
  const norm = (className || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('9') || norm.includes('10') || norm.includes('11') || norm.includes('12') || norm.includes('ix') || norm.includes('x') || norm.includes('xi') || norm.includes('xii')) {
    return 6000;
  }
  return 5000;
}

/**
 * Standard transport fee rate
 */
export function getStandardTransportRate(student: Student): number {
  if ((student.transport_opted || '').toUpperCase() !== 'YES') return 0;
  if (student.transport_slab_id) {
    const slabRates: Record<string, number> = {
      '1': 800,
      '2': 900,
      '3': 1100,
      '4': 1300,
      '5': 1800
    };
    if (slabRates[String(student.transport_slab_id)]) {
      return slabRates[String(student.transport_slab_id)];
    }
  }
  return 800;
}

/**
 * Strict exact matching of invoices to a student.
 * Eliminates substring matching leaks (e.g. '1' matching '10', '101').
 */
export function matchInvoicesForStudent(student: Student, existingInvoices: FeeInvoice[] = []): FeeInvoice[] {
  if (!student || !Array.isArray(existingInvoices)) return [];
  const studentAdmNo = (student.admission_no || '').toLowerCase().trim();
  const studentId = (student.id || '').toLowerCase().trim();
  const studentName = (student.full_name || '').toLowerCase().trim();

  return existingInvoices.filter(inv => {
    if (!inv) return false;
    const invAdm = (inv.admission_no || '').toLowerCase().trim();
    const invId = (inv.student_id || '').toLowerCase().trim();
    const invName = (inv.student_name || '').toLowerCase().trim();

    // 1. Direct Student ID Match (Highest Priority)
    if (studentId && invId && studentId === invId) {
      return true;
    }

    // 2. Strict Exact Admission Number Match
    if (studentAdmNo && invAdm && studentAdmNo === invAdm) {
      return true;
    }

    // 3. Fallback: Exact Student Name Match ONLY if ID and Admission No are missing on the invoice
    if (!invId && !invAdm && studentName && invName && studentName === invName) {
      return true;
    }

    return false;
  });
}

export interface StudentFeeSummary {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  totalAnnualDemand: number;
  totalPaidToDate: number;
  totalConcessions: number;
  currentBalanceDue: number;
  totalPendingAnnual: number;
  feeStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'WAIVED';
  matchingInvoices: FeeInvoice[];
}

/**
 * Single source of truth calculation for any student's complete fee status,
 * paid amount, and outstanding dues balance across the entire ERP.
 */
export function getStudentFeeSummary(
  student: Student,
  existingInvoices: FeeInvoice[] = [],
  options: {
    baseTuition?: number;
    annualFee?: number;
    transportFee?: number;
    currentDate?: string;
  } = {}
): StudentFeeSummary {
  const schedule = getStudentMonthlyFeeSchedule(student, existingInvoices, options);
  const matchingInvoices = matchInvoicesForStudent(student, existingInvoices);

  let totalPaidFromInvoices = 0;
  let totalConcessionsFromInvoices = 0;
  let hasOverdueInvoice = false;

  matchingInvoices.forEach(inv => {
    const invAmt = Number(inv.amount) || 0;
    const invPaid = typeof inv.paid_amount === 'number'
      ? inv.paid_amount
      : (inv.status === 'PAID' ? invAmt : 0);
    totalPaidFromInvoices += invPaid;
    totalConcessionsFromInvoices += (Number(inv.concession_amount) || 0);
    if (inv.status === 'OVERDUE') hasOverdueInvoice = true;
  });

  const totalPaidToDate = totalPaidFromInvoices;
  const totalConcessions = totalConcessionsFromInvoices;
  const currentBalanceDue = schedule.currentBalanceDue;
  const totalPendingAnnual = Math.max(0, schedule.totalAnnualBilled - (totalPaidToDate + totalConcessions));

  let feeStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'WAIVED' = 'PENDING';
  if (totalConcessions >= schedule.totalAnnualBilled && schedule.totalAnnualBilled > 0) {
    feeStatus = 'WAIVED';
  } else if (totalPendingAnnual === 0 && totalPaidToDate > 0) {
    feeStatus = 'PAID';
  } else if (totalPaidToDate > 0) {
    feeStatus = 'PARTIAL';
  } else if (hasOverdueInvoice) {
    feeStatus = 'OVERDUE';
  } else {
    feeStatus = 'PENDING';
  }

  return {
    studentId: student.id,
    admissionNo: student.admission_no || '',
    studentName: student.full_name,
    className: student.class_name,
    section: student.section || 'A',
    totalAnnualDemand: schedule.totalAnnualBilled,
    totalPaidToDate,
    totalConcessions,
    currentBalanceDue,
    totalPendingAnnual,
    feeStatus,
    matchingInvoices
  };
}

/**
 * Computes or resolves a student's full 12-month CBSE academic fee schedule.
 * Implements strict FIFO water-flow ledger accounting so that monthly paid amounts
 * never exceed the monthly demand, and total paid strictly balances with actual receipts.
 */
export function getStudentMonthlyFeeSchedule(
  student: Student,
  existingInvoices: FeeInvoice[] = [],
  options: {
    baseTuition?: number;
    annualFee?: number;
    transportFee?: number;
    currentDate?: string;
  } = {}
): StudentMonthlyFeeSchedule {
  const studentAdmNo = (student.admission_no || '').toLowerCase().trim();

  // Strict exact matching
  const studentInvoices = matchInvoicesForStudent(student, existingInvoices);

  const baseTuition = options.baseTuition ?? getStandardTuitionRate(student.class_name);
  const annualFeeDefault = options.annualFee ?? getStandardAnnualFeeRate(student.class_name);
  const transportRate = options.transportFee ?? getStandardTransportRate(student);
  const admDigits = (student.admission_no || '').replace(/[^0-9]/g, '').slice(-4) || '0128';

  // 1. Build initial demands for each of the 12 months
  const rawMonths = CBSE_ACADEMIC_MONTHS.map(mConfig => {
    const tuitionFee = baseTuition;
    const annualFee = mConfig.hasAnnual ? annualFeeDefault : 0;
    const transportFee = transportRate;
    const examFee = mConfig.hasExam ? 1000 : 0;
    const totalBilled = tuitionFee + annualFee + transportFee + examFee;

    // Single-month invoice lookup (if any invoice specifically matches this month only)
    const matchedInvoice = studentInvoices.find(inv => {
      const invMonth = (inv.month || '').toLowerCase().trim();
      const targetMonthName = mConfig.name.toLowerCase().trim();
      const targetShort = mConfig.short.toLowerCase().trim();
      return invMonth === targetShort || invMonth === targetMonthName || (invMonth.includes(targetShort) && !invMonth.includes('-'));
    });

    const concessionAmount = matchedInvoice ? (Number(matchedInvoice.concession_amount) || 0) : 0;

    return {
      mConfig,
      tuitionFee,
      annualFee,
      transportFee,
      examFee,
      concessionAmount,
      totalBilled,
      matchedInvoice
    };
  });

  const totalAnnualBilled = rawMonths.reduce((acc, m) => acc + m.totalBilled, 0);

  // 2. Calculate actual total paid money deposited by this student
  let totalCollectedMoney = 0;
  let totalConcessionsMoney = 0;
  const hasExplicitInvoices = studentInvoices.length > 0;

  studentInvoices.forEach(inv => {
    const invAmount = Number(inv.amount) || 0;
    const invPaid = typeof inv.paid_amount === 'number' ? inv.paid_amount : (inv.status === 'PAID' ? invAmount : 0);
    totalCollectedMoney += invPaid;
    totalConcessionsMoney += (Number(inv.concession_amount) || 0);
  });

  // Strict Single Source of Truth: available payment pool derived strictly from real invoice records
  let availablePaymentPool = totalCollectedMoney;
  let availableConcessionPool = totalConcessionsMoney;

  // 3. Distribute available payment pool strictly using FIFO (Water-flow) Allocation
  let unallocatedPaid = availablePaymentPool;
  let unallocatedConcession = availableConcessionPool;

  const monthlyItems: MonthlyFeeItem[] = rawMonths.map(({ mConfig, tuitionFee, annualFee, transportFee, examFee, totalBilled, matchedInvoice }) => {
    let monthConcession = 0;
    if (unallocatedConcession >= totalBilled) {
      monthConcession = totalBilled;
      unallocatedConcession -= totalBilled;
    } else if (unallocatedConcession > 0) {
      monthConcession = unallocatedConcession;
      unallocatedConcession = 0;
    }

    const netMonthDemand = Math.max(0, totalBilled - monthConcession);

    let paidAmount = 0;
    if (unallocatedPaid >= netMonthDemand) {
      paidAmount = netMonthDemand;
      unallocatedPaid -= netMonthDemand;
    } else if (unallocatedPaid > 0) {
      paidAmount = unallocatedPaid;
      unallocatedPaid = 0;
    } else {
      paidAmount = 0;
    }

    const balanceDue = Math.max(0, netMonthDemand - paidAmount);
    const isPastOrCurrent = mConfig.index <= 6; // April to September 2026

    let status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
    if (balanceDue === 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    } else if (matchedInvoice?.status === 'OVERDUE') {
      status = 'OVERDUE';
    } else if (isPastOrCurrent || matchedInvoice?.status === 'PENDING') {
      status = 'PENDING';
    } else {
      status = 'UPCOMING';
    }

    const invoiceNo = matchedInvoice?.invoice_no ||
      (matchedInvoice as any)?.receipt_no ||
      `DPS-INV-${admDigits}-${mConfig.short.toUpperCase()}`;

    return {
      id: `MTH-${studentAdmNo || 'DPS'}-${mConfig.short}-${mConfig.index}`,
      month: mConfig.name,
      monthShort: mConfig.short,
      monthIndex: mConfig.index,
      quarter: mConfig.quarter,
      cycleName: mConfig.cycleName,
      invoiceNo,
      dueDate: matchedInvoice?.due_date || mConfig.defaultDueDate,
      paidDate: paidAmount > 0 ? (matchedInvoice?.paid_date || `2026-0${Math.min(mConfig.index + 3, 12)}-10`) : undefined,
      paymentMode: matchedInvoice?.payment_mode || (paidAmount > 0 ? 'UPI / NetBanking' : undefined),
      tuitionFee,
      annualFee,
      transportFee,
      examFee,
      activityFee: 0,
      concessionAmount: monthConcession,
      totalBilled,
      paidAmount,
      balanceDue,
      status
    };
  });

  const totalPaidToDate = monthlyItems.reduce((acc, item) => acc + item.paidAmount, 0);
  const currentBalanceDue = monthlyItems.reduce((acc, item) => acc + (item.monthIndex <= 6 ? item.balanceDue : 0), 0);

  return {
    studentId: student.id,
    studentName: student.full_name,
    admissionNo: student.admission_no || '',
    className: student.class_name,
    section: student.section || 'A',
    totalAnnualBilled,
    totalPaidToDate,
    currentBalanceDue,
    months: monthlyItems
  };
}

export interface SchoolFeeOverviewMetrics {
  totalBilled: number;
  totalRevenue: number;
  pendingFeeAmount: number;
  totalConcessions: number;
  feeCollectionRate: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
}

/**
 * Universal single-source-of-truth aggregator for school-wide fee metrics across all screens.
 * Accurately accounts for partial payments, waivers, and net remaining balances.
 */
export function getSchoolFeeOverview(invoices: FeeInvoice[] = []): SchoolFeeOverviewMetrics {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return {
      totalBilled: 0,
      totalRevenue: 0,
      pendingFeeAmount: 0,
      totalConcessions: 0,
      feeCollectionRate: 0,
      paidInvoicesCount: 0,
      pendingInvoicesCount: 0
    };
  }

  let totalBilled = 0;
  let totalRevenue = 0;
  let pendingFeeAmount = 0;
  let totalConcessions = 0;
  let paidInvoicesCount = 0;
  let pendingInvoicesCount = 0;

  invoices.forEach(inv => {
    if (!inv) return;
    const billed = Number(inv.amount) || 0;
    const paid = typeof inv.paid_amount === 'number'
      ? inv.paid_amount
      : (inv.status === 'PAID' ? billed : 0);
    const concession = Number(inv.concession_amount) || 0;
    const balance = Math.max(0, billed - (paid + concession));

    totalBilled += billed;
    totalRevenue += paid;
    totalConcessions += concession;
    pendingFeeAmount += balance;

    if (balance === 0 && (paid > 0 || concession > 0)) {
      paidInvoicesCount++;
    } else {
      pendingInvoicesCount++;
    }
  });

  const feeCollectionRate = totalBilled > 0
    ? Math.min(100, Math.round(((totalRevenue + totalConcessions) / totalBilled) * 100))
    : 0;

  return {
    totalBilled,
    totalRevenue,
    pendingFeeAmount,
    totalConcessions,
    feeCollectionRate,
    paidInvoicesCount,
    pendingInvoicesCount
  };
}

