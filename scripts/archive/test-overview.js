const { MongoClient } = require('mongodb');
require('dotenv').config();

async function test() {
  const mg = new MongoClient(process.env.MONGODB_URI);
  await mg.connect();
  const db = mg.db('edugit');
  const students = await db.collection('students').find({ school_id: 'DPS2026', academic_session: '2026-27' }).toArray();
  const lines = await db.collection('fee_ledger').find({ school_id: 'DPS2026', academic_session: '2026-27', is_cancelled: { $ne: true } }).toArray();
  console.log('Students count:', students.length);
  console.log('Lines count:', lines.length);

  let totalBilled = 0, totalCollected = 0, totalDiscount = 0;
  for (const l of lines) {
    if (l.line_type === 'DEMAND' || l.line_type === 'OPENING_BALANCE') totalBilled += l.amount;
    else if (l.line_type === 'PAYMENT') totalCollected += l.amount;
    else if (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') totalDiscount += l.amount;
  }
  console.log('Overview metrics:', {
    totalBilledPaise: totalBilled,
    totalBilledRupees: totalBilled / 100,
    totalCollectedRupees: totalCollected / 100,
    totalDiscountRupees: totalDiscount / 100,
    totalPendingRupees: (totalBilled - totalDiscount - totalCollected) / 100,
    collectionPercentage: Math.round((totalCollected / (totalBilled - totalDiscount)) * 100)
  });
  await mg.close();
}

test().catch(console.error);
