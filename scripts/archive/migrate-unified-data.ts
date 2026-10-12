/*! EduSuite Unified Data Migration Script v1.0.0
 * Run with: npx tsx scripts/migrate-unified-data.ts [--apply | --dry-run]
 */
import fs from 'fs';
import path from 'path';
import { getDatabase, isMongoConfigured, sanitizeDocNoBinary } from '../src/lib/mongodb';
import { AttendanceService } from '../src/lib/services/attendance.service';
import { FeesService } from '../src/lib/services/fees.service';
import { Database } from '../src/lib/db';

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply || process.argv.includes('--dry-run');

async function runMigration() {
  console.log('='.repeat(70));
  console.log(`🚀 EDU-SUITE PHASE 3: UNIFIED ATTENDANCE & FEES DATA MIGRATION`);
  console.log(`Mode: ${isApply ? '🔥 LIVE APPLY' : '🛡️ DRY RUN (Read-Only Preview)'}`);
  console.log('='.repeat(70));

  const db = await getDatabase();
  console.log(`Connected to Database: ${isMongoConfigured() && db ? 'MongoDB Atlas' : 'Local File Store'}`);

  // 1. Create Indexes
  console.log('\n[Step 1/4] Ensuring canonical indexes for Attendance and Fees...');
  if (db) {
    try {
      await AttendanceService.ensureAttendanceIndexes();
      console.log('  ✅ Attendance indexes ensured');
      await FeesService.ensureFeeIndexes();
      console.log('  ✅ Fees & Ledger indexes ensured');
    } catch (e: any) {
      console.warn('  ⚠️ Index creation note:', e.message);
    }
  }

  // 2. Fetch Schools
  const schools = await Database.getSchools();
  console.log(`\n[Step 2/4] Found ${schools.length} registered schools.`);

  const backupData: Record<string, any> = {
    timestamp: new Date().toISOString(),
    mode: isApply ? 'APPLY' : 'DRY_RUN',
    schools: []
  };

  for (const school of schools) {
    const schoolCode = school.school_code || school.id;
    const schoolName = (school as any).school_name || (school as any).name || schoolCode;
    console.log(`\n🏫 Processing School: ${schoolName} (${schoolCode})`);

    // A. Attendance Audit & Cleanup
    console.log('  📊 Checking Attendance Records...');
    const attendanceRecords = await AttendanceService.getAllAttendanceRecords(schoolCode);
    console.log(`    Total Attendance Records: ${attendanceRecords.length}`);

    // Check for duplicate attendance entries
    const seen = new Set<string>();
    const duplicateIds: string[] = [];
    for (const rec of attendanceRecords) {
      const key = `${rec.date}_${rec.class_name}_${rec.section || 'A'}`;
      if (seen.has(key)) {
        duplicateIds.push(rec.id);
      } else {
        seen.add(key);
      }
    }
    console.log(`    Duplicate Attendance Entries Found: ${duplicateIds.length}`);

    if (isApply && duplicateIds.length > 0 && db) {
      const delRes = await db.collection('attendance').deleteMany({
        school_id: schoolCode,
        id: { $in: duplicateIds }
      });
      console.log(`    🗑️ Removed ${delRes.deletedCount} duplicate attendance entries`);
    }

    // B. Fees & Ledger Validation
    console.log('  💰 Checking Fees & Ledger Records...');
    const students = await Database.getStudents(schoolCode);
    console.log(`    Total Students: ${students.length}`);

    let missingDemandCount = 0;
    let syncedStudentsCount = 0;

    for (const student of students) {
      if (student.status === 'INACTIVE' || student.status === 'ALUMNI') continue;

      const { summary } = await FeesService.getStudentFeeStatus(schoolCode, student.id, '2026-27');
      if (summary.totalDemand === 0) {
        missingDemandCount++;
      }

      // Check sync discrepancy
      const expectedStatus = summary.status === 'ADVANCE' || summary.status === 'WAIVED' ? 'PAID' : summary.status;
      const currentPaid = (student as any).fee_paid ?? 0;
      if (student.fee_status !== expectedStatus || currentPaid !== Math.round(summary.totalPaid / 100)) {
        syncedStudentsCount++;
        if (isApply) {
          student.fee_status = expectedStatus;
          (student as any).fee_paid = Math.round(summary.totalPaid / 100);
          (student as any).fee_balance = Math.round(summary.balance / 100);
          (student as any).fee_structure_amount = Math.round(summary.totalDemand / 100);

          if (db) {
            await db.collection('students').updateOne(
              { id: student.id },
              {
                $set: {
                  fee_status: student.fee_status,
                  fee_paid: (student as any).fee_paid,
                  fee_balance: (student as any).fee_balance,
                  fee_structure_amount: (student as any).fee_structure_amount,
                }
              }
            );
          }
        }
      }
    }

    console.log(`    Students with Missing Demand: ${missingDemandCount}`);
    console.log(`    Students Requiring Fee Status Sync: ${syncedStudentsCount}`);

    // C. Annual Fee Report Verification
    const annualFeeReport = await FeesService.getAnnualFeePending(schoolCode, '2026-27');
    console.log(`    Annual Fee Pending Students Count: ${annualFeeReport.totalPendingCount} (Dues: ₹${(annualFeeReport.totalDuePaise / 100).toLocaleString('en-IN')})`);

    // D. Overview Summary Verification
    const overviewSummary = await FeesService.getSchoolFeeSummary(schoolCode, '2026-27');
    console.log(`    Total Billed: ₹${(overviewSummary.totalBilledPaise / 100).toLocaleString('en-IN')}`);
    console.log(`    Total Collected: ₹${(overviewSummary.totalCollectedPaise / 100).toLocaleString('en-IN')}`);
    console.log(`    Total Outstanding: ₹${(overviewSummary.totalPendingPaise / 100).toLocaleString('en-IN')}`);
    console.log(`    Collection Rate: ${overviewSummary.collectionPercentage}%`);

    backupData.schools.push({
      schoolCode,
      name: schoolName,
      studentCount: students.length,
      attendanceRecordCount: attendanceRecords.length,
      duplicatesRemoved: duplicateIds.length,
      studentsSynced: syncedStudentsCount,
      annualFeePendingCount: annualFeeReport.totalPendingCount,
      totalBilledPaise: overviewSummary.totalBilledPaise,
      totalCollectedPaise: overviewSummary.totalCollectedPaise,
      totalPendingPaise: overviewSummary.totalPendingPaise
    });
  }

  // 3. Save Migration Snapshot Backup
  console.log('\n[Step 3/4] Writing Migration Snapshot...');
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const backupFile = path.join(backupsDir, `unified-migration-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`  📁 Saved snapshot to: ${backupFile}`);

  console.log('\n[Step 4/4] Migration Summary:');
  console.log(`  Status: ${isApply ? 'SUCCESSFULLY APPLIED ✅' : 'DRY RUN COMPLETED (No changes written) 🛡️'}`);
  if (!isApply) {
    console.log('\n👉 To apply changes live, execute:');
    console.log('   npx tsx scripts/migrate-unified-data.ts --apply\n');
  }
}

runMigration()
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
