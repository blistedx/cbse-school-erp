/*! Giterp Fee Master — Report Presets v1.0.0 */
/**
 * fee-report-presets.ts — All 25 reports as named presets of filters + groupBy.
 * NO separate calculation code — every report goes through getFeeAggregate.
 */

import type { FeeAggregateFilters, GroupByDimension, AcademicMonth } from './types';

export interface ReportPreset {
  id: string;
  name: string;
  category: 'COLLECTION' | 'DUES_OUTSTANDING' | 'CONCESSIONS' | 'ANALYTICS';
  description: string;
  /** Override filters (merged with user's current filter bar state) */
  filterOverrides: Partial<FeeAggregateFilters>;
  /** Which dimensions to group by */
  groupBy: GroupByDimension[];
  /** Column headers to display in the table */
  columns: string[];
  /** Which chart type to show above the table */
  chartType: 'bar' | 'pie' | 'line' | 'stacked_bar' | 'none';
  /** Icon name from lucide-react */
  icon: string;
}

// ─── COLLECTION REPORTS ───

export const DAILY_COLLECTION: ReportPreset = {
  id: 'daily_collection',
  name: 'Daily Collection / Cashbook',
  category: 'COLLECTION',
  description: 'Daily collection summary split by payment mode',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['date', 'payment_mode'],
  columns: ['Date', 'Payment Mode', 'Collected', 'Receipt Count', 'Students'],
  chartType: 'stacked_bar',
  icon: 'Calendar',
};

export const MONTH_WISE_COLLECTION: ReportPreset = {
  id: 'month_wise_collection',
  name: 'Month-wise Fee Collection',
  category: 'COLLECTION',
  description: 'Collection across the 12 CBSE academic months (Apr–Mar)',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['month'],
  columns: ['Month', 'Collected', 'Receipt Count', 'Students'],
  chartType: 'bar',
  icon: 'BarChart3',
};

export const HEAD_WISE_COLLECTION: ReportPreset = {
  id: 'head_wise_collection',
  name: 'Head-wise Collection',
  category: 'COLLECTION',
  description: 'Collection by fee head — tuition, transport, hostel, exam, admission, etc.',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['fee_head'],
  columns: ['Fee Head', 'Collected', 'Receipt Count', 'Students'],
  chartType: 'pie',
  icon: 'PieChart',
};

export const CLASS_SECTION_COLLECTION: ReportPreset = {
  id: 'class_section_collection',
  name: 'Class & Section-wise Collection',
  category: 'COLLECTION',
  description: 'Total collected per class and section',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['class', 'section'],
  columns: ['Class', 'Section', 'Collected', 'Students'],
  chartType: 'bar',
  icon: 'School',
};

export const PAYMENT_MODE_RECONCILIATION: ReportPreset = {
  id: 'payment_mode_reconciliation',
  name: 'Payment Mode Reconciliation',
  category: 'COLLECTION',
  description: 'Cash vs UPI vs Cheque vs Online totals for bank reconciliation',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['payment_mode'],
  columns: ['Payment Mode', 'Collected', 'Receipt Count', 'Students'],
  chartType: 'pie',
  icon: 'CreditCard',
};

export const COLLECTOR_WISE_COLLECTION: ReportPreset = {
  id: 'collector_wise_collection',
  name: 'Collector-wise Collection',
  category: 'COLLECTION',
  description: 'Which accountant collected how much — with cancelled receipts flagged',
  filterOverrides: {},
  groupBy: ['collected_by'],
  columns: ['Collector', 'Collected', 'Cancelled', 'Net', 'Receipt Count'],
  chartType: 'bar',
  icon: 'UserCheck',
};

export const RECEIPT_REGISTER: ReportPreset = {
  id: 'receipt_register',
  name: 'Receipt Register',
  category: 'COLLECTION',
  description: 'Every receipt with cancelled ones clearly marked',
  filterOverrides: { lineTypes: ['PAYMENT'], includeCancelled: true },
  groupBy: ['student', 'date'],
  columns: ['Receipt No', 'Date', 'Student', 'Class', 'Amount', 'Mode', 'Status'],
  chartType: 'none',
  icon: 'FileText',
};

// ─── DUES & OUTSTANDING REPORTS ───

export const PENDING_FEE_REPORT: ReportPreset = {
  id: 'pending_fee_report',
  name: 'Pending Fee Report',
  category: 'DUES_OUTSTANDING',
  description: 'Student-wise outstanding with head-wise breakup',
  filterOverrides: {},
  groupBy: ['student'],
  columns: ['Student', 'Adm No', 'Class', 'Demand', 'Paid', 'Discount', 'Balance'],
  chartType: 'none',
  icon: 'AlertTriangle',
};

