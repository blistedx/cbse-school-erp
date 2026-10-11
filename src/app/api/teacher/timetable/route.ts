/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';

    const teachers = await Database.getTeachers(tenant);
    const teacher = teachers.find(t => 
      t.id === auth.userId || 
      (t.staff_code && t.staff_code === auth.userId) ||
      (t.email && t.email === auth.username)
    );

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Teacher not found.' }, { status: 404 });
    }

    const allTimetable = await Database.getTimetable(tenant, session);
    const myTimetable = allTimetable.filter(t => {
      const matchName = (t.teacher_name || '').toLowerCase().trim() === teacher.full_name.toLowerCase().trim();
      const matchCode = (t.teacher_name || '').toLowerCase().trim() === (teacher.staff_code || '').toLowerCase().trim();
      const matchId = (t as any).teacher_id === teacher.id;
      return matchName || matchCode || matchId;
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduleByDay: Record<string, any[]> = {};
    for (const d of days) {
      scheduleByDay[d] = myTimetable
        .filter(t => (t.day || '').toLowerCase() === d.toLowerCase())
        .sort((a, b) => (a.period_no || 0) - (b.period_no || 0));
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        staff_code: teacher.staff_code,
        full_name: teacher.full_name
      },
      weekly_schedule: scheduleByDay,
      all_entries: myTimetable
    });
  } catch (error: any) {
    console.error('[API_TEACHER_TIMETABLE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve timetable.' }, { status: 500 });
  }
}
