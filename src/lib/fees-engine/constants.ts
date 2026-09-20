/*! EduSuite Fee Master — Constants & Defaults (Session 2026-27) */

import {
  AcademicMonth,
  FeeConfig,
  FeeDepositSlot,
  SiblingConcessionTier,
  NON_REFUNDABLE_HEADS,
} from './types';

export { NON_REFUNDABLE_HEADS };

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

export const MONTH_NUMBER_MAP: Record<AcademicMonth, number> = {
  APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9,
  OCT: 10, NOV: 11, DEC: 12, JAN: 1, FEB: 2, MAR: 3,
};

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

// ─── Currency Helpers (Integer Paise <-> Rupees) ───

export function paiseToRupees(paise: number): number {
  return (Number(paise) || 0) / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round((Number(rupees) || 0) * 100);
}

export function formatPaise(paise: number, showSymbol = true): string {
  const rupees = paiseToRupees(paise);
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `₹${formatted}` : formatted;
}

export function formatRupees(rupees: number, showSymbol = true): string {
  const formatted = (Number(rupees) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `₹${formatted}` : formatted;
}

// ─── Deposit Scheme (Session 2026-27 Installment Groups) ───

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
    slot_name: 'May + June',
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
    slot_name: 'September + February',
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
    slot_name: 'December + March',
    months: ['DEC', 'MAR'],
    due_day: 15,
    due_month: 'DEC',
  },
];

// ─── Sibling Concession Rules ───

export const DEFAULT_SIBLING_RULES: SiblingConcessionTier[] = [
  { child_order: 1, tuition_discount_percent: 0, free_transport: false },
  { child_order: 2, tuition_discount_percent: 20, free_transport: false },
  { child_order: 3, tuition_discount_percent: 30, free_transport: false },
  { child_order: 4, tuition_discount_percent: 30, free_transport: true },
];

// ─── Official Fee Structure Defaults for Session 2026-27 ───

