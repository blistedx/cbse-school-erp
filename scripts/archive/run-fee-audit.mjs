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

async function runAudit() {
  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');

  console.log('====================================================');
  console.log('                 FEE AUDIT ENGINE                   ');
  console.log('====================================================');

  const students = await db.collection('students').find({}).toArray();
  const schoolId = 'DPS2026';
  const session = '2026-27';

  console.log(`Total Enrolled Students: ${students.length}`);

  // Fetch all ledger lines for 2026-27
  const ledgerLines = await db.collection('fee_ledger').find({
    academic_session: session,
    is_cancelled: { $ne: true }
  }).toArray();

  console.log(`Total Active Ledger Lines: ${ledgerLines.length}`);

  // Count by line_type and fee_head
  const demandHeads = new Map();
  const paymentHeads = new Map();
  const discountHeads = new Map();

  for (const l of ledgerLines) {
    const head = l.fee_head || 'UNKNOWN';
    if (l.line_type === 'DEMAND') {
      demandHeads.set(head, (demandHeads.get(head) || 0) + 1);
    } else if (l.line_type === 'PAYMENT') {
      paymentHeads.set(head, (paymentHeads.get(head) || 0) + 1);
    } else if (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') {
      discountHeads.set(head, (discountHeads.get(head) || 0) + 1);
    }
  }

  console.log('\n--- DEMAND LINES PER FEE HEAD ---');
  for (const [head, count] of demandHeads.entries()) {
    console.log(`- ${head.padEnd(16)}: ${count} demand lines`);
  }

  console.log('\n--- PAYMENT LINES PER FEE HEAD ---');
  for (const [head, count] of paymentHeads.entries()) {
    console.log(`- ${head.padEnd(16)}: ${count} payment lines`);
  }

  // Student coverage audit
  const studentDemandMap = new Map();
  const studentPaymentMap = new Map();

  for (const l of ledgerLines) {
    if (l.line_type === 'DEMAND') {
      if (!studentDemandMap.has(l.student_id)) studentDemandMap.set(l.student_id, new Set());
      studentDemandMap.get(l.student_id).add(l.fee_head);
    } else if (l.line_type === 'PAYMENT') {
      if (!studentPaymentMap.has(l.student_id)) studentPaymentMap.set(l.student_id, new Set());
      studentPaymentMap.get(l.student_id).add(l.fee_head);
    }
  }

  let studentsWithTuitionDemand = 0;
  let studentsWithAnnualDemand = 0;
  let studentsWithTransportDemand = 0;
  let studentsWithExamDemand = 0;
  let studentsWithHostelDemand = 0;
  let studentsWithZeroDemand = 0;

  for (const s of students) {
    const heads = studentDemandMap.get(s.id) || new Set();
    if (heads.size === 0) studentsWithZeroDemand++;
    if (heads.has('TUITION')) studentsWithTuitionDemand++;
    if (heads.has('ANNUAL')) studentsWithAnnualDemand++;
    if (heads.has('TRANSPORT')) studentsWithTransportDemand++;
    if (heads.has('EXAM')) studentsWithExamDemand++;
    if (heads.has('HOSTEL')) studentsWithHostelDemand++;
  }

  console.log('\n--- STUDENT DEMAND COVERAGE (out of ' + students.length + ') ---');
  console.log(`- Students with TUITION demand   : ${studentsWithTuitionDemand}`);
  console.log(`- Students with ANNUAL demand    : ${studentsWithAnnualDemand}`);
  console.log(`- Students with TRANSPORT demand : ${studentsWithTransportDemand} (Opted: ${students.filter(s => s.transport_opted === 'YES' || s.transport_opted === 'yes').length})`);
  console.log(`- Students with EXAM demand      : ${studentsWithExamDemand}`);
  console.log(`- Students with HOSTEL demand    : ${studentsWithHostelDemand} (Opted: ${students.filter(s => s.hostel_opted && s.hostel_opted !== 'NO' && s.hostel_opted !== 'no').length})`);
  console.log(`- Students with 0 Demand lines   : ${studentsWithZeroDemand}`);

  // Financial Totals
  let totalGrossDemand = 0;
  let totalDiscounts = 0;
  let totalPayments = 0;

  for (const l of ledgerLines) {
    if (l.line_type === 'DEMAND') totalGrossDemand += (l.amount || 0);
    else if (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') totalDiscounts += (l.amount || 0);
    else if (l.line_type === 'PAYMENT') totalPayments += (l.amount || 0);
  }

  const netDemand = totalGrossDemand - totalDiscounts;
  const balanceDue = Math.max(0, netDemand - totalPayments);
  const collectionRate = netDemand > 0 ? ((totalPayments / netDemand) * 100).toFixed(1) : '0.0';

  console.log('\n--- GLOBAL FINANCIAL TOTALS ---');
  console.log(`- Total Gross Demand  : ₹${(totalGrossDemand / 100).toLocaleString('en-IN')}`);
  console.log(`- Total Discounts     : ₹${(totalDiscounts / 100).toLocaleString('en-IN')}`);
  console.log(`- Net Billed Demand   : ₹${(netDemand / 100).toLocaleString('en-IN')}`);
  console.log(`- Total Collected     : ₹${(totalPayments / 100).toLocaleString('en-IN')}`);
  console.log(`- Outstanding Dues    : ₹${(balanceDue / 100).toLocaleString('en-IN')}`);
  console.log(`- Realization Rate    : ${collectionRate}%`);

  // Annual Fee Breakdown
  let annualDemandTotal = 0;
  let annualPaidTotal = 0;
  let annualPendingCount = 0;
  let annualPendingAmount = 0;

  for (const s of students) {
    const sLines = ledgerLines.filter(l => l.student_id === s.id && l.fee_head === 'ANNUAL');
    const dem = sLines.filter(l => l.line_type === 'DEMAND').reduce((a, b) => a + (b.amount || 0), 0);
    const paid = sLines.filter(l => l.line_type === 'PAYMENT').reduce((a, b) => a + (b.amount || 0), 0);
    annualDemandTotal += dem;
    annualPaidTotal += paid;
    if (dem > paid) {
      annualPendingCount++;
      annualPendingAmount += (dem - paid);
    }
  }

  console.log('\n--- ANNUAL FEE AUDIT ---');
  console.log(`- Total Annual Demand Billed   : ₹${(annualDemandTotal / 100).toLocaleString('en-IN')}`);
  console.log(`- Total Annual Collected       : ₹${(annualPaidTotal / 100).toLocaleString('en-IN')}`);
  console.log(`- Annual Fee Pending Scholars  : ${annualPendingCount}`);
  console.log(`- Annual Fee Outstanding Dues  : ₹${(annualPendingAmount / 100).toLocaleString('en-IN')}`);

  await client.close();
}

runAudit().catch(console.error);
