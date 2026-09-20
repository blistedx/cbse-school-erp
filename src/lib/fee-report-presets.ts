/*! Giterp Fee Master — Report Presets v2.0.0 */
/**
 * fee-report-presets.ts — All 25 reports as named presets of filters + groupBy.
 * All presets go through getFeeAggregate for unified single-source data.
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

// ─── MASTER DUES & STUDENT-WISE REPORTS (DEFAULT FIRST) ───

export const PENDING_FEE_REPORT: ReportPreset = {
  id: 'pending_fee_report',
  name: 'Pending Fee & Dues Outstanding Register',
  category: 'DUES_OUTSTANDING',
  description: 'Scholars with active outstanding fee balance across tuition, transport, annual, and exam heads',
  filterOverrides: { pendingOnly: true },
  groupBy: ['student'],
  columns: ['Student & Particulars', 'Demand', 'Collected', 'Discount', 'Waiver', 'Balance Due', 'Action'],
  chartType: 'none',
  icon: 'Users',
};

export const CLASS_WISE_DCB: ReportPreset = {
  id: 'class_wise_dcb',
  name: 'Class-wise DCB (Demand–Collection–Balance)',
  category: 'DUES_OUTSTANDING',
  description: 'CBSE audit format — Total Demand, Collections, Concessions, and Balance per class division',
  filterOverrides: {},
  groupBy: ['class'],
  columns: ['Class', 'Demand', 'Collected', 'Discount', 'Waiver', 'Balance', 'Scholars'],
  chartType: 'bar',
  icon: 'ClipboardList',
};

export const MONTH_WISE_COLLECTION: ReportPreset = {
  id: 'month_wise_collection',
  name: 'Month-wise Fee Schedule & Collections',
  category: 'COLLECTION',
  description: 'Collection and demand realization across the 12 CBSE academic months (Apr–Mar)',
  filterOverrides: {},
  groupBy: ['month'],
  columns: ['Month', 'Demand', 'Collected', 'Discount', 'Waiver', 'Balance', 'Scholars'],
  chartType: 'bar',
  icon: 'Calendar',
};

export const DAILY_COLLECTION: ReportPreset = {
  id: 'daily_collection',
  name: 'Daily Collection / Cashbook Register',
  category: 'COLLECTION',
  description: 'Daily counter receipts, cash, UPI, and bank transfers summary',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['date', 'payment_mode'],
  columns: ['Date', 'Payment Mode', 'Collected', 'Receipt Count', 'Scholars'],
  chartType: 'stacked_bar',
  icon: 'Calendar',
};

export const HEAD_WISE_COLLECTION: ReportPreset = {
  id: 'head_wise_collection',
  name: 'Head-wise Fee Register (Tuition, Transport, Annual)',
  category: 'COLLECTION',
  description: 'Demand and revenue realization split by fee head',
  filterOverrides: {},
  groupBy: ['fee_head'],
  columns: ['Fee Head', 'Demand', 'Collected', 'Discount', 'Balance', 'Scholars'],
  chartType: 'pie',
  icon: 'PieChart',
};

export const CLASS_SECTION_COLLECTION: ReportPreset = {
  id: 'class_section_collection',
  name: 'Class & Section-wise Breakdown',
  category: 'COLLECTION',
  description: 'Total demand, collection, and balance per class and section',
  filterOverrides: {},
  groupBy: ['class', 'section'],
  columns: ['Class', 'Section', 'Demand', 'Collected', 'Balance', 'Scholars'],
  chartType: 'bar',
  icon: 'School',
};

export const PAYMENT_MODE_RECONCILIATION: ReportPreset = {
  id: 'payment_mode_reconciliation',
  name: 'Payment Mode Reconciliation (Cash vs UPI vs Cheque)',
  category: 'COLLECTION',
  description: 'Cash Counter vs UPI vs Bank Cheque vs Online Gateway audit summary',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['payment_mode'],
  columns: ['Payment Mode', 'Collected', 'Receipt Count', 'Scholars'],
  chartType: 'pie',
  icon: 'CreditCard',
};

export const COLLECTOR_WISE_COLLECTION: ReportPreset = {
  id: 'collector_wise_collection',
  name: 'Cashier & Staff Collection Audit',
  category: 'COLLECTION',
  description: 'Cashier-wise receipt volume and total funds collected',
  filterOverrides: {},
  groupBy: ['collected_by'],
  columns: ['Collector / Cashier', 'Collected', 'Demand', 'Balance', 'Receipts'],
  chartType: 'bar',
  icon: 'UserCheck',
};

export const RECEIPT_REGISTER: ReportPreset = {
  id: 'receipt_register',
  name: 'Receipt & Voucher Register',
  category: 'COLLECTION',
  description: 'Chronological receipts with voucher references, modes, and timestamps',
  filterOverrides: { lineTypes: ['PAYMENT'], includeCancelled: true },
  groupBy: ['receipt_no', 'student', 'date', 'payment_mode'],
  columns: ['Receipt No', 'Date', 'Scholar', 'Mode', 'Amount Paid'],
  chartType: 'none',
  icon: 'FileText',
};

// ─── DUES & OUTSTANDING REPORTS ───

export const DUES_AGEING: ReportPreset = {
  id: 'dues_ageing',
  name: 'Dues Ageing & Overdue Ledger',
  category: 'DUES_OUTSTANDING',
  description: 'Overdue scholar balances with demand breakdown',
  filterOverrides: { pendingOnly: true },
  groupBy: ['student'],
  columns: ['Scholar', 'Demand', 'Collected', 'Balance Due', 'Status'],
  chartType: 'stacked_bar',
  icon: 'Clock',
};

export const DEFAULTER_LIST: ReportPreset = {
  id: 'defaulter_list',
  name: 'Defaulter Follow-Up List (with Parent Contact)',
  category: 'DUES_OUTSTANDING',
  description: 'Pending fee balance list with Father / Guardian phone numbers for WhatsApp reminders',
  filterOverrides: { pendingOnly: true },
  groupBy: ['student'],
  columns: ['Scholar & Parent Info', 'Class', 'Total Demand', 'Total Paid', 'Outstanding Balance'],
  chartType: 'none',
  icon: 'Phone',
};

export const EXAM_FEE_COLLECTION: ReportPreset = {
  id: 'exam_fee_collection',
  name: 'Examination Fee Collection & Dues',
  category: 'DUES_OUTSTANDING',
  description: 'Mid-term and annual board exam fee realization',
  filterOverrides: { feeHeads: ['EXAM'] },
  groupBy: ['student', 'month'],
  columns: ['Scholar', 'Exam Month', 'Demand', 'Paid', 'Balance Due'],
  chartType: 'none',
  icon: 'GraduationCap',
};

export const TRANSPORT_COLLECTION: ReportPreset = {
  id: 'transport_collection',
  name: 'Transport Distance Slab Collection & Dues',
  category: 'DUES_OUTSTANDING',
  description: 'Bus route and distance slab fee realization per student',
  filterOverrides: { feeHeads: ['TRANSPORT'] },
  groupBy: ['class', 'month'],
  columns: ['Class', 'Month', 'Demand', 'Collected', 'Balance', 'Scholars'],
  chartType: 'bar',
  icon: 'Bus',
};

export const HOSTEL_COLLECTION: ReportPreset = {
  id: 'hostel_collection',
  name: 'Hostel & Mess Fee Collection Register',
  category: 'DUES_OUTSTANDING',
  description: 'Boarding, lodging, and mess charges status',
  filterOverrides: { feeHeads: ['HOSTEL', 'MESS'] },
  groupBy: ['fee_head', 'month'],
  columns: ['Fee Head', 'Month', 'Demand', 'Collected', 'Balance', 'Scholars'],
  chartType: 'bar',
  icon: 'Building',
};

// ─── CONCESSION REPORTS ───

export const MONTH_WISE_DISCOUNT: ReportPreset = {
  id: 'month_wise_discount',
  name: 'Month-wise Discount & Waiver Register',
  category: 'CONCESSIONS',
  description: 'Total fee concessions approved per academic month',
  filterOverrides: { lineTypes: ['DISCOUNT', 'WAIVER'] },
  groupBy: ['month'],
  columns: ['Month', 'Discount', 'Waiver', 'Total Concession', 'Scholars'],
  chartType: 'bar',
  icon: 'Percent',
};

export const SIBLING_DISCOUNT: ReportPreset = {
  id: 'sibling_discount',
  name: 'Sibling Concession Register',
  category: 'CONCESSIONS',
  description: 'Family sibling discounts approved on tuition for 2nd and 3rd child',
  filterOverrides: { lineTypes: ['DISCOUNT'], concessionTypes: ['SIBLING'] },
  groupBy: ['student'],
  columns: ['Scholar', 'Discount Amount', 'Approved By', 'Audit Trail'],
  chartType: 'none',
  icon: 'Users',
};

export const CONCESSION_TYPE_REGISTER: ReportPreset = {
  id: 'concession_type_register',
  name: 'Concession Category Breakdown',
  category: 'CONCESSIONS',
  description: 'Sibling, RTE, Staff Ward, Merit, and Principal waivers breakdown',
  filterOverrides: { lineTypes: ['DISCOUNT', 'WAIVER'] },
  groupBy: ['concession_type'],
  columns: ['Concession Category', 'Discount', 'Waiver', 'Total Concession', 'Scholars'],
  chartType: 'pie',
  icon: 'Tag',
};

export const PRINCIPAL_WAIVER: ReportPreset = {
  id: 'principal_waiver',
  name: 'Principal Discretionary Waiver Register',
  category: 'CONCESSIONS',
  description: 'Official authorization trail of special waivers',
  filterOverrides: { lineTypes: ['WAIVER'], concessionTypes: ['PRINCIPAL_WAIVER'] },
  groupBy: ['student', 'date'],
  columns: ['Scholar', 'Date', 'Waiver Amount', 'Approved By', 'Remarks'],
  chartType: 'none',
  icon: 'ShieldCheck',
};

// ─── ANALYTICS REPORTS ───

export const PROJECTED_VS_ACTUAL: ReportPreset = {
  id: 'projected_vs_actual',
  name: 'Projected Demand vs Actual Collection',
  category: 'ANALYTICS',
  description: 'Total institutional demand vs realized bank collections',
  filterOverrides: {},
  groupBy: ['month'],
  columns: ['Month', 'Projected Demand', 'Actual Collected', 'Realization %'],
  chartType: 'bar',
  icon: 'TrendingUp',
};

export const MONTH_ON_MONTH_TREND: ReportPreset = {
  id: 'month_on_month_trend',
  name: 'Month-on-Month Revenue Trend',
  category: 'ANALYTICS',
  description: 'Collection curve across the academic session',
  filterOverrides: { lineTypes: ['PAYMENT'] },
  groupBy: ['month'],
  columns: ['Month', 'Collected', 'Scholars'],
  chartType: 'line',
  icon: 'Activity',
};

export const SESSION_COMPARISON: ReportPreset = {
  id: 'session_comparison',
  name: 'Academic Session Comparison',
  category: 'ANALYTICS',
  description: 'Revenue comparison across billing cycles',
  filterOverrides: {},
  groupBy: ['month'],
  columns: ['Month', 'Demand', 'Collected', 'Balance'],
  chartType: 'bar',
  icon: 'ArrowRightLeft',
};

export const REFUND_ADJUSTMENT: ReportPreset = {
  id: 'refund_adjustment',
  name: 'Refund & Adjustment Ledger',
  category: 'ANALYTICS',
  description: 'All caution deposit refunds and adjustments with authorization reasons',
  filterOverrides: { lineTypes: ['REFUND', 'ADJUSTMENT'] },
  groupBy: ['student', 'date'],
  columns: ['Scholar', 'Date', 'Amount', 'Reason'],
  chartType: 'none',
  icon: 'RotateCcw',
};

export const BOUNCED_CHEQUE: ReportPreset = {
  id: 'bounced_cheque',
  name: 'Bounced Cheque Audit Trail',
  category: 'ANALYTICS',
  description: 'Returned cheques with CTS memo reasons and restored student balances',
  filterOverrides: { lineTypes: ['PAYMENT'], paymentModes: ['CHEQUE'], includeCancelled: true },
  groupBy: ['student', 'date'],
  columns: ['Scholar', 'Date', 'Cheque No', 'Amount', 'Status'],
  chartType: 'none',
  icon: 'XCircle',
};

export const ADVANCE_PAYMENT: ReportPreset = {
  id: 'advance_payment',
  name: 'Advance Payment & Full-Year Clearance',
  category: 'ANALYTICS',
  description: 'Scholars who have paid ahead for future academic months',
  filterOverrides: {},
  groupBy: ['student'],
  columns: ['Scholar', 'Total Demand', 'Total Paid', 'Balance Due'],
  chartType: 'none',
  icon: 'ArrowUpRight',
};

export const STUDENT_FEE_LEDGER: ReportPreset = {
  id: 'student_fee_ledger',
  name: 'All Scholars Complete Ledger Register',
  category: 'ANALYTICS',
  description: 'Detailed statement of demand, receipts, concessions, and passbooks',
  filterOverrides: {},
  groupBy: ['student'],
  columns: ['Scholar & Father', 'Total Demand', 'Total Paid', 'Concessions', 'Balance Due', 'Action'],
  chartType: 'none',
  icon: 'BookOpen',
};

// ─── All Presets Exported in Logical Order ───

export const ALL_REPORT_PRESETS: ReportPreset[] = [
  // Master Default First
  PENDING_FEE_REPORT,
  MONTH_WISE_COLLECTION,
  CLASS_WISE_DCB,
  DAILY_COLLECTION,
  HEAD_WISE_COLLECTION,
  CLASS_SECTION_COLLECTION,
  PAYMENT_MODE_RECONCILIATION,
  COLLECTOR_WISE_COLLECTION,
  RECEIPT_REGISTER,
  DUES_AGEING,
  DEFAULTER_LIST,
  EXAM_FEE_COLLECTION,
  TRANSPORT_COLLECTION,
  HOSTEL_COLLECTION,
  MONTH_WISE_DISCOUNT,
  SIBLING_DISCOUNT,
  CONCESSION_TYPE_REGISTER,
  PRINCIPAL_WAIVER,
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
  DUES_OUTSTANDING: ALL_REPORT_PRESETS.filter(p => p.category === 'DUES_OUTSTANDING'),
  COLLECTION: ALL_REPORT_PRESETS.filter(p => p.category === 'COLLECTION'),
  CONCESSIONS: ALL_REPORT_PRESETS.filter(p => p.category === 'CONCESSIONS'),
  ANALYTICS: ALL_REPORT_PRESETS.filter(p => p.category === 'ANALYTICS'),
};
