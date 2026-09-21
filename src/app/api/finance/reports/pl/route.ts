import { NextRequest, NextResponse } from 'next/server';
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

    let income: any[] = [];
    let expense: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    const db = await getDatabase();
    if (db) {
      // Aggregate income from fee_receipts & fee_ledger
      const receipts = await db.collection('fee_receipts').find({
        school_id: schoolId,
        is_cancelled: { $ne: true }
      }).toArray();

      const incMap: Record<string, { total: number; count: number }> = {};
      for (const r of receipts) {
        const cat = r.payment_mode || 'Fee Collections';
        const amt = Number(r.amount_paid || r.amount) || 0;
        if (!incMap[cat]) incMap[cat] = { total: 0, count: 0 };
        incMap[cat].total += amt;
        incMap[cat].count += 1;
        totalIncome += amt;
      }

      income = Object.entries(incMap).map(([category, val]) => ({ category, total: val.total, count: val.count }));
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
