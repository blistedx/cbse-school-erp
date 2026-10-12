import 'dotenv/config';
import { getDatabase } from '../src/lib/mongodb';
import {
  getSchoolFeeOverviewAggregation,
  collectFeePayment,
  cancelReceipt,
  paiseToRupees,
  formatPaise
} from '../src/lib/fees-engine';

async function testE2EMutations() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('    END-TO-END MUTATIONS & IMMEDIATE KPI INVALIDATION CHECK      ');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const schoolId = 'DPS2026';
  const session = '2026-27';
  const db = await getDatabase();

  // 1. Initial State
  console.log('1. Reading Baseline KPI Aggregation...');
  const kpiInitial = await getSchoolFeeOverviewAggregation(schoolId, session);
  console.log({
    Billed: formatPaise(kpiInitial.totalBilledPaise),
    Collected: formatPaise(kpiInitial.totalCollectedPaise),
    Pending: formatPaise(kpiInitial.totalPendingPaise),
  });

  const studentDoc = await db.collection('students').findOne({ school_id: schoolId, id: 'STU-DPS-0005' });
  const paymentAmountPaise = 500000; // ₹5,000

  // 2. Perform Payment Mutation
  console.log(`\n2. Executing collectFeePayment (₹5,000 for ${studentDoc.id} - ${studentDoc.full_name})...`);
  const paymentResult = await collectFeePayment({
    schoolId,
    student: studentDoc as any,
    session,
    amountPaise: paymentAmountPaise,
    paymentMode: 'UPI',
    txnRef: 'E2E-TEST-TXN-12345',
    collectedBy: 'Test Runner',
    remarks: 'Automated E2E Invalidation Test Payment'
  });

  console.log('  → Payment Created:');
  console.log(`    Receipt No: ${paymentResult.receipt.receipt_no}`);
  console.log(`    Total Paid: ₹${paiseToRupees(paymentResult.receipt.amount_paise).toLocaleString('en-IN')}`);
  console.log(`    Lines Posted: ${paymentResult.postedLines.length}`);

  // 3. Immediately Query KPI (Assert NO stale cache, instant update)
  console.log('\n3. Immediately Re-querying KPI Endpoint (Testing Instant Invalidation)...');
  const kpiAfterPayment = await getSchoolFeeOverviewAggregation(schoolId, session);
  console.log({
    Billed: formatPaise(kpiAfterPayment.totalBilledPaise),
    Collected: formatPaise(kpiAfterPayment.totalCollectedPaise),
    Pending: formatPaise(kpiAfterPayment.totalPendingPaise),
  });

  const expectedCollectedAfterPay = kpiInitial.totalCollectedPaise + paymentAmountPaise;
  const passPaymentCollected = kpiAfterPayment.totalCollectedPaise === expectedCollectedAfterPay;

  console.log(`  ${passPaymentCollected ? '✅' : '❌'} Collected increased by exactly ₹5,000 instantly: ${formatPaise(kpiAfterPayment.totalCollectedPaise)} (Expected: ${formatPaise(expectedCollectedAfterPay)})`);

  // 4. Perform Receipt Cancellation Mutation
  console.log(`\n4. Executing cancelReceipt (${paymentResult.receipt.receipt_no})...`);
  const cancelResult = await cancelReceipt(
    schoolId,
    paymentResult.receipt.receipt_no,
    'E2E Test Cancellation and Rollback Verification',
    'Test Runner'
  );

  console.log(`  → Cancellation Status: ${cancelResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  → Message: ${cancelResult.message}`);

  // 5. Immediately Query KPI (Assert Immediate Rollback)
  console.log('\n5. Immediately Re-querying KPI Endpoint (Testing Rollback Invalidation)...');
  const kpiAfterCancel = await getSchoolFeeOverviewAggregation(schoolId, session);
  console.log({
    Billed: formatPaise(kpiAfterCancel.totalBilledPaise),
    Collected: formatPaise(kpiAfterCancel.totalCollectedPaise),
    Pending: formatPaise(kpiAfterCancel.totalPendingPaise),
  });

  const passRollbackCollected = kpiAfterCancel.totalCollectedPaise === kpiInitial.totalCollectedPaise;
  const passRollbackPending = kpiAfterCancel.totalPendingPaise === kpiInitial.totalPendingPaise;
  const passRollbackBilled = kpiAfterCancel.totalBilledPaise === kpiInitial.totalBilledPaise;

  console.log(`  ${passRollbackCollected ? '✅' : '❌'} Collected reverted to exact initial baseline: ${formatPaise(kpiAfterCancel.totalCollectedPaise)}`);
  console.log(`  ${passRollbackPending ? '✅' : '❌'} Pending reverted to exact initial baseline: ${formatPaise(kpiAfterCancel.totalPendingPaise)}`);
  console.log(`  ${passRollbackBilled ? '✅' : '❌'} Billed reverted to exact initial baseline: ${formatPaise(kpiAfterCancel.totalBilledPaise)}`);

  // 6. Clean up test documents
  console.log('\n6. Purging test receipt & cancelled test lines from DB...');
  await db.collection('fee_receipts').deleteOne({ receipt_no: paymentResult.receipt.receipt_no });
  await db.collection('fee_ledger').deleteMany({ receipt_no: paymentResult.receipt.receipt_no });
  console.log('  → Test data cleanly purged.');

  const allPassed = passPaymentCollected && passRollbackCollected && passRollbackPending && passRollbackBilled;

  console.log('\n══════════════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('🎉 E2E MUTATION & INSTANT INVALIDATION VERIFIED: ZERO STALE CACHE!');
  } else {
    console.error('❌ E2E MUTATION CHECK FAILED!');
    process.exit(1);
  }
  console.log('══════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

testE2EMutations().catch(err => {
  console.error(err);
  process.exit(1);
});
