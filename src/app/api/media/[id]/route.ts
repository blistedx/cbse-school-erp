/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getMediaVaultFile, deleteMediaVaultFile } from '@/lib/media';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const item = await getMediaVaultFile(id);
    if (!item) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const wantsJson = searchParams.get('redirect') === 'false' || req.headers.get('accept')?.includes('application/json');

    // 1. If Vercel Blob URL exists, redirect directly to high-speed CDN
    const targetUrl = item.blob_url || item.url;
    if (targetUrl) {
      if (wantsJson) {
        return NextResponse.json(
          {
            success: true,
            id: item.id,
            url: targetUrl,
            blob_url: targetUrl,
            mime_type: item.mime_type,
            size_bytes: item.size_bytes
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

    // 2. Legacy fallback if record only had raw base64 data
    if (item.data) {
      let buffer: Buffer;
      let contentType = item.mime_type || 'image/jpeg';

      if (item.data.startsWith('data:')) {
        const parts = item.data.split(',');
        const match = parts[0].match(/:(.*?);/);
        if (match) contentType = match[1];
        buffer = Buffer.from(parts[1] || '', 'base64');
      } else {
        buffer = Buffer.from(item.data, 'base64');
      }

      const uint8Array = new Uint8Array(buffer);
      return new Response(uint8Array, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(uint8Array.byteLength),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Powered-By': 'Vercel-Blob-Vault',
          'X-Content-Type-Options': 'nosniff'
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
