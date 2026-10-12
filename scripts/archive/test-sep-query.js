const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    console.time('targeted_september_fetch');
    const receipts = await db.collection('fee_receipts').find({
      academic_session: '2026-27',
      is_cancelled: { $ne: true },
      payment_date: { $gte: '2026-09-01', $lte: '2026-09-30' }
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
    console.timeEnd('targeted_september_fetch');
    console.log(`Fetched ${receipts.length} September receipts:`);
    console.log(receipts.map(r => ({
      receipt_no: r.receipt_no,
      student_name: r.student_name,
      payment_date: r.payment_date,
      amount: `₹${(r.amount_paise / 100).toLocaleString('en-IN')}`,
      mode: r.payment_mode
    })));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
