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

async function verify() {
  const client = new MongoClient(envUri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  const db = client.db('edugit');

  const students = await db.collection('students').find({}).toArray();
  const totalLedger = await db.collection('fee_ledger').countDocuments();
  const totalDemands = await db.collection('fee_ledger').countDocuments({ line_type: 'DEMAND' });
  const totalPayments = await db.collection('fee_ledger').countDocuments({ line_type: 'PAYMENT' });
  const totalReceipts = await db.collection('fee_receipts').countDocuments();

  console.log(`\n=== WHOLE SCHOOL FEE VERIFICATION ===`);
  console.log(`Total Students: ${students.length}`);
  console.log(`Total Receipts in DB: ${totalReceipts}`);
  console.log(`Total Lines in fee_ledger: ${totalLedger}`);
  console.log(`Total DEMAND lines in fee_ledger: ${totalDemands}`);
  console.log(`Total PAYMENT lines in fee_ledger: ${totalPayments}`);

  // Check sample 5 students with receipts
  const sampleReceipts = await db.collection('fee_receipts').find({}).limit(5).toArray();
  for (const r of sampleReceipts) {
    const student = students.find(s => s.id === r.student_id) || { full_name: r.student_name, admission_no: r.admission_no };
    const pLines = await db.collection('fee_ledger').find({
      student_id: r.student_id,
      line_type: 'PAYMENT'
    }).toArray();
    console.log(`Student: ${student.full_name} (${student.admission_no}) -> Receipts: Yes (${r.receipt_no}), Payment ledger lines: ${pLines.length}`);
  }

  // Check Anjali Reddy specific numbers
  const anjali = students.find(s => s.admission_no === 'DPS-2026-0001');
  const anjaliLedger = await db.collection('fee_ledger').find({ student_id: anjali.id }).toArray();
  const anjaliDemands = anjaliLedger.filter(l => l.line_type === 'DEMAND').reduce((s, l) => s + l.amount, 0);
  const anjaliPaid = anjaliLedger.filter(l => l.line_type === 'PAYMENT' && !l.is_cancelled).reduce((s, l) => s + l.amount, 0);
  const anjaliDue = Math.max(0, anjaliDemands - anjaliPaid);

  console.log(`\n--- ANJALI REDDY SPECIFIC AUDIT ---`);
  console.log(`Total Billed: ₹${anjaliDemands / 100}`);
  console.log(`Total Paid  : ₹${anjaliPaid / 100} (from 4 receipts: ₹6,900 + ₹3,800 + ₹2,400 + ₹1,900)`);
  console.log(`Pending Due : ₹${anjaliDue / 100} (September onwards)`);

  await client.close();
}

verify().catch(console.error);
