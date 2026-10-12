/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { Pool } = require('pg');
require('dotenv').config();

const connStr = (process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '').replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');

const pool = new Pool({
  connectionString: connStr,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

async function check() {
  const client = await pool.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('✅ Connected to CockroachDB!');
  console.log('Tables initialized:', res.rows.map(r => r.table_name));

  for (const row of res.rows) {
    const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}";`);
    console.log(`  - ${row.table_name.padEnd(16)}: ${countRes.rows[0].count} rows`);
  }

  client.release();
  await pool.end();
}

check().catch(console.error);
