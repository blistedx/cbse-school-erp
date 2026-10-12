/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { Client } = require('pg');
require('dotenv').config();

const rawCockroach = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const COCKROACH_URI = rawCockroach.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');

async function setupMediaVault(retries = 3) {
  for (let i = 0; i < retries; i++) {
    const client = new Client({
      connectionString: COCKROACH_URI,
      ssl: { rejectUnauthorized: false }
    });

    try {
      console.log(`🚀 Connecting to CockroachDB (Attempt ${i + 1}/${retries})...`);
      await client.connect();
      console.log('  ✓ Connected to CockroachDB');

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS media_vault (
          id VARCHAR(100) PRIMARY KEY,
          school_id VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(100),
          filename VARCHAR(255),
          mime_type VARCHAR(100) DEFAULT 'image/jpeg',
          size_bytes INT DEFAULT 0,
          data TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_media_entity ON media_vault(school_id, entity_type, entity_id);
      `;

      await client.query(createTableSql);
      console.log('  ✓ Table "media_vault" created and indexed in CockroachDB!');

      const count = await client.query('SELECT COUNT(*) FROM media_vault;');
      console.log(`  • Current Media Vault Files: ${count.rows[0].count}`);

      await client.end();
      console.log('======================================================');
      console.log('🎉 CockroachDB Dedicated Media Vault Ready!');
      console.log('======================================================');
      return;
    } catch (err) {
      console.error(`  ❌ Attempt ${i + 1} failed:`, err.message);
      try { await client.end(); } catch (e) {}
      if (i < retries - 1) {
        console.log('  Retrying in 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
}

setupMediaVault().catch(console.error);
