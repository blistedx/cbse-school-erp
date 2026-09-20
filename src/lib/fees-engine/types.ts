/*! EduSuite Fee Master — Core Fees Engine Types v3.0.0 */

export type AcademicMonth =
  | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP'
  | 'OCT' | 'NOV' | 'DEC' | 'JAN' | 'FEB' | 'MAR';

export type FeeHeadType = 'ONE_TIME' | 'RECURRING' | 'ON_DEMAND';
export type FeeFrequency = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'ON_DEMAND';

export type FeeHead =
  | 'TUITION'
  | 'ADMISSION'
  | 'REGISTRATION'
  | 'ANNUAL'
  | 'TRANSPORT'
  | 'HOSTEL'
  | 'MESS'
  | 'EXAM'
  | 'LAB'
  | 'LIBRARY'
  | 'ACTIVITY'
  | 'UNIFORM'
  | 'BOOKS'
  | 'TC'
  | 'LATE_FEE'
  | 'SECURITY_DEPOSIT'
  | 'MISC'
  | string;

export type FeeLineType =
  | 'DEMAND'
  | 'PAYMENT'
  | 'DISCOUNT'
  | 'WAIVER'
  | 'FINE'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'OPENING_BALANCE';

export type PaymentMode = 'CASH' | 'UPI' | 'UPI_QR' | 'CHEQUE' | 'ONLINE' | 'BANK_TRANSFER' | 'CARD';

export type ConcessionType =
  | 'SIBLING'
  | 'STAFF_WARD'
  | 'ADVANCE_YEARLY'
  | 'RTE'
  | 'MERIT'
  | 'SINGLE_GIRL_CHILD'
  | 'MANAGEMENT'
  | 'PRINCIPAL_WAIVER'
  | 'MANUAL_CONCESSION'
  | 'SPECIAL_CONCESSION';

export const NON_REFUNDABLE_HEADS = [
  'REGISTRATION',
  'PROSPECTUS',
  'PROSPECTUS_REGISTRATION',
  'ADMISSION',
  'ANNUAL',
  'TC',
  'EXAM',
  'ACTIVITY',
  'UNIFORM',
  'BOOKS',
  'LAB',
  'LIBRARY',
];

export interface FeeHeadConfig {
  id: string;
  name: string;
  code: string;
  type: FeeHeadType;
  frequency: FeeFrequency;
  is_refundable: boolean;
  applicable_to: 'ALL' | 'CLASS_GROUP' | 'HOSTEL' | 'TRANSPORT' | 'ON_REQUEST';
  applicable_classes?: string[];
  default_amount_paise: number;
  is_active: boolean;
  description?: string;
}

export interface ClassTuitionStructure {
  class_group: string;
  classes: string[];
  monthly_fee_paise: number;
  quarterly_fee_paise: number;
  annual_fee_paise: number;
}

export interface TransportSlab {
  id: string;
  slab_name: string;
  distance_label: string;
  min_km: number;
  max_km: number;
  monthly_fee_paise: number;
}

export interface HostelRate {
  room_type: 'WITHOUT_AC' | 'WITH_AC';
  name: string;
  monthly_fee_paise: number;
  security_deposit_paise: number;
}

export interface FeeDepositSlot {
  slot_id: string;
  slot_name: string;
  months: AcademicMonth[];
  due_day: number;
  due_month: AcademicMonth;
  includes_annual_fee?: boolean;
}

export interface SiblingConcessionTier {
  child_order: number;
  tuition_discount_percent: number;
  free_transport?: boolean;
}

export interface ConcessionRule {
  type: ConcessionType;
  rule_name: string;
  description: string;
  discount_percent?: number;
  discount_amount_paise?: number;
  applies_to_heads: FeeHead[];
  sibling_rule?: {
    first_child_percent: number;
    second_child_percent: number;
    third_plus_percent: number;
    fourth_plus_free_transport?: boolean;
  };
  requires_approval?: boolean;
  is_active: boolean;
}

export interface LateFeeRule {
  is_enabled: boolean;
  grace_days: number;
  rule_type: 'FLAT' | 'PERCENTAGE' | 'PER_DAY';
  flat_amount_paise: number;
  percentage_rate: number;
  per_day_amount_paise?: number;
  max_amount_paise?: number;
}

