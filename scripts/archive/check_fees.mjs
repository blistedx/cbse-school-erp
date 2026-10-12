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

async function testAllReports() {
  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');

  const students = await db.collection('students').find({}).toArray();
  const lines = await db.collection('fee_ledger').find({ academic_session: '2026-27', is_cancelled: { $ne: true } }).toArray();
  const receipts = await db.collection('fee_receipts').find({ academic_session: '2026-27' }).toArray();

  console.log(`\n================ REPORT ENGINE AUDIT ================`);
  console.log(`Total Students: ${students.length}`);
  console.log(`Total Fee Ledger Lines: ${lines.length}`);
  console.log(`Total Fee Receipts: ${receipts.length}`);

  // 1. Annual Fee Pending
  const linesByStudent = new Map();
  lines.forEach(l => {
    if (!linesByStudent.has(l.student_id)) linesByStudent.set(l.student_id, []);
    linesByStudent.get(l.student_id).push(l);
  });

  let annualPendingCount = 0;
  let annualPendingTotal = 0;
  for (const st of students) {
    const sLines = linesByStudent.get(st.id) || [];
    const dem = sLines.filter(l => l.fee_head === 'ANNUAL' && l.line_type === 'DEMAND').reduce((s, l) => s + (l.amount || 0), 0);
    const paid = sLines.filter(l => l.fee_head === 'ANNUAL' && l.line_type === 'PAYMENT').reduce((s, l) => s + (l.amount || 0), 0);
    const bal = dem - paid;
    if (bal > 0) {
      annualPendingCount++;
      annualPendingTotal += bal;
    }
  }
  console.log(`\n1. Annual Fee Pending: ${annualPendingCount} scholars pending, Total Due: ₹${(annualPendingTotal / 100).toLocaleString('en-IN')}`);

  // 2. Pending Fees List (All Dues)
  let totalPendingScholars = 0;
  let totalDues = 0;
  for (const st of students) {
    const sLines = linesByStudent.get(st.id) || [];
    const dem = sLines.filter(l => l.line_type === 'DEMAND').reduce((s, l) => s + (l.amount || 0), 0);
    const disc = sLines.filter(l => l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER').reduce((s, l) => s + (l.amount || 0), 0);
    const paid = sLines.filter(l => l.line_type === 'PAYMENT').reduce((s, l) => s + (l.amount || 0), 0);
    const bal = dem - disc - paid;
    if (bal > 0) {
      totalPendingScholars++;
      totalDues += bal;
    }
  }
  console.log(`2. Pending Fees List: ${totalPendingScholars} scholars with dues, Total Outstanding: ₹${(totalDues / 100).toLocaleString('en-IN')}`);

  // 3. Aarav Hegde status
  const aarav = students.find(s => /aarav hegde/i.test(s.full_name));
  if (aarav) {
    const sLines = linesByStudent.get(aarav.id) || [];
    const annualD = sLines.filter(l => l.fee_head === 'ANNUAL' && l.line_type === 'DEMAND').reduce((s, l) => s + (l.amount || 0), 0);
    const annualP = sLines.filter(l => l.fee_head === 'ANNUAL' && l.line_type === 'PAYMENT').reduce((s, l) => s + (l.amount || 0), 0);
    console.log(`\n🎯 Aarav Hegde (${aarav.class_name} - ${aarav.section}, Adm: ${aarav.admission_no}):`);
    console.log(`   Annual Fee Billed: ₹${annualD / 100}, Paid: ₹${annualP / 100}, Due: ₹${(annualD - annualP) / 100}`);
  }

  await client.close();
}

testAllReports().catch(console.error);
