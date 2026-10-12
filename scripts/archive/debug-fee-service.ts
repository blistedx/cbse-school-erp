import { queryReport } from '../src/lib/fees/fee-service';
import { MongoClient } from 'mongodb';
import fs from 'fs';

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  const ef = fs.readFileSync('.env.local', 'utf8');
  const match = ef.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
  if (match) envUri = match[1];
}

async function debug() {
  const client = new MongoClient(envUri!);
  await client.connect();
  const db = client.db('edugit');

  const s = await db.collection('students').findOne({});
  const d = await db.collection('fee_demands').findOne({});
  const p = await db.collection('fee_payments').findOne({});

  console.log('Student:', { school_id: s?.school_id, id: s?.id, name: s?.full_name });
  console.log('Demand:', { schoolId: d?.schoolId, studentId: d?.studentId, feeHead: d?.feeHead });
  console.log('Payment:', { schoolId: p?.schoolId, studentId: p?.studentId, amountPaid: p?.amountPaid });

  const rep = await queryReport('annual_fee_pending', { schoolId: 'DPS2026', session: '2026-27' });
  console.log('Report result:', {
    rowsCount: rep.rows.length,
    grandTotal: rep.grandTotalRow,
    firstRow: rep.rows[0],
  });

  await client.close();
}

debug().catch(console.error);
