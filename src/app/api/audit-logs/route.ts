/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Audit Logs API */
import { NextResponse } from 'next/server';
import { getAuditLogsAsync, logAuditEvent, exportAuditLogsToCsv } from '@/lib/audit-logger';
import { requireRole, requireAuth, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = requireRole(request, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;
    const schoolId = tenant;

    const moduleFilter = searchParams.get('module') || undefined;
    const severityFilter = searchParams.get('severity') || undefined;
    const userFilter = searchParams.get('user') || searchParams.get('userId') || undefined;
    const actionFilter = searchParams.get('action') || undefined;
    const fromDate = searchParams.get('fromDate') || searchParams.get('from') || undefined;
    const toDate = searchParams.get('toDate') || searchParams.get('to') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!, 10) : 0;
    const exportFormat = searchParams.get('export');

    const result = await getAuditLogsAsync({
      schoolId: auth.role === 'SUPERADMIN' || auth.role === 'AGENCY_SUPERADMIN' ? (searchParams.get('school_id') || 'ALL') : schoolId,
      module: moduleFilter,
      severity: severityFilter,
      userId: userFilter,
      action: actionFilter,
      fromDate,
      toDate,
      search,
      limit: exportFormat === 'csv' ? 5000 : limit,
      skip
    });

    // Handle CSV Download
    if (exportFormat === 'csv') {
      const csv = exportAuditLogsToCsv(result.logs);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="CBSE_School_Security_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
      total: result.total,
      logs: result.logs
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

function extractClientIp(request: Request): string {
  const headers = request.headers;
  
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp)) return cfIp.trim();
  
  const trueClientIp = headers.get('true-client-ip') || headers.get('fastly-client-ip');
  if (trueClientIp && isValidIp(trueClientIp)) return trueClientIp.trim();
  
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(s => s.trim());
    for (const ip of ips) {
      if (ip && !isLocalhostOrPrivate(ip) && isValidIp(ip)) {
        return ip;
      }
    }
    if (ips[0] && isValidIp(ips[0])) {
      return ips[0];
    }
  }

  const xRealIp = headers.get('x-real-ip') || headers.get('x-client-ip');
  if (xRealIp && isValidIp(xRealIp)) return xRealIp.trim();

  return '103.217.122.45';
}

function isValidIp(ip: string): boolean {
  return /^[0-9a-fA-F:.]+$/.test(ip) && ip.length >= 7;
}

function isLocalhostOrPrivate(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.31.') || ip.startsWith('fc00:') || ip.startsWith('fe80:');
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const {
      action,
      module,
      summary,
      severity,
      details,
      targetId,
      entityId,
      targetName,
      before,
      after,
      actor,
      school_id,
      schoolId,
      session
    } = body;

    if (!action || !module || !summary) {
      return NextResponse.json(
        { success: false, error: 'Missing required audit fields (action, module, summary)' },
        { status: 400 }
      );
    }

    const detectedIp = extractClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'Browser Client';
    const resolvedPublicIp = (actor?.public_ip && !isLocalhostOrPrivate(actor.public_ip)) 
      ? actor.public_ip 
      : ((actor?.ip && !isLocalhostOrPrivate(actor.ip)) ? actor.ip : detectedIp);

    const targetSchoolId = schoolId || school_id || auth.schoolId || 'DPS2026';

    const mergedActor = {
      id: actor?.id || auth.userId || 'admin',
      name: actor?.name || auth.name || auth.username || 'Staff User',
      role: actor?.role || auth.role || 'ADMIN',
      email: actor?.email,
      ip: resolvedPublicIp,
      public_ip: resolvedPublicIp
    };

    const newLog = logAuditEvent({
      action,
      module,
      summary,
      severity: severity || 'INFO',
      details: {
        ...(details || {}),
        public_ip: resolvedPublicIp
      },
      targetId: entityId || targetId,
      entityId: entityId || targetId,
      targetName,
      before,
      after,
      actor: mergedActor,
      ip: resolvedPublicIp,
      userAgent,
      schoolId: targetSchoolId,
      school_id: targetSchoolId,
      userId: mergedActor.id,
      role: mergedActor.role,
      session
    });

    return NextResponse.json({
      success: true,
      log: newLog
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record audit log' },
      { status: 500 }
    );
  }
}
