/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Seed MongoDB with Initial Demo School & Admin Account
 * Run with: node test/seed_mongodb.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found.');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('edugit');

    const schoolsCol = db.collection('schools');
    const existingCount = await schoolsCol.countDocuments();

    if (existingCount === 0) {
      console.log('🌱 Seeding initial demo school into MongoDB Atlas...');
      await schoolsCol.insertOne({
        id: 'SCH-DEMO-2026',
        school_code: 'DPS-2026',
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

      const studentsCol = db.collection('students');
      await studentsCol.insertMany([
        {
          id: 'STU-101',
          school_id: 'DPS-2026',
          admission_no: 'DPS-2026-001',
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
          id: 'STU-102',
          school_id: 'DPS-2026',
          admission_no: 'DPS-2026-002',
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

      const teachersCol = db.collection('teachers');
      await teachersCol.insertOne({
        id: 'TCH-201',
        school_id: 'DPS-2026',
        staff_code: 'TCH-001',
        full_name: 'Pooja Iyer',
        department: 'Mathematics & Science',
        designation: 'Senior Faculty',
        qualification: 'M.Sc, B.Ed',
        phone: '+91 98123 45678',
        email: 'pooja.iyer@dps.edu',
        status: 'ACTIVE',
        passcode: '123456'
      });

      const classesCol = db.collection('classes');
      await classesCol.insertOne({
        id: 'CLS-101',
        school_id: 'DPS-2026',
        class_name: 'Class 10',
        section: 'A',
        class_teacher: 'Pooja Iyer',
        room_no: 'Room 204',
        capacity: 40
      });

      const noticesCol = db.collection('notices');
      await noticesCol.insertOne({
        id: 'NOT-101',
        school_id: 'DPS-2026',
        title: 'Mid-Term Examinations Schedule Announced',
        content: 'Mid-term examinations for classes 9th to 12th will commence next week. Detailed timetable is available on the student portal.',
        target_audience: 'ALL',
        posted_by: 'Principal Office',
        created_at: new Date().toISOString()
      });

      console.log('✅ Demo school, students, teacher, class, and notice seeded successfully!');
    } else {
      console.log(`ℹ️ MongoDB already has ${existingCount} school(s) present.`);
    }
  } catch (e) {
    console.error('Seeding error:', e.message);
  } finally {
    await client.close();
  }
}

seed();
