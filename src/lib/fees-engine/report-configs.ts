/*! EduSuite Fee Master — Report Configurations & Types v3.0.0 */

import type { FeeAggregateFilters } from './types';

export interface ReportColumnDef {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'text' | 'date' | 'chip' | 'phone' | 'number';
  pinned?: boolean;
}

export interface ReportSummaryKpi {
  label: string;
  value: string;
  subtext?: string;
  badge?: string;
  color?: string;
}

export interface ReportConfig {
  id: string;
  name: string;
  group: 'COLLECTION' | 'PENDING_DEFAULTERS' | 'HEAD_WISE' | 'DISCOUNTS' | 'SUMMARIES';
  groupLabel: string;
  description: string;
  columns: ReportColumnDef[];
  supportedFilters: ('session' | 'month' | 'class' | 'section' | 'transport' | 'sibling' | 'payment_mode' | 'search')[];
  defaultFilters?: Partial<FeeAggregateFilters>;
  exportFilenamePrefix: string;
}

export interface ReportQueryResult {
  reportId: string;
  reportName: string;
  generatedAt: string;
  session: string;
  filtersUsed: Record<string, any>;
  summaryKpis: ReportSummaryKpi[];
  columns: ReportColumnDef[];
  rows: Record<string, any>[];
  grandTotalRow?: Record<string, any>;
  totalRowCount: number;
}

