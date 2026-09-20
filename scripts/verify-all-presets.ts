import 'dotenv/config';
import { ALL_REPORT_PRESETS } from '../src/lib/fee-report-presets';
import { getFeeAggregate } from '../src/lib/fee-ledger';

async function main() {
  console.log('=== VERIFYING ALL 24 REPORT PRESETS FOR DPS2026 ===\n');

  let passed = 0;
  let failed = 0;

  for (const preset of ALL_REPORT_PRESETS) {
    try {
      const rows = await getFeeAggregate(
        'DPS2026',
        {
          session: '2026-27',
          ...preset.filterOverrides,
        },
        preset.groupBy
      );

      const totalDemand = rows.reduce((s, r) => s + (r.demand || 0), 0);
      const totalCollected = rows.reduce((s, r) => s + (r.collected || 0), 0);
      const totalDiscount = rows.reduce((s, r) => s + (r.discount || 0), 0);
      const totalBalance = rows.reduce((s, r) => s + (r.balance || 0), 0);

      console.log(`✓ [${preset.category.toUpperCase()}] ${preset.name} (${preset.id}):`);
      console.log(`   Rows: ${rows.length} | Demand: ₹${(totalDemand/100).toLocaleString('en-IN')} | Collected: ₹${(totalCollected/100).toLocaleString('en-IN')} | Dues: ₹${(totalBalance/100).toLocaleString('en-IN')}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAILED [${preset.id}]:`, err.message);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Result: ${passed}/${ALL_REPORT_PRESETS.length} Presets Passed, ${failed} Failed.`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
