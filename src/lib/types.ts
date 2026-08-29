export interface School {
  id: string;
  school_code: string;
  school_name: string;
  board: string;
  city: string;
  state: string;
  principal_name?: string;
  admin_id?: string;
  admin_name?: string;
  admin_pin?: string;
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
  status?: string;
  is_god_admin?: boolean;
  permissions?: string[];
}

// Comprehensive CBSE OASIS / SARAS Compliant Student Record
export interface Student {
  id: string;
  school_id: string;
  admission_no: string;
  full_name: string;
  class_name: string;
  section: string;
  roll_no?: string | number;
  gender: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  fee_status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  attendance_percent?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'SUSPENDED';
  passcode?: string; // Student portal login passcode / PIN
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
  staff_code: string;
  full_name: string;
  department: string;
  designation: string;
  qualification?: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  passcode?: string; // Faculty portal login passcode / PIN

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

export interface ClassRoom {
  id: string;
  school_id: string;
  class_name: string;
  section: string;
  class_code?: string;
  class_teacher?: string;
  room_no?: string;
  capacity?: number;
  no_of_subjects?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface TimetableEntry {
  id: string;
  school_id: string;
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
  title: string;
  content: string;
  target_audience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS';
  posted_by: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  date: string;
  class_name: string;
  section: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  marked_by?: string;
}

export interface FeeInvoice {
  id: string;
  school_id: string;
  invoice_no: string;
  student_name: string;
  admission_no?: string;
  class_name: string;
  amount: number;
  tuition_fee?: number;
  transport_fee?: number;
  exam_fee?: number;
  due_date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  payment_mode?: string;
  paid_date?: string;
}

export interface SchoolOverview {
  kpis: {
    totalStudents: number;
    totalTeachers: number;
    attendanceToday: number;
    feeCollectionRate: number;
    pendingFeeAmount: number;
    totalRevenue: number;
  };
  recentStudents: Student[];
  recentInvoices: FeeInvoice[];
}
