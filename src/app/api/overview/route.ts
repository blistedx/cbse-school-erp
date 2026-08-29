import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || searchParams.get('schoolId');

    const targetSchoolId = schoolId || (await Database.getSchools())[0]?.id;
    if (!targetSchoolId) {
      return NextResponse.json({
        success: true,
        kpis: {
          totalStudents: 0,
          totalTeachers: 0,
          attendanceToday: 0,
          feeCollectionRate: 0,
          pendingFeeAmount: 0,
          totalRevenue: 0
        },
        recentStudents: [],
        recentInvoices: []
      });
    }

    const overview = await Database.getSchoolOverview(targetSchoolId);
    return NextResponse.json({ success: true, ...overview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
