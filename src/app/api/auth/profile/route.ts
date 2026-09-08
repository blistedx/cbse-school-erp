/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

/**
 * GET /api/auth/profile
 * Returns the profile of the currently logged-in user according to their role.
 */
export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId, role, schoolId } = auth;

    if (role === 'TEACHER') {
      const teachers = await Database.getTeachers(schoolId);
      const teacher = teachers.find(t => t.id === userId || t.staff_code === userId);
      if (!teacher) {
        return NextResponse.json({ success: false, error: 'Teacher record not found.' }, { status: 404 });
      }

      // Return safe teacher profile without exposing password hashes or admin PIN
      return NextResponse.json({
        success: true,
        role: 'TEACHER',
        profile: {
          id: teacher.id,
          staff_code: teacher.staff_code,
          full_name: teacher.full_name,
          department: teacher.department,
          designation: teacher.designation,
          email: teacher.email,
          phone: teacher.phone,
          qualification: teacher.qualification,
          subject_specialization: teacher.subject_specialization,
          status: teacher.status,
          avatar: teacher.avatar || teacher.photo || '',
          photo: teacher.photo || teacher.avatar || ''
        }
      });
    }

    if (role === 'STUDENT' || role === 'PARENT') {
      const students = await Database.getStudents(schoolId);
      const student = students.find(s => s.id === userId || s.admission_no === userId);
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student record not found.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        role,
        profile: {
          id: student.id,
          admission_no: student.admission_no,
          full_name: student.full_name,
          class_name: student.class_name,
          section: student.section,
          roll_no: student.roll_no,
          guardian_name: student.guardian_name,
          guardian_phone: student.guardian_phone,
          avatar: student.avatar || student.photo || '',
          photo: student.photo || student.avatar || ''
        }
      });
    }

    // Principal / Admin / Superadmin
    const school = await Database.getSchoolById(schoolId);
    let principalAvatar = (school as any)?.principal_avatar || (school as any)?.avatar || (school as any)?.photo || '';
    if (!principalAvatar && schoolId) {
      const teachers = await Database.getTeachers(schoolId);
      const prinTeacher = teachers.find(t => t.staff_code === 'PRIN01' || t.id === 'TCH-PRIN-DPS2026' || (t.full_name && t.full_name.includes('Abhishek')));
      if (prinTeacher?.avatar || prinTeacher?.photo) {
        principalAvatar = prinTeacher.avatar || prinTeacher.photo || '';
      }
    }

    return NextResponse.json({
      success: true,
      role,
      profile: {
        id: school?.admin_id || 'admin',
        username: school?.admin_id || 'admin',
        full_name: school?.principal_name || school?.admin_name || 'School Administrator',
        email: school?.email || `admin@${(school?.school_code || 'dps2026').toLowerCase()}.edu`,
        phone: school?.phone || '',
        admin_pin_configured: Boolean(school?.admin_pin),
        avatar: principalAvatar,
        photo: principalAvatar
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/auth/profile
 * Updates the user's own profile and/or personal password.
 * CRITICAL SECURITY:
 * Teachers can ONLY update their own teacher record (passcode, full_name, email, phone).
 * They CANNOT view or modify the School Admin Master PIN (`admin_pin`) or Principal credentials.
 */
export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { userId, role, schoolId } = auth;
    const { full_name, email, phone, new_password, avatar, photo } = body;

    // Validate avatar size if provided as base64 (Max 200 KB)
    const rawPic = avatar || photo;
    if (rawPic && typeof rawPic === 'string' && rawPic.startsWith('data:')) {
      const base64Part = rawPic.split(',')[1] || '';
      const estimatedBytes = Math.ceil((base64Part.length * 3) / 4);
      if (estimatedBytes > 200 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: `Profile picture (${(estimatedBytes / 1024).toFixed(1)} KB) exceeds maximum allowed limit of 200 KB. Please upload an image between 100 KB and 200 KB.`
          },
          { status: 400 }
        );
      }
    }

    // 1. TEACHER PERSONAL CREDENTIAL UPDATE
    if (role === 'TEACHER') {
      const teachers = await Database.getTeachers(schoolId);
      const teacher = teachers.find(t => t.id === userId || t.staff_code === userId);
      if (!teacher) {
        return NextResponse.json({ success: false, error: 'Teacher account not found.' }, { status: 404 });
      }

      const updates: any = {};
      if (full_name && full_name.trim()) updates.full_name = full_name.trim();
      if (email !== undefined) updates.email = email.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (new_password && new_password.trim()) {
        updates.passcode = new_password.trim();
      }
      if (rawPic !== undefined) {
        updates.avatar = rawPic;
        updates.photo = rawPic;
      }

      const updatedTeacher = await Database.updateTeacher(teacher.id, updates);

      return NextResponse.json({
        success: true,
        message: new_password
          ? 'Your teacher profile and personal login passcode have been updated successfully!'
          : 'Your teacher profile has been updated successfully!',
        user: {
          id: updatedTeacher?.id || teacher.id,
          username: updatedTeacher?.staff_code || teacher.staff_code,
          role: 'TEACHER',
          full_name: updatedTeacher?.full_name || teacher.full_name,
          email: updatedTeacher?.email || teacher.email,
          phone: updatedTeacher?.phone || teacher.phone,
          avatar: updatedTeacher?.avatar || updatedTeacher?.photo || teacher.avatar || teacher.photo || '',
          photo: updatedTeacher?.photo || updatedTeacher?.avatar || teacher.photo || teacher.avatar || ''
        }
      });
    }

    // 2. STUDENT / PARENT PERSONAL CREDENTIAL UPDATE
    if (role === 'STUDENT' || role === 'PARENT') {
      const students = await Database.getStudents(schoolId);
      const student = students.find(s => s.id === userId || s.admission_no === userId);
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student account not found.' }, { status: 404 });
      }

      const updates: any = {};
      if (email !== undefined && email.trim()) updates.email = email.trim();
      if (phone !== undefined && phone.trim()) {
        updates.phone = phone.trim();
        updates.guardian_phone = phone.trim();
      }
      if (new_password && new_password.trim()) {
        updates.passcode = new_password.trim();
      }
      if (rawPic !== undefined) {
        updates.avatar = rawPic;
        updates.photo = rawPic;
      }

      const updatedStudent = await Database.updateStudent(student.id, updates);

      return NextResponse.json({
        success: true,
        message: new_password
          ? 'Your student profile and login passcode have been updated successfully!'
          : 'Your student profile has been updated successfully!',
        user: {
          id: student.id,
          username: student.admission_no,
          role,
          full_name: student.full_name,
          email: updatedStudent?.email || student.email || `${student.admission_no.toLowerCase()}@${schoolId.toLowerCase()}.edu`,
          phone: updatedStudent?.phone || student.phone || student.guardian_phone,
          avatar: updatedStudent?.avatar || updatedStudent?.photo || student.avatar || student.photo || '',
          photo: updatedStudent?.photo || updatedStudent?.avatar || student.photo || student.avatar || ''
        }
      });
    }

    // 3. PRINCIPAL / ADMIN CREDENTIAL UPDATE
    if (role === 'PRINCIPAL' || role === 'AGENCY_SUPERADMIN' || role === 'ADMIN') {
      const targetSchool = await Database.getSchoolById(schoolId);
      if (!targetSchool) {
        return NextResponse.json({ success: false, error: 'School record not found.' }, { status: 404 });
      }

      const updates: any = {};
      if (full_name && full_name.trim()) {
        updates.principal_name = full_name.trim();
        updates.admin_name = full_name.trim();
      }
      if (body.username && body.username.trim()) {
        updates.admin_id = body.username.trim();
      }
      if (body.admin_pin && body.admin_pin.trim()) {
        updates.admin_pin = body.admin_pin.trim();
      }
      if (rawPic !== undefined) {
        updates.avatar = rawPic;
        updates.photo = rawPic;
        updates.principal_avatar = rawPic;
      }

      const updatedSchool = await Database.updateSchool(targetSchool.id, updates);
      const resAvatar = (updatedSchool as any)?.principal_avatar || (updatedSchool as any)?.avatar || (updatedSchool as any)?.photo || '';

      return NextResponse.json({
        success: true,
        message: 'School administrator credentials updated successfully!',
        school: updatedSchool,
        user: {
          id: updatedSchool?.admin_id || 'admin',
          username: updatedSchool?.admin_id || 'admin',
          role,
          full_name: updatedSchool?.principal_name || updatedSchool?.admin_name || 'School Administrator',
          email: updatedSchool?.email || `admin@${(updatedSchool?.school_code || 'dps2026').toLowerCase()}.edu`,
          avatar: resAvatar,
          photo: resAvatar
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported role for profile update.' }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
