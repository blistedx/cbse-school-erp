const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

async function checkAttendance() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const today = new Date().toISOString().split('T')[0];
  console.log('Today:', today);

  const allAtt = await db.collection('attendance').find({}).toArray();
  console.log(`Total attendance records in Atlas: ${allAtt.length}`);
  
  const facultyRecords = allAtt.filter(a => (a.class_name || '').toLowerCase() === 'faculty' || (a.class_name || '').toLowerCase() === 'staff');
  console.log('Faculty records in Atlas:', JSON.stringify(facultyRecords, null, 2));

  const store = JSON.parse(fs.readFileSync('data/erp_store.json', 'utf8'));
  const storeFac = (store.attendance || []).filter(a => (a.class_name || '').toLowerCase() === 'faculty' || (a.class_name || '').toLowerCase() === 'staff');
  console.log('Faculty records in erp_store.json:', JSON.stringify(storeFac, null, 2));

  await client.close();
}

checkAttendance().catch(console.error);
