import 'dotenv/config';
import { getDatabase } from '../src/lib/mongodb';

async function main() {
  const db = await getDatabase();
  const allLines = await db.collection('fee_ledger').find({
    school_id: 'DPS2026',
    academic_session: '2026-27',
    is_cancelled: { $ne: true }
  }).toArray();

  const studentMap = new Map<string, any[]>();
  for (const l of allLines) {
    if (!studentMap.has(l.student_id)) studentMap.set(l.student_id, []);
    studentMap.get(l.student_id)!.push(l);
  }

  const advStudents: any[] = [];
  for (const [sid, lines] of studentMap.entries()) {
    let billed = 0, paid = 0, disc = 0;
    for (const l of lines) {
      if (l.line_type === 'DEMAND' || l.line_type === 'FINE' || l.line_type === 'CHARGE') {
        billed += l.amount || 0;
      } else if (l.line_type === 'PAYMENT') {
        paid += l.amount || 0;
      } else if (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') {
        disc += l.amount || 0;
      }
    }
    const bal = (billed - disc) - paid;
    if (bal < 0) {
      advStudents.push({
        student_id: sid,
        admission_no: lines[0].admission_no,
        student_name: lines[0].student_name,
        class_name: lines[0].class_name,
        billed_inr: billed / 100,
        paid_inr: paid / 100,
        disc_inr: disc / 100,
        advance_inr: Math.abs(bal) / 100,
      });
    }
  }

  console.log('\n======================================================');
  console.log(`TOTAL ADVANCE STUDENTS: ${advStudents.length}`);
  console.log(`TOTAL ADVANCE AMOUNT: ₹${advStudents.reduce((s, a) => s + a.advance_inr, 0).toLocaleString('en-IN')}`);
  console.log('======================================================\n');
  console.table(advStudents);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
