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

    // 5. BULLETPROOF EMBEDDED SVG FALLBACK (Never return broken image 404s for school/student/teacher icons)
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#122A24"/>
          <stop offset="100%" stop-color="#1C443A"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#g)" stroke="#D4AF37" stroke-width="6"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#D4AF37" stroke-width="2" stroke-dasharray="4,4"/>
      <path d="M100 35 L120 75 L165 75 L130 100 L145 145 L100 120 L55 145 L70 100 L35 75 L80 75 Z" fill="#D4AF37" opacity="0.25"/>
      <text x="100" y="90" font-size="32" font-family="Georgia, serif" font-weight="bold" fill="#D4AF37" text-anchor="middle">DPS</text>
      <text x="100" y="112" font-size="11" font-family="system-ui, sans-serif" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">SERVICE BEFORE SELF</text>
      <text x="100" y="132" font-size="10" font-family="system-ui, sans-serif" font-weight="600" fill="#a7f3d0" text-anchor="middle">DELHI PUBLIC SCHOOL</text>
      <circle cx="100" cy="155" r="4" fill="#D4AF37"/>
    </svg>`;
    const fallbackBuffer = Buffer.from(fallbackSvg, 'utf-8');
    const uint8Array = new Uint8Array(fallbackBuffer);
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Length': String(uint8Array.byteLength),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Powered-By': 'Local-Media-Vault-Fallback',
        'X-Content-Type-Options': 'nosniff'
      }
    });
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
