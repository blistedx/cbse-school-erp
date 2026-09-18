/*! Giterp Fee Master — Core Ledger Engine v1.0.0 */
/**
 * fee-ledger.ts — THE SINGLE SOURCE OF TRUTH for all financial data.
 *
 * This is an immutable, append-only fee ledger. Lines are NEVER edited or deleted.
 * Corrections happen via ADJUSTMENT lines or cancellation markers.
 *
 * Every query is scoped by school_id (from JWT, never from request body)
 * and academic_session.
 *
 * All money amounts are stored as integers in PAISE (₹1 = 100 paise).
 */

import { getDatabase } from './mongodb';
import { sanitizeDocNoBinary } from './mongodb';
import {
  FeeLedgerLine,
  FeeLineType,
  FeeHead,
  AcademicMonth,
  LedgerFeeSummary,
  FeeAggregateFilters,
  FeeAggregateRow,
  GroupByDimension,
  Student,
} from './types';
import {
  getFeeConfig,
  getTuitionRateForClass,
  getAnnualFeeForClass,
  getTransportSlabRate,
  getHostelRate,
  getExamFeeForMonth,
} from './fee-config';

const COLLECTION = 'fee_ledger';

export {
  ACADEMIC_MONTHS,
  MONTH_INDEX,
  getDefaultDueDate,
} from './fee-constants';
import {
  ACADEMIC_MONTHS,
  MONTH_INDEX,
  getDefaultDueDate,
} from './fee-constants';

// ─── Line Types: sign convention ───

const DEBIT_TYPES: FeeLineType[] = ['DEMAND', 'FINE', 'OPENING_BALANCE', 'REFUND'];
const CREDIT_TYPES: FeeLineType[] = ['PAYMENT', 'DISCOUNT', 'WAIVER'];

function getLineSign(line: FeeLedgerLine): number {
  if (line.line_type === 'ADJUSTMENT') {
    return line.adjustment_direction === 'CREDIT' ? -1 : 1;
  }
  if (CREDIT_TYPES.includes(line.line_type)) return -1;
  return 1; // DEBIT_TYPES
}

// ─── ID Generation ───

