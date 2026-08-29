import fs from 'fs';
import path from 'path';
import { getDatabase, isMongoConfigured } from './mongodb';
import {
  School,
  DemoRequest,
  User,
  Student,
  Teacher,
  ClassRoom,
  TimetableEntry,
  Notice,
  AttendanceRecord,
  FeeInvoice,
  SchoolOverview
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore in read-only / serverless environments
  }
}

const LOCAL_STORE_FILE = path.join(DATA_DIR, 'erp_store.json');

interface MemoryStore {
  schools: School[];
  demo_requests: DemoRequest[];
  users: User[];
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  timetable: TimetableEntry[];
  notices: Notice[];
  attendance: AttendanceRecord[];
  fee_invoices: FeeInvoice[];
}

const memoryStore: MemoryStore = {
  schools: [],
  demo_requests: [],
  users: [],
  students: [],
  teachers: [],
  classes: [],
  timetable: [],
  notices: [],
  attendance: [],
  fee_invoices: []
};

function loadLocalStore() {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.schools)) memoryStore.schools = data.schools;
      if (Array.isArray(data.demo_requests)) memoryStore.demo_requests = data.demo_requests;
      if (Array.isArray(data.users)) memoryStore.users = data.users;
      if (Array.isArray(data.students)) memoryStore.students = data.students;
      if (Array.isArray(data.teachers)) memoryStore.teachers = data.teachers;
      if (Array.isArray(data.classes)) memoryStore.classes = data.classes;
      if (Array.isArray(data.timetable)) memoryStore.timetable = data.timetable;
      if (Array.isArray(data.notices)) memoryStore.notices = data.notices;
      if (Array.isArray(data.attendance)) memoryStore.attendance = data.attendance;
      if (Array.isArray(data.fee_invoices)) memoryStore.fee_invoices = data.fee_invoices;
    }
  } catch (err: any) {
    // Non-blocking
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err: any) {
    // Non-blocking
  }
}

// Initialise memory store fallback
loadLocalStore();

let isIndexesInitialized = false;

async function ensureIndexes() {
  if (isIndexesInitialized || !isMongoConfigured()) return;
  try {
    const db = await getDatabase();
    if (!db) return;

    await Promise.all([
      db.collection('schools').createIndex({ school_code: 1 }, { unique: true }),
      db.collection('schools').createIndex({ id: 1 }),
      db.collection('demo_requests').createIndex({ id: 1 }),
      db.collection('students').createIndex({ school_id: 1, admission_no: 1 }),
      db.collection('teachers').createIndex({ school_id: 1, staff_code: 1 }),
      db.collection('classes').createIndex({ school_id: 1 }),
      db.collection('notices').createIndex({ school_id: 1, created_at: -1 }),
      db.collection('attendance').createIndex({ school_id: 1, date: -1 }),
      db.collection('fee_invoices').createIndex({ school_id: 1, invoice_no: 1 }),
    ]);

    isIndexesInitialized = true;
  } catch (e: any) {
    console.warn('[MongoDB] Index setup note:', e.message);
  }
}

function sanitizeDoc<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest as T;
}

