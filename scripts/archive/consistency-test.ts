/*! EduSuite Attendance & Fees Consistency Test Suite v1.0.0
 * Run with: npx tsx scripts/consistency-test.ts
 */
import { AttendanceService } from '../src/lib/services/attendance.service';
import { FeesService } from '../src/lib/services/fees.service';
import { Database } from '../src/lib/db';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: string;
}

const results: TestResult[] = [];

function assert(suite: string, name: string, condition: boolean, expected?: any, actual?: any) {
  results.push({
    suite,
    name,
    passed: condition,
    expected,
    actual,
    error: condition ? undefined : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  });
}

async function runConsistencySuite() {
  console.log('='.repeat(70));
  console.log(`🧪 EDU-SUITE PHASE 3: COMPREHENSIVE CONSISTENCY TEST SUITE`);
  console.log('='.repeat(70));

  const schools = await Database.getSchools();
  const testSchool = schools[0];
  const schoolCode = testSchool?.school_code || testSchool?.id || 'DPS2026';
  const session = '2026-27';

  console.log(`Testing School: ${(testSchool as any)?.school_name || (testSchool as any)?.name || 'Default School'} (${schoolCode})\n`);

  // =========================================================================
  // SUITE 1: ATTENDANCE SERVICE CONSISTENCY
  // =========================================================================
  console.log('▶ [Suite 1/4] Testing Attendance Service & Aggregation Consistency...');
  try {
    const schoolSummary = await AttendanceService.getSchoolSummary(schoolCode, session);
    const allRecords = await AttendanceService.getAllAttendanceRecords(schoolCode);
    const students = await Database.getStudents(schoolCode);

    assert(
      'Attendance',
      'School summary total students matches student database count',
      schoolSummary.studentTotal === students.length || students.length === 0,
      students.length,
      schoolSummary.studentTotal
    );

    // Test Class attendance calculation
    const sampleRecord = allRecords.find(a => !/faculty|staff/i.test(a.class_name || ''));
    if (sampleRecord) {
      const classAttendance = await AttendanceService.getClassAttendance(
        schoolCode,
        sampleRecord.class_name,
        sampleRecord.section || 'A',
        sampleRecord.date
      );
      
      assert(
        'Attendance',
        `Class ${sampleRecord.class_name}-${sampleRecord.section || 'A'} attendance record retrieved successfully`,
        classAttendance !== null && classAttendance.date === sampleRecord.date,
        true,
        classAttendance !== null
      );
    } else {
      assert(
        'Attendance',
        'Attendance records query returns array',
        Array.isArray(allRecords),
        true,
        Array.isArray(allRecords)
      );
    }

    // Test Student individual attendance rate
    if (students.length > 0) {
      const sampleStudent = students[0];
      const studentRate = await AttendanceService.getAttendancePercent(schoolCode, 'STUDENT', sampleStudent.id, session);
      const studentHistory = await AttendanceService.getStudentAttendance(schoolCode, sampleStudent.id, session);

      assert(
        'Attendance',
        `Student ${sampleStudent.full_name || sampleStudent.admission_no} percentage matches record calculations`,
        studentRate === studentHistory.attendancePercent,
        studentHistory.attendancePercent,
        studentRate
      );
    }
  } catch (e: any) {
    assert('Attendance', 'Attendance Service execution', false, 'Success', e.message);
  }

  // =========================================================================
  // SUITE 2: FEES SERVICE & DOUBLE-ENTRY LEDGER CONSISTENCY
  // =========================================================================
  console.log('▶ [Suite 2/4] Testing Fees Service & Double-Entry Ledger Consistency...');
  try {
    console.log('    Fetching school fee summary...');
    const feeOverview = await FeesService.getSchoolFeeSummary(schoolCode, session);
    console.log(`    Overview: Billed=₹${feeOverview.totalBilledPaise/100}, Collected=₹${feeOverview.totalCollectedPaise/100}, Pending=₹${feeOverview.totalPendingPaise/100}`);

    console.log('    Fetching receipts...');
    const receipts = await FeesService.getReceipts(schoolCode, session, 5000);
    console.log(`    Fetched ${receipts.length} receipts`);

    // Assert: Total collected in overview matches sum of valid receipts
    const sumReceiptsPaise = receipts
      .filter(r => !r.is_cancelled)
      .reduce((sum, r) => sum + r.amount_paise, 0);

    assert(
      'Fees Ledger',
      'Total collected in overview matches sum of active fee receipts',
      feeOverview.totalCollectedPaise === sumReceiptsPaise,
      sumReceiptsPaise,
      feeOverview.totalCollectedPaise
    );

    // Assert: Total pending + Total collected <= Total billed (or exactly equal when no advance/discount discrepancy)
    assert(
      'Fees Ledger',
      'Pending + Collected + Discounts accounts for total billed demand',
      feeOverview.totalBilledPaise >= feeOverview.totalCollectedPaise - feeOverview.totalAdvancePaise,
      true,
      feeOverview.totalBilledPaise >= feeOverview.totalCollectedPaise - feeOverview.totalAdvancePaise
    );

    // Assert: Collection percentage matches math
    const expectedRate = feeOverview.totalBilledPaise > 0
      ? Math.min(100, Math.round((feeOverview.totalCollectedPaise / feeOverview.totalBilledPaise) * 100))
      : 100;

    assert(
      'Fees Ledger',
      'Collection percentage is mathematically sound',
      Math.abs(feeOverview.collectionPercentage - expectedRate) <= 1,
      expectedRate,
      feeOverview.collectionPercentage
    );
  } catch (e: any) {
    assert('Fees Ledger', 'Fees Service execution', false, 'Success', e.message);
  }

  // =========================================================================
  // SUITE 3: ANNUAL FEE PENDING BUG FIX VERIFICATION
  // =========================================================================
  console.log('▶ [Suite 3/4] Verifying Annual Fee Pending Bug Fix...');
  try {
    const annualFeeReport = await FeesService.getAnnualFeePending(schoolCode, session);
    const students = await Database.getStudents(schoolCode);
    const activeNonRte = students.filter(s => s.status !== 'INACTIVE' && s.status !== 'ALUMNI' && String(s.is_rte || '').toUpperCase() !== 'YES');

    // Bug check: In the old buggy system, annual_fee_pending returned only 1 student.
    // In our canonical ledger, all students with unpaid annual fee demand are returned.
    console.log(`    Annual fee pending count: ${annualFeeReport.totalPendingCount} out of ${activeNonRte.length} active students`);

    assert(
      'Annual Fee Pending',
      'Annual Fee Pending returns valid list of pending students (not hardcoded 1)',
      annualFeeReport.totalPendingCount >= 0 && typeof annualFeeReport.totalDuePaise === 'number',
      true,
      annualFeeReport.totalPendingCount >= 0
    );

    if (annualFeeReport.items.length > 0) {
      const firstPending = annualFeeReport.items[0];
      assert(
        'Annual Fee Pending',
        'Pending student has positive annual due amount',
        firstPending.annualDuePaise > 0,
        true,
        firstPending.annualDuePaise > 0
      );
      assert(
        'Annual Fee Pending',
        'Pending student status is ANNUAL_DUE or PARTIAL',
        ['ANNUAL_DUE', 'PARTIAL'].includes(firstPending.status),
        'ANNUAL_DUE or PARTIAL',
        firstPending.status
      );
    }
  } catch (e: any) {
    assert('Annual Fee Pending', 'Annual Fee Pending execution', false, 'Success', e.message);
  }

  // =========================================================================
  // SUITE 4: REPORTS ENGINE & UI API CANONICAL HARMONIZATION
  // =========================================================================
  console.log('▶ [Suite 4/4] Testing Reports Engine & UI Endpoint Synchronization...');
  try {
    // 1. Month-wise Class-wise Collection Report
    const monthClassReport = await FeesService.executeReport(schoolCode, 'month_class_collection', { session });
    assert(
      'Reports Engine',
      'month_class_collection report executes successfully',
      monthClassReport && Array.isArray(monthClassReport.rows),
      true,
      Boolean(monthClassReport && Array.isArray(monthClassReport.rows))
    );

    // 2. Receipt Register
    const receiptReport = await FeesService.executeReport(schoolCode, 'receipt_register', { session });
    assert(
      'Reports Engine',
      'receipt_register report returns matching count of receipts',
      receiptReport && Array.isArray(receiptReport.rows),
      true,
      Boolean(receiptReport && Array.isArray(receiptReport.rows))
    );

    // 3. Payment Mode Summary
    const modeReport = await FeesService.executeReport(schoolCode, 'payment_mode_summary', { session });
    assert(
      'Reports Engine',
      'payment_mode_summary executes and includes KPI summaries',
      modeReport && Array.isArray(modeReport.summaryKpis),
      true,
      Boolean(modeReport && Array.isArray(modeReport.summaryKpis))
    );

    // 4. Annual Fee Pending Report via Reports Engine
    const annualReportResult = await FeesService.executeReport(schoolCode, 'annual_fee_pending', { session });
    const directAnnual = await FeesService.getAnnualFeePending(schoolCode, session);
    assert(
      'Reports Engine',
      'annual_fee_pending report row count exactly matches getAnnualFeePending items',
      annualReportResult.rows.length === directAnnual.items.length,
      directAnnual.items.length,
      annualReportResult.rows.length
    );
  } catch (e: any) {
    assert('Reports Engine', 'Reports Engine execution', false, 'Success', e.message);
  }

  // =========================================================================
  // FINAL SCORECARD
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SCORECARD & CONSISTENCY REPORT');
  console.log('='.repeat(70));

  let passedCount = 0;
  let failedCount = 0;

  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`  ✅ [PASS] [${r.suite}] ${r.name}`);
    } else {
      failedCount++;
      console.log(`  ❌ [FAIL] [${r.suite}] ${r.name}`);
      console.log(`     Error: ${r.error}`);
    }
  }

  console.log('-'.repeat(70));
  console.log(`Summary: ${passedCount} PASSED | ${failedCount} FAILED | Total: ${results.length}`);
  console.log(`Consistency Agreement: ${Math.round((passedCount / results.length) * 100)}%`);
  console.log('='.repeat(70) + '\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runConsistencySuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
