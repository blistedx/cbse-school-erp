import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getMediaVaultFile, deleteMediaVaultFile, getMediaBinaryFilePath } from '@/lib/media';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';

function detectMimeType(buffer: Buffer, fallback?: string): string {
  if (buffer.length >= 4) {
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    // GIF: 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return 'image/gif';
    }
    // WebP: RIFF....WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer.length >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
  }

  // Check for SVG: starts with <svg or <?xml
  const head = buffer.slice(0, 250).toString('utf8').trim().toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return 'image/svg+xml';
  }

  if (fallback && fallback !== 'application/octet-stream') return fallback;
  return 'image/jpeg';
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const wantsJson = searchParams.get('redirect') === 'false' || req.headers.get('accept')?.includes('application/json');
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. FAST ZERO-LATENCY OFFLINE DISK CHECK (No network or remote MongoDB required)
    const localBinPath = getMediaBinaryFilePath(id);
    if (localBinPath && fs.existsSync(localBinPath)) {
      const fileBuffer = fs.readFileSync(localBinPath);
      const mimeType = detectMimeType(fileBuffer);

      if (wantsJson) {
        return NextResponse.json({
          success: true,
          id: id,
          url: `/api/media/${id}`,
          blob_url: `/api/media/${id}`,
          mime_type: mimeType,
          size_bytes: fileBuffer.length
        });
      }

      const uint8Array = new Uint8Array(fileBuffer);
      return new Response(uint8Array, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': String(uint8Array.byteLength),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Powered-By': 'Local-Media-Vault',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 2. CHECK LOCAL DISK METADATA JSON (Offline fallback without network)
    const localMetaPath = path.join(process.cwd(), 'data', 'media', `${safeId}.json`);
    if (fs.existsSync(localMetaPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(localMetaPath, 'utf8'));
        if (parsed.data) {
          let buffer: Buffer;
          let contentType = parsed.mime_type || 'image/jpeg';
          if (parsed.data.startsWith('data:')) {
            const parts = parsed.data.split(',');
            const match = parts[0].match(/:(.*?);/);
            if (match) contentType = match[1];
            buffer = Buffer.from(parts[1] || '', 'base64');
          } else {
            buffer = Buffer.from(parsed.data, 'base64');
          }
          contentType = detectMimeType(buffer, contentType);

          // Cache to bin file for next time
          try {
            const filesDir = path.join(process.cwd(), 'data', 'media', 'files');
            if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });
            fs.writeFileSync(path.join(filesDir, `${safeId}.bin`), buffer);
          } catch (_) {}

          const uint8Array = new Uint8Array(buffer);
          return new Response(uint8Array, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(uint8Array.byteLength),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Powered-By': 'Local-Media-Vault',
              'X-Content-Type-Options': 'nosniff'
            }
          });
        }
      } catch (_) {}
    }

    // 3. ONLY IF NOT ON LOCAL DISK: Query remote metadata & Vercel Blob
    const item = await getMediaVaultFile(id);

    // 4. If Vercel Blob live CDN URL exists, redirect directly
    const targetUrl = item?.blob_url || item?.url;
    if (targetUrl && targetUrl.startsWith('http')) {
      if (wantsJson) {
        return NextResponse.json(
          {
            success: true,
            id: item?.id || id,
            url: targetUrl,
            blob_url: targetUrl,
            mime_type: item?.mime_type,
            size_bytes: item?.size_bytes
          },
          {
            headers: {
              'X-Content-Type-Options': 'nosniff'
            }
          }
        );
      }

      // 307 Temporary Redirect preserves method and allows browser direct CDN fetch
      return NextResponse.redirect(targetUrl, {
        status: 307,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[API_MEDIA_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to retrieve media file' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const item = await getMediaVaultFile(id);
    if (!item) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Tenant isolation check
    const schoolCheck = resolveTenantSchoolId(auth, item.school_id);
    if (schoolCheck instanceof NextResponse) return schoolCheck;

    const deleted = await deleteMediaVaultFile(id);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Media removed from Vercel Blob and registry' : 'Failed to delete media'
    });
  } catch (error: any) {
    console.error('[API_MEDIA_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete media file' }, { status: 500 });
  }
}
