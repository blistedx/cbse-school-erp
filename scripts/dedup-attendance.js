/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');
const { MongoClient } = require('mongodb');

async function cleanAttendanceDuplicates() {
  const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const allAttendance = await db.collection('attendance').find({}).toArray();
  console.log(`Found ${allAttendance.length} attendance records in MongoDB Atlas.`);

  // Deduplicate: key = school_id + academic_session + date + class_name + section
  const map = new Map();
  const toDelete = [];

  for (const doc of allAttendance) {
    const key = `${doc.school_id || ''}_${doc.academic_session || ''}_${doc.date || ''}_${(doc.class_name || '').toLowerCase()}_${(doc.section || '').toLowerCase()}`;
    if (map.has(key)) {
      toDelete.push(doc._id);
    } else {
      map.set(key, doc);
    }
  }

  if (toDelete.length > 0) {
    const delRes = await db.collection('attendance').deleteMany({ _id: { $in: toDelete } });
    console.log(`Deleted ${delRes.deletedCount} duplicate attendance records from Atlas.`);
  } else {
    console.log('No duplicate attendance records found in Atlas.');
  }

  // Also clean local store
  const storeFile = 'data/erp_store.json';
  if (fs.existsSync(storeFile)) {
    const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    const storeMap = new Map();
    (store.attendance || []).forEach(a => {
      const key = `${a.school_id || ''}_${a.academic_session || ''}_${a.date || ''}_${(a.class_name || '').toLowerCase()}_${(a.section || '').toLowerCase()}`;
      storeMap.set(key, a);
    });
    store.attendance = Array.from(storeMap.values());
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
    console.log(`Cleaned local erp_store.json attendance records. Now count: ${store.attendance.length}`);
  }

  await client.close();
}

cleanAttendanceDuplicates().catch(console.error);
