/*! Giterp Fee Master — Fee Configuration Engine v2.0.0 */
/**
 * fee-config.ts — Single source of truth for all fee rate definitions.
 * Replaces hardcoded rate constants across the entire platform.
 *
 * Every rate lookup in the system MUST go through this module.
 */

import { getDatabase } from './mongodb';
import {
  FeeConfig,
  FeeHead,
  AcademicMonth,
  ConcessionType,
  FeeDepositSlot,
  SiblingConcessionTier,
} from './types';

const COLLECTION = 'fee_config';

export {
  DEFAULT_FEE_CONFIG,
  DEFAULT_DEPOSIT_SCHEDULE,
  DEFAULT_SIBLING_RULES,
  paiseToRupees,
  rupeesToPaise,
  formatPaise,
  formatRupees,
} from './fee-constants';
import {
  DEFAULT_FEE_CONFIG,
  DEFAULT_DEPOSIT_SCHEDULE,
  DEFAULT_SIBLING_RULES,
} from './fee-constants';

// ─── In-memory cache ───

const configCache = new Map<string, { config: FeeConfig; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(schoolId: string, session: string): string {
  return `${schoolId}:${session}`;
}

/**
 * Get fee configuration for a school+session.
 * Falls back to default config if none exists in the database.
 */
export async function getFeeConfig(schoolId: string, session: string = '2026-27'): Promise<FeeConfig> {
  const key = cacheKey(schoolId, session);
  const cached = configCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  try {
    const db = await getDatabase();
    if (db) {
      const doc = await db.collection(COLLECTION).findOne({
        school_id: schoolId,
        academic_session: session,
      });
      if (doc) {
        const config = {
          ...DEFAULT_FEE_CONFIG,
          ...doc,
        } as unknown as FeeConfig;
        configCache.set(key, { config, expiresAt: Date.now() + CACHE_TTL_MS });
        return config;
      }
    }
  } catch (e) {
    console.error('[fee-config] Error fetching config:', e);
  }

  // Return default config bound to this school
  const defaultConfig: FeeConfig = {
    id: `FEECONF-${schoolId}-${session}`,
    school_id: schoolId,
    academic_session: session,
    ...DEFAULT_FEE_CONFIG,
    updated_at: new Date().toISOString(),
    updated_by: 'SYSTEM',
  };
  return defaultConfig;
}

/**
 * Upsert (create or update) fee configuration.
 */
export async function upsertFeeConfig(
  schoolId: string,
  session: string,
  config: Partial<FeeConfig>,
  updatedBy: string
): Promise<FeeConfig> {
  const existing = await getFeeConfig(schoolId, session);
  const updated: FeeConfig = {
    ...existing,
    ...config,
    id: existing.id || `FEECONF-${schoolId}-${session}`,
    school_id: schoolId,
    academic_session: session,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  try {
    const db = await getDatabase();
    if (db) {
      await db.collection(COLLECTION).updateOne(
        { school_id: schoolId, academic_session: session },
        { $set: updated },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error('[fee-config] Error upserting config:', e);
  }

  // Invalidate cache
  configCache.delete(cacheKey(schoolId, session));
  return updated;
}

// ─── Rate Lookup Helpers ───

/**
 * Normalize a class name to a canonical grade number for rate lookups.
 * e.g. "Class 6 - A", "Class VI", "6", "Class VI-A" → 6
 * Pre-primary: "PG"/"Nursery"/"LKG"/"UKG" → 0
 */
export function normalizeClassToGrade(className: string): number {
  const norm = (className || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/PG|PLAY|NURSERY|LKG|UKG|KG|PREPRIMARY/.test(norm)) return 0;

  // Try numeric extraction first
  const numMatch = norm.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);

  // Roman numeral fallback
  if (norm.includes('XII')) return 12;
  if (norm.includes('XI')) return 11;
  if (norm.includes('X')) return 10;
  if (norm.includes('IX')) return 9;
  if (norm.includes('VIII')) return 8;
  if (norm.includes('VII')) return 7;
  if (norm.includes('VI')) return 6;
  if (norm.includes('V')) return 5;
  if (norm.includes('IV')) return 4;
  if (norm.includes('III')) return 3;
  if (norm.includes('II')) return 2;
  if (norm.includes('I')) return 1;
  return 0;
}

/**
 * Get monthly tuition fee in paise for a given class, from the config.
 */
export function getTuitionRateForClass(config: FeeConfig, className: string): number {
  const grade = normalizeClassToGrade(className);
  const gradeStr = String(grade);
  const norm = (className || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (config.tuition_structure && Array.isArray(config.tuition_structure)) {
    for (const slab of config.tuition_structure) {
      for (const cls of slab.classes) {
        const clsUpper = cls.toUpperCase();
        if (clsUpper === gradeStr) return slab.monthly_fee_paise;
        if (norm.includes(clsUpper) && clsUpper.length >= 2) return slab.monthly_fee_paise;
      }
    }
  }

  // Fallback rates per Part A
  if (grade === 0) return 100000;      // ₹1,000
  if (grade <= 2) return 140000;      // ₹1,400
  if (grade <= 5) return 160000;      // ₹1,600
  if (grade <= 8) return 180000;      // ₹1,800
  if (grade <= 10) return 200000;     // ₹2,000
  return 240000;                      // ₹2,400
}

/**
 * Get quarterly tuition fee in paise for a given class.
 */
export function getQuarterlyTuitionRateForClass(config: FeeConfig, className: string): number {
  const monthly = getTuitionRateForClass(config, className);
  return monthly * 3;
}

/**
 * Get annual fee in paise for a given class.
 * PG to Class VIII: ₹5,000
 * Class IX to XII: ₹6,000
 */
export function getAnnualFeeForClass(config: FeeConfig, className: string): number {
  const grade = normalizeClassToGrade(className);
  if (config.one_time_annual_charges) {
    return grade >= 9
      ? config.one_time_annual_charges.annual_fee_ix_to_xii_paise || 600000
      : config.one_time_annual_charges.annual_fee_pg_to_viii_paise || 500000;
  }
  return grade >= 9 ? 600000 : 500000;
}

/**
 * Get prospectus + registration fee (one-time).
 */
export function getProspectusFee(config: FeeConfig): number {
  return config.one_time_annual_charges?.prospectus_registration_paise || 100000;
}

/**
 * Get admission fee (one-time).
 */
export function getAdmissionFee(config: FeeConfig): number {
  return config.one_time_annual_charges?.admission_fee_paise || 500000;
}

/**
 * Get TC fee.
 */
export function getTCFee(config: FeeConfig): number {
  return config.one_time_annual_charges?.tc_fee_paise || 100000;
}

/**
 * Get hostel security deposit (refundable).
 */
export function getHostelSecurityDeposit(config: FeeConfig): number {
  return config.one_time_annual_charges?.hostel_security_deposit_paise || 1000000;
}

/**
 * Get transport slab rate in paise.
 */
export function getTransportSlabRate(config: FeeConfig, slabId: string): number {
  const slabs = config.transport_slabs || DEFAULT_FEE_CONFIG.transport_slabs;
  const slab = slabs.find(s => s.id === slabId || s.slab_name === slabId || s.distance_label === slabId);
  return slab?.monthly_fee_paise || slabs[0]?.monthly_fee_paise || 80000;
}

/**
 * Get hostel monthly rate and security deposit in paise.
 */
export function getHostelRate(config: FeeConfig, roomType: 'WITHOUT_AC' | 'WITH_AC'): { monthly: number; security: number } {
  const rates = config.hostel_rates || DEFAULT_FEE_CONFIG.hostel_rates;
  const rate = rates.find(r => r.room_type === roomType);
  return {
    monthly: rate?.monthly_fee_paise || (roomType === 'WITH_AC' ? 783300 : 600000),
    security: rate?.security_deposit_paise || 1000000,
  };
}

/**
 * Get exam fee for a given exam type / month / class.
 */
export function getExamFee(config: FeeConfig, examType: string, className?: string): number {
  const examFees = config.exam_fees || DEFAULT_FEE_CONFIG.exam_fees;
  const exam = examFees.find(e => e.exam_type.toUpperCase() === examType.toUpperCase());
  if (!exam) return 0;

  if (className && exam.applicable_classes && !exam.applicable_classes.includes('ALL')) {
    const grade = normalizeClassToGrade(className);
    const gradeStr = String(grade);
    const matched = exam.applicable_classes.some(c => c.toUpperCase() === gradeStr || className.toUpperCase().includes(c.toUpperCase()));
    if (!matched) return 0;
  }

  return exam.amount_paise || 0;
}

/**
 * Get lab fee for a given class.
 */
export function getLabFeeForClass(config: FeeConfig, className: string): number {
  const grade = normalizeClassToGrade(className);
  if (grade >= 9) {
    const labFees = config.lab_fees || DEFAULT_FEE_CONFIG.lab_fees;
    return labFees[0]?.amount_paise || 150000;
  }
  return 0;
}

/**
 * Compute sibling concession discount amount on tuition & transport.
 * Rule:
 * 1st child: 0%
 * 2nd child: 20% on tuition
 * 3rd child: 30% on tuition
 * 4th child: 30% on tuition + 100% transport concession
 */
export function calculateSiblingDiscount(
  config: FeeConfig,
  childOrder: number,
  tuitionPaise: number,
  transportPaise: number = 0
): { tuitionDiscount: number; transportDiscount: number } {
  const rules = config.sibling_concession_rules || DEFAULT_SIBLING_RULES;
  const tier = rules.find(r => r.child_order === childOrder) || (childOrder >= 4 ? rules[rules.length - 1] : null);

  if (!tier) {
    return { tuitionDiscount: 0, transportDiscount: 0 };
  }

  const tuitionDiscount = Math.round((tuitionPaise * tier.tuition_discount_percent) / 100);
  const transportDiscount = tier.free_transport ? transportPaise : 0;

  return { tuitionDiscount, transportDiscount };
}

/**
 * Get deposit schedule slots.
 */
export function getDepositSchedule(config: FeeConfig): FeeDepositSlot[] {
  return config.deposit_schedule || DEFAULT_DEPOSIT_SCHEDULE;
}
