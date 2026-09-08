import { NextResponse } from 'next/server';
import { uploadToVercelBlob } from '@/lib/media';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { validateBody, uploadMediaSchema } from '@/lib/validation-schemas';

// Maximum allowed upload size: 200 Kilobytes (Ideal recommended size: 100 KB - 200 KB)
const MAX_UPLOAD_BYTES = 200 * 1024;
const MIN_RECOMMENDED_BYTES = 50 * 1024; // 50 KB minimum for clear clarity

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf'
]);

/**
 * Validates actual binary content using magic bytes.
 * Prevents disguised files, executable payloads, or polyglot scripts.
 */
function detectMimeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 &&
    buffer[3] === 0x38 && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return 'image/gif';
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // PDF: %PDF-
  if (
    buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(uploadMediaSchema, rawBody);
    if (!validation.success) return validation.response;
    const body = validation.data;

    // 1. Tenant Isolation
    const schoolId = resolveTenantSchoolId(auth, body.school_id);
    if (schoolId instanceof NextResponse) return schoolId;

    // 2. Decode raw base64 or Data URL to buffer
    let buffer: Buffer;
    let declaredMime = body.mime_type || 'image/jpeg';

    if (body.data.startsWith('data:')) {
      const match = body.data.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) {
        return NextResponse.json(
          { success: false, error: 'Invalid data URL format. Expected data:[mime];base64,[content]' },
          { status: 400 }
        );
      }
      declaredMime = match[1].toLowerCase();
      buffer = Buffer.from(match[2], 'base64');
    } else {
      buffer = Buffer.from(body.data, 'base64');
    }

    // 3. File Size Verification (Strict 200 KB limit, recommended 100 KB - 200 KB)
    if (buffer.length > MAX_UPLOAD_BYTES) {
      const sizeKb = (buffer.length / 1024).toFixed(1);
      return NextResponse.json(
        {
          success: false,
          error: `File size (${sizeKb} KB) exceeds maximum allowed limit of 200 KB. Please upload an image between 100 KB and 200 KB for optimal speed and passport photo clarity.`
        },
        { status: 413 }
      );
    }

    // 4. Magic Bytes Inspection
    const detectedMime = detectMimeFromMagicBytes(buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file signature. Only legitimate JPEG, PNG, GIF, WebP images and PDF documents are allowed.'
        },
        { status: 400 }
      );
    }

    // Normalize declared MIME (allow image/jpg to match image/jpeg)
    const normalizedDeclared = declaredMime === 'image/jpg' ? 'image/jpeg' : declaredMime;
    if (normalizedDeclared !== detectedMime) {
      return NextResponse.json(
        {
          success: false,
          error: `MIME type mismatch: declared '${declaredMime}' does not match verified file content '${detectedMime}'.`
        },
        { status: 400 }
      );
    }

    // 5. Upload buffer directly to Vercel Blob and persist lightweight metadata (ZERO binary in MongoDB)
    const mediaItem = await uploadToVercelBlob({
      id: body.id,
      filename: body.filename || `${body.id}.${detectedMime.split('/')[1] || 'jpg'}`,
      buffer,
      mimeType: detectedMime,
      schoolId: schoolId || 'DPS2026',
      entityType: body.entity_type,
      entityId: body.entity_id,
      uploadedBy: auth.userId
    });

    return NextResponse.json({
      success: true,
      media_id: body.id,
      size_bytes: buffer.length,
      mime_type: detectedMime,
      url: mediaItem.url,
      blob_url: mediaItem.blob_url
    });
  } catch (error: any) {
    console.error('[API_MEDIA_UPLOAD_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
