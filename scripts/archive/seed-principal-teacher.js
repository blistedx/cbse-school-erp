/**
 * Insert or upsert the School Principal into the teachers collection in MongoDB Atlas
 * and data/erp_store.json so the Principal is permanently listed in All Faculties.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

const PRINCIPAL_DOC = {
  id: 'TCH-PRIN-DPS2026',
  school_id: 'DPS2026',
  academic_session: '2026-27',
  staff_code: 'PRIN-01',
  full_name: 'Abhishek Shukla',
  designation: 'Principal & Head of Institution',
  department: 'Leadership & Administration',
  subject_specialization: 'Institutional Governance & CBSE Pedagogy',
  classes_taught: 'Senior School / Institutional Head',
  email: 'emmalover4317@gmail.com',
  phone: '+91 11 4987 6543',
  qualification: 'Ph.D, M.Ed, M.Sc (CBSE Certified Administrator)',
  experience_years: 18,
  gender: 'Male',
  joining_date: '2018-04-01',
  salary: 135000,
  attendance_percent: 100,
  status: 'ACTIVE',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  passcode: '123456',
  role: 'PRINCIPAL',
  created_at: new Date().toISOString()
};

async function seedPrincipal() {
  console.log('🌱 Seeding Principal into Faculty & Staff Registry...');

  // 1. Sync data/erp_store.json
  const storePath = path.join(process.cwd(), 'data', 'erp_store.json');
  if (fs.existsSync(storePath)) {
    try {
      const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (!Array.isArray(storeData.teachers)) storeData.teachers = [];
      const existingIdx = storeData.teachers.findIndex(
        t => t.id === PRINCIPAL_DOC.id || t.staff_code === 'PRIN-01' || t.full_name === 'Abhishek Shukla'
      );
      if (existingIdx >= 0) {
        storeData.teachers[existingIdx] = { ...storeData.teachers[existingIdx], ...PRINCIPAL_DOC };
        console.log('✅ Updated Principal in data/erp_store.json');
      } else {
        storeData.teachers.unshift(PRINCIPAL_DOC);
        console.log('✅ Added Principal to data/erp_store.json');
      }
      fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf8');
    } catch (e) {
      console.error('⚠️ Error updating data/erp_store.json:', e.message);
    }
  }

  // 2. Sync MongoDB Atlas
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('edugit');
      const teachersColl = db.collection('teachers');

      await teachersColl.updateOne(
        {
          $or: [
            { id: PRINCIPAL_DOC.id },
            { staff_code: 'PRIN-01' },
            { full_name: 'Abhishek Shukla', school_id: 'DPS2026' }
          ]
        },
        { $set: PRINCIPAL_DOC },
        { upsert: true }
      );

      const count = await teachersColl.countDocuments({ school_id: 'DPS2026' });
      const prin = await teachersColl.findOne({ staff_code: 'PRIN-01' });
      console.log(`✅ MongoDB Atlas updated! Total teachers for DPS2026: ${count}`);
      console.log(`✅ Principal in DB: ${prin?.full_name} (${prin?.designation}) - Role: ${prin?.role}`);
    } catch (err) {
      console.error('❌ MongoDB Atlas error:', err.message);
    } finally {
      await client.close();
    }
  }

  console.log('🎉 Principal Faculty registration completed successfully!');
}

seedPrincipal();
