import { Pool, QueryResult } from 'pg';

const rawConnectionString = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const connectionString = rawConnectionString.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');

let pool: Pool | null = null;

export function isCockroachConfigured(): boolean {
  return Boolean(connectionString && (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')));
}

export function getCockroachPool(): Pool | null {
  if (!isCockroachConfigured()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('[CockroachDB] Unexpected client error on idle pool:', err.message);
    });
  }

  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T> | null> {
  const p = getCockroachPool();
  if (!p) return null;
  try {
    return await p.query<T>(text, params);
  } catch (err: any) {
    console.error('[CockroachDB] Query error:', err.message, '\nQuery:', text);
    throw err;
  }
}

export async function checkCockroachStatus(): Promise<{ connected: boolean; error: string | null; dbVersion?: string; uriMasked: string }> {
  const uriMasked = connectionString ? connectionString.replace(/:([^@]+)@/, ':****@') : 'Not Configured';

  if (!isCockroachConfigured()) {
    return {
      connected: false,
      error: 'COCKROACH_DB_URL or DATABASE_URL not set in environment',
      uriMasked
    };
  }

  try {
    const res = await query('SELECT version()');
    const dbVersion = res?.rows[0]?.version || 'CockroachDB';
    return {
      connected: true,
      error: null,
      dbVersion,
      uriMasked
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message,
      uriMasked
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 📸 COCKROACHDB DEDICATED MEDIA VAULT (High-Capacity Photos & File Store)
// ─────────────────────────────────────────────────────────────────────────────
export interface MediaVaultItem {
  id: string;
  school_id: string;
  entity_type: string;
  entity_id?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  data: string;
  created_at?: string;
}

export async function saveMediaVaultFile(item: MediaVaultItem): Promise<boolean> {
  const sizeBytes = item.size_bytes || Buffer.byteLength(item.data, 'utf8');
  try {
    await query(`
      INSERT INTO media_vault (id, school_id, entity_type, entity_id, filename, mime_type, size_bytes, data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        size_bytes = EXCLUDED.size_bytes,
        mime_type = EXCLUDED.mime_type;
    `, [
      item.id,
      item.school_id || 'DPS2026',
      item.entity_type || 'GENERAL',
      item.entity_id || '',
      item.filename || 'media',
      item.mime_type || 'image/jpeg',
      sizeBytes,
      item.data
    ]);
    return true;
  } catch (e: any) {
    console.error('[CockroachDB Media Vault] Error saving media:', e.message);
    return false;
  }
}

export async function getMediaVaultFile(id: string): Promise<MediaVaultItem | null> {
  try {
    const res = await query<MediaVaultItem>('SELECT * FROM media_vault WHERE id = $1 LIMIT 1;', [id]);
    if (res && res.rows && res.rows.length > 0) {
      return res.rows[0];
    }
    return null;
  } catch (e: any) {
    console.error('[CockroachDB Media Vault] Error fetching media:', e.message);
    return null;
  }
}

export async function deleteMediaVaultFile(id: string): Promise<boolean> {
  try {
    await query('DELETE FROM media_vault WHERE id = $1;', [id]);
    return true;
  } catch (e: any) {
    return false;
  }
}
