const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

async function run() {
  console.log('Connecting to MongoDB...');
  const mg = new MongoClient(process.env.MONGODB_URI);
  await mg.connect();
  const db = mg.db('edugit');
  
  const total = await db.collection('students').countDocuments();
  console.log('Total students:', total);
  
  const sample = await db.collection('students').findOne({});
  console.log('Sample student structure:', sample);

  const students = await db.collection('students').find({}).toArray();
  const genderCounts = {};
  students.forEach(s => {
    const g = s.gender || 'UNDEFINED';
    genderCounts[g] = (genderCounts[g] || 0) + 1;
  });
  console.log('Gender breakdown:', genderCounts);

  // Check if erp_store.json has any students
  try {
    const store = JSON.parse(fs.readFileSync('data/erp_store.json', 'utf8'));
    console.log('Local store students:', store.students?.length || 0);
  } catch (e) {
    console.log('Local store read error:', e.message);
  }

  await mg.close();
}

run().catch(console.error);
