/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getAuditLogs, logAuditEvent, exportAuditLogsToCsv } from '@/lib/audit-logger';
import { requireRole, requireAuth, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = requireRole(request, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const moduleFilter = searchParams.get('module') || undefined;
    const severityFilter = searchParams.get('severity') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const exportFormat = searchParams.get('export');

    const logs = getAuditLogs({
      module: moduleFilter,
      severity: severityFilter,
      search,
      limit
    });

    // Handle CSV Download
    if (exportFormat === 'csv') {
      const csv = exportAuditLogsToCsv(logs);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="CBSE_School_Security_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv"`
        }
      });
    }

    // Compute live summary statistics
    const stats = {
      total: logs.length,
      critical: logs.filter(l => l.severity === 'CRITICAL' || l.severity === 'SECURITY').length,
      modules: Array.from(new Set(logs.map(l => l.module))),
      recentTimestamp: logs[0]?.timestamp || null
    };

    return NextResponse.json({
      success: true,
      stats,
      logs
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
  
  // Cloudflare
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp)) return cfIp.trim();
  
  // True-Client-IP / Fastly
  const trueClientIp = headers.get('true-client-ip') || headers.get('fastly-client-ip');
  if (trueClientIp && isValidIp(trueClientIp)) return trueClientIp.trim();
  
  // X-Forwarded-For
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

  // X-Real-IP
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
    const { action, module, summary, severity, details, targetId, targetName, actor, school_id, session } = body;

    if (!action || !module || !summary) {
      return NextResponse.json(
        { success: false, error: 'Missing required audit fields (action, module, summary)' },
        { status: 400 }
      );
    }

    const detectedIp = extractClientIp(request);
    const resolvedPublicIp = (actor?.public_ip && !isLocalhostOrPrivate(actor.public_ip)) 
      ? actor.public_ip 
      : ((actor?.ip && !isLocalhostOrPrivate(actor.ip)) ? actor.ip : detectedIp);

    const mergedActor = {
      ...(actor || { name: 'Dr. Rajesh Sharma', role: 'PRINCIPAL' }),
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
      targetId,
      targetName,
      actor: mergedActor,
      school_id,
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
