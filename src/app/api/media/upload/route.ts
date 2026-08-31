import { NextResponse } from 'next/server';
import { saveMediaVaultFile } from '@/lib/media';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, school_id, entity_type, entity_id, filename, mime_type, data } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Media ID and data are required' }, { status: 400 });
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
