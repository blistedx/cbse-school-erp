/*! Baseline Performance Benchmark Script */
import { Database } from '../src/lib/db';
import { FeesService } from '../src/lib/services/fees.service';
import { AttendanceService } from '../src/lib/services/attendance.service';
import { getDatabase } from '../src/lib/mongodb';

interface BenchmarkResult {
  endpoint: string;
  durationMs: number;
  payloadSizeBytes: number;
  payloadSizeKb: number;
  itemCount: number;
  notes: string;
}

async function runBenchmark(): Promise<BenchmarkResult[]> {
  console.log('='.repeat(70));
  console.log('⚡ RUNNING PERFORMANCE BENCHMARK');
  console.log('='.repeat(70));

  const schoolCode = 'DPS2026';
  const session = '2026-27';
  const results: BenchmarkResult[] = [];

  // Warmup connection
  const db = await getDatabase();
  console.log('Database connected.');

  // 1. Dashboard Overview
  console.log('\n[1/5] Measuring Dashboard Overview...');
  {
    const start = performance.now();
    const overview = await Database.getSchoolOverview(schoolCode);
    const durationMs = Math.round(performance.now() - start);
    const payloadStr = JSON.stringify(overview);
    results.push({
      endpoint: 'Dashboard Overview (getSchoolOverview)',
      durationMs,
      payloadSizeBytes: Buffer.byteLength(payloadStr),
      payloadSizeKb: Number((Buffer.byteLength(payloadStr) / 1024).toFixed(2)),
      itemCount: 1,
      notes: `Students: ${overview.kpis.totalStudents}, Collected: ₹${overview.kpis.totalRevenue}`
    });
    console.log(`  ⏱️  Duration: ${durationMs}ms | Payload: ${(Buffer.byteLength(payloadStr) / 1024).toFixed(2)} KB`);
  }

  // 2. Fee Reports (Receipt Register & School Summary)
  console.log('\n[2/5] Measuring Fee Reports & School Summary...');
  {
    const start = performance.now();
    const summary = await FeesService.getSchoolFeeSummary(schoolCode, session);
    const report = await FeesService.executeReport(schoolCode, 'receipt_register', { session });
    const annualPending = await FeesService.getAnnualFeePending(schoolCode, session);
    const durationMs = Math.round(performance.now() - start);
    const payloadStr = JSON.stringify({ summary, report, annualPending });
    results.push({
      endpoint: 'Fee Reports & Summary (Combined)',
      durationMs,
      payloadSizeBytes: Buffer.byteLength(payloadStr),
      payloadSizeKb: Number((Buffer.byteLength(payloadStr) / 1024).toFixed(2)),
      itemCount: report.rows.length + annualPending.items.length,
      notes: `Receipt rows: ${report.rows.length}, Annual pending: ${annualPending.totalPendingCount}`
    });
    console.log(`  ⏱️  Duration: ${durationMs}ms | Payload: ${(Buffer.byteLength(payloadStr) / 1024).toFixed(2)} KB`);
  }

  // 3. Attendance School Summary & All Records
  console.log('\n[3/5] Measuring Attendance Records & Summary...');
  {
    const start = performance.now();
    const summary = await AttendanceService.getSchoolSummary(schoolCode, session);
    const allRecords = await AttendanceService.getAllAttendanceRecords(schoolCode, session);
    const durationMs = Math.round(performance.now() - start);
    const payloadStr = JSON.stringify({ summary, allRecords });
    results.push({
      endpoint: 'Attendance Summary & Records (getAllAttendanceRecords)',
      durationMs,
      payloadSizeBytes: Buffer.byteLength(payloadStr),
      payloadSizeKb: Number((Buffer.byteLength(payloadStr) / 1024).toFixed(2)),
      itemCount: allRecords.length,
      notes: `Total attendance days/classes: ${allRecords.length}`
    });
    console.log(`  ⏱️  Duration: ${durationMs}ms | Payload: ${(Buffer.byteLength(payloadStr) / 1024).toFixed(2)} KB`);
  }

  // 4. Student List
  console.log('\n[4/5] Measuring Student List...');
  {
    const start = performance.now();
    const students = await Database.getStudents(schoolCode, session);
    const durationMs = Math.round(performance.now() - start);
    const payloadStr = JSON.stringify(students);
    results.push({
      endpoint: 'Student List (getStudents - 505 records)',
      durationMs,
      payloadSizeBytes: Buffer.byteLength(payloadStr),
      payloadSizeKb: Number((Buffer.byteLength(payloadStr) / 1024).toFixed(2)),
      itemCount: students.length,
      notes: `Active students: ${students.length}`
    });
    console.log(`  ⏱️  Duration: ${durationMs}ms | Payload: ${(Buffer.byteLength(payloadStr) / 1024).toFixed(2)} KB`);
  }

  // 5. Student Dossier (Single Student Detailed Fetch)
  console.log('\n[5/5] Measuring Student Dossier...');
  {
    const students = await Database.getStudents(schoolCode, session);
    const sampleStudent = students[0];
    const start = performance.now();
    const feeStatus = await FeesService.getStudentFeeStatus(schoolCode, sampleStudent.id, session);
    const attSummary = await AttendanceService.getStudentAttendance(schoolCode, sampleStudent.id, session);
    const durationMs = Math.round(performance.now() - start);
    const payloadStr = JSON.stringify({ student: sampleStudent, feeStatus, attSummary });
    results.push({
      endpoint: 'Student Dossier (Single Student Profile + Ledger + Attendance)',
      durationMs,
      payloadSizeBytes: Buffer.byteLength(payloadStr),
      payloadSizeKb: Number((Buffer.byteLength(payloadStr) / 1024).toFixed(2)),
      itemCount: 1,
      notes: `Student: ${sampleStudent.full_name}`
    });
    console.log(`  ⏱️  Duration: ${durationMs}ms | Payload: ${(Buffer.byteLength(payloadStr) / 1024).toFixed(2)} KB`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 BENCHMARK SUMMARY RESULTS TABLE');
  console.log('='.repeat(70));
  console.table(results.map(r => ({
    'Target Endpoint': r.endpoint,
    'Latency (ms)': r.durationMs,
    'Payload (KB)': r.payloadSizeKb,
    'Items': r.itemCount,
    'Notes': r.notes
  })));

  return results;
}

runBenchmark().then(() => process.exit(0)).catch(e => {
  console.error('Benchmark error:', e);
  process.exit(1);
});
