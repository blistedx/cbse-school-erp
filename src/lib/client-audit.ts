/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { AuditLogEntry } from './types';
import { apiFetch } from './api-client';

let cachedPublicIp: string | null = null;
let publicIpPromise: Promise<string | null> | null = null;

/**
 * Auto-detect client public IP address (cached in memory & sessionStorage)
 */
export async function getClientPublicIp(): Promise<string | null> {
  if (cachedPublicIp) return cachedPublicIp;
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.sessionStorage?.getItem('erp_public_ip');
    if (stored) {
      cachedPublicIp = stored;
      return stored;
    }
  } catch (_) {}

  if (publicIpPromise) return publicIpPromise;

  publicIpPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
        cache: 'force-cache'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.ip === 'string') {
          cachedPublicIp = data.ip;
          try {
            window.sessionStorage?.setItem('erp_public_ip', data.ip);
          } catch (_) {}
          return data.ip;
        }
      }
    } catch (_) {
      // Fallback: server will extract public IP from request headers (x-forwarded-for / cf-connecting-ip)
    }
    return null;
  })();

  return publicIpPromise;
}

/**
 * Client-Side Audit Logger Helper
 * Automatically sends audit records to `/api/audit-logs` in the background with Public IP
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
  actor?: { name: string; role: string; email?: string; ip?: string; public_ip?: string };
}) {
  try {
    if (typeof window === 'undefined') return;

    // Fetch public IP non-blockingly or use cached
    const detectedPublicIp = await getClientPublicIp().catch(() => null);

    const actorPayload = {
      name: actor?.name || 'Dr. Rajesh Sharma',
      role: actor?.role || 'PRINCIPAL',
      email: actor?.email,
      ip: actor?.ip || detectedPublicIp || undefined,
      public_ip: actor?.public_ip || detectedPublicIp || undefined
    };

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
        actor: actorPayload
      })
    }).catch(err => {
      console.warn('[AuditLogger] Background audit log push error:', err);
    });
  } catch (e) {
    // Non-blocking
  }
}

