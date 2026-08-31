export interface School {
  id: string;
  school_code: string;
  school_name: string;
  board: string;
  city: string;
  state: string;
  address?: string;
  pincode?: string;
  udise_code?: string;
  oasis_code?: string;
  affiliation_no?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_year?: string;
  principal_name?: string;
  admin_id?: string;
  admin_name?: string;
  admin_pin?: string;
  logo?: string; // Base64 data URL or URL for School Icon / Logo up to 2MB
  logo_url?: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  created_at?: string;
}

export interface DemoRequest {
  id: string;
  school_name: string;
  city: string;
  strength: string;
  board: string;
  contact_name: string;
  email: string;
  phone: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  assigned_school_code?: string;
  created_at?: string;
}

export interface User {
  id: string;
  school_id: string;
  username: string;
  role: 'SUPERADMIN' | 'AGENCY_SUPERADMIN' | 'GOD_ACCESS' | 'PRINCIPAL' | 'TEACHER' | 'ACCOUNTANT' | 'STUDENT';
  full_name: string;
  email?: string;
  phone?: string;
  avatar?: string; // Base64 data URL or image URL up to 2MB
  theme?: string;  // Active Antigravity theme ID
  status?: string;
  is_god_admin?: boolean;
  permissions?: string[];
}

// Comprehensive CBSE OASIS / SARAS Compliant Student Record
export interface Student {
  id: string;
  school_id: string;
  academic_session?: string; // e.g. "2026-27", "2025-26", "2027-28"
  admission_no: string;
  full_name: string;
  class_name: string;
  section: string;
  roll_no?: string | number;
  gender: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  phone?: string;
  fee_status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  attendance_percent?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'SUSPENDED';
  passcode?: string; // Student portal login passcode / PIN
  avatar?: string; // Student avatar URL or data URI
  photo?: string;  // Student profile picture
  created_at?: string;

  // CBSE Mandatory & Demographic Norms
  dob?: string;
  blood_group?: string;
  aadhaar_no?: string;
  apaar_id?: string; // APAAR / PEN (CBSE Permanent Education Number)
  house?: 'Red House' | 'Blue House' | 'Green House' | 'Yellow House' | string;
  nationality?: string;
  religion?: string;
  category?: 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'MINORITY';
  mother_tongue?: string;
  single_girl_child?: 'YES' | 'NO';
  cwsn_status?: 'YES' | 'NO'; // Children with Special Needs
  cwsn_facility?: string;

  // Academic History
  admission_date?: string;
  medium_of_instruction?: 'ENGLISH' | 'HINDI' | 'REGIONAL';
  previous_school?: string;
  previous_class?: string;
  transfer_certificate_no?: string;

  // Parents / Family Details
  father_name?: string;
  father_qualification?: string;
  father_occupation?: string;
  father_income?: string;
  father_phone?: string;
  father_aadhaar?: string;

  mother_name?: string;
  mother_qualification?: string;
  mother_occupation?: string;
  mother_income?: string;
  mother_phone?: string;
  mother_aadhaar?: string;

  // Address & Transport
  residential_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  transport_opted?: 'YES' | 'NO';
  bus_route_no?: string;
  pickup_point?: string;

  // Medical / Emergency
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
}

// Comprehensive CBSE Affiliation & OASIS Compliant Teacher / Staff Record
export interface Teacher {
  id: string;
  school_id: string;
  academic_session?: string; // e.g. "2026-27"
  staff_code: string;
  employee_code?: string;
  full_name: string;
  department: string;
  designation: string;
  qualification?: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  passcode?: string; // Faculty portal login passcode / PIN
  avatar?: string; // Faculty avatar URL or data URI
  photo?: string;  // Faculty profile picture

  // CBSE Norms & Qualifications
  teacher_type?: 'PRT' | 'TGT' | 'PGT' | 'NTT' | 'NON_TEACHING' | 'ADMINISTRATIVE';
  subject_specialization?: string;
  classes_taught?: string;
  ctet_qualified?: 'YES' | 'NO';
  ctet_roll_no?: string;
  professional_degree?: string; // B.Ed / M.Ed / D.El.Ed
  experience_years?: number;
  date_of_joining?: string;
  employment_type?: 'PERMANENT' | 'PROBATION' | 'CONTRACTUAL' | 'PART_TIME';

