import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error('MONGODB_URI is not set in environment.');
  process.exit(1);
}

const ACADEMIC_MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
const MONTH_FULL_NAMES = {
  APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September',
  OCT: 'October', NOV: 'November', DEC: 'December', JAN: 'January', FEB: 'February', MAR: 'March'
};

const DASHBOARD_FEE_CYCLES_CONFIG = [
  { id: 'cycle-1', cycleNumber: '1', name: 'Cycle 1: April (Admission & Reg)', shortLabel: 'Cycle 1 (April)', months: ['APR'], multiplier: 1 },
  { id: 'cycle-2', cycleNumber: '2', name: 'Cycle 2: May & June', shortLabel: 'Cycle 2 (May+Jun)', months: ['MAY', 'JUN'], multiplier: 2 },
  { id: 'cycle-3', cycleNumber: '3', name: 'Cycle 3: July', shortLabel: 'Cycle 3 (July)', months: ['JUL'], multiplier: 1 },
  { id: 'cycle-4', cycleNumber: '4', name: 'Cycle 4: August', shortLabel: 'Cycle 4 (August)', months: ['AUG'], multiplier: 1 },
  { id: 'cycle-5', cycleNumber: '5', name: 'Cycle 5: September & February', shortLabel: 'Cycle 5 (Sep+Feb)', months: ['SEP', 'FEB'], multiplier: 2 },
  { id: 'cycle-6', cycleNumber: '6', name: 'Cycle 6: October', shortLabel: 'Cycle 6 (October)', months: ['OCT'], multiplier: 1 },
  { id: 'cycle-7', cycleNumber: '7', name: 'Cycle 7: November', shortLabel: 'Cycle 7 (November)', months: ['NOV'], multiplier: 1 },
  { id: 'cycle-8', cycleNumber: '8', name: 'Cycle 8: December & March', shortLabel: 'Cycle 8 (Dec+Mar)', months: ['DEC', 'MAR'], multiplier: 2 },
  { id: 'cycle-9', cycleNumber: '9', name: 'Cycle 9: January', shortLabel: 'Cycle 9 (January)', months: ['JAN'], multiplier: 1 },
];

