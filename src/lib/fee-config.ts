/*! Giterp Fee Master — Fee Configuration Engine v1.0.0 */
/**
 * fee-config.ts — Single source of truth for all fee rate definitions.
 * Replaces hardcoded DEFAULT_* constants in monthly-fee-helper.ts and
 * localStorage-based rates in fee-calculator.ts.
 *
 * Every rate lookup in the system MUST go through this module.
 */

import { getDatabase } from './mongodb';
import {
  FeeConfig,
  FeeHead,
  AcademicMonth,
  ConcessionType,
} from './types';

const COLLECTION = 'fee_config';

export {
  DEFAULT_FEE_CONFIG,
  paiseToRupees,
  rupeesToPaise,
  formatPaise,
  formatRupees,
} from './fee-constants';
import { DEFAULT_FEE_CONFIG } from './fee-constants';

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
        const config = doc as unknown as FeeConfig;
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
  if (/PG|PLAY|NURSERY|LKG|UKG|KG/.test(norm)) return 0;

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

  for (const slab of config.tuition_structure) {
    // Check if any of the slab's class identifiers match
    for (const cls of slab.classes) {
      const clsUpper = cls.toUpperCase();
      if (clsUpper === gradeStr) return slab.monthly_fee_paise;
      if (norm.includes(clsUpper) && clsUpper.length >= 2) return slab.monthly_fee_paise;
    }
  }

  // Fallback: try grade-based range matching
  if (grade === 0) return config.tuition_structure[0]?.monthly_fee_paise || 120000;
  if (grade <= 2) return config.tuition_structure[1]?.monthly_fee_paise || 140000;
  if (grade <= 5) return config.tuition_structure[2]?.monthly_fee_paise || 160000;
  if (grade <= 8) return config.tuition_structure[3]?.monthly_fee_paise || 180000;
  if (grade <= 10) return config.tuition_structure[4]?.monthly_fee_paise || 200000;
  return config.tuition_structure[5]?.monthly_fee_paise || 240000;
}

/**
 * Get annual fee in paise for a given class.
 */
export function getAnnualFeeForClass(config: FeeConfig, className: string, feeHead: string = 'ACTIVITY'): number {
  const grade = normalizeClassToGrade(className);
  for (const af of config.annual_fees) {
    if (af.fee_head !== feeHead) continue;
    const groupNorm = af.class_group.toUpperCase();
    if (groupNorm === 'ALL') return af.amount_paise;
    if (grade <= 8 && groupNorm.includes('VIII')) return af.amount_paise;
    if (grade >= 9 && groupNorm.includes('XII')) return af.amount_paise;
    if (grade >= 9 && groupNorm.includes('IX')) return af.amount_paise;
  }
  // Default by grade
  return grade >= 9 ? 600000 : 500000;
}

/**
 * Get transport slab rate in paise.
 */
export function getTransportSlabRate(config: FeeConfig, slabId: string): number {
  const slab = config.transport_slabs.find(s => s.id === slabId);
  return slab?.monthly_fee_paise || config.transport_slabs[0]?.monthly_fee_paise || 80000;
}

/**
 * Get hostel monthly rate and security deposit in paise.
 */
export function getHostelRate(config: FeeConfig, roomType: 'WITHOUT_AC' | 'WITH_AC'): { monthly: number; security: number } {
  const rate = config.hostel_rates.find(r => r.room_type === roomType);
  return {
    monthly: rate?.monthly_fee_paise || (roomType === 'WITH_AC' ? 783300 : 600000),
    security: rate?.security_deposit_paise || 1000000,
  };
}

/**
 * Get exam fee in paise for a given month.
 */
export function getExamFeeForMonth(config: FeeConfig, month: AcademicMonth): number {
  for (const ef of config.exam_fees) {
    if (ef.months.includes(month)) return ef.amount_paise;
  }
  return 0;
}
