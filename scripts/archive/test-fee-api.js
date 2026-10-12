require('dotenv').config();
const { MongoClient } = require('mongodb');

async function test() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('edugit');
  const collection = db.collection('fee_ledger');

  // Test 1: Student-wise aggregate
  const studentPipeline = [
    {
      $match: {
        school_id: 'DPS2026',
        academic_session: '2026-27',
        is_cancelled: { $ne: true }
      }
    },
    {
      $group: {
        _id: { student: '$student_id' },
        demand: { $sum: { $cond: [{ $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE']] }, '$amount', 0] } },
        collected: { $sum: { $cond: [{ $eq: ['$line_type', 'PAYMENT'] }, '$amount', 0] } },
        discount: { $sum: { $cond: [{ $eq: ['$line_type', 'DISCOUNT'] }, '$amount', 0] } },
        waiver: { $sum: { $cond: [{ $eq: ['$line_type', 'WAIVER'] }, '$amount', 0] } },
        fine: { $sum: { $cond: [{ $eq: ['$line_type', 'FINE'] }, '$amount', 0] } },
        refund: { $sum: { $cond: [{ $eq: ['$line_type', 'REFUND'] }, '$amount', 0] } },
        studentCount: { $addToSet: '$student_id' }
      }
    },
    {
      $project: {
        _id: 0,
        dimensions: '$_id',
        demand: { $add: ['$demand', '$fine'] },
        discount: 1,
        waiver: 1,
        fine: 1,
        collected: 1,
        refund: 1,
        balance: {
          $subtract: [
            { $add: ['$demand', '$fine', '$refund'] },
            { $add: ['$collected', '$discount', '$waiver'] }
          ]
        },
        studentCount: { $size: '$studentCount' }
      }
    }
  ];

  const studentResults = await collection.aggregate(studentPipeline).toArray();
  console.log('Total students in fee_ledger:', studentResults.length);
  console.log('Sample student row:', JSON.stringify(studentResults[0], null, 2));

  // Test 2: Month-wise full DCB aggregate (without restricting to only PAYMENT)
  const monthPipeline = [
    {
      $match: {
        school_id: 'DPS2026',
        academic_session: '2026-27',
        is_cancelled: { $ne: true }
      }
    },
    {
      $group: {
        _id: { month: '$month' },
        demand: { $sum: { $cond: [{ $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE']] }, '$amount', 0] } },
        collected: { $sum: { $cond: [{ $eq: ['$line_type', 'PAYMENT'] }, '$amount', 0] } },
        discount: { $sum: { $cond: [{ $eq: ['$line_type', 'DISCOUNT'] }, '$amount', 0] } },
        waiver: { $sum: { $cond: [{ $eq: ['$line_type', 'WAIVER'] }, '$amount', 0] } },
        fine: { $sum: { $cond: [{ $eq: ['$line_type', 'FINE'] }, '$amount', 0] } },
        refund: { $sum: { $cond: [{ $eq: ['$line_type', 'REFUND'] }, '$amount', 0] } },
        studentCount: { $addToSet: '$student_id' }
      }
    },
    {
      $project: {
        _id: 0,
        dimensions: '$_id',
        demand: { $add: ['$demand', '$fine'] },
        discount: 1,
        waiver: 1,
        fine: 1,
        collected: 1,
        refund: 1,
        balance: {
          $subtract: [
            { $add: ['$demand', '$fine', '$refund'] },
            { $add: ['$collected', '$discount', '$waiver'] }
          ]
        },
        studentCount: { $size: '$studentCount' }
      }
    }
  ];

  const monthResults = await collection.aggregate(monthPipeline).toArray();
  console.log('\nTotal month rows in fee_ledger:', monthResults.length);
  console.log('Sample month rows:', JSON.stringify(monthResults.slice(0, 3), null, 2));

  await client.close();
}

test().catch(console.error);
