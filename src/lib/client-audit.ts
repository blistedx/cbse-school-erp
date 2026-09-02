/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { AuditLogEntry } from './types';
import { apiFetch } from './api-client';

/**
 * Client-Side Audit Logger Helper
 * Automatically sends audit records to `/api/audit-logs` in the background
 */
export async function recordAudit({
  action,
  module,
  summary,
  details = {},
  severity = 'INFO',
  targetId,
  targetName,
  actor
}: {
  action: string;
  module: AuditLogEntry['module'];
  summary: string;
  details?: Record<string, any>;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
  targetId?: string;
  targetName?: string;
  actor?: { name: string; role: string; email?: string };
}) {
  try {
    if (typeof window === 'undefined') return;

    apiFetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        module,
        summary,
        details,
        severity,
        targetId,
        targetName,
        actor: actor || {
          name: 'Dr. Rajesh Sharma',
          role: 'PRINCIPAL'
        }
      })
    }).catch(err => {
      console.warn('[AuditLogger] Background audit log push error:', err);
    });
  } catch (e) {
    // Non-blocking
  }
}
