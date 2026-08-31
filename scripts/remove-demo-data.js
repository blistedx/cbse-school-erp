const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP";

async function removeDemoData() {
  console.log('====================================================');
  console.log('CLEANING UP DEMO DATA (5,000 STUDENTS & MOCK RECORDS)');
  console.log('====================================================');

  const schoolId = 'DPS2026';

  // 1. Reset local store
  const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
  if (fs.existsSync(storePath)) {
    const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    data.students = [];
    data.fee_invoices = [];
    data.attendance = [];
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ Local data/erp_store.json cleaned up!');
  }

  // 2. Remove from MongoDB Atlas
  try {
    const client = new MongoClient(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 10000
    });

    await client.connect();
    const db = client.db('edugit');

    const resStudents = await db.collection('students').deleteMany({ school_id: schoolId });
    const resInvoices = await db.collection('fee_invoices').deleteMany({ school_id: schoolId });
    const resAttendance = await db.collection('attendance').deleteMany({ school_id: schoolId });

    console.log(`✅ MongoDB Atlas: Deleted ${resStudents.deletedCount} students`);
    console.log(`✅ MongoDB Atlas: Deleted ${resInvoices.deletedCount} fee invoices`);
    console.log(`✅ MongoDB Atlas: Deleted ${resAttendance.deletedCount} attendance records`);

    await client.close();
    console.log('Demo Data Removal Complete!');
  } catch (err) {
    console.error('MongoDB Atlas cleanup error:', err.message);
  }
}

removeDemoData().catch(console.error);
