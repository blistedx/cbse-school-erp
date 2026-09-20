import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Transaction from '@/models/finance/Transaction';
import Income from '@/models/finance/Income';
import Expense from '@/models/finance/Expense';
import { extractToken, verifySessionToken, canonicalizeSchoolId } from '@/lib/auth-guard';
import { getDatabase, sanitizeDocNoBinary } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Resolve tenant/schoolId
    let schoolId: string = searchParams.get('schoolId') || searchParams.get('school_id') || '';
    const token = extractToken(req);
    if (token) {
      const payload = verifySessionToken(token);
      if (payload && payload.schoolId) {
        const isSuperAdmin = ['AGENCY_SUPERADMIN', 'SUPERADMIN', 'GOD_ACCESS'].includes((payload.role || '').toUpperCase());
        if (!isSuperAdmin || !schoolId) {
          schoolId = payload.schoolId;
        }
      }
    }
    schoolId = canonicalizeSchoolId(schoolId || 'DPS2026');

    // 2. Parse dates (default: current financial year or current month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (April is 3)
    
    // Default to Indian Financial Year (April 1 to March 31)
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const defaultFrom = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // April 1
    const defaultTo = new Date(fyStartYear + 1, 2, 31, 23, 59, 59, 999); // March 31 next year

    const fromParam = searchParams.get('from') || searchParams.get('startDate');
    const toParam = searchParams.get('to') || searchParams.get('endDate');

    const from = fromParam ? new Date(fromParam) : defaultFrom;
    if (isNaN(from.getTime())) from.setTime(defaultFrom.getTime());
    from.setHours(0, 0, 0, 0);

    const to = toParam ? new Date(toParam) : defaultTo;
    if (isNaN(to.getTime())) to.setTime(defaultTo.getTime());
    to.setHours(23, 59, 59, 999);

    await connectDB();

    let result: any[] = [];
    let income: any[] = [];
    let expense: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    try {
      // 1. Aggregate from Transaction collection
      result = await Transaction.aggregate([
        { 
          $match: { 
            schoolId, 
            date: { $gte: from, $lte: to } 
          } 
        },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.type': 1, total: -1 } }
      ]);

      // 2. If Transaction collection returned records
      if (result && result.length > 0) {
        income = result
          .filter(r => r._id && r._id.type === 'income')
          .map(r => ({ category: r._id.category, total: r.total, count: r.count }));

        expense = result
          .filter(r => r._id && r._id.type === 'expense')
          .map(r => ({ category: r._id.category, total: r.total, count: r.count }));

        totalIncome = income.reduce((s, r) => s + (Number(r.total) || 0), 0);
        totalExpense = expense.reduce((s, r) => s + (Number(r.total) || 0), 0);
      } else {
        // Fallback: Check Income & Expense collections if Transaction is not populated
        const [incomeAgg, expenseAgg] = await Promise.all([
          Income.aggregate([
            { $match: { schoolId, date: { $gte: from, $lte: to }, status: { $ne: 'cancelled' } } },
            { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
          ]),
          Expense.aggregate([
            { $match: { schoolId, date: { $gte: from, $lte: to }, status: { $ne: 'cancelled' } } },
            { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
          ])
        ]);

        income = incomeAgg.map(r => ({ category: r._id, total: r.total, count: r.count }));
        expense = expenseAgg.map(r => ({ category: r._id, total: r.total, count: r.count }));

        totalIncome = income.reduce((s, r) => s + (Number(r.total) || 0), 0);
        totalExpense = expense.reduce((s, r) => s + (Number(r.total) || 0), 0);
      }
    } catch (aggError) {
      console.warn('[P&L Report API] Aggregation failed, using native DB fallback:', aggError);

      const db = await getDatabase();
      if (db) {
        const txCollection = db.collection('transactions');
        const docs = await txCollection.find({
          schoolId,
          date: { $gte: from, $lte: to }
        }).toArray();

        const incMap: Record<string, { total: number; count: number }> = {};
        const expMap: Record<string, { total: number; count: number }> = {};

        for (const doc of docs) {
          const amt = Number(doc.amount) || 0;
          const cat = doc.category || 'General';
          if (doc.type === 'income') {
            if (!incMap[cat]) incMap[cat] = { total: 0, count: 0 };
            incMap[cat].total += amt;
            incMap[cat].count += 1;
            totalIncome += amt;
          } else if (doc.type === 'expense') {
            if (!expMap[cat]) expMap[cat] = { total: 0, count: 0 };
            expMap[cat].total += amt;
            expMap[cat].count += 1;
            totalExpense += amt;
          }
        }

        income = Object.entries(incMap).map(([category, val]) => ({ category, total: val.total, count: val.count }));
        expense = Object.entries(expMap).map(([category, val]) => ({ category, total: val.total, count: val.count }));
      }
    }

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        schoolId,
        from: from.toISOString(),
        to: to.toISOString(),
        income,
        expense,
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin,
        status: netProfit >= 0 ? 'SURPLUS' : 'DEFICIT'
      }
    });

  } catch (error: any) {
    console.error('[P&L Report API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate P&L report' },
      { status: 500 }
    );
  }
}
