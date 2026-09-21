/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Database } from '@/lib/db';
import { getDatabase } from '@/lib/mongodb';
import { requireRole } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/rate-limiter';
import { sanitizeNoSqlInput } from '@/lib/validation-schemas';

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Purge action requires POST with AGENCY_SUPERADMIN credentials.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function POST(req: Request) {
  try {
    // Strictly restrict to AGENCY_SUPERADMIN
    const auth = requireRole(req, ['AGENCY_SUPERADMIN']);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json().catch(() => ({}));
    const body = sanitizeNoSqlInput(rawBody);

    const { school_id, school_code, confirm_school_code, confirmation_text } = body;

    const targetSchoolId = (school_id || school_code || '').trim().toUpperCase();
    const cleanConfirmCode = (confirm_school_code || '').trim().toUpperCase();

    if (!targetSchoolId) {
      return NextResponse.json(
        { success: false, error: 'School ID or School Code is required.' },
        { status: 400 }
      );
    }

    // Require explicit confirmation field matching school code
    if (!cleanConfirmCode || (cleanConfirmCode !== targetSchoolId && cleanConfirmCode !== (school_code || '').trim().toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Explicit confirmation required: Please type the exact school code "${targetSchoolId}" in the confirm_school_code field.`
        },
        { status: 400 }
      );
    }

    // Require explicit "DELETE <SCHOOL_CODE>" confirmation keyword
    const expectedKeyword = `DELETE ${targetSchoolId}`;
    const actualKeyword = (confirmation_text || '').trim().toUpperCase();
    if (actualKeyword !== expectedKeyword && actualKeyword !== `DELETE ${(school_code || '').trim().toUpperCase()}`) {
      return NextResponse.json(
        {
          success: false,
          error: `Confirmation keyword mismatch. You must type "${expectedKeyword}" to confirm permanent purge.`
        },
        { status: 400 }
      );
    }

    // Execute purge
    const result = await Database.purgeSchoolData(targetSchoolId);

    // Write audit log entry
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('audit_logs').insertOne({
          id: `AUD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          action: 'PURGE_SCHOOL',
          school_id: targetSchoolId,
          school_code: result?.school_code || targetSchoolId,
          actor_id: auth.userId,
          actor_role: auth.role,
          ip_address: getClientIp(req),
          timestamp: new Date().toISOString(),
          details: {
            school_name: result?.school_name,
            result
          }
        });
      }
    } catch (auditErr) {
      console.error('[PURGE_AUDIT_LOG_ERROR]', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `School "${result.school_name}" [${result.school_code}] and all its associated records have been permanently purged.`,
      result
    });
  } catch (error: any) {
    console.error('[PURGE_SCHOOL_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred while purging the school.' },
      { status: 500 }
    );
  }
}
