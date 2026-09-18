#!/usr/bin/env node
/*! Giterp Fee Master — Migration Script v1.0.0 */
/**
 * migrate-invoices-to-ledger.ts
 * 
 * One-time migration: converts existing FeeInvoice / FeePaymentRecord data
 * into immutable ledger lines.
 *
 * Run: npx tsx scripts/migrate-invoices-to-ledger.ts
 *
 * This script:
 * 1. Reads all fee_invoices from MongoDB
 * 2. For each invoice, creates DEMAND + PAYMENT + DISCOUNT/WAIVER lines
 * 3. Writes to fee_ledger collection
 * 4. Reports stats
 *
 * SAFE: Does not modify or delete original fee_invoices.
 * IDEMPOTENT: Checks for existing migrated lines before creating.
 */

import 'dotenv/config';

async function main() {
  // Dynamic imports for ESM compatibility
  const { MongoClient } = await import('mongodb');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in environment');
    process.exit(1);
  }

  console.log('🔄 Fee Master Migration: FeeInvoice → Fee Ledger');
  console.log('━'.repeat(60));

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const invoicesCol = db.collection('fee_invoices');
  const ledgerCol = db.collection('fee_ledger');

  // Check if migration already ran
  const existingMigrated = await ledgerCol.countDocuments({ remarks: /^MIGRATED:/i });
  if (existingMigrated > 0) {
    console.log(`⚠️  Found ${existingMigrated} previously migrated lines.`);
    console.log('   Re-running will skip already migrated invoices.\n');
  }

  // Get all invoices
  const invoices = await invoicesCol.find({}).toArray();
  console.log(`📋 Found ${invoices.length} fee invoices to migrate\n`);

  if (invoices.length === 0) {
    console.log('✅ No invoices to migrate. Done.');
    await client.close();
    return;
  }

  let demandCount = 0;
  let paymentCount = 0;
  let discountCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const BATCH_SIZE = 100;
  const allLines: any[] = [];

  for (const inv of invoices) {
    try {
      const invId = inv.id || inv._id?.toString();
      
      // Check if already migrated
      const alreadyMigrated = await ledgerCol.findOne({
        remarks: `MIGRATED:${invId}`,
        school_id: inv.school_id,
      });
      if (alreadyMigrated) {
        skippedCount++;
        continue;
      }

      const schoolId = inv.school_id || 'DPS2026';
      const session = inv.academic_session || '2026-27';
      const studentId = inv.student_id || '';
      const className = inv.class_name || '';
      const section = (className.match(/[-–]\s*([A-Z])/)?.[1]) || 'A';
      const admissionNo = inv.admission_no || '';
      const txnDate = inv.paid_date || inv.due_date || new Date().toISOString().split('T')[0];
      const dueDate = inv.due_date || txnDate;
      const now = new Date().toISOString();

      // Parse month from invoice
      const monthStr = (inv.month || '').toUpperCase().trim();
      const monthMap: Record<string, string> = {
        'APRIL': 'APR', 'APR': 'APR',
        'MAY': 'MAY',
        'JUNE': 'JUN', 'JUN': 'JUN',
        'JULY': 'JUL', 'JUL': 'JUL',
        'AUGUST': 'AUG', 'AUG': 'AUG',
        'SEPTEMBER': 'SEP', 'SEP': 'SEP',
        'OCTOBER': 'OCT', 'OCT': 'OCT',
        'NOVEMBER': 'NOV', 'NOV': 'NOV',
        'DECEMBER': 'DEC', 'DEC': 'DEC',
        'JANUARY': 'JAN', 'JAN': 'JAN',
        'FEBRUARY': 'FEB', 'FEB': 'FEB',
        'MARCH': 'MAR', 'MAR': 'MAR',
      };
      // Extract first word that matches a month
      let month: string | null = null;
      for (const [key, val] of Object.entries(monthMap)) {
        if (monthStr.includes(key)) { month = val; break; }
      }

      const amount = Math.round((Number(inv.amount) || 0) * 100); // Convert rupees → paise
      const paidAmount = Math.round((Number(inv.paid_amount) || (inv.status === 'PAID' ? Number(inv.amount) || 0 : 0)) * 100);
      const concessionAmount = Math.round((Number(inv.concession_amount) || 0) * 100);

      // 1. DEMAND line — one per fee head present in the invoice
      const feeBreakdown: { head: string; amount: number }[] = [];
      if (inv.tuition_fee && Number(inv.tuition_fee) > 0) feeBreakdown.push({ head: 'TUITION', amount: Math.round(Number(inv.tuition_fee) * 100) });
      if (inv.annual_fee && Number(inv.annual_fee) > 0) feeBreakdown.push({ head: 'ACTIVITY', amount: Math.round(Number(inv.annual_fee) * 100) });
      if (inv.transport_fee && Number(inv.transport_fee) > 0) feeBreakdown.push({ head: 'TRANSPORT', amount: Math.round(Number(inv.transport_fee) * 100) });
      if (inv.exam_fee && Number(inv.exam_fee) > 0) feeBreakdown.push({ head: 'EXAM', amount: Math.round(Number(inv.exam_fee) * 100) });
      if (inv.admission_fee && Number(inv.admission_fee) > 0) feeBreakdown.push({ head: 'ADMISSION', amount: Math.round(Number(inv.admission_fee) * 100) });
      if (inv.hostel_fee && Number(inv.hostel_fee) > 0) feeBreakdown.push({ head: 'HOSTEL', amount: Math.round(Number(inv.hostel_fee) * 100) });
      if (inv.hostel_security && Number(inv.hostel_security) > 0) feeBreakdown.push({ head: 'SECURITY_DEPOSIT', amount: Math.round(Number(inv.hostel_security) * 100) });

      // If no breakdown available, create single MISC demand
      if (feeBreakdown.length === 0 && amount > 0) {
        feeBreakdown.push({ head: 'TUITION', amount });
      }

      // Create DEMAND lines per head
      for (const fb of feeBreakdown) {
        allLines.push({
          id: `FLL-MIG-${invId}-D-${fb.head}`,
          school_id: schoolId,
          academic_session: session,
          student_id: studentId,
          class_name: className,
          section,
          admission_no: admissionNo,
          line_type: 'DEMAND',
          fee_head: fb.head,
          month: (fb.head === 'ADMISSION' || fb.head === 'ACTIVITY' || fb.head === 'SECURITY_DEPOSIT') ? null : month,
          amount: fb.amount,
          txn_date: dueDate,
          due_date: dueDate,
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
          remarks: `MIGRATED:${invId}`,
          created_at: now,
        });
        demandCount++;
      }

      // 2. PAYMENT line (if any payment was made)
      if (paidAmount > 0) {
        // Map payment mode
        const rawMode = (inv.payment_mode || '').toUpperCase();
        let paymentMode: string | null = null;
        if (rawMode.includes('CASH')) paymentMode = 'CASH';
        else if (rawMode.includes('UPI')) paymentMode = 'UPI';
        else if (rawMode.includes('CARD')) paymentMode = 'CARD';
        else if (rawMode.includes('CHEQUE') || rawMode.includes('CHECK')) paymentMode = 'CHEQUE';
        else if (rawMode.includes('NEFT') || rawMode.includes('RTGS') || rawMode.includes('IMPS')) paymentMode = 'NEFT';
        else if (rawMode.includes('ONLINE') || rawMode.includes('NET')) paymentMode = 'ONLINE';
        else paymentMode = 'CASH';

        allLines.push({
          id: `FLL-MIG-${invId}-P`,
          school_id: schoolId,
          academic_session: session,
          student_id: studentId,
          class_name: className,
          section,
          admission_no: admissionNo,
          line_type: 'PAYMENT',
          fee_head: feeBreakdown.length === 1 ? feeBreakdown[0].head : 'TUITION',
          month,
          amount: paidAmount,
          txn_date: txnDate,
          due_date: null,
          payment_mode: paymentMode,
          receipt_no: inv.invoice_no || `MIG-REC-${invId}`,
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
          remarks: `MIGRATED:${invId}`,
          created_at: now,
        });
        paymentCount++;

        // Also migrate payment_history if present
        if (Array.isArray(inv.payment_history) && inv.payment_history.length > 1) {
          // Already counted the main payment; only add subsequent history entries
          for (let i = 1; i < inv.payment_history.length; i++) {
            const ph = inv.payment_history[i];
            const phAmount = Math.round((Number(ph.amount) || 0) * 100);
            if (phAmount > 0) {
              allLines.push({
                id: `FLL-MIG-${invId}-PH-${i}`,
                school_id: schoolId,
                academic_session: session,
                student_id: studentId,
                class_name: className,
                section,
                admission_no: admissionNo,
                line_type: 'PAYMENT',
                fee_head: feeBreakdown.length === 1 ? feeBreakdown[0].head : 'TUITION',
                month,
                amount: phAmount,
                txn_date: ph.paid_at ? ph.paid_at.split('T')[0] : txnDate,
                due_date: null,
                payment_mode: (ph.payment_mode || 'CASH').toUpperCase().includes('UPI') ? 'UPI' : 'CASH',
                receipt_no: ph.receipt_no || null,
                cheque_no: null,
                txn_ref: null,
                concession_type: null,
                collected_by: ph.collected_by || null,
                approved_by: null,
                is_cancelled: false,
                cancelled_reason: null,
                cancelled_by: null,
                cancelled_at: null,
                linked_line_id: `FLL-MIG-${invId}-P`,
                remarks: `MIGRATED:${invId}:PH${i}`,
                created_at: now,
              });
              paymentCount++;
            }
          }
        }
      }

      // 3. DISCOUNT/WAIVER line (if concession was applied)
      if (concessionAmount > 0) {
        const concessionReason = (inv.concession_reason || '').toLowerCase();
        let concessionType: string | null = null;
        if (concessionReason.includes('sibling')) concessionType = 'SIBLING';
        else if (concessionReason.includes('rte')) concessionType = 'RTE';
        else if (concessionReason.includes('staff')) concessionType = 'STAFF_WARD';
        else if (concessionReason.includes('merit')) concessionType = 'MERIT';
        else if (concessionReason.includes('sport')) concessionType = 'SPORTS';
        else if (concessionReason.includes('single girl') || concessionReason.includes('girl child')) concessionType = 'SINGLE_GIRL_CHILD';
        else concessionType = 'PRINCIPAL_WAIVER';

        const lineType = inv.status === 'WAIVED' ? 'WAIVER' : 'DISCOUNT';

        allLines.push({
          id: `FLL-MIG-${invId}-C`,
          school_id: schoolId,
          academic_session: session,
          student_id: studentId,
          class_name: className,
          section,
          admission_no: admissionNo,
          line_type: lineType,
          fee_head: feeBreakdown.length === 1 ? feeBreakdown[0].head : 'TUITION',
          month,
          amount: concessionAmount,
          txn_date: inv.waived_date || txnDate,
          due_date: null,
          payment_mode: null,
          receipt_no: null,
          cheque_no: null,
          txn_ref: null,
          concession_type: concessionType,
          collected_by: null,
          approved_by: inv.waived_by || null,
          is_cancelled: false,
          cancelled_reason: null,
          cancelled_by: null,
          cancelled_at: null,
          linked_line_id: null,
          remarks: `MIGRATED:${invId}:${inv.concession_reason || 'Concession'}`,
          created_at: now,
        });
        discountCount++;
      }

    } catch (err: any) {
      console.error(`❌ Error migrating invoice ${inv.id || inv._id}:`, err.message);
      errorCount++;
    }
  }

  // Batch insert
  if (allLines.length > 0) {
    console.log(`\n📝 Inserting ${allLines.length} ledger lines in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < allLines.length; i += BATCH_SIZE) {
      const batch = allLines.slice(i, i + BATCH_SIZE);
      try {
        await ledgerCol.insertMany(batch, { ordered: false });
        process.stdout.write(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allLines.length / BATCH_SIZE)} ✓\n`);
      } catch (err: any) {
        // Handle duplicate key errors gracefully (idempotent re-runs)
        if (err.code === 11000) {
          console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: Some duplicates skipped (idempotent)`);
        } else {
          console.error(`   Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, err.message);
          errorCount++;
        }
      }
    }
  }

  // Create indexes
  console.log('\n📊 Ensuring indexes...');
  await ledgerCol.createIndex({ school_id: 1, academic_session: 1, student_id: 1 });
  await ledgerCol.createIndex({ school_id: 1, txn_date: 1 });
  await ledgerCol.createIndex({ school_id: 1, fee_head: 1, month: 1 });
  await ledgerCol.createIndex({ school_id: 1, receipt_no: 1 }, { sparse: true });
  await ledgerCol.createIndex({ school_id: 1, line_type: 1, is_cancelled: 1 });
  console.log('   Indexes created ✓');

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   📋 Invoices processed: ${invoices.length}`);
  console.log(`   ➕ DEMAND lines created: ${demandCount}`);
  console.log(`   💰 PAYMENT lines created: ${paymentCount}`);
  console.log(`   🏷️  DISCOUNT/WAIVER lines created: ${discountCount}`);
  console.log(`   ⏭️  Skipped (already migrated): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📦 Total ledger lines: ${allLines.length}`);
  console.log('━'.repeat(60));

  await client.close();
  console.log('\n✅ Migration complete!');
}

main().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