export const DEFAULT_FEE_CONFIG: Omit<FeeConfig, 'id' | 'school_id' | 'academic_session' | 'updated_at' | 'updated_by'> = {
  fee_heads: [
    {
      id: 'HEAD_REG',
      name: 'Prospectus + Registration Fee',
      code: 'REGISTRATION',
      type: 'ONE_TIME',
      frequency: 'ONE_TIME',
      is_refundable: false,
      applicable_to: 'ALL',
      default_amount_paise: 100000, // ₹1,000
      is_active: true,
      confirmed: true,
      description: 'Non-refundable registration and prospectus kit charge',
    },
    {
      id: 'HEAD_ADM',
      name: 'Admission Fee',
      code: 'ADMISSION',
      type: 'ONE_TIME',
      frequency: 'ONE_TIME',
      is_refundable: false,
      applicable_to: 'ALL',
      default_amount_paise: 500000, // ₹5,000
      is_active: true,
      confirmed: true,
      description: 'One-time admission charge for new scholars',
    },
    {
      id: 'HEAD_ANN',
      name: 'Annual Composite Fee',
      code: 'ANNUAL',
      type: 'RECURRING',
      frequency: 'ANNUAL',
      is_refundable: false,
      applicable_to: 'ALL',
      default_amount_paise: 500000, // ₹5,000 (PG-VIII) / ₹6,000 (IX-XII)
      is_active: true,
      confirmed: true,
      description: 'Annual development, library, examination, and campus charges',
    },
    {
      id: 'HEAD_TUI',
      name: 'Tuition Fee',
      code: 'TUITION',
      type: 'RECURRING',
      frequency: 'MONTHLY',
      is_refundable: false,
      applicable_to: 'ALL',
      default_amount_paise: 140000,
      is_active: true,
      confirmed: true,
      description: 'Academic tuition fee per installment/month schedule',
    },
    {
      id: 'HEAD_TRN',
      name: 'Transport Service Fee',
      code: 'TRANSPORT',
      type: 'RECURRING',
      frequency: 'MONTHLY',
      is_refundable: false,
      applicable_to: 'TRANSPORT',
      default_amount_paise: 80000,
      is_active: true,
      confirmed: true,
      description: 'Distance slab based monthly school bus fleet fee',
    },
    {
      id: 'HEAD_HSD',
      name: 'Hostel Security Deposit (Refundable)',
      code: 'SECURITY_DEPOSIT',
      type: 'ONE_TIME',
      frequency: 'ONE_TIME',
      is_refundable: true,
      applicable_to: 'HOSTEL',
      default_amount_paise: 1000000, // ₹10,000
      is_active: true,
      confirmed: true,
      description: 'Refundable security caution money for hostel inmates',
    },
    {
      id: 'HEAD_HOS',
      name: 'Hostel & Mess Boarding Fee (Placeholder)',
      code: 'HOSTEL',
      type: 'RECURRING',
      frequency: 'MONTHLY',
      is_refundable: false,
      applicable_to: 'HOSTEL',
      default_amount_paise: 650000, // ₹6,500
      is_active: true,
      confirmed: false, // Unconfirmed placeholder
      description: 'Monthly boarding, lodging and mess charge (Requires school confirmation)',
    },
    {
      id: 'HEAD_EXM',
      name: 'Examination Fee (Placeholder)',
      code: 'EXAM',
      type: 'RECURRING',
      frequency: 'HALF_YEARLY',
      is_refundable: false,
      applicable_to: 'ALL',
      default_amount_paise: 100000, // ₹1,000
      is_active: true,
      confirmed: false, // Unconfirmed placeholder
      description: 'Periodic tests and half-yearly/annual exam charges (Requires school confirmation)',
    },
    {
      id: 'HEAD_LAB',
      name: 'Science & Computer Lab Fee (Placeholder)',
      code: 'LAB',
      type: 'RECURRING',
      frequency: 'ANNUAL',
      is_refundable: false,
      applicable_to: 'CLASS_GROUP',
      applicable_classes: ['Class 9', 'Class 10', 'Class 11', 'Class 12', '9', '10', '11', '12', 'IX', 'X', 'XI', 'XII'],
      default_amount_paise: 150000, // ₹1,500
      is_active: true,
      confirmed: false, // Unconfirmed placeholder
      description: 'Annual senior secondary practical lab assessment fee (Requires school confirmation)',
    },
    {
      id: 'HEAD_TC',
      name: 'Transfer / Character Certificate Fee',
      code: 'TC',
      type: 'ON_DEMAND',
      frequency: 'ON_DEMAND',
      is_refundable: false,
      applicable_to: 'ON_REQUEST',
      default_amount_paise: 100000, // ₹1,000
      is_active: true,
      confirmed: true,
      description: 'Official TC and clearance verification fee',
    },
  ],

  // 1. One-Time & Annual Charges (in paise)
  one_time_charges: {
    prospectus_registration_paise: 100000, // ₹1,000
    admission_fee_paise: 500000,           // ₹5,000
    annual_fee_pg_to_viii_paise: 500000,   // ₹5,000/yr
    annual_fee_ix_to_xii_paise: 600000,    // ₹6,000/yr
    hostel_security_deposit_paise: 1000000,// ₹10,000 (refundable)
    tc_fee_paise: 100000,                  // ₹1,000
  },

  // 2. Class-Wise Tuition Structure
  tuition_structure: [
    {
      class_group: 'PG, LKG & UKG',
      classes: ['PG', 'PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'KG', 'PRE-PRIMARY', 'PRE-NURSERY'],
      monthly_fee_paise: 100000,   // ₹1,000/mo
      quarterly_fee_paise: 300000, // ₹3,000/qtr
      annual_fee_paise: 500000,    // ₹5,000/yr
    },
    {
      class_group: 'Class I & II',
      classes: ['1', 'I', '2', 'II', 'CLASS 1', 'CLASS 2', 'CLASS I', 'CLASS II'],
      monthly_fee_paise: 140000,   // ₹1,400/mo
      quarterly_fee_paise: 420000, // ₹4,200/qtr
      annual_fee_paise: 500000,    // ₹5,000/yr
    },
    {
      class_group: 'Class III to V',
      classes: ['3', 'III', '4', 'IV', '5', 'V', 'CLASS 3', 'CLASS 4', 'CLASS 5', 'CLASS III', 'CLASS IV', 'CLASS V'],
      monthly_fee_paise: 160000,   // ₹1,600/mo
      quarterly_fee_paise: 480000, // ₹4,800/qtr
      annual_fee_paise: 500000,    // ₹5,000/yr
    },
    {
      class_group: 'Class VI to VIII',
      classes: ['6', 'VI', '7', 'VII', '8', 'VIII', 'CLASS 6', 'CLASS 7', 'CLASS 8', 'CLASS VI', 'CLASS VII', 'CLASS VIII'],
      monthly_fee_paise: 180000,   // ₹1,800/mo
      quarterly_fee_paise: 540000, // ₹5,400/qtr
      annual_fee_paise: 500000,    // ₹5,000/yr
    },
    {
      class_group: 'Class IX & X',
      classes: ['9', 'IX', '10', 'X', 'CLASS 9', 'CLASS 10', 'CLASS IX', 'CLASS X'],
      monthly_fee_paise: 200000,   // ₹2,000/mo
      quarterly_fee_paise: 600000, // ₹6,000/qtr
      annual_fee_paise: 600000,    // ₹6,000/yr
    },
    {
      class_group: 'Class XI & XII',
      classes: ['11', 'XI', '12', 'XII', 'CLASS 11', 'CLASS 12', 'CLASS XI', 'CLASS XII'],
      monthly_fee_paise: 240000,   // ₹2,400/mo
      quarterly_fee_paise: 720000, // ₹7,200/qtr
      annual_fee_paise: 600000,    // ₹6,000/yr
    },
  ],

  // 3. Transport Distance Slabs
  transport_slabs: [
    { id: '1', slab_name: '1–3 km', distance_label: '1–3 km', min_km: 1, max_km: 3, monthly_fee_paise: 80000 },
    { id: '2', slab_name: '4–6 km', distance_label: '4–6 km', min_km: 4, max_km: 6, monthly_fee_paise: 90000 },
    { id: '3', slab_name: '7–12 km', distance_label: '7–12 km', min_km: 7, max_km: 12, monthly_fee_paise: 110000 },
    { id: '4', slab_name: '13–16 km', distance_label: '13–16 km', min_km: 13, max_km: 16, monthly_fee_paise: 130000 },
    { id: '5', slab_name: '16–20 km', distance_label: '16–20 km', min_km: 16, max_km: 20, monthly_fee_paise: 180000 },
  ],

  // 4. Deposit Schedule 2026-27
  deposit_schedule: DEFAULT_DEPOSIT_SCHEDULE,

  // 5. Hostel Rates
  hostel_rates: [
    { room_type: 'WITHOUT_AC', name: 'Non-AC Boarding & Mess', monthly_fee_paise: 600000, security_deposit_paise: 1000000 },
    { room_type: 'WITH_AC', name: 'Air-Conditioned Boarding & Mess', monthly_fee_paise: 783300, security_deposit_paise: 1000000 },
  ],

  // 6. Sibling Rules
  sibling_rules: DEFAULT_SIBLING_RULES,

  // 7. General Concession Rules
  concession_rules: [
    {
      type: 'SIBLING',
      rule_name: 'Sibling Concession Scheme',
      description: '2nd child 20% tuition off, 3rd child 30% tuition off, 4th child free transport + 30% tuition off',
      applies_to_heads: ['TUITION', 'TRANSPORT'],
      sibling_rule: {
        first_child_percent: 0,
        second_child_percent: 20,
        third_plus_percent: 30,
        fourth_plus_free_transport: true,
      },
      is_active: true,
    },
    {
      type: 'ADVANCE_YEARLY',
      rule_name: 'Full-Year Advance Payment Discount',
      description: 'Full academic year advance payment discount equal to 1 month tuition fee (~8.33% tuition off)',
      discount_percent: 8.33,
      applies_to_heads: ['TUITION'],
      is_active: true,
    },
    {
      type: 'STAFF_WARD',
      rule_name: 'Staff Ward Concession',
      description: '100% tuition waiver for children of verified school faculty and staff',
      discount_percent: 100,
      applies_to_heads: ['TUITION'],
      is_active: true,
    },
    {
      type: 'RTE',
      rule_name: 'RTE Section 12(1)(c) Exemption',
      description: '100% full waiver on tuition, admission, and annual fees under RTE mandate',
      discount_percent: 100,
      applies_to_heads: ['TUITION', 'ADMISSION', 'ANNUAL', 'ACTIVITY'],
      is_active: true,
    },
    {
      type: 'SINGLE_GIRL_CHILD',
      rule_name: 'Single Girl Child Concession',
      description: '50% tuition concession for single girl child scholars',
      discount_percent: 50,
      applies_to_heads: ['TUITION'],
      is_active: true,
    },
  ],

  // 8. Late Fee / Fine Settings (Default disabled)
  late_fee_rules: [
    {
      is_enabled: false,
      grace_days: 15,
      rule_type: 'FLAT',
      flat_amount_paise: 20000, // ₹200 flat
      percentage_rate: 5,
    },
  ],
};
