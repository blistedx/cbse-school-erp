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

// Server secret — MUST be set in .env as SESSION_SECRET for production.
const SERVER_SECRET =
  process.env.SESSION_SECRET ||
  'giterp-dev-secret-change-in-production-2026';

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
  return createHmac('sha256', SERVER_SECRET).update(payload).digest('base64url');
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
 * Accepts: Authorization: Bearer <token>  OR  x-session-token: <token>
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }
  return req.headers.get('x-session-token')?.trim() || null;
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
      { success: false, error: 'Unauthorized: No session token provided.' },
      { status: 401 }
    );
  }
  const payload = verifySessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or expired session.' },
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
  if (!allowedRoles.includes(auth.role)) {
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

export const ADMIN_ROLES = ['PRINCIPAL', 'AGENCY_SUPERADMIN'];
export const AGENCY_ONLY = ['AGENCY_SUPERADMIN'];
export const STAFF_ROLES = ['PRINCIPAL', 'AGENCY_SUPERADMIN', 'TEACHER'];
export const ALL_ROLES = ['PRINCIPAL', 'AGENCY_SUPERADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
