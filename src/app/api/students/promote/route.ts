/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { promotions, school_id } = body;

    if (!Array.isArray(promotions) || promotions.length === 0) {
      return NextResponse.json({ success: false, error: 'Promotions array is required.' }, { status: 400 });
    }

    const result = await Database.bulkPromoteStudents(promotions);

    return NextResponse.json({
      success: true,
      message: `Promotion Studio executed successfully: ${result.promoted} Promoted, ${result.retained} Retained, ${result.graduated} Graduated, ${result.left} TC Issued.`,
      result
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
