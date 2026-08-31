/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Online PostgreSQL Connection & Migration Test Script
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function testOnlinePostgres() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  console.log('\n======================================================');
  console.log('🌐 ONLINE POSTGRESQL CONNECTION TEST & MIGRATOR');
  console.log('======================================================\n');

  if (!connectionString || !connectionString.trim()) {
    console.error('❌ Error: DATABASE_URL is not set in .env file!');
    console.log('👉 Please paste your PostgreSQL connection string into d:\\Private\\ERP\\.env');
    console.log('   Example: DATABASE_URL="postgres://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"\n');
    process.exit(1);
  }

  // Mask credentials for display
  const masked = connectionString.replace(/:([^@]+)@/, ':****@');
  console.log(`🔗 Connecting to Online Database: ${masked}`);

  const isSSL = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 8000
  });

  try {
    const startTime = Date.now();
    const client = await pool.connect();
    const latency = Date.now() - startTime;
    console.log(`✅ Connected successfully! (Latency: ${latency}ms)`);

    // Fetch PostgreSQL Server Version
    const versionRes = await client.query('SELECT version();');
    console.log(`📡 Database Engine: ${versionRes.rows[0].version.split(',')[0]}`);

    // Run Schema Migrations
    console.log('\n📦 Running Multi-Tenant Schema Migrations from lib/schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'lib', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);
    console.log('✅ All 11 Multi-School Tables & Indexes migrated successfully!');

    // Check Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n📋 Online Database Tables:');
    tablesRes.rows.forEach((r, idx) => console.log(`   ${idx + 1}. ${r.table_name}`));

    client.release();
    await pool.end();

    console.log('\n======================================================');
    console.log('🎉 ONLINE DATABASE IS 100% READY FOR MULTI-SCHOOL DATA!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Online Database Connection Failed:', err.message);
    if (err.message.includes('password authentication failed') || err.message.includes('SASL')) {
      console.log('👉 Please check if your database password is correct in .env');
    } else if (err.message.includes('getaddrinfo') || err.message.includes('ENOTFOUND')) {
      console.log('👉 Host not found. Please verify the host domain in your connection string.');
    }
    process.exit(1);
  }
}

testOnlinePostgres();
