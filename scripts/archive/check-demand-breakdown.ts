import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { getDatabase } from '../src/lib/mongodb';

async function check() {
  const db = await getDatabase();
  if (!db) {
    console.error('No DB');
    process.exit(1);
  }
  const demands = await db.collection('fee_demands').find({ sessionId: '2026-27' }).toArray();
  const payments = await db.collection('fee_payments').find({ sessionId: '2026-27', cancelled: { $ne: true } }).toArray();

  // Check slots
  const slotsMap = new Map<string, { count: number; gross: number; discount: number; net: number; dueDate: string }>();
  for (const d of demands) {
    if (!slotsMap.has(d.period)) {
      slotsMap.set(d.period, { count: 0, gross: 0, discount: 0, net: 0, dueDate: d.dueDate });
    }
    const s = slotsMap.get(d.period)!;
    s.count++;
    s.gross += d.grossAmount;
    s.discount += d.discountAmount;
    s.net += d.netAmount;
  }

  console.log('--- ALL SLOTS IN DATABASE ---');
  for (const [period, info] of slotsMap.entries()) {
    console.log(`${period.padEnd(12)} | Due: ${info.dueDate} | Demands: ${info.count} | Net: ₹${(info.net / 100).toLocaleString('en-IN')}`);
  }

  // How payments allocate to demands:
  // Each student's payments are allocated chronologically or via allocatedHeads to their demands in order of dueDate
  const today = '2026-09-20';
  
  // Student-wise demand & payment ledger
  const studentDemandMap = new Map<string, any[]>();
  for (const d of demands) {
    if (!studentDemandMap.has(d.studentId)) studentDemandMap.set(d.studentId, []);
    studentDemandMap.get(d.studentId)!.push({ ...d, paid: 0 });
  }

  const studentPaymentMap = new Map<string, any[]>();
  for (const p of payments) {
    if (!studentPaymentMap.has(p.studentId)) studentPaymentMap.set(p.studentId, []);
    studentPaymentMap.get(p.studentId)!.push(p);
  }

  let totalPendingPerDemandToday = 0;
  let totalUpcomingPerDemand = 0;
  let totalAdvanceAcrossStudents = 0;
  let totalCollectedAcrossStudents = 0;

  for (const [sId, sDemands] of studentDemandMap.entries()) {
    // sort demands by dueDate
    sDemands.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const sPayments = studentPaymentMap.get(sId) || [];
    let availablePaid = sPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    totalCollectedAcrossStudents += availablePaid;

    // allocate paid to demands in order
    for (const d of sDemands) {
      const needed = d.netAmount;
      const allocated = Math.min(availablePaid, needed);
      d.paid = allocated;
      availablePaid -= allocated;
      const due = Math.max(0, needed - allocated);

      if (d.dueDate <= today) {
        totalPendingPerDemandToday += due;
      } else {
        totalUpcomingPerDemand += due;
      }
    }

    if (availablePaid > 0) {
      totalAdvanceAcrossStudents += availablePaid;
    }
  }

  console.log('\n--- VERIFICATION OF STATUTORY METRICS ---');
  console.log('Total Collected               : ₹' + (totalCollectedAcrossStudents / 100).toLocaleString('en-IN'));
  console.log('Pending Dues (dueDate <= today): ₹' + (totalPendingPerDemandToday / 100).toLocaleString('en-IN'));
  console.log('Upcoming Dues (dueDate > today): ₹' + (totalUpcomingPerDemand / 100).toLocaleString('en-IN'));
  console.log('Advance Paid                  : ₹' + (totalAdvanceAcrossStudents / 100).toLocaleString('en-IN'));

  process.exit(0);
}

check();