export const REPORT_CONFIGS: ReportConfig[] = [
  // ─── COLLECTION REPORTS ───
  {
    id: 'month_class_collection',
    name: 'Month-wise Class-wise Collection',
    group: 'COLLECTION',
    groupLabel: 'Collection Registers',
    description: 'Class breakdown for chosen month: students submitted vs pending, collected and outstanding amounts',
    supportedFilters: ['session', 'month', 'class', 'search'],
    exportFilenamePrefix: 'Month_Class_Collection',
    columns: [
      { key: 'className', header: 'Class', align: 'left', pinned: true },
      { key: 'totalStudents', header: 'Total Students', align: 'right', format: 'number' },
      { key: 'submittedCount', header: 'Submitted', align: 'right', format: 'number' },
      { key: 'notSubmittedCount', header: 'Not Submitted', align: 'right', format: 'number' },
      { key: 'collectedPaise', header: 'Collected Amount', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Pending Amount', align: 'right', format: 'currency' },
      { key: 'collectionRate', header: 'Realization %', align: 'center', format: 'chip' },
    ],
  },
  {
    id: 'daily_collection',
    name: 'Daily Collection (Day Book)',
    group: 'COLLECTION',
    groupLabel: 'Collection Registers',
    description: 'Daily cash counter and online collections categorized by payment mode and cashier',
    supportedFilters: ['session', 'month', 'payment_mode', 'search'],
    exportFilenamePrefix: 'Day_Book_Collection',
    columns: [
      { key: 'txnDate', header: 'Date', align: 'left', format: 'date', pinned: true },
      { key: 'receiptNo', header: 'Receipt No', align: 'left' },
      { key: 'studentName', header: 'Student Name', align: 'left' },
      { key: 'className', header: 'Class-Sec', align: 'center' },
      { key: 'paymentMode', header: 'Payment Mode', align: 'center', format: 'chip' },
      { key: 'collectedBy', header: 'Cashier / Collector', align: 'left' },
      { key: 'amountPaise', header: 'Amount Paid', align: 'right', format: 'currency' },
    ],
  },
  {
    id: 'receipt_register',
    name: 'Receipt Register (with Cancelled)',
    group: 'COLLECTION',
    groupLabel: 'Collection Registers',
    description: 'Comprehensive receipt register including active and cancelled vouchers with audit reason',
    supportedFilters: ['session', 'month', 'payment_mode', 'search'],
    exportFilenamePrefix: 'Receipt_Register',
    columns: [
      { key: 'receiptNo', header: 'Receipt No', align: 'left', pinned: true },
      { key: 'paymentDate', header: 'Date', align: 'left', format: 'date' },
      { key: 'studentName', header: 'Student Name', align: 'left' },
      { key: 'admissionNo', header: 'Adm No', align: 'left' },
      { key: 'className', header: 'Class-Sec', align: 'center' },
      { key: 'paymentMode', header: 'Mode', align: 'center', format: 'chip' },
      { key: 'amountPaise', header: 'Amount Paid', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
      { key: 'cancelledReason', header: 'Remarks / Cancellation', align: 'left' },
    ],
  },
  {
    id: 'payment_mode_summary',
    name: 'Payment Mode Summary',
    group: 'COLLECTION',
    groupLabel: 'Collection Registers',
    description: 'Bank reconciliation summary of Cash, UPI, Cheque, and Online Gateway inflows',
    supportedFilters: ['session', 'month'],
    exportFilenamePrefix: 'Payment_Mode_Summary',
    columns: [
      { key: 'paymentMode', header: 'Payment Mode', align: 'left', pinned: true, format: 'chip' },
      { key: 'receiptCount', header: 'Receipts Count', align: 'right', format: 'number' },
      { key: 'studentCount', header: 'Unique Students', align: 'right', format: 'number' },
      { key: 'collectedPaise', header: 'Total Collected', align: 'right', format: 'currency' },
      { key: 'percentageShare', header: 'Share of Total', align: 'center', format: 'chip' },
    ],
  },

  // ─── PENDING & DEFAULTERS ───
  {
    id: 'pending_fees_list',
    name: 'Pending Fees List',
    group: 'PENDING_DEFAULTERS',
    groupLabel: 'Pending & Defaulters',
    description: 'Scholars with pending fee balances, father contacts for phone/WhatsApp reminder and overdue months',
    supportedFilters: ['session', 'class', 'section', 'transport', 'sibling', 'search'],
    exportFilenamePrefix: 'Pending_Fees_List',
    columns: [
      { key: 'srNo', header: 'Sr', align: 'center' },
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'fatherName', header: 'Father Name', align: 'left' },
      { key: 'mobile', header: 'Mobile (Reminder)', align: 'left', format: 'phone' },
      { key: 'monthsPending', header: 'Months Pending', align: 'center' },
      { key: 'pendingPaise', header: 'Pending Amount', align: 'right', format: 'currency' },
      { key: 'lastPaidDate', header: 'Last Paid On', align: 'left', format: 'date' },
    ],
  },
  {
    id: 'never_paid_defaulters',
    name: 'Never Paid Students (Defaulters)',
    group: 'PENDING_DEFAULTERS',
    groupLabel: 'Pending & Defaulters',
    description: 'Students who have not submitted any fee payment throughout the session',
    supportedFilters: ['session', 'class', 'section', 'search'],
    exportFilenamePrefix: 'Never_Paid_Defaulters',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'admissionNo', header: 'Adm No', align: 'left' },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'fatherName', header: 'Father Name', align: 'left' },
      { key: 'mobile', header: 'Mobile', align: 'left', format: 'phone' },
      { key: 'totalDemandPaise', header: 'Total Billed', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Pending Due', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
    ],
  },
  {
    id: 'annual_fee_pending',
    name: 'Annual Fee Pending Report',
    group: 'PENDING_DEFAULTERS',
    groupLabel: 'Pending & Defaulters',
    description: 'Scholars with outstanding Annual Composite Development Fee',
    supportedFilters: ['session', 'class', 'section', 'search'],
    exportFilenamePrefix: 'Annual_Fee_Pending',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'admissionNo', header: 'Adm No', align: 'left' },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'fatherName', header: 'Father Name', align: 'left' },
      { key: 'mobile', header: 'Mobile', align: 'left', format: 'phone' },
      { key: 'annualDuePaise', header: 'Annual Fee Due', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
    ],
  },
  {
    id: 'admission_fee_pending',
    name: 'Admission & Registration Pending Report',
    group: 'PENDING_DEFAULTERS',
    groupLabel: 'Pending & Defaulters',
    description: 'Scholars with outstanding One-Time Admission Fee (₹5,000) and Registration / Prospectus (₹1,000)',
    supportedFilters: ['session', 'class', 'section', 'search'],
    exportFilenamePrefix: 'Admission_Registration_Pending',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'admissionNo', header: 'Adm No', align: 'left' },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'fatherName', header: 'Father Name', align: 'left' },
      { key: 'mobile', header: 'Mobile', align: 'left', format: 'phone' },
      { key: 'admissionDuePaise', header: 'Admission Due', align: 'right', format: 'currency' },
      { key: 'registrationDuePaise', header: 'Registration Due', align: 'right', format: 'currency' },
      { key: 'totalOneTimeDuePaise', header: 'Total One-Time Due', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
    ],
  },
  {
    id: 'advance_payers',
    name: 'Advance Payment Students',
    group: 'PENDING_DEFAULTERS',
    groupLabel: 'Pending & Defaulters',
    description: 'Scholars who have paid ahead for future quarters or full annual session',
    supportedFilters: ['session', 'class', 'search'],
    exportFilenamePrefix: 'Advance_Payers',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'fatherName', header: 'Father Name', align: 'left' },
      { key: 'totalBilledPaise', header: 'Total Billed', align: 'right', format: 'currency' },
      { key: 'totalPaidPaise', header: 'Total Paid', align: 'right', format: 'currency' },
      { key: 'advancePaise', header: 'Advance Credit', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
    ],
  },

  // ─── HEAD-WISE REPORTS ───
  {
    id: 'exam_fee_report',
    name: 'Exam Fee Collection & Dues',
    group: 'HEAD_WISE',
    groupLabel: 'Head-wise Registers',
    description: 'Unit tests, half-yearly and board examination fee realization',
    supportedFilters: ['session', 'class', 'month', 'search'],
    exportFilenamePrefix: 'Exam_Fee_Register',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'examPeriod', header: 'Exam Cycle', align: 'left' },
      { key: 'demandPaise', header: 'Exam Fee', align: 'right', format: 'currency' },
      { key: 'paidPaise', header: 'Paid', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Due', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
    ],
  },
  {
    id: 'transport_fee_report',
    name: 'Transport Fee Collection & Dues',
    group: 'HEAD_WISE',
    groupLabel: 'Head-wise Registers',
    description: 'School bus fleet route and distance slab collection breakdown',
    supportedFilters: ['session', 'class', 'month', 'search'],
    exportFilenamePrefix: 'Transport_Fee_Register',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'slabName', header: 'Distance Slab', align: 'center' },
      { key: 'demandPaise', header: 'Billed', align: 'right', format: 'currency' },
      { key: 'discountPaise', header: 'Concession', align: 'right', format: 'currency' },
      { key: 'paidPaise', header: 'Collected', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Balance Due', align: 'right', format: 'currency' },
    ],
  },
  {
    id: 'hostel_fee_report',
    name: 'Hostel Fee Collection & Dues',
    group: 'HEAD_WISE',
    groupLabel: 'Head-wise Registers',
    description: 'Hostel boarding, lodging, security deposit and mess fee ledger',
    supportedFilters: ['session', 'class', 'month', 'search'],
    exportFilenamePrefix: 'Hostel_Fee_Register',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'roomType', header: 'Room Type', align: 'center' },
      { key: 'demandPaise', header: 'Demand', align: 'right', format: 'currency' },
      { key: 'paidPaise', header: 'Paid', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Pending', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
    ],
  },
  {
    id: 'annual_fee_head_report',
    name: 'Annual Fee Master Register',
    group: 'HEAD_WISE',
    groupLabel: 'Head-wise Registers',
    description: 'School-wide Annual Composite Fee billing, realization and outstanding balances',
    supportedFilters: ['session', 'class', 'search'],
    exportFilenamePrefix: 'Annual_Fee_Master',
    columns: [
      { key: 'className', header: 'Class', align: 'left', pinned: true },
      { key: 'totalStudents', header: 'Total Scholars', align: 'right', format: 'number' },
      { key: 'annualDemandPaise', header: 'Total Billed', align: 'right', format: 'currency' },
      { key: 'collectedPaise', header: 'Collected', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Pending', align: 'right', format: 'currency' },
      { key: 'realizationRate', header: 'Realization %', align: 'center', format: 'chip' },
    ],
  },

  // ─── DISCOUNTS & CONCESSIONS ───
  {
    id: 'sibling_discount_report',
    name: 'Sibling Discount Report',
    group: 'DISCOUNTS',
    groupLabel: 'Discounts & Waivers',
    description: 'Sibling concessions applied for 2nd child (20%), 3rd child (30%), 4th child (free transport)',
    supportedFilters: ['session', 'class', 'search'],
    exportFilenamePrefix: 'Sibling_Discounts',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'fatherName', header: 'Father Name', align: 'left' },
      { key: 'childOrder', header: 'Child #', align: 'center' },
      { key: 'concessionRule', header: 'Rule Applied', align: 'left' },
      { key: 'tuitionDiscountPaise', header: 'Tuition Concession', align: 'right', format: 'currency' },
      { key: 'transportDiscountPaise', header: 'Transport Concession', align: 'right', format: 'currency' },
      { key: 'totalDiscountPaise', header: 'Total Discount', align: 'right', format: 'currency' },
    ],
  },
  {
    id: 'month_wise_discount',
    name: 'Month-wise Discount & Waiver Summary',
    group: 'DISCOUNTS',
    groupLabel: 'Discounts & Waivers',
    description: 'Total fee concessions and waivers granted across each academic month',
    supportedFilters: ['session'],
    exportFilenamePrefix: 'Month_Wise_Discounts',
    columns: [
      { key: 'monthName', header: 'Month', align: 'left', pinned: true },
      { key: 'siblingDiscountPaise', header: 'Sibling Discount', align: 'right', format: 'currency' },
      { key: 'staffWaiverPaise', header: 'Staff Ward Waiver', align: 'right', format: 'currency' },
      { key: 'rteWaiverPaise', header: 'RTE Exemptions', align: 'right', format: 'currency' },
      { key: 'otherDiscountsPaise', header: 'Other Concessions', align: 'right', format: 'currency' },
      { key: 'totalConcessionPaise', header: 'Total Given', align: 'right', format: 'currency' },
      { key: 'beneficiaryCount', header: 'Beneficiaries', align: 'right', format: 'number' },
    ],
  },
  {
    id: 'manual_concessions',
    name: 'Manual Concessions & Waivers',
    group: 'DISCOUNTS',
    groupLabel: 'Discounts & Waivers',
    description: 'Discretionary Principal fee waivers and manual concessions with audit approval trail',
    supportedFilters: ['session', 'class', 'search'],
    exportFilenamePrefix: 'Manual_Concessions',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'concessionType', header: 'Concession Category', align: 'left', format: 'chip' },
      { key: 'amountPaise', header: 'Waived Amount', align: 'right', format: 'currency' },
      { key: 'approvedBy', header: 'Approved By', align: 'left' },
      { key: 'remarks', header: 'Authorization Reason', align: 'left' },
    ],
  },

  // ─── SUMMARIES & STATEMENTS ───
  {
    id: 'class_wise_summary',
    name: 'Class-wise Fee Summary',
    group: 'SUMMARIES',
    groupLabel: 'Master Summaries',
    description: 'Demand-Collection-Balance (DCB) master summary across all academic classes',
    supportedFilters: ['session', 'transport', 'sibling'],
    exportFilenamePrefix: 'Class_Wise_Fee_Summary',
    columns: [
      { key: 'className', header: 'Class', align: 'left', pinned: true },
      { key: 'totalStudents', header: 'Scholars', align: 'right', format: 'number' },
      { key: 'demandPaise', header: 'Gross Billed', align: 'right', format: 'currency' },
      { key: 'discountPaise', header: 'Discount Given', align: 'right', format: 'currency' },
      { key: 'collectedPaise', header: 'Net Collected', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Pending Due', align: 'right', format: 'currency' },
      { key: 'realizationRate', header: 'Collection %', align: 'center', format: 'chip' },
    ],
  },
  {
    id: 'student_statement',
    name: 'Student-wise Ledger Statement',
    group: 'SUMMARIES',
    groupLabel: 'Master Summaries',
    description: 'Complete student-wise financial passbook and dues audit',
    supportedFilters: ['session', 'class', 'section', 'search'],
    exportFilenamePrefix: 'Student_Statements',
    columns: [
      { key: 'studentName', header: 'Student Name', align: 'left', pinned: true },
      { key: 'admissionNo', header: 'Adm No', align: 'left' },
      { key: 'classSection', header: 'Class-Sec', align: 'center' },
      { key: 'fatherName', header: 'Father Name', align: 'left' },
      { key: 'demandPaise', header: 'Total Billed', align: 'right', format: 'currency' },
      { key: 'discountPaise', header: 'Discounts', align: 'right', format: 'currency' },
      { key: 'paidPaise', header: 'Total Paid', align: 'right', format: 'currency' },
      { key: 'pendingPaise', header: 'Net Due', align: 'right', format: 'currency' },
      { key: 'status', header: 'Status', align: 'center', format: 'chip' },
    ],
  },
];
