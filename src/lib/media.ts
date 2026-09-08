/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { put, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { getDatabase } from './mongodb';

export interface MediaVaultItem {
  id: string;
  blob_url: string;
  url: string;
  school_id: string;
  entity_type: string;
  entity_id?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  pathname?: string;
  uploaded_by?: string;
  created_at?: string;
  // Note: Binary/raw data is strictly prohibited from being persisted to MongoDB or storage metadata
  data?: string; 
}

const DATA_DIR = path.join(process.cwd(), 'data');
const METADATA_DIR = path.join(DATA_DIR, 'media');
const FILES_DIR = path.join(DATA_DIR, 'media', 'files');

// In-memory cache for ultra-fast metadata resolution
const mediaMemoryCache = new Map<string, MediaVaultItem>();

function ensureDirectories() {
  try {
    if (!fs.existsSync(METADATA_DIR)) {
      fs.mkdirSync(METADATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
    }
  } catch (e) {
    // Non-blocking in restricted environments
  }
}

function getMetadataFilePath(id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(METADATA_DIR, `${safeId}.json`);
}

export function getMediaBinaryFilePath(id: string): string | null {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const binPath = path.join(FILES_DIR, `${safeId}.bin`);
  if (fs.existsSync(binPath)) return binPath;
  return null;
}

/**
 * Checks if Vercel Blob environment is configured.
 * Vercel automatically injects BLOB_READ_WRITE_TOKEN in production when Blob is enabled.
 */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Uploads a binary buffer to Vercel Blob and records metadata.
 * Always persists a local binary file copy for 100% offline-first reliability.
 * NO file bytes or base64 data are stored in MongoDB Atlas documents.
 */
export async function uploadToVercelBlob(options: {
  id: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
  schoolId: string;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
}): Promise<MediaVaultItem> {
  const { id, filename, buffer, mimeType, schoolId, entityType, entityId, uploadedBy } = options;
  ensureDirectories();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pathname = `media/${schoolId}/${id}-${safeName}`;

  // 1. Always save binary file to local disk vault for instant, zero-latency offline access
  try {
    fs.writeFileSync(path.join(FILES_DIR, `${safeId}.bin`), buffer);
  } catch (err: any) {
    console.warn('[Media Vault] Local binary write notice:', err.message);
  }

  let blobUrl = `/api/media/${id}`;
  let returnedPathname = pathname;

  // 2. Upload to Vercel Blob if token is configured
  if (isBlobConfigured()) {
    try {
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: true
      });
      blobUrl = blob.url;
      returnedPathname = blob.pathname;
    } catch (err: any) {
      console.warn('[Vercel Blob] Upload notice (falling back to local media vault):', err.message);
      blobUrl = `/api/media/${id}`;
    }
  }

  const record: MediaVaultItem = {
    id,
    blob_url: blobUrl,
    url: blobUrl,
    school_id: schoolId || 'DPS2026',
    entity_type: entityType || 'GENERAL',
    entity_id: entityId || '',
    filename: safeName,
    mime_type: mimeType,
    size_bytes: buffer.length,
    pathname: returnedPathname,
    uploaded_by: uploadedBy || 'system',
    created_at: new Date().toISOString()
  };

  await saveMediaMetadata(record);
  return record;
}

/**
 * Persists lightweight media metadata to in-memory cache, local JSON, and MongoDB.
 * HARD CONSTRAINT: Never writes binary or base64 data to MongoDB.
 */
export async function saveMediaMetadata(item: MediaVaultItem): Promise<boolean> {
  try {
    ensureDirectories();
    const cleanRecord: MediaVaultItem = {
      id: item.id,
      blob_url: item.blob_url || item.url,
      url: item.url || item.blob_url,
      school_id: item.school_id || 'DPS2026',
      entity_type: item.entity_type || 'GENERAL',
      entity_id: item.entity_id || '',
      filename: item.filename || 'media',
      mime_type: item.mime_type || 'image/jpeg',
      size_bytes: item.size_bytes || 0,
      pathname: item.pathname || '',
      uploaded_by: item.uploaded_by || '',
      created_at: item.created_at || new Date().toISOString()
    };

    // 1. Update in-memory cache
    mediaMemoryCache.set(cleanRecord.id, cleanRecord);

    // 2. Persist metadata to local disk (without binary data)
    try {
      const filePath = getMetadataFilePath(cleanRecord.id);
      fs.writeFileSync(filePath, JSON.stringify(cleanRecord, null, 2), 'utf8');
    } catch (_) {}

    // 3. Persist metadata to MongoDB (Zero binary, references only)
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('media_metadata').updateOne(
          { id: cleanRecord.id },
          {
            $set: {
              id: cleanRecord.id,
              blob_url: cleanRecord.blob_url,
              url: cleanRecord.url,
              school_id: cleanRecord.school_id,
              entity_type: cleanRecord.entity_type,
              entity_id: cleanRecord.entity_id,
              filename: cleanRecord.filename,
              mime_type: cleanRecord.mime_type,
              size_bytes: cleanRecord.size_bytes,
              pathname: cleanRecord.pathname,
              uploaded_by: cleanRecord.uploaded_by,
              updated_at: new Date().toISOString()
            },
            $setOnInsert: {
              created_at: cleanRecord.created_at
            }
          },
          { upsert: true }
        );
      }
    } catch (e: any) {
      console.warn('[MongoDB media_metadata sync notice]:', e.message);
    }

    return true;
  } catch (e: any) {
    console.error('[Media Vault] Error saving metadata:', e.message);
    return false;
  }
}

