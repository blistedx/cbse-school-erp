/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    const body = await req.json();

    const isAgencyAdmin = roleHeader === 'AGENCY_SUPERADMIN';

    // 1. Authorization Guard
    if (!isAgencyAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only Agency Superadmin can execute whole-school data purges.' },
        { status: 403 }
      );
    }

    const { school_id, school_code, captcha_input, expected_captcha, confirmation_text } = body;

    if (!school_id) {
      return NextResponse.json(
        { success: false, error: 'School ID or School Code is required.' },
        { status: 400 }
      );
    }

    // 2. Captcha Verification Challenge
    const cleanInputCaptcha = (captcha_input || '').trim().toUpperCase();
    const cleanExpectedCaptcha = (expected_captcha || '').trim().toUpperCase();

    if (!cleanInputCaptcha || cleanInputCaptcha !== cleanExpectedCaptcha) {
      return NextResponse.json(
        { success: false, error: 'Captcha verification failed. Please enter the exact Captcha code shown.' },
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
