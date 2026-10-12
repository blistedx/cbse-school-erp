const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Sync all fee_receipts into fee_payments
    const receipts = await db.collection('fee_receipts').find().toArray();
    console.log(`Checking ${receipts.length} receipts against fee_payments...`);
    
    let inserted = 0;
    for (const r of receipts) {
      const exists = await db.collection('fee_payments').findOne({
        $or: [{ receiptNo: r.receipt_no }, { id: r.receipt_no }]
      });
      if (!exists) {
        await db.collection('fee_payments').insertOne({
          id: r.receipt_no,
          receiptNo: r.receipt_no,
          schoolId: r.school_id || 'DPS2026',
          sessionId: r.academic_session || '2026-27',
          studentId: r.student_id || '',
          studentName: r.student_name || 'Scholar',
          admissionNo: r.admission_no || '',
          className: r.class_name || '',
          section: r.section || 'A',
          fatherName: r.father_name || '',
          mobile: r.mobile || '',
          amountPaid: Number(r.amount_paise) || 0,
          mode: r.payment_mode || 'CASH',
          paidOn: r.payment_date || '2026-09-21',
          collectedBy: r.collected_by || 'admin',
          cancelled: Boolean(r.is_cancelled),
          allocatedHeads: Array.isArray(r.allocated_heads) ? r.allocated_heads.map(h => ({
            feeHead: h.fee_head || 'TUITION',
            period: h.period || h.month || '',
            amountPaise: Number(h.amount_paise) || 0
          })) : [],
          createdAt: r.created_at || new Date().toISOString()
        });
        inserted++;
      }
    }
    console.log(`Backfilled ${inserted} receipts into fee_payments!`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
