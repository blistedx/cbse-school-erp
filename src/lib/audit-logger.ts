/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Unified Audit Logger */
import fs from 'fs';
import path from 'path';
import { getDatabase } from '@/lib/mongodb';
import { AuditLogEntry } from './types';

const AUDIT_LOGS_FILE = path.join(process.cwd(), 'data', 'audit_logs.json');
const AUDIT_BACKUP_FILE = path.join(process.cwd(), 'data', 'audit_logs.backup.json');

// In-memory cache for fast read fallback
let inMemoryLogs: AuditLogEntry[] = [];
let indexesCreated = false;
let migrationAttempted = false;

// Compute clean before/after key delta
export function computeObjectDiff(before: any, after: any): Record<string, { before: any; after: any }> | null {
  if (!before && !after) return null;
  if (!before) return { _created: { before: null, after } };
  if (!after) return { _deleted: { before, after: null } };

  if (typeof before !== 'object' || typeof after !== 'object') {
    return before !== after ? { value: { before, after } } : null;
  }

  const diff: Record<string, { before: any; after: any }> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const k of allKeys) {
    // Skip noisy internal fields
    if (k === 'password_hash' || k === 'passcode' || k === 'updated_at' || k === '_id') continue;
    const valB = before[k];
    const valA = after[k];
    if (JSON.stringify(valB) !== JSON.stringify(valA)) {
      diff[k] = { before: valB, after: valA };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

// Ensure compound indexes on MongoDB audit_logs collection
export async function ensureAuditIndexes(): Promise<void> {
  if (indexesCreated) return;
  try {
    const db = await getDatabase();
    if (db) {
      const col = db.collection('audit_logs');
      await Promise.all([
        col.createIndex({ schoolId: 1, createdAt: -1 }),
        col.createIndex({ school_id: 1, timestamp: -1 }),
        col.createIndex({ schoolId: 1, module: 1, createdAt: -1 }),
        col.createIndex({ school_id: 1, module: 1, timestamp: -1 }),
        col.createIndex({ schoolId: 1, action: 1, createdAt: -1 }),
        col.createIndex({ id: 1 }, { unique: true })
      ]);
      indexesCreated = true;
    }
  } catch (err) {
    console.warn('[AuditLogger] ensureAuditIndexes warning:', err);
  }
}

// One-time safe migration from data/audit_logs.json into MongoDB audit_logs
export async function migrateAuditLogsJsonToMongo(): Promise<number> {
  if (migrationAttempted) return 0;
  migrationAttempted = true;

  try {
    const db = await getDatabase();
    if (!db) return 0;

    let sourceFile = AUDIT_LOGS_FILE;
    if (!fs.existsSync(sourceFile) && fs.existsSync(AUDIT_BACKUP_FILE)) {
      sourceFile = AUDIT_BACKUP_FILE;
    }

    if (!fs.existsSync(sourceFile)) return 0;

    const fileContent = fs.readFileSync(sourceFile, 'utf-8');
    const parsedLogs = JSON.parse(fileContent);
    if (!Array.isArray(parsedLogs) || parsedLogs.length === 0) return 0;

    const col = db.collection('audit_logs');
    const existingCount = await col.countDocuments();
    if (existingCount >= parsedLogs.length) {
      return 0; // Already migrated
    }

    const bulkOps = parsedLogs.map((log: any) => {
      const schoolId = log.schoolId || log.school_id || 'DPS2026';
      const createdAt = log.createdAt || log.timestamp || new Date().toISOString();
      const entityId = log.entityId || log.targetId || '';
      const userId = log.userId || log.actor?.id || 'admin';
      const role = log.role || log.actor?.role || 'ADMIN';
      const ip = log.ip || log.actor?.public_ip || log.actor?.ip || '103.217.122.45';

      const doc = {
        ...log,
        schoolId,
        school_id: schoolId,
        userId,
        role,
        entityId,
        targetId: entityId,
        ip,
        createdAt,
        timestamp: createdAt
      };

      return {
        updateOne: {
          filter: { id: doc.id },
          update: { $setOnInsert: doc },
          upsert: true
        }
      };
    });

    const res = await col.bulkWrite(bulkOps, { ordered: false });
    return res.upsertedCount || 0;
  } catch (err) {
    console.warn('[AuditLogger] Migration error (non-fatal):', err);
    return 0;
  }
}

// Load initial audit entries from file or defaults
function loadInitialAuditLogs(): AuditLogEntry[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const raw = fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

// Main non-blocking failure-safe audit event logger
export function logAuditEvent(entry: {
  actor?: { id?: string; name: string; role: string; email?: string; ip?: string; public_ip?: string };
  module: AuditLogEntry['module'];
  action: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
  summary: string;
  details?: Record<string, any>;
  targetId?: string;
  entityId?: string;
  targetName?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  school_id?: string;
  schoolId?: string;
  userId?: string;
  role?: string;
  session?: string;
}): AuditLogEntry {
  const resolvedSchoolId = entry.schoolId || entry.school_id || 'DPS2026';
  const resolvedIp = entry.ip || entry.actor?.public_ip || entry.actor?.ip || '103.217.122.45';
  const resolvedUserId = entry.userId || entry.actor?.id || 'admin';
  const resolvedRole = entry.role || entry.actor?.role || 'ADMIN';
  const resolvedEntityId = entry.entityId || entry.targetId;
  const now = new Date().toISOString();

  // Compute key-level diff if before/after are present
  const diff = computeObjectDiff(entry.before, entry.after);

  const newLog: AuditLogEntry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    timestamp: now,
    createdAt: now,
    schoolId: resolvedSchoolId,
    school_id: resolvedSchoolId,
    userId: resolvedUserId,
    role: resolvedRole,
    actor: {
      id: resolvedUserId,
      name: entry.actor?.name || 'Administrator',
      role: resolvedRole,
      email: entry.actor?.email,
      ip: resolvedIp,
      public_ip: resolvedIp
    },
    module: entry.module,
    action: entry.action.toUpperCase(),
    severity: entry.severity || 'INFO',
    summary: entry.summary,
    details: {
      ...(entry.details || {}),
      public_ip: resolvedIp
    },
    targetId: resolvedEntityId,
    entityId: resolvedEntityId,
    targetName: entry.targetName,
    before: entry.before ? JSON.parse(JSON.stringify(entry.before)) : undefined,
    after: entry.after ? JSON.parse(JSON.stringify(entry.after)) : undefined,
    diff: diff || undefined,
    ip: resolvedIp,
    userAgent: entry.userAgent,
    session: entry.session || '2026-27'
  };

  // 1. Maintain in-memory log cache (max 5,000 entries)
  if (inMemoryLogs.length === 0) {
    inMemoryLogs = loadInitialAuditLogs();
  }
  inMemoryLogs.unshift(newLog);
  if (inMemoryLogs.length > 5000) {
    inMemoryLogs.length = 5000;
  }

  // 2. Async, non-blocking, failure-safe write to MongoDB collection audit_logs
  (async () => {
    try {
      await ensureAuditIndexes();
      const db = await getDatabase();
      if (db) {
        await db.collection('audit_logs').insertOne({ ...newLog });
      }
    } catch (dbErr) {
      console.warn('[AuditLogger] Async Mongo write error (non-fatal):', dbErr);
    }

    // Best-effort local file backup (ignored on Vercel read-only systems)
    try {
      const dir = path.dirname(AUDIT_LOGS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(inMemoryLogs, null, 2), 'utf-8');
    } catch (_) {}
  })().catch(() => {});

  return newLog;
}

// Asynchronously query audit logs from MongoDB Atlas with full filtering & pagination
export async function getAuditLogsAsync(options?: {
  schoolId?: string;
  module?: string;
  severity?: string;
  userId?: string;
  action?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  skip?: number;
}): Promise<{
  logs: AuditLogEntry[];
  total: number;
  stats: { total: number; critical: number; modules: string[]; recentTimestamp: string | null };
}> {
  try {
    await ensureAuditIndexes();
    await migrateAuditLogsJsonToMongo();

    const db = await getDatabase();
    if (db) {
      const query: any = {};

      if (options?.schoolId && options.schoolId !== 'ALL') {
        query.$or = [{ schoolId: options.schoolId }, { school_id: options.schoolId }];
      }

      if (options?.module && options.module !== 'ALL') {
        query.module = options.module;
      }

      if (options?.severity && options.severity !== 'ALL') {
        query.severity = options.severity;
      }

      if (options?.action && options.action !== 'ALL') {
        query.action = { $regex: new RegExp(`^${options.action}`, 'i') };
      }

      if (options?.userId && options.userId !== 'ALL') {
        query.$or = [
          { userId: options.userId },
          { 'actor.id': options.userId },
          { 'actor.name': { $regex: new RegExp(options.userId, 'i') } }
        ];
      }

      if (options?.fromDate || options?.toDate) {
        query.createdAt = {};
        if (options.fromDate) query.createdAt.$gte = new Date(options.fromDate).toISOString();
        if (options.toDate) {
          const end = new Date(options.toDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end.toISOString();
        }
      }

      if (options?.search && options.search.trim()) {
        const regex = new RegExp(options.search.trim(), 'i');
        query.$and = [
          ...(query.$and || []),
          {
            $or: [
              { summary: regex },
              { action: regex },
              { 'actor.name': regex },
              { 'actor.role': regex },
              { ip: regex },
              { targetName: regex },
              { targetId: regex },
              { entityId: regex }
            ]
          }
        ];
      }

      const col = db.collection<AuditLogEntry>('audit_logs');
      const total = await col.countDocuments(query);

      const limit = options?.limit && options.limit > 0 ? options.limit : 100;
      const skip = options?.skip && options.skip >= 0 ? options.skip : 0;

      const docs = await col
        .find(query)
        .sort({ createdAt: -1, timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const logs = docs.map((d: any) => {
        const { _id, ...rest } = d;
        return rest as AuditLogEntry;
      });

      // Quick summary stats
      const criticalCount = await col.countDocuments({
        ...(options?.schoolId && options.schoolId !== 'ALL'
          ? { $or: [{ schoolId: options.schoolId }, { school_id: options.schoolId }] }
          : {}),
        severity: { $in: ['CRITICAL', 'SECURITY'] }
      });

      const modules = await col.distinct('module', options?.schoolId ? { schoolId: options.schoolId } : {});

      return {
        logs,
        total,
        stats: {
          total,
          critical: criticalCount,
          modules: (modules as string[]) || [],
          recentTimestamp: logs[0]?.createdAt || logs[0]?.timestamp || null
        }
      };
    }
  } catch (err) {
    console.warn('[AuditLogger] MongoDB query fallback to in-memory/file:', err);
  }

  // Fallback to in-memory / file
  const fallbackLogs = getAuditLogs({
    module: options?.module,
    severity: options?.severity,
    search: options?.search,
    limit: options?.limit
  });

  return {
    logs: fallbackLogs,
    total: fallbackLogs.length,
    stats: {
      total: fallbackLogs.length,
      critical: fallbackLogs.filter(l => l.severity === 'CRITICAL' || l.severity === 'SECURITY').length,
      modules: Array.from(new Set(fallbackLogs.map(l => l.module))),
      recentTimestamp: fallbackLogs[0]?.timestamp || null
    }
  };
}

// Synchronous reader with memory/file fallback
export function getAuditLogs(options?: {
  module?: string;
  severity?: string;
  search?: string;
  limit?: number;
}): AuditLogEntry[] {
  try {
    if (inMemoryLogs.length === 0) {
      inMemoryLogs = loadInitialAuditLogs();
    }
    let logs = [...inMemoryLogs];

    if (options?.module && options.module !== 'ALL') {
      logs = logs.filter(l => l.module === options.module);
    }
    if (options?.severity && options.severity !== 'ALL') {
      logs = logs.filter(l => l.severity === options.severity);
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      logs = logs.filter(l =>
        l.summary.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.actor.name.toLowerCase().includes(q) ||
        (l.targetName && l.targetName.toLowerCase().includes(q)) ||
        (l.entityId && l.entityId.toLowerCase().includes(q))
      );
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  } catch {
    return [];
  }
}

// Convert audit logs to CSV string for compliance download with before/after diff summary
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): string {
  const headers = [
    'Log ID',
    'Timestamp',
    'School ID',
    'Operator Name',
    'Role',
    'Public IP',
    'Module',
    'Action',
    'Severity',
    'Summary',
    'Target ID',
    'Target Name',
    'Diff Summary',
    'Before Snapshot',
    'After Snapshot'
  ];

  const rows = logs.map(l => {
    const diffText = l.diff ? JSON.stringify(l.diff).replace(/"/g, '""') : '';
    const beforeText = l.before ? JSON.stringify(l.before).replace(/"/g, '""') : '';
    const afterText = l.after ? JSON.stringify(l.after).replace(/"/g, '""') : '';

    return [
      `"${l.id}"`,
      `"${l.createdAt || l.timestamp}"`,
      `"${l.schoolId || l.school_id || ''}"`,
      `"${(l.actor.name || '').replace(/"/g, '""')}"`,
      `"${l.role || l.actor.role || ''}"`,
      `"${l.ip || l.actor.public_ip || l.actor.ip || ''}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.severity}"`,
      `"${(l.summary || '').replace(/"/g, '""')}"`,
      `"${l.entityId || l.targetId || ''}"`,
      `"${(l.targetName || '').replace(/"/g, '""')}"`,
      `"${diffText}"`,
      `"${beforeText}"`,
      `"${afterText}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
