/*! EduSuite Fee Master — Monthly Fee Helper (Unified Adapter) v3.0.0 */
/**
 * All fee math is unified in src/lib/fees-engine/.
 * This file serves as a backward-compatible bridge for legacy components.
 */

import { Student, FeeInvoice } from './types';
import {
  getTuitionRateForClass,
  getAnnualFeeForClass,
  getTransportSlabRate,
  getHostelRate,
} from './fees-engine/rates';
import {
  DEFAULT_FEE_CONFIG,
  paiseToRupees,
  rupeesToPaise,
  ACADEMIC_MONTHS,
  MONTH_FULL_NAMES,
  getDefaultDueDate,
} from './fees-engine/constants';

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
  paidAmount: number;
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
  totalPaidToDate: number;
  currentBalanceDue: number;
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
  securityMoney: number;
  withoutAcAnnual: number;
  withoutAcMonthly: number;
  withAcAnnual: number;
  withAcMonthly: number;
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
  { id: '1', className: 'PG, LKG & UKG', monthlyFee: 1000, quarterlyFee: 3000 },
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
  { month: 'April', name: 'April', short: 'Apr', index: 1, key: '04', quarter: 'Q1' as const, cycleName: 'Cycle 1: April + Annual Fee', hasAnnual: true, hasExam: false },
  { month: 'May', name: 'May', short: 'May', index: 2, key: '05', quarter: 'Q1' as const, cycleName: 'Cycle 2: May & June', hasAnnual: false, hasExam: false },
  { month: 'June', name: 'June', short: 'Jun', index: 3, key: '06', quarter: 'Q1' as const, cycleName: 'Cycle 2: May & June', hasAnnual: false, hasExam: false },
  { month: 'July', name: 'July', short: 'Jul', index: 4, key: '07', quarter: 'Q2' as const, cycleName: 'Cycle 3: July', hasAnnual: false, hasExam: true },
  { month: 'August', name: 'August', short: 'Aug', index: 5, key: '08', quarter: 'Q2' as const, cycleName: 'Cycle 4: August', hasAnnual: false, hasExam: false },
  { month: 'September', name: 'September', short: 'Sep', index: 6, key: '09', quarter: 'Q2' as const, cycleName: 'Cycle 5: September & February', hasAnnual: false, hasExam: true },
  { month: 'October', name: 'October', short: 'Oct', index: 7, key: '10', quarter: 'Q3' as const, cycleName: 'Cycle 6: October', hasAnnual: false, hasExam: false },
  { month: 'November', name: 'November', short: 'Nov', index: 8, key: '11', quarter: 'Q3' as const, cycleName: 'Cycle 7: November', hasAnnual: false, hasExam: false },
  { month: 'December', name: 'December', short: 'Dec', index: 9, key: '12', quarter: 'Q3' as const, cycleName: 'Cycle 8: December & March', hasAnnual: false, hasExam: true },
  { month: 'January', name: 'January', short: 'Jan', index: 10, key: '01', quarter: 'Q4' as const, cycleName: 'Cycle 9: January', hasAnnual: false, hasExam: false },
  { month: 'February', name: 'February', short: 'Feb', index: 11, key: '02', quarter: 'Q4' as const, cycleName: 'Cycle 5: September & February', hasAnnual: false, hasExam: false },
  { month: 'March', name: 'March', short: 'Mar', index: 12, key: '03', quarter: 'Q4' as const, cycleName: 'Cycle 8: December & March', hasAnnual: false, hasExam: true },
];

export function getStandardTuitionRate(className: string): number {
  return paiseToRupees(getTuitionRateForClass(DEFAULT_FEE_CONFIG as any, className));
}

export function getStandardAnnualFeeRate(className: string): number {
  return paiseToRupees(getAnnualFeeForClass(DEFAULT_FEE_CONFIG as any, className));
}

export function getStandardTransportRate(slabOrKmOrStudent: any): number {
  if (slabOrKmOrStudent && typeof slabOrKmOrStudent === 'object') {
    if ((slabOrKmOrStudent.transport_opted || '').toUpperCase() !== 'YES') return 0;
    return paiseToRupees(getTransportSlabRate(DEFAULT_FEE_CONFIG as any, slabOrKmOrStudent.transport_slab_id || '1'));
  }
  return paiseToRupees(getTransportSlabRate(DEFAULT_FEE_CONFIG as any, slabOrKmOrStudent));
}

export function getStandardHostelRate(roomType: 'WITH_AC' | 'WITHOUT_AC' = 'WITHOUT_AC'): {
  monthly: number;
  security: number;
} {
  const r = getHostelRate(DEFAULT_FEE_CONFIG as any, roomType);
  return {
    monthly: paiseToRupees(r.monthly),
    security: paiseToRupees(r.security),
  };
}

