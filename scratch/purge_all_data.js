/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function purgeAllData() {
  console.log('--- PURGING ALL DEMO DATA (ONLINE + LOCAL) ---');

  // 1. Reset local JSON store
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const emptyStore = {
    schools: [],
    demo_requests: [],
    users: [],
    students: [],
    teachers: [],
    attendance: [],
    fee_invoices: []
  };

  const storePath = path.join(dataDir, 'erp_store.json');
  fs.writeFileSync(storePath, JSON.stringify(emptyStore, null, 2), 'utf8');
  console.log('✅ Local store (data/erp_store.json) cleared to empty.');

  // 2. Connect to Online PostgreSQL Database (Supabase)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('⚠️ No DATABASE_URL found. Skipping online PostgreSQL purge.');
    return;
  }

  const isSSL = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isSSL ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    console.log('🔌 Connected to Supabase PostgreSQL cloud database.');

    const tables = [
      'demo_requests',
      'audit_logs',
      'timetable',
      'notices',
      'exam_marks',
      'classes',
      'attendance',
      'fee_invoices',
      'students',
      'teachers',
      'users',
      'schools'
    ];

    for (const table of tables) {
      try {
        await client.query(`TRUNCATE TABLE ${table} CASCADE;`);
        console.log(`  ✓ Truncated table: ${table}`);
      } catch (err) {
        // If table does not exist or has issue, try DELETE
        try {
          await client.query(`DELETE FROM ${table};`);
          console.log(`  ✓ Cleared table via DELETE: ${table}`);
        } catch (delErr) {
          console.log(`  ℹ️ Table ${table} (optional/not found, skipped)`);
        }
      }
    }

    client.release();
    console.log('✅ All online database tables truncated successfully.');
  } catch (err) {
    console.error('❌ Database purge error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('--- PURGE COMPLETE. READY FOR FRESH TESTING ---');
}

purgeAllData();
