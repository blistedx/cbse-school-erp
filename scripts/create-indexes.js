const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    console.log('Creating high-performance indexes...');

    await db.collection('fee_receipts').createIndex({ school_id: 1, academic_session: 1, is_cancelled: 1 });
    await db.collection('fee_receipts').createIndex({ payment_date: -1, created_at: -1 });
    await db.collection('fee_receipts').createIndex({ receipt_no: 1 });
    await db.collection('fee_receipts').createIndex({ student_id: 1, academic_session: 1 });

    await db.collection('fee_ledger').createIndex({ school_id: 1, academic_session: 1, is_cancelled: 1 });
    await db.collection('fee_ledger').createIndex({ student_id: 1, academic_session: 1 });
    await db.collection('fee_ledger').createIndex({ txn_date: -1 });

    await db.collection('fee_demands').createIndex({ schoolId: 1, sessionId: 1 });
    await db.collection('fee_demands').createIndex({ studentId: 1, sessionId: 1 });

    await db.collection('students').createIndex({ school_id: 1, status: 1 });
    await db.collection('students').createIndex({ id: 1 });
    await db.collection('students').createIndex({ admission_no: 1 });

    console.log('All indexes created successfully!');

    console.time('indexed_fetch');
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
    }).sort({ payment_date: -1 }).toArray();
    console.timeEnd('indexed_fetch');
    console.log(`Fetched ${receipts.length} receipts in record time!`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
