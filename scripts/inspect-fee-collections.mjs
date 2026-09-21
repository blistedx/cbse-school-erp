import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const client = new MongoClient(process.env.MONGODB_URI, { tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 5000 });

async function run() {
  await client.connect();
  const db = client.db('edugit');

  const invoiceCount = await db.collection('fee_invoices').countDocuments();
  const ledgerCount = await db.collection('fee_ledger').countDocuments();
  const demandCount = await db.collection('fee_demands').countDocuments();
  const receiptCount = await db.collection('fee_receipts').countDocuments();
  const paymentCount = await db.collection('fee_payments').countDocuments();

  console.log(`Counts:
  - fee_invoices: ${invoiceCount}
  - fee_ledger: ${ledgerCount}
  - fee_demands: ${demandCount}
  - fee_receipts: ${receiptCount}
  - fee_payments: ${paymentCount}`);

  const sampleInvoice = await db.collection('fee_invoices').findOne({});
  console.log('\nSample fee_invoice document:', JSON.stringify(sampleInvoice, null, 2));

  const sampleLedger = await db.collection('fee_ledger').findOne({});
  console.log('\nSample fee_ledger document:', JSON.stringify(sampleLedger, null, 2));

  const sampleDemand = await db.collection('fee_demands').findOne({});
  console.log('\nSample fee_demand document:', JSON.stringify(sampleDemand, null, 2));

  await client.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
