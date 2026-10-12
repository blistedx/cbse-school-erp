import { MongoClient } from 'mongodb';
import fs from 'fs';

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  for (const ef of ['.env', '.env.local']) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, 'utf8');
      const match = content.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
      if (match) { envUri = match[1]; break; }
    }
  }
}

const MONTH_INDEX = {
  APR: 0, MAY: 1, JUN: 2, JUL: 3, AUG: 4, SEP: 5,
  OCT: 6, NOV: 7, DEC: 8, JAN: 9, FEB: 10, MAR: 11
};

const MONTH_FULL_NAMES = {
  APR: 'April 2026', MAY: 'May 2026', JUN: 'June 2026',
  JUL: 'July 2026', AUG: 'August 2026', SEP: 'September 2026',
  OCT: 'October 2026', NOV: 'November 2026', DEC: 'December 2026',
  JAN: 'January 2027', FEB: 'February 2027', MAR: 'March 2027'
};

function buildStudentLedgerView(lines) {
  const groups = new Map();

  for (const line of lines) {
    if (line.is_cancelled) continue;
    const period = line.month ? MONTH_FULL_NAMES[line.month] : (line.slot_id ? line.slot_id.replace(/_/g, ' ') : 'Annual / One-Time');
    const groupKey = `${line.fee_head}_${line.month || line.slot_id || 'ANNUAL'}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        fee_head: line.fee_head,
        period,
        month: line.month,
        slot_id: line.slot_id || null,
        gross_paise: 0,
        discount_paise: 0,
        paid_paise: 0,
        due_date: line.due_date,
        lines: [],
      });
    }

    const item = groups.get(groupKey);
    item.lines.push(line);

    if (line.line_type === 'DEMAND' || line.line_type === 'FINE' || line.line_type === 'OPENING_BALANCE') {
      item.gross_paise += line.amount;
      if (line.due_date && !item.due_date) item.due_date = line.due_date;
    } else if (line.line_type === 'DISCOUNT' || line.line_type === 'WAIVER') {
      item.discount_paise += line.amount;
    } else if (line.line_type === 'PAYMENT') {
      item.paid_paise += line.amount;
    }
  }

  const sortedMonthWeight = (m) => (m ? MONTH_INDEX[m] : -1);

  return Array.from(groups.values())
    .map(g => {
      const net_paise = Math.max(0, g.gross_paise - g.discount_paise);
      const due_paise = Math.max(0, net_paise - g.paid_paise);

      let status = 'UPCOMING';
      if (g.gross_paise === 0 && g.paid_paise === 0) {
        status = 'UPCOMING';
      } else if (due_paise === 0 && (net_paise > 0 || g.paid_paise > 0)) {
        status = 'PAID';
      } else if (g.paid_paise > 0 && due_paise > 0) {
        status = 'PARTIAL';
      } else if (due_paise > 0) {
        const today = new Date().toISOString().split('T')[0];
        status = g.due_date && g.due_date < today ? 'OVERDUE' : 'PENDING';
      }

      return {
        id: g.key,
        fee_head: g.fee_head,
        period: g.period,
        month: g.month,
        slot_id: g.slot_id,
        gross_paise: g.gross_paise,
        discount_paise: g.discount_paise,
        net_paise,
        paid_paise: g.paid_paise,
        due_paise,
        status,
        due_date: g.due_date,
      };
    })
    .sort((a, b) => sortedMonthWeight(a.month) - sortedMonthWeight(b.month));
}

async function check() {
  const client = new MongoClient(envUri, { tls: true, tlsAllowInvalidCertificates: true });
  await client.connect();
  const db = client.db('edugit');

  const student = await db.collection('students').findOne({ admission_no: 'DPS-2026-0001' });
  const lines = await db.collection('fee_ledger').find({
    student_id: student.id,
    academic_session: '2026-27'
  }).sort({ txn_date: 1, created_at: 1 }).toArray();

  const ledgerView = buildStudentLedgerView(lines);
  console.log(`\n=== LEDGER VIEW FOR ${student.full_name} (${student.admission_no}) ===`);
  console.table(ledgerView.map(i => ({
    Head: i.fee_head,
    Period: i.period,
    Gross: `₹${i.gross_paise / 100}`,
    Paid: `₹${i.paid_paise / 100}`,
    Due: `₹${i.due_paise / 100}`,
    Status: i.status
  })));

  const totalDemand = ledgerView.reduce((a, b) => a + b.gross_paise, 0);
  const totalPaid = ledgerView.reduce((a, b) => a + b.paid_paise, 0);
  const totalDue = ledgerView.reduce((a, b) => a + b.due_paise, 0);
  console.log(`\nTOTAL BILLED: ₹${totalDemand / 100} | TOTAL PAID: ₹${totalPaid / 100} | TOTAL DUE: ₹${totalDue / 100}`);

  await client.close();
}

check().catch(console.error);
