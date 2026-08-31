/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP";
const rawCockroach = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const COCKROACH_URI = rawCockroach.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');

async function migrate() {
  const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');
  let localStore = null;
  if (fs.existsSync(localStorePath)) {
    try {
      localStore = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
    } catch (e) {}
  }

  let mongoDb = null;
  let mongoClient = null;
  try {
    console.log('🚀 Step 1: Connecting to MongoDB Atlas Cloud...');
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db('edugit');
    console.log('  ✓ Connected to MongoDB Atlas Cloud');
  } catch (e) {
    console.log('  ⚠️ Using local JSON store as source.');
  }

  console.log('🚀 Step 2: Connecting to CockroachDB Serverless...');
  const cockroachPool = new Pool({
    connectionString: COCKROACH_URI,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  const pgClient = await cockroachPool.connect();
  console.log('  ✓ Connected to CockroachDB');

  try {
    // 1. Schools
    console.log('\n📦 Migrating Schools...');
    const schools = mongoDb ? await mongoDb.collection('schools').find({}).toArray() : (localStore?.schools || []);
    for (const s of schools) {
      await pgClient.query(`
        INSERT INTO schools (id, school_code, school_name, board, city, state, address, pincode, udise_code, affiliation_no, phone, email, website, principal_name, admin_id, admin_name, admin_pin, logo_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET school_name = EXCLUDED.school_name, admin_pin = EXCLUDED.admin_pin;
      `, [
        s.id, s.school_code, s.school_name, s.board || 'CBSE', s.city || '', s.state || '', s.address || '',
        s.pincode || '', s.udise_code || '', s.affiliation_no || '', s.phone || '', s.email || '',
        s.website || '', s.principal_name || '', s.admin_id || 'admin', s.admin_name || '',
        s.admin_pin || '123456', s.logo_url || s.logo || '', s.status || 'ACTIVE'
      ]);
    }
    console.log(`  ✓ Synced ${schools.length} schools`);

    // 2. Classes
    console.log('\n📦 Migrating Classes & Subject Catalogs...');
    const classes = mongoDb ? await mongoDb.collection('classes').find({}).toArray() : (localStore?.classes || []);
    for (const c of classes) {
      const className = c.class_name || c.name || 'Class 10';
      const section = c.section || 'A';
      await pgClient.query(`
        INSERT INTO classes (id, school_id, academic_session, class_name, name, section, class_code, class_teacher, room_no, capacity, subjects, no_of_subjects, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT ON CONSTRAINT uq_class_session DO UPDATE SET subjects = EXCLUDED.subjects, class_teacher = EXCLUDED.class_teacher;
      `, [
        c.id, c.school_id || 'DPS2026', c.academic_session || '2026-27', className, c.name || className,
        section, c.class_code || '', c.class_teacher || '', c.room_no || '', c.capacity || 40,
        JSON.stringify(c.subjects || []), (c.subjects || []).length, c.status || 'ACTIVE'
      ]);
    }
    console.log(`  ✓ Synced ${classes.length} class sections`);

    // 3. Teachers (with Avatars / Photos)
    console.log('\n📦 Migrating Faculty / Staff Records...');
    const teachers = mongoDb ? await mongoDb.collection('teachers').find({}).toArray() : (localStore?.teachers || []);
    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      const staffCode = t.staff_code || t.employee_code || t.id || `TCH-${i + 1}`;
      const fullName = t.full_name || t.name || 'Faculty Member';
      await pgClient.query(`
        INSERT INTO teachers (id, school_id, academic_session, staff_code, full_name, department, designation, qualification, phone, email, status, passcode, avatar, photo, professional_degree, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT ON CONSTRAINT uq_teacher_session DO UPDATE SET avatar = EXCLUDED.avatar, photo = EXCLUDED.photo, full_name = EXCLUDED.full_name;
      `, [
        t.id, t.school_id || 'DPS2026', t.academic_session || '2026-27', staffCode, fullName,
        t.department || 'Academic', t.designation || 'Teacher', t.qualification || '', t.phone || '',
        t.email || '', t.status || 'ACTIVE', t.passcode || '123456', t.avatar || '', t.photo || '',
        t.professional_degree || 'B.Ed', t.gender || 'Female'
      ]);
    }
    console.log(`  ✓ Synced ${teachers.length} faculty records`);

    // 4. Students (High Speed Multi-Row Bulk Insert)
    console.log('\n📦 Migrating 5,000 Students (High-Speed Multi-Row Batches)...');
    const students = mongoDb ? await mongoDb.collection('students').find({}).toArray() : (localStore?.students || []);
    const studentBatchSize = 100;
    for (let i = 0; i < students.length; i += studentBatchSize) {
      const batch = students.slice(i, i + studentBatchSize);
      const valueStrings = [];
      const params = [];
      let paramIdx = 1;

      for (let j = 0; j < batch.length; j++) {
        const s = batch[j];
        const admissionNo = s.admission_no || s.roll_no || s.id || `ADM-${i + j + 1}`;
        const fullName = s.full_name || s.name || 'Student';
        const className = s.class_name || 'Class 10';
        const section = s.section || 'A';

        const rowPlaceholders = [];
        for (let p = 0; p < 21; p++) {
          rowPlaceholders.push(`$${paramIdx++}`);
        }
        valueStrings.push(`(${rowPlaceholders.join(', ')})`);

        params.push(
          s.id, s.school_id || 'DPS2026', s.academic_session || '2026-27', admissionNo, fullName,
          className, section, String(s.roll_no || '1'), s.gender || 'Male', s.guardian_name || '',
          s.guardian_phone || '', s.guardian_email || '', s.fee_status || 'PENDING', Number(s.attendance_percent) || 100,
          s.status || 'ACTIVE', s.passcode || '123456', s.avatar || '', s.photo || '', s.apaar_id || '',
          s.house || 'Red House', s.category || 'GENERAL'
        );
      }

      await pgClient.query(`
        INSERT INTO students (id, school_id, academic_session, admission_no, full_name, class_name, section, roll_no, gender, guardian_name, guardian_phone, guardian_email, fee_status, attendance_percent, status, passcode, avatar, photo, apaar_id, house, category)
        VALUES ${valueStrings.join(', ')}
        ON CONFLICT ON CONSTRAINT uq_student_session DO UPDATE SET avatar = EXCLUDED.avatar, photo = EXCLUDED.photo, full_name = EXCLUDED.full_name;
      `, params);

      console.log(`  ✓ Bulk Synced students ${Math.min(i + studentBatchSize, students.length)} / ${students.length}`);
    }

    // 5. Fee Invoices (Multi-Row Bulk Insert)
    console.log('\n📦 Migrating Fee Invoices (High-Speed Multi-Row Batches)...');
    const invoices = mongoDb ? await mongoDb.collection('fee_invoices').find({}).toArray() : (localStore?.fee_invoices || []);
    const invoiceBatchSize = 100;
    for (let i = 0; i < invoices.length; i += invoiceBatchSize) {
      const batch = invoices.slice(i, i + invoiceBatchSize);
      const valueStrings = [];
      const params = [];
      let paramIdx = 1;

      for (let j = 0; j < batch.length; j++) {
        const inv = batch[j];
        const invoiceNo = inv.invoice_no || inv.id || `INV-${i + j + 1}`;
        const studentName = inv.student_name || 'Student';
        const className = inv.class_name || 'Class 10';

        const rowPlaceholders = [];
        for (let p = 0; p < 14; p++) {
          rowPlaceholders.push(`$${paramIdx++}`);
        }
        valueStrings.push(`(${rowPlaceholders.join(', ')})`);

        params.push(
          inv.id, inv.school_id || 'DPS2026', inv.academic_session || '2026-27', invoiceNo,
          studentName, inv.admission_no || '', className, inv.month || '',
          Number(inv.amount) || 0, Number(inv.paid_amount) || 0, inv.due_date || '', inv.status || 'PENDING',
          inv.payment_mode || '', inv.paid_date || ''
        );
      }

      await pgClient.query(`
        INSERT INTO fee_invoices (id, school_id, academic_session, invoice_no, student_name, admission_no, class_name, month, amount, paid_amount, due_date, status, payment_mode, paid_date)
        VALUES ${valueStrings.join(', ')}
        ON CONFLICT ON CONSTRAINT uq_invoice_session DO UPDATE SET status = EXCLUDED.status, paid_amount = EXCLUDED.paid_amount;
      `, params);

      console.log(`  ✓ Bulk Synced fee invoices ${Math.min(i + invoiceBatchSize, invoices.length)} / ${invoices.length}`);
    }

    // 6. Attendance Logs
    console.log('\n📦 Migrating Attendance Records...');
    const attendance = mongoDb ? await mongoDb.collection('attendance').find({}).toArray() : (localStore?.attendance || []);
    for (const a of attendance) {
      await pgClient.query(`
        INSERT INTO attendance (id, school_id, academic_session, date, class_name, section, total_students, present_count, absent_count, leave_count, marked_by, student_records, teacher_records)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING;
      `, [
        a.id, a.school_id || 'DPS2026', a.academic_session || '2026-27', a.date || '',
        a.class_name || 'Class 10', a.section || 'A', Number(a.total_students) || 0,
        Number(a.present_count) || 0, Number(a.absent_count) || 0, Number(a.leave_count) || 0, a.marked_by || 'Admin',
        JSON.stringify(a.student_records || []), JSON.stringify(a.teacher_records || [])
      ]);
    }
    console.log(`  ✓ Synced ${attendance.length} attendance logs`);

    // 7. Notices & Holidays
    console.log('\n📦 Migrating Notices & Holidays...');
    const notices = mongoDb ? await mongoDb.collection('notices').find({}).toArray() : (localStore?.notices || []);
    for (const n of notices) {
      const schoolId = n.school_id === 'SCH-DELHI-001' ? 'DPS2026' : (n.school_id || 'DPS2026');
      await pgClient.query(`
        INSERT INTO notices (id, school_id, academic_session, reference_no, matter_category, title, content, target_audience, posted_by, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING;
      `, [
        n.id, schoolId, n.academic_session || '2026-27', n.reference_no || `NOT-${Date.now()}`,
        n.matter_category || 'ACAD', n.title, n.content || '', n.target_audience || 'ALL',
        n.posted_by || 'Admin', n.date || ''
      ]);
    }

    const holidays = mongoDb ? await mongoDb.collection('holidays').find({}).toArray() : (localStore?.holidays || []);
    for (const h of holidays) {
      const schoolId = h.school_id === 'SCH-DELHI-001' ? 'DPS2026' : (h.school_id || 'DPS2026');
      await pgClient.query(`
        INSERT INTO holidays (id, school_id, academic_session, title, start_date, end_date, total_days, applicable_to, category, reason, declared_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING;
      `, [
        h.id, schoolId, h.academic_session || '2026-27', h.title,
        h.start_date || '', h.end_date || '', Number(h.total_days) || 1, h.applicable_to || 'ALL',
        h.category || 'GAZETTED', h.reason || '', h.declared_by || 'Principal'
      ]);
    }
    console.log(`  ✓ Synced ${notices.length} notices and ${holidays.length} holidays`);

    console.log('\n🎉 ALL DATA MIGRATED SUCCESSFULLY TO COCKROACHDB!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    pgClient.release();
    await cockroachPool.end();
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

migrate();
