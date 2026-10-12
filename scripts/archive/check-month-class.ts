import { queryReport } from '../src/lib/fees/fee-service';

async function checkMonthClass() {
  const report = await queryReport('month_class_collection', { month: 'SEP' });
  console.log(`Month-class collection rows: ${report.rows.length}`);
  console.log('Columns:', report.columns.map(c => c.key));
  console.log('\nAll 18 Rows:');
  console.table(report.rows.map(r => ({
    classSection: r.classSection || r.className,
    totalStudents: r.totalStudents,
    submitted: r.submittedCount,
    notSubmitted: r.notSubmittedCount,
    billed: r.demandPaise,
    collected: r.collectedPaise,
    pending: r.pendingPaise,
    realizationRate: r.realizationRate
  })));

  const dcb = await queryReport('class_wise_summary', {});
  console.log(`DCB Class-wise summary rows: ${dcb.rows.length}`);
  console.table(dcb.rows.map(r => ({
    className: r.className,
    students: r.totalStudents,
    billed: r.totalDemand,
    collected: r.totalCollected,
    balance: r.totalBalance
  })));
}

checkMonthClass().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
