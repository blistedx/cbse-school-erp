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
