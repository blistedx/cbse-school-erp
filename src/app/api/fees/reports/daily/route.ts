import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import FeePayment from '@/models/fees/FeePayment';
import { extractToken, verifySessionToken, canonicalizeSchoolId } from '@/lib/auth-guard';
import { getDatabase, sanitizeDocNoBinary } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Resolve tenant/schoolId from session or query param
    let schoolId: string = searchParams.get('schoolId') || searchParams.get('school_id') || '';
    const token = extractToken(req);
    if (token) {
      const payload = verifySessionToken(token);
      if (payload && payload.schoolId) {
        // If not superadmin, enforce session schoolId
        const isSuperAdmin = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'].includes((payload.role || '').toUpperCase());
        if (!isSuperAdmin || !schoolId) {
          schoolId = payload.schoolId;
        }
      }
    }
    schoolId = canonicalizeSchoolId(schoolId || 'DPS2026');

    // Parse date parameters
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDateParam = searchParams.get('startDate') || dateParam;
    const endDateParam = searchParams.get('endDate') || dateParam;
    const paymentMode = searchParams.get('paymentMode') || searchParams.get('mode');
    const academicSession = searchParams.get('session') || searchParams.get('academicSession');

    const start = new Date(startDateParam);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateParam);
    end.setHours(23, 59, 59, 999);

    await connectDB();

    // Match criteria
    const matchCriteria: any = {
      schoolId,
      paymentDate: { $gte: start, $lte: end },
      status: { $in: ['success', 'COMPLETED', 'PAID'] }
    };

    if (paymentMode && paymentMode !== 'all') {
      matchCriteria.paymentMode = paymentMode.toLowerCase();
    }

    if (academicSession && academicSession !== 'all') {
      matchCriteria.academicSession = academicSession;
    }

    let report: any[] = [];
    let headBreakdown: any[] = [];
    let transactions: any[] = [];
    let grandTotal = 0;
    let totalTransactions = 0;

    try {
      // 1. Group by payment mode
      report = await FeePayment.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: '$paymentMode',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          }
        },
        { $sort: { total: -1 } }
      ]);

      // 2. Fee Heads Breakdown aggregation
      headBreakdown = await FeePayment.aggregate([
        { $match: matchCriteria },
        { $unwind: { path: '$breakdown', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: { $ifNull: ['$breakdown.headName', '$breakdown.feeHeadId'] },
            headId: { $first: '$breakdown.feeHeadId' },
            headName: { $first: '$breakdown.headName' },
            count: { $sum: 1 },
            totalAmount: { $sum: '$breakdown.amount' },
            totalFine: { $sum: { $ifNull: ['$breakdown.fine', 0] } },
            totalConcession: { $sum: { $ifNull: ['$breakdown.concession', 0] } },
            netTotal: { 
              $sum: { 
                $ifNull: [
                  '$breakdown.netAmount', 
                  { $subtract: [{ $add: ['$breakdown.amount', { $ifNull: ['$breakdown.fine', 0] }] }, { $ifNull: ['$breakdown.concession', 0] }] }
                ] 
              } 
            }
          }
        },
        { $sort: { netTotal: -1 } }
      ]);

      // 3. Itemized Recent Transactions for this period
      transactions = await FeePayment.find(matchCriteria)
        .sort({ paymentDate: -1, createdAt: -1 })
        .limit(200)
        .lean();

      grandTotal = report.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      totalTransactions = report.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

    } catch (aggError) {
      console.warn('[Daily Report API] Mongoose aggregate failed, attempting Native DB fallback:', aggError);
      
      const db = await getDatabase();
      if (db) {
        const collection = db.collection('feepayments');
        const docs = await collection.find(matchCriteria).sort({ paymentDate: -1 }).toArray();
        
        const modeMap: Record<string, { count: number; total: number }> = {};
        for (const doc of docs) {
          const mode = doc.paymentMode || 'cash';
          const amt = Number(doc.amount) || 0;
          if (!modeMap[mode]) modeMap[mode] = { count: 0, total: 0 };
          modeMap[mode].count += 1;
          modeMap[mode].total += amt;
          grandTotal += amt;
          totalTransactions += 1;
        }

        report = Object.entries(modeMap).map(([mode, val]) => ({
          _id: mode,
          count: val.count,
          total: val.total
        }));

        transactions = docs.map(sanitizeDocNoBinary);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        schoolId,
        grandTotal,
        totalTransactions,
        report,
        headBreakdown,
        transactions
      }
    });

  } catch (error: any) {
    console.error('[Daily Fee Report API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate daily collection report' },
      { status: 500 }
    );
  }
}
