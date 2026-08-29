-- ==========================================================
-- MULTI-TENANT SCHOOL ERP DATABASE SCHEMA
-- Designed for High Scalability, Data Isolation & Integrity
-- Compatible with PostgreSQL and SQLite
-- ==========================================================

-- 1. INSTITUTIONS / SCHOOLS REGISTRY TABLE
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(50) PRIMARY KEY,
  school_code VARCHAR(30) UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  board VARCHAR(50) DEFAULT 'CBSE',
  tagline TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(150),
  academic_session VARCHAR(30) DEFAULT '2026-2027',
  principal_name VARCHAR(100),
  admin_id VARCHAR(50),
  admin_name VARCHAR(100),
  admin_pin VARCHAR(50),
  currency_symbol VARCHAR(10) DEFAULT '₹',
  logo_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. UNIFIED USERS & AUTHENTICATION (MULTI-SCHOOL)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(120),
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'SCHOOL_ADMIN',
  name VARCHAR(120) NOT NULL,
  gender VARCHAR(20) DEFAULT 'Male',
  phone VARCHAR(50),
  avatar TEXT,
  bio TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (school_id, username)
);

-- 3. ACADEMIC CLASSES & SECTIONS
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  section VARCHAR(30) NOT NULL,
  class_teacher_name VARCHAR(100),
  room VARCHAR(50),
  capacity INT DEFAULT 40,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (school_id, name, section)
);

-- 4. FACULTY & STAFF RECORDS
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  designation VARCHAR(100),
  qualification VARCHAR(120),
  subjects TEXT,
  gender VARCHAR(20) DEFAULT 'Female',
  dob VARCHAR(30),
  phone VARCHAR(50),
  email VARCHAR(120),
  salary NUMERIC DEFAULT 0,
  pay_scale VARCHAR(50),
  doj VARCHAR(30),
  employment_type VARCHAR(50) DEFAULT 'Regular / Confirmed',
  security_pin VARCHAR(30) DEFAULT '123456',
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. STUDENT INFORMATION SYSTEM (SIS)
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  roll_no VARCHAR(30) NOT NULL,
  name VARCHAR(120) NOT NULL,
  class_id VARCHAR(50) REFERENCES classes(id) ON DELETE SET NULL,
  class_name VARCHAR(80),
  section VARCHAR(30),
  gender VARCHAR(20) DEFAULT 'Male',
  dob VARCHAR(30),
  blood_group VARCHAR(10),
  guardian_name VARCHAR(120),
  guardian_phone VARCHAR(50),
  guardian_email VARCHAR(120),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  admission_date VARCHAR(30),
  admission_no VARCHAR(50),
  security_pin VARCHAR(30) DEFAULT '123456',
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ATTENDANCE REGISTERS (STUDENTS & FACULTY)
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  member_id VARCHAR(50) NOT NULL,
  member_name VARCHAR(120),
  member_type VARCHAR(20) DEFAULT 'STUDENT', -- 'STUDENT' or 'FACULTY'
  class_id VARCHAR(50),
  date VARCHAR(30) NOT NULL,
  checkin_time VARCHAR(30),
  checkout_time VARCHAR(30),
  status VARCHAR(20) DEFAULT 'PRESENT', -- 'PRESENT', 'ABSENT', 'LATE', 'LEAVE'
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. FEE INVOICES & REVENUE LEDGER
CREATE TABLE IF NOT EXISTS fee_invoices (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(120),
  class_name VARCHAR(80),
  fee_type VARCHAR(100) NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PAID', 'PENDING', 'PARTIAL'
  due_date VARCHAR(30),
  paid_date VARCHAR(30),
  payment_mode VARCHAR(50),
  receipt_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. EXAMINATION & MARKS GRADEBOOK
CREATE TABLE IF NOT EXISTS exam_marks (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_name VARCHAR(100) NOT NULL,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(120),
  class_name VARCHAR(80),
  subject VARCHAR(100) NOT NULL,
  marks_obtained NUMERIC NOT NULL DEFAULT 0,
  max_marks NUMERIC NOT NULL DEFAULT 100,
  grade VARCHAR(10),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. TIMETABLE & PERIOD SCHEDULES
CREATE TABLE IF NOT EXISTS timetable (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day VARCHAR(20) NOT NULL,
  period VARCHAR(50) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  teacher VARCHAR(120),
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. SCHOOL NOTICES & CIRCULARS
CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL',
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  author VARCHAR(100),
  date VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDIT TRAIL LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id VARCHAR(50),
  user_name VARCHAR(120),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- INDEXES FOR INSTANT MULTI-TENANT FILTERING & HIGH PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_school ON fee_invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_marks_school ON exam_marks(school_id);
CREATE INDEX IF NOT EXISTS idx_notices_school ON notices(school_id);
