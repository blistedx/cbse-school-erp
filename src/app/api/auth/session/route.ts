/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';

/**
 * SEC-01 Remediation:
 * Arbitrary unauthenticated session token minting has been permanently disabled.
 * Valid session tokens are issued strictly through /api/auth/login following verified credential authentication.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint disabled. Session tokens must be acquired via /api/auth/login with valid credentials.'
    },
    { status: 410 }
  );
}
