#!/usr/bin/env node
/*! EduSuite Fee Master — Comprehensive Test Suite v3.0.0 */

import {
  computeSummaryFromLines,
  getTuitionRateForClass,
  getAnnualFeeForClass,
  getTransportSlabRate,
  calculateSiblingDiscount,
  DEFAULT_FEE_CONFIG,
  ACADEMIC_MONTHS,
  paiseToRupees,
  rupeesToPaise,
  FeeLedgerLine,
} from '../src/lib/fees-engine';
import type { Student } from '../src/lib/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function assertEq(actual: any, expected: any, testName: string) {
  const pass = actual === expected;
  if (!pass) {
    assert(false, testName, `expected ${expected}, got ${actual}`);
  } else {
    assert(true, testName);
  }
}

function makeLine(overrides: Partial<FeeLedgerLine>): FeeLedgerLine {
  return {
    id: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    school_id: 'DPS2026',
    academic_session: '2026-27',
    student_id: 'STU-001',
    class_name: 'Class 6',
    section: 'A',
    admission_no: 'ADM001',
    line_type: 'DEMAND',
    fee_head: 'TUITION',
    month: 'APR',
    amount: 0,
    txn_date: '2026-04-15',
    due_date: '2026-04-15',
    payment_mode: null,
    receipt_no: null,
    cheque_no: null,
    txn_ref: null,
    concession_type: null,
    collected_by: null,
    approved_by: null,
    is_cancelled: false,
    cancelled_reason: null,
    cancelled_by: null,
    cancelled_at: null,
    linked_line_id: null,
    remarks: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

console.log('\n🧪 ========================================================');
console.log('🧪 EduSuite Single Fees Engine — Automated Verification');
console.log('🧪 ========================================================\n');

// ─── TEST 1: Official Session 2026-27 Tuition Rates ───
console.log('📋 TEST 1: Official Session 2026-27 Tuition Rate Lookups');
{
  const pgRate = getTuitionRateForClass(DEFAULT_FEE_CONFIG as any, 'Playgroup');
  assertEq(pgRate, 100000, 'PG/LKG/UKG tuition = ₹1,000 (100000 paise)');

  const c1Rate = getTuitionRateForClass(DEFAULT_FEE_CONFIG as any, 'Class 1');
  assertEq(c1Rate, 140000, 'Class I-II tuition = ₹1,400 (140000 paise)');

  const c4Rate = getTuitionRateForClass(DEFAULT_FEE_CONFIG as any, 'Class 4');
  assertEq(c4Rate, 160000, 'Class III-V tuition = ₹1,600 (160000 paise)');

  const c7Rate = getTuitionRateForClass(DEFAULT_FEE_CONFIG as any, 'Class 7');
  assertEq(c7Rate, 180000, 'Class VI-VIII tuition = ₹1,800 (180000 paise)');

  const c10Rate = getTuitionRateForClass(DEFAULT_FEE_CONFIG as any, 'Class 10');
  assertEq(c10Rate, 200000, 'Class IX-X tuition = ₹2,000 (200000 paise)');

  const c12Rate = getTuitionRateForClass(DEFAULT_FEE_CONFIG as any, 'Class 12');
  assertEq(c12Rate, 240000, 'Class XI-XII tuition = ₹2,400 (240000 paise)');
}

// ─── TEST 2: Transport Distance Slabs ───
console.log('\n📋 TEST 2: Transport Distance Slabs Resolution');
{
  assertEq(getTransportSlabRate(DEFAULT_FEE_CONFIG as any, 2), 80000, '1-3 km = ₹800 (80000 paise)');
  assertEq(getTransportSlabRate(DEFAULT_FEE_CONFIG as any, 5), 90000, '4-6 km = ₹900 (90000 paise)');
  assertEq(getTransportSlabRate(DEFAULT_FEE_CONFIG as any, 10), 110000, '7-12 km = ₹1,100 (110000 paise)');
  assertEq(getTransportSlabRate(DEFAULT_FEE_CONFIG as any, 15), 130000, '13-16 km = ₹1,300 (130000 paise)');
  assertEq(getTransportSlabRate(DEFAULT_FEE_CONFIG as any, 18), 180000, '16-20 km = ₹1,800 (180000 paise)');
}

// ─── TEST 3: Sibling Discount Rules (2nd, 3rd, 4th Child) ───
console.log('\n📋 TEST 3: Sibling Concession Math');
{
  const tuition = 200000; // ₹2,000
  const transport = 80000; // ₹800

  // 1st Child: 0% discount
  const child1 = calculateSiblingDiscount(DEFAULT_FEE_CONFIG as any, 1, tuition, transport);
  assertEq(child1.totalDiscountPaise, 0, 'Child #1 has ₹0 sibling discount');

  // 2nd Child: 20% tuition discount = ₹400
  const child2 = calculateSiblingDiscount(DEFAULT_FEE_CONFIG as any, 2, tuition, transport);
  assertEq(child2.tuitionDiscountPaise, 40000, 'Child #2 gets 20% tuition concession (₹400 / 40000 paise)');
  assertEq(child2.freeTransport, false, 'Child #2 does not get free transport');

  // 3rd Child: 30% tuition discount = ₹600
  const child3 = calculateSiblingDiscount(DEFAULT_FEE_CONFIG as any, 3, tuition, transport);
  assertEq(child3.tuitionDiscountPaise, 60000, 'Child #3 gets 30% tuition concession (₹600 / 60000 paise)');
  assertEq(child3.freeTransport, false, 'Child #3 does not get free transport');

  // 4th Child: 30% tuition discount + 100% Free Transport = ₹600 + ₹800 = ₹1,400
  const child4 = calculateSiblingDiscount(DEFAULT_FEE_CONFIG as any, 4, tuition, transport);
  assertEq(child4.tuitionDiscountPaise, 60000, 'Child #4 gets 30% tuition concession (₹600)');
  assertEq(child4.transportDiscountPaise, 80000, 'Child #4 gets 100% Free Transport (₹800)');
  assertEq(child4.totalDiscountPaise, 140000, 'Child #4 gets total ₹1,400 concession (140000 paise)');
  assertEq(child4.freeTransport, true, 'Child #4 has free transport enabled');
}

// ─── TEST 4: Partial Payment FIFO Allocation & Dues Balance ───
console.log('\n📋 TEST 4: Partial Payment & Ledger Status Consistency');
{
  const lines: FeeLedgerLine[] = [
    makeLine({ fee_head: 'TUITION', month: 'APR', amount: 180000, line_type: 'DEMAND' }),
    makeLine({ fee_head: 'ANNUAL', month: 'APR', amount: 500000, line_type: 'DEMAND' }),
    makeLine({ fee_head: 'TUITION', month: 'MAY', amount: 180000, line_type: 'DEMAND' }),
    // Payment of ₹5,000
    makeLine({ fee_head: 'ANNUAL', month: 'APR', amount: 500000, line_type: 'PAYMENT', receipt_no: 'REC-101' }),
    // Payment of ₹1,000 partial on April Tuition
    makeLine({ fee_head: 'TUITION', month: 'APR', amount: 100000, line_type: 'PAYMENT', receipt_no: 'REC-102' }),
  ];

  const summary = computeSummaryFromLines(lines);
  assertEq(summary.totalDemand, 860000, 'Total demand = ₹8,600 (860000 paise)');
  assertEq(summary.totalPaid, 600000, 'Total paid = ₹6,000 (600000 paise)');
  assertEq(summary.balance, 260000, 'Balance due = ₹2,600 (260000 paise)');
  assert(summary.status === 'PARTIAL' || summary.status === 'OVERDUE', 'Student status reflects outstanding dues (PARTIAL/OVERDUE)');
}

// ─── TEST 5: Total Invariant: Dashboard Totals == Sum of Student Ledgers ───
console.log('\n📋 TEST 5: Financial Invariant Verification');
{
  // Simulate 3 students
  const student1Lines = [
    makeLine({ student_id: 'S1', amount: 100000, line_type: 'DEMAND' }),
    makeLine({ student_id: 'S1', amount: 100000, line_type: 'PAYMENT' }),
  ];
  const student2Lines = [
    makeLine({ student_id: 'S2', amount: 150000, line_type: 'DEMAND' }),
    makeLine({ student_id: 'S2', amount: 30000, line_type: 'DISCOUNT' }),
    makeLine({ student_id: 'S2', amount: 70000, line_type: 'PAYMENT' }),
  ];
  const student3Lines = [
    makeLine({ student_id: 'S3', amount: 200000, line_type: 'DEMAND' }),
  ];

  const sum1 = computeSummaryFromLines(student1Lines);
  const sum2 = computeSummaryFromLines(student2Lines);
  const sum3 = computeSummaryFromLines(student3Lines);

  const totalDemandLedgers = sum1.totalDemand + sum2.totalDemand + sum3.totalDemand;
  const totalPaidLedgers = sum1.totalPaid + sum2.totalPaid + sum3.totalPaid;
  const totalDiscountLedgers = sum1.totalDiscount + sum2.totalDiscount + sum3.totalDiscount;
  const totalBalanceLedgers = sum1.balance + sum2.balance + sum3.balance;

  const allLines = [...student1Lines, ...student2Lines, ...student3Lines];
  const overallSummary = computeSummaryFromLines(allLines);

  assertEq(overallSummary.totalDemand, totalDemandLedgers, 'Overall demand matches sum of individual student demands');
  assertEq(overallSummary.totalPaid, totalPaidLedgers, 'Overall paid matches sum of individual student receipts');
  assertEq(overallSummary.totalDiscount, totalDiscountLedgers, 'Overall discounts match sum of individual student concessions');
  assertEq(overallSummary.balance, totalBalanceLedgers, 'Overall balance matches sum of individual student balances');
}

console.log('\n========================================================');
console.log(`📊 Summary: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
if (failed === 0) {
  console.log('🌟 ALL UNIT & INTEGRATION TESTS PASSED PERFECTLY!\n');
} else {
  console.error(`💥 ${failed} TEST(S) FAILED`);
  process.exit(1);
}
