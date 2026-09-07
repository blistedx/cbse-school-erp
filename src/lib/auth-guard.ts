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
import { createHmac } from 'crypto';

function getServerSecret(): string {
  const secret = (process.env.SESSION_SECRET || '').replace(/^["']|["']$/g, '').trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY WARNING]: SESSION_SECRET environment variable is not explicitly set in production. Using fallback secret. For maximum production security, configure SESSION_SECRET in your deployment environment variables.');
  }
  return 'giterp-super-secret-key-cbse-erp-2026';
}

export interface TokenPayload {
  userId: string;
  schoolId: string;
  role: string;
  iat: number;
  exp: number;
}

/** Token validity window — 12 hours */
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

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
  role: string
): string {
  const iat = Date.now();
  const exp = iat + TOKEN_TTL_MS;
  const payload = b64url(JSON.stringify({ userId, schoolId, role, iat, exp }));
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
    const [payload, sig] = parts;
    const expectedSig = sign(payload);
    // Constant-time comparison to prevent timing attacks
    if (sig.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;
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

export const ADMIN_ROLES = ['PRINCIPAL', 'ADMIN', 'AGENCY_SUPERADMIN', 'SUPERADMIN', 'SCHOOL_ADMIN', 'GOD_ACCESS'];
export const AGENCY_ONLY = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'];
export const STAFF_ROLES = ['PRINCIPAL', 'ADMIN', 'AGENCY_SUPERADMIN', 'SUPERADMIN', 'SCHOOL_ADMIN', 'GOD_ACCESS', 'TEACHER', 'FACULTY'];
export const ALL_ROLES = ['PRINCIPAL', 'ADMIN', 'AGENCY_SUPERADMIN', 'SUPERADMIN', 'SCHOOL_ADMIN', 'GOD_ACCESS', 'TEACHER', 'FACULTY', 'STUDENT', 'PARENT', 'ACCOUNTANT'];

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
    
    // Known school ID/code cross-mappings
    const isDirectMatch = requestedSchoolId.trim() === userSchoolId || cleanReq === cleanUser || canonicalReq === canonicalUser;
    const isKnownAlias = (cleanReq.startsWith('DPS') && cleanUser.startsWith('DPS')) ||
                         (cleanReq.startsWith('SXHS') && cleanUser.startsWith('SXHS')) ||
                         (cleanReq.startsWith('KV') && cleanUser.startsWith('KV')) ||
                         (cleanReq === 'DPS2026' && cleanUser === 'SCH1788255333307') ||
                         (cleanUser === 'DPS2026' && cleanReq === 'SCH1788255333307') ||
                         cleanReq.includes(cleanUser) || cleanUser.includes(cleanReq);

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

  return canonicalReq || canonicalUser;
}