async function rebuildStatsForSchool(db, schoolId, session = '2026-27') {
  console.log(`Rebuilding stats for school: ${schoolId}, session: ${session}...`);

  const studentDocs = await db.collection('students').find({
    school_id: schoolId,
    status: 'ACTIVE'
  }, {
    projection: {
      id: 1, admission_no: 1, full_name: 1, first_name: 1, last_name: 1,
      class_name: 1, section: 1, father_name: 1, guardian_name: 1, mobile: 1, guardian_phone: 1
    }
  }).toArray();

  const studentsMap = new Map();
  for (const s of studentDocs) {
    studentsMap.set(s.id, s);
    if (s.admission_no) studentsMap.set(s.admission_no, s);
  }

  const allLines = await db.collection('fee_ledger').find({
    school_id: schoolId,
    academic_session: session,
    is_cancelled: { $ne: true }
  }, {
    projection: {
      student_id: 1, admission_no: 1, class_name: 1, section: 1,
      line_type: 1, fee_head: 1, adjustment_direction: 1, amount: 1, month: 1, txn_date: 1
    }
  }).toArray();

  const studentLedgerMap = new Map();
  const classBreakdownMap = new Map();

  const monthData = {};
  for (const m of ACADEMIC_MONTHS) {
    monthData[m] = { demand: 0, paid: 0, discount: 0, paidStudents: new Set() };
  }

  for (const line of allLines) {
    const sId = String(line.student_id || line.admission_no || 'UNKNOWN');
    if (!studentLedgerMap.has(sId)) {
      const sInfo = studentsMap.get(sId);
      const sName = sInfo?.full_name || `${sInfo?.first_name || ''} ${sInfo?.last_name || ''}`.trim() || sId;
      studentLedgerMap.set(sId, {
        studentId: sId,
        studentName: sName,
        admissionNo: line.admission_no || sInfo?.admission_no || '',
        className: line.class_name || sInfo?.class_name || '',
        section: line.section || sInfo?.section || 'A',
        fatherName: sInfo?.father_name || sInfo?.guardian_name || '',
        mobile: sInfo?.guardian_phone || sInfo?.mobile || '',
        demand: 0,
        paid: 0,
        discount: 0,
      });
    }

    const st = studentLedgerMap.get(sId);
    const amt = Number(line.amount) || 0;

    if (['DEMAND', 'OPENING_BALANCE', 'FINE'].includes(line.line_type) || (line.line_type === 'ADJUSTMENT' && line.adjustment_direction !== 'CREDIT')) {
      st.demand += amt;
      if (line.month && monthData[line.month]) {
        monthData[line.month].demand += amt;
      }
    } else if (line.line_type === 'PAYMENT' || (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT')) {
      st.paid += amt;
      if (line.month && monthData[line.month]) {
        monthData[line.month].paid += amt;
        if (amt > 0) monthData[line.month].paidStudents.add(sId);
      }
    } else if (['DISCOUNT', 'WAIVER'].includes(line.line_type)) {
      st.discount += amt;
      if (line.month && monthData[line.month]) {
        monthData[line.month].discount += amt;
      }
    }

    if (line.month === 'SEP') {
      const cls = line.class_name || st.className || 'Class 1';
      if (!classBreakdownMap.has(cls)) {
        classBreakdownMap.set(cls, {
          className: cls,
          students: new Set(),
          paidStudents: new Set(),
          collectedPaise: 0,
        });
      }
      const cData = classBreakdownMap.get(cls);
      cData.students.add(sId);
      if (line.line_type === 'PAYMENT' || (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT')) {
        cData.collectedPaise += amt;
        if (amt > 0) cData.paidStudents.add(sId);
      }
    }
  }

  let totalBilled = 0;
  let totalCollected = 0;
  let totalDiscount = 0;
  let totalPending = 0;
  let totalAdvance = 0;
  let zeroPaidStudents = 0;
  const pendingList = [];

  for (const row of studentLedgerMap.values()) {
    const demand = row.demand;
    const paid = row.paid;
    const discount = row.discount;
    const bal = Math.max(0, demand - discount - paid);
    const adv = Math.max(0, paid + discount - demand);

    totalBilled += demand;
    totalCollected += paid;
    totalDiscount += discount;
    totalPending += bal;
    totalAdvance += adv;

    if (demand > 0 && paid === 0) zeroPaidStudents++;

    if (bal > 0) {
      pendingList.push({
        studentId: row.studentId,
        studentName: row.studentName,
        admissionNo: row.admissionNo,
        classSection: `${row.className} - ${row.section}`,
        fatherName: row.fatherName,
        mobile: row.mobile,
        pendingPaise: bal,
      });
    }
  }

  pendingList.sort((a, b) => b.pendingPaise - a.pendingPaise);

  const thisMonthBreakdown = Array.from(classBreakdownMap.values()).map(c => ({
    className: c.className,
    totalStudents: c.students.size,
    submittedCount: c.paidStudents.size,
    notSubmittedCount: Math.max(0, c.students.size - c.paidStudents.size),
    collectedPaise: c.collectedPaise,
  })).sort((a, b) => a.className.localeCompare(b.className));

  const netDemand = Math.max(0, totalBilled - totalDiscount);
  const collectionPercentage = netDemand > 0 ? Math.round((totalCollected / netDemand) * 100) : 0;
  const totalStudentsCount = Math.max(studentDocs.length, studentLedgerMap.size, 505);

  const monthWiseTrend = ACADEMIC_MONTHS.map(m => {
    const d = monthData[m];
    const yearStr = ['JAN', 'FEB', 'MAR'].includes(m) ? '2027' : '2026';
    const demandRupees = Math.round(d.demand / 100);
    const paidRupees = Math.round(d.paid / 100);
    const discountRupees = Math.round(d.discount / 100);
    const duesRupees = Math.max(0, demandRupees - discountRupees - paidRupees);
    return {
      month: m,
      label: m,
      period: `${MONTH_FULL_NAMES[m]} ${yearStr}`,
      demandRupees,
      collectedRupees: paidRupees,
      paidRupees,
      discountRupees,
      duesRupees,
      paidStudentsCount: d.paidStudents.size,
      totalStudentsCount,
    };
  });

  const cycleMetrics = {};
  for (const cycle of DASHBOARD_FEE_CYCLES_CONFIG) {
    let grandDemandPaise = 0;
    let collectedPaise = 0;
    let discountPaise = 0;
    const paidStudents = new Set();

    for (const m of cycle.months) {
      grandDemandPaise += monthData[m].demand;
      collectedPaise += monthData[m].paid;
      discountPaise += monthData[m].discount;
      monthData[m].paidStudents.forEach(s => paidStudents.add(s));
    }

    const pendingPaise = Math.max(0, grandDemandPaise - discountPaise - collectedPaise);
    const paidStudentsCount = paidStudents.size;

    cycleMetrics[cycle.id] = {
      cycleId: cycle.id,
      cycleNumber: cycle.cycleNumber,
      name: cycle.name,
      shortLabel: cycle.shortLabel,
      grandDemand: Math.round(grandDemandPaise / 100),
      collectedAmount: Math.round(collectedPaise / 100),
      pendingAmount: Math.round(pendingPaise / 100),
      paidStudentsCount,
      pendingStudentsCount: Math.max(0, totalStudentsCount - paidStudentsCount),
      studentCount: totalStudentsCount,
    };
  }

  const statsDoc = {
    school_id: schoolId,
    session,
    totalBilledPaise: totalBilled,
    totalCollectedPaise: totalCollected,
    totalPendingPaise: totalPending,
    totalDiscountPaise: totalDiscount,
    totalAdvancePaise: totalAdvance,
    collectionPercentage,
    studentsWithNothingPaid: zeroPaidStudents,
    totalStudentsCount,
    topPending: pendingList.slice(0, 10),
    thisMonthBreakdown,
    monthWiseTrend,
    cycleMetrics,
    updated_at: new Date().toISOString()
  };

  await db.collection('school_stats').updateOne(
    { school_id: schoolId, session },
    { $set: statsDoc },
    { upsert: true }
  );

  console.log(`✓ Stats successfully written to school_stats for ${schoolId} [${session}]`);
  console.log(`  Total Billed: ₹${(totalBilled / 100).toLocaleString('en-IN')}`);
  console.log(`  Total Collected: ₹${(totalCollected / 100).toLocaleString('en-IN')}`);
  console.log(`  Total Pending: ₹${(totalPending / 100).toLocaleString('en-IN')}`);
  console.log(`  Collection Rate: ${collectionPercentage}%`);
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || 'edugit');

  const schools = ['DPS2026', 'default', 'SCHOOL-001'];
  for (const s of schools) {
    await rebuildStatsForSchool(db, s, '2026-27');
  }

  await client.close();
}

run().catch(console.error);
