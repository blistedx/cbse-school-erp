const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
if (!fs.existsSync(storePath)) {
  console.error('Store file not found:', storePath);
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const students = store.students || [];
console.log(`Found ${students.length} students in store.`);

function getStandardTuitionRate(className) {
  const norm = (className || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('pg') || norm.includes('play') || norm.includes('nursery') || norm.includes('lkg') || norm.includes('ukg')) return 1200;
  if (norm.includes('1') || norm.includes('2') || norm.includes('i') || norm.includes('ii')) return 1400;
  if (norm.includes('3') || norm.includes('4') || norm.includes('5') || norm.includes('iii') || norm.includes('iv') || norm.includes('v')) return 1600;
  if (norm.includes('6') || norm.includes('7') || norm.includes('8') || norm.includes('vi') || norm.includes('vii') || norm.includes('viii')) return 1800;
  if (norm.includes('9') || norm.includes('10') || norm.includes('ix') || norm.includes('x')) return 2000;
  if (norm.includes('11') || norm.includes('12') || norm.includes('xi') || norm.includes('xii')) return 2400;
  return 1500;
}

function getStandardAnnualFeeRate(className) {
  const norm = (className || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('9') || norm.includes('10') || norm.includes('11') || norm.includes('12') || norm.includes('ix') || norm.includes('x') || norm.includes('xi') || norm.includes('xii')) {
    return 5000;
  }
  return 4000;
}

const MONTH_DEFS = [
  { name: 'April 2026', short: 'Apr', index: 1, monthKey: '04', quarter: 'Q1', dueDate: '2026-04-15', hasAnnual: true, hasExam: false, paidProb: 0.94 },
  { name: 'May 2026', short: 'May', index: 2, monthKey: '05', quarter: 'Q1', dueDate: '2026-05-15', hasAnnual: false, hasExam: false, paidProb: 0.91 },
  { name: 'June 2026', short: 'Jun', index: 3, monthKey: '06', quarter: 'Q1', dueDate: '2026-06-15', hasAnnual: false, hasExam: false, paidProb: 0.88 },
  { name: 'July 2026', short: 'Jul', index: 4, monthKey: '07', quarter: 'Q2', dueDate: '2026-07-15', hasAnnual: false, hasExam: false, paidProb: 0.92 },
  { name: 'August 2026', short: 'Aug', index: 5, monthKey: '08', quarter: 'Q2', dueDate: '2026-08-15', hasAnnual: false, hasExam: false, paidProb: 0.87 },
  { name: 'September 2026', short: 'Sep', index: 6, monthKey: '09', quarter: 'Q2', dueDate: '2026-09-15', hasAnnual: false, hasExam: true, paidProb: 0.78 },
  { name: 'October 2026', short: 'Oct', index: 7, monthKey: '10', quarter: 'Q3', dueDate: '2026-10-15', hasAnnual: false, hasExam: false, paidProb: 0.0 },
  { name: 'November 2026', short: 'Nov', index: 8, monthKey: '11', quarter: 'Q3', dueDate: '2026-11-15', hasAnnual: false, hasExam: false, paidProb: 0.0 },
  { name: 'December 2026', short: 'Dec', index: 9, monthKey: '12', quarter: 'Q3', dueDate: '2026-12-15', hasAnnual: false, hasExam: false, paidProb: 0.0 },
  { name: 'January 2027', short: 'Jan', index: 10, monthKey: '01', quarter: 'Q4', dueDate: '2027-01-15', hasAnnual: false, hasExam: false, paidProb: 0.0 },
  { name: 'February 2027', short: 'Feb', index: 11, monthKey: '02', quarter: 'Q4', dueDate: '2027-02-15', hasAnnual: false, hasExam: true, paidProb: 0.0 },
  { name: 'March 2027', short: 'Mar', index: 12, monthKey: '03', quarter: 'Q4', dueDate: '2027-03-15', hasAnnual: false, hasExam: false, paidProb: 0.0 },
];

const newInvoices = [];
let invSeq = 1;

students.forEach((stu, sIdx) => {
  const tuition = getStandardTuitionRate(stu.class_name);
  const annual = getStandardAnnualFeeRate(stu.class_name);
  const transportOpted = (stu.transport_opted || '').toUpperCase() === 'YES' || (sIdx % 3 === 0);
  const transport = transportOpted ? (stu.transport_slab_id ? 900 : 800) : 0;
  const roll = parseInt(stu.roll_no, 10) || (sIdx + 1);

  MONTH_DEFS.forEach((m) => {
    const annualFee = m.hasAnnual ? annual : 0;
    const examFee = m.hasExam ? 1000 : 0;
    const totalAmount = tuition + annualFee + transport + examFee;

    // Deterministic pseudo-randomness based on student roll & month index
    const seedVal = ((sIdx * 37 + m.index * 19 + roll * 7) % 100) / 100;
    const isPaid = seedVal < m.paidProb;

    let status = 'PENDING';
    let paidAmount = 0;
    let paidDate = undefined;
    let paymentMode = undefined;

    if (isPaid) {
      status = 'PAID';
      paidAmount = totalAmount;
      const day = String(((sIdx + m.index * 3) % 18) + 2).padStart(2, '0');
      const year = m.index <= 9 ? '2026' : '2027';
      paidDate = `${year}-${m.monthKey}-${day}`;
      const modes = ['UPI / NetBanking', 'Cash / Counter', 'Cheque', 'Debit/Credit Card'];
      paymentMode = modes[(sIdx + m.index) % modes.length];
    } else if (m.index <= 6) {
      status = m.index === 6 ? 'PENDING' : 'OVERDUE';
    }

    const admDigits = (stu.admission_no || '').replace(/[^0-9]/g, '').slice(-4) || String(sIdx + 1).padStart(4, '0');
    const invoiceNo = `DPS-INV-${admDigits}-${m.short.toUpperCase()}`;

    newInvoices.push({
      id: `INV-2026-${String(invSeq).padStart(6, '0')}`,
      school_id: stu.school_id || 'DPS2026',
      academic_session: '2026-27',
      invoice_no: invoiceNo,
      student_id: stu.id,
      student_name: stu.full_name,
      admission_no: stu.admission_no,
      class_name: `${stu.class_name} - ${stu.section || 'A'}`,
      month: `${m.name} (${m.quarter} Term)`,
      amount: totalAmount,
      paid_amount: paidAmount,
      tuition_fee: tuition,
      annual_fee: annualFee,
      transport_fee: transport,
      exam_fee: examFee,
      due_date: m.dueDate,
      status: status,
      payment_mode: paymentMode,
      paid_date: paidDate,
      created_at: `2026-04-01T00:00:00.000Z`
    });

    invSeq++;
  });
});

console.log(`Generated ${newInvoices.length} session-wise invoices across 12 CBSE months.`);

// Print summary by month
const monthSummary = {};
MONTH_DEFS.forEach(m => {
  const matching = newInvoices.filter(i => i.month.includes(m.short));
  const paid = matching.filter(i => i.status === 'PAID');
  const dues = matching.filter(i => i.status !== 'PAID');
  const paidSum = paid.reduce((a, b) => a + b.amount, 0);
  const duesSum = dues.reduce((a, b) => a + b.amount, 0);
  monthSummary[m.short] = {
    totalInvoices: matching.length,
    paidCount: paid.length,
    duesCount: dues.length,
    collectedLakhs: (paidSum / 100000).toFixed(2) + ' L',
    duesLakhs: (duesSum / 100000).toFixed(2) + ' L'
  };
});
console.table(monthSummary);

// Save to erp_store.json
store.fee_invoices = newInvoices;
fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('Successfully saved updated fee_invoices to erp_store.json!');
