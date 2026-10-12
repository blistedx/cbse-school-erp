import { getFeeAggregate, paiseToRupees } from '../src/lib/fees-engine';
import { getDatabase } from '../src/lib/mongodb';

async function verify() {
  const db = await getDatabase();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  const schoolId = 'DPS2026';
  const session = '2026-27';

  console.log('=== 1. OVERALL KPI AGGREGATE (All Students) ===');
  const kpiRows = await getFeeAggregate(schoolId, { session }, []);
  if (kpiRows.length > 0) {
    const k = kpiRows[0];
    console.log({
      TotalDemand: `₹${paiseToRupees(k.demand).toLocaleString('en-IN')}`,
      Collected: `₹${paiseToRupees(k.collected).toLocaleString('en-IN')}`,
      Discount: `₹${paiseToRupees(k.discount).toLocaleString('en-IN')}`,
      Outstanding: `₹${paiseToRupees(k.balance).toLocaleString('en-IN')}`,
      StudentsCount: k.studentCount,
      CollectionEfficiency: `${Math.round(((k.collected + k.discount) / k.demand) * 100)}%`
    });
  }

  console.log('\n=== 2. MONTH-WISE AGGREGATION ===');
  const monthRows = await getFeeAggregate(schoolId, { session }, ['month']);
  console.table(monthRows.map(r => ({
    Month: r.dimensions.month,
    Demand: `₹${paiseToRupees(r.demand).toLocaleString('en-IN')}`,
    Collected: `₹${paiseToRupees(r.collected).toLocaleString('en-IN')}`,
    Discount: `₹${paiseToRupees(r.discount).toLocaleString('en-IN')}`,
    Balance: `₹${paiseToRupees(r.balance).toLocaleString('en-IN')}`,
    Students: r.studentCount
  })));

  console.log('\n=== 3. PAYMENT MODE RECONCILIATION ===');
  const modeRows = await getFeeAggregate(schoolId, { session, lineTypes: ['PAYMENT'] }, ['payment_mode']);
  console.table(modeRows.map(r => ({
    Mode: r.dimensions.payment_mode || 'Cash',
    Collected: `₹${paiseToRupees(r.collected).toLocaleString('en-IN')}`,
    Count: r.studentCount
  })));

  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
