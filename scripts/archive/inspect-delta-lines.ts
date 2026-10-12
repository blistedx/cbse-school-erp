import 'dotenv/config';
import { getDatabase } from '../src/lib/mongodb';

async function main() {
  const db = await getDatabase();
  const allLines = await db.collection('fee_ledger').find({
    school_id: 'DPS2026',
    academic_session: '2026-27',
    is_cancelled: { $ne: true }
  }).toArray();

  const chargeLines = allLines.filter(l => l.line_type === 'DEMAND' || l.line_type === 'FINE' || l.line_type === 'CHARGE');
  console.log(`Total charge lines: ${chargeLines.length}`);

  // Let's inspect LATE_FEE, TRANSPORT, and FILE_MISC
  const lateFee = chargeLines.filter(l => l.fee_head === 'LATE_FEE');
  const transport = chargeLines.filter(l => l.fee_head === 'TRANSPORT');
  const fileMisc = chargeLines.filter(l => l.fee_head === 'FILE_MISC');

  console.log(`LATE_FEE: count=${lateFee.length}, total=₹${lateFee.reduce((s, l) => s + (l.amount||0), 0) / 100}`);
  console.log(`TRANSPORT: count=${transport.length}, total=₹${transport.reduce((s, l) => s + (l.amount||0), 0) / 100}`);
  console.log(`FILE_MISC: count=${fileMisc.length}, total=₹${fileMisc.reduce((s, l) => s + (l.amount||0), 0) / 100}`);

  // Let's look at lines with txn_date or created_at in September or specific dates
  const byDate = new Map<string, { count: number, total: number }>();
  for (const l of chargeLines) {
    const d = (l.created_at || l.txn_date || 'UNKNOWN').substring(0, 10);
    if (!byDate.has(d)) byDate.set(d, { count: 0, total: 0 });
    const cur = byDate.get(d)!;
    cur.count++;
    cur.total += (l.amount || 0) / 100;
  }
  console.log('\nCharges grouped by date:');
  for (const [d, v] of byDate.entries()) {
    console.log(`  - ${d}: ${v.count} lines, ₹${v.total.toLocaleString('en-IN')}`);
  }

  // Let's check fine lines (51 lines of late fee = ₹10,200) + transport (14 lines = ₹11,200) + misc (43 lines = ₹6,450)
  // Let's check if the Phase 1 script filtered only line_type === 'DEMAND' and excluded 'FINE' or if specific lines were inserted
  const demandOnly = allLines.filter(l => l.line_type === 'DEMAND');
  const finesOnly = allLines.filter(l => l.line_type === 'FINE');
  console.log('\nDemand lines total:', demandOnly.reduce((s, l) => s + (l.amount||0), 0) / 100);
  console.log('Fine lines total:', finesOnly.reduce((s, l) => s + (l.amount||0), 0) / 100);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
