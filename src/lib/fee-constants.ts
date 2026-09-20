/*! Giterp Fee Master — Pure Constants & Formatting Utilities v2.0.0 */
/**
 * fee-constants.ts — Safe to import in both Client and Server Components.
 * Contains no Node.js built-ins and no MongoDB drivers.
 */

import {
  AcademicMonth,
  ConcessionType,
  FeeHead,
  FeeConfig,
  FeeDepositSlot,
  SiblingConcessionTier,
  NON_REFUNDABLE_FEE_HEADS,
} from './types';

export { NON_REFUNDABLE_FEE_HEADS };

// ─── Academic Month Constants ───

export const ACADEMIC_MONTHS: AcademicMonth[] = [
  'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP',
  'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR',
];

export const MONTH_INDEX: Record<AcademicMonth, number> = {
  APR: 0, MAY: 1, JUN: 2, JUL: 3, AUG: 4, SEP: 5,
  OCT: 6, NOV: 7, DEC: 8, JAN: 9, FEB: 10, MAR: 11,
};

export const MONTH_FULL_NAMES: Record<AcademicMonth, string> = {
  APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September',
  OCT: 'October', NOV: 'November', DEC: 'December', JAN: 'January', FEB: 'February', MAR: 'March',
};

/** Due date defaults: 15th of each month */
export function getDefaultDueDate(month: AcademicMonth, sessionStartYear: number = 2026): string {
  const calendarMonths: Record<AcademicMonth, { m: number; yearOffset: number }> = {
    APR: { m: 4, yearOffset: 0 }, MAY: { m: 5, yearOffset: 0 }, JUN: { m: 6, yearOffset: 0 },
    JUL: { m: 7, yearOffset: 0 }, AUG: { m: 8, yearOffset: 0 }, SEP: { m: 9, yearOffset: 0 },
    OCT: { m: 10, yearOffset: 0 }, NOV: { m: 11, yearOffset: 0 }, DEC: { m: 12, yearOffset: 0 },
    JAN: { m: 1, yearOffset: 1 }, FEB: { m: 2, yearOffset: 1 }, MAR: { m: 3, yearOffset: 1 },
  };
  const cm = calendarMonths[month] || { m: 4, yearOffset: 0 };
  const year = sessionStartYear + cm.yearOffset;
  return `${year}-${String(cm.m).padStart(2, '0')}-15`;
}

// ─── Currency / Amount Conversions ───

export function paiseToRupees(paise: number): number {
  return (Number(paise) || 0) / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round((Number(rupees) || 0) * 100);
}

