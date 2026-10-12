import { getDatabase } from '../src/lib/mongodb';
import { computeStudentFeeState } from '../src/lib/fees/metrics';

async function checkCredits() {
  const db = await getDatabase();
  const schoolId = 'DPS2026';
  const session = '2026-27';
  
  const [students, demands, payments] = await Promise.all([
    db.collection('students').find({ school_id: schoolId }).toArray(),
    db.collection('fee_demands').find({ schoolId, sessionId: session }).toArray(),
    db.collection('fee_payments').find({ schoolId, sessionId: session, cancelled: { $ne: true } }).toArray(),
  ]);

  console.log(`Total students: ${students.length}, Demands: ${demands.length}, Payments: ${payments.length}`);
  
  const creditStudents: any[] = [];
  
  for (const s of students as any[]) {
    const sId = s.id || s._id.toString();
    const state = computeStudentFeeState(sId, demands as any[], payments as any[], '2026-09-20');
    
    // Check if student has advance or if totalCollected > billedDueToDate
    const dueToDatePending = state.demands
      .filter(d => d.dueDate <= '2026-09-20')
      .reduce((sum, d) => sum + d.balance, 0);
    
    const scalarDiff = (state.billedDueToDate - state.totalCollected);
    const perDemandPending = state.pendingDues;
    
    if (state.advanceAmount > 0 || state.totalCollected > state.billedDueToDate) {
      creditStudents.push({
        sId,
        name: state.studentName,
        admNo: state.admissionNo,
        className: state.className,
        totalCollected: state.totalCollected,
        billedDueToDate: state.billedDueToDate,
        pendingDues: state.pendingDues,
        advanceAmount: state.advanceAmount,
        diff: perDemandPending - Math.max(0, scalarDiff),
        demands: state.demands.map(d => ({
          head: d.feeHead,
          period: d.period,
          due: d.dueDate,
          net: d.netAmount,
          paid: d.paid,
          bal: d.balance
        })),
        payments: state.payments.map(p => ({
          receiptNo: p.receiptNo,
          amount: p.amountPaid,
          date: p.paidOn
        }))
      });
    }
  }

  console.log(`Found ${creditStudents.length} students with credit/advance:`);
  for (const cs of creditStudents) {
    console.log(`\nScholar: ${cs.name} (${cs.admNo}) - Class ${cs.className}`);
    console.log(`  Billed Due To Date: ₹${cs.billedDueToDate / 100}`);
    console.log(`  Total Collected   : ₹${cs.totalCollected / 100}`);
    console.log(`  Pending Dues      : ₹${cs.pendingDues / 100}`);
    console.log(`  Advance Amount    : ₹${cs.advanceAmount / 100}`);
    console.log(`  Demands:`);
    for (const d of cs.demands) {
      console.log(`    - ${d.head} (${d.period}, due ${d.due}): Net ₹${d.net/100}, Paid ₹${d.paid/100}, Bal ₹${d.bal/100}`);
    }
    console.log(`  Payments:`);
    for (const p of cs.payments) {
      console.log(`    - Receipt ${p.receiptNo}: ₹${p.amount/100} on ${p.date}`);
    }
  }
}

checkCredits().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
