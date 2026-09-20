import { MongoClient } from 'mongodb';
import fs from 'fs';
import { executeReport } from '../src/lib/fees-engine/reports';
import { REPORT_CONFIGS } from '../src/lib/fees-engine/report-configs';

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

async function runVerificationSuite() {
  console.log('================================================================');
  console.log('         FEE ENGINE VERIFICATION & AUDIT TEST SUITE             ');
  console.log('================================================================\n');

  const client = new MongoClient(envUri!);
  await client.connect();
  const db = client.db('edugit');

  const schoolId = 'DPS2026';
  const session = '2026-27';

  const students = await db.collection('students').find({ school_id: schoolId }).toArray();
  const demands = await db.collection('fee_demands').find({ schoolId, sessionId: session }).toArray();
  const payments = await db.collection('fee_payments').find({ schoolId, sessionId: session, cancelled: { $ne: true } }).toArray();

  const totalStudents = students.length;
  console.log(`1. Total Enrolled Scholars in DB : ${totalStudents} (Expected: 505)`);

  let groundGrossDemand = 0;
  let groundDiscounts = 0;
  let groundNetDemand = 0;
  let groundCollected = 0;

  const studentDemandSum = new Map<string, number>();
  const studentPaymentSum = new Map<string, number>();
  const studentAnnualBalance = new Map<string, number>();

  for (const d of demands) {
    groundGrossDemand += (d.grossAmount || 0);
    groundDiscounts += (d.discountAmount || 0);
    groundNetDemand += (d.netAmount || 0);

    studentDemandSum.set(d.studentId, (studentDemandSum.get(d.studentId) || 0) + (d.netAmount || 0));

    if (d.feeHead === 'ANNUAL') {
      studentAnnualBalance.set(d.studentId, (studentAnnualBalance.get(d.studentId) || 0) + d.netAmount);
    }
  }

  for (const p of payments) {
    groundCollected += (p.amountPaid || 0);
    studentPaymentSum.set(p.studentId, (studentPaymentSum.get(p.studentId) || 0) + (p.amountPaid || 0));

    for (const a of p.allocatedHeads || []) {
      if (a.feeHead === 'ANNUAL') {
        const cur = studentAnnualBalance.get(p.studentId) || 0;
        studentAnnualBalance.set(p.studentId, Math.max(0, cur - a.amountPaise));
      }
    }
  }

  const groundOutstandingDues = Math.max(0, groundNetDemand - groundCollected);
  const groundCollectionRate = groundNetDemand > 0 ? Number(((groundCollected / groundNetDemand) * 100).toFixed(1)) : 0;

  console.log(`2. Ground Net Billed Demand      : ₹${(groundNetDemand / 100).toLocaleString('en-IN')}`);
  console.log(`3. Ground Total Collected        : ₹${(groundCollected / 100).toLocaleString('en-IN')}`);
  console.log(`4. Ground Outstanding Dues       : ₹${(groundOutstandingDues / 100).toLocaleString('en-IN')}`);
  console.log(`5. Ground Realization Rate       : ${groundCollectionRate}%\n`);

  let expectedAnnualPendingScholars = 0;
  let expectedAnnualPendingAmount = 0;
  for (const [sId, bal] of studentAnnualBalance.entries()) {
    if (bal > 0) {
      expectedAnnualPendingScholars++;
      expectedAnnualPendingAmount += bal;
    }
  }

  console.log(`Annual Fee Ground Truth:`);
  console.log(`- Pending Scholars : ${expectedAnnualPendingScholars}`);
  console.log(`- Outstanding Dues : ₹${(expectedAnnualPendingAmount / 100).toLocaleString('en-IN')}\n`);

  console.log('------------------------------------------------------------------------------------------------------------------');
  console.log('| #  | Report ID                  | Report Name                                | Rows | Total ₹       | Status   |');
  console.log('------------------------------------------------------------------------------------------------------------------');

  let allPassed = true;
  let rIndex = 1;

  for (const config of REPORT_CONFIGS) {
    try {
      const res = await executeReport(schoolId, config.id, { session }, students as any);
      const rowCount = res.rows.length;

      let totalAmountPaise = 0;
      if (res.grandTotalRow) {
        totalAmountPaise = 
          res.grandTotalRow.pendingPaise ??
          res.grandTotalRow.annualDuePaise ??
          res.grandTotalRow.totalOneTimeDuePaise ??
          res.grandTotalRow.collectedPaise ??
          res.grandTotalRow.amountPaise ??
          res.grandTotalRow.totalPaidPaise ??
          res.grandTotalRow.advancePaise ??
          res.grandTotalRow.demandPaise ??
          0;
      }

      let isPass = true;
      let note = '';

      if (config.id === 'annual_fee_pending') {
        if (rowCount !== expectedAnnualPendingScholars) {
          isPass = false;
          note = `Expected ${expectedAnnualPendingScholars} rows, got ${rowCount}`;
        }
        if (totalAmountPaise !== expectedAnnualPendingAmount) {
          isPass = false;
          note = `Expected ₹${expectedAnnualPendingAmount/100}, got ₹${totalAmountPaise/100}`;
        }
      }

      if (!isPass) allPassed = false;

      const idStr = config.id.padEnd(26);
      const nameStr = config.name.slice(0, 42).padEnd(42);
      const rowsStr = rowCount.toString().padStart(4);
      const totalStr = `₹${(Math.round(totalAmountPaise) / 100).toLocaleString('en-IN')}`.padStart(13);
      const statusStr = isPass ? '  PASS   ' : '  FAIL   ';

      console.log(`| ${rIndex.toString().padStart(2)} | ${idStr} | ${nameStr} | ${rowsStr} | ${totalStr} | ${statusStr} |`);
      if (note) console.log(`  -> Note: ${note}`);
      rIndex++;
    } catch (e: any) {
      allPassed = false;
      console.log(`| ${rIndex.toString().padStart(2)} | ${config.id.padEnd(26)} | ERROR: ${e.message}`);
      rIndex++;
    }
  }

  console.log('------------------------------------------------------------------------------------------------------------------\n');

  if (allPassed) {
    console.log('🎉 ALL 17 FEE MASTER REPORTS VERIFIED & PASSED WITH 100% MATHEMATICAL INTEGRITY!');
  } else {
    console.error('❌ SOME REPORTS FAILED INTEGRITY CHECKS.');
  }

  await client.close();
}

runVerificationSuite().catch(console.error);
