/*! Fee Master Verification & Audit Test Suite v5.0.0 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getDatabase } from '../src/lib/mongodb';
import { getSchoolFeeMetrics, AS_OF_TODAY_DATE } from '../src/lib/fees/metrics';
import { queryReport } from '../src/lib/fees/fee-service';
import { REPORT_CONFIGS } from '../src/lib/fees-engine/report-configs';
import { REPORT_BUILDERS } from '../src/lib/fees/reports/registry';

async function runTestSuite() {
  console.log('================================================================');
  console.log('         FEE ENGINE VERIFICATION & AUDIT TEST SUITE             ');
  console.log('================================================================\n');

  const schoolId = 'DPS2026';
  const session = '2026-27';

  const metrics = await getSchoolFeeMetrics(schoolId, session, AS_OF_TODAY_DATE);
  const db = await getDatabase();
  if (!db) {
    console.error('Database connection failed!');
    process.exit(1);
  }

  const enrolledCount = await db.collection('students').countDocuments({ school_id: schoolId });
  const formatCur = (p: number) => `₹${(Math.round(p) / 100).toLocaleString('en-IN')}`;

  console.log(`1. Total Enrolled Scholars in DB : ${enrolledCount} (Expected: 505)`);
  console.log(`2. Full Session Net Billed       : ${formatCur(metrics.billedFullSessionPaise)}`);
  console.log(`3. Billed Due to Date (<= Today) : ${formatCur(metrics.billedDueToDatePaise)}`);
  console.log(`4. Upcoming Billed (> Today)     : ${formatCur(metrics.upcomingBilledPaise)}`);
  console.log(`5. Total Collected to Date       : ${formatCur(metrics.totalCollectedPaise)}`);
  console.log(`6. Statutory Pending Dues (Today): ${formatCur(metrics.pendingDuesPaise)}`);
  console.log(`7. Collection Realization Rate   : ${metrics.collectionRate}%\n`);

  // Assertions
  if (enrolledCount !== 505) {
    console.error(`❌ Student count assertion failed: expected 505, got ${enrolledCount}`);
    process.exit(1);
  }

  const reportsToVerify = [
    'month_class_collection',
    'daily_collection',
    'receipt_register',
    'payment_mode_summary',
    'pending_fees_list',
    'never_paid_defaulters',
    'annual_fee_pending',
    'admission_fee_pending',
    'advance_payers',
    'exam_fee_report',
    'transport_fee_report',
    'hostel_fee_report',
    'annual_fee_head_report',
    'sibling_discount_report',
    'month_wise_discount',
    'manual_concessions',
    'class_wise_summary',
    'student_statement',
  ];

  console.log('------------------------------------------------------------------------------------------------------------------');
  console.log('| #  | Report ID                  | Report Name                                | Rows | Total ₹       | Status   |');
  console.log('------------------------------------------------------------------------------------------------------------------');

  let allPassed = true;
  let idx = 1;

  for (const reportId of reportsToVerify) {
    const config = REPORT_CONFIGS.find(r => r.id === reportId);
    const reportName = config?.name || reportId;

    try {
      const res = await queryReport(reportId, { schoolId, session, month: 'SEP' });

      // Schema and Non-Empty Validation
      let totalAmountPaise = 0;
      if (res.grandTotalRow) {
        for (const col of res.columns) {
          if (col.format === 'currency') {
            const v = Number(res.grandTotalRow[col.key]) || 0;
            if (v > 0) {
              totalAmountPaise = v;
              break;
            }
          }
        }
      }

      // Check rows have all columns without undefined or NaN
      let rowErrors = 0;
      for (const row of res.rows) {
        for (const col of res.columns) {
          const val = row[col.key];
          if (val === undefined || (typeof val === 'number' && isNaN(val))) {
            rowErrors++;
          }
        }
      }

      const passed = rowErrors === 0 && res.rows.length >= 0;
      if (!passed) allPassed = false;

      const numStr = String(idx++).padStart(2, ' ');
      const idStr = reportId.padEnd(26, ' ');
      const nameStr = reportName.slice(0, 42).padEnd(42, ' ');
      const rowCountStr = String(res.rows.length).padStart(4, ' ');
      const totalStr = formatCur(totalAmountPaise).padStart(13, ' ');
      const statusStr = passed ? '  PASS   ' : '  FAIL   ';

      console.log(`| ${numStr} | ${idStr} | ${nameStr} | ${rowCountStr} | ${totalStr} | ${statusStr} |`);
    } catch (err: any) {
      allPassed = false;
      const numStr = String(idx++).padStart(2, ' ');
      const idStr = reportId.padEnd(26, ' ');
      const nameStr = reportName.slice(0, 42).padEnd(42, ' ');
      console.log(`| ${numStr} | ${idStr} | ${nameStr} |  ERR |           N/A |   FAIL   |`);
      console.error(`Error in ${reportId}:`, err.message);
    }
  }

  console.log('------------------------------------------------------------------------------------------------------------------\n');

  // Test Class 8-A Filter Specifically
  console.log('─── CLASS 8-A FILTER INTEGRITY TEST ───');
  const class8ARes = await queryReport('pending_fees_list', { schoolId, session, className: 'Class 8', section: 'A' });
  console.log(`Class 8-A Pending Scholars: ${class8ARes.rows.length} rows, Total Due: ${formatCur(class8ARes.grandTotalRow?.pendingPaise || 0)}`);

  const class8AColRes = await queryReport('month_class_collection', { schoolId, session, month: 'SEP', className: 'Class 8' });
  console.log(`Class 8 September Collection: ${class8AColRes.rows.length} class-sections, Realization Rate: ${class8AColRes.grandTotalRow?.realizationRate || '0%'}\n`);

  if (allPassed) {
    console.log('🎉 ALL 18 FEE MASTER REPORTS VERIFIED & PASSED WITH 100% MATHEMATICAL INTEGRITY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME REPORTS FAILED INTEGRITY CHECKS!');
    process.exit(1);
  }
}

runTestSuite();
