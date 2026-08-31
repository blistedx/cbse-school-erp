const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rawCockroach = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const COCKROACH_URI = rawCockroach.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

// DPS School Emblem SVG Logo (Base64)
const dpsLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="dpsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#122A24"/>
      <stop offset="100%" stop-color="#1b3f36"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#dpsGrad)" stroke="#D4AF37" stroke-width="6"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="#D4AF37" stroke-width="2" stroke-dasharray="4,4"/>
  <path d="M100 35 L120 75 L165 75 L130 100 L145 145 L100 120 L55 145 L70 100 L35 75 L80 75 Z" fill="#D4AF37" opacity="0.25"/>
  <text x="100" y="90" font-size="32" font-family="Georgia, serif" font-weight="bold" fill="#D4AF37" text-anchor="middle">DPS</text>
  <text x="100" y="112" font-size="11" font-family="system-ui, sans-serif" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">SERVICE BEFORE SELF</text>
  <text x="100" y="132" font-size="10" font-family="system-ui, sans-serif" font-weight="600" fill="#a7f3d0" text-anchor="middle">DELHI PUBLIC SCHOOL</text>
  <circle cx="100" cy="155" r="4" fill="#D4AF37"/>
</svg>`;
const dpsLogoBase64 = `data:image/svg+xml;base64,${Buffer.from(dpsLogoSvg).toString('base64')}`;

const freshDpsSchool = {
  id: 'DPS2026',
  school_code: 'DPS2026',
  school_name: 'Delhi Public School',
  board: 'CBSE',
  city: 'New Delhi',
  state: 'Delhi',
  address: 'Sector 12, R.K. Puram, New Delhi',
  pincode: '110022',
  udise_code: '07010100101',
  oasis_code: '2130001',
  affiliation_no: 'CBSE/AFF/2130001',
  phone: '+91 11 4987 6543',
  email: 'principal@dpsrkp.edu.in',
  website: 'https://dpsrkp.net',
  established_year: '1972',
  principal_name: 'Dr. V. K. Sharma',
  admin_id: 'dpsadmin',
  admin_name: 'DPS System Administrator',
  admin_pin: '123456',
  logo: dpsLogoBase64,
  logo_url: dpsLogoBase64,
  status: 'ACTIVE',
  created_at: new Date().toISOString()
};

// Standard CBSE Classrooms & Subjects
const classDefinitions = [
  { name: 'Nursery', sections: ['A', 'B'] },
  { name: 'LKG', sections: ['A', 'B'] },
  { name: 'UKG', sections: ['A', 'B'] },
  { name: 'Class 1', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 2', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 3', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 4', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 5', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 6', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 7', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 8', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 9', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 10', sections: ['A', 'B', 'C', 'D'] },
  { name: 'Class 11 Science', sections: ['A', 'B'] },
  { name: 'Class 11 Commerce', sections: ['C'] },
  { name: 'Class 11 Humanities', sections: ['D'] },
  { name: 'Class 12 Science', sections: ['A', 'B'] },
  { name: 'Class 12 Commerce', sections: ['C'] },
  { name: 'Class 12 Humanities', sections: ['D'] },
];

const freshClasses = [];
let classIdx = 1;
for (const c of classDefinitions) {
  for (const sec of c.sections) {
    freshClasses.push({
      id: `CLS-DPS-${String(classIdx++).padStart(3, '0')}`,
      school_id: 'DPS2026',
      academic_session: '2026-27',
      class_name: c.name,
      section: sec,
      capacity: 40,
      room_no: `Room ${100 + classIdx}`,
      class_teacher_id: '',
      class_teacher_name: 'To be assigned',
      subjects: [
        { code: '001', name: 'English Core', type: 'CORE' },
        { code: '002', name: 'Mathematics', type: 'CORE' },
        { code: '003', name: 'General Science', type: 'CORE' },
        { code: '004', name: 'Social Science', type: 'CORE' },
        { code: '005', name: 'Hindi', type: 'LANGUAGE' },
        { code: '006', name: 'Computer Applications & AI', type: 'ELECTIVE' }
      ]
    });
  }
}

// Official CBSE 2026-27 Gazetted Holidays
const freshHolidays = [
  { id: 'HOL-1', school_id: 'DPS2026', academic_session: '2026-27', title: 'Good Friday', date: '2026-04-03', end_date: '2026-04-03', type: 'NATIONAL', description: 'National Gazetted Holiday' },
  { id: 'HOL-2', school_id: 'DPS2026', academic_session: '2026-27', title: 'Dr. B.R. Ambedkar Jayanti', date: '2026-04-14', end_date: '2026-04-14', type: 'NATIONAL', description: 'Ambedkar Jayanti' },
  { id: 'HOL-3', school_id: 'DPS2026', academic_session: '2026-27', title: 'Summer Vacation', date: '2026-05-18', end_date: '2026-06-28', type: 'VACATION', description: 'CBSE Annual Summer Break' },
  { id: 'HOL-4', school_id: 'DPS2026', academic_session: '2026-27', title: 'Independence Day', date: '2026-08-15', end_date: '2026-08-15', type: 'NATIONAL', description: '79th Independence Day' },
  { id: 'HOL-5', school_id: 'DPS2026', academic_session: '2026-27', title: 'Mahatma Gandhi Jayanti', date: '2026-10-02', end_date: '2026-10-02', type: 'NATIONAL', description: 'Gandhi Jayanti' },
  { id: 'HOL-6', school_id: 'DPS2026', academic_session: '2026-27', title: 'Dussehra & Autumn Break', date: '2026-10-19', end_date: '2026-10-24', type: 'VACATION', description: 'Autumn Break' },
  { id: 'HOL-7', school_id: 'DPS2026', academic_session: '2026-27', title: 'Diwali Festive Holidays', date: '2026-11-07', end_date: '2026-11-13', type: 'FESTIVAL', description: 'Deepavali Holidays' },
  { id: 'HOL-8', school_id: 'DPS2026', academic_session: '2026-27', title: 'Winter Vacation', date: '2026-12-28', end_date: '2027-01-05', type: 'VACATION', description: 'Winter Break' },
  { id: 'HOL-9', school_id: 'DPS2026', academic_session: '2026-27', title: 'Republic Day', date: '2027-01-26', end_date: '2027-01-26', type: 'NATIONAL', description: '78th Republic Day Celebration' },
  { id: 'HOL-10', school_id: 'DPS2026', academic_session: '2026-27', title: 'Holi Festival', date: '2027-03-22', end_date: '2027-03-23', type: 'FESTIVAL', description: 'Holi Holiday' },
];

async function resetAllDataToFreshDps() {
  console.log('===============================================================');
  console.log('🧹 RESETTING ALL DEMO DATA TO FRESH DELHI PUBLIC SCHOOL ERP');
  console.log('===============================================================\n');

  // 1. RESET COCKROACHDB
  console.log('🚀 Step 1: Connecting to CockroachDB Serverless...');
  const crClient = new Client({
    connectionString: COCKROACH_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await crClient.connect();
    console.log('  ✓ Connected to CockroachDB');

    console.log('  🧹 Clearing all demo records from CockroachDB tables...');
    await crClient.query('DELETE FROM attendance;');
    await crClient.query('DELETE FROM fee_invoices;');
    await crClient.query('DELETE FROM students;');
    await crClient.query('DELETE FROM teachers;');
    await crClient.query('DELETE FROM notices;');
    await crClient.query('DELETE FROM demo_requests;');
    await crClient.query('DELETE FROM classes;');
    await crClient.query('DELETE FROM holidays;');
    await crClient.query('DELETE FROM schools;');
    console.log('  ✓ CockroachDB tables wiped clean.');

    // Insert Fresh DPS School Record
    console.log('  🏫 Inserting fresh Delhi Public School record...');
    await crClient.query(`
      INSERT INTO schools (id, school_code, school_name, board, city, state, address, pincode, udise_code, oasis_code, affiliation_no, phone, email, website, principal_name, admin_id, admin_name, admin_pin, logo, logo_url, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22);
    `, [
      freshDpsSchool.id, freshDpsSchool.school_code, freshDpsSchool.school_name, freshDpsSchool.board, freshDpsSchool.city, freshDpsSchool.state, freshDpsSchool.address, freshDpsSchool.pincode, freshDpsSchool.udise_code, freshDpsSchool.oasis_code, freshDpsSchool.affiliation_no, freshDpsSchool.phone, freshDpsSchool.email, freshDpsSchool.website, freshDpsSchool.principal_name, freshDpsSchool.admin_id, freshDpsSchool.admin_name, freshDpsSchool.admin_pin, freshDpsSchool.logo, freshDpsSchool.logo_url, freshDpsSchool.status, freshDpsSchool.created_at
    ]);

    // Insert Fresh Classes
    console.log(`  📚 Initializing ${freshClasses.length} fresh CBSE classrooms & sections...`);
    for (const c of freshClasses) {
      await crClient.query(`
        INSERT INTO classes (id, school_id, academic_session, class_name, name, section, class_code, class_teacher, room_no, capacity, subjects, no_of_subjects, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
      `, [
        c.id, c.school_id, c.academic_session, c.class_name, c.class_name, c.section,
        `${c.class_name}-${c.section}`, c.class_teacher_name, c.room_no, c.capacity,
        JSON.stringify(c.subjects), c.subjects.length, 'ACTIVE'
      ]);
    }

    // Insert Fresh Holidays
    console.log(`  🎉 Initializing ${freshHolidays.length} official CBSE 2026-27 holidays...`);
    for (const h of freshHolidays) {
      await crClient.query(`
        INSERT INTO holidays (id, school_id, academic_session, title, start_date, end_date, total_days, applicable_to, category, reason, declared_by, auto_notice_published)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `, [h.id, h.school_id, h.academic_session, h.title, h.date, h.end_date, 1, 'ALL', h.type, h.description, 'CBSE Central Office', true]);
    }
    console.log('  ✓ CockroachDB fresh DPS instance initialized successfully!');
  } catch (err) {
    console.error('  ❌ CockroachDB reset error:', err.message);
  } finally {
    await crClient.end();
  }

  // 2. RESET MONGODB ATLAS
  console.log('\n🚀 Step 2: Connecting to MongoDB Atlas Cloud...');
  const mongoClient = new MongoClient(MONGO_URI);
  try {
    await mongoClient.connect();
    const db = mongoClient.db('edugit');
    console.log('  ✓ Connected to MongoDB Atlas');

    console.log('  🧹 Clearing all collections in MongoDB Atlas...');
    await db.collection('attendance').deleteMany({});
    await db.collection('fee_invoices').deleteMany({});
    await db.collection('students').deleteMany({});
    await db.collection('teachers').deleteMany({});
    await db.collection('notices').deleteMany({});
    await db.collection('demo_requests').deleteMany({});
    await db.collection('classes').deleteMany({});
    await db.collection('holidays').deleteMany({});
    await db.collection('schools').deleteMany({});
    console.log('  ✓ MongoDB Atlas collections wiped clean.');

    console.log('  🏫 Syncing fresh DPS school, classrooms, and calendar to MongoDB...');
    await db.collection('schools').insertOne(freshDpsSchool);
    await db.collection('classes').insertMany(freshClasses);
    await db.collection('holidays').insertMany(freshHolidays);
    console.log('  ✓ MongoDB Atlas fresh DPS instance initialized successfully!');
  } catch (err) {
    console.error('  ❌ MongoDB reset error:', err.message);
  } finally {
    await mongoClient.close();
  }

  // 3. RESET LOCAL STORE
  console.log('\n🚀 Step 3: Resetting Local Store (data/erp_store.json)...');
  const freshLocalStore = {
    schools: [freshDpsSchool],
    demo_requests: [],
    users: [
      {
        id: 'USR-DPS-001',
        school_id: 'DPS2026',
        username: 'dpsadmin',
        role: 'SUPERADMIN',
        full_name: 'DPS System Administrator',
        email: 'admin@dpsrkp.edu.in',
        phone: '+91 11 4987 6543',
        status: 'ACTIVE',
        is_god_admin: true
      },
      {
        id: 'USR-DPS-002',
        school_id: 'DPS2026',
        username: 'principal',
        role: 'PRINCIPAL',
        full_name: 'Dr. V. K. Sharma',
        email: 'principal@dpsrkp.edu.in',
        phone: '+91 11 4987 6544',
        status: 'ACTIVE'
      }
    ],
    students: [],
    teachers: [],
    classes: freshClasses,
    timetable: [],
    notices: [],
    attendance: [],
    fee_invoices: [],
    holidays: freshHolidays
  };

  const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
  fs.writeFileSync(storePath, JSON.stringify(freshLocalStore, null, 2), 'utf8');
  console.log('  ✓ data/erp_store.json reset to fresh Delhi Public School template!');

  console.log('\n===============================================================');
  console.log('🎉 SUCCESS: FRESH DELHI PUBLIC SCHOOL (DPS) ERP INITIALIZED!');
  console.log('  • School Name        : Delhi Public School (DPS2026)');
  console.log('  • Board / Affiliation: CBSE Affiliation No. CBSE/AFF/2130001');
  console.log('  • Academic Session   : 2026-27');
  console.log('  • Classrooms Ready   : Nursery to Class 12 (All Streams & Sections)');
  console.log('  • Students Count     : 0 (Fresh admission ready)');
  console.log('  • Faculty Count      : 0 (Fresh hiring ready)');
  console.log('  • Attendance Logs    : 0');
  console.log('  • Fee Invoices       : 0 (Clean slate ready for fee collection)');
  console.log('===============================================================');
}

resetAllDataToFreshDps().catch(console.error);
