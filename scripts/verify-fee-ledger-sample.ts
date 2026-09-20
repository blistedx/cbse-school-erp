import 'dotenv/config';
import { getDatabase } from '../src/lib/mongodb';
import { getStudentFeeSummaryFromLedger, getFeeAggregate } from '../src/lib/fee-ledger';
import { paiseToRupees } from '../src/lib/fee-constants';

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
      Waiver: `₹${paiseToRupees(k.waiver).toLocaleString('en-IN')}`,
      Outstanding: `₹${paiseToRupees(k.balance).toLocaleString('en-IN')}`,
      StudentsCount: k.studentCount,
      CollectionEfficiency: `${Math.round(((k.collected + k.discount + k.waiver) / k.demand) * 100)}%`
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
    PaymentMode: r.dimensions.payment_mode,
    Collected: `₹${paiseToRupees(r.collected).toLocaleString('en-IN')}`,
    Students: r.studentCount
  })));

  console.log('\n=== 4. SAMPLE STUDENT DETAIL ===');
  // Get 1 standard student, 1 sibling student, 1 RTE student
  const sampleStudent = await db.collection('students').findOne({ school_id: schoolId });
  if (sampleStudent) {
    const summary = await getStudentFeeSummaryFromLedger(schoolId, sampleStudent.id, session);
    console.log(`Scholar: ${sampleStudent.full_name} (${sampleStudent.admission_no}) - Class: ${sampleStudent.class_name} ${sampleStudent.section}`);
    console.log({
      totalDemand: `₹${paiseToRupees(summary.totalDemand).toLocaleString('en-IN')}`,
      totalPaid: `₹${paiseToRupees(summary.totalPaid).toLocaleString('en-IN')}`,
      totalDiscount: `₹${paiseToRupees(summary.totalDiscount).toLocaleString('en-IN')}`,
      balance: `₹${paiseToRupees(summary.balance).toLocaleString('en-IN')}`,
      status: summary.status
    });

    console.log('\nMonth-by-month status:');
    console.table(summary.monthWise.map(m => ({
      Month: m.month,
      Demand: `₹${paiseToRupees(m.demand).toLocaleString('en-IN')}`,
      Paid: `₹${paiseToRupees(m.paid).toLocaleString('en-IN')}`,
      Discount: `₹${paiseToRupees(m.discount).toLocaleString('en-IN')}`,
      Balance: `₹${paiseToRupees(m.balance).toLocaleString('en-IN')}`,
      Status: m.status
    })));
  }

  process.exit(0);
}

verify().catch(console.error);
