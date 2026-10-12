const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const lines = await db.collection('fee_ledger').find({
      $or: [
        { admission_no: { $in: ['DPS-2026-0022', 'DPS-2026-0024'] } },
        { txn_date: '2026-09-21' },
        { receipt_no: { $in: ['DPS2-REC-611548-691', 'DPS2-REC-044764-267'] } }
      ]
    }).toArray();
    console.log('Ledger lines count:', lines.length);
    console.log(JSON.stringify(lines, null, 2));

    const recs = await db.collection('fee_receipts').find({
      receipt_no: { $in: ['DPS2-REC-611548-691', 'DPS2-REC-044764-267'] }
    }).toArray();
    console.log('Receipts detail:', JSON.stringify(recs, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
