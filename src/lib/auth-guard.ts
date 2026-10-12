/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * auth-guard.ts — Server-side Session Token & API Protection
 *
 * Strategy: HMAC-SHA256 signed tokens stored in client localStorage.
 * Token is sent as: Authorization: Bearer <token>
 * OR as header: x-session-token: <token>
 *
 * Token payload format (base64url encoded JSON):
 *   { userId, schoolId, role, iat, exp }
 * Signature: HMAC-SHA256(payload, SERVER_SECRET)
 */

import { NextResponse } from 'next/server';
import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { getDatabase } from '@/lib/mongodb';

/**
 * Server-side token blocklist.
 * Maps token signature SHA-256 hash -> expiration timestamp (ms).
 */
const revokedTokenHashes = new Map<string, number>();

export async function revokeTokenAsync(token: string): Promise<void> {
  revokeToken(token);
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return;
    const [payload, sig] = parts;
    const data: TokenPayload = JSON.parse(fromB64url(payload));
    const tokenHash = createHash('sha256').update(sig).digest('hex');
    const db = await getDatabase();
    if (db) {
      await db.collection('revoked_tokens').updateOne(
        { token_hash: tokenHash },
        {
          $set: {
            token_hash: tokenHash,
            expires_at: new Date(data.exp || Date.now() + TOKEN_TTL_MS),
            created_at: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch {}
}

export function revokeToken(token: string): void {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return;
    const [payload, sig] = parts;
    const data: TokenPayload = JSON.parse(fromB64url(payload));
    const tokenHash = createHash('sha256').update(sig).digest('hex');
    revokedTokenHashes.set(tokenHash, data.exp || Date.now() + TOKEN_TTL_MS);
  } catch {}
}

export function isTokenRevoked(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return true;
    const tokenHash = createHash('sha256').update(parts[1]).digest('hex');
    const exp = revokedTokenHashes.get(tokenHash);
    if (!exp) return false;
    if (Date.now() > exp) {
      revokedTokenHashes.delete(tokenHash);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

function getServerSecret(): string {
  const secret = (process.env.SESSION_SECRET || '').replace(/^["']|["']$/g, '').trim();
  if (!secret) {
    throw new Error('[SECURITY FATAL]: SESSION_SECRET is not configured in environment variables.');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  schoolId: string;
  role: string;
  username?: string;
  name?: string;
  rem?: boolean;
  iat: number;
  exp: number;
}

/** Token validity windows: 30 days if remember is true, 24 hours if false */
export const TOKEN_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const TOKEN_TTL_DEFAULT_MS = 24 * 60 * 60 * 1000; // 24 hours
export const TOKEN_TTL_MS = TOKEN_TTL_REMEMBER_MS;

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function fromB64url(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function sign(payload: string): string {
  return createHmac('sha256', getServerSecret())
    .update(payload)
    .digest('base64url');
}

/**
 * Create a signed session token for the given user.
 */
export function createSessionToken(
  userId: string,
  schoolId: string,
  role: string,
  remember: boolean = true
): string {
  const iat = Date.now();
  const ttl = remember ? TOKEN_TTL_REMEMBER_MS : TOKEN_TTL_DEFAULT_MS;
  const exp = iat + ttl;
  const payload = b64url(JSON.stringify({ userId, schoolId, role, rem: remember, iat, exp }));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

/**
 * Verify a session token. Returns the payload if valid, or null if invalid/expired.
 */
export function verifySessionToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    if (isTokenRevoked(token)) return null;

    const [payload, sig] = parts;
    const expectedSig = sign(payload);
    
    // Constant-time comparison using crypto.timingSafeEqual to prevent timing attacks
    const sigBuf = Buffer.from(sig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const data: TokenPayload = JSON.parse(fromB64url(payload));
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Extract the session token from a request.
 * Accepts: Authorization: Bearer <token>  OR  x-session-token: <token>  OR  Cookie: erp_session_token=<token>
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }
  const xToken = req.headers.get('x-session-token')?.trim();
  if (xToken) return xToken;

  // Extract from cookies (works automatically for browser fetch)
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)erp_session_token=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]).trim() || null;
  }

  return null;
}

/**
 * Authenticate a request. Returns the token payload or a 401 NextResponse.
 *
 * Usage:
 *   const auth = requireAuth(req);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.role, auth.schoolId, auth.userId are now available
 */
export function requireAuth(req: Request): TokenPayload | NextResponse {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
      { status: 401 }
    );
  }
  const payload = verifySessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or expired session token. Please log in again.' },
      { status: 401 }
    );
  }
  return payload;
}

/**
 * Require a specific role (or set of roles). Returns 403 if the role doesn't match.
 */
export function requireRole(
  req: Request,
  allowedRoles: string[]
): TokenPayload | NextResponse {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userRole = (auth.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
  
  const isGodSuper = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
  if (!normalizedAllowed.includes(userRole) && !isGodSuper) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden: This action requires one of [${allowedRoles.join(', ')}].`
      },
      { status: 403 }
    );
  }
  return auth;
}

export const ADMIN_ROLES = ['PRINCIPAL', 'VICE_PRINCIPAL', 'ADMIN', 'AGENCY_SUPERADMIN', 'SUPERADMIN', 'SCHOOL_ADMIN', 'GOD_ACCESS'];
export const AGENCY_ONLY = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'];
export const STAFF_ROLES = ['PRINCIPAL', 'VICE_PRINCIPAL', 'ADMIN', 'AGENCY_SUPERADMIN', 'SUPERADMIN', 'SCHOOL_ADMIN', 'GOD_ACCESS', 'TEACHER', 'FACULTY'];
export const ALL_ROLES = ['PRINCIPAL', 'VICE_PRINCIPAL', 'ADMIN', 'AGENCY_SUPERADMIN', 'SUPERADMIN', 'SCHOOL_ADMIN', 'GOD_ACCESS', 'TEACHER', 'FACULTY', 'STUDENT', 'PARENT', 'ACCOUNTANT'];

export type PermissionAction = 'view' | 'edit' | 'add' | 'delete' | 'manage';

/**
 * Checks if a given role has permission for a module and action.
 * Superadmins and god access always return true.
 */
export function hasPermission(
  role: string,
  module: string,
  action: PermissionAction = 'view',
  customMatrix?: any
): boolean {
  const normRole = (role || '').toUpperCase();
  if (['SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS', 'SUPER_ADMIN'].includes(normRole)) {
    return true;
  }

  // Canonicalize role aliases to the 10 core managed roles
  let canonicalRole = 'ADMIN';
  if (normRole === 'PRINCIPAL') canonicalRole = 'PRINCIPAL';
  else if (normRole === 'VICE_PRINCIPAL') canonicalRole = 'VICE_PRINCIPAL';
  else if (normRole === 'ADMIN' || normRole === 'SCHOOL_ADMIN') canonicalRole = 'ADMIN';
  else if (normRole === 'TEACHER' || normRole === 'FACULTY') canonicalRole = 'TEACHER';
  else if (normRole === 'ACCOUNTANT') canonicalRole = 'ACCOUNTANT';
  else if (normRole === 'DRIVER') canonicalRole = 'DRIVER';
  else if (normRole === 'LIBRARIAN') canonicalRole = 'LIBRARIAN';
  else if (normRole === 'SECURITY_GUARD' || normRole === 'GUARD' || normRole === 'GATEKEEPER') canonicalRole = 'SECURITY_GUARD';
  else if (normRole === 'STUDENT') canonicalRole = 'STUDENT';
  else if (normRole === 'PARENT') canonicalRole = 'PARENT';

  const normModule = module.toLowerCase().replace(/[- ]/g, '_');
  const rolePerms = customMatrix?.[canonicalRole];
  if (rolePerms && rolePerms[normModule]) {
    const p = rolePerms[normModule];
    if (action === 'view') return !!p.can_view;
    if (action === 'edit') return !!p.can_edit;
    if (action === 'add') return !!p.can_add;
    if (action === 'delete') return !!p.can_delete;
    if (action === 'manage') return !!(p.can_edit || p.can_add || p.can_delete);
  }

  // Fallback defaults for core roles if module matrix is not overridden
  if (canonicalRole === 'PRINCIPAL') return true;
  if (canonicalRole === 'ADMIN' && action !== 'delete') return true;
  if (canonicalRole === 'VICE_PRINCIPAL' && action !== 'delete') return true;
  if (canonicalRole === 'TEACHER') {
    if (['attendance', 'homework', 'exams', 'marks', 'syllabus'].includes(normModule)) return true;
    if (action === 'view') return true;
    return false;
  }
  if (canonicalRole === 'ACCOUNTANT') {
    if (['fees', 'finance', 'invoices', 'receipts'].includes(normModule)) return true;
    if (action === 'view' && ['students', 'classes', 'attendance'].includes(normModule)) return true;
    return false;
  }
  if (canonicalRole === 'LIBRARIAN') {
    if (['library', 'books'].includes(normModule)) return true;
    if (action === 'view' && ['students', 'classes'].includes(normModule)) return true;
    return false;
  }
  if (canonicalRole === 'DRIVER') {
    if (['transport', 'telemetry', 'routes'].includes(normModule)) return true;
    return false;
  }
  if (canonicalRole === 'SECURITY_GUARD') {
    if (['visitors', 'gate', 'guard', 'scan'].includes(normModule)) return true;
    return false;
  }
  if (canonicalRole === 'STUDENT' || canonicalRole === 'PARENT') {
    if (action === 'view') return true;
    return false;
  }

  return false;
}

/**
 * Enforces Role-Based Access Control (RBAC).
 * Supports both Request objects and pre-authenticated TokenPayload objects.
 * Hard rule: Agency SUPERADMIN / SUPER_ADMIN / GOD_ACCESS always succeeds unimpeded.
 * If unauthorized, logs a SECURITY audit event and returns a 403 NextResponse.
 */
export async function requirePermission(
  reqOrUser: Request | TokenPayload,
  module: string,
  action: PermissionAction = 'view'
): Promise<TokenPayload | NextResponse> {
  let auth: TokenPayload;

  if ('headers' in reqOrUser && typeof (reqOrUser as Request).headers?.get === 'function') {
    const authRes = requireAuth(reqOrUser as Request);
    if (authRes instanceof NextResponse) return authRes;
    auth = authRes;
  } else {
    auth = reqOrUser as TokenPayload;
  }

  const role = (auth.role || '').toUpperCase();
  // HARD RULE: Superadmin agency login must keep working exactly as before
  if (['SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS', 'SUPER_ADMIN'].includes(role)) {
    return auth;
  }

  let customMatrix: any = undefined;
  try {
    if (auth.schoolId) {
      const db = await getDatabase();
      if (db) {
        const schoolDoc = await db.collection('schools').findOne({ id: auth.schoolId });
        if (schoolDoc?.role_permissions) {
          customMatrix = schoolDoc.role_permissions;
        }
      }
    }
  } catch {}

  const allowed = hasPermission(role, module, action, customMatrix);
  if (!allowed) {
    try {
      const { logAuditEvent } = await import('@/lib/audit-logger');
      logAuditEvent({
        schoolId: auth.schoolId,
        userId: auth.userId,
        role: auth.role,
        module: 'AUDIT_LOGS',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'SECURITY',
        summary: `Unauthorized access attempt (403): User "${auth.userId}" (${role}) denied "${action}" on module "${module}"`,
        details: { module, action, role, userId: auth.userId }
      });
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: `Forbidden: Role "${role}" does not have permission to ${action} module "${module}".`
      },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Normalizes legacy, variant, or alias school IDs to their canonical database ID.
 * Specifically maps SCH-1788255333307, DPS-2026, or DPS* to "DPS2026".
 */
export function canonicalizeSchoolId(schoolId?: string | null): string {
  if (!schoolId) return 'DPS2026';
  const clean = schoolId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean === 'DPS2026' || clean.startsWith('DPS') || clean === 'SCH1788255333307') {
    return 'DPS2026';
  }
  if (clean.startsWith('SXHS')) return 'SXHS-2026';
  if (clean.startsWith('KV')) return 'KV-2026';
  return schoolId.trim();
}

/**
 * Resolves and enforces the tenant schoolId for a request.
 * For non-superadmin users, if the client requests another school, returns 403 Forbidden.
 * Returns the verified canonical schoolId string or a 403 NextResponse.
 */
export function resolveTenantSchoolId(
  auth: TokenPayload,
  requestedSchoolId?: string | null
): string | NextResponse {
  const userRole = (auth.role || '').toUpperCase();
  const isSuperadmin = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
  const userSchoolId = (auth.schoolId || '').trim();

  if (isSuperadmin) {
    return canonicalizeSchoolId(requestedSchoolId || userSchoolId || 'DPS2026');
  }

  if (!userSchoolId) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: No school tenant associated with your account.' },
      { status: 403 }
    );
  }

  const canonicalUser = canonicalizeSchoolId(userSchoolId);
  const canonicalReq = requestedSchoolId ? canonicalizeSchoolId(requestedSchoolId) : canonicalUser;

  if (requestedSchoolId && requestedSchoolId.trim()) {
    const cleanReq = requestedSchoolId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanUser = userSchoolId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Exact or canonical match only
    const isDirectMatch = requestedSchoolId.trim() === userSchoolId || cleanReq === cleanUser || canonicalReq === canonicalUser;
    const isKnownAlias = (cleanReq === 'DPS2026' && cleanUser === 'SCH1788255333307') ||
                         (cleanUser === 'DPS2026' && cleanReq === 'SCH1788255333307');

    if (!isDirectMatch && !isKnownAlias) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You do not have permission to access or modify records for another school tenant.'
        },
        { status: 403 }
      );
    }
  }

  return canonicalUser;
}