export interface FeeConfig {
  id: string;
  school_id: string;
  academic_session: string;
  fee_heads: FeeHeadConfig[];
  tuition_structure: ClassTuitionStructure[];
  transport_slabs: TransportSlab[];
  hostel_rates: HostelRate[];
  deposit_schedule: FeeDepositSlot[];
  sibling_rules: SiblingConcessionTier[];
  concession_rules: ConcessionRule[];
  late_fee_rules: LateFeeRule[];
  one_time_charges: {
    prospectus_registration_paise: number;
    admission_fee_paise: number;
    annual_fee_pg_to_viii_paise: number;
    annual_fee_ix_to_xii_paise: number;
    hostel_security_deposit_paise: number;
    tc_fee_paise: number;
  };
  updated_at: string;
  updated_by?: string;
}

export interface FeeLedgerLine {
  id: string;
  school_id: string;
  academic_session: string;

  student_id: string;
  class_name: string;
  section: string;
  admission_no: string;

  line_type: FeeLineType;
  fee_head: FeeHead;
  month: AcademicMonth | null;
  slot_id?: string | null;

  amount: number; // Always positive integer in PAISE

  adjustment_direction?: 'DEBIT' | 'CREDIT';

  txn_date: string;
  due_date: string | null;

  payment_mode: PaymentMode | null;
  receipt_no: string | null;
  cheque_no: string | null;
  txn_ref: string | null;

  concession_type: ConcessionType | null;

  collected_by: string | null;
  approved_by: string | null;

  is_cancelled: boolean;
  cancelled_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;

  linked_line_id: string | null;

  remarks: string | null;
  created_at: string;
}

export interface LedgerFeeSummary {
  totalDemand: number;     // paise
  totalDiscount: number;   // paise
  totalWaiver: number;     // paise
  totalFine: number;       // paise
  totalPaid: number;       // paise
  totalRefund: number;     // paise
  balance: number;         // paise
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'WAIVED' | 'ADVANCE';
  nextDueDate?: string | null;
  monthsPendingCount?: number;
  headWise: {
    fee_head: FeeHead;
    demand: number;
    paid: number;
    discount: number;
    waiver: number;
    balance: number;
  }[];
  monthWise: {
    month: AcademicMonth;
    demand: number;
    paid: number;
    discount: number;
    waiver: number;
    fine: number;
    balance: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
  }[];
  slotWise?: {
    slot_id: string;
    slot_name: string;
    demand: number;
    paid: number;
    discount: number;
    waiver: number;
    fine: number;
    balance: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
  }[];
}

export interface StudentLedgerViewItem {
  id: string;
  fee_head: string;
  period: string; // e.g. "April 2026", "Slot 1 (April + Annual)", "One-Time"
  month: AcademicMonth | null;
  slot_id: string | null;
  gross_paise: number;
  discount_paise: number;
  net_paise: number;
  paid_paise: number;
  due_paise: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
  due_date: string | null;
  lines: FeeLedgerLine[];
}

export interface ReceiptRecord {
  receipt_no: string;
  school_id: string;
  academic_session: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  class_name: string;
  section: string;
  roll_no?: string | number;
  father_name: string;
  mobile: string;
  payment_date: string;
  payment_mode: PaymentMode;
  txn_ref?: string | null;
  cheque_no?: string | null;
  amount_paise: number;
  collected_by: string;
  remarks?: string | null;
  is_cancelled: boolean;
  cancelled_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  allocated_heads: {
    fee_head: FeeHead;
    month: AcademicMonth | null;
    period: string;
    amount_paise: number;
  }[];
}

export interface FeeAggregateFilters {
  session: string;
  dateFrom?: string;
  dateTo?: string;
  months?: AcademicMonth[];
  classes?: string[];
  sections?: string[];
  studentIds?: string[];
  feeHeads?: FeeHead[];
  lineTypes?: FeeLineType[];
  paymentModes?: (PaymentMode | null)[];
  concessionTypes?: (ConcessionType | null)[];
  collectedBy?: string[];
  transportOpted?: boolean;
  siblingOpted?: boolean;
  includeCancelled?: boolean;
  pendingOnly?: boolean;
  minBalance?: number;
  search?: string;
}

export type GroupByDimension =
  | 'month' | 'class' | 'section' | 'fee_head' | 'payment_mode'
  | 'concession_type' | 'collected_by' | 'date' | 'student'
  | 'route' | 'category' | 'status' | 'receipt_no';

export interface FeeAggregateRow {
  dimensions: Record<string, string>;
  demand: number;
  discount: number;
  waiver: number;
  fine: number;
  collected: number;
  refund: number;
  balance: number;
  studentCount: number;
}
