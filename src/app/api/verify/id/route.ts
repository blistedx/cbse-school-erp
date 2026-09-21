/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Public Digital ID Verification API */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeNoSqlInput } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    // Rate limit: Max 10 verification requests per minute per IP to prevent sequential scanning
    const rate = checkRateLimit(req, {
      bucketName: 'public-verify-id',
      maxAttempts: 10,
      windowMs: 60 * 1000,
      skipLocalhost: process.env.NODE_ENV !== 'production'
    });
    if (!rate.allowed) return rate.response!;

    const { searchParams } = new URL(req.url);
    const studentId = sanitizeNoSqlInput(searchParams.get('student_id') || searchParams.get('id') || '').trim();
    const admissionNo = sanitizeNoSqlInput(searchParams.get('admission_no') || searchParams.get('adm') || '').trim();
    const rawSchoolId = sanitizeNoSqlInput(searchParams.get('school_code') || searchParams.get('school_id') || searchParams.get('schoolId') || '').trim();
    const type = (searchParams.get('type') || 'STUDENT').toUpperCase();

    if (!rawSchoolId || (!studentId && !admissionNo)) {
      return NextResponse.json(
        { success: false, error: 'School Code and valid ID / Admission Number are required for verification.' },
        { status: 400 }
      );
    }

    // 1. Resolve Target School
    const school = (await Database.getSchoolByCode(rawSchoolId)) || (await Database.getSchoolById(rawSchoolId));
    if (!school || school.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Institution record not found or inactive.' },
        { status: 404 }
      );
    }

    if (type === 'EMPLOYEE' || type === 'TEACHER' || type === 'FACULTY') {
      const allTeachers = await Database.getTeachers(school.id);
      const teacher = allTeachers.find(t => {
        const matchId = studentId && (t.id === studentId);
        const matchCode = admissionNo && ((t.employee_code || t.staff_code || t.id)?.toLowerCase().trim() === admissionNo.toLowerCase().trim());
        return matchId || matchCode;
      });

      if (!teacher || teacher.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, verified: false, error: 'Credential could not be verified in the school registry.' },
          { status: 404 }
        );
      }

      // Minimal non-sensitive public verification details only
      return NextResponse.json({
        success: true,
        verified: true,
        type: 'FACULTY',
        verified_at: new Date().toISOString(),
        institution: {
          school_name: school.school_name,
          school_code: school.school_code,
          board: school.board || 'CBSE'
        },
        record: {
          full_name: teacher.full_name,
          designation: teacher.designation || 'Faculty',
          department: teacher.department || 'Academics',
          status: 'ACTIVE'
        }
      });
    }

    // Default: Student Profile Lookup
    const allStudents = await Database.getStudents(school.id);
    const student = allStudents.find(s => {
      const matchId = studentId && (s.id === studentId);
      const matchAdm = admissionNo && (s.admission_no?.toLowerCase().trim() === admissionNo.toLowerCase().trim());
      return matchId || matchAdm;
    });

    if (!student || student.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, verified: false, error: 'Student credential could not be verified in the school registry.' },
        { status: 404 }
      );
    }

    // Minimal non-sensitive public verification details only
    return NextResponse.json({
      success: true,
      verified: true,
      type: 'STUDENT',
      verified_at: new Date().toISOString(),
      institution: {
        school_name: school.school_name,
        school_code: school.school_code,
        board: school.board || 'CBSE'
      },
      record: {
        full_name: student.full_name,
        class_name: student.class_name,
        section: student.section,
        academic_session: student.academic_session || '2026-27',
        status: 'ACTIVE'
      }
    });
  } catch (error: any) {
    console.error('[API_VERIFY_ID_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal error verifying credential.' },
      { status: 500 }
    );
  }
}
