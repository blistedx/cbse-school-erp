/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { z } from 'zod';
import { NextResponse } from 'next/server';

export type ValidationResult<T> =
  | { success: true; data: T; response?: never }
  | { success: false; response: NextResponse; data?: never };

/**
 * Helper to validate incoming request bodies against a Zod schema.
 * Automatically strips undeclared extra keys and returns either typed data or a 400 response.
 */
export function validateBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: `Validation failed: ${issues}` },
        { status: 400 }
      )
    };
  }
  return { success: true, data: result.data };
}

// 1. STUDENTS
export const createStudentSchema = z.object({
  action: z.string().optional(),
  id: z.string().max(80).optional(),
  is_update: z.boolean().optional(),
  school_id: z.string().max(50).optional(),
  academic_session: z.string().max(20).optional(),
  admission_no: z.string().max(50).optional(),
  full_name: z.string().min(1, 'Full name is required').max(120),
  class_name: z.string().min(1, 'Class name is required').max(50),
  section: z.string().max(10).optional().default('A'),
  roll_no: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  dob: z.string().max(30).optional(),
  guardian_name: z.string().max(120).optional(),
  guardian_phone: z.string().max(30).optional(),
  guardian_email: z.string().max(120).optional(),
  address: z.string().max(300).optional(),
  fee_status: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE']).optional(),
  attendance_percent: z.number().min(0).max(100).optional(),
  passcode: z.string().max(100).optional(),
  photo: z.string().optional(),
  avatar: z.string().optional(),
  father_name: z.string().max(120).optional(),
  mother_name: z.string().max(120).optional(),
  residential_address: z.string().max(300).optional(),
  email: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALUMNI', 'SUSPENDED']).optional()
}).strip();

export const updateStudentSchema = createStudentSchema.partial().strip();

// 2. TEACHERS & FACULTY
export const createTeacherSchema = z.object({
  action: z.string().optional(),
  id: z.string().max(80).optional(),
  is_update: z.boolean().optional(),
  school_id: z.string().max(50).optional(),
  academic_session: z.string().max(20).optional(),
  staff_code: z.string().max(50).optional(),
  full_name: z.string().min(1, 'Full name is required').max(120),
  department: z.string().max(80).optional(),
  designation: z.string().max(80).optional(),
  role: z.string().max(50).optional(),
  subject_specialization: z.string().max(120).optional(),
  qualification: z.string().max(120).optional(),
  experience_years: z.number().min(0).max(80).optional(),
  gender: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().max(120).optional(),
  salary: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'RESIGNED']).optional(),
  passcode: z.string().max(100).optional(),
  photo: z.string().optional(),
  avatar: z.string().optional()
}).strip();

export const updateTeacherSchema = createTeacherSchema.partial().strip();

// 3. FEE INVOICES & TRANSACTIONS
export const createFeeInvoiceSchema = z.object({
  school_id: z.string().max(50).optional(),
  student_id: z.string().min(1, 'student_id is required').max(80),
  student_name: z.string().max(120).optional(),
  admission_no: z.string().max(50).optional(),
  class_name: z.string().max(50).optional(),
  month: z.string().min(1, 'month is required').max(100),
  amount: z.number().min(0, 'amount must be non-negative'),
  paid_amount: z.number().min(0).optional(),
  tuition_fee: z.number().min(0).optional(),
  transport_fee: z.number().min(0).optional(),
  admission_fee: z.number().min(0).optional(),
  annual_fee: z.number().min(0).optional(),
  exam_fee: z.number().min(0).optional(),
  concession_amount: z.number().min(0).optional(),
  concession_reason: z.string().max(200).optional().nullable(),
  due_date: z.string().max(30).optional(),
  status: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE']).optional(),
  payment_mode: z.string().max(50).optional()
}).strip();

export const updateFeeInvoiceSchema = z.object({
  invoice_id: z.string().max(80).optional(),
  id: z.string().max(80).optional(),
  status: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE']).optional(),
  payment_mode: z.string().max(50).optional(),
  paid_amount: z.number().min(0).optional(),
  waived_by: z.string().max(100).optional().nullable(),
  waived_date: z.string().max(40).optional().nullable(),
  concession_amount: z.number().min(0).optional(),
  concession_reason: z.string().max(200).optional().nullable()
}).strip();

// 4. CLASSES & SECTIONS
export const createClassSchema = z.object({
  school_id: z.string().max(50).optional(),
  class_name: z.string().min(1, 'class_name is required').max(50),
  section: z.string().min(1, 'section is required').max(10),
  class_teacher: z.string().max(120).optional(),
  room_number: z.string().max(30).optional(),
  capacity: z.number().int().min(1).max(200).optional(),
  subjects: z.array(z.any()).optional()
}).strip();

export const updateClassSchema = createClassSchema.partial().strip();

// 5. NOTICES
export const createNoticeSchema = z.object({
  school_id: z.string().max(50).optional(),
  title: z.string().min(1, 'title is required').max(200),
  content: z.string().min(1, 'content is required').max(5000),
  date: z.string().max(30).optional(),
  type: z.string().max(50).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  audience: z.string().max(100).optional(),
  target_audience: z.string().max(100).optional(),
  author: z.string().max(100).optional(),
  posted_by: z.string().max(100).optional()
}).strip();