export function formatPaise(paise: number): string {
  const rupees = paiseToRupees(paise);
  return '₹' + rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatRupees(rupees: number): string {
  return '₹' + (Number(rupees) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// ─── Configurable Fee Deposit Slots Scheme 2026-27 ───

export const DEFAULT_DEPOSIT_SCHEDULE: FeeDepositSlot[] = [
  {
    slot_id: 'SLOT_1_APR',
    slot_name: 'April (+ Annual Fee)',
    months: ['APR'],
    due_day: 15,
    due_month: 'APR',
    includes_annual_fee: true,
  },
  {
    slot_id: 'SLOT_2_MAY_JUN',
    slot_name: 'May + June (Combined)',
    months: ['MAY', 'JUN'],
    due_day: 15,
    due_month: 'MAY',
  },
  {
    slot_id: 'SLOT_3_JUL',
    slot_name: 'July',
    months: ['JUL'],
    due_day: 15,
    due_month: 'JUL',
  },
  {
    slot_id: 'SLOT_4_AUG',
    slot_name: 'August',
    months: ['AUG'],
    due_day: 15,
    due_month: 'AUG',
  },
  {
    slot_id: 'SLOT_5_SEP_FEB',
    slot_name: 'September (+ Feb catch-up)',
    months: ['SEP', 'FEB'],
    due_day: 15,
    due_month: 'SEP',
  },
  {
    slot_id: 'SLOT_6_OCT',
    slot_name: 'October',
    months: ['OCT'],
    due_day: 15,
    due_month: 'OCT',
  },
  {
    slot_id: 'SLOT_7_NOV',
    slot_name: 'November',
    months: ['NOV'],
    due_day: 15,
    due_month: 'NOV',
  },
  {
    slot_id: 'SLOT_8_DEC_MAR',
    slot_name: 'December + March (Combined)',
    months: ['DEC', 'MAR'],
    due_day: 15,
    due_month: 'DEC',
  },
];

// ─── Default Sibling Concession Tiers ───

export const DEFAULT_SIBLING_RULES: SiblingConcessionTier[] = [
  { child_order: 1, tuition_discount_percent: 0, free_transport: false },
  { child_order: 2, tuition_discount_percent: 20, free_transport: false },
  { child_order: 3, tuition_discount_percent: 30, free_transport: false },
  { child_order: 4, tuition_discount_percent: 30, free_transport: true },
];

// ─── Default Configuration Template (Matching School Actual Rates) ───

export const DEFAULT_FEE_CONFIG: Omit<FeeConfig, 'id' | 'school_id' | 'academic_session' | 'updated_at' | 'updated_by'> = {
  // 1. One-Time / Annual Charges
  one_time_annual_charges: {
    prospectus_registration_paise: 100000, // ₹1,000 (one-time, non-refundable)
    admission_fee_paise: 500000,           // ₹5,000 (one-time, non-refundable)
    annual_fee_pg_to_viii_paise: 500000,   // ₹5,000/year
    annual_fee_ix_to_xii_paise: 600000,    // ₹6,000/year
    hostel_security_deposit_paise: 1000000,// ₹10,000 (refundable deposit)
    tc_fee_paise: 100000,                  // ₹1,000 (when issued)
  },

  // 2. Class-Wise Tuition Structure
  tuition_structure: [
    {
      class_group: 'PG, LKG & UKG',
      classes: ['PG', 'PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'KG', 'PRE-PRIMARY'],
      monthly_fee_paise: 100000,   // ₹1,000/month
      quarterly_fee_paise: 300000, // ₹3,000/quarter
    },
    {
      class_group: 'Class I & II',
      classes: ['1', 'I', '2', 'II', 'CLASS 1', 'CLASS 2', 'CLASS I', 'CLASS II'],
      monthly_fee_paise: 140000,   // ₹1,400/month
      quarterly_fee_paise: 420000, // ₹4,200/quarter
    },
    {
      class_group: 'Class III to V',
      classes: ['3', 'III', '4', 'IV', '5', 'V', 'CLASS 3', 'CLASS 4', 'CLASS 5'],
      monthly_fee_paise: 160000,   // ₹1,600/month
      quarterly_fee_paise: 480000, // ₹4,800/quarter
    },
    {
      class_group: 'Class VI to VIII',
      classes: ['6', 'VI', '7', 'VII', '8', 'VIII', 'CLASS 6', 'CLASS 7', 'CLASS 8'],
      monthly_fee_paise: 180000,   // ₹1,800/month
      quarterly_fee_paise: 540000, // ₹5,400/quarter
    },
    {
      class_group: 'Class IX & X',
      classes: ['9', 'IX', '10', 'X', 'CLASS 9', 'CLASS 10'],
      monthly_fee_paise: 200000,   // ₹2,000/month
      quarterly_fee_paise: 600000, // ₹6,000/quarter
    },
    {
      class_group: 'Class XI & XII',
      classes: ['11', 'XI', '12', 'XII', 'CLASS 11', 'CLASS 12'],
      monthly_fee_paise: 240000,   // ₹2,400/month
      quarterly_fee_paise: 720000, // ₹7,200/quarter
    },
  ],

  // 3. Transport Distance Slabs
  transport_slabs: [
    { id: '1', slab_name: '1–3 km', distance_label: '1–3 km', monthly_fee_paise: 80000 },    // ₹800
    { id: '2', slab_name: '4–6 km', distance_label: '4–6 km', monthly_fee_paise: 90000 },    // ₹900
    { id: '3', slab_name: '7–12 km', distance_label: '7–12 km', monthly_fee_paise: 110000 }, // ₹1,100
    { id: '4', slab_name: '13–16 km', distance_label: '13–16 km', monthly_fee_paise: 130000 }, // ₹1,300
    { id: '5', slab_name: '16–20 km', distance_label: '16–20 km', monthly_fee_paise: 180000 }, // ₹1,800
  ],

  // 4. Deposit Schedule 2026-27
  deposit_schedule: DEFAULT_DEPOSIT_SCHEDULE,

  // 5. Hostel Rates
  hostel_rates: [
    { room_type: 'WITHOUT_AC', monthly_fee_paise: 600000, security_deposit_paise: 1000000 },
    { room_type: 'WITH_AC', monthly_fee_paise: 783300, security_deposit_paise: 1000000 },
  ],

  // 6. Exam Fees
  exam_fees: [
    {
      exam_type: 'UNIT_TEST',
      name: 'Unit Test Exam Fee',
      applicable_classes: ['ALL'],
      amount_paise: 50000, // ₹500
      due_month: 'JUL',
    },
    {
      exam_type: 'HALF_YEARLY',
      name: 'Half-Yearly Examination Fee',
      applicable_classes: ['6', '7', '8', '9', '10', '11', '12', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
      amount_paise: 100000, // ₹1,000
      due_month: 'SEP',
    },
    {
      exam_type: 'ANNUAL',
      name: 'Annual Board / Final Exam Fee',
      applicable_classes: ['ALL'],
      amount_paise: 100000, // ₹1,000
      due_month: 'FEB',
    },
  ],

  // 7. Lab Fees
  lab_fees: [
    {
      lab_type: 'Science & Computer Lab Fee',
      applicable_classes: ['9', '10', '11', '12', 'IX', 'X', 'XI', 'XII'],
      amount_paise: 150000, // ₹1,500/year
      billing_cycle: 'ANNUAL',
    },
  ],

  // 8. Sibling & General Concession Rules
  sibling_concession_rules: DEFAULT_SIBLING_RULES,
  concession_rules: [
    {
      type: 'SIBLING' as ConcessionType,
      rule: '2nd child 20% tuition off; 3rd child 30% tuition off; 4th child 30% tuition off + free transport',
      applies_to_heads: ['TUITION', 'TRANSPORT'] as FeeHead[],
      sibling_rule: {
        first_child_percent: 0,
        second_child_percent: 20,
        third_plus_percent: 30,
      },
    },
    {
      type: 'RTE' as ConcessionType,
      rule: '100% waiver on tuition, admission, and annual fees under RTE Section 12(1)(c)',
      discount_percent: 100,
      applies_to_heads: ['TUITION', 'ADMISSION', 'ANNUAL', 'ACTIVITY'] as FeeHead[],
    },
    {
      type: 'STAFF_WARD' as ConcessionType,
      rule: '100% tuition waiver for children of school staff',
      discount_percent: 100,
      applies_to_heads: ['TUITION'] as FeeHead[],
    },
    {
      type: 'SINGLE_GIRL_CHILD' as ConcessionType,
      rule: 'CBSE fee concession for single girl child',
      discount_percent: 50,
      applies_to_heads: ['TUITION', 'EXAM'] as FeeHead[],
    },
    {
      type: 'ADVANCE_YEARLY' as ConcessionType,
      rule: 'Full academic year advance payment discount equal to 1 month tuition fee',
      discount_percent: 8.33,
      applies_to_heads: ['TUITION'] as FeeHead[],
    },
  ],

  // 9. Late Fee Rules
  late_fee_rules: {
    grace_days: 15,
    rule_type: 'FLAT',
    flat_amount_paise: 20000,   // ₹200 flat late fee after 15 days grace
    percentage_rate: 5,         // or 5%
    amount_paise: 20000,
    max_months: 12,
  },
};