export const DUES_AGEING: ReportPreset = {
  id: 'dues_ageing',
  name: 'Dues Ageing',
  category: 'DUES_OUTSTANDING',
  description: 'Overdue buckets: 0–30, 31–60, 61–90, 90+ days',
  filterOverrides: {},
  groupBy: ['student'],
  columns: ['Student', 'Class', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total'],
  chartType: 'stacked_bar',
  icon: 'Clock',
};

export const DEFAULTER_LIST: ReportPreset = {
  id: 'defaulter_list',
  name: 'Defaulter List',
  category: 'DUES_OUTSTANDING',
  description: 'Printable list with parent phone numbers for follow-up',
  filterOverrides: {},
  groupBy: ['student'],
  columns: ['Student', 'Adm No', 'Class', 'Guardian', 'Phone', 'Outstanding', 'Overdue Since'],
  chartType: 'none',
  icon: 'Phone',
};

export const CLASS_WISE_DCB: ReportPreset = {
  id: 'class_wise_dcb',
  name: 'Class-wise DCB (Demand–Collection–Balance)',
  category: 'DUES_OUTSTANDING',
  description: 'CBSE audit format — Demand, Collection, Balance per class',
  filterOverrides: {},
  groupBy: ['class'],
  columns: ['Class', 'Students', 'Demand', 'Collected', 'Discount', 'Waiver', 'Balance', 'Collection %'],
  chartType: 'bar',
  icon: 'ClipboardList',
};

export const EXAM_FEE_COLLECTION: ReportPreset = {
  id: 'exam_fee_collection',
  name: 'Exam Fee Collection & Dues',
  category: 'DUES_OUTSTANDING',
  description: 'Who has/hasn\'t paid exam fees, per exam',
  filterOverrides: { feeHeads: ['EXAM'] },
  groupBy: ['student', 'month'],
  columns: ['Student', 'Class', 'Exam Month', 'Demand', 'Paid', 'Balance', 'Status'],
  chartType: 'none',
  icon: 'GraduationCap',
};

export const TRANSPORT_COLLECTION: ReportPreset = {
  id: 'transport_collection',
  name: 'Transport Collection & Dues',
  category: 'DUES_OUTSTANDING',
  description: 'Route-wise, stop-wise, slab-wise transport fee status',
  filterOverrides: { feeHeads: ['TRANSPORT'] },
  groupBy: ['class', 'month'],
  columns: ['Class', 'Month', 'Students', 'Demand', 'Collected', 'Balance'],
  chartType: 'bar',
  icon: 'Bus',
};

export const HOSTEL_COLLECTION: ReportPreset = {
  id: 'hostel_collection',
  name: 'Hostel & Mess Collection/Dues',
  category: 'DUES_OUTSTANDING',
  description: 'Block-wise, room-type-wise hostel fee status',
  filterOverrides: { feeHeads: ['HOSTEL', 'MESS'] },
  groupBy: ['fee_head', 'month'],
  columns: ['Fee Head', 'Month', 'Students', 'Demand', 'Collected', 'Balance'],
  chartType: 'bar',
  icon: 'Building',
};

// ─── CONCESSION REPORTS ───

export const MONTH_WISE_DISCOUNT: ReportPreset = {
  id: 'month_wise_discount',
  name: 'Month-wise Discount Register',
  category: 'CONCESSIONS',
  description: 'Total concession given per month',
  filterOverrides: { lineTypes: ['DISCOUNT', 'WAIVER'] },
  groupBy: ['month'],
  columns: ['Month', 'Discount', 'Waiver', 'Total Concession', 'Students'],
  chartType: 'bar',
  icon: 'Percent',
};

export const SIBLING_DISCOUNT: ReportPreset = {
  id: 'sibling_discount',
  name: 'Sibling Discount Register',
  category: 'CONCESSIONS',
  description: 'Family group, siblings covered, amount waived per family',
  filterOverrides: { lineTypes: ['DISCOUNT'], concessionTypes: ['SIBLING'] },
  groupBy: ['student'],
  columns: ['Student', 'Class', 'Siblings', 'Discount Amount', 'Approved By'],
  chartType: 'none',
  icon: 'Users',
};

export const CONCESSION_TYPE_REGISTER: ReportPreset = {
  id: 'concession_type_register',
  name: 'Concession-type Register',
  category: 'CONCESSIONS',
  description: 'RTE / staff ward / merit / sports / single girl child with category totals',
  filterOverrides: { lineTypes: ['DISCOUNT', 'WAIVER'] },
  groupBy: ['concession_type'],
  columns: ['Concession Type', 'Students', 'Total Amount', 'Avg per Student'],
  chartType: 'pie',
  icon: 'Tag',
};

export const PRINCIPAL_WAIVER: ReportPreset = {
  id: 'principal_waiver',
  name: 'Principal Waiver Register',
  category: 'CONCESSIONS',
  description: 'Approval trail: who approved, when, why',
  filterOverrides: { lineTypes: ['WAIVER'], concessionTypes: ['PRINCIPAL_WAIVER'] },
  groupBy: ['student', 'date'],
  columns: ['Student', 'Date', 'Amount', 'Approved By', 'Reason'],
  chartType: 'none',
  icon: 'ShieldCheck',
};

// ─── ANALYTICS REPORTS ───

export const PROJECTED_VS_ACTUAL: ReportPreset = {
  id: 'projected_vs_actual',
  name: 'Projected vs Actual',
  category: 'ANALYTICS',
  description: 'Expected annual demand vs collected, collection efficiency %',
  filterOverrides: {},
  groupBy: ['month'],
  columns: ['Month', 'Projected Demand', 'Actual Collected', 'Efficiency %'],
  chartType: 'bar',
  icon: 'TrendingUp',
};

export const MONTH_ON_MONTH_TREND: ReportPreset = {
  id: 'month_on_month_trend',
  name: 'Month-on-Month Trend',
  category: 'ANALYTICS',
  description: 'Collection curve across the session',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['month'],
  columns: ['Month', 'Collected', 'Cumulative', 'Growth %'],
  chartType: 'line',
  icon: 'Activity',
};

export const SESSION_COMPARISON: ReportPreset = {
  id: 'session_comparison',
  name: 'Session Comparison',
  category: 'ANALYTICS',
  description: 'This year vs last year collection comparison',
  filterOverrides: {},
  groupBy: ['month'],
  columns: ['Month', 'Current Session', 'Previous Session', 'Change %'],
  chartType: 'bar',
  icon: 'ArrowRightLeft',
};

export const REFUND_ADJUSTMENT: ReportPreset = {
  id: 'refund_adjustment',
  name: 'Refund & Adjustment Register',
  category: 'ANALYTICS',
  description: 'All refunds and adjustments with linked original transactions',
  filterOverrides: { lineTypes: ['REFUND', 'ADJUSTMENT'] },
  groupBy: ['student', 'date'],
  columns: ['Student', 'Date', 'Type', 'Amount', 'Original Txn', 'Reason'],
  chartType: 'none',
  icon: 'RotateCcw',
};

export const BOUNCED_CHEQUE: ReportPreset = {
  id: 'bounced_cheque',
  name: 'Bounced Cheque Register',
  category: 'ANALYTICS',
  description: 'Cheque payments that were cancelled/bounced',
  filterOverrides: { lineTypes: ['PAYMENT'], paymentModes: ['CHEQUE'], includeCancelled: true },
  groupBy: ['student', 'date'],
  columns: ['Student', 'Date', 'Cheque No', 'Amount', 'Bank', 'Status'],
  chartType: 'none',
  icon: 'XCircle',
};

export const ADVANCE_PAYMENT: ReportPreset = {
  id: 'advance_payment',
  name: 'Advance Payment Register',
  category: 'ANALYTICS',
  description: 'Students who have paid beyond current demand',
  filterOverrides: {},
  groupBy: ['student'],
  columns: ['Student', 'Class', 'Total Demand', 'Total Paid', 'Advance Amount'],
  chartType: 'none',
  icon: 'ArrowUpRight',
};

export const STUDENT_FEE_LEDGER: ReportPreset = {
  id: 'student_fee_ledger',
  name: 'Student Fee Ledger',
  category: 'ANALYTICS',
  description: 'Full per-student statement, printable as a passbook',
  filterOverrides: {},
  groupBy: ['student'],
  columns: ['Date', 'Type', 'Fee Head', 'Month', 'Debit', 'Credit', 'Balance', 'Receipt'],
  chartType: 'none',
  icon: 'BookOpen',
};

// ─── All presets indexed by ID ───

export const ALL_REPORT_PRESETS: ReportPreset[] = [
  // Collection
  DAILY_COLLECTION,
  MONTH_WISE_COLLECTION,
  HEAD_WISE_COLLECTION,
  CLASS_SECTION_COLLECTION,
  PAYMENT_MODE_RECONCILIATION,
  COLLECTOR_WISE_COLLECTION,
  RECEIPT_REGISTER,
  // Dues & Outstanding
  PENDING_FEE_REPORT,
  DUES_AGEING,
  DEFAULTER_LIST,
  CLASS_WISE_DCB,
  EXAM_FEE_COLLECTION,
  TRANSPORT_COLLECTION,
  HOSTEL_COLLECTION,
  // Concessions
  MONTH_WISE_DISCOUNT,
  SIBLING_DISCOUNT,
  CONCESSION_TYPE_REGISTER,
  PRINCIPAL_WAIVER,
  // Analytics
  PROJECTED_VS_ACTUAL,
  MONTH_ON_MONTH_TREND,
  SESSION_COMPARISON,
  REFUND_ADJUSTMENT,
  BOUNCED_CHEQUE,
  ADVANCE_PAYMENT,
  STUDENT_FEE_LEDGER,
];

export const PRESET_BY_ID = new Map(ALL_REPORT_PRESETS.map(p => [p.id, p]));

export const PRESETS_BY_CATEGORY = {
  COLLECTION: ALL_REPORT_PRESETS.filter(p => p.category === 'COLLECTION'),
  DUES_OUTSTANDING: ALL_REPORT_PRESETS.filter(p => p.category === 'DUES_OUTSTANDING'),
  CONCESSIONS: ALL_REPORT_PRESETS.filter(p => p.category === 'CONCESSIONS'),
  ANALYTICS: ALL_REPORT_PRESETS.filter(p => p.category === 'ANALYTICS'),
};