// 6. HOLIDAYS
export const createHolidaySchema = z.object({
  school_id: z.string().max(50).optional(),
  academic_session: z.string().max(20).optional(),
  title: z.string().min(1, 'Holiday title is required').max(150),
  name: z.string().max(150).optional(),
  start_date: z.string().min(1, 'start_date is required').max(30),
  end_date: z.string().max(30).optional(),
  applicable_to: z.string().max(50).optional(),
  category: z.enum(['GAZETTED', 'RESTRICTED', 'VACATION', 'WEATHER_EMERGENCY', 'EVENT']).optional(),
  reason: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  declared_by: z.string().max(100).optional(),
  auto_notice: z.boolean().optional()
}).strip();

// 7. EXAMS
export const createScheduledExamItemSchema = z.object({
  id: z.string().max(80).optional(),
  school_id: z.string().max(50).optional(),
  academic_session: z.string().max(20).optional(),
  title: z.string().min(1, 'Title is required').max(150),
  type: z.enum(['SCHOOL_EXAM', 'CLASS_TEST']).optional().default('CLASS_TEST'),
  class_name: z.string().min(1, 'class_name is required').max(50),
  section: z.string().max(10).optional().default('A'),
  subject_name: z.string().min(1, 'subject_name is required').max(100),
  subject_code: z.string().max(50).optional(),
  date: z.string().max(30).optional(),
  time: z.string().max(30).optional(),
  max_marks: z.number().min(1).max(1000).optional(),
  pass_marks: z.number().min(0).max(1000).optional(),
  status: z.string().max(30).optional()
}).strip();

export const batchScheduledExamSchema = z.object({
  exams: z.array(createScheduledExamItemSchema).min(1, 'At least one exam is required')
}).strip();

export const updateScheduledExamSchema = z.object({
  id: z.string().min(1, 'Exam ID is required').max(80),
  title: z.string().max(150).optional(),
  type: z.enum(['SCHOOL_EXAM', 'CLASS_TEST']).optional(),
  class_name: z.string().max(50).optional(),
  section: z.string().max(10).optional(),
  subject_name: z.string().max(100).optional(),
  subject_code: z.string().max(50).optional(),
  date: z.string().max(30).optional(),
  time: z.string().max(30).optional(),
  max_marks: z.number().min(1).max(1000).optional(),
  pass_marks: z.number().min(0).max(1000).optional(),
  status: z.string().max(30).optional()
}).strip();

// 8. PUBLIC DEMO REQUEST
export const demoRequestSchema = z.object({
  schoolName: z.string().min(1, 'School name is required').max(150),
  contactName: z.string().min(1, 'Contact name is required').max(120),
  email: z.string().email('A valid email address is required').max(120),
  phone: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  board: z.string().max(50).optional(),
  strength: z.string().max(50).optional(),
  notes: z.string().max(1000).optional()
}).strip();

// 9. SCHOOL SETTINGS
export const updateSchoolSettingsSchema = z.object({
  school_id: z.string().max(50).optional(),
  school_name: z.string().max(150).optional(),
  board: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  pincode: z.string().max(20).optional(),
  udise_code: z.string().max(50).optional(),
  oasis_code: z.string().max(50).optional(),
  affiliation_no: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  established_year: z.string().max(10).optional(),
  principal_name: z.string().max(120).optional(),
  admin_name: z.string().max(120).optional(),
  admin_id: z.string().max(80).optional(),
  username: z.string().max(80).optional(),
  full_name: z.string().max(120).optional(),
  admin_pin: z.string().max(50).optional(),
  logo: z.string().optional(),
  logo_url: z.string().optional(),
  avatar: z.string().optional(),
  photo: z.string().optional(),
  principal_avatar: z.string().optional(),
  theme: z.string().max(50).optional()
}).strip();

// 10. SCHOOL PERMISSIONS
export const updateSchoolPermissionsSchema = z.object({
  school_id: z.string().max(50).optional(),
  permissions: z.record(z.string(), z.any())
}).strip();

// 11. MEDIA UPLOAD
export const uploadMediaSchema = z.object({
  id: z.string().min(1, 'Media ID is required').max(100),
  school_id: z.string().max(50).optional(),
  entity_type: z.string().max(50).optional(),
  entity_id: z.string().max(80).optional(),
  filename: z.string().max(200).optional(),
  mime_type: z.string().max(50).optional(),
  data: z.string().min(1, 'File data is required')
}).strip();

// 12. CREATE SCHOOL
export const createSchoolSchema = z.object({
  school_name: z.string().min(1, 'School name is required').max(150),
  school_code: z.string().min(1, 'School code is required').max(50),
  board: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  admin_name: z.string().max(120).optional(),
  admin_id: z.string().max(80).optional(),
  admin_pin: z.string().max(50).optional(),
  plan: z.string().max(50).optional(),
  max_students: z.number().optional()
}).strip();
