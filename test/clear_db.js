const { Pool } = require('pg');
require('dotenv').config();

async function clearOnlineDatabase() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to PostgreSQL database:', connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'NONE');
  
  if (!connectionString) {
    console.log('No DATABASE_URL found.');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully!');

    // Get all tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);

    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables in online DB:', tableNames);

    for (const t of tableNames) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`Table "${t}" row count before deletion:`, countRes.rows[0].count);
    }

    // Truncate / delete all data from these tables with CASCADE
    if (tableNames.length > 0) {
      const truncateQuery = `TRUNCATE TABLE ${tableNames.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
      console.log('Executing:', truncateQuery);
      await client.query(truncateQuery);
      console.log('Successfully truncated all tables in online PostgreSQL database!');
    }

    client.release();
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    await pool.end();
  }
}

clearOnlineDatabase();
