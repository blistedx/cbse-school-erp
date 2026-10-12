#!/usr/bin/env node
/*! Giterp Fee Master — Verification Script v1.0.0 */
/**
 * verify-ledger-migration.ts
 * 
 * Compares old computed balance (from FeeInvoice) vs new ledger balance
 * for every student. Reports discrepancies.
 *
 * Run: npx tsx scripts/verify-ledger-migration.ts
 */

import 'dotenv/config';

async function main() {
  const { MongoClient } = await import('mongodb');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  console.log('🔍 Fee Ledger Migration Verification');
  console.log('━'.repeat(60));

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const studentsCol = db.collection('students');
  const invoicesCol = db.collection('fee_invoices');
  const ledgerCol = db.collection('fee_ledger');

  // Get all active students
  const students = await studentsCol.find({ status: 'ACTIVE' }).toArray();
  console.log(`📋 Checking ${students.length} active students...\n`);

  let matchCount = 0;
  let mismatchCount = 0;
  let noDataCount = 0;
  const mismatches: any[] = [];

  for (const student of students) {
    const studentId = student.id || student._id?.toString();
    const schoolId = student.school_id || 'DPS2026';
    const session = student.academic_session || '2026-27';
    const admNo = (student.admission_no || '').toLowerCase().trim();

    // ─── OLD SYSTEM: compute from invoices ───
    const invoices = await invoicesCol.find({
      $or: [
        { student_id: studentId },
        ...(admNo ? [{ admission_no: { $regex: new RegExp(`^${admNo}$`, 'i') } }] : []),
      ],
      school_id: schoolId,
    }).toArray();

    let oldDemand = 0;
    let oldPaid = 0;
    let oldConcession = 0;

    for (const inv of invoices) {
      const amount = Number(inv.amount) || 0;
      oldDemand += amount;
      const paid = typeof inv.paid_amount === 'number'
        ? inv.paid_amount
        : (inv.status === 'PAID' ? amount : 0);
      oldPaid += paid;
      oldConcession += Number(inv.concession_amount) || 0;
    }
    const oldBalance = Math.max(0, oldDemand - oldPaid - oldConcession);

    // ─── NEW SYSTEM: compute from ledger ───
    const ledgerLines = await ledgerCol.find({
      school_id: schoolId,
      academic_session: session,
      student_id: studentId,
      is_cancelled: { $ne: true },
    }).toArray();

    let newDemand = 0;
    let newPaid = 0;
    let newDiscount = 0;
    let newWaiver = 0;
    let newRefund = 0;

    for (const line of ledgerLines) {
      const amt = Number(line.amount) || 0;
      switch (line.line_type) {
        case 'DEMAND':
        case 'FINE':
        case 'OPENING_BALANCE':
          newDemand += amt;
          break;
        case 'PAYMENT':
          newPaid += amt;
          break;
        case 'DISCOUNT':
          newDiscount += amt;
          break;
        case 'WAIVER':
          newWaiver += amt;
          break;
        case 'REFUND':
          newRefund += amt;
          break;
        case 'ADJUSTMENT':
          if (line.adjustment_direction === 'CREDIT') newPaid += amt;
          else newDemand += amt;
          break;
      }
    }
    // Ledger is in paise; old is in rupees. Convert old to paise for comparison.
    const oldBalancePaise = Math.round(oldBalance * 100);
    const newBalance = Math.max(0, newDemand - newPaid - newDiscount - newWaiver + newRefund);

    if (invoices.length === 0 && ledgerLines.length === 0) {
      noDataCount++;
      continue;
    }

    // Compare (allow ₹1 / 100 paise tolerance for rounding)
    const diff = Math.abs(oldBalancePaise - newBalance);
    if (diff <= 100) {
      matchCount++;
    } else {
      mismatchCount++;
      mismatches.push({
        student: student.full_name,
        admNo: student.admission_no || studentId,
        class: student.class_name,
        oldBalance: `₹${oldBalance.toLocaleString('en-IN')}`,
        newBalance: `₹${(newBalance / 100).toLocaleString('en-IN')}`,
        diff: `₹${(diff / 100).toLocaleString('en-IN')}`,
        invoiceCount: invoices.length,
        ledgerLineCount: ledgerLines.length,
      });
    }
  }

  // Report
  console.log('━'.repeat(60));
  console.log('📊 Verification Results:');
  console.log(`   ✅ Matching: ${matchCount} students`);
  console.log(`   ❌ Mismatches: ${mismatchCount} students`);
  console.log(`   ⏭️  No data: ${noDataCount} students`);
  console.log('━'.repeat(60));

  if (mismatches.length > 0) {
    console.log('\n❌ MISMATCHED STUDENTS:');
    console.log('─'.repeat(100));
    console.log(
      'Student'.padEnd(25) +
      'Adm No'.padEnd(12) +
      'Class'.padEnd(15) +
      'Old Balance'.padEnd(15) +
      'New Balance'.padEnd(15) +
      'Diff'.padEnd(12) +
      'Invoices'.padEnd(10) +
      'Lines'
    );
    console.log('─'.repeat(100));
    for (const m of mismatches) {
      console.log(
        String(m.student).padEnd(25) +
        String(m.admNo).padEnd(12) +
        String(m.class).padEnd(15) +
        String(m.oldBalance).padEnd(15) +
        String(m.newBalance).padEnd(15) +
        String(m.diff).padEnd(12) +
        String(m.invoiceCount).padEnd(10) +
        String(m.ledgerLineCount)
      );
    }
    console.log('─'.repeat(100));
  } else {
    console.log('\n🎉 All student balances match between old and new systems!');
  }

  await client.close();
}

main().catch(err => {
  console.error('💥 Verification failed:', err);
  process.exit(1);
});
