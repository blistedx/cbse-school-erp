import { NextRequest } from 'next/server';
import { extractToken, verifySessionToken, TokenPayload } from '@/lib/auth-guard';

export const authOptions = {};

export interface SessionUser {
  id: string;
  userId: string;
  schoolId: string;
  role: string;
}

export interface SessionResult {
  user: SessionUser;
}

/**
 * Next-Auth compatible getServerSession helper that seamlessly verifies
 * signed session tokens, bearer authorization headers, or cookie tokens.
 */
export async function getServerSession(
  reqOrOptions?: any
): Promise<SessionResult | null> {
  // If a request object was passed
  if (reqOrOptions && (reqOrOptions instanceof Request || reqOrOptions instanceof NextRequest)) {
    const token = extractToken(reqOrOptions);
    if (!token) return null;
    const payload = verifySessionToken(token);
    if (!payload) return null;
    return {
      user: {
        id: payload.userId,
        userId: payload.userId,
        schoolId: payload.schoolId,
        role: payload.role
      }
    };
  }

  // Fallback for standard session resolver
  return null;
}

export function getSessionUser(req: Request | NextRequest): SessionUser | null {
  const token = extractToken(req);
  if (!token) return null;
  const payload: TokenPayload | null = verifySessionToken(token);
  if (!payload) return null;
  return {
    id: payload.userId,
    userId: payload.userId,
    schoolId: payload.schoolId,
    role: payload.role
  };
}
