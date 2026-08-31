/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getAuditLogs, logAuditEvent, exportAuditLogsToCsv } from '@/lib/audit-logger';

export async function GET(request: Request) {
  try {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, module, summary, severity, details, targetId, targetName, actor, school_id, session } = body;

    if (!action || !module || !summary) {
      return NextResponse.json(
        { success: false, error: 'Missing required audit fields (action, module, summary)' },
        { status: 400 }
      );
    }

    const newLog = logAuditEvent({
      action,
      module,
      summary,
      severity: severity || 'INFO',
      details,
      targetId,
      targetName,
      actor,
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
