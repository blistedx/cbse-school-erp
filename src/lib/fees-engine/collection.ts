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
    allocated_heads: allocatedHeads,
  };

  try {
    const db = await getDatabase();
    if (db) {
      await db.collection(RECEIPTS_COLLECTION).insertOne(sanitizeDocNoBinary({ ...receipt }));
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error persisting receipt record:', e);
  }

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
      const docs = await db.collection(RECEIPTS_COLLECTION)
        .find({
          school_id: schoolId,
          academic_session: session,
          student_id: studentId,
        })
        .sort({ payment_date: -1 })
        .toArray();
      return docs as unknown as ReceiptRecord[];
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error fetching student receipts:', e);
  }
  return [];
}

export async function getSchoolReceipts(
  schoolId: string,
  session: string = '2026-27',
  limit = 500
): Promise<ReceiptRecord[]> {
  try {
    const db = await getDatabase();
    if (db) {
      const docs = await db.collection(RECEIPTS_COLLECTION)
        .find({
          school_id: schoolId,
          academic_session: session,
        })
        .sort({ payment_date: -1 })
        .limit(limit)
        .toArray();
      return docs as unknown as ReceiptRecord[];
    }
  } catch (e) {
    console.error('[fees-engine/collection] Error fetching school receipts:', e);
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
