import 'dotenv/config';
import { getDatabase } from '../src/lib/mongodb';
import {
  getSchoolFeeOverviewAggregation,
  getFeeAggregate,
  executeReport,
  getStudentLedger,
  paiseToRupees
} from '../src/lib/fees-engine';

async function testMultiTenantIsolation() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('      MULTI-TENANT ISOLATION & DATA LEAKAGE VERIFICATION         ');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const db = await getDatabase();
  const schoolA = 'DPS2026';
  const schoolB = 'SCHOOL_B_ISOLATION_TEST';
  const session = '2026-27';

  // 1. Snapshot School A initial figures
  console.log('1. Fetching School A (DPS2026) initial baseline...');
  const kpiA_initial = await getSchoolFeeOverviewAggregation(schoolA, session);
  console.log({
    schoolA: schoolA,
    totalBilled: `₹${paiseToRupees(kpiA_initial.totalBilledPaise).toLocaleString('en-IN')}`,
    totalCollected: `₹${paiseToRupees(kpiA_initial.totalCollectedPaise).toLocaleString('en-IN')}`,
    totalPending: `₹${paiseToRupees(kpiA_initial.totalPendingPaise).toLocaleString('en-IN')}`,
  });

  // 2. Insert test ledger records for School B
  console.log('\n2. Creating isolated dataset for School B (SCHOOL_B_ISOLATION_TEST)...');
  const schoolB_lines = [
    {
      id: 'FLL-TEST-B-001',
      school_id: schoolB,
      academic_session: session,
      student_id: 'STU-B-001',
      admission_no: 'SCHB-001',
      class_name: 'Class 5',
      section: 'A',
      line_type: 'DEMAND',
      fee_head: 'TUITION',
      month: 'APR',
      amount: 300000, // ₹3,000
      txn_date: '2026-04-10',
      is_cancelled: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'FLL-TEST-B-002',
      school_id: schoolB,
      academic_session: session,
      student_id: 'STU-B-001',
      admission_no: 'SCHB-001',
      class_name: 'Class 5',
      section: 'A',
      line_type: 'PAYMENT',
      fee_head: 'TUITION',
      month: 'APR',
      amount: 200000, // ₹2,000
      receipt_no: 'REC-B-001',
      payment_mode: 'UPI',
      txn_date: '2026-04-12',
      is_cancelled: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'FLL-TEST-B-003',
      school_id: schoolB,
      academic_session: session,
      student_id: 'STU-B-002',
      admission_no: 'SCHB-002',
      class_name: 'Class 6',
      section: 'B',
      line_type: 'DEMAND',
      fee_head: 'TUITION',
      month: 'APR',
      amount: 400000, // ₹4,000
      txn_date: '2026-04-10',
      is_cancelled: false,
      created_at: new Date().toISOString()
    }
  ];

  await db.collection('fee_ledger').insertMany(schoolB_lines);
  console.log(`  → Inserted ${schoolB_lines.length} ledger lines for School B.`);

  // 3. Query School B KPI
  console.log('\n3. Querying School B KPI aggregation...');
  const kpiB = await getSchoolFeeOverviewAggregation(schoolB, session);
  console.log({
    schoolB: schoolB,
    totalBilled: `₹${paiseToRupees(kpiB.totalBilledPaise).toLocaleString('en-IN')}`,
    totalCollected: `₹${paiseToRupees(kpiB.totalCollectedPaise).toLocaleString('en-IN')}`,
    totalPending: `₹${paiseToRupees(kpiB.totalPendingPaise).toLocaleString('en-IN')}`,
  });

  const expectedB_Billed = 700000; // ₹7,000 in paise
  const expectedB_Collected = 200000; // ₹2,000 in paise
  const expectedB_Pending = 500000; // ₹5,000 in paise

  const passB_Billed = kpiB.totalBilledPaise === expectedB_Billed;
  const passB_Collected = kpiB.totalCollectedPaise === expectedB_Collected;
  const passB_Pending = kpiB.totalPendingPaise === expectedB_Pending;

  console.log(`  ${passB_Billed ? '✅' : '❌'} School B Billed === ₹7,000 (${kpiB.totalBilledPaise} paise)`);
  console.log(`  ${passB_Collected ? '✅' : '❌'} School B Collected === ₹2,000 (${kpiB.totalCollectedPaise} paise)`);
  console.log(`  ${passB_Pending ? '✅' : '❌'} School B Pending === ₹5,000 (${kpiB.totalPendingPaise} paise)`);

  // 4. Verify School A (DPS2026) has 0 leakage
  console.log('\n4. Verifying School A (DPS2026) has ZERO cross-tenant leakage...');
  const kpiA_after = await getSchoolFeeOverviewAggregation(schoolA, session);

  const passA_Billed = kpiA_after.totalBilledPaise === kpiA_initial.totalBilledPaise;
  const passA_Collected = kpiA_after.totalCollectedPaise === kpiA_initial.totalCollectedPaise;
  const passA_Pending = kpiA_after.totalPendingPaise === kpiA_initial.totalPendingPaise;

  console.log(`  ${passA_Billed ? '✅' : '❌'} School A Billed completely identical: ₹${paiseToRupees(kpiA_after.totalBilledPaise).toLocaleString('en-IN')}`);
  console.log(`  ${passA_Collected ? '✅' : '❌'} School A Collected completely identical: ₹${paiseToRupees(kpiA_after.totalCollectedPaise).toLocaleString('en-IN')}`);
  console.log(`  ${passA_Pending ? '✅' : '❌'} School A Pending completely identical: ₹${paiseToRupees(kpiA_after.totalPendingPaise).toLocaleString('en-IN')}`);

  // 5. Query Student Ledger for School A vs School B
  console.log('\n5. Verifying Student Ledger Isolation...');
  const studentA_ledger = await getStudentLedger(schoolA, 'STU-B-001', session);
  const studentB_ledger = await getStudentLedger(schoolB, 'STU-B-001', session);

  const passLedgerIsolation = studentA_ledger.length === 0 && studentB_ledger.length === 2;
  console.log(`  ${passLedgerIsolation ? '✅' : '❌'} Querying School B student with School A tenant returns 0 lines (Complete Isolation)`);

  // 6. Cleanup School B test data
  console.log('\n6. Cleaning up test data from Database...');
  const delRes = await db.collection('fee_ledger').deleteMany({ school_id: schoolB });
  console.log(`  → Deleted ${delRes.deletedCount} temporary test lines.`);

  const allPassed = passB_Billed && passB_Collected && passB_Pending && passA_Billed && passA_Collected && passA_Pending && passLedgerIsolation;

  console.log('\n══════════════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('🎉 MULTI-TENANT ISOLATION VERIFIED: 100% ISOLATED, ZERO LEAKAGE!');
  } else {
    console.error('❌ MULTI-TENANT ISOLATION CHECK FAILED!');
    process.exit(1);
  }
  console.log('══════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

testMultiTenantIsolation().catch(err => {
  console.error(err);
  process.exit(1);
});
