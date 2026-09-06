/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
}

// In-memory sliding-window bucket store
// NOTE: For multi-instance/serverless production (e.g. Vercel Edge/Serverless),
// replace or supplement this with Upstash Redis / Redis for shared state across lambdas.
const bucketStores = new Map<string, Map<string, RateLimitRecord>>();

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function checkRateLimit(
  req: Request,
  options: {
    bucketName: string;
    maxAttempts: number;
    windowMs: number;
    skipLocalhost?: boolean;
  }
): { allowed: boolean; retryAfterSeconds?: number; response?: NextResponse } {
  const ip = getClientIp(req);
  const now = Date.now();
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'unknown';

  if (options.skipLocalhost && isLocal) {
    return { allowed: true };
  }

  let store = bucketStores.get(options.bucketName);
  if (!store) {
    store = new Map<string, RateLimitRecord>();
    bucketStores.set(options.bucketName, store);
  }

  const record = store.get(ip);
  if (record && now - record.firstAttempt < options.windowMs) {
    if (record.count >= options.maxAttempts) {
      const retryAfterMs = options.windowMs - (now - record.firstAttempt);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      const retryAfterMin = Math.ceil(retryAfterMs / 60000);
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSec,
        response: NextResponse.json(
          {
            success: false,
            error: `Too many requests. Please try again in ${retryAfterMin} minute(s).`
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSec)
            }
          }
        )
      };
    }
    record.count++;
  } else {
    store.set(ip, { count: 1, firstAttempt: now });
  }

  return { allowed: true };
}

export function resetRateLimit(bucketName: string, req: Request): void {
  const ip = getClientIp(req);
  const store = bucketStores.get(bucketName);
  if (store) {
    store.delete(ip);
  }
}
