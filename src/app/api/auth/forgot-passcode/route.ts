import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Database, hashPassword } from '@/lib/db';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { sendPasswordResetEmail, maskEmail } from '@/lib/email';
import { validateBody, forgotPasscodeSchema, sanitizeNoSqlInput } from '@/lib/validation-schemas';

const UNIFORM_RESET_RESPONSE = 'If the provided credentials match an active account, a password reset notification has been dispatched to the registered contact on file.';

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req, {
      bucketName: 'auth-forgot-passcode',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      skipLocalhost: process.env.NODE_ENV !== 'production'
    });
    if (!rate.allowed) return rate.response!;

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const validation = validateBody(forgotPasscodeSchema, sanitizeNoSqlInput(rawBody));
    if (!validation.success) {
      return validation.response;
    }

    const { school_code, username, account_type } = validation.data;
    const rawSchoolCode = (school_code || '').trim().toUpperCase();
    const rawUsername = (username || '').trim();
    const uname = rawUsername.toUpperCase();

    // 0. AGENCY SUPERADMIN FORGOT PASSCODE FLOW
    const isAgencyRequest =
      account_type === 'AGENCY_ADMIN' ||
      account_type === 'AGENCY' ||
      uname === 'BLISTEDX' ||
      rawSchoolCode === 'SYSTEM' ||
      rawSchoolCode === 'AGENCY';

    if (isAgencyRequest) {
      const isAgencyUser =
        !rawUsername ||
        uname === 'BLISTEDX' ||
        uname === 'ADMIN' ||
        uname === 'SUPERADMIN' ||
        uname === 'AGENCY' ||
        uname === 'BLISTEDX@GMAIL.COM';

      if (!isAgencyUser) {
        return NextResponse.json({
          success: true,
          message: UNIFORM_RESET_RESPONSE
        });
      }

      // Cryptographically secure 6-digit temporary passcode generator
      const newPasscode = crypto.randomInt(100000, 1000000).toString();
      const agencyEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'blistedx@gmail.com';
      const maskedEmail = maskEmail(agencyEmail);

      const emailResult = await sendPasswordResetEmail({
        schoolName: 'Giterp Central Agency Platform',
        schoolCode: 'SYSTEM (AGENCY)',
        userId: 'BLISTEDX',
        userName: 'BlistedX (Agency Superadmin)',
        userRole: 'Agency Superadmin (God Access)',
        newPasscode,
        userEmail: agencyEmail,
        isAgencySuperAdmin: true
      });

      if (emailResult.success) {
        const hashedPasscode = await hashPassword(newPasscode);
        await Database.updateAgencyPassword(hashedPasscode);
        resetRateLimit('auth-forgot-passcode', req);
      }

      return NextResponse.json({
        success: true,
        message: UNIFORM_RESET_RESPONSE,
        target_email: maskedEmail,
        is_agency: true
      });
    }

    // 1. SCHOOL USER FORGOT PASSCODE FLOW
    if (!rawSchoolCode || !rawUsername) {
      return NextResponse.json({
        success: true,
        message: UNIFORM_RESET_RESPONSE
      });
    }

    // Locate the school
    const school = await Database.getSchoolByCode(rawSchoolCode);
    if (!school || school.status !== 'ACTIVE') {
      return NextResponse.json({
        success: true,
        message: UNIFORM_RESET_RESPONSE
      });
    }

    // Cryptographically secure 6-digit temporary passcode generator
    const newPasscode = crypto.randomInt(100000, 1000000).toString();

    let emailPayload: {
      schoolName: string;
      schoolCode: string;
      userId: string;
      userName: string;
      userRole: string;
      newPasscode: string;
      userEmail?: string;
      userPhone?: string;
    } | null = null;
    let matchedType: 'admin' | 'teacher' | 'student' | null = null;
    let matchedRecordId: string | null = null;

    // 2. Check Primary School Administrator / Principal
    const expectedAdminId = (school.admin_id || '').trim().toUpperCase();
    const isPrimaryAdmin =
      (Boolean(expectedAdminId) && uname === expectedAdminId) ||
      uname === (school.school_code || '').trim().toUpperCase() ||
      uname === 'ADMIN' ||
      uname === 'PRINCIPAL' ||
      uname === 'SUPERADMIN';

    if (isPrimaryAdmin) {
      matchedType = 'admin';
      matchedRecordId = school.id;
      emailPayload = {
        schoolName: school.school_name,
        schoolCode: school.school_code,
        userId: rawUsername,
        userName: school.admin_name || school.principal_name || 'School Administrator',
        userRole: 'Administrator / Principal',
        newPasscode,
        userEmail: school.email || `admin@${school.school_code.toLowerCase()}.edu`,
        userPhone: school.phone
      };
    }

    // 3. Check Faculty & Staff (Teachers, Coordinators, Staff)
    if (!emailPayload) {
      const allTeachers = await Database.getTeachers(school.id);
      const matchedTeacher = allTeachers.find(
        t => (t.staff_code || '').trim().toUpperCase() === uname ||
             (t.id || '').trim().toUpperCase() === uname ||
             (t.email || '').trim().toUpperCase() === uname ||
             (t.phone || '').trim() === uname
      );

      if (matchedTeacher) {
        matchedType = 'teacher';
        matchedRecordId = matchedTeacher.id;
        emailPayload = {
          schoolName: school.school_name,
          schoolCode: school.school_code,
          userId: matchedTeacher.staff_code || matchedTeacher.id,
          userName: matchedTeacher.full_name,
          userRole: matchedTeacher.designation || 'Faculty / Teacher',
          newPasscode,
          userEmail: matchedTeacher.email,
          userPhone: matchedTeacher.phone
        };
      }
    }

    // 4. Check Student or Parent
    if (!emailPayload) {
      const allStudents = await Database.getStudents(school.id);
      const matchedStudent = allStudents.find(
        s => (s.admission_no || '').trim().toUpperCase() === uname ||
             (s.id || '').trim().toUpperCase() === uname ||
             (s.guardian_phone || '').trim() === uname
      );

      if (matchedStudent) {
        matchedType = 'student';
        matchedRecordId = matchedStudent.id;
        emailPayload = {
          schoolName: school.school_name,
          schoolCode: school.school_code,
          userId: matchedStudent.admission_no || matchedStudent.id,
          userName: matchedStudent.full_name,
          userRole: `Student (${matchedStudent.class_name || (matchedStudent as any).class || 'N/A'}${matchedStudent.section ? '-' + matchedStudent.section : ''})`,
          newPasscode,
          userEmail: matchedStudent.email,
          userPhone: matchedStudent.guardian_phone || matchedStudent.phone
        };
      }
    }

    if (!emailPayload) {
      return NextResponse.json({
        success: true,
        message: UNIFORM_RESET_RESPONSE
      });
    }

    // 5. Send notification email with temporary passcode
    const emailResult = await sendPasswordResetEmail(emailPayload);

    if (emailResult.success) {
      const hashedPasscode = await hashPassword(newPasscode);
      if (matchedType === 'admin' && matchedRecordId) {
        await Database.updateSchoolSettings(matchedRecordId, { admin_pin: hashedPasscode, must_change_password: true });
      } else if (matchedType === 'teacher' && matchedRecordId) {
        await Database.updateTeacher(matchedRecordId, { passcode: hashedPasscode, must_change_password: true });
      } else if (matchedType === 'student' && matchedRecordId) {
        await Database.updateStudent(matchedRecordId, { passcode: hashedPasscode, must_change_password: true });
      }
      resetRateLimit('auth-forgot-passcode', req);
    }

    const rawTargetEmail = emailPayload.userEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'blistedx@gmail.com';
    const maskedEmail = maskEmail(rawTargetEmail);

    return NextResponse.json({
      success: true,
      message: UNIFORM_RESET_RESPONSE,
      target_email: maskedEmail,
      is_agency: false
    });
  } catch (err: any) {
    console.error('[AUTH_FORGOT_PASSCODE_ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process passcode reset request.' },
      { status: 500 }
    );
  }
}
