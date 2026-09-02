/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

async function fullMongoSync() {
  console.log('Connecting to MongoDB Atlas Cluster (edugit)...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const storePath = path.join(process.cwd(), 'data', 'erp_store.json');
  const auditPath = path.join(process.cwd(), 'data', 'audit_logs.json');

  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  let auditLogs = [];
  try {
    if (fs.existsSync(auditPath)) {
      auditLogs = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    }
  } catch (e) {}

  const subPath = path.join(process.cwd(), 'data', 'push_subscriptions.json');
  let pushSubscriptions = [];
  try {
    if (fs.existsSync(subPath)) {
      pushSubscriptions = JSON.parse(fs.readFileSync(subPath, 'utf8'));
    }
  } catch (e) {}

  const broadcastPath = path.join(process.cwd(), 'data', 'broadcast_notifications.json');
  let broadcastNotifications = [];
  try {
    if (fs.existsSync(broadcastPath)) {
      broadcastNotifications = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
    }
  } catch (e) {}

  const collectionsToSync = {
    schools: store.schools || [],
    students: store.students || [],
    teachers: store.teachers || [],
    classes: store.classes || [],
    fee_invoices: store.fee_invoices || [],
    attendance: store.attendance || [],
    notices: store.notices || [],
    timetable: store.timetable || [],
    holidays: store.holidays || [],
    users: store.users || [],
    audit_logs: auditLogs,
    push_subscriptions: pushSubscriptions,
    broadcast_notifications: broadcastNotifications
  };

  console.log('\n--- 📤 Uploading & Syncing Data to MongoDB Atlas Cloud ---');
  for (const [colName, items] of Object.entries(collectionsToSync)) {
    if (items && items.length > 0) {
      const ops = items.map(item => {
        const { _id, ...clean } = item;
        const filter = clean.endpoint ? { endpoint: clean.endpoint } : (clean.id ? { id: clean.id } : (clean.invoice_no ? { invoice_no: clean.invoice_no } : (clean.email ? { email: clean.email } : clean)));
        return {
          updateOne: {
            filter: filter,
            update: { $set: clean },
            upsert: true
          }
        };
      });
      const res = await db.collection(colName).bulkWrite(ops);
      console.log(`✅ ${colName.padEnd(16)}: ${items.length} records synchronized`);
    } else {
      console.log(`ℹ️ ${colName.padEnd(16)}: 0 records (clean)`);
    }
  }

  // Ensure high-performance compound indexes
  console.log('\n--- ⚡ Creating Compound Indexes ---');
  await db.collection('students').createIndex({ school_id: 1, academic_session: 1, admission_no: 1 });
  await db.collection('teachers').createIndex({ school_id: 1, academic_session: 1, staff_code: 1 });
  await db.collection('classes').createIndex({ school_id: 1, academic_session: 1, class_name: 1, section: 1 });
  await db.collection('fee_invoices').createIndex({ school_id: 1, academic_session: 1, invoice_no: 1 });
  await db.collection('attendance').createIndex({ school_id: 1, academic_session: 1, date: -1 });
  await db.collection('notices').createIndex({ school_id: 1, academic_session: 1, created_at: -1 });
  console.log('✅ All indexes optimized.');

  console.log('\n--- 📊 Live MongoDB Atlas Collections Status ---');
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`📦 ${col.name.padEnd(18)}: ${count} documents in Atlas`);
  }

  await client.close();
  console.log('\n🎉 MongoDB Atlas Cloud Upload & Synchronization Complete!');
}

fullMongoSync().catch(err => {
  console.error('❌ MongoDB Sync Failed:', err);
  process.exit(1);
});
