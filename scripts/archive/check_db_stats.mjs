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
  
  const totalReceipts = await db.collection('fee_receipts').countDocuments();
  const totalLedger = await db.collection('fee_ledger').countDocuments();
  const totalPayments = await db.collection('fee_ledger').countDocuments({ line_type: 'PAYMENT' });
  const totalDemands = await db.collection('fee_ledger').countDocuments({ line_type: 'DEMAND' });

  console.log('Total receipts in fee_receipts:', totalReceipts);
  console.log('Total lines in fee_ledger:', totalLedger);
  console.log('Total DEMAND lines in fee_ledger:', totalDemands);
  console.log('Total PAYMENT lines in fee_ledger:', totalPayments);

  const sampleReceipt = await db.collection('fee_receipts').findOne({});
  console.log('Sample receipt:', JSON.stringify(sampleReceipt, null, 2));

  await client.close();
}
check().catch(console.error);
