/*! Phase 3 Unified Fee Engine & Ledger Automated Verification Suite */
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDatabase } from '../src/lib/mongodb';
import { Database } from '../src/lib/db';
import {
  getSchoolFeeOverviewAggregation,
  executeReport,
  getStudentFeeSummary,
  paiseToRupees,
  formatPaise,
  ensureLedgerIndexes
} from '../src/lib/fees-engine';
import { performance } from 'perf_hooks';

interface AssertionResult {
  title: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: string;
}

const results: AssertionResult[] = [];

function assert(title: string, condition: boolean, actual?: any, expected?: any) {
  results.push({
    title,
    passed: condition,
    actual,
    expected
  });
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    console.error(`  ❌ [FAIL] ${title} | Expected: ${expected} | Actual: ${actual}`);
  }
}

async function runPhase3Verification() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  CBSE SCHOOL ERP — PHASE 3 UNIFIED LEDGER VERIFICATION SUITE');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const schoolId = 'DPS2026';
  const session = '2026-27';

  const db = await getDatabase();
  if (!db) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  // 1. Ensure compound indexes
  console.log('1. Ensuring Database Compound Indexes on fee_ledger...');
  await ensureLedgerIndexes();

  // 2. Count live ledger lines (>10,000 dataset test)
  console.log('\n2. Verifying Dataset Scale (> 10,000 Ledger Lines)...');
  const totalLedgerDocs = await db.collection('fee_ledger').countDocuments({
    school_id: schoolId,
    academic_session: session,
    is_cancelled: { $ne: true }
  });
  console.log(`  → Total active ledger lines in MongoDB: ${totalLedgerDocs.toLocaleString('en-IN')}`);
  assert('Dataset contains > 10,000 ledger lines (no truncation)', totalLedgerDocs >= 10000, totalLedgerDocs, '>= 10,000');

  // Fetch students for comparison
  const students = await Database.getStudents(schoolId, session);
  const studentsMap = new Map(students.map(s => [s.id, s]));
  console.log(`  → Total students mapped: ${students.length}`);

  // 3. Measure Cold Benchmark Timings
  console.log('\n3. Measuring Cold Execution Latency (MongoDB Aggregation Pipeline)...');
  
  const t0 = performance.now();
  const kpiOverview = await getSchoolFeeOverviewAggregation(schoolId, session, studentsMap);
  const kpiDurationMs = Math.round(performance.now() - t0);
  console.log(`  → getSchoolFeeOverviewAggregation took: ${kpiDurationMs}ms`);

  const t1 = performance.now();
  const reportResult = await executeReport(schoolId, 'class_wise_summary', { session }, students);
  const reportDurationMs = Math.round(performance.now() - t1);
  console.log(`  → executeReport (Class-wise DCB Master Summary) took: ${reportDurationMs}ms`);

  const t2 = performance.now();
  const schoolOverview = await Database.getSchoolOverview(schoolId, session);
  const overviewDurationMs = Math.round(performance.now() - t2);
  console.log(`  → Database.getSchoolOverview (Dashboard Card) took: ${overviewDurationMs}ms`);

  // 4. Sum of all individual student ledgers
  console.log('\n4. Computing Sum of All Individual Student Ledgers...');
  const t3 = performance.now();
  let studentSumBilled = 0;
  let studentSumPaid = 0;
  let studentSumDiscount = 0;
  let studentSumPending = 0;

  const distinctStudentIds: string[] = await db.collection('fee_ledger').distinct('student_id', {
    school_id: schoolId,
    academic_session: session,
    is_cancelled: { $ne: true }
  });
  console.log(`  → Distinct student ledgers in DB: ${distinctStudentIds.length}`);

  const chunkSize = 50;
  for (let i = 0; i < distinctStudentIds.length; i += chunkSize) {
    const chunk = distinctStudentIds.slice(i, i + chunkSize);
    const chunkSummaries = await Promise.all(
      chunk.map(sId => getStudentFeeSummary(schoolId, sId, session))
    );
    for (const sum of chunkSummaries) {
      studentSumBilled += sum.totalDemand;
      studentSumPaid += sum.totalPaid;
      studentSumDiscount += (sum.totalDiscount + sum.totalWaiver);
      studentSumPending += sum.balance;
    }
  }
  const studentLedgerDurationMs = Math.round(performance.now() - t3);
  console.log(`  → Summed ${distinctStudentIds.length} student ledgers in ${studentLedgerDurationMs}ms`);

  // 5. Assert Core Mathematical Invariants
  console.log('\n5. Asserting Mathematical Invariants & Cross-Component Unification...');

  // Invariant 1: Billed + Advance = Collected + Pending + Discounts
  const computedSum = kpiOverview.totalCollectedPaise + kpiOverview.totalPendingPaise + kpiOverview.totalDiscountPaise;
  const billedWithAdvance = kpiOverview.totalBilledPaise + (kpiOverview.totalAdvancePaise || 0);
  assert(
    'Invariant: Total Billed + Advance === Collected + Pending + Discounts',
    billedWithAdvance === computedSum,
    formatPaise(billedWithAdvance),
    formatPaise(computedSum)
  );

  // Invariant 2: KPI Overview == Main Dashboard Card
  assert(
    'Unification: KPI Overview Total Revenue (₹) === Main Dashboard Total Revenue',
    paiseToRupees(kpiOverview.totalCollectedPaise) === schoolOverview.kpis.totalRevenue,
    `₹${schoolOverview.kpis.totalRevenue.toLocaleString('en-IN')}`,
    `₹${paiseToRupees(kpiOverview.totalCollectedPaise).toLocaleString('en-IN')}`
  );

  assert(
    'Unification: KPI Overview Pending Dues (₹) === Main Dashboard Pending Fee Amount',
    paiseToRupees(kpiOverview.totalPendingPaise) === schoolOverview.kpis.pendingFeeAmount,
    `₹${schoolOverview.kpis.pendingFeeAmount.toLocaleString('en-IN')}`,
    `₹${paiseToRupees(kpiOverview.totalPendingPaise).toLocaleString('en-IN')}`
  );

  assert(
    'Unification: KPI Overview Collection % === Main Dashboard Fee Collection Rate',
    kpiOverview.collectionPercentage === schoolOverview.kpis.feeCollectionRate,
    `${schoolOverview.kpis.feeCollectionRate}%`,
    `${kpiOverview.collectionPercentage}%`
  );

  // Invariant 3: KPI Overview == Sum of Individual Student Ledgers
  assert(
    'Unification: KPI Overview Total Billed === Sum of All Student Ledgers Billed',
    kpiOverview.totalBilledPaise === studentSumBilled,
    formatPaise(kpiOverview.totalBilledPaise),
    formatPaise(studentSumBilled)
  );

  assert(
    'Unification: KPI Overview Total Collected === Sum of All Student Ledgers Paid',
    kpiOverview.totalCollectedPaise === studentSumPaid,
    formatPaise(kpiOverview.totalCollectedPaise),
    formatPaise(studentSumPaid)
  );

  assert(
    'Unification: KPI Overview Total Pending === Sum of All Student Ledgers Pending',
    kpiOverview.totalPendingPaise === studentSumPending,
    formatPaise(kpiOverview.totalPendingPaise),
    formatPaise(studentSumPending)
  );

  assert(
    'Unification: KPI Overview Total Discounts === Sum of All Student Ledgers Discounts',
    kpiOverview.totalDiscountPaise === studentSumDiscount,
    formatPaise(kpiOverview.totalDiscountPaise),
    formatPaise(studentSumDiscount)
  );

  // Invariant 4: Class-wise DCB Master Report == KPI Overview
  const reportCollected = reportResult.grandTotalRow?.collectedPaise ?? 0;
  const reportDemand = reportResult.grandTotalRow?.demandPaise ?? 0;
  assert(
    'Unification: Class-wise DCB Report Grand Total Collected === KPI Overview Collected',
    reportCollected === kpiOverview.totalCollectedPaise,
    formatPaise(reportCollected),
    formatPaise(kpiOverview.totalCollectedPaise)
  );

  assert(
    'Unification: Class-wise DCB Report Grand Total Billed === KPI Overview Total Billed',
    reportDemand === kpiOverview.totalBilledPaise,
    formatPaise(reportDemand),
    formatPaise(kpiOverview.totalBilledPaise)
  );

  // 6. Summary Report Table
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('                    RECONCILIATION SUMMARY                      ');
  console.log('══════════════════════════════════════════════════════════════════');
  console.table([
    {
      Component: 'KPI Overview Aggregation',
      'Billed (₹)': paiseToRupees(kpiOverview.totalBilledPaise).toLocaleString('en-IN'),
      'Collected (₹)': paiseToRupees(kpiOverview.totalCollectedPaise).toLocaleString('en-IN'),
      'Pending (₹)': paiseToRupees(kpiOverview.totalPendingPaise).toLocaleString('en-IN'),
      'Discounts (₹)': paiseToRupees(kpiOverview.totalDiscountPaise).toLocaleString('en-IN'),
      'Latency (ms)': `${kpiDurationMs}ms`
    },
    {
      Component: 'Main Dashboard Card (db.ts)',
      'Billed (₹)': 'N/A (Card shows Rev/Due)',
      'Collected (₹)': schoolOverview.kpis.totalRevenue.toLocaleString('en-IN'),
      'Pending (₹)': schoolOverview.kpis.pendingFeeAmount.toLocaleString('en-IN'),
      'Discounts (₹)': `Rate: ${schoolOverview.kpis.feeCollectionRate}%`,
      'Latency (ms)': `${overviewDurationMs}ms`
    },
    {
      Component: `Sum of Student Ledgers (${distinctStudentIds.length} Scholars)`,
      'Billed (₹)': paiseToRupees(studentSumBilled).toLocaleString('en-IN'),
      'Collected (₹)': paiseToRupees(studentSumPaid).toLocaleString('en-IN'),
      'Pending (₹)': paiseToRupees(studentSumPending).toLocaleString('en-IN'),
      'Discounts (₹)': paiseToRupees(studentSumDiscount).toLocaleString('en-IN'),
      'Latency (ms)': `${studentLedgerDurationMs}ms`
    },
    {
      Component: 'Month-Class Collection Report',
      'Billed (₹)': paiseToRupees(reportResult.grandTotalRow?.demandPaise ?? 0).toLocaleString('en-IN'),
      'Collected (₹)': paiseToRupees(reportResult.grandTotalRow?.collectedPaise ?? 0).toLocaleString('en-IN'),
      'Pending (₹)': paiseToRupees(reportResult.grandTotalRow?.pendingPaise ?? 0).toLocaleString('en-IN'),
      'Discounts (₹)': paiseToRupees(reportResult.grandTotalRow?.discountPaise ?? 0).toLocaleString('en-IN'),
      'Latency (ms)': `${reportDurationMs}ms`
    }
  ]);

  const allPassed = results.every(r => r.passed);
  console.log(`\nVerification Result: ${results.filter(r => r.passed).length}/${results.length} Assertions Passed.`);
  if (!allPassed) {
    console.error('❌ Some assertions failed!');
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 3 UNIFIED LEDGER INVARIANTS VERIFIED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runPhase3Verification().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
