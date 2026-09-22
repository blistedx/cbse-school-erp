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
    thisMonthBreakdown?: Array<{
      className: string;
      totalStudents: number;
      submittedCount: number;
      notSubmittedCount: number;
      collectedPaise: number;
    }>;
    topPending?: Array<{
      studentId: string;
      studentName: string;
      admissionNo: string;
      classSection: string;
      fatherName: string;
      mobile: string;
      pendingPaise: number;
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
    if (!forceFresh && cached && Date.now() < cached.expiresAt && cached.doc.financials?.thisMonthBreakdown && cached.doc.financials.thisMonthBreakdown.length > 0 && cached.doc.financials?.topPending && cached.doc.financials.topPending.length > 0) {
      return cached.doc;
    }

    const db = await getDatabase();
    if (db && !forceFresh) {
      const doc = await db.collection('school_aggregates').findOne({
        school_id: schoolId,
        session
      });

      if (doc && (doc as any).financials?.thisMonthBreakdown?.length > 0 && (doc as any).financials?.topPending?.length > 0) {
        const sanitized = sanitizeDoc(doc) as unknown as SchoolAggregateDoc;
        aggregatesMemoryCache.set(cacheKey, {
          doc: sanitized,
          expiresAt: Date.now() + CACHE_TTL_MS
        });
        return sanitized;
      }
    }

    // If not found in DB or missing thisMonthBreakdown/topPending, rebuild it
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

    const academicMonths = [
      { key: 'APR', label: 'APR', full: 'April' },
      { key: 'MAY', label: 'MAY', full: 'May' },
      { key: 'JUN', label: 'JUN', full: 'June' },
      { key: 'JUL', label: 'JUL', full: 'July' },
      { key: 'AUG', label: 'AUG', full: 'August' },
      { key: 'SEP', label: 'SEP', full: 'September' },
      { key: 'OCT', label: 'OCT', full: 'October' },
      { key: 'NOV', label: 'NOV', full: 'November' },
      { key: 'DEC', label: 'DEC', full: 'December' },
      { key: 'JAN', label: 'JAN', full: 'January' },
      { key: 'FEB', label: 'FEB', full: 'February' },
      { key: 'MAR', label: 'MAR', full: 'March' }
    ];
    const monthMap = new Map<string, any>();
    for (const m of monthWiseAgg) {
      if (m._id) {
        monthMap.set(String(m._id).toUpperCase().trim(), m);
      }
    }

    const monthWiseTrend = academicMonths.map(m => {
      const data = monthMap.get(m.key) || monthMap.get(m.label) || monthMap.get(m.full.toUpperCase());
      const billed = Math.round((data?.billed || 0) / 100);
      const collected = Math.round((data?.collected || 0) / 100);
      const discount = Math.round((data?.discount || 0) / 100);
      const pending = Math.max(0, billed - collected - discount);
      const collectionRate = billed > 0 ? Math.round((collected / billed) * 100) : 0;
      const yearStr = ['JAN', 'FEB', 'MAR'].includes(m.key) ? '2027' : '2026';
      return {
        month: m.key,
        label: m.key,
        period: `${m.full} ${yearStr}`,
        billed,
        collected,
        pending,
        demandRupees: billed,
        collectedRupees: collected,
        paidRupees: collected,
        duesRupees: pending,
        discountRupees: discount,
        collectionRate
      };
    });

    // 4. Compute Month Breakdown (September) & Top Pending Defaulters
    const [studentsForStats, demandsForStats, receiptsForStats] = await Promise.all([
      db.collection('students').find(
        { $or: [{ school_id: schoolId }, { school_id: 'DPS2026' }] },
        { projection: { id: 1, full_name: 1, first_name: 1, last_name: 1, admission_no: 1, class_name: 1, section: 1, father_name: 1, mobile: 1, phone: 1 } }
      ).toArray(),
      db.collection('fee_demands').find(
        { $or: [{ schoolId }, { schoolId: 'DPS2026' }], sessionId: session },
        { projection: { studentId: 1, period: 1, netAmount: 1 } }
      ).toArray(),
      db.collection('fee_receipts').find(
        { $or: [{ school_id: schoolId }, { school_id: 'DPS2026' }], academic_session: session, is_cancelled: { $ne: true } },
        { projection: { student_id: 1, amount_paise: 1, allocated_heads: 1 } }
      ).toArray()
    ]);

    const demandsByStudent = new Map<string, any[]>();
    for (const d of demandsForStats) {
      if (!demandsByStudent.has(d.studentId)) demandsByStudent.set(d.studentId, []);
      demandsByStudent.get(d.studentId)!.push(d);
    }

    const receiptsByStudent = new Map<string, any[]>();
    for (const r of receiptsForStats) {
      if (!receiptsByStudent.has(r.student_id)) receiptsByStudent.set(r.student_id, []);
      receiptsByStudent.get(r.student_id)!.push(r);
    }

    const classMap = new Map<string, {
      className: string;
      totalStudents: number;
      submittedCount: number;
      notSubmittedCount: number;
      collectedPaise: number;
    }>();

    const studentDues: Array<{
      studentId: string;
      studentName: string;
      admissionNo: string;
      classSection: string;
      fatherName: string;
      mobile: string;
      pendingPaise: number;
    }> = [];

    const CLASS_ORDER_MAP: Record<string, number> = {
      'playgroup': 1, 'pg': 1, 'nursery': 2, 'lkg': 3, 'ukg': 4, 'kg': 4,
      'class 1': 5, '1': 5, 'class 2': 6, '2': 6, 'class 3': 7, '3': 7,
      'class 4': 8, '4': 8, 'class 5': 9, '5': 9, 'class 6': 10, '6': 10,
      'class 7': 11, '7': 11, 'class 8': 12, '8': 12, 'class 9': 13, '9': 13,
      'class 10': 14, '10': 14, 'class 11': 15, '11': 15, 'class 12': 16, '12': 16
    };

    for (const s of studentsForStats) {
      const sId = (s as any).id || String((s as any)._id);
      const cls = s.class_name || 'Class 1';
      const sec = s.section || 'A';
      const sName = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Scholar';
      const sAdm = s.admission_no || '';
      const sFather = s.father_name || '';
      const sMobile = s.mobile || s.phone || '';

      if (!classMap.has(cls)) {
        classMap.set(cls, {
          className: cls,
          totalStudents: 0,
          submittedCount: 0,
          notSubmittedCount: 0,
          collectedPaise: 0
        });
      }
      const cData = classMap.get(cls)!;
      cData.totalStudents++;

      const sDemands = demandsByStudent.get(sId) || [];
      const sReceipts = receiptsByStudent.get(sId) || [];

      // Month calculation for September
      const sepDemands = sDemands.filter((d: any) => {
        const p = String(d.period || '').toUpperCase();
        return p === 'SEP' || p.includes('SEP') || p === 'SLOT_5_SEP_FEB' || p === 'SEP_FEB';
      });
      const sepDemandTotal = sepDemands.reduce((sum: number, d: any) => sum + (d.netAmount || 0), 0);
      
      let sepPaid = 0;
      for (const r of sReceipts) {
        for (const h of (r.allocated_heads || [])) {
          const hp = String(h.period || h.month || '').toUpperCase();
          if (hp === 'SEP' || hp.includes('SEP') || hp === 'SLOT_5_SEP_FEB' || hp === 'SEP_FEB') {
            sepPaid += (h.amount_paise || 0);
          }
        }
      }

      const effectiveSepPaid = Math.min(sepDemandTotal, sepPaid);
      const sepPending = Math.max(0, sepDemandTotal - effectiveSepPaid);
      cData.collectedPaise += effectiveSepPaid;

      if (sepPending === 0 && sepDemandTotal > 0) {
        cData.submittedCount++;
      } else {
        cData.notSubmittedCount++;
      }

      // Overall session pending dues
      const totalDemandAmt = sDemands.reduce((sum: number, d: any) => sum + (d.netAmount || 0), 0);
      const totalPaidAmt = sReceipts.reduce((sum: number, r: any) => sum + (r.amount_paise || 0), 0);
      const netBalance = Math.max(0, totalDemandAmt - totalPaidAmt);

      if (netBalance > 0) {
        studentDues.push({
          studentId: sId,
          studentName: sName,
          admissionNo: sAdm,
          classSection: `${cls} - ${sec}`,
          fatherName: sFather,
          mobile: sMobile,
          pendingPaise: netBalance
        });
      }
    }

    const thisMonthBreakdown = Array.from(classMap.values()).sort((a, b) => {
      const ordA = CLASS_ORDER_MAP[a.className.toLowerCase()] || 99;
      const ordB = CLASS_ORDER_MAP[b.className.toLowerCase()] || 99;
      return ordA - ordB;
    });

    studentDues.sort((a, b) => b.pendingPaise - a.pendingPaise);
    const topPending = studentDues.slice(0, 10);

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
        monthWiseTrend,
        thisMonthBreakdown,
        topPending
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