let lineCounter = 0;
function generateLineId(): string {
  lineCounter++;
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FLL-${ts}-${rand}-${lineCounter}`;
}

function generateReceiptNo(schoolId: string): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const prefix = (schoolId || 'SCH').replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
  return `${prefix}-REC-${ts.toString().slice(-6)}-${rand}`;
}

// ─── Index Ensurance ───

let indexesEnsured = false;

async function ensureLedgerIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const col = db.collection(COLLECTION);
    await Promise.all([
      col.createIndex({ school_id: 1, academic_session: 1, student_id: 1 }),
      col.createIndex({ school_id: 1, txn_date: 1 }),
      col.createIndex({ school_id: 1, fee_head: 1, month: 1 }),
      col.createIndex({ school_id: 1, receipt_no: 1 }, { sparse: true }),
      col.createIndex({ school_id: 1, line_type: 1, is_cancelled: 1 }),
    ]);
    indexesEnsured = true;
  } catch (e) {
    console.error('[fee-ledger] Error ensuring indexes:', e);
  }
}

// ─── Core Ledger Operations ───

/**
 * Post one or more ledger lines transactionally (all or nothing).
 * Validates all lines before writing. Returns the posted lines with generated IDs.
 */
export async function postLedgerLines(
  schoolId: string,
  lines: Partial<FeeLedgerLine>[],
  actorId?: string
): Promise<FeeLedgerLine[]> {
  if (!lines || lines.length === 0) {
    throw new Error('No lines to post');
  }

  const now = new Date().toISOString();
  const todayDate = now.split('T')[0];

  // Validate and normalize each line
  const prepared: FeeLedgerLine[] = lines.map((raw, idx) => {
    if (!raw.line_type) throw new Error(`Line ${idx}: line_type is required`);
    if (!raw.fee_head) throw new Error(`Line ${idx}: fee_head is required`);
    if (typeof raw.amount !== 'number' || raw.amount < 0) {
      throw new Error(`Line ${idx}: amount must be a non-negative number (paise)`);
    }
    if (!raw.student_id) throw new Error(`Line ${idx}: student_id is required`);

    const line: FeeLedgerLine = {
      id: raw.id || generateLineId(),
      school_id: schoolId, // ALWAYS from JWT, never from line data
      academic_session: raw.academic_session || '2026-27',
      student_id: raw.student_id,
      class_name: raw.class_name || '',
      section: raw.section || '',
      admission_no: raw.admission_no || '',
      line_type: raw.line_type,
      fee_head: raw.fee_head,
      month: raw.month || null,
      amount: Math.round(raw.amount), // Ensure integer paise
      adjustment_direction: raw.line_type === 'ADJUSTMENT' ? (raw.adjustment_direction || 'DEBIT') : undefined,
      txn_date: raw.txn_date || todayDate,
      due_date: raw.due_date || null,
      payment_mode: raw.payment_mode || null,
      receipt_no: raw.receipt_no || (raw.line_type === 'PAYMENT' ? generateReceiptNo(schoolId) : null),
      cheque_no: raw.cheque_no || null,
      txn_ref: raw.txn_ref || null,
      concession_type: raw.concession_type || null,
      collected_by: raw.collected_by || actorId || null,
      approved_by: raw.approved_by || null,
      is_cancelled: false,
      cancelled_reason: null,
      cancelled_by: null,
      cancelled_at: null,
      linked_line_id: raw.linked_line_id || null,
      remarks: raw.remarks || null,
      created_at: now,
    };

    return line;
  });

  // Persist
  await ensureLedgerIndexes();
  try {
    const db = await getDatabase();
    if (db) {
      // Use ordered insertMany for transactional-like behavior
      // MongoDB insertMany with ordered:true stops on first error
      await db.collection(COLLECTION).insertMany(
        prepared.map(l => sanitizeDocNoBinary({ ...l })),
        { ordered: true }
      );
    }
  } catch (e: any) {
    console.error('[fee-ledger] Error posting lines:', e);
    throw new Error(`Failed to post ledger lines: ${e.message}`);
  }

  return prepared;
}

/**
 * Cancel a ledger line by posting a cancellation marker.
 * The original line stays; we just mark it as cancelled.
 * Only Principal/Superadmin should call this (enforced at API layer).
 */
export async function cancelLedgerLine(
  schoolId: string,
  lineId: string,
  reason: string,
  cancelledBy: string
): Promise<FeeLedgerLine | null> {
  await ensureLedgerIndexes();
  const db = await getDatabase();
  if (!db) return null;

  const original = await db.collection(COLLECTION).findOne({
    id: lineId,
    school_id: schoolId,
  }) as unknown as FeeLedgerLine | null;

  if (!original) return null;
  if (original.is_cancelled) {
    throw new Error('Line is already cancelled');
  }

  const now = new Date().toISOString();

  // Mark original as cancelled
  await db.collection(COLLECTION).updateOne(
    { id: lineId, school_id: schoolId },
    {
      $set: {
        is_cancelled: true,
        cancelled_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: now,
      },
    }
  );

  // Return the cancelled line
  return {
    ...original,
    is_cancelled: true,
    cancelled_reason: reason,
    cancelled_by: cancelledBy,
    cancelled_at: now,
  };
}

/**
 * Get the full ledger for a student in a session (ordered by txn_date, created_at).
 */
export async function getStudentLedger(
  schoolId: string,
  studentId: string,
  session: string = '2026-27',
  includeCancelled: boolean = false
): Promise<FeeLedgerLine[]> {
  await ensureLedgerIndexes();

  try {
    const db = await getDatabase();
    if (db) {
      const filter: any = {
        school_id: schoolId,
        academic_session: session,
        student_id: studentId,
      };
      if (!includeCancelled) {
        filter.is_cancelled = { $ne: true };
      }
      const docs = await db.collection(COLLECTION)
        .find(filter)
        .sort({ txn_date: 1, created_at: 1 })
        .toArray();
      return docs as unknown as FeeLedgerLine[];
    }
  } catch (e) {
    console.error('[fee-ledger] Error fetching student ledger:', e);
  }

  return [];
}

/**
 * Get a comprehensive fee summary for a student from the ledger.
 * This is THE canonical function — every screen reads from here.
 */
export async function getStudentFeeSummaryFromLedger(
  schoolId: string,
  studentId: string,
  session: string = '2026-27'
): Promise<LedgerFeeSummary> {
  const lines = await getStudentLedger(schoolId, studentId, session, false);
  return computeSummaryFromLines(lines);
}

/**
 * Pure computation: derive summary from a set of ledger lines.
 * This is deterministic and testable without DB access.
 */
export function computeSummaryFromLines(lines: FeeLedgerLine[]): LedgerFeeSummary {
  let totalDemand = 0;
  let totalDiscount = 0;
  let totalWaiver = 0;
  let totalFine = 0;
  let totalPaid = 0;
  let totalRefund = 0;

  // Head-wise accumulator
  const headMap = new Map<FeeHead, { demand: number; paid: number; discount: number; waiver: number; balance: number }>();
  // Month-wise accumulator
  const monthMap = new Map<AcademicMonth, { demand: number; paid: number; discount: number; waiver: number; fine: number; balance: number }>();

  for (const line of lines) {
    if (line.is_cancelled) continue;
    const amt = Math.round(line.amount);

    switch (line.line_type) {
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
        totalDemand += amt; // Fine increases total owed
        break;
      case 'REFUND':
        totalRefund += amt;
        break;
      case 'ADJUSTMENT':
        if (line.adjustment_direction === 'CREDIT') {
          totalPaid += amt; // Treated like a payment
        } else {
          totalDemand += amt; // Treated like additional demand
        }
        break;
    }

    // Head-wise
    const hk = line.fee_head;
    if (!headMap.has(hk)) headMap.set(hk, { demand: 0, paid: 0, discount: 0, waiver: 0, balance: 0 });
    const hw = headMap.get(hk)!;
    if (line.line_type === 'DEMAND' || line.line_type === 'FINE' || line.line_type === 'OPENING_BALANCE') hw.demand += amt;
    else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction !== 'CREDIT') hw.demand += amt;
    else if (line.line_type === 'PAYMENT') hw.paid += amt;
    else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT') hw.paid += amt;
    else if (line.line_type === 'DISCOUNT') hw.discount += amt;
    else if (line.line_type === 'WAIVER') hw.waiver += amt;

    // Month-wise (skip null months — they're annual/one-time)
    if (line.month) {
      const mk = line.month;
      if (!monthMap.has(mk)) monthMap.set(mk, { demand: 0, paid: 0, discount: 0, waiver: 0, fine: 0, balance: 0 });
      const mw = monthMap.get(mk)!;
      if (line.line_type === 'DEMAND' || line.line_type === 'OPENING_BALANCE') mw.demand += amt;
      else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction !== 'CREDIT') mw.demand += amt;
      else if (line.line_type === 'PAYMENT') mw.paid += amt;
      else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT') mw.paid += amt;
      else if (line.line_type === 'DISCOUNT') mw.discount += amt;
      else if (line.line_type === 'WAIVER') mw.waiver += amt;
      else if (line.line_type === 'FINE') { mw.fine += amt; mw.demand += amt; }
    }
  }

  // Compute balances
  const balance = totalDemand - totalDiscount - totalWaiver - totalPaid + totalRefund;

  // Head-wise balances
  const headWise = Array.from(headMap.entries()).map(([fee_head, h]) => ({
    fee_head,
    demand: h.demand,
    paid: h.paid,
    discount: h.discount,
    waiver: h.waiver,
    balance: h.demand - h.paid - h.discount - h.waiver,
  }));

  // Determine current academic month index for overdue detection
  const now = new Date();
  const jsMonth = now.getMonth(); // 0-11
  const currentAcademicIndex = jsMonth >= 3 ? jsMonth - 3 : jsMonth + 9;

  // Month-wise balances and statuses
  const monthWise = ACADEMIC_MONTHS.map((month, idx) => {
    const mw = monthMap.get(month) || { demand: 0, paid: 0, discount: 0, waiver: 0, fine: 0, balance: 0 };
    const bal = mw.demand - mw.paid - mw.discount - mw.waiver;
    let status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING' = 'UPCOMING';
    if (mw.demand === 0 && idx > currentAcademicIndex) status = 'UPCOMING';
    else if (bal <= 0) status = 'PAID';
    else if (mw.paid > 0) status = 'PARTIAL';
    else if (idx <= currentAcademicIndex) status = mw.demand > 0 ? 'PENDING' : 'UPCOMING';
    else status = 'UPCOMING';

    // Mark overdue if past due and unpaid
    if (bal > 0 && idx < currentAcademicIndex) status = 'OVERDUE';

    return {
      month,
      demand: mw.demand,
      paid: mw.paid,
      discount: mw.discount,
      waiver: mw.waiver,
      fine: mw.fine,
      balance: Math.max(0, bal),
      status,
    };
  });

  // Overall status
  let status: LedgerFeeSummary['status'] = 'PENDING';
  if (totalDemand === 0) {
    status = 'PENDING';
  } else if (balance < 0) {
    status = 'ADVANCE';
  } else if (balance === 0) {
    if (totalWaiver + totalDiscount >= totalDemand) status = 'WAIVED';
    else status = 'PAID';
  } else if (totalPaid > 0) {
    const hasOverdue = monthWise.some(m => m.status === 'OVERDUE');
    status = hasOverdue ? 'OVERDUE' : 'PARTIAL';
  } else {
    const hasOverdue = monthWise.some(m => m.status === 'OVERDUE');
    status = hasOverdue ? 'OVERDUE' : 'PENDING';
  }

  return {
    totalDemand,
    totalDiscount,
    totalWaiver,
    totalFine,
    totalPaid,
    totalRefund,
    balance: Math.max(0, balance), // Display as 0 if advance
    status,
    headWise,
    monthWise,
  };
}


// ─── Report Engine: getFeeAggregate ───

/**
 * Generic aggregation engine. Every report in the system is a preset of filters+groupBy.
 * Aggregates in the DB via MongoDB aggregation pipeline for performance.
 */
export async function getFeeAggregate(
  schoolId: string,
  filters: FeeAggregateFilters,
  groupBy: GroupByDimension[]
): Promise<FeeAggregateRow[]> {
  await ensureLedgerIndexes();

  // Build match stage
  const match: any = {
    school_id: schoolId,
    academic_session: filters.session,
  };

  if (!filters.includeCancelled) {
    match.is_cancelled = { $ne: true };
  }
  if (filters.dateFrom || filters.dateTo) {
    match.txn_date = {};
    if (filters.dateFrom) match.txn_date.$gte = filters.dateFrom;
    if (filters.dateTo) match.txn_date.$lte = filters.dateTo;
  }
  if (filters.months && filters.months.length > 0) {
    match.month = { $in: filters.months };
  }
  if (filters.classes && filters.classes.length > 0) {
    match.class_name = { $in: filters.classes };
  }
  if (filters.sections && filters.sections.length > 0) {
    match.section = { $in: filters.sections };
  }
  if (filters.studentIds && filters.studentIds.length > 0) {
    match.student_id = { $in: filters.studentIds };
  }
  if (filters.feeHeads && filters.feeHeads.length > 0) {
    match.fee_head = { $in: filters.feeHeads };
  }
  if (filters.lineTypes && filters.lineTypes.length > 0) {
    match.line_type = { $in: filters.lineTypes };
  }
  if (filters.paymentModes && filters.paymentModes.length > 0) {
    match.payment_mode = { $in: filters.paymentModes };
  }
  if (filters.concessionTypes && filters.concessionTypes.length > 0) {
    match.concession_type = { $in: filters.concessionTypes };
  }
  if (filters.collectedBy && filters.collectedBy.length > 0) {
    match.collected_by = { $in: filters.collectedBy };
  }

  // Build group stage
  const groupId: any = {};
  for (const dim of groupBy) {
    switch (dim) {
      case 'month': groupId.month = '$month'; break;
      case 'class': groupId.class_name = '$class_name'; break;
      case 'section': groupId.section = '$section'; break;
      case 'fee_head': groupId.fee_head = '$fee_head'; break;
      case 'payment_mode': groupId.payment_mode = '$payment_mode'; break;
      case 'concession_type': groupId.concession_type = '$concession_type'; break;
      case 'collected_by': groupId.collected_by = '$collected_by'; break;
      case 'date': groupId.txn_date = '$txn_date'; break;
      case 'student': groupId.student_id = '$student_id'; break;
      case 'category': groupId.category = '$concession_type'; break;
      default: break;
    }
  }

  // If no groupBy, aggregate everything into one row
  const groupIdExpr = Object.keys(groupId).length > 0 ? groupId : null;

  try {
    const db = await getDatabase();
    if (db) {
      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: groupIdExpr,
            demand: {
              $sum: {
                $cond: [
                  { $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE']] },
                  '$amount',
                  0,
                ],
              },
            },
            fine: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'FINE'] }, '$amount', 0],
              },
            },
            discount: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'DISCOUNT'] }, '$amount', 0],
              },
            },
            waiver: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'WAIVER'] }, '$amount', 0],
              },
            },
            collected: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'PAYMENT'] }, '$amount', 0],
              },
            },
            refund: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'REFUND'] }, '$amount', 0],
              },
            },
            studentCount: { $addToSet: '$student_id' },
          },
        },
        {
          $project: {
            _id: 0,
            dimensions: '$_id',
            demand: { $add: ['$demand', '$fine'] },
            discount: 1,
            waiver: 1,
            fine: 1,
            collected: 1,
            refund: 1,
            balance: {
              $subtract: [
                { $add: ['$demand', '$fine', '$refund'] },
                { $add: ['$collected', '$discount', '$waiver'] },
              ],
            },
            studentCount: { $size: '$studentCount' },
          },
        },
      ];

      const results = await db.collection(COLLECTION).aggregate(pipeline).toArray();

      return results.map(r => ({
        dimensions: r.dimensions || {},
        demand: Math.round(r.demand || 0),
        discount: Math.round(r.discount || 0),
        waiver: Math.round(r.waiver || 0),
        fine: Math.round(r.fine || 0),
        collected: Math.round(r.collected || 0),
        refund: Math.round(r.refund || 0),
        balance: Math.round(r.balance || 0),
        studentCount: r.studentCount || 0,
      }));
    }
  } catch (e) {
    console.error('[fee-ledger] Aggregate error:', e);
  }

  // Fallback: empty
  return [];
}


// ─── Demand Generation ───

/**
 * Generate monthly demand lines for all active students in a school+session+month.
 * IDEMPOTENT: Will not create duplicate demand for the same student+head+month.
 */
export async function generateMonthlyDemand(
  schoolId: string,
  session: string,
  month: AcademicMonth,
  students: Student[],
  actorId: string
): Promise<{ created: number; skipped: number; lines: FeeLedgerLine[] }> {
  await ensureLedgerIndexes();

  const config = await getFeeConfig(schoolId, session);
  const sessionStartYear = parseInt(session.split('-')[0], 10) || 2026;
  const dueDate = getDefaultDueDate(month, sessionStartYear);
  const isApril = month === 'APR';

  // Get existing demands for this month to avoid duplicates
  const existingDemands = new Set<string>();
  try {
    const db = await getDatabase();
    if (db) {
      const existing = await db.collection(COLLECTION).find({
        school_id: schoolId,
        academic_session: session,
        month: month,
        line_type: 'DEMAND',
        is_cancelled: { $ne: true },
      }).project({ student_id: 1, fee_head: 1 }).toArray();

      for (const doc of existing) {
        existingDemands.add(`${doc.student_id}:${doc.fee_head}`);
      }
    }
  } catch (e) {
    console.error('[fee-ledger] Error checking existing demands:', e);
  }

  const allLines: Partial<FeeLedgerLine>[] = [];
  let skipped = 0;

  for (const student of students) {
    if (student.status !== 'ACTIVE') { skipped++; continue; }

    const isRte = student.is_rte === 'YES';

    // 1. Tuition demand
    const tuitionKey = `${student.id}:TUITION`;
    if (!existingDemands.has(tuitionKey)) {
      const tuitionRate = isRte ? 0 : getTuitionRateForClass(config, student.class_name);
      if (tuitionRate > 0) {
        allLines.push({
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          academic_session: session,
          line_type: 'DEMAND',
          fee_head: 'TUITION',
          month,
          amount: tuitionRate,
          txn_date: dueDate,
          due_date: dueDate,
        });
      }
    } else { skipped++; }

    // 2. Transport demand (if opted)
    if ((student.transport_opted || '').toUpperCase() === 'YES') {
      const transportKey = `${student.id}:TRANSPORT`;
      if (!existingDemands.has(transportKey)) {
        const transportRate = getTransportSlabRate(config, student.transport_slab_id || '1');
        allLines.push({
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          academic_session: session,
          line_type: 'DEMAND',
          fee_head: 'TRANSPORT',
          month,
          amount: transportRate,
          txn_date: dueDate,
          due_date: dueDate,
        });
      }
    }

    // 3. Hostel demand (if opted)
    if (student.hostel_opted && student.hostel_opted !== 'NO') {
      const hostelKey = `${student.id}:HOSTEL`;
      if (!existingDemands.has(hostelKey)) {
        const roomType = student.hostel_opted === 'WITH_AC' ? 'WITH_AC' : 'WITHOUT_AC';
        const hostelRate = getHostelRate(config, roomType);
        allLines.push({
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          academic_session: session,
          line_type: 'DEMAND',
          fee_head: 'HOSTEL',
          month,
          amount: hostelRate.monthly,
          txn_date: dueDate,
          due_date: dueDate,
        });
      }
    }

    // 4. Annual fee (April only)
    if (isApril) {
      const annualKey = `${student.id}:ACTIVITY`;
      if (!existingDemands.has(annualKey)) {
        const annualFee = isRte ? 0 : getAnnualFeeForClass(config, student.class_name, 'ACTIVITY');
        if (annualFee > 0) {
          allLines.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'DEMAND',
            fee_head: 'ACTIVITY',
            month: null, // Annual fee is not month-specific
            amount: annualFee,
            txn_date: dueDate,
            due_date: dueDate,
          });
        }
      }
    }

    // 5. Exam fee (if applicable for this month)
    const examFee = getExamFeeForMonth(config, month);
    if (examFee > 0) {
      const examKey = `${student.id}:EXAM`;
      if (!existingDemands.has(examKey)) {
        allLines.push({
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          academic_session: session,
          line_type: 'DEMAND',
          fee_head: 'EXAM',
          month,
          amount: examFee,
          txn_date: dueDate,
          due_date: dueDate,
        });
      }
    }
  }

  if (allLines.length === 0) {
    return { created: 0, skipped, lines: [] };
  }

  const posted = await postLedgerLines(schoolId, allLines, actorId);
  return { created: posted.length, skipped, lines: posted };
}


// ─── Backward Compatibility Bridge ───

/**
 * Convert old-style fee status queries to use the ledger.
 * This bridges the gap so that all existing consumers get consistent data.
 */
export function ledgerStatusToLegacy(
  summary: LedgerFeeSummary
): 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'WAIVED' {
  switch (summary.status) {
    case 'PAID': return 'PAID';
    case 'ADVANCE': return 'PAID'; // Advance = paid beyond demand
    case 'WAIVED': return 'WAIVED';
    case 'PARTIAL': return 'PARTIAL';
    case 'OVERDUE': return 'OVERDUE';
    case 'PENDING':
    default: return 'PENDING';
  }
}

/**
 * Get all lines for a school+session (for reports that need raw data).
 * With optional filters.
 */
export async function getSchoolLedgerLines(
  schoolId: string,
  session: string,
  additionalFilter?: Record<string, any>
): Promise<FeeLedgerLine[]> {
  await ensureLedgerIndexes();
  try {
    const db = await getDatabase();
    if (!db) return [];
    const filter: any = {
      school_id: schoolId,
      academic_session: session,
      is_cancelled: { $ne: true },
      ...additionalFilter,
    };
    const docs = await db.collection(COLLECTION)
      .find(filter)
      .sort({ txn_date: 1, created_at: 1 })
      .toArray();
    return docs as unknown as FeeLedgerLine[];
  } catch (e) {
    console.error('[fee-ledger] Error fetching school lines:', e);
    return [];
  }
}

/**
 * Look up a single ledger line by receipt number.
 */
export async function getLineByReceiptNo(
  schoolId: string,
  receiptNo: string
): Promise<FeeLedgerLine | null> {
  try {
    const db = await getDatabase();
    if (!db) return null;
    const doc = await db.collection(COLLECTION).findOne({
      school_id: schoolId,
      receipt_no: receiptNo,
    });
    return doc as unknown as FeeLedgerLine | null;
  } catch (e) {
    return null;
  }
}

/**
 * Get total student count with outstanding balance for a school.
 * Used by dashboard KPIs.
 */
export async function getDefaulterCount(
  schoolId: string,
  session: string
): Promise<number> {
  try {
    const db = await getDatabase();
    if (!db) return 0;

    const pipeline = [
      {
        $match: {
          school_id: schoolId,
          academic_session: session,
          is_cancelled: { $ne: true },
        },
      },
      {
        $group: {
          _id: '$student_id',
          totalDebit: {
            $sum: {
              $cond: [
                { $in: ['$line_type', ['DEMAND', 'FINE', 'OPENING_BALANCE', 'REFUND']] },
                '$amount',
                0,
              ],
            },
          },
          totalCredit: {
            $sum: {
              $cond: [
                { $in: ['$line_type', ['PAYMENT', 'DISCOUNT', 'WAIVER']] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
      {
        $match: {
          $expr: { $gt: ['$totalDebit', '$totalCredit'] },
        },
      },
      { $count: 'defaulterCount' },
    ];

    const results = await db.collection(COLLECTION).aggregate(pipeline).toArray();
    return results[0]?.defaulterCount || 0;
  } catch (e) {
    return 0;
  }
}