export function matchInvoicesForStudent(firstArg: any, secondArg: any): FeeInvoice[] {
  let invoices: FeeInvoice[] = [];
  let student: Student | null = null;
  if (Array.isArray(firstArg)) {
    invoices = firstArg;
    student = secondArg;
  } else if (Array.isArray(secondArg)) {
    invoices = secondArg;
    student = firstArg;
  }
  if (!invoices || !student) return [];
  return invoices.filter(inv =>
    (inv.student_id && inv.student_id === student!.id) ||
    (inv.admission_no && student!.admission_no && inv.admission_no.toLowerCase() === student!.admission_no.toLowerCase())
  );
}

export function getStudentMonthlyFeeSchedule(
  firstArg: any,
  secondArg: any = [],
  sessionYear: number = 2026
): StudentMonthlyFeeSchedule {
  let student: Student;
  let invoices: FeeInvoice[] = [];

  if (firstArg && typeof firstArg === 'object' && ('admission_no' in firstArg || 'class_name' in firstArg || 'id' in firstArg)) {
    student = firstArg;
    invoices = Array.isArray(secondArg) ? secondArg : [];
  } else if (Array.isArray(firstArg)) {
    invoices = firstArg;
    student = secondArg || { id: 'unknown', class_name: 'I', admission_no: '' };
  } else {
    student = { id: 'unknown', class_name: 'I', admission_no: '' } as Student;
    invoices = [];
  }

  const studentInvoices = matchInvoicesForStudent(invoices, student);
  const tuitionMonthly = getStandardTuitionRate(student.class_name || 'I');
  const annualFee = getStandardAnnualFeeRate(student.class_name || 'I');
  const transportMonthly = (student.transport_opted || '').toUpperCase() === 'YES'
    ? getStandardTransportRate(student.transport_slab_id || '1')
    : 0;

  const isRte = student.is_rte === 'YES';
  const isStaffWard = student.concession_category === 'STAFF_WARD';

  let totalBilledSum = 0;
  let totalPaidSum = 0;

  const months: MonthlyFeeItem[] = CBSE_ACADEMIC_MONTHS.map(m => {
    const inv = studentInvoices.find(i => {
      const invMonth = (i.month || '').toLowerCase();
      return invMonth.includes(m.short.toLowerCase()) || invMonth.includes(m.month.toLowerCase());
    });

    const isApril = m.index === 1;
    const billedTuition = isRte ? 0 : tuitionMonthly;
    const billedAnnual = isApril && !isRte ? annualFee : 0;
    const billedTransport = transportMonthly;
    const billedExam = m.short === 'Jul' ? 500 : (m.short === 'Sep' || m.short === 'Feb' ? 1000 : 0);
    const concession = isStaffWard ? tuitionMonthly : 0;

    const billed = Math.max(0, billedTuition + billedAnnual + billedTransport + billedExam - concession);
    const paid = inv ? (Number(inv.paid_amount) || (inv.status === 'PAID' ? billed : 0)) : 0;
    const balance = Math.max(0, billed - paid);

    let status: MonthlyFeeItem['status'] = 'UPCOMING';
    if (billed === 0 && paid === 0) {
      status = 'UPCOMING';
    } else if (balance === 0 && (billed > 0 || paid > 0)) {
      status = 'PAID';
    } else if (paid > 0 && balance > 0) {
      status = 'PARTIAL';
    } else if (m.index <= 6) {
      status = 'OVERDUE';
    } else {
      status = 'PENDING';
    }

    totalBilledSum += billed;
    totalPaidSum += paid;

    return {
      id: `${student.id}-${m.short}`,
      month: `${m.month} ${sessionYear}`,
      monthShort: m.short,
      monthIndex: m.index,
      quarter: m.quarter,
      cycleName: m.cycleName,
      invoiceNo: inv?.invoice_no || `INV-${student.admission_no || 'SCH'}-${m.short}`,
      dueDate: getDefaultDueDate(m.short.toUpperCase() as any, sessionYear),
      paidDate: (inv as any)?.paid_date || (inv as any)?.paid_at || (inv as any)?.payment_date,
      paymentMode: inv?.payment_mode,
      tuitionFee: billedTuition,
      annualFee: billedAnnual,
      transportFee: billedTransport,
      examFee: billedExam,
      activityFee: 0,
      concessionAmount: concession,
      totalBilled: billed,
      paidAmount: paid,
      balanceDue: balance,
      status,
      isOverdue: status === 'OVERDUE',
    };
  });

  const studentName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.admission_no || 'Student';

  return {
    studentId: student.id,
    studentName,
    admissionNo: student.admission_no || '',
    className: student.class_name || '',
    section: student.section || 'A',
    totalAnnualBilled: totalBilledSum,
    totalPaidToDate: totalPaidSum,
    currentBalanceDue: Math.max(0, totalBilledSum - totalPaidSum),
    months,
  };
}

