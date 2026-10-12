import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const client = new MongoClient(process.env.MONGODB_URI, { tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 5000 });

async function run() {
  await client.connect();
  const db = client.db('edugit');
  
  const students = await db.collection('students').find({}, { projection: { id: 1, student_id: 1, admission_no: 1, admission_number: 1 } }).toArray();
  const studentIds = new Set();
  students.forEach(s => {
    if (s.id) studentIds.add(s.id);
    if (s.student_id) studentIds.add(s.student_id);
    if (s.admission_no) studentIds.add(s.admission_no);
    if (s.admission_number) studentIds.add(s.admission_number);
    if (s._id) studentIds.add(s._id.toString());
  });

  const invoices = await db.collection('fee_invoices').find({}).toArray();
  const orphans = invoices.filter(inv => {
    const sId = inv.student_id;
    const adm = inv.student_admission_no;
    return (!sId || !studentIds.has(sId)) && (!adm || !studentIds.has(adm));
  });

  console.log('Total students:', students.length);
  console.log('Total invoices:', invoices.length);
  console.log('Orphan invoices count:', orphans.length);
  if (orphans.length > 0) {
    console.log('Sample orphan invoices:', JSON.stringify(orphans.slice(0, 5), null, 2));
  }

  // Check receipts without payments
  const receipts = await db.collection('fee_receipts').find({}).toArray();
  const payments = await db.collection('fee_payments').find({}).toArray();
  const paymentReceiptNos = new Set(payments.map(p => p.receipt_no));
  const orphanReceipts = receipts.filter(r => !paymentReceiptNos.has(r.receipt_no));
  console.log(`Total receipts: ${receipts.length}, Total payments: ${payments.length}, Orphan receipts without payments: ${orphanReceipts.length}`);

  // Check attendance for non-existent students
  const att = await db.collection('attendance').find({}).toArray();
  let attOrphans = 0;
  for (const a of att) {
    if (a.records && Array.isArray(a.records)) {
      for (const r of a.records) {
        if (!studentIds.has(r.student_id) && !studentIds.has(r.id)) {
          attOrphans++;
        }
      }
    }
  }
  console.log(`Attendance records: ${att.length}, Attendance student orphan entries: ${attOrphans}`);

  await client.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
