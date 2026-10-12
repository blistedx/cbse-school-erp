const fs = require('fs');
require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('edugit');
  const teachers = await db.collection('teachers').find({
    $or: [{ full_name: /Abhishek/i }, { staff_code: /PRIN/i }]
  }).toArray();
  console.log('MongoDB teachers matching Abhishek or PRIN:');
  console.log(teachers);

  const store = JSON.parse(fs.readFileSync('data/erp_store.json', 'utf8'));
  const storeTeachers = (store.teachers || []).filter(t => /Abhishek/i.test(t.full_name) || /PRIN/i.test(t.staff_code));
  console.log('erp_store.json teachers matching Abhishek or PRIN:');
  console.log(storeTeachers);

  await client.close();
}
check();
