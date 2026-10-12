import { MongoClient } from 'mongodb';
import fs from 'fs';

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  const envFiles = ['.env', '.env.local'];
  for (const ef of envFiles) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, 'utf8');
      const match = content.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
      if (match) {
        envUri = match[1];
        break;
      }
    }
  }
}

const MONTH_NAMES = {
  APR: 'April 2026',
  MAY: 'May 2026',
  JUN: 'June 2026',
  JUL: 'July 2026',
  AUG: 'August 2026',
  SEP: 'September 2026',
  OCT: 'October 2026',
  NOV: 'November 2026',
  DEC: 'December 2026',
  JAN: 'January 2027',
  FEB: 'February 2027',
  MAR: 'March 2027',
};

async function syncAllReceipts() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');

  // Load all students for lookup
  const students = await db.collection('students').find({}).toArray();
  const studentMap = new Map();
  students.forEach(s => studentMap.set(s.id, s));

  // Find all payment lines in fee_ledger
  const paidLines = await db.collection('fee_ledger').find({
    line_type: 'PAYMENT',
    is_cancelled: { $ne: true }
  }).sort({ txn_date: 1, created_at: 1 }).toArray();

  console.log(`Found ${paidLines.length} paid ledger lines across ${students.length} students.`);

  // Group by student_id and receipt_no
  const receiptGroups = new Map();

  for (const line of paidLines) {
    const sId = line.student_id;
    const rNo = line.receipt_no || `DPS2-REC-${(line.month || 'GEN').toUpperCase()}-${sId.replace(/[^0-9]/g, '').slice(-4) || '1000'}`;
    const groupKey = `${line.school_id}_${sId}_${rNo}`;

    if (!receiptGroups.has(groupKey)) {
      receiptGroups.set(groupKey, {
        school_id: line.school_id || 'DPS2026',
        student_id: sId,
        receipt_no: rNo,
        academic_session: line.academic_session || '2026-27',
        payment_date: line.txn_date || '2026-09-10',
        payment_mode: line.payment_mode || 'UPI',
        txn_ref: line.txn_ref || null,
        cheque_no: line.cheque_no || null,
        collected_by: line.collected_by || 'ACCOUNTS_OFFICE',
        remarks: line.remarks || 'Fee deposit',
        lines: []
      });
    }

    receiptGroups.get(groupKey).lines.push(line);
  }

  console.log(`Generated ${receiptGroups.size} distinct receipt groups. Preparing bulk operations...`);

  const bulkOps = [];

  for (const [key, group] of receiptGroups.entries()) {
    const student = studentMap.get(group.student_id);
    const allocated_heads = group.lines.map(l => ({
      fee_head: l.fee_head,
      month: l.month || null,
      period: l.month ? (MONTH_NAMES[l.month] || l.month) : (l.slot_id || 'Annual / One-Time'),
      amount_paise: l.amount || 0
    }));

    const totalAmount = group.lines.reduce((acc, l) => acc + (l.amount || 0), 0);

    const receiptDoc = {
      receipt_no: group.receipt_no,
      school_id: group.school_id,
      academic_session: group.academic_session,
      student_id: group.student_id,
      student_name: student?.full_name || student?.first_name || 'Scholar',
      admission_no: group.lines[0]?.admission_no || student?.admission_no || '',
      class_name: group.lines[0]?.class_name || student?.class_name || 'Class 1',
      section: group.lines[0]?.section || student?.section || 'A',
      roll_no: student?.roll_no || '1',
      father_name: student?.father_name || student?.guardian_name || 'Parent / Guardian',
      mobile: student?.guardian_phone || student?.father_phone || '',
      payment_date: group.payment_date,
      payment_mode: group.payment_mode,
      txn_ref: group.txn_ref,
      cheque_no: group.cheque_no,
      amount_paise: totalAmount,
      collected_by: group.collected_by,
      remarks: group.remarks,
      is_cancelled: false,
      allocated_heads,
      created_at: group.lines[0]?.created_at || new Date().toISOString()
    };

    bulkOps.push({
      updateOne: {
        filter: { school_id: group.school_id, receipt_no: group.receipt_no },
        update: { $set: receiptDoc },
        upsert: true
      }
    });
  }

  console.log(`Executing bulkWrite of ${bulkOps.length} ops...`);
  const bulkRes = await db.collection('fee_receipts').bulkWrite(bulkOps, { ordered: false });

  const finalReceiptsCount = await db.collection('fee_receipts').countDocuments();
  const stats = await db.stats();

  console.log('--- SYNC COMPLETED ---');
  console.log(`Upserted count: ${bulkRes.upsertedCount}`);
  console.log(`Modified count: ${bulkRes.modifiedCount}`);
  console.log(`Total receipts in fee_receipts: ${finalReceiptsCount}`);
  console.log(`MongoDB Data Size: ${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`MongoDB Storage Size on Disk: ${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`);

  await client.close();
}

syncAllReceipts().catch(console.error);
