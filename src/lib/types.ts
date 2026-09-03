/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
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
  role_permissions?: RolePermissionMatrix;
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
  role: 'SUPERADMIN' | 'AGENCY_SUPERADMIN' | 'GOD_ACCESS' | 'PRINCIPAL' | 'TEACHER' | 'ACCOUNTANT' | 'STUDENT' | 'PARENT';
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
  parent_phone?: string;
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
  email?: string;
  address?: string;
  admission_type?: string;
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
  transport_slab_id?: string;
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
  subjects?: string[];
  assigned_class?: string;
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

export interface SubstitutionItem {
  id: string;
  period_no: number;
  period_time: string;
  class_name: string;
  section: string;
  subject: string;
  absent_teacher_id: string;
  absent_teacher_name: string;
  substitute_teacher_id: string;
  substitute_teacher_name: string;
  match_reason: 'SUBJECT_SPECIALIST' | 'BALANCED_LOAD' | 'MANUAL_SWAP';
  status: 'PENDING' | 'CONFIRMED' | 'NOTIFIED';
  date: string;
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

export interface FeePaymentRecord {
  id: string;
  amount: number;
  payment_mode: string;
  paid_at: string;
  receipt_no?: string;
  remark?: string;
  collected_by?: string;
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
  admission_fee?: number;
  annual_fee?: number;
  exam_fee?: number;
  concession_amount?: number;
  concession_reason?: string;
  waived_by?: string;
  waived_date?: string;
  sibling_discount?: number;
  due_date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'WAIVED';
  payment_mode?: string;
  paid_date?: string;
  payment_history?: FeePaymentRecord[];
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

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  actor: {
    id?: string;
    name: string;
    role: string;
    email?: string;
    ip?: string;
  };
  module: 'AUTH' | 'ATTENDANCE' | 'EXAMINATION' | 'FEES' | 'STUDENTS' | 'TEACHERS' | 'BROADCAST' | 'SETTINGS' | 'APPROVALS' | 'TRANSPORT' | 'PROMOTION' | 'CLASSES';
  action: string; // e.g. 'MARKS_SUBMITTED', 'STUDENT_ENROLLED', 'FEE_COLLECTED', 'ATTENDANCE_MARKED', etc.
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
  summary: string; // Human readable description
  details?: Record<string, any>; // JSON metadata
  targetId?: string; // Entity ID (e.g. Student ID, Invoice ID, Exam ID)
  targetName?: string; // Entity Name (e.g. "Aarav Sharma", "Class 10-A")
  school_id?: string;
  session?: string;
}

// ─────────────────────────────────────────────────────────────
// ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRIX
// ─────────────────────────────────────────────────────────────

export interface ModulePermission {
  can_view: boolean;   // Can see / access tab in navigation
  can_edit: boolean;   // Can edit / modify existing records
  can_add: boolean;    // Can create / insert new records
  can_delete: boolean; // Can delete records
}

export type ManagedRole = 'TEACHER' | 'STUDENT' | 'PARENT';

export type RolePermissionMatrix = Record<
  ManagedRole,
  Record<string, ModulePermission>
>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
  TEACHER: {
    classes: { can_view: true, can_edit: true, can_add: false, can_delete: false },
    subjects: { can_view: true, can_edit: true, can_add: false, can_delete: false },
    attendance: { can_view: true, can_edit: true, can_add: true, can_delete: false },
    exams: { can_view: true, can_edit: true, can_add: true, can_delete: false },
    homework: { can_view: true, can_edit: true, can_add: true, can_delete: true },
    approvals: { can_view: true, can_edit: true, can_add: true, can_delete: false },
    notices: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    students: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    siblings: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    teachers: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    fees: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    reports: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    certificates: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    transport: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    broadcast: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    data_hub: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    profile: { can_view: true, can_edit: true, can_add: false, can_delete: false }
  },
  STUDENT: {
    classes: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    subjects: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    attendance: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    exams: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    homework: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    approvals: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    notices: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    students: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    siblings: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    teachers: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    fees: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    reports: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    certificates: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    transport: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    broadcast: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    data_hub: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    profile: { can_view: true, can_edit: true, can_add: false, can_delete: false }
  },
  PARENT: {
    classes: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    subjects: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    attendance: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    exams: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    homework: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    approvals: { can_view: true, can_edit: true, can_add: true, can_delete: false },
    notices: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    students: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    siblings: { can_view: true, can_edit: true, can_add: false, can_delete: false },
    teachers: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    fees: { can_view: true, can_edit: true, can_add: true, can_delete: false },
    reports: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    certificates: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    transport: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    broadcast: { can_view: true, can_edit: false, can_add: false, can_delete: false },
    data_hub: { can_view: false, can_edit: false, can_add: false, can_delete: false },
    profile: { can_view: true, can_edit: true, can_add: false, can_delete: false }
  }
};

export interface ScheduledExamItem {
  id: string;
  school_id?: string;
  academic_session?: string;
  title: string;
  type: 'SCHOOL_EXAM' | 'CLASS_TEST';
  class_name: string;
  section: string;
  subject_name: string;
  subject_code?: string;
  date: string;
  time?: string;
  max_marks: number;
  pass_marks: number;
  status: 'MARKS_FILLED' | 'PENDING' | string;
  created_at?: string;
}

export interface BookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  rack_no: string;
  total_copies: number;
  available_copies: number;
  publisher?: string;
  price?: number;
  edition?: string;
}

export interface BookCirculationRecord {
  id: string;
  book_id: string;
  book_title: string;
  isbn: string;
  student_id: string;
  student_name: string;
  class_name: string;
  section: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

export interface VisitorEntry {
  id: string;
  visitor_name: string;
  phone: string;
  whom_to_meet: string;
  purpose: string;
  badge_no: string;
  in_time: string;
  out_time?: string;
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  date: string;
  government_id?: string;
}

export interface StudentGatePass {
  id: string;
  pass_no: string;
  student_id: string;
  student_name: string;
  class_name: string;
  section: string;
  parent_name: string;
  parent_phone: string;
  escort_relation: string;
  reason: string;
  authorized_by: string;
  issued_at: string;
  status: 'ISSUED' | 'DEPARTED';
  date: string;
}

