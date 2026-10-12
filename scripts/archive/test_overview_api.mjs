import { MongoClient } from 'mongodb';
import fs from 'fs';

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  const envFiles = ['.env', '.env.local'];
  for (const ef of envFiles) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, 'utf8');
      const match = content.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
      if (match) {
        envUri = match[1];
        break;
      }
    }
  }
}

async function test() {
  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');

  const schoolId = 'DPS2026';
  const session = '2026-27';

  // Check ledger summary pipeline
  const pipeline = [
    {
      $match: {
        school_id: schoolId,
        academic_session: session,
        is_cancelled: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$student_id',
        studentId: { $first: '$student_id' },
        admissionNo: { $first: '$admission_no' },
        className: { $first: '$class_name' },
        section: { $first: '$section' },
        demand: {
          $sum: {
            $cond: [
              { $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE', 'FINE']] },
              '$amount',
              0,
            ],
          },
        },
        paid: {
          $sum: {
            $cond: [
              { $eq: ['$line_type', 'PAYMENT'] },
              '$amount',
              0,
            ],
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

  const studentAggs = await db.collection('fee_ledger').aggregate(pipeline).toArray();
  const totalBilledPaise = studentAggs.reduce((sum, s) => sum + s.demand, 0);
  const totalCollectedPaise = studentAggs.reduce((sum, s) => sum + s.paid, 0);
  const totalDiscountPaise = studentAggs.reduce((sum, s) => sum + s.discount, 0);
  const paidStudents = studentAggs.filter(s => s.paid > 0);

  console.log({
    totalStudentsInLedger: studentAggs.length,
    totalBilledRupees: totalBilledPaise / 100,
    totalCollectedRupees: totalCollectedPaise / 100,
    totalDiscountRupees: totalDiscountPaise / 100,
    paidStudentsCount: paidStudents.length,
  });

  // Check month-wise collection
  const monthPipe = [
    {
      $match: {
        school_id: schoolId,
        academic_session: session,
        line_type: 'PAYMENT',
        is_cancelled: { $ne: true },
      }
    },
    {
      $group: {
        _id: '$month',
        totalPaid: { $sum: '$amount' },
        count: { $sum: 1 },
        students: { $addToSet: '$student_id' }
      }
    }
  ];

  const monthAggs = await db.collection('fee_ledger').aggregate(monthPipe).toArray();
  console.log('Month-wise Payments:', monthAggs.map(m => ({
    month: m._id,
    totalPaidRupees: m.totalPaid / 100,
    linesCount: m.count,
    distinctStudents: m.students.length
  })));

  await client.close();
}

test().catch(console.error);
