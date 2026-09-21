/*! EduSuite Fee Master — POS Collection & Receipts Engine v3.0.0 */

import { Student } from '../types';
import { getDatabase, sanitizeDocNoBinary } from '../mongodb';
import {
  FeeLedgerLine,
  PaymentMode,
  FeeHead,
  ReceiptRecord,
} from './types';
import {
  postLedgerLines,
  getStudentLedger,
  generateReceiptNo,
  cancelLedgerLine,
  getStudentLedgerView,
} from './ledger';
import { MONTH_FULL_NAMES } from './constants';
import { logAuditEvent } from '../audit-logger';

const RECEIPTS_COLLECTION = 'fee_receipts';

export interface CollectPaymentParams {
  schoolId: string;
  student: Student;
  session?: string;
  amountPaise: number;
  paymentMode: PaymentMode;
  txnRef?: string;
  chequeNo?: string;
  remarks?: string;
  collectedBy: string;
  selectedHeadPeriodKeys?: string[]; // Optional specific selected item IDs
  isAdvanceYearly?: boolean;
}

export async function collectFeePayment(
  params: CollectPaymentParams
): Promise<{
  receipt: ReceiptRecord;
  postedLines: FeeLedgerLine[];
}> {
  const {
    schoolId,
    student,
    session = '2026-27',
    amountPaise,
    paymentMode,
    txnRef,
    chequeNo,
    remarks,
    collectedBy,
    selectedHeadPeriodKeys,
    isAdvanceYearly,
  } = params;

  if (amountPaise <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const receiptNo = generateReceiptNo(schoolId);
  const now = new Date().toISOString();
  const todayDate = now.split('T')[0];

  // 1. Get student's current ledger view to determine allocation order (FIFO: oldest due first)
  const ledgerView = await getStudentLedgerView(schoolId, student.id, session);
  let pendingItems = ledgerView.filter(item => item.due_paise > 0);

  if (selectedHeadPeriodKeys && selectedHeadPeriodKeys.length > 0) {
    pendingItems = pendingItems.filter(item => selectedHeadPeriodKeys.includes(item.id));
  }

  // If full year advance payment discount requested:
  const linesToPost: Partial<FeeLedgerLine>[] = [];
  let remainingPayment = amountPaise;
  const allocatedHeads: ReceiptRecord['allocated_heads'] = [];

  if (isAdvanceYearly) {
    // 1 month tuition discount
    const tuitionRate = ledgerView.find(i => i.fee_head === 'TUITION')?.gross_paise || 140000;
    const advDiscLine: Partial<FeeLedgerLine> = {
      student_id: student.id,
      class_name: student.class_name,
      section: student.section || 'A',
      admission_no: student.admission_no || '',
      academic_session: session,
      line_type: 'DISCOUNT',
      fee_head: 'TUITION',
      month: null,
      slot_id: 'ADVANCE_YEARLY',
      concession_type: 'ADVANCE_YEARLY',
      amount: tuitionRate,
      txn_date: todayDate,
      remarks: 'Full Academic Year Advance Payment 1-Month Tuition Concession',
    };
    linesToPost.push(advDiscLine);
  }

  // Allocate payment against pending items in FIFO order
  for (const item of pendingItems) {
    if (remainingPayment <= 0) break;

    const allocAmt = Math.min(remainingPayment, item.due_paise);
    remainingPayment -= allocAmt;

    linesToPost.push({
      student_id: student.id,
      class_name: student.class_name,
      section: student.section || 'A',
      admission_no: student.admission_no || '',
      academic_session: session,
      line_type: 'PAYMENT',
      fee_head: item.fee_head,
      month: item.month,
      slot_id: item.slot_id,
      amount: allocAmt,
      txn_date: todayDate,
      payment_mode: paymentMode,
      receipt_no: receiptNo,
      txn_ref: txnRef || null,
      cheque_no: chequeNo || null,
      collected_by: collectedBy,
      remarks: remarks || `Fee payment for ${item.period} (${item.fee_head})`,
    });

    allocatedHeads.push({
      fee_head: item.fee_head,
      month: item.month,
      period: item.period,
      amount_paise: allocAmt,
    });
  }

  // If there's surplus payment beyond current pending items, post as unallocated advance credit
  if (remainingPayment > 0) {
    linesToPost.push({
      student_id: student.id,
      class_name: student.class_name,
      section: student.section || 'A',
      admission_no: student.admission_no || '',
      academic_session: session,
      line_type: 'PAYMENT',
      fee_head: 'TUITION',
      month: null,
      slot_id: 'ADVANCE_CREDIT',
      amount: remainingPayment,
      txn_date: todayDate,
      payment_mode: paymentMode,
      receipt_no: receiptNo,
      txn_ref: txnRef || null,
      cheque_no: chequeNo || null,
      collected_by: collectedBy,
      remarks: remarks || 'Advance fee payment / unallocated credit',
    });

    allocatedHeads.push({
      fee_head: 'TUITION',
      month: null,
      period: 'Advance Deposit',
      amount_paise: remainingPayment,
    });
  }

  // Post lines into immutable ledger
  const posted = await postLedgerLines(schoolId, linesToPost, collectedBy);

  // Create receipt master document
  const receipt: ReceiptRecord = {
    receipt_no: receiptNo,
    school_id: schoolId,
    academic_session: session,
    student_id: student.id,
    student_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.admission_no || 'Student',
    admission_no: student.admission_no || '',
    class_name: student.class_name || '',
    section: student.section || 'A',
    father_name: student.father_name || '',
    mobile: student.emergency_contact_phone || student.phone || student.guardian_phone || student.mobile || '',
    payment_date: todayDate,
    payment_mode: paymentMode,
    txn_ref: txnRef || null,
    cheque_no: chequeNo || null,
    amount_paise: amountPaise,
    collected_by: collectedBy,
    remarks: remarks || null,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    allocated_heads: allocatedHeads,
  };

  try {
    const db = await getDatabase();
    if (db) {
      await db.collection(RECEIPTS_COLLECTION).insertOne(sanitizeDocNoBinary({ ...receipt }));
      await db.collection('fee_payments').insertOne(sanitizeDocNoBinary({
        id: receiptNo,
        receiptNo: receiptNo,
        schoolId: schoolId,
        sessionId: session,
        studentId: student.id,
        studentName: receipt.student_name,
        admissionNo: student.admission_no || '',
        className: student.class_name || '',
        section: student.section || 'A',
        fatherName: student.father_name || '',
        mobile: student.emergency_contact_phone || student.phone || student.guardian_phone || student.mobile || '',
        amountPaid: amountPaise,
        mode: paymentMode,
        paidOn: todayDate,
        collectedBy: collectedBy,
        cancelled: false,
        allocatedHeads: Array.isArray(allocatedHeads) ? allocatedHeads.map(h => ({
          feeHead: h.fee_head || 'TUITION',
          period: h.period || h.month || '',
          amountPaise: Number(h.amount_paise) || 0
        })) : [],
        createdAt: receipt.created_at
      }));
      // Update precomputed school_stats atomically
      await db.collection('school_stats').updateOne(
        { school_id: schoolId, session },
        {
          $inc: {
            totalCollectedPaise: amountPaise,
            totalPendingPaise: -amountPaise
          },
          $set: { updated_at: new Date().toISOString() }
        }
      );
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error persisting receipt record:', e);
  }

  // Live cache invalidation
  try {
    const { invalidateStatsCache } = await import('@/lib/stats');
    invalidateStatsCache(schoolId);
  } catch (_) {}

  // Log audit event
  try {
    logAuditEvent({
      school_id: schoolId,
      actor: { id: collectedBy, name: collectedBy, role: 'ACCOUNTANT' },
      action: 'FEE_COLLECTION',
      module: 'FEES' as any,
      summary: `Collected fee payment of ₹${(amountPaise / 100).toLocaleString('en-IN')} for ${student.full_name || student.first_name || student.admission_no} (${student.admission_no}) via ${paymentMode}. Receipt No: ${receiptNo}`,
      details: {
        student_id: student.id,
        receipt_no: receiptNo,
        amount_paise: amountPaise,
        payment_mode: paymentMode,
      },
    });
  } catch (e) {
    console.warn('[fees-engine/collection] Audit log error:', e);
  }

  return {
    receipt,
    postedLines: posted,
  };
}

export async function getStudentReceipts(
  schoolId: string,
  studentId: string,
  session: string = '2026-27'
): Promise<ReceiptRecord[]> {
  try {
    const db = await getDatabase();
    if (db) {
      const stored = await db.collection(RECEIPTS_COLLECTION)
        .find({
          school_id: schoolId,
          academic_session: session,
          student_id: studentId,
        })
        .sort({ payment_date: -1, created_at: -1, _id: -1 })
        .toArray() as unknown as ReceiptRecord[];

      const existingReceiptNos = new Set(stored.map(r => r.receipt_no));

      // Also check if fee_ledger has payments with receipt numbers not in fee_receipts
      const paidLines = await db.collection('fee_ledger').find({
        school_id: schoolId,
        student_id: studentId,
        academic_session: session,
        line_type: 'PAYMENT',
        is_cancelled: { $ne: true }
      }).toArray();

      const ledgerReceipts: ReceiptRecord[] = [];
      const groupedByReceipt = new Map<string, any[]>();
      paidLines.forEach((l: any) => {
        if (l.receipt_no && !existingReceiptNos.has(l.receipt_no)) {
          if (!groupedByReceipt.has(l.receipt_no)) {
            groupedByReceipt.set(l.receipt_no, []);
          }
          groupedByReceipt.get(l.receipt_no)!.push(l);
        }
      });

      groupedByReceipt.forEach((lines, rNo) => {
        const first = lines[0];
        const allocated_heads = lines.map(l => ({
          fee_head: l.fee_head,
          month: l.month,
          period: l.month || 'Academic Fee',
          amount_paise: l.amount || 0,
        }));
        const totalAmount = lines.reduce((s, l) => s + (l.amount || 0), 0);

        ledgerReceipts.push({
          receipt_no: rNo,
          school_id: schoolId,
          academic_session: session,
          student_id: studentId,
          student_name: first.student_name || 'Scholar',
          admission_no: first.admission_no || '',
          class_name: first.class_name || '',
          section: first.section || 'A',
          father_name: first.father_name || '',
          mobile: first.mobile || '',
          payment_date: first.txn_date || new Date().toISOString().split('T')[0],
          payment_mode: first.payment_mode || 'CASH',
          txn_ref: first.txn_ref || null,
          cheque_no: first.cheque_no || null,
          amount_paise: totalAmount,
          collected_by: first.collected_by || 'ADMIN',
          remarks: first.remarks || null,
          is_cancelled: Boolean(first.is_cancelled),
          cancelled_reason: first.cancelled_reason,
          cancelled_by: first.cancelled_by,
          cancelled_at: first.cancelled_at,
          allocated_heads,
        } as ReceiptRecord);
      });

      const combined = [...stored, ...ledgerReceipts];
      combined.sort((a, b) => {
        const parseTime = (r: any): number => {
          if (r.created_at) {
            const t = new Date(r.created_at).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (r.payment_date || r.receipt_date) {
            const d = r.payment_date || r.receipt_date;
            const t = new Date(d.includes('T') ? d : d + 'T12:00:00Z').getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (r._id && typeof r._id === 'string' && r._id.length === 24) {
            const t = parseInt(r._id.substring(0, 8), 16) * 1000;
            if (!isNaN(t) && t > 0) return t;
          }
          return 0;
        };
        const tA = parseTime(a);
        const tB = parseTime(b);
        if (tB !== tA) return tB - tA;
        return String(b.receipt_no || '').localeCompare(String(a.receipt_no || ''));
      });

      return combined;
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error fetching student receipts:', e);
  }
  return [];
}

export async function getSchoolReceipts(
  schoolId: string,
  session: string = '2026-27',
  limit = 2000
): Promise<ReceiptRecord[]> {
  try {
    const db = await getDatabase();
    if (db) {
      const docs = await db.collection(RECEIPTS_COLLECTION)
        .find({
          school_id: schoolId,
          academic_session: session,
        })
        .sort({ payment_date: -1, created_at: -1, _id: -1 })
        .limit(limit)
        .toArray();

      const existingReceiptNos = new Set(docs.map((r: any) => r.receipt_no));

      // Also check if fee_ledger has payments with receipt numbers not in fee_receipts
      const paidLines = await db.collection('fee_ledger').find({
        school_id: schoolId,
        academic_session: session,
        line_type: 'PAYMENT',
        is_cancelled: { $ne: true }
      }).sort({ txn_date: -1, _id: -1 }).limit(limit).toArray();

      const ledgerReceipts: ReceiptRecord[] = [];
      const groupedByReceipt = new Map<string, any[]>();
      paidLines.forEach((l: any) => {
        if (l.receipt_no && !existingReceiptNos.has(l.receipt_no)) {
          if (!groupedByReceipt.has(l.receipt_no)) {
            groupedByReceipt.set(l.receipt_no, []);
          }
          groupedByReceipt.get(l.receipt_no)!.push(l);
        }
      });

      groupedByReceipt.forEach((lines, rNo) => {
        const first = lines[0];
        const allocated_heads = lines.map(l => ({
          fee_head: l.fee_head,
          month: l.month,
          period: l.month || 'Academic Fee',
          amount_paise: l.amount || 0,
        }));
        const totalAmount = lines.reduce((s, l) => s + (l.amount || 0), 0);

        ledgerReceipts.push({
          receipt_no: rNo,
          school_id: schoolId,
          academic_session: session,
          student_id: first.student_id,
          student_name: first.student_name || 'Scholar Student',
          admission_no: first.admission_no || '',
          class_name: first.class_name || '',
          section: first.section || 'A',
          father_name: first.father_name || '',
          mobile: first.mobile || '',
          payment_date: first.txn_date || new Date().toISOString().split('T')[0],
          payment_mode: first.payment_mode || 'CASH',
          txn_ref: first.txn_ref || null,
          cheque_no: first.cheque_no || null,
          amount_paise: totalAmount,
          collected_by: first.collected_by || 'ACCOUNTS_OFFICE',
          remarks: first.remarks || null,
          is_cancelled: Boolean(first.is_cancelled),
          cancelled_reason: first.cancelled_reason,
          cancelled_by: first.cancelled_by,
          cancelled_at: first.cancelled_at,
          created_at: first.created_at || (first.txn_date ? first.txn_date + 'T10:00:00Z' : undefined),
          allocated_heads,
        } as ReceiptRecord);
      });

      const combined = [...docs, ...ledgerReceipts] as unknown as ReceiptRecord[];
      
      // Strict reverse chronological sort: newest timestamp / created_at / payment_date at the very top
      combined.sort((a, b) => {
        const parseTime = (r: any): number => {
          if (r.created_at) {
            const t = new Date(r.created_at).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (r.payment_date || r.receipt_date) {
            const d = r.payment_date || r.receipt_date;
            const t = new Date(d.includes('T') ? d : d + 'T12:00:00Z').getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (r._id && typeof r._id === 'string' && r._id.length === 24) {
            const t = parseInt(r._id.substring(0, 8), 16) * 1000;
            if (!isNaN(t) && t > 0) return t;
          }
          return 0;
        };
        const tA = parseTime(a);
        const tB = parseTime(b);
        if (tB !== tA) return tB - tA;
        return String(b.receipt_no || '').localeCompare(String(a.receipt_no || ''));
      });

      return combined.slice(0, limit);
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error fetching school receipts:', e);
  }
  return [];
}

export async function getReceiptByNo(
  schoolId: string,
  receiptNo: string
): Promise<ReceiptRecord | null> {
  try {
    const db = await getDatabase();
    if (db) {
      const cleanReceiptNo = (receiptNo || '').trim();
      if (!cleanReceiptNo) return null;

      // 1. Direct match in RECEIPTS_COLLECTION
      const doc = await db.collection(RECEIPTS_COLLECTION).findOne({
        school_id: schoolId,
        receipt_no: { $regex: new RegExp(`^${cleanReceiptNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (doc) return doc as unknown as ReceiptRecord;

      // 2. Fallback: Search in fee_ledger lines and reconstruct receipt record
      const lines = await db.collection('fee_ledger').find({
        school_id: schoolId,
        receipt_no: { $regex: new RegExp(`^${cleanReceiptNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      }).toArray();

      if (lines && lines.length > 0) {
        const first = lines[0];
        const student = await db.collection('students').findOne({ id: first.student_id, school_id: schoolId });
        const allocated_heads = lines.map((l: any) => ({
          fee_head: l.fee_head,
          month: l.month,
          period: l.month || 'Academic Fee',
          amount_paise: l.amount || 0,
        }));
        const totalAmount = lines.reduce((s: number, l: any) => s + (l.amount || 0), 0);

        return {
          receipt_no: first.receipt_no || cleanReceiptNo,
          school_id: schoolId,
          academic_session: first.academic_session || '2026-27',
          student_id: first.student_id,
          student_name: student?.full_name || 'Scholar',
          admission_no: first.admission_no || student?.admission_no || '',
          class_name: first.class_name || student?.class_name || '',
          section: first.section || student?.section || 'A',
          father_name: student?.father_name || student?.guardian_name || '',
          mobile: student?.guardian_phone || student?.father_phone || '',
          payment_date: first.txn_date || new Date().toISOString().split('T')[0],
          payment_mode: first.payment_mode || 'CASH',
          txn_ref: first.txn_ref || null,
          cheque_no: first.cheque_no || null,
          amount_paise: totalAmount,
          collected_by: first.collected_by || 'ADMIN',
          remarks: first.remarks || null,
          is_cancelled: Boolean(first.is_cancelled),
          cancelled_reason: first.cancelled_reason,
          cancelled_by: first.cancelled_by,
          cancelled_at: first.cancelled_at,
          allocated_heads,
        } as ReceiptRecord;
      }
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error fetching receipt by no:', e);
  }
  return null;
}

export async function searchReceipts(
  schoolId: string,
  query: string,
  session: string = '2026-27',
  limit = 50
): Promise<ReceiptRecord[]> {
  try {
    const db = await getDatabase();
    if (db) {
      const q = (query || '').trim();
      if (!q) {
        return await getSchoolReceipts(schoolId, session, limit);
      }

      const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQ, 'i');

      const docs = await db.collection(RECEIPTS_COLLECTION)
        .find({
          school_id: schoolId,
          $or: [
            { receipt_no: { $regex: regex } },
            { student_name: { $regex: regex } },
            { admission_no: { $regex: regex } },
            { father_name: { $regex: regex } },
            { txn_ref: { $regex: regex } },
            { cheque_no: { $regex: regex } },
          ],
        })
        .sort({ payment_date: -1 })
        .limit(limit)
        .toArray();

      if (docs && docs.length > 0) {
        return docs as unknown as ReceiptRecord[];
      }

      // Check fee_ledger lines if receipts collection didn't have match
      const lines = await db.collection('fee_ledger').find({
        school_id: schoolId,
        $or: [
          { receipt_no: { $regex: regex } },
          { admission_no: { $regex: regex } },
          { txn_ref: { $regex: regex } },
          { cheque_no: { $regex: regex } },
        ],
      }).limit(50).toArray();

      if (lines && lines.length > 0) {
        // Group by receipt_no
        const receiptGroups = new Map<string, any[]>();
        for (const l of lines) {
          if (l.receipt_no) {
            const arr = receiptGroups.get(l.receipt_no) || [];
            arr.push(l);
            receiptGroups.set(l.receipt_no, arr);
          }
        }

        const reconstructed: ReceiptRecord[] = [];
        for (const [rNo, rLines] of receiptGroups.entries()) {
          const first = rLines[0];
          const student = await db.collection('students').findOne({ id: first.student_id, school_id: schoolId });
          const totalAmount = rLines.reduce((s: number, l: any) => s + (l.amount || 0), 0);
          reconstructed.push({
            receipt_no: rNo,
            school_id: schoolId,
            academic_session: first.academic_session || session,
            student_id: first.student_id,
            student_name: student?.full_name || 'Scholar',
            admission_no: first.admission_no || student?.admission_no || '',
            class_name: first.class_name || student?.class_name || '',
            section: first.section || student?.section || 'A',
            father_name: student?.father_name || student?.guardian_name || '',
            mobile: student?.guardian_phone || student?.father_phone || '',
            payment_date: first.txn_date || new Date().toISOString().split('T')[0],
            payment_mode: first.payment_mode || 'CASH',
            txn_ref: first.txn_ref || null,
            cheque_no: first.cheque_no || null,
            amount_paise: totalAmount,
            collected_by: first.collected_by || 'ADMIN',
            remarks: first.remarks || null,
            is_cancelled: Boolean(first.is_cancelled),
            cancelled_reason: first.cancelled_reason,
            cancelled_by: first.cancelled_by,
            cancelled_at: first.cancelled_at,
            allocated_heads: rLines.map((l: any) => ({
              fee_head: l.fee_head,
              month: l.month,
              period: l.month || 'Academic Fee',
              amount_paise: l.amount || 0,
            })),
          });
        }
        return reconstructed;
      }
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error searching receipts:', e);
  }
  return [];
}

export async function cancelReceipt(
  schoolId: string,
  receiptNo: string,
  reason: string,
  cancelledBy: string
): Promise<{ success: boolean; message: string }> {
  if (!reason || reason.trim().length < 5) {
    throw new Error('Valid cancellation reason of at least 5 characters is required');
  }

  const now = new Date().toISOString();
  const db = await getDatabase();

  // Find lines with this receipt_no
  if (db) {
    const lines = await db.collection('fee_ledger').find({
      school_id: schoolId,
      receipt_no: receiptNo,
      is_cancelled: { $ne: true },
    }).toArray();

    if (!lines || lines.length === 0) {
      throw new Error(`No active ledger entries found for receipt ${receiptNo}`);
    }

    // Cancel all lines
    for (const line of lines) {
      await cancelLedgerLine(schoolId, line.id, reason, cancelledBy);
    }

    // Update receipt collection
    await db.collection(RECEIPTS_COLLECTION).updateOne(
      { school_id: schoolId, receipt_no: receiptNo },
      {
        $set: {
          is_cancelled: true,
          cancelled_reason: reason,
          cancelled_by: cancelledBy,
          cancelled_at: now,
        },
      }
    );

    const cancelledPaise = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const session = lines[0]?.academic_session || '2026-27';
    await db.collection('school_stats').updateOne(
      { school_id: schoolId, session },
      {
        $inc: {
          totalCollectedPaise: -cancelledPaise,
          totalPendingPaise: cancelledPaise
        },
        $set: { updated_at: new Date().toISOString() }
      }
    );

    try {
      const { invalidateStatsCache } = await import('@/lib/stats');
      invalidateStatsCache(schoolId);
    } catch (_) {}

    // Audit log
    try {
      logAuditEvent({
        school_id: schoolId,
        actor: { id: cancelledBy, name: cancelledBy, role: 'ADMIN' },
        action: 'RECEIPT_CANCEL',
        module: 'FEES' as any,
        summary: `Cancelled Fee Receipt #${receiptNo}. Reason: ${reason}. Ledger balance restored.`,
        details: { receipt_no: receiptNo, reason, cancelled_by: cancelledBy },
      });
    } catch (e) {
      console.warn('[fees-engine/collection] Audit log error:', e);
    }

    return { success: true, message: `Receipt ${receiptNo} cancelled and dues restored.` };
  }

  return { success: false, message: 'Database connection unavailable' };
}
