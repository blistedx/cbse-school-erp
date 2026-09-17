/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Public Digital ID Verification API */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id') || searchParams.get('id') || '';
    const admissionNo = searchParams.get('admission_no') || searchParams.get('adm') || '';
    const rawSchoolId = searchParams.get('school_id') || searchParams.get('schoolId') || 'DPS2026';
    const type = (searchParams.get('type') || 'STUDENT').toUpperCase();

    if (!studentId && !admissionNo) {
      return NextResponse.json(
        { success: false, error: 'Student ID or Admission Number is required for verification.' },
        { status: 400 }
      );
    }

    // 1. Resolve Target School
    const school = await Database.getSchoolById(rawSchoolId);
    const targetSchoolId = school?.school_code || school?.id || rawSchoolId;

    if (type === 'EMPLOYEE' || type === 'TEACHER' || type === 'FACULTY') {
      const allTeachers = await Database.getTeachers(targetSchoolId);
      const teacher = allTeachers.find(t => {
        const matchId = studentId && (t.id === studentId || (t as any)._id?.toString() === studentId);
        const matchCode = admissionNo && ((t.employee_code || t.id)?.toLowerCase().trim() === admissionNo.toLowerCase().trim());
        return matchId || matchCode;
      });

      if (!teacher) {
        return NextResponse.json(
          { success: false, error: 'Faculty record not found in school registry.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        type: 'EMPLOYEE',
        verified: true,
        verified_at: new Date().toISOString(),
        school: {
          name: school?.school_name || 'Delhi Public School',
          code: targetSchoolId,
          affiliation_no: school?.affiliation_no || '2130042',
          address: school?.address || 'Dwarka, New Delhi',
          city: school?.city || 'Delhi',
          phone: school?.phone || '+91 11 2789 0000',
          email: school?.email || 'contact@school.edu'
        },
        profile: {
          id: teacher.id,
          employee_code: teacher.employee_code || teacher.id,
          full_name: teacher.full_name,
          designation: teacher.designation || 'Faculty',
          department: teacher.department || 'Academics',
          qualification: teacher.qualification || 'Post Graduate',
          date_of_joining: teacher.date_of_joining || '01-Jul-2021',
          blood_group: teacher.blood_group || 'B+',
          phone: teacher.phone || '+91 98765 00000',
          email: teacher.email || 'faculty@school.edu',
          photo: teacher.photo || teacher.avatar || null,
          status: 'ACTIVE'
        }
      });
    }

    // Default: Student Profile Lookup
    const allStudents = await Database.getStudents(targetSchoolId);
    const student = allStudents.find(s => {
      const matchId = studentId && (s.id === studentId || (s as any)._id?.toString() === studentId);
      const matchAdm = admissionNo && (s.admission_no?.toLowerCase().trim() === admissionNo.toLowerCase().trim());
      return matchId || matchAdm;
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student record not found in school registry.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      type: 'STUDENT',
      verified: true,
      verified_at: new Date().toISOString(),
      school: {
        name: school?.school_name || 'Delhi Public School',
        code: targetSchoolId,
        affiliation_no: school?.affiliation_no || '2130042',
        address: school?.address || 'Dwarka, New Delhi',
        city: school?.city || 'Delhi',
        phone: school?.phone || '+91 11 2789 0000',
        email: school?.email || 'contact@school.edu'
      },
      profile: {
        id: student.id,
        admission_no: student.admission_no || student.id,
        full_name: student.full_name,
        class_name: student.class_name || 'Class 10',
        section: student.section || 'A',
        roll_no: student.roll_no || '1',
        dob: student.dob || '14-Aug-2012',
        gender: student.gender || 'Male',
        blood_group: student.blood_group || 'O+',
        house: student.house || 'Blue House',
        guardian_name: student.father_name || student.guardian_name || 'Mr. Sharma',
        guardian_phone: student.guardian_phone || student.parent_phone || student.phone || '+91 98110 00000',
        address: student.address || school?.city || 'Dwarka, New Delhi',
        academic_session: student.academic_session || '2026-27',
        photo: student.photo || student.avatar || null,
        status: student.status || 'ACTIVE'
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
