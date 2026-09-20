import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import FeePayment from '@/models/fees/FeePayment';
import { requireAuth } from '@/lib/auth-guard';
import { getDatabase, sanitizeDocNoBinary } from '@/lib/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Receipt ID required' }, { status: 400 });
    }

    await connectDB();

    let receipt: any = null;
    try {
      receipt = await FeePayment.findOne({
        $or: [
          { _id: id as any },
          { receiptNo: id }
        ]
      }).lean();
    } catch {
      const db = await getDatabase();
      if (db) {
        receipt = await db.collection('fee_receipts').findOne({
          $or: [
            { receipt_no: id },
            { id: id }
          ]
        });
        if (receipt) receipt = sanitizeDocNoBinary(receipt);
      }
    }

    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: receipt
    });
  } catch (error: any) {
    console.error('[API Fee Receipt GET Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
