/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
}

const bucketStores = new Map<string, Map<string, RateLimitRecord>>();

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export function checkRateLimit(
  req: Request,
  options: {
    bucketName: string;
    maxAttempts: number;
    windowMs: number;
    skipLocalhost?: boolean;
    customKey?: string;
  }
): { allowed: boolean; retryAfterSeconds?: number; response?: NextResponse } {
  const ip = options.customKey || getClientIp(req);
  const now = Date.now();
  const isLocal = !options.customKey && (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown');

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
            error: `Too many attempts. Account/IP temporarily locked. Please try again in ${retryAfterMin} minute(s).`
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

export function checkAccountLockout(
  schoolCode: string,
  username: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { locked: boolean; retryAfterSeconds?: number; response?: NextResponse } {
  const key = `${schoolCode.toUpperCase()}:${username.toUpperCase()}`;
  const rate = checkRateLimit({ headers: new Headers() } as any, {
    bucketName: 'account-lockout',
    maxAttempts,
    windowMs,
    customKey: key
  });
  return {
    locked: !rate.allowed,
    retryAfterSeconds: rate.retryAfterSeconds,
    response: rate.response
  };
}

export function resetRateLimit(bucketName: string, req?: Request, customKey?: string): void {
  const store = bucketStores.get(bucketName);
  if (!store) return;
  if (customKey) {
    store.delete(customKey);
  }
  if (req) {
    const ip = getClientIp(req);
    store.delete(ip);
  }
}
