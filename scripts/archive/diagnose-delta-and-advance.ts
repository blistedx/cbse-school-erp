import 'dotenv/config';
import { getDatabase } from '../src/lib/mongodb';
import { paiseToRupees } from '../src/lib/fees-engine';

async function diagnose() {
  const db = await getDatabase();
  const schoolId = 'DPS2026';
  const session = '2026-27';

  console.log('=== 1. DIAGNOSING ALL 14,608 LEDGER LINES ===');
  const allLines = await db.collection('fee_ledger').find({
    school_id: schoolId,
    academic_session: session,
    is_cancelled: { $ne: true }
  }).toArray();

  console.log(`Total active ledger lines: ${allLines.length}`);

  // 1. Line Type Breakdown
  const typeMap = new Map<string, { count: number, totalPaise: number }>();
  for (const l of allLines) {
    const t = l.line_type || 'UNKNOWN';
    if (!typeMap.has(t)) {
      typeMap.set(t, { count: 0, totalPaise: 0 });
    }
    const cur = typeMap.get(t)!;
    cur.count++;
    cur.totalPaise += l.amount || 0;
  }

  console.log('\n--- LINE TYPE BREAKDOWN ---');
  for (const [t, d] of typeMap.entries()) {
    console.log(`  - ${t}: count=${d.count}, totalPaise=${d.totalPaise} (₹${paiseToRupees(d.totalPaise).toLocaleString('en-IN')})`);
  }

  // 2. Group by student_id
  const studentMap = new Map<string, any[]>();
  for (const line of allLines) {
    if (!studentMap.has(line.student_id)) {
      studentMap.set(line.student_id, []);
    }
    studentMap.get(line.student_id)!.push(line);
  }

  console.log(`\nTotal unique students in ledger: ${studentMap.size}`);

  const advanceStudents: any[] = [];
  let totalBilledPaise = 0;
  let totalCollectedPaise = 0;
  let totalDiscountPaise = 0;
  let totalPendingPaise = 0;
  let totalAdvancePaise = 0;

  for (const [studentId, lines] of studentMap.entries()) {
    let billed = 0;
    let paid = 0;
    let disc = 0;

    for (const l of lines) {
      const amt = l.amount || 0;
      if (l.line_type === 'DEMAND' || l.line_type === 'FINE' || l.line_type === 'CHARGE') {
        billed += amt;
      } else if (l.line_type === 'PAYMENT') {
        paid += amt;
      } else if (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') {
        disc += amt;
      }
    }

    const netCharge = billed - disc;
    const balance = netCharge - paid;

    totalBilledPaise += billed;
    totalCollectedPaise += paid;
    totalDiscountPaise += disc;

    if (balance > 0) {
      totalPendingPaise += balance;
    } else if (balance < 0) {
      const adv = Math.abs(balance);
      totalAdvancePaise += adv;
      advanceStudents.push({
        studentId,
        admissionNo: lines[0]?.admission_no || 'N/A',
        studentName: lines[0]?.student_name || 'N/A',
        className: lines[0]?.class_name || 'N/A',
        section: lines[0]?.section || 'A',
        billedInr: paiseToRupees(billed),
        paidInr: paiseToRupees(paid),
        discInr: paiseToRupees(disc),
        advanceInr: paiseToRupees(adv),
        payments: lines.filter(l => l.line_type === 'PAYMENT').map(l => ({
          id: l.id || l._id,
          month: l.month,
          fee_head: l.fee_head,
          amount_inr: paiseToRupees(l.amount),
          receipt_no: l.receipt_no,
          txn_date: l.txn_date,
          payment_mode: l.payment_mode
        })),
        demands: lines.filter(l => l.line_type === 'DEMAND').map(l => ({
          id: l.id || l._id,
          month: l.month,
          fee_head: l.fee_head,
          amount_inr: paiseToRupees(l.amount)
        }))
      });
    }
  }

  console.log('\n--- ADVANCE STUDENTS DETAIL ---');
  console.log(`Number of students with Advance: ${advanceStudents.length}`);
  console.log(`Total Advance amount: ₹${paiseToRupees(totalAdvancePaise).toLocaleString('en-IN')}`);
  console.log(JSON.stringify(advanceStudents, null, 2));

  console.log('\n--- OVERALL TOTALS ---');
  console.log({
    totalBilled: `₹${paiseToRupees(totalBilledPaise).toLocaleString('en-IN')}`,
    totalCollected: `₹${paiseToRupees(totalCollectedPaise).toLocaleString('en-IN')}`,
    totalDiscount: `₹${paiseToRupees(totalDiscountPaise).toLocaleString('en-IN')}`,
    totalPending: `₹${paiseToRupees(totalPendingPaise).toLocaleString('en-IN')}`,
    totalAdvance: `₹${paiseToRupees(totalAdvancePaise).toLocaleString('en-IN')}`,
  });

  // Check the ₹17,800 difference:
  // Phase 1 audit recorded Billed = 1,88,05,150. Current is 1,88,22,950 (+17,800).
  // Let's check FINE / LATE_FEE lines or any specific fee heads that total 17,800
  console.log('\n=== 3. EXAMINING FEE HEADS & CHARGES ===');
  const headMap = new Map<string, { count: number, totalPaise: number }>();
  for (const cl of allLines.filter(l => l.line_type === 'DEMAND' || l.line_type === 'FINE')) {
    const head = cl.fee_head || 'UNKNOWN';
    if (!headMap.has(head)) {
      headMap.set(head, { count: 0, totalPaise: 0 });
    }
    const cur = headMap.get(head)!;
    cur.count++;
    cur.totalPaise += cl.amount || 0;
  }
  for (const [h, data] of headMap.entries()) {
    console.log(`  - ${h}: count=${data.count}, total=₹${paiseToRupees(data.totalPaise).toLocaleString('en-IN')} (${data.totalPaise} paise)`);
  }

  process.exit(0);
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
