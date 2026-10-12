import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId, requirePermission } from '@/lib/auth-guard';
import { AttendanceService } from '@/lib/services/attendance.service';
import { logAuditEvent } from '@/lib/audit-logger';
import { sendWhatsAppNotification } from '@/lib/whatsapp';
import { getTodayDateStr } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const tenant = resolveTenantSchoolId(auth);
    if (tenant instanceof NextResponse) return tenant;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || getTodayDateStr();
    const session = searchParams.get('session') || '2026-27';

    const absentStudents = await AttendanceService.getAbsentStudents(tenant, session, date);

    return NextResponse.json({
      success: true,
      date,
      count: absentStudents.length,
      absentStudents
    });
  } catch (err: any) {
    console.error('[API_ABSENT_ALERTS_GET_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const perm = await requirePermission(req, 'ATTENDANCE', 'edit');
    if (perm instanceof NextResponse) return perm;

    const tenant = resolveTenantSchoolId(perm);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json().catch(() => ({}));
    const date = body.date || getTodayDateStr();
    const session = body.session || '2026-27';
    const customMessage = body.message;

    const absentStudents = await AttendanceService.getAbsentStudents(tenant, session, date);

    if (absentStudents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No absent students recorded for this date.',
        dispatchedCount: 0
      });
    }

    let dispatchedCount = 0;
    const failures: string[] = [];

    for (const student of absentStudents) {
      const parentPhone = student.parentPhone;
      if (!parentPhone) continue;

      const alertText = customMessage
        ? customMessage.replace('{student_name}', student.fullName).replace('{date}', date)
        : `Dear Parent, this is to notify that your ward ${student.fullName} (${student.className}-${student.section}) has been marked ${student.status} today (${date}). Please contact school if you need assistance.`;

      try {
        await sendWhatsAppNotification(
          parentPhone,
          'daily_absent_alert',
          {
            student_name: student.fullName,
            class_section: `${student.className}-${student.section}`,
            date,
            custom_message: alertText
          }
        );
        dispatchedCount++;
      } catch (e: any) {
        failures.push(`${student.fullName}: ${e.message}`);
      }
    }

    logAuditEvent({
      schoolId: tenant,
      userId: perm.userId,
      role: perm.role,
      module: 'ATTENDANCE',
      action: 'ABSENT_ALERTS_DISPATCH',
      severity: 'INFO',
      summary: `Dispatched instant absentee alerts to ${dispatchedCount} parents for ${date}`,
      details: {
        totalAbsent: absentStudents.length,
        dispatchedCount,
        failureCount: failures.length,
        date
      }
    });

    return NextResponse.json({
      success: true,
      message: `Dispatched alerts to ${dispatchedCount} parents.`,
      dispatchedCount,
      totalAbsent: absentStudents.length,
      failures: failures.slice(0, 10)
    });
  } catch (err: any) {
    console.error('[API_ABSENT_ALERTS_POST_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
