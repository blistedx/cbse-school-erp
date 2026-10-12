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

async function test() {
  const client = new MongoClient(envUri, { tls: true, tlsAllowInvalidCertificates: true });
  await client.connect();
  const db = client.db('edugit');

  // We can import from src/lib/fees-engine/ledger or replicate
  const pipeline = [
    {
      $match: {
        school_id: 'DPS2026',
        academic_session: '2026-27',
        is_cancelled: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$student_id',
        demand: {
          $sum: {
            $cond: [{ $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE', 'FINE']] }, '$amount', 0],
          },
        },
        paid: {
          $sum: {
            $cond: [{ $eq: ['$line_type', 'PAYMENT'] }, '$amount', 0],
          },
        },
        discount: {
          $sum: {
            $cond: [{ $in: ['$line_type', ['DISCOUNT', 'WAIVER']] }, '$amount', 0],
          },
        },
      },
    },
  ];

  const results = await db.collection('fee_ledger').aggregate(pipeline).toArray();
  const totalDemand = results.reduce((s, r) => s + r.demand, 0);
  const totalPaid = results.reduce((s, r) => s + r.paid, 0);
  const totalDiscount = results.reduce((s, r) => s + r.discount, 0);
  const totalPending = Math.max(0, totalDemand - totalDiscount - totalPaid);

  console.log(`Aggregated ${results.length} students:`);
  console.log(`Total Demand: ₹${totalDemand / 100}`);
  console.log(`Total Paid: ₹${totalPaid / 100}`);
  console.log(`Total Discount: ₹${totalDiscount / 100}`);
  console.log(`Total Pending: ₹${totalPending / 100}`);

  // Month-wise trend
  const lines = await db.collection('fee_ledger').find({
    school_id: 'DPS2026',
    academic_session: '2026-27',
    is_cancelled: { $ne: true }
  }).toArray();

  const monthMap = {};
  for (const l of lines) {
    if (!l.month) continue;
    if (!monthMap[l.month]) monthMap[l.month] = { demand: 0, paid: 0, discount: 0, dues: 0 };
    if (l.line_type === 'DEMAND') monthMap[l.month].demand += l.amount;
    else if (l.line_type === 'PAYMENT') monthMap[l.month].paid += l.amount;
    else if (l.line_type === 'DISCOUNT') monthMap[l.month].discount += l.amount;
  }

  for (const [m, v] of Object.entries(monthMap)) {
    v.dues = Math.max(0, v.demand - v.discount - v.paid);
    console.log(`Month ${m}: Demand ₹${v.demand / 100}, Paid ₹${v.paid / 100}, Dues ₹${v.dues / 100}`);
  }

  await client.close();
}

test().catch(console.error);
