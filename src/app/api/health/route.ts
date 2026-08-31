/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET() {
  try {
    const stats = await Database.getDatabaseStats();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
