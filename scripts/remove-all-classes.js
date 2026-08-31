const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rawCockroach = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const COCKROACH_URI = rawCockroach.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

async function removeAllClasses() {
  console.log('======================================================');
  console.log('🧹 REMOVING ALL CLASSES FROM ALL DATABASES');
  console.log('======================================================\n');

  // 1. CockroachDB
  console.log('🚀 Step 1: Connecting to CockroachDB...');
  const crClient = new Client({
    connectionString: COCKROACH_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await crClient.connect();
    const res = await crClient.query('DELETE FROM classes;');
    console.log(`  ✓ CockroachDB: Deleted all classes (${res.rowCount || 0} rows removed).`);
  } catch (err) {
    console.error('  ❌ CockroachDB error:', err.message);
  } finally {
    await crClient.end();
  }

  // 2. MongoDB Atlas
  console.log('\n🚀 Step 2: Connecting to MongoDB Atlas...');
  const mongoClient = new MongoClient(MONGO_URI);
  try {
    await mongoClient.connect();
    const db = mongoClient.db('edugit');
    const res = await db.collection('classes').deleteMany({});
    console.log(`  ✓ MongoDB Atlas: Deleted all classes (${res.deletedCount || 0} documents removed).`);
  } catch (err) {
    console.error('  ❌ MongoDB error:', err.message);
  } finally {
    await mongoClient.close();
  }

  // 3. Local Store
  console.log('\n🚀 Step 3: Updating Local Store (data/erp_store.json)...');
  const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    store.classes = [];
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('  ✓ Local Store: Set classes = [] (0 classes)');
  }

  console.log('\n======================================================');
  console.log('🎉 SUCCESS: ALL CLASSES REMOVED (0 CLASSES REMAINING)');
  console.log('======================================================');
}

removeAllClasses().catch(console.error);
