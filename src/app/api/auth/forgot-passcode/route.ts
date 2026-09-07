/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req, {
      bucketName: 'auth-forgot-passcode',
      maxAttempts: 6,
      windowMs: 10 * 60 * 1000
    });
    if (!rate.allowed) return rate.response!;

    const body = await req.json();
    const { school_code, username } = body;

    const rawSchoolCode = (school_code || '').toString().trim().toUpperCase();
    const rawUsername = (username || '').toString().trim();

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

    // 1. Locate the school
    const school = await Database.getSchoolByCode(rawSchoolCode);
    if (!school || school.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `No active school found with School Code "${rawSchoolCode}".` },
        { status: 404 }
      );
    }

    const uname = rawUsername.toUpperCase();

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

    return NextResponse.json({
      success: true,
      message: `A new passcode has been generated and sent to blistedx@gmail.com`,
      target_email: 'blistedx@gmail.com',
      account_name: emailPayload.userName,
      account_role: emailPayload.userRole
    });
  } catch (err: any) {
    console.error('[AUTH_FORGOT_PASSCODE_ERROR]', err);
    return NextResponse.json(
      { success: false, error: `Passcode reset error: ${err?.message || 'Server error'}` },
      { status: 500 }
    );
  }
}
