import 'dotenv/config';
import { getFeeAggregate, formatPaise } from '../src/lib/fees-engine';
import { performance } from 'perf_hooks';

async function testFastReport() {
  const schoolId = 'DPS2026';
  const session = '2026-27';

  const t0 = performance.now();
  const rows = await getFeeAggregate(schoolId, { session }, ['class']);
  const d0 = performance.now() - t0;

  console.log(`getFeeAggregate by class took: ${d0.toFixed(2)}ms`);
  console.log(`Total classes: ${rows.length}`);
  console.table(rows.map(r => ({
    Class: r.dimensions.class_name,
    Demand: formatPaise(r.demand),
    Collected: formatPaise(r.collected),
    Discount: formatPaise(r.discount),
    Balance: formatPaise(r.balance),
    Students: r.studentCount
  })));

  process.exit(0);
}

testFastReport().catch(console.error);
