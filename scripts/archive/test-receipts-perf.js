const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    console.time('fetch_receipts');
    const receipts = await db.collection('fee_receipts').find({
      academic_session: '2026-27',
      is_cancelled: { $ne: true }
    }, {
      projection: {
        _id: 1,
        receipt_no: 1,
        school_id: 1,
        academic_session: 1,
        student_id: 1,
        student_name: 1,
        admission_no: 1,
        class_name: 1,
        section: 1,
        father_name: 1,
        mobile: 1,
        payment_date: 1,
        payment_mode: 1,
        amount_paise: 1,
        collected_by: 1,
        is_cancelled: 1,
        allocated_heads: 1,
        created_at: 1
      }
    }).sort({ payment_date: -1, created_at: -1 }).toArray();
    console.timeEnd('fetch_receipts');
    console.log('Total receipts fetched:', receipts.length);
    console.log('Top 3 receipts:', receipts.slice(0, 3).map(r => ({ no: r.receipt_no, student: r.student_name, date: r.payment_date, amt: r.amount_paise / 100 })));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
