/*! Giterp Fee Master — Pure Constants & Formatting Utilities v1.0.0 */
/**
 * fee-constants.ts — Safe to import in both Client and Server Components.
 * Contains no Node.js built-ins and no MongoDB drivers.
 */

import { AcademicMonth, ConcessionType, FeeHead, FeeConfig } from './types';

// ─── Academic Month Constants ───

export const ACADEMIC_MONTHS: AcademicMonth[] = [
  'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP',
  'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR',
];

export const MONTH_INDEX: Record<AcademicMonth, number> = {
  APR: 0, MAY: 1, JUN: 2, JUL: 3, AUG: 4, SEP: 5,
  OCT: 6, NOV: 7, DEC: 8, JAN: 9, FEB: 10, MAR: 11,
};

/** Due date defaults: 15th of each month */
export function getDefaultDueDate(month: AcademicMonth, sessionStartYear: number): string {
  const calendarMonths: Record<AcademicMonth, { m: number; yearOffset: number }> = {
    APR: { m: 4, yearOffset: 0 }, MAY: { m: 5, yearOffset: 0 }, JUN: { m: 6, yearOffset: 0 },
    JUL: { m: 7, yearOffset: 0 }, AUG: { m: 8, yearOffset: 0 }, SEP: { m: 9, yearOffset: 0 },
    OCT: { m: 10, yearOffset: 0 }, NOV: { m: 11, yearOffset: 0 }, DEC: { m: 12, yearOffset: 0 },
    JAN: { m: 1, yearOffset: 1 }, FEB: { m: 2, yearOffset: 1 }, MAR: { m: 3, yearOffset: 1 },
  };
  const cm = calendarMonths[month];
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

// ─── Default Configuration Template ───

export const DEFAULT_FEE_CONFIG: Omit<FeeConfig, 'id' | 'school_id' | 'academic_session' | 'updated_at' | 'updated_by'> = {
  tuition_structure: [
    { class_group: 'PG, LKG & UKG', classes: ['PG', 'PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'KG'], monthly_fee_paise: 120000 },
    { class_group: 'Class I & II', classes: ['1', 'I', '2', 'II'], monthly_fee_paise: 140000 },
    { class_group: 'Class III to V', classes: ['3', 'III', '4', 'IV', '5', 'V'], monthly_fee_paise: 160000 },
    { class_group: 'Class VI to VIII', classes: ['6', 'VI', '7', 'VII', '8', 'VIII'], monthly_fee_paise: 180000 },
    { class_group: 'Class IX & X', classes: ['9', 'IX', '10', 'X'], monthly_fee_paise: 200000 },
    { class_group: 'Class XI & XII', classes: ['11', 'XI', '12', 'XII'], monthly_fee_paise: 240000 },
  ],

  annual_fees: [
    { fee_head: 'ADMISSION', class_group: 'ALL', amount_paise: 500000, applies_to: 'NEW' as const },
    { fee_head: 'ACTIVITY', class_group: 'PG to VIII', amount_paise: 500000, applies_to: 'ALL' as const },
    { fee_head: 'ACTIVITY', class_group: 'IX to XII', amount_paise: 600000, applies_to: 'ALL' as const },
  ],

  transport_slabs: [
    { id: '1', slab_name: '1 to 3 km', monthly_fee_paise: 80000 },
    { id: '2', slab_name: '4 to 6 km', monthly_fee_paise: 90000 },
    { id: '3', slab_name: '7 to 12 km', monthly_fee_paise: 110000 },
    { id: '4', slab_name: '13 to 16 km', monthly_fee_paise: 130000 },
    { id: '5', slab_name: '16 to 20 km', monthly_fee_paise: 180000 },
  ],

  hostel_rates: [
    { room_type: 'WITHOUT_AC', monthly_fee_paise: 600000, security_deposit_paise: 1000000 },
    { room_type: 'WITH_AC', monthly_fee_paise: 783300, security_deposit_paise: 1000000 },
  ],

  exam_fees: [
    { exam_type: 'Half-Yearly', months: ['SEP'] as AcademicMonth[], amount_paise: 100000 },
    { exam_type: 'Annual', months: ['FEB'] as AcademicMonth[], amount_paise: 100000 },
  ],

  concession_rules: [
    {
      type: 'RTE' as ConcessionType,
      rule: '100% waiver on tuition, admission, and annual fees under RTE Section 12(1)(c)',
      discount_percent: 100,
      applies_to_heads: ['TUITION', 'ADMISSION', 'ACTIVITY'] as FeeHead[],
    },
    {
      type: 'SIBLING' as ConcessionType,
      rule: 'Second child gets 10% discount, third+ gets 25% on tuition',
      applies_to_heads: ['TUITION'] as FeeHead[],
      sibling_rule: {
        first_child_percent: 0,
        second_child_percent: 10,
        third_plus_percent: 25,
      },
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
      applies_to_heads: ['EXAM'] as FeeHead[],
    },
  ],

  late_fee_rules: {
    grace_days: 15,
    amount_paise: 5000,
    max_months: 12,
  },
};
