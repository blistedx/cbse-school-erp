const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

async function verifyAndSync() {
  console.log('Connecting to MongoDB Atlas Cluster (edugit)...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');
  const store = JSON.parse(fs.readFileSync('data/erp_store.json', 'utf8'));

  // Ensure Compound Hierarchy Indexes (school_id + academic_session)
  console.log('\n1. Creating Compound Hierarchy Indexes in MongoDB Atlas:');
  await db.collection('students').createIndex({ school_id: 1, academic_session: 1, admission_no: 1 });
  await db.collection('teachers').createIndex({ school_id: 1, academic_session: 1, staff_code: 1 });
  await db.collection('classes').createIndex({ school_id: 1, academic_session: 1, class_name: 1, section: 1 });
  await db.collection('attendance').createIndex({ school_id: 1, academic_session: 1, date: -1 });
  await db.collection('fee_invoices').createIndex({ school_id: 1, academic_session: 1, invoice_no: 1 });
  await db.collection('notices').createIndex({ school_id: 1, academic_session: 1, created_at: -1 });
  console.log('✅ Compound indexes created successfully!');

  console.log('\n2. Syncing Documents into MongoDB Collections with school_id + academic_session:');
  for (const colName of ['schools', 'students', 'teachers', 'classes', 'fee_invoices', 'attendance', 'notices']) {
    const items = store[colName] || [];
    if (items.length > 0) {
      const ops = items.map(item => {
        const { _id, ...clean } = item;
        if (colName !== 'schools' && !clean.academic_session) {
          clean.academic_session = '2026-27';
        }
        return {
          updateOne: {
            filter: { id: clean.id },
            update: { $set: clean },
            upsert: true
          }
        };
      });
      const res = await db.collection(colName).bulkWrite(ops);
      console.log(`✅ ${colName.padEnd(14)}: Synced ${res.upsertedCount + res.modifiedCount + res.matchedCount} documents`);
    }
  }

  console.log('\n3. VERIFIED LIVE ATLAS DOCUMENTS:');
  for (const colName of ['schools', 'students', 'teachers', 'classes', 'fee_invoices', 'attendance', 'notices']) {
    const count = await db.collection(colName).countDocuments();
    const indexes = await db.collection(colName).indexes();
    const sample = await db.collection(colName).findOne();
    console.log(`\n======================================================`);
    console.log(`COLLECTION: [ ${colName} ] (Live Atlas Count: ${count})`);
    console.log(`INDEXES:`, JSON.stringify(indexes.map(i => i.key)));
    console.log(`SAMPLE STORED DOCUMENT:`);
    console.log(JSON.stringify(sample, null, 2));
  }

  await client.close();
}

verifyAndSync().catch(console.error);