export function getStudentFeeSummary(
  firstArg: any,
  secondArg: any = []
): {
  totalBilled: number;
  totalAnnualDemand: number;
  totalPaid: number;
  totalPaidToDate: number;
  totalConcessions: number;
  balanceDue: number;
  currentBalanceDue: number;
  matchingInvoices: FeeInvoice[];
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
  feeStatus: string;
  monthsPaidCount: number;
  monthsPendingCount: number;
  nextDueDate: string;
} {
  let student: Student;
  let invoices: FeeInvoice[] = [];

  if (firstArg && typeof firstArg === 'object' && ('admission_no' in firstArg || 'class_name' in firstArg || 'id' in firstArg)) {
    student = firstArg;
    invoices = Array.isArray(secondArg) ? secondArg : [];
  } else if (Array.isArray(firstArg)) {
    invoices = firstArg;
    student = secondArg || { id: 'unknown', class_name: 'I', admission_no: '' };
  } else {
    student = { id: 'unknown', class_name: 'I', admission_no: '' } as Student;
    invoices = [];
  }

  const studentInvoices = matchInvoicesForStudent(invoices, student);
  const schedule = getStudentMonthlyFeeSchedule(student, invoices);
  const paidMonths = schedule.months.filter(m => m.status === 'PAID');
  const pendingMonths = schedule.months.filter(m => m.status === 'OVERDUE' || m.status === 'PARTIAL' || m.status === 'PENDING');
  const nextPending = pendingMonths[0];

  let overallStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING' = 'UPCOMING';
  if (schedule.currentBalanceDue === 0 && schedule.totalPaidToDate > 0) {
    overallStatus = 'PAID';
  } else if (schedule.totalPaidToDate > 0 && schedule.currentBalanceDue > 0) {
    overallStatus = schedule.months.some(m => m.status === 'OVERDUE') ? 'OVERDUE' : 'PARTIAL';
  } else if (schedule.months.some(m => m.status === 'OVERDUE')) {
    overallStatus = 'OVERDUE';
  } else if (schedule.currentBalanceDue > 0) {
    overallStatus = 'PENDING';
  }

  return {
    totalBilled: schedule.totalAnnualBilled,
    totalAnnualDemand: schedule.totalAnnualBilled,
    totalPaid: schedule.totalPaidToDate,
    totalPaidToDate: schedule.totalPaidToDate,
    totalConcessions: schedule.months.reduce((acc, m) => acc + m.concessionAmount, 0),
    balanceDue: schedule.currentBalanceDue,
    currentBalanceDue: schedule.currentBalanceDue,
    matchingInvoices: studentInvoices,
    status: overallStatus,
    feeStatus: overallStatus,
    monthsPaidCount: paidMonths.length,
    monthsPendingCount: pendingMonths.length,
    nextDueDate: nextPending?.dueDate || '2026-10-15',
  };
}

export const calculateStudentFeeSummary = getStudentFeeSummary;

export function getSchoolFeeOverview(firstArg: any = [], secondArg: any = []) {
  let students: Student[] = [];
  let invoices: FeeInvoice[] = [];

  if (Array.isArray(firstArg)) {
    if (firstArg.length > 0 && ('first_name' in firstArg[0] || 'admission_no' in firstArg[0])) {
      students = firstArg;
      invoices = Array.isArray(secondArg) ? secondArg : [];
    } else {
      invoices = firstArg;
      students = Array.isArray(secondArg) ? secondArg : [];
    }
  }

  let totalBilled = 0;
  let totalPaid = 0;
  let fullyPaidStudents = 0;
  let partialStudents = 0;
  let zeroPaidStudents = 0;

  if (students.length > 0) {
    for (const s of students) {
      if (s.status !== 'ACTIVE') continue;
      const sum = getStudentFeeSummary(s, invoices);
      totalBilled += sum.totalBilled;
      totalPaid += sum.totalPaid;
      if (sum.status === 'PAID') fullyPaidStudents++;
      else if (sum.totalPaid > 0) partialStudents++;
      else zeroPaidStudents++;
    }
  } else if (invoices.length > 0) {
    for (const inv of invoices) {
      const b = Number((inv as any).total_amount) || Number(inv.amount) || 0;
      const p = Number(inv.paid_amount) || (inv.status === 'PAID' ? b : 0);
      totalBilled += b;
      totalPaid += p;
      if (inv.status === 'PAID') fullyPaidStudents++;
      else if (p > 0) partialStudents++;
      else zeroPaidStudents++;
    }
  }

  const pendingDues = Math.max(0, totalBilled - totalPaid);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  return {
    totalBilled,
    totalCollected: totalPaid,
    totalRevenue: totalPaid,
    pendingDues,
    pendingFeeAmount: pendingDues,
    collectionRate,
    feeCollectionRate: collectionRate,
    fullyPaidStudents,
    partialStudents,
    zeroPaidStudents,
  };
}