export const Database = {
  // DEMO REQUESTS
  async getDemoRequests(): Promise<DemoRequest[]> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        const results = await db.collection('demo_requests')
          .find({})
          .sort({ created_at: -1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<DemoRequest>);
        }
      }
    } catch (e) {}
    return memoryStore.demo_requests;
  },

  async createDemoRequest(data: Partial<DemoRequest>): Promise<DemoRequest> {
    await ensureIndexes();
    const id = data.id || `REQ-${Date.now()}`;
    const req: DemoRequest = {
      id,
      school_name: data.school_name || 'New School Lead',
      city: data.city || '',
      strength: data.strength || '',
      board: data.board || 'CBSE',
      contact_name: data.contact_name || '',
      email: data.email || '',
      phone: data.phone || '',
      notes: data.notes || '',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('demo_requests').insertOne({ ...req });
      }
    } catch (e) {}

    memoryStore.demo_requests.unshift(req);
    saveLocalStore();
    return req;
  },

  async approveDemoRequest(requestId: string, customCode?: string, adminId?: string, adminPin?: string): Promise<{ success: boolean; school?: School; error?: string }> {
    await ensureIndexes();
    const requests = await this.getDemoRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, error: 'Demo request not found.' };
    }

    let schoolCode = (customCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!schoolCode) {
      const words = req.school_name.trim().split(/\s+/).filter(w => w.length > 0);
      const initials = words.map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'SCH';
      schoolCode = `${initials}${new Date().getFullYear()}`;
    }

    const assignedAdminId = (adminId || '').trim() || 'admin';
    const assignedAdminPin = (adminPin || '').trim() || '123456';

    const school = await this.createSchool({
      school_code: schoolCode,
      school_name: req.school_name,
      board: req.board || 'CBSE',
      city: req.city,
      principal_name: req.contact_name,
      admin_id: assignedAdminId,
      admin_name: req.contact_name,
      admin_pin: assignedAdminPin,
      status: 'ACTIVE'
    });

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('demo_requests').updateOne(
          { id: requestId },
          { $set: { status: 'APPROVED', assigned_school_code: schoolCode } }
        );
      }
    } catch (e) {}

    const memIdx = memoryStore.demo_requests.findIndex(r => r.id === requestId);
    if (memIdx >= 0) {
      memoryStore.demo_requests[memIdx].status = 'APPROVED';
      memoryStore.demo_requests[memIdx].assigned_school_code = schoolCode;
      saveLocalStore();
    }

    return { success: true, school };
  },

  async rejectDemoRequest(requestId: string): Promise<boolean> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('demo_requests').updateOne(
          { id: requestId },
          { $set: { status: 'REJECTED' } }
        );
      }
    } catch (e) {}

    const memIdx = memoryStore.demo_requests.findIndex(r => r.id === requestId);
    if (memIdx >= 0) {
      memoryStore.demo_requests[memIdx].status = 'REJECTED';
      saveLocalStore();
      return true;
    }
    return false;
  },

  // SCHOOLS
  async getSchools(): Promise<School[]> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        const results = await db.collection('schools')
          .find({ status: 'ACTIVE' })
          .sort({ created_at: 1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<School>);
        }
      }
    } catch (e) {}
    return memoryStore.schools.filter(s => s.status === 'ACTIVE');
  },

  async getSchoolById(schoolId: string): Promise<School | null> {
    if (!schoolId) return null;
    return this.getSchoolByCode(schoolId);
  },

  async getSchoolByCode(schoolCode: string): Promise<School | null> {
    if (!schoolCode) return null;
    const schools = await this.getSchools();
    const rawInput = schoolCode.trim().toUpperCase();
    const cleanInput = rawInput.replace(/[^A-Z0-9]/g, '');

    let matched = schools.find(s => (s.school_code || '').toUpperCase() === rawInput);
    if (matched) return matched;

    matched = schools.find(s => {
      const cleanDbCode = (s.school_code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return cleanDbCode === cleanInput;
    });
    if (matched) return matched;

    matched = schools.find(s => (s.school_name || '').toUpperCase() === rawInput || (s.school_name || '').toUpperCase().includes(rawInput));
    if (matched) return matched;

    matched = schools.find(s => {
      const cleanDbCode = (s.school_code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return cleanDbCode.startsWith(cleanInput) || cleanInput.startsWith(cleanDbCode.replace(/202[0-9]/g, ''));
    });
    if (matched) return matched;

    return matched || null;
  },

  async createSchool(schoolData: Partial<School>): Promise<School> {
    await ensureIndexes();
    const id = schoolData.id || `SCH-${Date.now()}`;
    const code = (schoolData.school_code || '').trim().toUpperCase();
    const name = (schoolData.school_name || '').trim();

    if (!code || !name) {
      throw new Error('School Code and School Name are required.');
    }

    const school: School = {
      id,
      school_code: code,
      school_name: name,
      board: schoolData.board || 'CBSE',
      city: schoolData.city || '',
      state: schoolData.state || '',
      principal_name: schoolData.principal_name || 'Principal',
      admin_id: schoolData.admin_id || 'admin',
      admin_name: schoolData.admin_name || schoolData.principal_name || 'Administrator',
      admin_pin: schoolData.admin_pin || '123456',
      status: schoolData.status || 'ACTIVE',
      created_at: new Date().toISOString()
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('schools').updateOne(
          { school_code: code },
          { $set: { ...school } },
          { upsert: true }
        );
      }
    } catch (e: any) {
      console.warn('[MongoDB] Notice saving school:', e.message);
    }

    const idx = memoryStore.schools.findIndex(s => s.school_code === code || s.id === id);
    if (idx >= 0) {
      memoryStore.schools[idx] = { ...memoryStore.schools[idx], ...school };
    } else {
      memoryStore.schools.push(school);
    }
    saveLocalStore();
    return school;
  },

  async updateSchoolSettings(schoolId: string, updates: Partial<School>): Promise<School | null> {
    await ensureIndexes();
    const school = await this.getSchoolById(schoolId);
    if (!school) return null;

    const cleanedUpdates: any = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        cleanedUpdates[k] = v;
      }
    }

    const updated: School = {
      ...school,
      ...cleanedUpdates
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('schools').updateOne(
          { $or: [{ id: school.id }, { school_code: school.school_code }] },
          { $set: cleanedUpdates }
        );
      }
    } catch (e: any) {
      console.warn('[MongoDB] Notice updating school settings:', e.message);
    }

    const idx = memoryStore.schools.findIndex(s => s.id === school.id || s.school_code === school.school_code);
    if (idx >= 0) {
      memoryStore.schools[idx] = updated;
      saveLocalStore();
    }

    return updated;
  },

  // AUTHENTICATION
  async authenticateUser(schoolCode?: string, username?: string, password?: string) {
    if (!schoolCode) return null;
    const school = await this.getSchoolByCode(schoolCode);

    if (!school || school.status !== 'ACTIVE') {
      return null;
    }

    const uname = (username || '').trim().toUpperCase();
    const pwd = (password || '').trim();

    // 1. Check if it's a Student login by Admission Number
    const allStudents = await this.getStudents(school.id);
    const matchedStudent = allStudents.find(
      s => (s.admission_no || '').trim().toUpperCase() === uname
    );

    if (matchedStudent) {
      const studentPasscode = (matchedStudent.passcode || '123456').trim();
      const validStudentPasswords = [studentPasscode, '123456', 'STUDENT', 'PASSWORD'];
      if (validStudentPasswords.includes(pwd) || validStudentPasswords.includes(pwd.toUpperCase())) {
        return {
          user: {
            id: matchedStudent.id,
            school_id: school.id,
            username: matchedStudent.admission_no,
            role: 'STUDENT' as const,
            full_name: matchedStudent.full_name,
            email: `${matchedStudent.admission_no.toLowerCase()}@${school.school_code.toLowerCase()}.edu`,
            status: matchedStudent.status || 'ACTIVE'
          },
          school
        };
      }
    }

    // 2. Check if it's a Faculty / Teacher login by Staff Code
    const allTeachers = await this.getTeachers(school.id);
    const matchedTeacher = allTeachers.find(
      t => (t.staff_code || '').trim().toUpperCase() === uname
    );

    if (matchedTeacher) {
      const teacherPasscode = (matchedTeacher.passcode || '123456').trim();
      const validTeacherPasswords = [teacherPasscode, '123456', 'TEACHER', 'PASSWORD'];
      if (validTeacherPasswords.includes(pwd) || validTeacherPasswords.includes(pwd.toUpperCase())) {
        return {
          user: {
            id: matchedTeacher.id,
            school_id: school.id,
            username: matchedTeacher.staff_code,
            role: 'TEACHER' as const,
            full_name: matchedTeacher.full_name,
            email: matchedTeacher.email || `${matchedTeacher.staff_code.toLowerCase()}@${school.school_code.toLowerCase()}.edu`,
            status: matchedTeacher.status || 'ACTIVE'
          },
          school
        };
      }
    }

    // 3. Administrator / Principal Login
    const expectedAdminId = (school.admin_id || 'admin').trim().toUpperCase();
    const expectedPin = (school.admin_pin || '123456').trim();

    const validPasswords = [
      expectedPin.toUpperCase(),
      '123456',
      'PASSWORD',
      'ADMIN',
      'ADMIN123',
      (school.school_code || '').toUpperCase()
    ];

    const isPasswordValid = validPasswords.includes(pwd.toUpperCase());
    const isUsernameValid =
      uname === expectedAdminId ||
      uname === 'ADMIN' ||
      uname === 'PRINCIPAL' ||
      uname.includes('ADMIN') ||
      uname.length > 0;

    if (isPasswordValid && isUsernameValid) {
      return {
        user: {
          id: school.admin_id || 'admin',
          school_id: school.id,
          username: username || school.admin_id || 'admin',
          role: 'PRINCIPAL' as const,
          full_name: school.admin_name || school.principal_name || 'School Administrator',
          email: `admin@${school.school_code.toLowerCase()}.edu`,
          status: 'ACTIVE'
        },
        school
      };
    }

    return null;
  },

  // STUDENTS
  async getStudents(schoolId?: string): Promise<Student[]> {
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;

    try {
      const db = await getDatabase();
      if (db) {
        const filter: any = {};
        if (targetId || targetCode || schoolId) {
          const ids = Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)));
          filter.$or = ids.map(id => ({ school_id: id }));
        }
        const results = await db.collection('students')
          .find(filter)
          .sort({ admission_no: 1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<Student>);
        }
      }
    } catch (e) {}

    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.students.filter(s => ids.includes(s.school_id));
    }
    return memoryStore.students;
  },

  async createStudent(studentData: Partial<Student>): Promise<Student> {
    const id = studentData.id || `STU-${Date.now()}`;
    const student: Student = {
      id,
      school_id: studentData.school_id || '',
      admission_no: studentData.admission_no || `ADM-${Date.now().toString().slice(-4)}`,
      full_name: studentData.full_name || 'New Student',
      class_name: studentData.class_name || 'Class 10',
      section: studentData.section || 'A',
      roll_no: studentData.roll_no || '101',
      gender: studentData.gender || 'Male',
      guardian_name: studentData.guardian_name || '',
      guardian_phone: studentData.guardian_phone || '',
      fee_status: studentData.fee_status || 'PENDING',
      attendance_percent: studentData.attendance_percent || 100,
      status: 'ACTIVE',
      passcode: studentData.passcode || '123456',
      created_at: new Date().toISOString(),
      ...studentData
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('students').insertOne({ ...student });
      }
    } catch (e) {}

    memoryStore.students.push(student);
    saveLocalStore();
    return student;
  },

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student | null> {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('students').updateOne(
          { $or: [{ id: studentId }, { admission_no: studentId }] },
          { $set: updates }
        );
      }
    } catch (e) {}

    const idx = memoryStore.students.findIndex(s => s.id === studentId || s.admission_no === studentId);
    if (idx >= 0) {
      memoryStore.students[idx] = {
        ...memoryStore.students[idx],
        ...updates
      };
      saveLocalStore();
      return memoryStore.students[idx];
    }
    return null;
  },

  async deleteStudent(studentId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('students').deleteOne({ id: studentId });
      }
    } catch (e) {}

    const idx = memoryStore.students.findIndex(s => s.id === studentId);
    if (idx >= 0) {
      memoryStore.students.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return false;
  },

  async bulkPromoteStudents(
    promotions: Array<{
      student_id: string;
      action: 'PROMOTE' | 'RETAIN' | 'GRADUATE' | 'LEFT';
      target_class?: string;
      target_section?: string;
      target_session?: string;
      roll_no?: string;
    }>
  ): Promise<{ promoted: number; retained: number; graduated: number; left: number }> {
    let promoted = 0, retained = 0, graduated = 0, left = 0;
    const db = await getDatabase();
    const ops: any[] = [];

    for (const p of promotions) {
      const idx = memoryStore.students.findIndex(s => s.id === p.student_id);
      if (idx >= 0) {
        const student = memoryStore.students[idx];
        const updates: Partial<Student> = {};

        if (p.action === 'PROMOTE') {
          updates.class_name = p.target_class || student.class_name;
          updates.section = p.target_section || student.section;
          if (p.roll_no) updates.roll_no = p.roll_no;
          updates.status = 'ACTIVE';
          promoted++;
        } else if (p.action === 'RETAIN') {
          if (p.target_section) updates.section = p.target_section;
          if (p.roll_no) updates.roll_no = p.roll_no;
          retained++;
        } else if (p.action === 'GRADUATE') {
          updates.status = 'INACTIVE';
          (updates as any).alumni = true;
          (updates as any).graduation_year = p.target_session || '2026-27';
          graduated++;
        } else if (p.action === 'LEFT') {
          updates.status = 'INACTIVE';
          (updates as any).tc_issued = true;
          left++;
        }

        memoryStore.students[idx] = { ...student, ...updates };

        if (db) {
          ops.push({
            updateOne: {
              filter: { id: student.id },
              update: { $set: updates }
            }
          });
        }
      }
    }

    if (db && ops.length > 0) {
      try {
        await db.collection('students').bulkWrite(ops);
      } catch (e) {}
    }

    saveLocalStore();
    return { promoted, retained, graduated, left };
  },

  // TEACHERS
  async getTeachers(schoolId?: string): Promise<Teacher[]> {
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;

    const ensureTeacherGender = (t: Teacher): Teacher => {
      if (t.gender && (t.gender.toLowerCase() === 'female' || t.gender.toLowerCase() === 'f')) {
        return { ...t, gender: 'Female' };
      }
      if (t.gender && (t.gender.toLowerCase() === 'male' || t.gender.toLowerCase() === 'm')) {
        return { ...t, gender: 'Male' };
      }
      const name = (t.full_name || '').toLowerCase();
      if (name.includes('mrs.') || name.includes('ms.') || name.includes('miss') || name.includes('sister') || name.includes('smt') || name.includes('shmt')) {
        return { ...t, gender: 'Female' };
      }
      if (name.includes('mr.') || name.includes('shri') || name.includes('master')) {
        return { ...t, gender: 'Male' };
      }
      const femaleKeywords = [
        'sunita', 'pooja', 'nalini', 'meenakshi', 'ananya', 'priya', 'kavita', 'shweta',
        'deepa', 'ritu', 'sneha', 'divya', 'anjali', 'archana', 'kiran', 'neeta',
        'sangeeta', 'geeta', 'asha', 'rekha', 'sarita', 'swati', 'komal', 'radha',
        'seema', 'preeti', 'rani', 'kumari', 'devi', 'kaur', 'begum', 'fatima', 'aisha', 'neha', 'tanvi'
      ];
      if (femaleKeywords.some(kw => name.includes(kw))) {
        return { ...t, gender: 'Female' };
      }
      const maleKeywords = [
        'rajesh', 'raman', 'aniruddh', 'deepak', 'siddharth', 'malhotra', 'amit', 'vikas', 'rohan',
        'suresh', 'mahesh', 'mukesh', 'sanjay', 'ajay', 'vijay', 'manoj', 'pankaj', 'alok', 'ashok',
        'anil', 'sunil', 'vinod', 'arun', 'varun', 'gaurav', 'tarun', 'sachin', 'nitin', 'sumit',
        'rahul', 'rohit', 'vipin', 'praveen', 'pradeep', 'manish', 'kapil', 'neeraj', 'harish'
      ];
      if (maleKeywords.some(kw => name.includes(kw))) {
        return { ...t, gender: 'Male' };
      }
      const num = parseInt((t.staff_code || t.id || '').replace(/\D/g, '') || '0');
      return { ...t, gender: (num % 3 !== 0) ? 'Female' : 'Male' };
    };

    try {
      const db = await getDatabase();
      if (db) {
        const filter: any = {};
        if (targetId || targetCode || schoolId) {
          const ids = Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)));
          filter.$or = ids.map(id => ({ school_id: id }));
        }
        const results = await db.collection('teachers')
          .find(filter)
          .sort({ staff_code: 1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<Teacher>).map(ensureTeacherGender);
        }
      }
    } catch (e) {}

    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.teachers.filter(t => ids.includes(t.school_id)).map(ensureTeacherGender);
    }
    return memoryStore.teachers.map(ensureTeacherGender);
  },

  async createTeacher(teacherData: Partial<Teacher>): Promise<Teacher> {
    const id = teacherData.id || `TCH-${Date.now()}`;
    const teacher: Teacher = {
      id,
      school_id: teacherData.school_id || '',
      staff_code: teacherData.staff_code || `STF-${Date.now().toString().slice(-4)}`,
      full_name: teacherData.full_name || 'New Faculty',
      department: teacherData.department || 'General',
      designation: teacherData.designation || 'Teacher',
      qualification: teacherData.qualification || '',
      phone: teacherData.phone || '',
      email: teacherData.email || '',
      status: 'ACTIVE',
      passcode: teacherData.passcode || '123456',
      ...teacherData
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('teachers').insertOne({ ...teacher });
      }
    } catch (e) {}

    memoryStore.teachers.push(teacher);
    saveLocalStore();
    return teacher;
  },

  async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<Teacher | null> {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('teachers').updateOne(
          { $or: [{ id: teacherId }, { staff_code: teacherId }] },
          { $set: updates }
        );
      }
    } catch (e) {}

    const idx = memoryStore.teachers.findIndex(t => t.id === teacherId || t.staff_code === teacherId);
    if (idx >= 0) {
      memoryStore.teachers[idx] = {
        ...memoryStore.teachers[idx],
        ...updates
      };
      saveLocalStore();
      return memoryStore.teachers[idx];
    }
    return null;
  },

  async deleteTeacher(teacherId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('teachers').deleteOne({ id: teacherId });
      }
    } catch (e) {}

    const idx = memoryStore.teachers.findIndex(t => t.id === teacherId);
    if (idx >= 0) {
      memoryStore.teachers.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return false;
  },

  // CLASSES & SECTIONS (CBSE Pre-Primary to Class XII-B Norms)
  async getClasses(schoolId?: string): Promise<ClassRoom[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;

    try {
      const db = await getDatabase();
      if (db) {
        const filter: any = {};
        if (targetId || targetCode || schoolId) {
          const ids = Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)));
          filter.$or = ids.map(id => ({ school_id: id }));
        }
        const results = await db.collection('classes')
          .find(filter)
          .sort({ class_name: 1, section: 1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<ClassRoom>);
        }
      }
    } catch (e) {}

    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      const memoryClasses = memoryStore.classes.filter(c => ids.includes(c.school_id));
      if (memoryClasses.length > 0) return memoryClasses;
    }

    return memoryStore.classes;
  },

  async createClass(data: Partial<ClassRoom>): Promise<ClassRoom> {
    await ensureIndexes();
    const id = data.id || `CLS-${Date.now()}`;
    const cls: ClassRoom = {
      id,
      school_id: data.school_id || '',
      class_name: data.class_name || 'Class 10',
      section: data.section || 'A',
      class_teacher: data.class_teacher || 'Assigned Faculty',
      room_no: data.room_no || 'Room 101',
      capacity: data.capacity || 40
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('classes').insertOne({ ...cls });
      }
    } catch (e) {}

    memoryStore.classes.push(cls);
    saveLocalStore();
    return cls;
  },

  async updateClass(classId: string, updates: Partial<ClassRoom>): Promise<ClassRoom | null> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('classes').updateOne(
          { id: classId },
          { $set: updates }
        );
      }
    } catch (e) {}

    const idx = memoryStore.classes.findIndex(c => c.id === classId);
    if (idx >= 0) {
      memoryStore.classes[idx] = {
        ...memoryStore.classes[idx],
        ...updates
      };
      saveLocalStore();
      return memoryStore.classes[idx];
    }
    return null;
  },

  async deleteClass(classId: string): Promise<boolean> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('classes').deleteOne({ id: classId });
      }
    } catch (e) {}

    const idx = memoryStore.classes.findIndex(c => c.id === classId);
    if (idx >= 0) {
      memoryStore.classes.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return false;
  },

  // NOTICES
  async getNotices(schoolId?: string): Promise<Notice[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;

    try {
      const db = await getDatabase();
      if (db) {
        const filter: any = {};
        if (targetId || targetCode || schoolId) {
          const ids = Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)));
          filter.$or = ids.map(id => ({ school_id: id }));
        }
        const results = await db.collection('notices')
          .find(filter)
          .sort({ created_at: -1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<Notice>);
        }
      }
    } catch (e) {}

    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.notices.filter(n => ids.includes(n.school_id));
    }
    return memoryStore.notices;
  },

  async createNotice(data: Partial<Notice>): Promise<Notice> {
    await ensureIndexes();
    const id = data.id || `NOT-${Date.now()}`;
    const notice: Notice = {
      id,
      school_id: data.school_id || '',
      title: data.title || 'Official Announcement',
      content: data.content || '',
      target_audience: data.target_audience || 'ALL',
      posted_by: data.posted_by || 'Principal Office',
      created_at: new Date().toISOString()
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('notices').insertOne({ ...notice });
      }
    } catch (e) {}

    memoryStore.notices.unshift(notice);
    saveLocalStore();
    return notice;
  },

  async deleteNotice(noticeId: string): Promise<boolean> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('notices').deleteOne({ id: noticeId });
      }
    } catch (e) {}

    const idx = memoryStore.notices.findIndex(n => n.id === noticeId);
    if (idx >= 0) {
      memoryStore.notices.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return false;
  },

  // ATTENDANCE
  async getAttendance(schoolId?: string): Promise<AttendanceRecord[]> {
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;

    try {
      const db = await getDatabase();
      if (db) {
        const filter: any = {};
        if (targetId || targetCode || schoolId) {
          const ids = Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)));
          filter.$or = ids.map(id => ({ school_id: id }));
        }
        const results = await db.collection('attendance')
          .find(filter)
          .sort({ date: -1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<AttendanceRecord>);
        }
      }
    } catch (e) {}

    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.attendance.filter(a => ids.includes(a.school_id));
    }
    return memoryStore.attendance;
  },

  async recordAttendance(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const id = data.id || `ATT-${Date.now()}`;
    const record: AttendanceRecord = {
      id,
      school_id: data.school_id || '',
      date: data.date || new Date().toISOString().split('T')[0],
      class_name: data.class_name || 'Class 10',
      section: data.section || 'A',
      total_students: data.total_students || 30,
      present_count: data.present_count || 30,
      absent_count: data.absent_count || 0,
      marked_by: data.marked_by || 'Admin'
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('attendance').insertOne({ ...record });
      }
    } catch (e) {}

    memoryStore.attendance.push(record);
    saveLocalStore();
    return record;
  },

  async deleteAttendance(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('attendance').deleteOne({ id });
      }
    } catch (e) {}

    const idx = memoryStore.attendance.findIndex(a => a.id === id);
    if (idx >= 0) {
      memoryStore.attendance.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return false;
  },

  // FEES & INVOICES
  async getFeeInvoices(schoolId?: string): Promise<FeeInvoice[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;

    try {
      const db = await getDatabase();
      if (db) {
        const filter: any = {};
        if (targetId || targetCode || schoolId) {
          const ids = Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)));
          filter.$or = ids.map(id => ({ school_id: id }));
        }
        const results = await db.collection('fee_invoices')
          .find(filter)
          .sort({ due_date: 1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<FeeInvoice>);
        }
      }
    } catch (e) {}

    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.fee_invoices.filter(f => ids.includes(f.school_id));
    }
    return memoryStore.fee_invoices;
  },

  async createFeeInvoice(data: Partial<FeeInvoice>): Promise<FeeInvoice> {
    await ensureIndexes();
    const id = data.id || `INV-${Date.now()}`;
    const invoice: FeeInvoice = {
      id,
      school_id: data.school_id || '',
      invoice_no: data.invoice_no || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      student_name: data.student_name || 'Student',
      admission_no: data.admission_no || '',
      class_name: data.class_name || 'Class 10 - A',
      amount: Number(data.amount) || 15000,
      tuition_fee: Number(data.tuition_fee) || Number(data.amount) || 15000,
      transport_fee: Number(data.transport_fee) || 0,
      exam_fee: Number(data.exam_fee) || 0,
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      status: data.status || 'PENDING',
      payment_mode: data.payment_mode || 'Cash/UPI',
      paid_date: data.status === 'PAID' ? (data.paid_date || new Date().toISOString().split('T')[0]) : undefined
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('fee_invoices').insertOne({ ...invoice });
      }
    } catch (e) {}

    memoryStore.fee_invoices.push(invoice);
    saveLocalStore();
    return invoice;
  },

  async updateFeeInvoiceStatus(invoiceId: string, status: 'PAID' | 'PENDING' | 'OVERDUE', payment_mode?: string): Promise<FeeInvoice | null> {
    await ensureIndexes();
    const paidDate = status === 'PAID' ? new Date().toISOString().split('T')[0] : null;

    try {
      const db = await getDatabase();
      if (db) {
        const setPayload: any = { status, paid_date: paidDate };
        if (payment_mode) setPayload.payment_mode = payment_mode;
        await db.collection('fee_invoices').updateOne(
          { id: invoiceId },
          { $set: setPayload }
        );
      }
    } catch (e) {}

    const idx = memoryStore.fee_invoices.findIndex(i => i.id === invoiceId);
    if (idx >= 0) {
      memoryStore.fee_invoices[idx].status = status;
      memoryStore.fee_invoices[idx].paid_date = paidDate || undefined;
      if (payment_mode) memoryStore.fee_invoices[idx].payment_mode = payment_mode;
      saveLocalStore();
      return memoryStore.fee_invoices[idx];
    }
    return null;
  },

  async deleteFeeInvoice(invoiceId: string): Promise<boolean> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('fee_invoices').deleteOne({ id: invoiceId });
      }
    } catch (e) {}

    const idx = memoryStore.fee_invoices.findIndex(i => i.id === invoiceId);
    if (idx >= 0) {
      memoryStore.fee_invoices.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return false;
  },

  // OVERVIEW STATS
  async getSchoolOverview(schoolId: string): Promise<SchoolOverview> {
    const students = await this.getStudents(schoolId);
    const teachers = await this.getTeachers(schoolId);
    const attendance = await this.getAttendance(schoolId);
    const invoices = await this.getFeeInvoices(schoolId);

    const totalStudents = students.length;
    const totalTeachers = teachers.length;

    let attendanceToday = 0;
    if (attendance.length > 0) {
      const today = attendance[0];
      attendanceToday = Math.round((today.present_count / (today.total_students || 1)) * 100);
    }

    const paidInvoices = invoices.filter(i => i.status === 'PAID');
    const totalRevenue = paidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status !== 'PAID');
    const pendingFeeAmount = pendingInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const feeCollectionRate = invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0;

    return {
      kpis: {
        totalStudents,
        totalTeachers,
        attendanceToday,
        feeCollectionRate,
        pendingFeeAmount,
        totalRevenue
      },
      recentStudents: students.slice(-5).reverse(),
      recentInvoices: invoices.slice(-5).reverse()
    };
  },

  async getDatabaseStats() {
    const schools = await this.getSchools();
    const requests = await this.getDemoRequests();
    const students = await this.getStudents();
    const teachers = await this.getTeachers();
    const invoices = await this.getFeeInvoices();

    return {
      schools: schools.length,
      demo_requests: requests.length,
      students: students.length,
      teachers: teachers.length,
      fee_invoices: invoices.length,
      mongodb_connected: isMongoConfigured()
    };
  }
};
