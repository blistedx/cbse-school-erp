import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { getDatabase } from '../src/lib/mongodb';

async function run() {
  const db = await getDatabase();
  if (!db) {
    console.error('No DB connection');
    process.exit(1);
  }
  const demands = await db.collection('fee_demands').find({ sessionId: '2026-27' }).toArray();
  const payments = await db.collection('fee_payments').find({ sessionId: '2026-27', cancelled: { $ne: true } }).toArray();

  const today = '2026-09-20';
  let totalBilledAll = 0;
  let billedDueToDate = 0;
  let upcomingBilled = 0;

  for (const d of demands) {
    totalBilledAll += (d.netAmount || 0);
    if (d.dueDate <= today) {
      billedDueToDate += (d.netAmount || 0);
    } else {
      upcomingBilled += (d.netAmount || 0);
    }
  }

  let totalPaid = 0;
  for (const p of payments) {
    totalPaid += (p.amountPaid || 0);
  }

  console.log('Total Billed (Full Session): ₹' + (totalBilledAll / 100).toLocaleString('en-IN'));
  console.log('Billed Due to Date (dueDate <= today): ₹' + (billedDueToDate / 100).toLocaleString('en-IN'));
  console.log('Upcoming Billed (dueDate > today): ₹' + (upcomingBilled / 100).toLocaleString('en-IN'));
  console.log('Total Collected: ₹' + (totalPaid / 100).toLocaleString('en-IN'));
  console.log('Pending Dues (Balance as of today = Billed Due to Date - Paid): ₹' + ((billedDueToDate - totalPaid) / 100).toLocaleString('en-IN'));
  console.log('Full Year Outstanding (All Demands - All Paid): ₹' + ((totalBilledAll - totalPaid) / 100).toLocaleString('en-IN'));

  process.exit(0);
}

run();
