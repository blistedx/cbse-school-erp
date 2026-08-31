/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * MongoDB Data Normalization & Migration Script
 * Migrates all records to use clean unhyphenated school code 'DPS2026' and user IDs 'DPS2026001', etc.
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function migrateData() {
  console.log('='.repeat(60));
  console.log('🔄 MIGRATING ALL DATA & USER IDS TO DPS2026');
  console.log('='.repeat(60));

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found.');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('edugit');

    // 1. Schools Collection: Update DPS-2026 to DPS2026
    console.log('🏫 Updating schools collection...');
    await db.collection('schools').deleteMany({ school_code: { $in: ['DPS-2026', 'DPS2026'] } });
    await db.collection('schools').insertOne({
      id: 'DPS2026',
      school_code: 'DPS2026',
      school_name: 'Delhi Public International School',
      board: 'CBSE',
      city: 'New Delhi',
      state: 'Delhi',
      principal_name: 'Dr. Rajesh Sharma',
      admin_id: 'admin',
      admin_name: 'Dr. Rajesh Sharma',
      admin_pin: '123456',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    });

    // 2. Students Collection: Update school_id to DPS2026 and admission_no to DPS2026001
    console.log('🎓 Updating students collection...');
    await db.collection('students').deleteMany({ school_id: { $in: ['DPS-2026', 'SCH-DEMO-2026', 'DPS2026'] } });
    await db.collection('students').insertMany([
      {
        id: 'STU101',
        school_id: 'DPS2026',
        admission_no: 'DPS2026001',
        full_name: 'Aarav Sharma',
        class_name: 'Class 10',
        section: 'A',
        roll_no: '1',
        gender: 'Male',
        guardian_name: 'Rajesh Sharma',
        guardian_phone: '+91 98765 43210',
        fee_status: 'PAID',
        attendance_percent: 96,
        status: 'ACTIVE',
        passcode: '123456',
        created_at: new Date().toISOString()
      },
      {
        id: 'STU102',
        school_id: 'DPS2026',
        admission_no: 'DPS2026002',
        full_name: 'Ananya Verma',
        class_name: 'Class 10',
        section: 'A',
        roll_no: '2',
        gender: 'Female',
        guardian_name: 'Suresh Verma',
        guardian_phone: '+91 98765 43211',
        fee_status: 'PENDING',
        attendance_percent: 92,
        status: 'ACTIVE',
        passcode: '123456',
        created_at: new Date().toISOString()
      }
    ]);

    // 3. Teachers Collection: Update school_id to DPS2026 and staff_code to DPS2026T01
    console.log('👩‍🏫 Updating teachers collection...');
    await db.collection('teachers').deleteMany({ school_id: { $in: ['DPS-2026', 'SCH-DEMO-2026', 'DPS2026'] } });
    await db.collection('teachers').insertMany([
      {
        id: 'TCH201',
        school_id: 'DPS2026',
        staff_code: 'DPS2026T01',
        full_name: 'Pooja Iyer',
        department: 'Mathematics',
        designation: 'Senior Faculty',
        qualification: 'M.Sc, B.Ed',
        phone: '+91 98123 45678',
        email: 'pooja.iyer@dps.edu',
        status: 'ACTIVE',
        passcode: '123456'
      },
      {
        id: 'TCH202',
        school_id: 'DPS2026',
        staff_code: 'DPS2026T02',
        full_name: 'Dr. V. Raman',
        department: 'Physics',
        designation: 'PGT Lead',
        qualification: 'Ph.D, M.Sc',
        phone: '+91 98123 45679',
        email: 'v.raman@dps.edu',
        status: 'ACTIVE',
        passcode: '123456'
      }
    ]);

    // 4. Classes Collection
    console.log('📚 Updating classes collection...');
    await db.collection('classes').deleteMany({ school_id: { $in: ['DPS-2026', 'SCH-DEMO-2026', 'DPS2026'] } });
    await db.collection('classes').insertOne({
      id: 'CLS101',
      school_id: 'DPS2026',
      class_name: 'Class 10',
      section: 'A',
      class_teacher: 'Pooja Iyer',
      room_no: 'Room 204',
      capacity: 40
    });

    // 5. Notices Collection
    console.log('📢 Updating notices collection...');
    await db.collection('notices').deleteMany({ school_id: { $in: ['DPS-2026', 'SCH-DEMO-2026', 'DPS2026'] } });
    await db.collection('notices').insertOne({
      id: 'NOT101',
      school_id: 'DPS2026',
      title: 'Mid-Term Examinations Schedule Announced',
      content: 'Mid-term examinations for classes 9th to 12th will commence next week.',
      target_audience: 'ALL',
      posted_by: 'Principal Office',
      created_at: new Date().toISOString()
    });

    // 6. Fee Invoices Collection
    console.log('💳 Updating fee invoices...');
    await db.collection('fee_invoices').deleteMany({ school_id: { $in: ['DPS-2026', 'SCH-DEMO-2026', 'DPS2026'] } });
    await db.collection('fee_invoices').insertOne({
      id: 'INV101',
      school_id: 'DPS2026',
      invoice_no: 'INV2026001',
      student_name: 'Aarav Sharma',
      admission_no: 'DPS2026001',
      class_name: 'Class 10 - A',
      amount: 15000,
      tuition_fee: 12000,
      transport_fee: 2000,
      exam_fee: 1000,
      due_date: '2026-09-15',
      status: 'PAID',
      payment_mode: 'UPI / Online',
      paid_date: new Date().toISOString().split('T')[0]
    });

    // Also update local store if exists
    const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');
    if (fs.existsSync(localStorePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
        if (Array.isArray(store.schools)) {
          store.schools.forEach(s => {
            if (s.school_code === 'DPS-2026') {
              s.school_code = 'DPS2026';
              s.id = 'DPS2026';
            }
          });
        }
        if (Array.isArray(store.students)) {
          store.students.forEach(s => {
            if (s.school_id === 'DPS-2026' || s.school_id === 'SCH-DEMO-2026') {
              s.school_id = 'DPS2026';
              s.admission_no = s.admission_no.replace('DPS-2026-', 'DPS2026');
            }
          });
        }
        fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
      } catch (e) {}
    }

    console.log('✅ All data migrated to DPS2026, DPS2026001, DPS2026T01 successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.close();
  }
}

migrateData();