  // Personal & Identity
  dob?: string;
  gender?: string;
  blood_group?: string;
  aadhaar_no?: string;
  pan_no?: string;
  father_or_spouse_name?: string;

  // Statutory & Payroll Compliance (CBSE Norms)
  epf_uan_no?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  basic_pay?: number;

  // Residential & Emergency
  address?: string;
  city?: string;
  pincode?: string;
  emergency_contact_phone?: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  type?: 'COMPULSORY' | 'ELECTIVE' | 'SKILL' | 'INTERNAL_ASSESSMENT' | 'LANGUAGE';
  weekly_periods?: number;
  assigned_teacher?: string;
  max_marks?: number;
}

export interface ClassRoom {
  id: string;
  school_id: string;
  academic_session?: string; // e.g. "2026-27"
  class_name: string;
  name?: string;
  section: string;
  class_code?: string;
  class_teacher?: string;
  room_no?: string;
  capacity?: number;
  subjects?: SubjectItem[];
  no_of_subjects?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface TimetableEntry {
  id: string;
  school_id: string;
  academic_session?: string;
  class_name: string;
  section: string;
  day: string;
  period_no: number;
  subject: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
}

export interface Notice {
  id: string;
  school_id: string;
  academic_session?: string;
  reference_no: string; // Immutable autogenerated reference number (e.g. DPS/2026/30/8/HOLIDAY/0001)
  matter_category?: 'ACAD' | 'EXAM' | 'OFFICE' | 'CBSE' | 'HOLIDAY' | 'FEES' | 'EVENT' | string;
  title: string;
  content: string;
  target_audience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | string;
  posted_by: string;
  date: string; // Date (YYYY-MM-DD)
  created_at: string; // Exact ISO Timestamp
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  academic_session?: string;
  date: string;
  class_name: string;
  section: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  leave_count?: number;
  marked_by?: string;
  student_records?: Array<{
    student_id: string;
    admission_no?: string;
    full_name: string;
    roll_no?: string;
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE';
  }>;
  teacher_records?: Array<{
    teacher_id: string;
    staff_code?: string;
    full_name: string;
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE';
  }>;
  created_at?: string;
}

export interface FeeInvoice {
  id: string;
  school_id: string;
  academic_session?: string;
  invoice_no: string;
  student_id?: string;
  student_name: string;
  admission_no?: string;
  class_name: string;
  month?: string;
  amount: number;
  paid_amount?: number;
  tuition_fee?: number;
  transport_fee?: number;
  exam_fee?: number;
  due_date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  payment_mode?: string;
  paid_date?: string;
}

export interface Holiday {
  id: string;
  school_id: string;
  academic_session?: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_days: number;
  applicable_to: 'ALL' | 'STUDENTS_ONLY' | 'TEACHERS_AND_STUDENTS' | 'PRIMARY_ONLY' | 'SENIOR_ONLY' | string;
  category: 'GAZETTED' | 'VACATION' | 'WEATHER_EMERGENCY' | 'RESTRICTED' | 'EVENT';
  reason: string;
  declared_by: string;
  auto_notice_published?: boolean;
  created_at: string;
}

export interface SchoolOverview {
  academic_session?: string;
  kpis: {
    totalStudents: number;
    totalTeachers: number;
    attendanceToday: number;
    studentAttendanceToday?: number;
    facultyAttendanceToday?: number;
    studentsPresentToday?: number;
    studentsTotalToday?: number;
    facultyPresentToday?: number;
    facultyTotalToday?: number;
    isStudentAttendanceMarkedToday?: boolean;
    isFacultyAttendanceMarkedToday?: boolean;
    feeCollectionRate: number;
    pendingFeeAmount: number;
    totalRevenue: number;
  };
  recentStudents: Student[];
  recentInvoices: FeeInvoice[];
}
