import { Pool, QueryResult } from 'pg';
import {
  MediaVaultItem,
  saveMediaVaultFile as saveLocalMediaVaultFile,
  getMediaVaultFile as getLocalMediaVaultFile,
  deleteMediaVaultFile as deleteLocalMediaVaultFile
} from './media';

export type { MediaVaultItem };

const rawConnectionString = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const connectionString = rawConnectionString.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');

export function isCockroachConfigured(): boolean {
  // Disabled for local hosting
  return Boolean(
    connectionString && 
    (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) &&
    !connectionString.includes('disabled')
  );
}

export function getCockroachPool(): Pool | null {
  return null;
}

export async function query<T = any>(_text: string, _params?: any[]): Promise<QueryResult<T> | null> {
  return null;
}

export async function checkCockroachStatus(): Promise<{ connected: boolean; error: string | null; dbVersion?: string; uriMasked: string }> {
  return {
    connected: false,
    error: 'CockroachDB is removed/disabled (using local storage)',
    dbVersion: 'Local Filesystem Storage',
    uriMasked: 'Local'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 📸 LOCAL MEDIA VAULT BRIDGE (Seamless backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────
export async function saveMediaVaultFile(item: MediaVaultItem): Promise<boolean> {
  return await saveLocalMediaVaultFile(item);
}

export async function getMediaVaultFile(id: string): Promise<MediaVaultItem | null> {
  return await getLocalMediaVaultFile(id);
}

export async function deleteMediaVaultFile(id: string): Promise<boolean> {
  return await deleteLocalMediaVaultFile(id);
}
