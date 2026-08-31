/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

const rawCockroach = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const COCKROACH_URI = rawCockroach.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

async function checkCounts() {
  console.log('🔍 CHECKING LIVE COUNTS IN ALL DATABASES:\n');

  // 1. CockroachDB
  try {
    const cr = new Client({ connectionString: COCKROACH_URI, ssl: { rejectUnauthorized: false } });
    await cr.connect();
    const crStu = await cr.query('SELECT COUNT(*) FROM students;');
    const crTea = await cr.query('SELECT COUNT(*) FROM teachers;');
    const crCls = await cr.query('SELECT COUNT(*) FROM classes;');
    const crAtt = await cr.query('SELECT COUNT(*) FROM attendance;');
    const crInv = await cr.query('SELECT COUNT(*) FROM fee_invoices;');
    const crSch = await cr.query('SELECT COUNT(*) FROM schools;');
    console.log('🪳 COCKROACHDB:');
    console.log(`  • Schools     : ${crSch.rows[0].count}`);
    console.log(`  • Students    : ${crStu.rows[0].count}`);
    console.log(`  • Teachers    : ${crTea.rows[0].count}`);
    console.log(`  • Classes     : ${crCls.rows[0].count}`);
    console.log(`  • Attendance  : ${crAtt.rows[0].count}`);
    console.log(`  • Fee Invoices: ${crInv.rows[0].count}`);
    await cr.end();
  } catch (e) {
    console.error('CockroachDB error:', e.message);
  }

  // 2. MongoDB Atlas
  try {
    const mg = new MongoClient(MONGO_URI);
    await mg.connect();
    const db = mg.db('edugit');
    const mgStu = await db.collection('students').countDocuments();
    const mgTea = await db.collection('teachers').countDocuments();
    const mgCls = await db.collection('classes').countDocuments();
    const mgAtt = await db.collection('attendance').countDocuments();
    const mgInv = await db.collection('fee_invoices').countDocuments();
    const mgSch = await db.collection('schools').countDocuments();
    console.log('\n🍃 MONGODB ATLAS:');
    console.log(`  • Schools     : ${mgSch}`);
    console.log(`  • Students    : ${mgStu}`);
    console.log(`  • Teachers    : ${mgTea}`);
    console.log(`  • Classes     : ${mgCls}`);
    console.log(`  • Attendance  : ${mgAtt}`);
    console.log(`  • Fee Invoices: ${mgInv}`);
    await mg.close();
  } catch (e) {
    console.error('MongoDB Atlas error:', e.message);
  }

  // 3. Local Store
  const store = JSON.parse(fs.readFileSync('data/erp_store.json', 'utf8'));
  console.log('\n💾 LOCAL STORE (data/erp_store.json):');
  console.log(`  • Schools     : ${store.schools?.length || 0}`);
  console.log(`  • Students    : ${store.students?.length || 0}`);
  console.log(`  • Teachers    : ${store.teachers?.length || 0}`);
  console.log(`  • Classes     : ${store.classes?.length || 0}`);
  console.log(`  • Attendance  : ${store.attendance?.length || 0}`);
  console.log(`  • Fee Invoices: ${store.fee_invoices?.length || 0}`);
}

checkCounts().catch(console.error);
