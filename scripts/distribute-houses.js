/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { Client } = require('pg');
require('dotenv').config();

const HOUSES = [
  { name: 'Red House', color: '#EF4444', code: 'RED', description: 'Courage, Energy & Leadership' },
  { name: 'Yellow House', color: '#EAB308', code: 'YEL', description: 'Wisdom, Innovation & Intellect' },
  { name: 'Blue House', color: '#3B82F6', code: 'BLU', description: 'Loyalty, Integrity & Truth' },
  { name: 'Green House', color: '#10B981', code: 'GRN', description: 'Harmony, Growth & Perseverance' }
];

async function run() {
  console.log('🏛️ Distributing 4 School Houses (Red, Yellow, Blue, Green)...');
  const storePath = path.join(process.cwd(), 'data', 'erp_store.json');
  if (!fs.existsSync(storePath)) {
    console.error('data/erp_store.json not found!');
    return;
  }

  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. Update School Records
  if (Array.isArray(store.schools)) {
    store.schools.forEach(school => {
      school.houses = HOUSES;
    });
  }

  // 2. Distribute Students
  const houseCounts = { 'Red House': 0, 'Yellow House': 0, 'Blue House': 0, 'Green House': 0 };
  if (Array.isArray(store.students)) {
    store.students.forEach((student, index) => {
      const houseObj = HOUSES[index % HOUSES.length];
      student.house = houseObj.name;
      houseCounts[houseObj.name]++;
    });
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ Updated local data/erp_store.json with house distribution:', houseCounts);

  // 3. Update MongoDB Atlas if available
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db('edugit');

      // Update school
      await db.collection('schools').updateMany(
        {},
        { $set: { houses: HOUSES } }
      );

      // Update students
      const bulkOps = store.students.map(s => ({
        updateOne: {
          filter: { id: s.id },
          update: { $set: { house: s.house } }
        }
      }));

      if (bulkOps.length > 0) {
        await db.collection('students').bulkWrite(bulkOps);
      }
      console.log('✅ Synced 4 houses to MongoDB Atlas collections (schools, students)!');
      await client.close();
    } catch (err) {
      console.warn('⚠️ MongoDB Atlas sync warning:', err.message);
    }
  }

  // 4. Update CockroachDB if available
  const rawCockroach = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL;
  if (rawCockroach) {
    try {
      const crUri = rawCockroach.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');
      const crClient = new Client({ connectionString: crUri, ssl: { rejectUnauthorized: false } });
      await crClient.connect();
      console.log('Connecting to CockroachDB...');

      for (const s of store.students) {
        await crClient.query('UPDATE students SET house = $1 WHERE id = $2;', [s.house, s.id]);
      }
      console.log('✅ Synced 4 houses to CockroachDB students table!');
      await crClient.end();
    } catch (err) {
      console.warn('⚠️ CockroachDB sync warning:', err.message);
    }
  }

  console.log('🎉 All 4 Houses (Red, Yellow, Blue, Green) successfully configured and distributed!');
}

run().catch(console.error);
