/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Database } from '@/lib/db';
import { requireRole, AGENCY_ONLY } from '@/lib/auth-guard';

function getCaptchaSecret(): string {
  const secret = (process.env.SESSION_SECRET || '').replace(/^["']|["']$/g, '').trim();
  if (!secret) {
    throw new Error('[SECURITY FATAL]: SESSION_SECRET is not configured.');
  }
  return secret;
}

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, AGENCY_ONLY);
    if (auth instanceof NextResponse) return auth;

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(crypto.randomInt(0, chars.length));
    }
    const timestamp = Date.now().toString();
    const sig = crypto.createHmac('sha256', getCaptchaSecret()).update(`${code}:${timestamp}`).digest('hex');
    const token = `${timestamp}.${sig}`;

    return NextResponse.json({
      success: true,
      captcha_code: code,
      captcha_token: token
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate captcha challenge.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, AGENCY_ONLY);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();

    const { school_id, school_code, captcha_input, captcha_token, confirmation_text } = body;

    if (!school_id) {
      return NextResponse.json(
        { success: false, error: 'School ID or School Code is required.' },
        { status: 400 }
      );
    }

    // 2. Cryptographic Server-Side Captcha Verification
    const cleanInput = (captcha_input || '').trim().toUpperCase();
    if (!cleanInput || !captcha_token || typeof captcha_token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Captcha verification failed. Please complete the captcha challenge.' },
        { status: 400 }
      );
    }

    const [timestampStr, clientSig] = captcha_token.split('.');
    if (!timestampStr || !clientSig) {
      return NextResponse.json(
        { success: false, error: 'Invalid captcha token format.' },
        { status: 400 }
      );
    }

    const tokenAge = Date.now() - Number(timestampStr);
    if (isNaN(tokenAge) || tokenAge < 0 || tokenAge > 5 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: 'Captcha has expired. Please refresh the captcha.' },
        { status: 400 }
      );
    }

    const expectedSig = crypto.createHmac('sha256', getCaptchaSecret()).update(`${cleanInput}:${timestampStr}`).digest('hex');
    const bufClient = Buffer.from(clientSig);
    const bufExpected = Buffer.from(expectedSig);

    if (bufClient.length !== bufExpected.length || !crypto.timingSafeEqual(bufClient, bufExpected)) {
      return NextResponse.json(
        { success: false, error: 'Incorrect captcha entered. Please try again.' },
        { status: 400 }
      );
    }

    // 3. Double-Confirmation Keyword Verification
    const expectedConfirm = `DELETE ${(school_code || '').trim().toUpperCase()}`;
    const actualConfirm = (confirmation_text || '').trim().toUpperCase();

    if (actualConfirm !== expectedConfirm && actualConfirm !== `DELETE ${(school_id || '').trim().toUpperCase()}`) {
      return NextResponse.json(
        { success: false, error: `Confirmation keyword mismatch. You must type "${expectedConfirm}" to confirm permanent purge.` },
        { status: 400 }
      );
    }

    // 4. Execute Dual Database Purge (MongoDB Atlas + Local DB)
    const result = await Database.purgeSchoolData(school_id);

    return NextResponse.json({
      success: true,
      message: `School "${result.school_name}" [${result.school_code}] and all its records have been permanently purged from both MongoDB Atlas and Local DB.`,
      result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred while purging the school.' },
      { status: 500 }
    );
  }
}
