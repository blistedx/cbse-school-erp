import { NextResponse } from 'next/server';
import { AttendanceService } from '@/lib/services/attendance.service';
import { logAuditEvent } from '@/lib/audit-logger';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const deviceApiKey = req.headers.get('x-device-key') || req.headers.get('x-api-key');

    let schoolId = 'DPS2026';
    let actorUserId = 'HARDWARE_GATEWAY';
    let actorRole = 'SECURITY_GUARD';

    // Allow hardware gateway key or user auth
    if (!deviceApiKey) {
      const auth = requireAuth(req);
      if (auth instanceof NextResponse) return auth;
      const tenant = resolveTenantSchoolId(auth);
      if (tenant instanceof NextResponse) return tenant;
      schoolId = tenant;
      actorUserId = auth.userId;
      actorRole = auth.role;
    } else {
      // Validate device key (matches env or institutional device secret)
      const validSecret = process.env.HARDWARE_DEVICE_SECRET || 'CBSE_DEVICE_SYNC_SECRET_2026';
      if (deviceApiKey !== validSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized hardware device key' }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));
    if (body.school_id) schoolId = body.school_id;
    const session = body.academic_session || '2026-27';

    // Punches can be single punch or array
    const rawPunches = Array.isArray(body.punches)
      ? body.punches
      : body.identifier
      ? [body]
      : [];

    if (rawPunches.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid punch records provided. Expected array of { identifier, punch_time, in_out_type }.'
      }, { status: 400 });
    }

    const result = await AttendanceService.recordHardwarePunches(schoolId, session, rawPunches);

    logAuditEvent({
      schoolId,
      userId: actorUserId,
      role: actorRole,
      module: 'ATTENDANCE',
      action: 'HARDWARE_PUNCH_SYNC',
      severity: 'INFO',
      summary: `Biometric/RFID Gateway processed ${rawPunches.length} punches: ${result.studentsMarked} students, ${result.facultyMarked} faculty marked`,
      details: {
        total: result.total,
        matched: result.matched,
        unmatched: result.unmatched,
        studentsMarked: result.studentsMarked,
        facultyMarked: result.facultyMarked
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully synchronized ${result.matched} punches.`
    });
  } catch (error: any) {
    console.error('[API_HARDWARE_SYNC_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process hardware sync' }, { status: 500 });
  }
}
