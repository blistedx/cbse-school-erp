/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import fs from 'fs';
import path from 'path';

export interface MediaVaultItem {
  id: string;
  school_id: string;
  entity_type: string;
  entity_id?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  data: string; // Base64 Data URL or Raw Base64 string
  created_at?: string;
}

const MEDIA_DIR = path.join(process.cwd(), 'data', 'media');

// Ensure data/media directory exists
function ensureMediaDir() {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }
  } catch (e) {
    // Non-blocking in restricted environments
  }
}

// In-memory cache for ultra-fast instant avatar reads
const mediaMemoryCache = new Map<string, MediaVaultItem>();

function getFilePath(id: string): string {
  // Sanitize id for filename
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(MEDIA_DIR, `${safeId}.json`);
}

export async function saveMediaVaultFile(item: MediaVaultItem): Promise<boolean> {
  try {
    ensureMediaDir();
    const sizeBytes = item.size_bytes || Buffer.byteLength(item.data, 'utf8');
    const record: MediaVaultItem = {
      id: item.id,
      school_id: item.school_id || 'DPS2026',
      entity_type: item.entity_type || 'GENERAL',
      entity_id: item.entity_id || '',
      filename: item.filename || 'media',
      mime_type: item.mime_type || 'image/jpeg',
      size_bytes: sizeBytes,
      data: item.data,
      created_at: item.created_at || new Date().toISOString()
    };

    mediaMemoryCache.set(item.id, record);

    const filePath = getFilePath(item.id);
    fs.writeFileSync(filePath, JSON.stringify(record), 'utf8');
    return true;
  } catch (e: any) {
    console.error('[Local Media Vault] Error saving media:', e.message);
    return false;
  }
}

export async function getMediaVaultFile(id: string): Promise<MediaVaultItem | null> {
  try {
    // 1. Check in-memory cache
    if (mediaMemoryCache.has(id)) {
      return mediaMemoryCache.get(id) || null;
    }

    // 2. Check local disk
    const filePath = getFilePath(id);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const item: MediaVaultItem = JSON.parse(raw);
      mediaMemoryCache.set(id, item);
      return item;
    }

    return null;
  } catch (e: any) {
    console.error('[Local Media Vault] Error reading media:', e.message);
    return null;
  }
}

export async function deleteMediaVaultFile(id: string): Promise<boolean> {
  try {
    mediaMemoryCache.delete(id);
    const filePath = getFilePath(id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (e: any) {
    console.error('[Local Media Vault] Error deleting media:', e.message);
    return false;
  }
}
