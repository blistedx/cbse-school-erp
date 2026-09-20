import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually if needed
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

async function inspect() {
  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');
  
  const totalStudents = await db.collection('students').countDocuments();
  const ledgerLinesCount = await db.collection('fee_ledger').countDocuments();
  const receiptsCount = await db.collection('fee_receipts').countDocuments();
  
  const paidLines = await db.collection('fee_ledger').find({ line_type: 'PAYMENT', is_cancelled: { $ne: true } }).toArray();
  const paidStudentIds = new Set(paidLines.map(l => l.student_id));
  const distinctReceiptNosInLedger = new Set(paidLines.map(l => l.receipt_no).filter(Boolean));
  
  console.log(JSON.stringify({
    totalStudents,
    ledgerLinesCount,
    receiptsCount,
    paidLinesCount: paidLines.length,
    paidStudentsCount: paidStudentIds.size,
    distinctReceiptNosInLedger: distinctReceiptNosInLedger.size,
  }, null, 2));

  if (paidLines.length > 0) {
    const sampleStudentId = paidLines[0].student_id;
    const studentPaidLines = paidLines.filter(l => l.student_id === sampleStudentId);
    console.log('Sample student ID:', sampleStudentId);
    console.log('Sample student paid lines count:', studentPaidLines.length);
    console.log('Sample student receipt numbers in ledger:', [...new Set(studentPaidLines.map(l => l.receipt_no))]);
    
    // Check if receipt exists in fee_receipts
    const sampleRec = await db.collection('fee_receipts').find({ student_id: sampleStudentId }).toArray();
    console.log('Sample student records in fee_receipts count:', sampleRec.length);
    if (sampleRec.length > 0) {
      console.log('Sample fee_receipts sample:', {
        receipt_no: sampleRec[0].receipt_no,
        amount_paise: sampleRec[0].amount_paise,
        allocated_heads: sampleRec[0].allocated_heads,
        payment_mode: sampleRec[0].payment_mode
      });
    }
  }

  await client.close();
}
inspect().catch(console.error);
