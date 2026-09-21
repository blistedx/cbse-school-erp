import { MongoClient } from 'mongodb';
import fs from 'fs';

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  for (const ef of ['.env', '.env.local']) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, 'utf8');
      const match = content.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
      if (match) { envUri = match[1]; break; }
    }
  }
}

const VALID_MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const MONTH_MAP = {
  'APRIL 2026': 'APR',
  'MAY 2026': 'MAY',
  'JUNE 2026': 'JUN',
  'JULY 2026': 'JUL',
  'AUGUST 2026': 'AUG',
  'SEPTEMBER 2026': 'SEP',
  'OCTOBER 2026': 'OCT',
  'NOVEMBER 2026': 'NOV',
  'DECEMBER 2026': 'DEC',
  'JANUARY 2027': 'JAN',
  'FEBRUARY 2027': 'FEB',
  'MARCH 2027': 'MAR',
};

function normalizeMonth(rawMonth, rawPeriod) {
  if (rawMonth && VALID_MONTHS.includes(rawMonth.toUpperCase())) {
    return rawMonth.toUpperCase();
  }
  const periodUpper = String(rawPeriod || '').toUpperCase().trim();
  if (VALID_MONTHS.includes(periodUpper)) {
    return periodUpper;
  }
  for (const [fullName, shortMonth] of Object.entries(MONTH_MAP)) {
    if (periodUpper.includes(fullName) || periodUpper.startsWith(shortMonth)) {
      return shortMonth;
    }
  }
  return null;
}

async function syncReceiptsToLedger() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(envUri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  await client.connect();
  const db = client.db('edugit');

  const receipts = await db.collection('fee_receipts').find({}).toArray();
  console.log(`Found ${receipts.length} receipts in fee_receipts.`);

  // Load existing fee_ledger lines to avoid duplicate PAYMENT lines
  const existingPaymentLines = await db.collection('fee_ledger').find({ line_type: 'PAYMENT' }).toArray();
  const existingPaymentReceiptKeys = new Set(
    existingPaymentLines.map(l => `${l.receipt_no}_${l.fee_head}_${l.month || 'NOMONTH'}_${l.amount}`)
  );

  console.log(`Found ${existingPaymentLines.length} existing payment lines in fee_ledger.`);

  const newPaymentLines = [];
  let lineCounter = 1000;

  for (const rec of receipts) {
    const allocated = rec.allocated_heads || [];
    const schoolId = rec.school_id || 'DPS2026';
    const session = rec.academic_session || '2026-27';
    const sId = rec.student_id;
    const rNo = rec.receipt_no;
    const paymentDate = rec.payment_date || (rec.created_at ? rec.created_at.split('T')[0] : '2026-09-10');
    const paymentMode = rec.payment_mode || 'CASH';
    const isCancelled = Boolean(rec.is_cancelled);
    const cancelledReason = rec.cancelled_reason || null;
    const cancelledBy = rec.cancelled_by || (isCancelled ? 'ADMIN' : null);
    const cancelledAt = rec.cancelled_at || (isCancelled ? rec.created_at : null);

    if (allocated.length > 0) {
      for (const head of allocated) {
        const month = normalizeMonth(head.month, head.period);
        const amount = Number(head.amount_paise) || Math.round(Number(head.amount || 0) * 100);
        const feeHead = head.fee_head || head.feeHead || 'TUITION';
        const key = `${rNo}_${feeHead}_${month || 'NOMONTH'}_${amount}`;

        if (!existingPaymentReceiptKeys.has(key)) {
          lineCounter++;
          newPaymentLines.push({
            id: `FLL-PAY-${rNo}-${lineCounter}`,
            school_id: schoolId,
            academic_session: session,
            student_id: sId,
            class_name: rec.class_name || '',
            section: rec.section || 'A',
            admission_no: rec.admission_no || '',
            line_type: 'PAYMENT',
            fee_head: feeHead,
            month: month,
            slot_id: month ? `SLOT_${month}` : 'ONE_TIME',
            amount: amount,
            txn_date: paymentDate,
            due_date: null,
            payment_mode: paymentMode,
            receipt_no: rNo,
            cheque_no: rec.cheque_no || null,
            txn_ref: rec.txn_ref || null,
            collected_by: rec.collected_by || 'ACCOUNTS_OFFICE',
            is_cancelled: isCancelled,
            cancelled_reason: cancelledReason,
            cancelled_by: cancelledBy,
            cancelled_at: cancelledAt,
            remarks: rec.remarks || `Fee payment for ${head.period || month || feeHead}`,
            created_at: rec.created_at || `${paymentDate}T10:00:00.000Z`,
          });
          existingPaymentReceiptKeys.add(key);
        }
      }
    } else {
      // Fallback if allocated_heads is empty
      const amount = Number(rec.amount_paise) || Math.round(Number(rec.amount || 0) * 100);
      const key = `${rNo}_TUITION_NOMONTH_${amount}`;
      if (!existingPaymentReceiptKeys.has(key)) {
        lineCounter++;
        newPaymentLines.push({
          id: `FLL-PAY-${rNo}-${lineCounter}`,
          school_id: schoolId,
          academic_session: session,
          student_id: sId,
          class_name: rec.class_name || '',
          section: rec.section || 'A',
          admission_no: rec.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'TUITION',
          month: null,
          slot_id: 'ADVANCE_CREDIT',
          amount: amount,
          txn_date: paymentDate,
          due_date: null,
          payment_mode: paymentMode,
          receipt_no: rNo,
          cheque_no: rec.cheque_no || null,
          txn_ref: rec.txn_ref || null,
          collected_by: rec.collected_by || 'ACCOUNTS_OFFICE',
          is_cancelled: isCancelled,
          cancelled_reason: cancelledReason,
          cancelled_by: cancelledBy,
          cancelled_at: cancelledAt,
          remarks: rec.remarks || 'Fee deposit',
          created_at: rec.created_at || `${paymentDate}T10:00:00.000Z`,
        });
        existingPaymentReceiptKeys.add(key);
      }
    }
  }

  console.log(`Prepared ${newPaymentLines.length} new PAYMENT lines to insert into fee_ledger.`);

  if (newPaymentLines.length > 0) {
    const insertRes = await db.collection('fee_ledger').insertMany(newPaymentLines);
    console.log(`Inserted ${insertRes.insertedCount} PAYMENT lines into fee_ledger.`);
  }

  // Check stats for Anjali Reddy
  const anjaliLines = await db.collection('fee_ledger').find({
    admission_no: 'DPS-2026-0001'
  }).toArray();
  console.log(`Anjali Reddy now has ${anjaliLines.length} total ledger lines (${anjaliLines.filter(l => l.line_type === 'PAYMENT').length} payments).`);

  await client.close();
}

syncReceiptsToLedger().catch(console.error);
