import 'dotenv/config';
import { getDatabase } from '../src/lib/mongodb';
import { performance } from 'perf_hooks';

async function testExplain() {
  const db = await getDatabase();
  const schoolId = 'DPS2026';
  const session = '2026-27';

  console.log('=== 1. EXPLAIN() FOR KPI AGGREGATION PIPELINE ===');
  const matchStage = {
    school_id: schoolId,
    academic_session: session,
    is_cancelled: { $ne: true }
  };

  const cursorExplain = await db.collection('fee_ledger').find(matchStage).explain('executionStats');
  
  console.log('--- QUERY PLANNER ---');
  console.log('Winning Plan Stage:', cursorExplain.queryPlanner?.winningPlan?.stage);
  console.log('Input Stage:', cursorExplain.queryPlanner?.winningPlan?.inputStage?.stage);
  console.log('Index Name Used:', cursorExplain.queryPlanner?.winningPlan?.inputStage?.indexName || cursorExplain.queryPlanner?.winningPlan?.indexName);

  console.log('\n--- EXECUTION STATS ---');
  console.log('Execution Success:', cursorExplain.executionStats?.executionSuccess);
  console.log('Total Docs Examined:', cursorExplain.executionStats?.totalDocsExamined);
  console.log('Total Keys Examined:', cursorExplain.executionStats?.totalKeysExamined);
  console.log('N Returned:', cursorExplain.executionStats?.nReturned);
  console.log('Execution Time (ms):', cursorExplain.executionStats?.executionTimeMillis);

  console.log('\n=== 2. BENCHMARKING AGGREGATION PIPELINE ===');
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBilled: {
          $sum: {
            $cond: [
              { $in: ['$line_type', ['DEMAND', 'FINE', 'CHARGE', 'OPENING_BALANCE']] },
              '$amount',
              0
            ]
          }
        },
        totalCollected: {
          $sum: {
            $cond: [
              { $eq: ['$line_type', 'PAYMENT'] },
              '$amount',
              0
            ]
          }
        },
        totalDiscount: {
          $sum: {
            $cond: [
              { $in: ['$line_type', ['DISCOUNT', 'WAIVER']] },
              '$amount',
              0
            ]
          }
        }
      }
    }
  ];

  const t0 = performance.now();
  const res = await db.collection('fee_ledger').aggregate(pipeline).toArray();
  const d0 = performance.now() - t0;
  console.log(`Aggregation executed in: ${d0.toFixed(2)}ms`);
  console.log('Result:', res);

  process.exit(0);
}

testExplain().catch(err => {
  console.error(err);
  process.exit(1);
});
