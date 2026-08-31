import { NextResponse } from 'next/server';
import { getMediaVaultFile } from '@/lib/media';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const item = await getMediaVaultFile(id);
    if (!item || !item.data) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Handle Base64 Data URL or Raw Base64 string
    let buffer: Buffer;
    let contentType = item.mime_type || 'image/jpeg';

    if (item.data.startsWith('data:')) {
      const parts = item.data.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) contentType = match[1];
      buffer = Buffer.from(parts[1], 'base64');
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
        'X-Powered-By': 'Local-MediaVault'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
