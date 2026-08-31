/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/web-push';

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    success: true,
    publicKey
  });
}
