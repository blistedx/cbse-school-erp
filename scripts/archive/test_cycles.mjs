import { MongoClient } from 'mongodb';
import fs from 'fs';

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  const envFiles = ['.env', '.env.local'];
  for (const ef of envFiles) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, 'utf8');
      const match = content.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
      if (match) {
        envUri = match[1];
        break;
      }
    }
  }
}

const DASHBOARD_FEE_CYCLES = [
  { id: 'cycle-1', cycleNumber: '1', months: ['APR'], monthShorts: ['Apr'], monthMultiplier: 1, includesAnnualFee: true },
  { id: 'cycle-2', cycleNumber: '2', months: ['MAY', 'JUN'], monthShorts: ['May', 'Jun'], monthMultiplier: 2 },
  { id: 'cycle-3', cycleNumber: '3', months: ['JUL'], monthShorts: ['Jul'], monthMultiplier: 1 },
  { id: 'cycle-4', cycleNumber: '4', months: ['AUG'], monthShorts: ['Aug'], monthMultiplier: 1 },
  { id: 'cycle-5', cycleNumber: '5', months: ['SEP', 'FEB'], monthShorts: ['Sep', 'Feb'], monthMultiplier: 2, includesExamFee: true },
  { id: 'cycle-6', cycleNumber: '6', months: ['OCT'], monthShorts: ['Oct'], monthMultiplier: 1 },
  { id: 'cycle-7', cycleNumber: '7', months: ['NOV'], monthShorts: ['Nov'], monthMultiplier: 1 },
  { id: 'cycle-8', cycleNumber: '8', months: ['DEC', 'MAR'], monthShorts: ['Dec', 'Mar'], monthMultiplier: 2 },
  { id: 'cycle-9', cycleNumber: '9', months: ['JAN'], monthShorts: ['Jan'], monthMultiplier: 1, includesExamFee: true }
];

async function testFullLedgerCycleAggregation() {
  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');

  const schoolId = 'DPS2026';
  const session = '2026-27';

  // Fetch all lines
  const lines = await db.collection('fee_ledger').find({
    school_id: schoolId,
    academic_session: session,
    is_cancelled: { $ne: true }
  }).toArray();

  const totalStudents = await db.collection('students').countDocuments({ school_id: schoolId });

  // 1. Month-wise breakdown
  const ACADEMIC_MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
  const monthData = {};
  ACADEMIC_MONTHS.forEach(m => {
    monthData[m] = { demand: 0, paid: 0, discount: 0, paidStudents: new Set() };
  });

  lines.forEach(l => {
    const m = l.month;
    if (m && monthData[m]) {
      if (['DEMAND', 'OPENING_BALANCE', 'FINE'].includes(l.line_type)) {
        monthData[m].demand += l.amount;
      } else if (l.line_type === 'PAYMENT') {
        monthData[m].paid += l.amount;
        if (l.amount > 0) monthData[m].paidStudents.add(l.student_id);
      } else if (['DISCOUNT', 'WAIVER'].includes(l.line_type)) {
        monthData[m].discount += l.amount;
      }
    }
  });

  const monthSummary = ACADEMIC_MONTHS.map(m => ({
    month: m,
    demandRupees: monthData[m].demand / 100,
    paidRupees: monthData[m].paid / 100,
    discountRupees: monthData[m].discount / 100,
    duesRupees: Math.max(0, (monthData[m].demand - monthData[m].discount - monthData[m].paid) / 100),
    paidStudentsCount: monthData[m].paidStudents.size,
    totalStudents
  }));

  // 2. Cycle-wise metrics
  const cycleSummary = {};
  DASHBOARD_FEE_CYCLES.forEach(cycle => {
    let grandDemand = 0;
    let collectedAmount = 0;
    let discountAmount = 0;
    const paidStudents = new Set();

    cycle.months.forEach(m => {
      grandDemand += monthData[m].demand;
      collectedAmount += monthData[m].paid;
      discountAmount += monthData[m].discount;
      monthData[m].paidStudents.forEach(s => paidStudents.add(s));
    });

    const pendingAmount = Math.max(0, grandDemand - discountAmount - collectedAmount);

    cycleSummary[cycle.id] = {
      cycleId: cycle.id,
      cycleNumber: cycle.cycleNumber,
      grandDemand: grandDemand / 100,
      collectedAmount: collectedAmount / 100,
      pendingAmount: pendingAmount / 100,
      paidStudentsCount: paidStudents.size,
      pendingStudentsCount: Math.max(0, totalStudents - paidStudents.size),
      studentCount: totalStudents
    };
  });

  console.log('Cycle 5 (Sep+Feb):', cycleSummary['cycle-5']);
  console.log('Cycle 1 (Apr):', cycleSummary['cycle-1']);
  console.log('Cycle 2 (May+Jun):', cycleSummary['cycle-2']);
  console.log('Cycle 3 (Jul):', cycleSummary['cycle-3']);
  console.log('Cycle 4 (Aug):', cycleSummary['cycle-4']);

  await client.close();
}

testFullLedgerCycleAggregation().catch(console.error);
