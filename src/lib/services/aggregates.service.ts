/*! EduSuite Unified Aggregates Service v1.0.0 */
/**
 * Single source of truth for pre-aggregated school KPI documents (O(1) dashboard reads).
 * Stored in 'school_aggregates' collection and updated atomically on writes.
 */

import { getDatabase, sanitizeDocNoBinary as sanitizeDoc } from '@/lib/mongodb';
import { SchoolAttendanceDaySummary } from '@/lib/services/attendance.service';

export interface SchoolAggregateDoc {
  id?: string;
  school_id: string;
  session: string;
  total_students: number;
  total_teachers: number;
  financials: {
    totalBilledPaise: number;
    totalCollectedPaise: number;
    totalPendingPaise: number;
    totalDiscountPaise: number;
    totalWaiverPaise: number;
    totalFinePaise: number;
    collectionPercentage: number;
    studentsWithNothingPaid: number;
    receiptsCount: number;
    monthWiseTrend: Array<{
      month: string;
      billed: number;
      collected: number;
      pending: number;
      collectionRate: number;
    }>;
  };
  attendance_snapshot?: SchoolAttendanceDaySummary;
  updated_at: string;
}

// In-memory instant cache for zero-latency (<1ms) reads
const aggregatesMemoryCache = new Map<string, { doc: SchoolAggregateDoc; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds (revalidated immediately on write)

export class AggregatesService {
  /**
   * Ensure compound indexes on school_aggregates
   */
  static async ensureIndexes(): Promise<void> {
    const db = await getDatabase();
    if (!db) return;
    try {
      await db.collection('school_aggregates').createIndex(
        { school_id: 1, session: 1 },
        { unique: true }
      );
    } catch (e: any) {
      // Non-fatal
    }
  }

  /**
   * Invalidate in-memory cache for a school
   */
  static invalidateMemoryCache(schoolId: string, session?: string): void {
    if (session) {
      aggregatesMemoryCache.delete(`${schoolId}:${session}`);
    } else {
      for (const key of Array.from(aggregatesMemoryCache.keys())) {
        if (key.startsWith(`${schoolId}:`)) {
          aggregatesMemoryCache.delete(key);
        }
      }
    }
  }

  /**
   * Get pre-aggregated summary in O(1) time
   */
  static async getSchoolAggregate(
    schoolId: string,
    session: string = '2026-27',
    forceFresh: boolean = false
  ): Promise<SchoolAggregateDoc> {
    const cacheKey = `${schoolId}:${session}`;
    const cached = aggregatesMemoryCache.get(cacheKey);
    if (!forceFresh && cached && Date.now() < cached.expiresAt) {
      return cached.doc;
    }

    const db = await getDatabase();
    if (db) {
      const doc = await db.collection('school_aggregates').findOne({
        school_id: schoolId,
        session
      });

      if (doc) {
        const sanitized = sanitizeDoc(doc) as unknown as SchoolAggregateDoc;
        aggregatesMemoryCache.set(cacheKey, {
          doc: sanitized,
          expiresAt: Date.now() + CACHE_TTL_MS
        });
        return sanitized;
      }
    }

    // If not found in DB, rebuild it once
    return this.rebuildSchoolAggregate(schoolId, session);
  }

  /**
   * Rebuild aggregate document from raw collections using MongoDB aggregation pipelines
   */
  static async rebuildSchoolAggregate(
    schoolId: string,
    session: string = '2026-27'
  ): Promise<SchoolAggregateDoc> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (!db) {
      return {
        school_id: schoolId,
        session,
        total_students: 0,
        total_teachers: 0,
        financials: {
          totalBilledPaise: 0,
          totalCollectedPaise: 0,
          totalPendingPaise: 0,
          totalDiscountPaise: 0,
          totalWaiverPaise: 0,
          totalFinePaise: 0,
          collectionPercentage: 0,
          studentsWithNothingPaid: 0,
          receiptsCount: 0,
          monthWiseTrend: []
        },
        updated_at: now
      };
    }

    // 1. Fetch counts & students in parallel
    const [totalStudents, totalTeachers, receiptsCount, ledgerAgg] = await Promise.all([
      db.collection('students').countDocuments({ school_id: schoolId, status: { $nin: ['INACTIVE', 'ALUMNI'] } }),
      db.collection('teachers').countDocuments({ school_id: schoolId }),
      db.collection('fee_receipts').countDocuments({ school_id: schoolId, academic_session: session, is_cancelled: { $ne: true } }),
      db.collection('fee_ledger').aggregate([
        {
          $match: {
            school_id: schoolId,
            academic_session: session,
            is_cancelled: { $ne: true }
          }
        },
        {
          $group: {
            _id: '$line_type',
            totalAmount: { $sum: '$amount' }
          }
        }
      ]).toArray()
    ]);

    let totalDemand = 0;
    let totalPaid = 0;
    let totalDiscount = 0;
    let totalWaiver = 0;
    let totalFine = 0;

    for (const item of ledgerAgg) {
      const amt = Math.round(item.totalAmount || 0);
      switch (item._id) {
        case 'DEMAND':
        case 'OPENING_BALANCE':
          totalDemand += amt;
          break;
        case 'PAYMENT':
          totalPaid += amt;
          break;
        case 'DISCOUNT':
          totalDiscount += amt;
          break;
        case 'WAIVER':
          totalWaiver += amt;
          break;
        case 'FINE':
          totalFine += amt;
          totalDemand += amt;
          break;
      }
    }

    const netBilled = totalDemand;
    const netPending = Math.max(0, netBilled - totalPaid - totalDiscount - totalWaiver);
    const collectionPercentage = netBilled > 0 ? Math.round((totalPaid / netBilled) * 100) : 0;

    // Student-wise zero paid count
    const studentPaymentAgg = await db.collection('fee_ledger').aggregate([
      {
        $match: {
          school_id: schoolId,
          academic_session: session,
          is_cancelled: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$student_id',
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$line_type', 'PAYMENT'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $match: { totalPaid: { $lte: 0 } }
      },
      {
        $count: 'zeroPaidCount'
      }
    ]).toArray();

    const studentsWithNothingPaid = studentPaymentAgg[0]?.zeroPaidCount || 0;

    // Month-wise aggregation pipeline
    const monthWiseAgg = await db.collection('fee_ledger').aggregate([
      {
        $match: {
          school_id: schoolId,
          academic_session: session,
          is_cancelled: { $ne: true },
          month: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$month',
          billed: {
            $sum: {
              $cond: [{ $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE', 'FINE']] }, '$amount', 0]
            }
          },
          collected: {
            $sum: {
              $cond: [{ $eq: ['$line_type', 'PAYMENT'] }, '$amount', 0]
            }
          },
          discount: {
            $sum: {
              $cond: [{ $in: ['$line_type', ['DISCOUNT', 'WAIVER']] }, '$amount', 0]
            }
          }
        }
      }
    ]).toArray();

    const academicMonths = ['APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'];
    const monthMap = new Map(monthWiseAgg.map(m => [m._id, m]));

    const monthWiseTrend = academicMonths.map(m => {
      const data = monthMap.get(m);
      const billed = Math.round((data?.billed || 0) / 100);
      const collected = Math.round((data?.collected || 0) / 100);
      const discount = Math.round((data?.discount || 0) / 100);
      const pending = Math.max(0, billed - collected - discount);
      const collectionRate = billed > 0 ? Math.round((collected / billed) * 100) : 0;
      return {
        month: m,
        billed,
        collected,
        pending,
        collectionRate
      };
    });

    const aggregateDoc: SchoolAggregateDoc = {
      school_id: schoolId,
      session,
      total_students: totalStudents,
      total_teachers: totalTeachers,
      financials: {
        totalBilledPaise: netBilled,
        totalCollectedPaise: totalPaid,
        totalPendingPaise: netPending,
        totalDiscountPaise: totalDiscount,
        totalWaiverPaise: totalWaiver,
        totalFinePaise: totalFine,
        collectionPercentage,
        studentsWithNothingPaid,
        receiptsCount,
        monthWiseTrend
      },
      updated_at: now
    };

    // Upsert into MongoDB
    await db.collection('school_aggregates').updateOne(
      { school_id: schoolId, session },
      { $set: aggregateDoc },
      { upsert: true }
    );

    // Update memory cache
    aggregatesMemoryCache.set(`${schoolId}:${session}`, {
      doc: aggregateDoc,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return aggregateDoc;
  }

  /**
   * Atomically update fee metrics on payment collection or cancellation
   */
  static async recordFeeDelta(
    schoolId: string,
    session: string = '2026-27',
    delta: {
      collectedPaiseDelta: number;
      pendingPaiseDelta: number;
      receiptsDelta?: number;
    }
  ): Promise<void> {
    this.invalidateMemoryCache(schoolId, session);
    const db = await getDatabase();
    if (!db) return;

    try {
      await db.collection('school_aggregates').updateOne(
        { school_id: schoolId, session },
        {
          $inc: {
            'financials.totalCollectedPaise': delta.collectedPaiseDelta,
            'financials.totalPendingPaise': delta.pendingPaiseDelta,
            'financials.receiptsCount': delta.receiptsDelta || 0
          },
          $set: {
            updated_at: new Date().toISOString()
          }
        }
      );
    } catch (e: any) {
      console.warn('[AggregatesService] Increment error, will rebuild:', e.message);
      await this.rebuildSchoolAggregate(schoolId, session);
    }
  }

  /**
   * Update attendance snapshot
   */
  static async updateAttendanceSnapshot(
    schoolId: string,
    session: string = '2026-27',
    snapshot: SchoolAttendanceDaySummary
  ): Promise<void> {
    this.invalidateMemoryCache(schoolId, session);
    const db = await getDatabase();
    if (!db) return;

    try {
      await db.collection('school_aggregates').updateOne(
        { school_id: schoolId, session },
        {
          $set: {
            attendance_snapshot: snapshot,
            updated_at: new Date().toISOString()
          }
        },
        { upsert: true }
      );
    } catch (e: any) {
      console.warn('[AggregatesService] Attendance snapshot update error:', e.message);
    }
  }
}
