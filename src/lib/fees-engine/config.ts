/*! EduSuite Fee Master — Configuration Manager v3.0.0 */

import { getDatabase, sanitizeDocNoBinary } from '../mongodb';
import {
  FeeConfig,
  FeeHead,
  FeeDepositSlot,
  ClassTuitionStructure,
  TransportSlab,
  HostelRate,
  SiblingConcessionTier,
} from './types';
import {
  DEFAULT_FEE_CONFIG,
  DEFAULT_DEPOSIT_SCHEDULE,
  DEFAULT_SIBLING_RULES,
} from './constants';

const COLLECTION = 'fee_configs';
const configCache = new Map<string, { data: FeeConfig; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 min

function getCacheKey(schoolId: string, session: string): string {
  return `${schoolId}:${session}`;
}

export async function getFeeConfig(
  schoolId: string,
  session: string = '2026-27'
): Promise<FeeConfig> {
  const key = getCacheKey(schoolId, session);
  const cached = configCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const db = await getDatabase();
    if (db) {
      const doc = await db.collection(COLLECTION).findOne({
        school_id: schoolId,
        academic_session: session,
      });

      if (doc) {
        const config: FeeConfig = {
          id: doc.id || `FC-${schoolId}-${session}`,
          school_id: schoolId,
          academic_session: session,
          fee_heads: doc.fee_heads || DEFAULT_FEE_CONFIG.fee_heads,
          tuition_structure: doc.tuition_structure || DEFAULT_FEE_CONFIG.tuition_structure,
          transport_slabs: doc.transport_slabs || DEFAULT_FEE_CONFIG.transport_slabs,
          hostel_rates: doc.hostel_rates || DEFAULT_FEE_CONFIG.hostel_rates,
          deposit_schedule: doc.deposit_schedule || DEFAULT_DEPOSIT_SCHEDULE,
          sibling_rules: doc.sibling_rules || DEFAULT_SIBLING_RULES,
          concession_rules: doc.concession_rules || DEFAULT_FEE_CONFIG.concession_rules,
          late_fee_rules: doc.late_fee_rules || DEFAULT_FEE_CONFIG.late_fee_rules,
          one_time_charges: {
            ...DEFAULT_FEE_CONFIG.one_time_charges,
            ...(doc.one_time_charges || {}),
          },
          updated_at: doc.updated_at || new Date().toISOString(),
          updated_by: doc.updated_by,
        };

        configCache.set(key, { data: config, timestamp: Date.now() });
        return config;
      }
    }
  } catch (e) {
    console.warn('[fee-config] Error loading config from database:', e);
  }

  // Return default config
  const defaultConfig: FeeConfig = {
    id: `FC-${schoolId}-${session}`,
    school_id: schoolId,
    academic_session: session,
    fee_heads: [...DEFAULT_FEE_CONFIG.fee_heads],
    tuition_structure: [...DEFAULT_FEE_CONFIG.tuition_structure],
    transport_slabs: [...DEFAULT_FEE_CONFIG.transport_slabs],
    hostel_rates: [...DEFAULT_FEE_CONFIG.hostel_rates],
    deposit_schedule: [...DEFAULT_DEPOSIT_SCHEDULE],
    sibling_rules: [...DEFAULT_SIBLING_RULES],
    concession_rules: [...DEFAULT_FEE_CONFIG.concession_rules],
    late_fee_rules: [...DEFAULT_FEE_CONFIG.late_fee_rules],
    one_time_charges: { ...DEFAULT_FEE_CONFIG.one_time_charges },
    updated_at: new Date().toISOString(),
  };

  configCache.set(key, { data: defaultConfig, timestamp: Date.now() });
  return defaultConfig;
}

export async function saveFeeConfig(
  schoolId: string,
  config: Partial<FeeConfig>,
  actorId?: string
): Promise<FeeConfig> {
  const session = config.academic_session || '2026-27';
  const existing = await getFeeConfig(schoolId, session);

  const updated: FeeConfig = {
    ...existing,
    ...config,
    school_id: schoolId, // Ensure tenant isolation
    academic_session: session,
    updated_at: new Date().toISOString(),
    updated_by: actorId || existing.updated_by,
  };

  try {
    const db = await getDatabase();
    if (db) {
      await db.collection(COLLECTION).updateOne(
        { school_id: schoolId, academic_session: session },
        { $set: sanitizeDocNoBinary({ ...updated }) },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error('[fee-config] Error saving config:', e);
  }

  configCache.set(getCacheKey(schoolId, session), { data: updated, timestamp: Date.now() });
  return updated;
}

export * from './rates';

