import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Error: MONGODB_URI is not defined in .env or .env.local');
  process.exit(1);
}

function cleanDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  if (_id && typeof _id.toString === 'function' && !rest.id && !rest._id) {
    rest.id = _id.toString();
  }
  return rest;
}

async function pullAtlasToLocal() {
  console.log('🔄 Connecting to MongoDB Atlas Cloud...');
  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas Cloud (edugit)!');
    const db = client.db('edugit');

    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:`, collections.map(c => c.name).join(', '));

    const localData = {
      schools: [],
      demo_requests: [],
      users: [],
      students: [],
      teachers: [],
      classes: [],
      timetable: [],
      notices: [],
      attendance: [],
      fee_invoices: [],
      fee_receipts: [],
      fee_ledger: [],
      holidays: [],
      exams: [],
      agency_settings: {}
    };

    // 1. Schools
    if (collections.some(c => c.name === 'schools')) {
      const schools = await db.collection('schools').find({}).toArray();
      localData.schools = schools.map(cleanDoc);
      console.log(`🏫 Schools pulled: ${localData.schools.length}`);
    }

    // 2. Users
    if (collections.some(c => c.name === 'users')) {
      const users = await db.collection('users').find({}).toArray();
      localData.users = users.map(cleanDoc);
      console.log(`👤 Users pulled: ${localData.users.length}`);
    }

    // 3. Students
    if (collections.some(c => c.name === 'students')) {
      const students = await db.collection('students').find({}).toArray();
      localData.students = students.map(cleanDoc);
      console.log(`🎓 Students pulled: ${localData.students.length}`);
    }

    // 4. Teachers
    if (collections.some(c => c.name === 'teachers')) {
      const teachers = await db.collection('teachers').find({}).toArray();
      localData.teachers = teachers.map(cleanDoc);
      console.log(`👨‍🏫 Faculty/Staff pulled: ${localData.teachers.length}`);
    }

    // 5. Classes
    if (collections.some(c => c.name === 'classes')) {
      const classes = await db.collection('classes').find({}).toArray();
      localData.classes = classes.map(cleanDoc);
      console.log(`📚 Classes pulled: ${localData.classes.length}`);
    }

    // 6. Attendance
    if (collections.some(c => c.name === 'attendance')) {
      const attendance = await db.collection('attendance').find({}).toArray();
      localData.attendance = attendance.map(cleanDoc);
      console.log(`📅 Attendance records pulled: ${localData.attendance.length}`);
    }

    // 7. Fee Receipts & Invoices & Ledger
    if (collections.some(c => c.name === 'fee_receipts')) {
      const receipts = await db.collection('fee_receipts').find({}).toArray();
      localData.fee_receipts = receipts.map(cleanDoc);
      console.log(`🧾 Fee Receipts pulled: ${localData.fee_receipts.length}`);
    }
    if (collections.some(c => c.name === 'fee_invoices')) {
      const invoices = await db.collection('fee_invoices').find({}).toArray();
      localData.fee_invoices = invoices.map(cleanDoc);
      console.log(`💳 Fee Invoices pulled: ${localData.fee_invoices.length}`);
    }
    if (collections.some(c => c.name === 'fee_ledger')) {
      const ledger = await db.collection('fee_ledger').find({}).toArray();
      localData.fee_ledger = ledger.map(cleanDoc);
      console.log(`📖 Fee Ledger lines pulled: ${localData.fee_ledger.length}`);
    }

    // 8. Notices
    if (collections.some(c => c.name === 'notices')) {
      const notices = await db.collection('notices').find({}).toArray();
      localData.notices = notices.map(cleanDoc);
      console.log(`📢 Notices pulled: ${localData.notices.length}`);
    }

    // 9. Holidays
    if (collections.some(c => c.name === 'holidays')) {
      const holidays = await db.collection('holidays').find({}).toArray();
      localData.holidays = holidays.map(cleanDoc);
      console.log(`🌴 Holidays pulled: ${localData.holidays.length}`);
    }

    // 10. Exams
    if (collections.some(c => c.name === 'exams')) {
      const exams = await db.collection('exams').find({}).toArray();
      localData.exams = exams.map(cleanDoc);
      console.log(`📝 Exams pulled: ${localData.exams.length}`);
    }

    // 11. Timetable
    if (collections.some(c => c.name === 'timetable')) {
      const timetable = await db.collection('timetable').find({}).toArray();
      localData.timetable = timetable.map(cleanDoc);
      console.log(`⏰ Timetable pulled: ${localData.timetable.length}`);
    }

    // 12. Demo Requests
    if (collections.some(c => c.name === 'demo_requests')) {
      const demo = await db.collection('demo_requests').find({}).toArray();
      localData.demo_requests = demo.map(cleanDoc);
      console.log(`✉️ Demo Requests pulled: ${localData.demo_requests.length}`);
    }

    // 13. Agency Settings
    if (collections.some(c => c.name === 'agency_settings')) {
      const agency = await db.collection('agency_settings').findOne({});
      if (agency) localData.agency_settings = cleanDoc(agency);
    }

    // Write to data/erp_store.json
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const storePath = path.join(dataDir, 'erp_store.json');
    fs.writeFileSync(storePath, JSON.stringify(localData, null, 2), 'utf8');
    console.log(`\n💾 Successfully written complete database to: ${storePath}`);

    // Check media_vault
    if (collections.some(c => c.name === 'media_vault')) {
      const mediaFiles = await db.collection('media_vault').find({}).toArray();
      console.log(`🖼️ Media Vault files in Atlas: ${mediaFiles.length}`);
      const mediaDir = path.join(dataDir, 'media');
      const filesDir = path.join(mediaDir, 'files');
      if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });

      for (const item of mediaFiles) {
        try {
          const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, '_');
          fs.writeFileSync(path.join(mediaDir, `${safeId}.json`), JSON.stringify(cleanDoc(item), null, 2), 'utf8');
          if (item.data) {
            let buffer;
            if (item.data.startsWith('data:')) {
              buffer = Buffer.from(item.data.split(',')[1] || '', 'base64');
            } else {
              buffer = Buffer.from(item.data, 'base64');
            }
            fs.writeFileSync(path.join(filesDir, `${safeId}.bin`), buffer);
          }
        } catch (e) {
          // ignore individual media write errors
        }
      }
      console.log(`✅ Saved ${mediaFiles.length} media vault items to local disk.`);
    }

    console.log('\n🎉 Atlas -> Local Store Complete!');
  } catch (err) {
    console.error('❌ Error during Atlas pull:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

pullAtlasToLocal();
