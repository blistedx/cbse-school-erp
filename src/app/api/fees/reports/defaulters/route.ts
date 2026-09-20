import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import StudentFee from '@/models/fees/StudentFee';
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

    // 2. Query filters
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const minDays = isNaN(daysParam) || daysParam < 0 ? 30 : daysParam;
    const className = searchParams.get('className') || searchParams.get('classId');
    const academicSession = searchParams.get('session') || searchParams.get('academicSession') || '2026-2027';

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - minDays * 24 * 60 * 60 * 1000);

    await connectDB();

    const matchCriteria: any = {
      schoolId,
      ...(academicSession && academicSession !== 'all' && { academicSession }),
      ...(className && className !== 'all' && { className })
    };

    let defaulters: any[] = [];
    let totalDefaulterAmount = 0;
    let totalDefaultersCount = 0;

    try {
      // Aggregation Pipeline for Defaulters (Due > minDays)
      defaulters = await StudentFee.aggregate([
        { $match: matchCriteria },
        {
          $addFields: {
            calculatedDue: {
              $cond: {
                if: { $gt: [{ $ifNull: ['$totalDue', 0] }, 0] },
                then: '$totalDue',
                else: {
                  $subtract: [
                    { $ifNull: ['$totalAmount', { $ifNull: ['$totalAnnualFee', 0] }] },
                    { $ifNull: ['$paidAmount', { $ifNull: ['$totalPaid', 0] }] }
                  ]
                }
              }
            },
            // Identify overdue month schedules
            overdueSchedules: {
              $filter: {
                input: { $ifNull: ['$monthSchedules', []] },
                as: 'schedule',
                cond: {
                  $and: [
                    { $lt: ['$$schedule.dueDate', cutoffDate] },
                    { $ne: ['$$schedule.status', 'paid'] },
                    { $ne: ['$$schedule.status', 'waived'] },
                    { $gt: [{ $subtract: ['$$schedule.monthlyAmount', { $ifNull: ['$$schedule.paidAmount', 0] }] }, 0] }
                  ]
                }
              }
            },
            // Direct dueDate check if top-level exists
            effectiveDueDate: {
              $ifNull: ['$dueDate', { $ifNull: ['$createdAt', new Date('2026-04-01')] }]
            }
          }
        },
        {
          $addFields: {
            daysOverdue: {
              $floor: {
                $divide: [
                  { $subtract: [now, '$effectiveDueDate'] },
                  86400000
                ]
              }
            }
          }
        },
        // Match condition: has positive due and exceeds overdue threshold
        {
          $match: {
            calculatedDue: { $gt: 0 },
            $or: [
              { daysOverdue: { $gte: minDays } },
              { $expr: { $gt: [{ $size: '$overdueSchedules' }, 0] } }
            ]
          }
        },
        // Lookup student details from students collection if available
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'studentDoc'
          }
        },
        {
          $addFields: {
            student: {
              $ifNull: [
                { $arrayElemAt: ['$studentDoc', 0] },
                {
                  _id: '$studentId',
                  name: '$studentName',
                  admissionNo: '$admissionNo',
                  className: '$className',
                  section: '$section',
                  rollNo: '$rollNo'
                }
              ]
            }
          }
        },
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
            dueAmount: '$calculatedDue',
            daysOverdue: { $max: ['$daysOverdue', minDays] },
            overdueMonths: {
              $map: {
                input: '$overdueSchedules',
                as: 'sched',
                in: {
                  month: '$$sched.month',
                  year: '$$sched.year',
                  dueDate: '$$sched.dueDate',
                  amountDue: { $subtract: ['$$sched.monthlyAmount', { $ifNull: ['$$sched.paidAmount', 0] }] }
                }
              }
            },
            student: 1,
            allocations: 1,
            lastPaymentDate: 1
          }
        },
        { $sort: { dueAmount: -1, daysOverdue: -1 } }
      ]);

      totalDefaultersCount = defaulters.length;
      totalDefaulterAmount = defaulters.reduce((sum, item) => sum + (Number(item.dueAmount) || 0), 0);

    } catch (aggError) {
      console.warn('[Defaulters Report API] Aggregation failed, using fallback query:', aggError);

      const db = await getDatabase();
      if (db) {
        const collection = db.collection('studentfees');
        const docs = await collection.find(matchCriteria).toArray();

        defaulters = docs
          .map((doc: any) => {
            const due = (doc.totalDue ?? (doc.totalAnnualFee || doc.totalAmount || 0) - (doc.totalPaid || doc.paidAmount || 0));
            const created = new Date(doc.dueDate || doc.createdAt || '2026-04-01');
            const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              _id: doc._id?.toString(),
              studentId: doc.studentId,
              studentName: doc.studentName || 'Student',
              admissionNo: doc.admissionNo || 'N/A',
              className: doc.className || 'General',
              section: doc.section || 'A',
              dueAmount: due,
              daysOverdue: Math.max(diffDays, minDays),
              student: {
                _id: doc.studentId,
                name: doc.studentName,
                admissionNo: doc.admissionNo,
                className: doc.className
              }
            };
          })
          .filter((item: any) => item.dueAmount > 0 && item.daysOverdue >= minDays)
          .sort((a: any, b: any) => b.dueAmount - a.dueAmount);

        totalDefaultersCount = defaulters.length;
        totalDefaulterAmount = defaulters.reduce((sum: number, item: any) => sum + (Number(item.dueAmount) || 0), 0);
      }
    }

    // Class-wise summary breakdown for management dashboard
    const classSummaryMap: Record<string, { count: number; totalDue: number }> = {};
    for (const d of defaulters) {
      const cls = d.className || 'Unknown';
      if (!classSummaryMap[cls]) classSummaryMap[cls] = { count: 0, totalDue: 0 };
      classSummaryMap[cls].count += 1;
      classSummaryMap[cls].totalDue += Number(d.dueAmount) || 0;
    }

    const classSummary = Object.entries(classSummaryMap).map(([className, val]) => ({
      className,
      defaulterCount: val.count,
      totalDue: val.totalDue
    })).sort((a, b) => b.totalDue - a.totalDue);

    return NextResponse.json({
      success: true,
      data: defaulters,
      summary: {
        schoolId,
        minDaysOverdue: minDays,
        cutoffDate: cutoffDate.toISOString(),
        totalDefaultersCount,
        totalDefaulterAmount,
        classSummary
      }
    });

  } catch (error: any) {
    console.error('[Defaulters Report API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate defaulters report' },
      { status: 500 }
    );
  }
}
