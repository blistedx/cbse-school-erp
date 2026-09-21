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

async function check() {
  const client = new MongoClient(envUri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  const db = client.db('edugit');
  
  const student = await db.collection('students').findOne({ admission_no: 'DPS-2026-0001' });
  console.log('Student:', student?.id, student?.full_name, student?.admission_no);

  const lines = await db.collection('fee_ledger').find({ 
    $or: [{ student_id: student?.id }, { admission_no: 'DPS-2026-0001' }]
  }).toArray();
  console.log('Ledger lines count:', lines.length);
  console.log('Line types:', [...new Set(lines.map(l => l.line_type))]);
  
  const payments = lines.filter(l => l.line_type === 'PAYMENT');
  console.log('Payments in ledger:', payments.length);
  payments.forEach(p => console.log('Payment:', p.fee_head, p.month, p.amount, p.receipt_no, p.student_id, 'is_cancelled:', p.is_cancelled));

  const demands = lines.filter(l => l.line_type === 'DEMAND');
  console.log('Demands in ledger:', demands.length);
  demands.forEach(d => console.log('Demand:', d.fee_head, d.month, d.amount, d.student_id, 'is_cancelled:', d.is_cancelled));

  const receipts = await db.collection('fee_receipts').find({
    $or: [{ student_id: student?.id }, { admission_no: 'DPS-2026-0001' }]
  }).toArray();
  console.log('Receipts in fee_receipts:', receipts.length);
  receipts.forEach(r => console.log('Receipt:', r.receipt_no, r.amount_paise, r.student_id, JSON.stringify(r.allocated_heads)));

  await client.close();
}
check().catch(console.error);
