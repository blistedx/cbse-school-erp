import { REPORT_CONFIGS, executeReport } from '../src/lib/fees-engine';
import { getDatabase } from '../src/lib/mongodb';

async function main() {
  console.log('=== VERIFYING ALL REPORT PRESETS FOR DPS2026 ===\n');

  const db = await getDatabase();
  const students = await db.collection('students').find({ school_id: 'DPS2026' }).toArray();

  let passed = 0;
  let failed = 0;

  for (const preset of REPORT_CONFIGS) {
    try {
      const result = await executeReport(
        'DPS2026',
        preset.id,
        { session: '2026-27' },
        students as any
      );

      console.log(`✓ [${preset.group}] ${preset.name} (${preset.id}):`);
      console.log(`   Rows: ${result.rows.length} | KPIs: ${result.summaryKpis.map(k => `${k.label}: ${k.value}`).join(' | ')}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAILED [${preset.id}]:`, err.message);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Result: ${passed}/${REPORT_CONFIGS.length} Presets Passed, ${failed} Failed.`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