/**
 * Retrieves a media item's metadata by ID or Blob URL.
 */
export async function getMediaVaultFile(idOrUrl: string): Promise<MediaVaultItem | null> {
  try {
    if (!idOrUrl) return null;

    // 1. Check in-memory cache
    if (mediaMemoryCache.has(idOrUrl)) {
      return mediaMemoryCache.get(idOrUrl) || null;
    }

    // 2. Check MongoDB collection 'media_metadata'
    try {
      const db = await getDatabase();
      if (db) {
        const doc = await db.collection('media_metadata').findOne({
          $or: [{ id: idOrUrl }, { blob_url: idOrUrl }, { url: idOrUrl }]
        });
        if (doc) {
          const item: MediaVaultItem = {
            id: doc.id,
            blob_url: doc.blob_url || doc.url,
            url: doc.url || doc.blob_url,
            school_id: doc.school_id,
            entity_type: doc.entity_type,
            entity_id: doc.entity_id,
            filename: doc.filename,
            mime_type: doc.mime_type,
            size_bytes: doc.size_bytes,
            pathname: doc.pathname,
            uploaded_by: doc.uploaded_by,
            created_at: doc.created_at
          };
          mediaMemoryCache.set(doc.id, item);
          return item;
        }
      }
    } catch (e) {}

    // 3. Check local metadata disk file
    const filePath = getMetadataFilePath(idOrUrl);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const item: MediaVaultItem = JSON.parse(raw);
      // If legacy file contained data, ensure url is set
      if (!item.url && item.blob_url) item.url = item.blob_url;
      mediaMemoryCache.set(item.id, item);
      return item;
    }

    return null;
  } catch (e: any) {
    console.error('[Media Vault] Error reading metadata:', e.message);
    return null;
  }
}

/**
 * Deletes an uploaded file from Vercel Blob and removes its metadata.
 * Prevents orphaned blobs when records are deleted.
 */
export async function deleteMediaVaultFile(idOrUrl: string): Promise<boolean> {
  try {
    if (!idOrUrl) return false;
    const item = await getMediaVaultFile(idOrUrl);
    const targetUrl = item?.blob_url || item?.url || (idOrUrl.startsWith('http') ? idOrUrl : null);

    // 1. Call Vercel Blob del() to remove the physical file from cloud storage
    if (targetUrl && isBlobConfigured()) {
      try {
        await del(targetUrl);
      } catch (err: any) {
        console.warn('[Vercel Blob] Notice deleting blob:', err.message);
      }
    }

    // 2. Remove from in-memory cache and local file
    const id = item?.id || idOrUrl;
    mediaMemoryCache.delete(id);
    const filePath = getMetadataFilePath(id);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }

    // 3. Remove metadata from MongoDB
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('media_metadata').deleteOne({
          $or: [{ id }, { blob_url: idOrUrl }, { url: idOrUrl }]
        });
      }
    } catch (e) {}

    return true;
  } catch (e: any) {
    console.error('[Media Vault] Error deleting media:', e.message);
    return false;
  }
}

/**
 * Backward-compatible helper for legacy callers.
 * If data (base64/data URL) is supplied, converts to buffer, uploads to Vercel Blob,
 * and saves metadata only.
 */
export async function saveMediaVaultFile(item: {
  id: string;
  school_id?: string;
  entity_type?: string;
  entity_id?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  data?: string;
  blob_url?: string;
  url?: string;
  created_at?: string;
}): Promise<boolean> {
  try {
    // If it's already a URL without data, just save metadata
    if (!item.data && (item.blob_url || item.url)) {
      return await saveMediaMetadata({
        id: item.id,
        blob_url: item.blob_url || item.url || '',
        url: item.url || item.blob_url || '',
        school_id: item.school_id || 'DPS2026',
        entity_type: item.entity_type || 'GENERAL',
        entity_id: item.entity_id || '',
        filename: item.filename || 'media',
        mime_type: item.mime_type || 'image/jpeg',
        size_bytes: item.size_bytes || 0,
        created_at: item.created_at || new Date().toISOString()
      });
    }

    // If base64 data is present, decode and upload to Vercel Blob
    if (item.data) {
      let buffer: Buffer;
      let detectedMime = item.mime_type || 'image/jpeg';

      if (item.data.startsWith('data:')) {
        const parts = item.data.split(',');
        const match = parts[0].match(/:(.*?);/);
        if (match) detectedMime = match[1];
        buffer = Buffer.from(parts[1] || '', 'base64');
      } else {
        buffer = Buffer.from(item.data, 'base64');
      }

      await uploadToVercelBlob({
        id: item.id,
        filename: item.filename || 'media.jpg',
        buffer,
        mimeType: detectedMime,
        schoolId: item.school_id || 'DPS2026',
        entityType: item.entity_type,
        entityId: item.entity_id
      });
      return true;
    }

    return false;
  } catch (e: any) {
    console.error('[Media Vault] saveMediaVaultFile error:', e.message);
    return false;
  }
}
