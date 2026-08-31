const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('❌ Error: COCKROACH_DB_URL or DATABASE_URL is not set.');
  console.log('👉 Please add your CockroachDB connection string to your .env file:');
  console.log('   COCKROACH_DB_URL=postgresql://<user>:<password>@<cluster>.cockroachlabs.cloud:26257/<database>?sslmode=verify-full\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const SCHEMA_SQL = `
-- 1. INSTITUTIONS / SCHOOLS
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(50) PRIMARY KEY,
  school_code VARCHAR(30) UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  board VARCHAR(50) DEFAULT 'CBSE',
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  pincode VARCHAR(20),
  udise_code VARCHAR(50),
  oasis_code VARCHAR(50),
  affiliation_no VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(150),
  principal_name VARCHAR(100),
  admin_id VARCHAR(50),
  admin_name VARCHAR(100),
  admin_pin VARCHAR(50),
  logo TEXT,
  logo_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEMO REQUESTS
CREATE TABLE IF NOT EXISTS demo_requests (
  id VARCHAR(50) PRIMARY KEY,
  school_name TEXT NOT NULL,
  city VARCHAR(100),
  strength VARCHAR(50),
  board VARCHAR(50) DEFAULT 'CBSE',
  contact_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  assigned_school_code VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CLASSES & SECTIONS
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session VARCHAR(30) DEFAULT '2026-27',
  class_name VARCHAR(50) NOT NULL,
  name VARCHAR(50),
  section VARCHAR(30) NOT NULL,
  class_code VARCHAR(50),
  class_teacher VARCHAR(100),
  room_no VARCHAR(50),
  capacity INT DEFAULT 40,
  subjects JSONB DEFAULT '[]'::jsonb,
  no_of_subjects INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_class_session UNIQUE (school_id, academic_session, class_name, section)
);

-- 4. FACULTY / TEACHERS (WITH OASIS & AVATAR/PHOTO)
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session VARCHAR(30) DEFAULT '2026-27',
  staff_code VARCHAR(50) NOT NULL,
  employee_code VARCHAR(50),
  full_name VARCHAR(150) NOT NULL,
  department VARCHAR(100),
  designation VARCHAR(100),
  qualification VARCHAR(150),
  phone VARCHAR(50),
  email VARCHAR(120),
  status VARCHAR(30) DEFAULT 'ACTIVE',
  passcode VARCHAR(50) DEFAULT '123456',
  avatar TEXT,
  photo TEXT,
  teacher_type VARCHAR(50),
  subject_specialization VARCHAR(150),
  classes_taught VARCHAR(100),
  ctet_qualified VARCHAR(10) DEFAULT 'NO',
  professional_degree VARCHAR(50) DEFAULT 'B.Ed',
  experience_years INT DEFAULT 5,
  gender VARCHAR(20) DEFAULT 'Female',
  aadhaar_no VARCHAR(30),
  pan_no VARCHAR(30),
  epf_uan_no VARCHAR(50),
  basic_pay NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_teacher_session UNIQUE (school_id, academic_session, staff_code)
);

-- 5. STUDENTS (WITH CBSE OASIS, PEN/APAAR, AVATAR/PHOTO)
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session VARCHAR(30) DEFAULT '2026-27',
  admission_no VARCHAR(50) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  section VARCHAR(30) NOT NULL,
  roll_no VARCHAR(30),
  gender VARCHAR(20) DEFAULT 'Male',
  guardian_name VARCHAR(150),
  guardian_phone VARCHAR(50),
  guardian_email VARCHAR(120),
  fee_status VARCHAR(20) DEFAULT 'PENDING',
  attendance_percent NUMERIC DEFAULT 100,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  passcode VARCHAR(50) DEFAULT '123456',
  avatar TEXT,
  photo TEXT,
  dob VARCHAR(30),
  blood_group VARCHAR(10),
  aadhaar_no VARCHAR(30),
  apaar_id VARCHAR(50),
  house VARCHAR(50),
  category VARCHAR(50) DEFAULT 'GENERAL',
  father_name VARCHAR(150),
  father_phone VARCHAR(50),
  mother_name VARCHAR(150),
  mother_phone VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(100),
  transport_opted VARCHAR(10) DEFAULT 'NO',
  bus_route_no VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_student_session UNIQUE (school_id, academic_session, admission_no)
);

-- 6. ATTENDANCE LOGS
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session VARCHAR(30) DEFAULT '2026-27',
  date VARCHAR(30) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  section VARCHAR(30) NOT NULL,
  total_students INT DEFAULT 0,
  present_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  leave_count INT DEFAULT 0,
  marked_by VARCHAR(100),
  student_records JSONB DEFAULT '[]'::jsonb,
  teacher_records JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. FEE INVOICES
CREATE TABLE IF NOT EXISTS fee_invoices (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session VARCHAR(30) DEFAULT '2026-27',
  invoice_no VARCHAR(50) NOT NULL,
  student_id VARCHAR(50),
  student_name VARCHAR(150),
  admission_no VARCHAR(50),
  class_name VARCHAR(50),
  month VARCHAR(30),
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_date VARCHAR(30),
  status VARCHAR(20) DEFAULT 'PENDING',
  payment_mode VARCHAR(50),
  paid_date VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_invoice_session UNIQUE (school_id, academic_session, invoice_no)
);

-- 8. NOTICES & CIRCULARS
CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session VARCHAR(30) DEFAULT '2026-27',
  reference_no VARCHAR(100) NOT NULL,
  matter_category VARCHAR(50) DEFAULT 'ACAD',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'ALL',
  posted_by VARCHAR(100),
  date VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. HOLIDAYS & ACADEMIC CALENDAR
CREATE TABLE IF NOT EXISTS holidays (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_session VARCHAR(30) DEFAULT '2026-27',
  title TEXT NOT NULL,
  start_date VARCHAR(30) NOT NULL,
  end_date VARCHAR(30) NOT NULL,
  total_days INT DEFAULT 1,
  applicable_to VARCHAR(50) DEFAULT 'ALL',
  category VARCHAR(50) DEFAULT 'GAZETTED',
  reason TEXT,
  declared_by VARCHAR(100),
  auto_notice_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PERFORMANCE COMPOUND INDEXES
CREATE INDEX IF NOT EXISTS idx_students_hierarchy ON students(school_id, academic_session, class_name, section);
CREATE INDEX IF NOT EXISTS idx_teachers_hierarchy ON teachers(school_id, academic_session, department);
CREATE INDEX IF NOT EXISTS idx_classes_hierarchy ON classes(school_id, academic_session);
CREATE INDEX IF NOT EXISTS idx_attendance_hierarchy ON attendance(school_id, academic_session, date);
CREATE INDEX IF NOT EXISTS idx_invoices_hierarchy ON fee_invoices(school_id, academic_session, status);
CREATE INDEX IF NOT EXISTS idx_notices_hierarchy ON notices(school_id, academic_session, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_holidays_hierarchy ON holidays(school_id, academic_session, start_date);
`;

async function initSchema() {
  console.log('🚀 Connecting to CockroachDB...');
  const client = await pool.connect();
  try {
    console.log('🛠️ Creating CockroachDB relational tables & indexes...');
    await client.query(SCHEMA_SQL);
    console.log('✅ All CockroachDB tables and compound indexes initialized successfully!');
  } catch (err) {
    console.error('❌ Schema initialization error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

initSchema();
