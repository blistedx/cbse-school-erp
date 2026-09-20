/*! EduSuite Fee Master — Rate Calculation & Sibling Discount Helpers v3.0.0 */

import type {
  FeeConfig,
  FeeDepositSlot,
} from './types';
import {
  DEFAULT_DEPOSIT_SCHEDULE,
  DEFAULT_SIBLING_RULES,
} from './constants';

export function normalizeClassName(className: string): string {
  if (!className) return '';
  return className
    .toUpperCase()
    .replace(/^CLASS\s+/i, '')
    .replace(/^GRADE\s+/i, '')
    .replace(/^STD\s+/i, '')
    .trim();
}

export function getTuitionRateForClass(config: FeeConfig, className: string): number {
  const norm = normalizeClassName(className);
  for (const group of config.tuition_structure) {
    for (const c of group.classes) {
      if (normalizeClassName(c) === norm) {
        return group.monthly_fee_paise;
      }
    }
  }
  // Fallback defaults by class weight if not explicitly matched
  const num = parseInt(norm.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num)) {
    if (num <= 2) return 140000;
    if (num <= 5) return 160000;
    if (num <= 8) return 180000;
    if (num <= 10) return 200000;
    return 240000;
  }
  return 100000; // Pre-primary default
}

export function getQuarterlyTuitionRateForClass(config: FeeConfig, className: string): number {
  const monthly = getTuitionRateForClass(config, className);
  const norm = normalizeClassName(className);
  for (const group of config.tuition_structure) {
    for (const c of group.classes) {
      if (normalizeClassName(c) === norm) {
        return group.quarterly_fee_paise || group.monthly_fee_paise * 3;
      }
    }
  }
  return monthly * 3;
}

export function getAnnualFeeForClass(config: FeeConfig, className: string): number {
  const norm = normalizeClassName(className);
  for (const group of config.tuition_structure) {
    for (const c of group.classes) {
      if (normalizeClassName(c) === norm) {
        return group.annual_fee_paise;
      }
    }
  }
  const num = parseInt(norm.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num) && num >= 9) {
    return config.one_time_charges.annual_fee_ix_to_xii_paise || 600000;
  }
  return config.one_time_charges.annual_fee_pg_to_viii_paise || 500000;
}

export function getTransportSlabRate(config: FeeConfig, slabIdOrKm: string | number): number {
  const slabs = config.transport_slabs || [];
  if (typeof slabIdOrKm === 'string') {
    const found = slabs.find(s => s.id === slabIdOrKm || s.slab_name.toLowerCase() === slabIdOrKm.toLowerCase());
    if (found) return found.monthly_fee_paise;
  }
  const km = typeof slabIdOrKm === 'number' ? slabIdOrKm : parseFloat(String(slabIdOrKm).replace(/[^0-9.]/g, ''));
  if (!isNaN(km)) {
    const found = slabs.find(s => km >= s.min_km && km <= s.max_km);
    if (found) return found.monthly_fee_paise;
    if (km <= 3) return 80000;
    if (km <= 6) return 90000;
    if (km <= 12) return 110000;
    if (km <= 16) return 130000;
    return 180000;
  }
  return slabs[0]?.monthly_fee_paise || 80000;
}

export function getHostelRate(config: FeeConfig, roomType: 'WITH_AC' | 'WITHOUT_AC' = 'WITHOUT_AC'): {
  monthly: number;
  security: number;
} {
  const rates = config.hostel_rates || [];
  const found = rates.find(r => r.room_type === roomType);
  if (found) {
    return {
      monthly: found.monthly_fee_paise,
      security: found.security_deposit_paise,
    };
  }
  return roomType === 'WITH_AC'
    ? { monthly: 783300, security: 1000000 }
    : { monthly: 600000, security: 1000000 };
}

export function calculateSiblingDiscount(
  config: FeeConfig,
  childOrder: number,
  tuitionFeePaise: number,
  transportFeePaise: number = 0
): {
  tuitionDiscountPaise: number;
  transportDiscountPaise: number;
  totalDiscountPaise: number;
  discountPercent: number;
  freeTransport: boolean;
} {
  if (childOrder <= 1) {
    return {
      tuitionDiscountPaise: 0,
      transportDiscountPaise: 0,
      totalDiscountPaise: 0,
      discountPercent: 0,
      freeTransport: false,
    };
  }

  const rules = config.sibling_rules || DEFAULT_SIBLING_RULES;
  const tier = rules.find(r => r.child_order === childOrder) ||
    (childOrder >= 4
      ? { child_order: childOrder, tuition_discount_percent: 30, free_transport: true }
      : childOrder === 3
        ? { child_order: 3, tuition_discount_percent: 30, free_transport: false }
        : { child_order: 2, tuition_discount_percent: 20, free_transport: false });

  const tuitionDiscountPaise = Math.round((tuitionFeePaise * (tier.tuition_discount_percent || 0)) / 100);
  const transportDiscountPaise = tier.free_transport ? transportFeePaise : 0;
  const totalDiscountPaise = tuitionDiscountPaise + transportDiscountPaise;

  return {
    tuitionDiscountPaise,
    transportDiscountPaise,
    totalDiscountPaise,
    discountPercent: tier.tuition_discount_percent || 0,
    freeTransport: !!tier.free_transport,
  };
}

export function getDepositSchedule(config: FeeConfig): FeeDepositSlot[] {
  return config.deposit_schedule && config.deposit_schedule.length > 0
    ? config.deposit_schedule
    : DEFAULT_DEPOSIT_SCHEDULE;
}
