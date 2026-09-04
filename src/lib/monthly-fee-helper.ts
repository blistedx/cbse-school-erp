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

export const CBSE_ACADEMIC_MONTHS = [
  { name: 'April 2026', short: 'Apr', index: 1, quarter: 'Q1' as const, cycleName: 'Cycle 1: April + Annual Term Fee', hasAnnual: true, hasExam: false, defaultDueDate: '2026-04-15' },
  { name: 'May 2026', short: 'May', index: 2, quarter: 'Q1' as const, cycleName: 'Cycle 2: May Tuition & Transport', hasAnnual: false, hasExam: false, defaultDueDate: '2026-05-15' },
  { name: 'June 2026', short: 'Jun', index: 3, quarter: 'Q1' as const, cycleName: 'Cycle 3: June Tuition & Summer Lab', hasAnnual: false, hasExam: false, defaultDueDate: '2026-06-15' },
  { name: 'July 2026', short: 'Jul', index: 4, quarter: 'Q2' as const, cycleName: 'Cycle 4: July Tuition & Transport', hasAnnual: false, hasExam: false, defaultDueDate: '2026-07-15' },
  { name: 'August 2026', short: 'Aug', index: 5, quarter: 'Q2' as const, cycleName: 'Cycle 5: August Tuition & Independence Sports', hasAnnual: false, hasExam: false, defaultDueDate: '2026-08-15' },
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
 * Computes or resolves a student's full 12-month CBSE academic fee schedule
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
  const studentId = (student.id || '').toLowerCase().trim();
  const studentName = (student.full_name || '').toLowerCase().trim();

  // Find all invoices matching this student
  const studentInvoices = existingInvoices.filter(inv => {
    const invAdm = (inv.admission_no || '').toLowerCase().trim();
    const invId = (inv.student_id || '').toLowerCase().trim();
    const invName = (inv.student_name || '').toLowerCase().trim();
    return (
      (studentAdmNo && invAdm && studentAdmNo === invAdm) ||
      (studentId && invId && studentId === invId) ||
      (studentName && invName && studentName === invName)
    );
  });

  const baseTuition = options.baseTuition ?? getStandardTuitionRate(student.class_name);
  const annualFeeDefault = options.annualFee ?? getStandardAnnualFeeRate(student.class_name);
  const transportRate = options.transportFee ?? getStandardTransportRate(student);

  // Overall student status flag
  const isFullyPaidStudent = student.fee_status === 'PAID';
  const admDigits = (student.admission_no || '').replace(/[^0-9]/g, '').slice(-4) || '0128';

  // Compute total actual money collected / deposited for this student across all invoices
  let totalStudentPaid = 0;
  studentInvoices.forEach(inv => {
    const invAmount = Number(inv.amount) || 0;
    if (inv.status === 'PAID') {
      totalStudentPaid += (typeof inv.paid_amount === 'number' ? inv.paid_amount : invAmount);
    } else if (typeof inv.paid_amount === 'number' && inv.paid_amount > 0) {
      totalStudentPaid += inv.paid_amount;
    }
  });

  // Chronological allocation of payments across the 12 months
  let unallocatedPaid = totalStudentPaid;

  const monthlyItems: MonthlyFeeItem[] = CBSE_ACADEMIC_MONTHS.map((mConfig) => {
    // Check if there is an exact matching single-month invoice
    const matchedInvoice = studentInvoices.find(inv => {
      const invMonth = (inv.month || '').toLowerCase();
      const targetMonthName = mConfig.name.toLowerCase();
      const targetShort = mConfig.short.toLowerCase();
      return invMonth === targetShort || invMonth === targetMonthName || invMonth.includes(targetShort);
    });

    const tuitionFee = baseTuition;
    const annualFee = mConfig.hasAnnual ? annualFeeDefault : 0;
    const transportFee = transportRate; // Uniform monthly transport fee for every month
    const examFee = mConfig.hasExam ? 1000 : 0;
    const totalBilled = tuitionFee + annualFee + transportFee + examFee;

    let paidAmount = 0;
    if (isFullyPaidStudent) {
      paidAmount = totalBilled;
    } else if (unallocatedPaid >= totalBilled) {
      paidAmount = totalBilled;
      unallocatedPaid -= totalBilled;
    } else if (unallocatedPaid > 0) {
      paidAmount = unallocatedPaid;
      unallocatedPaid = 0;
    } else {
      paidAmount = 0;
    }

    const balanceDue = Math.max(0, totalBilled - paidAmount);
    const isPastOrCurrent = mConfig.index <= 6; // April to September 2026

    let status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
    if (balanceDue === 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    } else if (isPastOrCurrent) {
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
      concessionAmount: 0,
      totalBilled,
      paidAmount,
      balanceDue,
      status
    };
  });

  const totalAnnualBilled = monthlyItems.reduce((acc, item) => acc + item.totalBilled, 0);
  const totalPaidToDate = isFullyPaidStudent ? totalAnnualBilled : monthlyItems.reduce((acc, item) => acc + item.paidAmount, 0);
  const currentBalanceDue = Math.max(0, totalAnnualBilled - totalPaidToDate);

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
