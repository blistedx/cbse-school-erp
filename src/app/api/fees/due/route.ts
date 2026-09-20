import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import StudentFee from '@/models/fees/StudentFee';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { getDatabase, sanitizeDocNoBinary } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenantResult = resolveTenantSchoolId(auth, searchParams.get('schoolId') || searchParams.get('school_id'));
    if (tenantResult instanceof NextResponse) return tenantResult;
    const schoolId = tenantResult;

    const className = searchParams.get('className') || searchParams.get('class_name') || searchParams.get('classId');
    const academicSession = searchParams.get('session') || searchParams.get('academicSession') || '2026-2027';
    const studentId = searchParams.get('studentId') || searchParams.get('student_id');

    await connectDB();

    // 1. Construct Aggregation Pipeline
    const matchQuery: any = {
      schoolId,
      ...(academicSession && { academicSession }),
      ...(className && { className }),
      ...(studentId && { studentId })
    };

    let dues: any[] = [];

    try {
      dues = await StudentFee.aggregate([
        { $match: matchQuery },
        {
          $addFields: {
            calculatedDue: {
              $cond: {
                if: { $gt: [{ $ifNull: ['$totalDue', 0] }, 0] },
                then: '$totalDue',
                else: {
                  $subtract: [
                    { $ifNull: ['$totalAnnualFee', 0] },
                    { $add: [{ $ifNull: ['$totalPaid', 0] }, { $ifNull: ['$totalConcession', 0] }] }
                  ]
                }
              }
            }
          }
        },
        { $match: { calculatedDue: { $gt: 0 } } },
        {
          $project: {
            _id: 1,
            studentId: 1,
            studentName: 1,
            admissionNo: 1,
            className: 1,
            section: 1,
            rollNo: 1,
            totalAnnualFee: 1,
            totalPaid: 1,
            totalConcession: 1,
            totalDue: '$calculatedDue',
            allocations: 1,
            monthSchedules: 1,
            status: 1,
            lastPaymentDate: 1
          }
        },
        { $sort: { totalDue: -1, studentName: 1 } }
      ]);
    } catch {
      // Direct Mongo Native Query Fallback
      const db = await getDatabase();
      if (db) {
        const rawList = await db.collection('student_fees').find(matchQuery).toArray();
        dues = rawList
          .map(sanitizeDocNoBinary)
          .map((item: any) => {
            const due = item.totalDue !== undefined ? item.totalDue : Math.max(0, (item.totalAnnualFee || 0) - (item.totalPaid || 0) - (item.totalConcession || 0));
            return { ...item, totalDue: due };
          })
          .filter((item: any) => item.totalDue > 0)
          .sort((a: any, b: any) => b.totalDue - a.totalDue);
      }
    }

    // 2. Compute Summary Metrics
    const totalDueAmount = dues.reduce((sum, d) => sum + (Number(d.totalDue) || 0), 0);
    const totalCollectedAmount = dues.reduce((sum, d) => sum + (Number(d.totalPaid) || 0), 0);
    const totalStudentsWithDues = dues.length;

    return NextResponse.json({
      success: true,
      summary: {
        totalStudentsWithDues,
        totalDueAmount,
        totalCollectedAmount,
        academicSession,
        schoolId
      },
      count: dues.length,
      data: dues
    });

  } catch (error: any) {
    console.error('[API Fees Due GET Error]', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch pending fee dues' 
    }, { status: 500 });
  }
}
