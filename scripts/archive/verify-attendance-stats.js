/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.COCKROACH_DB_URL.replace('?sslmode=verify-full', ''),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const count = await client.query('SELECT COUNT(*) FROM attendance;');
  const dates = await client.query('SELECT MIN(date) AS start_date, MAX(date) AS end_date, COUNT(DISTINCT date) AS total_working_days FROM attendance;');
  const fac = await client.query("SELECT COUNT(*) FROM attendance WHERE class_name = 'Faculty';");
  const cls = await client.query("SELECT COUNT(*) FROM attendance WHERE class_name != 'Faculty';");
  const samples = await client.query('SELECT date, class_name, section, total_students, present_count, absent_count FROM attendance ORDER BY date DESC LIMIT 4;');

  console.log('======================================================');
  console.log('📊 COCKROACHDB 2026-2027 ATTENDANCE TELEMETRY:');
  console.log('======================================================');
  console.log('• Academic Session Period :', dates.rows[0].start_date, 'to', dates.rows[0].end_date);
  console.log('• Total CBSE Working Days :', dates.rows[0].total_working_days, 'Days');
  console.log('• Total Attendance Logs   :', count.rows[0].count, 'Records');
  console.log('• Class Section Logs      :', cls.rows[0].count, 'Records (All Classes & Sections)');
  console.log('• Faculty Daily Logs      :', fac.rows[0].count, 'Records (220 Teachers)');
  console.log('\nLATEST DAILY LOG SAMPLES:');
  for (const s of samples.rows) {
    console.log(`  - [${s.date}] ${s.class_name.padEnd(16)} Sec ${s.section.padEnd(5)} | Total: ${String(s.total_students).padEnd(3)} | Present: ${String(s.present_count).padEnd(3)} | Absent: ${s.absent_count}`);
  }
  console.log('======================================================');

  await client.end();
}

run().catch(console.error);
