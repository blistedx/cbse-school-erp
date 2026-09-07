import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { sendPasswordResetEmail, maskEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req, {
      bucketName: 'auth-forgot-passcode',
      maxAttempts: 8,
      windowMs: 10 * 60 * 1000
    });
    if (!rate.allowed) return rate.response!;

    const body = await req.json();
    const { school_code, username, account_type } = body;

    const rawSchoolCode = (school_code || '').toString().trim().toUpperCase();
    const rawUsername = (username || '').toString().trim();
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
        return NextResponse.json(
          { success: false, error: `Invalid Agency Superadmin ID "${rawUsername}".` },
          { status: 400 }
        );
      }

      // Generate a secure 6-digit numeric temporary passcode
      const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();

      // Persist the newly generated passcode into agency settings
      await Database.updateAgencyPassword(newPasscode);

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

      if (!emailResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: `Passcode generated, but failed to deliver email: ${emailResult.message}`
          },
          { status: 500 }
        );
      }

      resetRateLimit('auth-forgot-passcode', req);

      return NextResponse.json({
        success: true,
        message: `A new master passcode has been generated and dispatched to ${maskedEmail}.`,
        target_email: maskedEmail,
        masked_email: maskedEmail,
        account_name: 'BlistedX (Agency Superadmin)',
        account_role: 'Agency Superadmin (God Access)',
        is_agency: true
      });
    }

    // 1. SCHOOL USER FORGOT PASSCODE FLOW
    if (!rawSchoolCode) {
      return NextResponse.json(
        { success: false, error: 'School Code is required to reset passcode.' },
        { status: 400 }
      );
    }

    if (!rawUsername) {
      return NextResponse.json(
        { success: false, error: 'User ID / Admission No / Staff Code is required.' },
        { status: 400 }
      );
    }

    // Locate the school
    const school = await Database.getSchoolByCode(rawSchoolCode);
    if (!school || school.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `No active school found with School Code "${rawSchoolCode}".` },
        { status: 404 }
      );
    }

    // Generate a secure 6-digit numeric temporary passcode
    const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();

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

    // 2. Check Primary School Administrator / Principal
    const expectedAdminId = (school.admin_id || '').trim().toUpperCase();
    const isPrimaryAdmin =
      (Boolean(expectedAdminId) && uname === expectedAdminId) ||
      uname === (school.school_code || '').trim().toUpperCase() ||
      uname === 'ADMIN' ||
      uname === 'PRINCIPAL' ||
      uname === 'SUPERADMIN';

    if (isPrimaryAdmin) {
      await Database.updateSchoolSettings(school.id, { admin_pin: newPasscode });
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
        await Database.updateTeacher(matchedTeacher.id, { passcode: newPasscode });
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
        await Database.updateStudent(matchedStudent.id, { passcode: newPasscode });
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
      return NextResponse.json(
        {
          success: false,
          error: `No user account found matching "${rawUsername}" under ${school.school_name} (${school.school_code}).`
        },
        { status: 404 }
      );
    }

    // 5. Send notification email to blistedx@gmail.com
    const emailResult = await sendPasswordResetEmail(emailPayload);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Passcode updated, but failed to send email: ${emailResult.message}`
        },
        { status: 500 }
      );
    }

    // Reset rate limiter on valid request
    resetRateLimit('auth-forgot-passcode', req);

    const rawTargetEmail = emailPayload.userEmail || 'blistedx@gmail.com';
    const maskedEmail = maskEmail(rawTargetEmail);

    return NextResponse.json({
      success: true,
      message: `A new passcode has been generated and sent to ${maskedEmail}`,
      target_email: maskedEmail,
      masked_email: maskedEmail,
      account_name: emailPayload.userName,
      account_role: emailPayload.userRole,
      is_agency: false
    });
  } catch (err: any) {
    console.error('[AUTH_FORGOT_PASSCODE_ERROR]', err);
    return NextResponse.json(
      { success: false, error: `Passcode reset error: ${err?.message || 'Server error'}` },
      { status: 500 }
    );
  }
}
