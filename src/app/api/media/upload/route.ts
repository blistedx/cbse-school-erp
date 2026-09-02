/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { saveMediaVaultFile } from '@/lib/media';
import { requireAuth } from '@/lib/auth-guard';

// Allowed MIME types — prevents SVG/HTML/script injection
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf'
]);

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { id, school_id, entity_type, entity_id, filename, mime_type, data } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Media ID and data are required' }, { status: 400 });
    }

    // Detect MIME from base64 data URL prefix or supplied mime_type
    let effectiveMime = mime_type || 'image/jpeg';
    if (typeof data === 'string' && data.startsWith('data:')) {
      const match = data.match(/^data:([^;]+);/);
      if (match) effectiveMime = match[1];
    }
    if (!ALLOWED_MIME_TYPES.has(effectiveMime)) {
      return NextResponse.json(
        { success: false, error: `File type "${effectiveMime}" is not allowed. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}` },
        { status: 400 }
      );
    }

    const saved = await saveMediaVaultFile({
      id,
      school_id: school_id || 'DPS2026',
      entity_type: entity_type || 'STUDENT_PHOTO',
      entity_id,
      filename,
      mime_type: mime_type || 'image/jpeg',
      data
    });

    if (saved) {
      return NextResponse.json({
        success: true,
        media_id: id,
        url: `/api/media/${id}`
      });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to write to Local Media Vault' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
