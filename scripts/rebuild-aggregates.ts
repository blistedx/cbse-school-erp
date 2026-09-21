/*! EduSuite Aggregate Rebuilder & Synchronization Script */
import { Database } from '../src/lib/db';
import { AggregatesService } from '../src/lib/services/aggregates.service';
import { AttendanceService } from '../src/lib/services/attendance.service';
import { getDatabase, isMongoConfigured } from '../src/lib/mongodb';

async function main() {
  console.log('='.repeat(70));
  console.log('⚡ EDU-SUITE PRE-AGGREGATED SUMMARY REBUILDER');
  console.log('='.repeat(70));

  const db = await getDatabase();
  console.log(`Connected to Database: ${isMongoConfigured() && db ? 'MongoDB Atlas' : 'Local File Store'}`);

  await AggregatesService.ensureIndexes();
  console.log('✅ Aggregates indexes verified.');

  const schools = await Database.getSchools();
  console.log(`Found ${schools.length} school(s).\n`);

  for (const school of schools) {
    const schoolCode = school.school_code || school.id;
    const session = '2026-27';
    console.log(`🔄 Rebuilding aggregates for: ${(school as any).school_name || (school as any).name || schoolCode} (${schoolCode})`);

    const start = performance.now();
    const aggregate = await AggregatesService.rebuildSchoolAggregate(schoolCode, session);

    // Also snapshot attendance
    const attendance = await AttendanceService.getSchoolSummary(schoolCode, session);
    await AggregatesService.updateAttendanceSnapshot(schoolCode, session, attendance);

    const elapsedMs = Math.round(performance.now() - start);

    console.log(`  ⏱️  Rebuilt in ${elapsedMs}ms`);
    console.log(`  📊 Students: ${aggregate.total_students} | Teachers: ${aggregate.total_teachers}`);
    console.log(`  💰 Billed: ₹${(aggregate.financials.totalBilledPaise / 100).toLocaleString('en-IN')}`);
    console.log(`  💵 Collected: ₹${(aggregate.financials.totalCollectedPaise / 100).toLocaleString('en-IN')} (${aggregate.financials.collectionPercentage}%)`);
    console.log(`  ⏳ Pending: ₹${(aggregate.financials.totalPendingPaise / 100).toLocaleString('en-IN')}`);
    console.log(`  🧾 Receipts: ${aggregate.financials.receiptsCount}`);
    console.log(`  📅 Attendance Today: ${attendance.studentPercent}% (${attendance.studentPresent}/${attendance.studentTotal})\n`);
  }

  console.log('='.repeat(70));
  console.log('✅ ALL SCHOOL AGGREGATES REBUILT SUCCESSFULLY');
  console.log('='.repeat(70));
}

main().then(() => process.exit(0)).catch(err => {
  console.error('❌ Rebuild failed:', err);
  process.exit(1);
});
