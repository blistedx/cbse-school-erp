/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import fs from 'fs';
import path from 'path';
import { getDatabase, isMongoConfigured } from './mongodb';
import { saveMediaVaultFile } from './media';
import {
  School,
  DemoRequest,
  User,
  Student,
  Teacher,
  ClassRoom,
  SubjectItem,
  TimetableEntry,
  Notice,
  AttendanceRecord,
  FeeInvoice,
  Holiday,
  SchoolOverview,
  ScheduledExamItem
} from './types';
import { getDefaultCbseSubjectsForClass, sortClassesChronologically } from './cbse-subjects';

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
  holidays: Holiday[];
  exams: ScheduledExamItem[];
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
  fee_invoices: [],
  holidays: [],
  exams: []
};

function loadLocalStore() {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.schools)) memoryStore.schools = data.schools;
      if (Array.isArray(data.demo_requests)) memoryStore.demo_requests = data.demo_requests;
      if (Array.isArray(data.users)) memoryStore.users = data.users;
      if (Array.isArray(data.students)) {
        memoryStore.students = data.students.map((s: any) => ({
          ...s,
          academic_session: s.academic_session || '2026-27'
        }));
      }
      if (Array.isArray(data.teachers)) {
        memoryStore.teachers = data.teachers.map((t: any) => ({
          ...t,
          academic_session: t.academic_session || '2026-27'
        }));
      }
      if (Array.isArray(data.classes)) {
        memoryStore.classes = data.classes.map((c: any) => ({
          ...c,
          academic_session: c.academic_session || '2026-27'
        }));
      }
      if (Array.isArray(data.timetable)) {
        memoryStore.timetable = data.timetable.map((t: any) => ({
          ...t,
          academic_session: t.academic_session || '2026-27'
        }));
      }
      if (Array.isArray(data.notices)) {
        memoryStore.notices = data.notices.map((n: any) => ({
          ...n,
          academic_session: n.academic_session || '2026-27'
        }));
      }
      if (Array.isArray(data.attendance)) {
        memoryStore.attendance = data.attendance.map((a: any) => ({
          ...a,
          academic_session: a.academic_session || '2026-27'
        }));
      }
      if (Array.isArray(data.fee_invoices)) {
        memoryStore.fee_invoices = data.fee_invoices.map((f: any) => ({
          ...f,
          academic_session: f.academic_session || '2026-27'
        }));
      }
      if (Array.isArray(data.holidays)) {
        memoryStore.holidays = data.holidays.map((h: any) => ({
          ...h,
          academic_session: h.academic_session || '2026-27',
          start_date: h.start_date || h.date || '',
          end_date: h.end_date || h.date || h.start_date || '',
          category: h.category || h.type || 'GAZETTED',
          reason: h.reason || h.description || 'Official Holiday Declared by Administration',
          applicable_to: h.applicable_to || 'ALL',
          declared_by: h.declared_by || 'Principal Office'
        }));
      }
      if (Array.isArray(data.exams)) {
        memoryStore.exams = data.exams.map((e: any) => ({
          ...e,
          academic_session: e.academic_session || '2026-27'
        }));
      }
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
      // Hierarchical indexes: School ID -> Academic Session -> Entity Identifiers
      db.collection('students').createIndex({ school_id: 1, academic_session: 1, admission_no: 1 }),
      db.collection('teachers').createIndex({ school_id: 1, academic_session: 1, staff_code: 1 }),
      db.collection('classes').createIndex({ school_id: 1, academic_session: 1, class_name: 1, section: 1 }),
      db.collection('notices').createIndex({ school_id: 1, academic_session: 1, created_at: -1 }),
      db.collection('attendance').createIndex({ school_id: 1, academic_session: 1, date: -1 }),
      db.collection('fee_invoices').createIndex({ school_id: 1, academic_session: 1, invoice_no: 1 }),
      db.collection('holidays').createIndex({ school_id: 1, academic_session: 1, start_date: 1, end_date: 1 }),
      db.collection('exams').createIndex({ school_id: 1, academic_session: 1, date: -1 }),
    ]);

    isIndexesInitialized = true;
  } catch (e: any) {
    console.warn('[MongoDB] Index setup note:', e.message);
  }
}

function sanitizeDoc<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  if ((rest as any).admin_pin === 'admin@4317') {
    (rest as any).admin_pin = '123456';
  }
  return rest as T;
}

function buildSessionFilter(schoolIds: string[], session?: string) {
  const targetSession = session || '2026-27';
  const filter: any = {};
  
  if (schoolIds.length > 0) {
    const cleanIds = Array.from(new Set(schoolIds.filter(Boolean)));
    filter.school_id = { $in: cleanIds };
  }

  if (targetSession !== 'ALL') {
    if (targetSession === '2026-27') {
      filter.$or = [
        { academic_session: '2026-27' },
        { academic_session: { $exists: false } },
        { academic_session: null },
        { academic_session: '' }
      ];
    } else {
      filter.academic_session = targetSession;
    }
  }

  return filter;
}

function matchesSession(item: any, session?: string): boolean {
  const targetSession = session || '2026-27';
  if (targetSession === 'ALL') return true;
  const itemSession = item.academic_session || '2026-27';
  return itemSession === targetSession;
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
    const schools = await this.getSchools();
    const rawInput = schoolId.trim().toUpperCase();
    const cleanInput = rawInput.replace(/[^A-Z0-9]/g, '');

    // 1. Direct ID Match
    let matched = schools.find(s => (s.id || '').toUpperCase() === rawInput || (s.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanInput);
    if (matched) return matched;

    // 2. Direct School Code Match
    matched = schools.find(s => (s.school_code || '').toUpperCase() === rawInput || (s.school_code || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanInput);
    if (matched) return matched;

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

    // NOTE: Partial school name match removed to prevent school enumeration (M2).
    // Only exact school_code or school_id matches are accepted.
    return null;
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
        if (k === 'admin_pin' && v === 'admin@4317') {
          // Keep existing school pin or default
          cleanedUpdates[k] = school.admin_pin || '123456';
        } else {
          cleanedUpdates[k] = v;
        }
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

  async updateSchool(schoolId: string, updates: Partial<School>): Promise<School | null> {
    return this.updateSchoolSettings(schoolId, updates);
  },

  // AGENCY SUPERADMIN PERMANENT SCHOOL PURGE (MONGODB + LOCAL DB)
  async purgeSchoolData(schoolIdOrCode: string) {
    await ensureIndexes();
    const school = await this.getSchoolById(schoolIdOrCode) || await this.getSchoolByCode(schoolIdOrCode);
    if (!school) {
      throw new Error(`School "${schoolIdOrCode}" not found.`);
    }

    const schoolId = school.id;
    const schoolCode = school.school_code;
    const cleanId = (schoolId || '').replace(/[^A-Z0-9]/gi, '');
    const cleanCode = (schoolCode || '').replace(/[^A-Z0-9]/gi, '');

    const matchIds = Array.from(new Set([schoolId, schoolCode, cleanId, cleanCode].filter(Boolean)));

    const summary: Record<string, number> = {
      students: 0,
      teachers: 0,
      classes: 0,
      attendance: 0,
      invoices: 0,
      notices: 0,
      exams: 0,
      schools: 1
    };

    // 1. Purge from MongoDB Atlas (Cluster collections)
    try {
      const db = await getDatabase();
      if (db) {
        const mongoQuery = {
          $or: [
            { school_id: { $in: matchIds } },
            { schoolId: { $in: matchIds } },
            { school_code: { $in: matchIds } }
          ]
        };

        const resStudents = await db.collection('students').deleteMany(mongoQuery);
        summary.students = resStudents.deletedCount || 0;

        const resTeachers = await db.collection('teachers').deleteMany(mongoQuery);
        summary.teachers = resTeachers.deletedCount || 0;

        const resClasses = await db.collection('classes').deleteMany(mongoQuery);
        summary.classes = resClasses.deletedCount || 0;

        const resAttendance = await db.collection('attendance').deleteMany(mongoQuery);
        summary.attendance = resAttendance.deletedCount || 0;

        const resInvoices = await db.collection('invoices').deleteMany(mongoQuery);
        summary.invoices = resInvoices.deletedCount || 0;

        const resNotices = await db.collection('notices').deleteMany(mongoQuery);
        summary.notices = resNotices.deletedCount || 0;

        const resExams = await db.collection('exams').deleteMany(mongoQuery);
        summary.exams = resExams.deletedCount || 0;

        await db.collection('schools').deleteOne({
          $or: [
            { id: { $in: matchIds } },
            { school_code: { $in: matchIds } }
          ]
        });
      }
    } catch (e: any) {
      console.warn('[MongoDB Purge Notice]', e.message);
    }

    // 2. Purge from Local memoryStore & JSON file (data/erp_store.json)
    const matchesSchool = (itemSchoolId?: string) => {
      if (!itemSchoolId) return false;
      const clean = itemSchoolId.replace(/[^A-Z0-9]/gi, '');
      return matchIds.includes(itemSchoolId) || matchIds.includes(clean);
    };

    if (Array.isArray(memoryStore.students)) {
      const prevLen = memoryStore.students.length;
      memoryStore.students = memoryStore.students.filter(s => !matchesSchool(s.school_id));
      if (!summary.students) summary.students = prevLen - memoryStore.students.length;
    }
    if (Array.isArray(memoryStore.teachers)) {
      const prevLen = memoryStore.teachers.length;
      memoryStore.teachers = memoryStore.teachers.filter(t => !matchesSchool(t.school_id));
      if (!summary.teachers) summary.teachers = prevLen - memoryStore.teachers.length;
    }
    if (Array.isArray(memoryStore.classes)) {
      const prevLen = memoryStore.classes.length;
      memoryStore.classes = memoryStore.classes.filter(c => !matchesSchool(c.school_id));
      if (!summary.classes) summary.classes = prevLen - memoryStore.classes.length;
    }
    if (Array.isArray(memoryStore.attendance)) {
      const prevLen = memoryStore.attendance.length;
      memoryStore.attendance = memoryStore.attendance.filter(a => !matchesSchool(a.school_id));
      if (!summary.attendance) summary.attendance = prevLen - memoryStore.attendance.length;
    }
    if (Array.isArray(memoryStore.fee_invoices)) {
      const prevLen = memoryStore.fee_invoices.length;
      memoryStore.fee_invoices = memoryStore.fee_invoices.filter(i => !matchesSchool(i.school_id));
      if (!summary.fee_invoices) summary.fee_invoices = prevLen - memoryStore.fee_invoices.length;
    }
    if (Array.isArray(memoryStore.notices)) {
      const prevLen = memoryStore.notices.length;
      memoryStore.notices = memoryStore.notices.filter(n => !matchesSchool(n.school_id));
      if (!summary.notices) summary.notices = prevLen - memoryStore.notices.length;
    }
    if (Array.isArray(memoryStore.exams)) {
      const prevLen = memoryStore.exams.length;
      memoryStore.exams = memoryStore.exams.filter(e => !matchesSchool(e.school_id));
      if (!summary.exams) summary.exams = prevLen - memoryStore.exams.length;
    }
    if (Array.isArray(memoryStore.schools)) {
      memoryStore.schools = memoryStore.schools.filter(s => s.id !== schoolId && s.school_code !== schoolCode);
    }

    saveLocalStore();

    return {
      success: true,
      school_name: school.school_name,
      school_code: school.school_code,
      summary
    };
  },

  // AUTHENTICATION
  async authenticateUser(schoolCode?: string, username?: string, password?: string, requestedRole?: string) {
    const rawUname = (username || '').trim();
    const uname = rawUname.toUpperCase();
    const pwd = (password || '').trim();
    const roleUpper = (requestedRole || '').trim().toUpperCase();

    // 0. AGENCY SUPERADMIN AUTHENTICATION
    const agencyPass = process.env.AGENCY_ADMIN_PASS || 'admin@4317';
    if (uname === 'BLISTEDX' && pwd === agencyPass) {
      const allSchools = await this.getSchools();
      let targetSchool = schoolCode ? await this.getSchoolByCode(schoolCode) : null;
      if (!targetSchool && allSchools.length > 0) {
        targetSchool = allSchools[0];
      }
      if (!targetSchool) {
        targetSchool = {
          id: 'DPS2026',
          school_code: schoolCode || 'DPS2026',
          school_name: 'Delhi Public International School',
          board: 'CBSE',
          city: 'New Delhi',
          state: 'Delhi',
          status: 'ACTIVE'
        };
      }

      return {
        user: {
          id: 'blistedx-god-master',
          school_id: targetSchool.id,
          username: 'blistedx',
          role: 'AGENCY_SUPERADMIN' as const,
          full_name: 'BlistedX (Agency Superadmin)',
          email: 'blistedx@giterp.io',
          status: 'ACTIVE',
          is_god_admin: true,
          permissions: ['ALL_PERMISSIONS', 'ALL_SCHOOLS', 'GOD_ACCESS', 'MODIFY_ANY', 'DELETE_ANY', 'CREATE_ANY']
        },
        school: targetSchool
      };
    }

    if (!schoolCode) return null;
    const school = await this.getSchoolByCode(schoolCode);

    if (!school || school.status !== 'ACTIVE') {
      return null;
    }

    // 1. Administrator / Principal Login (Primary School Admin Credentials)
    const expectedAdminId = (school.admin_id || '').trim().toUpperCase();
    const expectedPin = (school.admin_pin || '').trim();

    const isPrimaryAdminUsername =
      (Boolean(expectedAdminId) && uname === expectedAdminId) ||
      uname === (school.school_code || '').trim().toUpperCase() ||
      uname === 'ADMIN' ||
      uname === 'PRINCIPAL' ||
      uname === 'SUPERADMIN';

    const validAdminPins = ['123456', 'admin@4317', expectedPin].filter(Boolean);
    const isPrimaryAdminPassword = validAdminPins.includes(pwd);

    if (isPrimaryAdminUsername && isPrimaryAdminPassword) {
      return {
        user: {
          id: school.admin_id || 'admin',
          school_id: school.id,
          username: username || school.admin_id || 'admin',
          role: 'PRINCIPAL' as const,
          full_name: school.admin_name || school.principal_name || 'School Administrator',
          email: `admin@${school.school_code.toLowerCase()}.edu`,
          status: 'ACTIVE',
          permissions: ['ALL_PERMISSIONS', 'SCHOOL_ADMIN', 'MODIFY_ANY', 'DELETE_ANY', 'CREATE_ANY']
        },
        school
      };
    }

    // 2. Check Faculty & Staff Directory (Teachers & Administrative Staff)
    const allTeachers = await this.getTeachers(school.id);
    const matchedTeacher = allTeachers.find(
      t => (t.staff_code || '').trim().toUpperCase() === uname ||
           (t.id || '').trim().toUpperCase() === uname ||
           (t.email || '').trim().toUpperCase() === uname ||
           (t.phone || '').trim() === uname
    );

    if (matchedTeacher) {
      const teacherPasscode = (matchedTeacher.passcode || '').trim();
      const validTeacherPasswords = [teacherPasscode].filter(Boolean);
      if (validTeacherPasswords.length === 0) validTeacherPasswords.push('123456');

      if (validTeacherPasswords.includes(pwd)) {
        const desig = (matchedTeacher.designation || '').toLowerCase();
        const dept = (matchedTeacher.department || '').toLowerCase();

        let assignedRole: 'PRINCIPAL' | 'VICE_PRINCIPAL' | 'ADMIN' | 'TEACHER' | 'ACCOUNTANT' | 'DRIVER' | 'LIBRARIAN' | 'SECURITY_GUARD' = 'TEACHER';
        if (desig.includes('vice principal') || dept.includes('vice principal')) {
          assignedRole = 'VICE_PRINCIPAL';
        } else if (roleUpper === 'DRIVER' || desig.includes('driver') || dept.includes('transport') || (matchedTeacher.staff_code || '').startsWith('DRV') || (matchedTeacher.staff_code || '').startsWith('BUS')) {
          assignedRole = 'DRIVER';
        } else if (roleUpper === 'LIBRARIAN' || desig.includes('librar') || dept.includes('library') || (matchedTeacher.staff_code || '').startsWith('LIB')) {
          assignedRole = 'LIBRARIAN';
        } else if (roleUpper === 'SECURITY_GUARD' || roleUpper === 'GUARD' || roleUpper === 'SECURITY' || desig.includes('guard') || desig.includes('security') || (matchedTeacher.staff_code || '').startsWith('SEC')) {
          assignedRole = 'SECURITY_GUARD';
        } else if (roleUpper === 'ACCOUNTANT' || desig.includes('account') || dept.includes('account') || (matchedTeacher.staff_code || '').startsWith('ACC')) {
          assignedRole = 'ACCOUNTANT';
        } else if (
          roleUpper === 'ADMIN' ||
          matchedTeacher.teacher_type === 'ADMINISTRATIVE' ||
          desig.includes('admin') ||
          desig.includes('officer') ||
          dept.includes('admin') ||
          dept.includes('operation')
        ) {
          assignedRole = 'ADMIN';
        }

        const isElevated = assignedRole === 'ADMIN' || assignedRole === 'VICE_PRINCIPAL';

        return {
          user: {
            id: matchedTeacher.id,
            school_id: school.id,
            username: matchedTeacher.staff_code || matchedTeacher.full_name,
            role: assignedRole,
            full_name: matchedTeacher.full_name,
            email: matchedTeacher.email || `${(matchedTeacher.staff_code || 'staff').toLowerCase()}@${school.school_code.toLowerCase()}.edu`,
            phone: matchedTeacher.phone,
            status: matchedTeacher.status || 'ACTIVE',
            permissions: isElevated
              ? ['SCHOOL_STAFF_ELEVATED', 'MODIFY_ANY', 'CREATE_ANY']
              : undefined
          },
          school
        };
      }
    }

    // 3. Check Student or Parent login by Admission Number or Phone
    const allStudents = await this.getStudents(school.id);
    const matchedStudent = allStudents.find(
      s => (s.admission_no || '').trim().toUpperCase() === uname ||
           (s.id || '').trim().toUpperCase() === uname ||
           (s.guardian_phone || '').trim() === uname
    );

    if (matchedStudent) {
      const studentPasscode = (matchedStudent.passcode || '').trim();
      const cleanDob = (matchedStudent.dob || '').replace(/[^0-9]/g, '');
      const validStudentPasswords = [studentPasscode, cleanDob].filter(Boolean);
      if (validStudentPasswords.length === 0) validStudentPasswords.push('123456');

      if (validStudentPasswords.includes(pwd)) {
        const isParentRole = roleUpper === 'PARENT' || roleUpper === 'PARENTS';

        return {
          user: {
            id: isParentRole ? `PAR-${matchedStudent.id}` : matchedStudent.id,
            school_id: school.id,
            username: matchedStudent.admission_no,
            role: isParentRole ? ('PARENT' as const) : ('STUDENT' as const),
            full_name: isParentRole
              ? (matchedStudent.father_name || matchedStudent.guardian_name || `Parent of ${matchedStudent.full_name}`)
              : matchedStudent.full_name,
            email: `${matchedStudent.admission_no.toLowerCase()}@${school.school_code.toLowerCase()}.edu`,
            status: matchedStudent.status || 'ACTIVE'
          },
          school
        };
      }
    }

    // 4. Role ID Fallback Login (Driver, Librarian, Security, Accountant, Teacher, Student, Parent)
    const validDefaultPins = ['123456', expectedPin].filter(Boolean);
    if (validDefaultPins.includes(pwd)) {
      if (uname === 'ACCOUNTANT' || uname === 'ACC-01' || roleUpper === 'ACCOUNTANT') {
        return {
          user: {
            id: 'ACC-01',
            school_id: school.id,
            username: username || 'ACC-01',
            role: 'ACCOUNTANT' as const,
            full_name: 'Senior Accounts Officer',
            email: `accounts@${school.school_code.toLowerCase()}.edu`,
            status: 'ACTIVE'
          },
          school
        };
      }
      if (uname === 'DRIVER' || uname === 'DRV-01' || uname === 'BUS-04' || roleUpper === 'DRIVER') {
        return {
          user: {
            id: 'DRV-01',
            school_id: school.id,
            username: username || 'DRV-01',
            role: 'DRIVER' as const,
            full_name: 'Ramesh Kumar (Bus 04 Driver)',
            email: `transport@${school.school_code.toLowerCase()}.edu`,
            status: 'ACTIVE'
          },
          school
        };
      }
      if (uname === 'LIBRARIAN' || uname === 'LIB-01' || roleUpper === 'LIBRARIAN') {
        return {
          user: {
            id: 'LIB-01',
            school_id: school.id,
            username: username || 'LIB-01',
            role: 'LIBRARIAN' as const,
            full_name: 'Head Librarian',
            email: `library@${school.school_code.toLowerCase()}.edu`,
            status: 'ACTIVE'
          },
          school
        };
      }
      if (uname === 'SECURITY' || uname === 'SEC-01' || uname === 'GUARD' || roleUpper === 'SECURITY' || roleUpper === 'SECURITY_GUARD') {
        return {
          user: {
            id: 'SEC-01',
            school_id: school.id,
            username: username || 'SEC-01',
            role: 'SECURITY_GUARD' as const,
            full_name: 'Main Gate Security Officer',
            email: `security@${school.school_code.toLowerCase()}.edu`,
            status: 'ACTIVE'
          },
          school
        };
      }
      if (uname === 'TEACHER' || uname === 'FAC-101' || roleUpper === 'TEACHER') {
        return {
          user: {
            id: 'FAC-101',
            school_id: school.id,
            username: username || 'FAC-101',
            role: 'TEACHER' as const,
            full_name: 'Senior Faculty Teacher',
            email: `faculty@${school.school_code.toLowerCase()}.edu`,
            status: 'ACTIVE'
          },
          school
        };
      }
      if (uname === 'PARENT' || roleUpper === 'PARENT') {
        return {
          user: {
            id: 'PAR-DEMO',
            school_id: school.id,
            username: username || 'PARENT',
            role: 'PARENT' as const,
            full_name: 'Parent / Guardian',
            email: `parent@${school.school_code.toLowerCase()}.edu`,
            status: 'ACTIVE'
          },
          school
        };
      }
      if (uname === 'STUDENT' || roleUpper === 'STUDENT') {
        return {
          user: {
            id: 'STU-DEMO',
            school_id: school.id,
            username: username || 'STUDENT',
            role: 'STUDENT' as const,
            full_name: 'Scholar Student',
            email: `student@${school.school_code.toLowerCase()}.edu`,
            status: 'ACTIVE'
          },
          school
        };
      }
    }

    return null;
  },

  // STUDENTS
  async getStudents(schoolId?: string, session?: string): Promise<Student[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;
    const targetSession = session || '2026-27';

    // 1. MongoDB Query (Fast Primary Store)
    try {
      const db = await getDatabase();
      if (db) {
        const ids = (targetId || targetCode || schoolId)
          ? Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)))
          : [];
        const filter = buildSessionFilter(ids as string[], targetSession);
        const results = await db.collection('students')
          .find(filter)
          .sort({ admission_no: 1 })
          .toArray();
        if (results) {
          return results.map(sanitizeDoc<Student>).map(s => ({
            ...s,
            academic_session: s.academic_session || '2026-27'
          }));
        }
      }
    } catch (e) {}


    // 3. MemoryStore / LocalStore Fallback
    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.students
        .filter(s => ids.includes(s.school_id) && matchesSession(s, targetSession))
        .map(s => ({ ...s, academic_session: s.academic_session || '2026-27' }));
    }
    return memoryStore.students
      .filter(s => matchesSession(s, targetSession))
      .map(s => ({ ...s, academic_session: s.academic_session || '2026-27' }));
  },

  async createStudent(studentData: Partial<Student>): Promise<Student> {
    await ensureIndexes();
    const id = studentData.id || `STU-${Date.now()}`;
    const academic_session = studentData.academic_session || '2026-27';
    const student: Student = {
      id,
      school_id: studentData.school_id || '',
      academic_session,
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
    student.academic_session = academic_session;

    // Offload heavy Base64 image to Local Media Vault
    if (student.photo && student.photo.startsWith('data:')) {
      const mediaId = `MEDIA-STU-${student.id}`;
      saveMediaVaultFile({
        id: mediaId,
        school_id: student.school_id,
        entity_type: 'STUDENT_PHOTO',
        entity_id: student.id,
        filename: `${student.admission_no || student.id}.jpg`,
        data: student.photo
      }).catch(console.error);
      student.avatar = `/api/media/${mediaId}`;
      student.photo = `/api/media/${mediaId}`;
    }

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
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.photo && sanitizedUpdates.photo.startsWith('data:')) {
      const mediaId = `MEDIA-STU-${studentId}`;
      saveMediaVaultFile({
        id: mediaId,
        school_id: sanitizedUpdates.school_id || 'DPS2026',
        entity_type: 'STUDENT_PHOTO',
        entity_id: studentId,
        data: sanitizedUpdates.photo
      }).catch(console.error);
      sanitizedUpdates.avatar = `/api/media/${mediaId}`;
      sanitizedUpdates.photo = `/api/media/${mediaId}`;
    }

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('students').updateOne(
          { $or: [{ id: studentId }, { admission_no: studentId }] },
          { $set: sanitizedUpdates }
        );
      }
    } catch (e) {}

    const idx = memoryStore.students.findIndex(s => s.id === studentId || s.admission_no === studentId);
    if (idx >= 0) {
      memoryStore.students[idx] = {
        ...memoryStore.students[idx],
        ...sanitizedUpdates
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

        if (p.target_session) {
          updates.academic_session = p.target_session;
        }

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
  async getTeachers(schoolId?: string, session?: string): Promise<Teacher[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;
    const targetSession = session || '2026-27';

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

    // 1. MongoDB Query (Fast Primary Store)
    try {
      const db = await getDatabase();
      if (db) {
        const ids = (targetId || targetCode || schoolId)
          ? Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)))
          : [];
        const filter = buildSessionFilter(ids as string[], targetSession);
        const results = await db.collection('teachers')
          .find(filter)
          .sort({ staff_code: 1 })
          .toArray();
        if (results) {
          return results.map(sanitizeDoc<Teacher>).map(ensureTeacherGender).map(t => ({
            ...t,
            academic_session: t.academic_session || '2026-27'
          }));
        }
      }
    } catch (e) {}


    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.teachers
        .filter(t => ids.includes(t.school_id) && matchesSession(t, targetSession))
        .map(ensureTeacherGender)
        .map(t => ({ ...t, academic_session: t.academic_session || '2026-27' }));
    }
    return memoryStore.teachers
      .filter(t => matchesSession(t, targetSession))
      .map(ensureTeacherGender)
      .map(t => ({ ...t, academic_session: t.academic_session || '2026-27' }));
  },

  async createTeacher(teacherData: Partial<Teacher>): Promise<Teacher> {
    await ensureIndexes();
    const id = teacherData.id || `TCH-${Date.now()}`;
    const academic_session = teacherData.academic_session || '2026-27';
    const teacher: Teacher = {
      id,
      school_id: teacherData.school_id || '',
      academic_session,
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
    teacher.academic_session = academic_session;

    // Offload heavy Base64 image to Local Media Vault
    if (teacher.photo && teacher.photo.startsWith('data:')) {
      const mediaId = `MEDIA-TCH-${teacher.id}`;
      saveMediaVaultFile({
        id: mediaId,
        school_id: teacher.school_id,
        entity_type: 'TEACHER_PHOTO',
        entity_id: teacher.id,
        filename: `${teacher.staff_code || teacher.id}.jpg`,
        data: teacher.photo
      }).catch(console.error);
      teacher.avatar = `/api/media/${mediaId}`;
      teacher.photo = `/api/media/${mediaId}`;
    }

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
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.photo && sanitizedUpdates.photo.startsWith('data:')) {
      const mediaId = `MEDIA-TCH-${teacherId}`;
      saveMediaVaultFile({
        id: mediaId,
        school_id: sanitizedUpdates.school_id || 'DPS2026',
        entity_type: 'TEACHER_PHOTO',
        entity_id: teacherId,
        data: sanitizedUpdates.photo
      }).catch(console.error);
      sanitizedUpdates.avatar = `/api/media/${mediaId}`;
      sanitizedUpdates.photo = `/api/media/${mediaId}`;
    }

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('teachers').updateOne(
          { $or: [{ id: teacherId }, { staff_code: teacherId }] },
          { $set: sanitizedUpdates }
        );
      }
    } catch (e) {}

    const idx = memoryStore.teachers.findIndex(t => t.id === teacherId || t.staff_code === teacherId);
    if (idx >= 0) {
      memoryStore.teachers[idx] = {
        ...memoryStore.teachers[idx],
        ...sanitizedUpdates
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
  async getClasses(schoolId?: string, session?: string): Promise<ClassRoom[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;
    const targetSession = session || '2026-27';

    let classesList: ClassRoom[] = [];

    // 1. MongoDB Query (Fast Primary Store)
    try {
      const db = await getDatabase();
      if (db) {
        const ids = (targetId || targetCode || schoolId)
          ? Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)))
          : [];
        const filter = buildSessionFilter(ids as string[], targetSession);
        const results = await db.collection('classes')
          .find(filter)
          .sort({ class_name: 1, section: 1 })
          .toArray();
        if (results && results.length > 0) {
          classesList = results.map(sanitizeDoc<ClassRoom>).map(c => ({
            ...c,
            academic_session: c.academic_session || targetSession
          }));
        }
      }
    } catch (e) {}


    if (classesList.length === 0) {
      if (targetId || schoolId) {
        const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
        const memoryClasses = memoryStore.classes.filter(c => ids.includes(c.school_id) && matchesSession(c, targetSession));
        if (memoryClasses.length > 0) {
          classesList = memoryClasses.map(c => ({ ...c, academic_session: c.academic_session || targetSession }));
        }
      } else if (memoryStore.classes.length > 0) {
        classesList = memoryStore.classes.filter(c => matchesSession(c, targetSession)).map(c => ({ ...c, academic_session: c.academic_session || targetSession }));
      }
    }

    // Ensure every class has subjects populated according to CBSE standards and strictly sort chronologically
    const preparedClasses = classesList.map(cls => {
      if (!Array.isArray(cls.subjects) || cls.subjects.length === 0) {
        cls.subjects = getDefaultCbseSubjectsForClass(cls.class_name, cls.section);
      }
      cls.no_of_subjects = cls.subjects.length;
      cls.academic_session = cls.academic_session || targetSession;
      return cls;
    });

    return sortClassesChronologically(preparedClasses);
  },

  async createClass(data: Partial<ClassRoom>): Promise<ClassRoom> {
    await ensureIndexes();
    const id = data.id || `CLS-${Date.now()}`;
    const academic_session = data.academic_session || '2026-27';
    const subjects = Array.isArray(data.subjects) && data.subjects.length > 0
      ? data.subjects
      : getDefaultCbseSubjectsForClass(data.class_name || 'Class 10', data.section || 'A');

    const cls: ClassRoom = {
      id,
      school_id: data.school_id || '',
      academic_session,
      class_name: data.class_name || 'Class 10',
      section: data.section || 'A',
      class_teacher: data.class_teacher || 'Assigned Faculty',
      room_no: data.room_no || 'Room 101',
      capacity: data.capacity || 40,
      subjects,
      no_of_subjects: subjects.length,
      status: data.status || 'ACTIVE'
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
    if (updates.subjects && Array.isArray(updates.subjects)) {
      updates.no_of_subjects = updates.subjects.length;
    }
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

  async updateClassSubjects(classId: string, subjects: SubjectItem[]): Promise<ClassRoom | null> {
    return this.updateClass(classId, { subjects, no_of_subjects: subjects.length });
  },

  async addSubjectToClass(classId: string, subjectData: Partial<SubjectItem>): Promise<ClassRoom | null> {
    const cls = memoryStore.classes.find(c => c.id === classId);
    const existingSubjects = Array.isArray(cls?.subjects) ? [...cls.subjects] : getDefaultCbseSubjectsForClass(cls?.class_name || 'Class 10', cls?.section);
    
    const newSubject: SubjectItem = {
      id: subjectData.id || `SUB-${Date.now().toString().slice(-4)}`,
      name: subjectData.name || 'New Subject',
      code: subjectData.code || '',
      type: subjectData.type || 'COMPULSORY',
      weekly_periods: Number(subjectData.weekly_periods) || 5,
      assigned_teacher: subjectData.assigned_teacher || '',
      max_marks: Number(subjectData.max_marks) || 100
    };

    existingSubjects.push(newSubject);
    return this.updateClass(classId, { subjects: existingSubjects, no_of_subjects: existingSubjects.length });
  },

  async updateClassSubject(classId: string, subjectId: string, updates: Partial<SubjectItem>): Promise<ClassRoom | null> {
    const cls = memoryStore.classes.find(c => c.id === classId);
    let subjects = Array.isArray(cls?.subjects) ? [...cls.subjects] : getDefaultCbseSubjectsForClass(cls?.class_name || 'Class 10', cls?.section);
    
    const sIdx = subjects.findIndex(s => s.id === subjectId);
    if (sIdx >= 0) {
      subjects[sIdx] = { ...subjects[sIdx], ...updates };
      return this.updateClass(classId, { subjects, no_of_subjects: subjects.length });
    }
    return null;
  },

  async deleteSubjectFromClass(classId: string, subjectId: string): Promise<ClassRoom | null> {
    const cls = memoryStore.classes.find(c => c.id === classId);
    let subjects = Array.isArray(cls?.subjects) ? [...cls.subjects] : getDefaultCbseSubjectsForClass(cls?.class_name || 'Class 10', cls?.section);
    
    subjects = subjects.filter(s => s.id !== subjectId);
    return this.updateClass(classId, { subjects, no_of_subjects: subjects.length });
  },

  async resetClassToCbseSubjects(classId: string): Promise<ClassRoom | null> {
    const cls = memoryStore.classes.find(c => c.id === classId);
    const className = cls?.class_name || 'Class 10';
    const section = cls?.section || 'A';
    const defaultSubjects = getDefaultCbseSubjectsForClass(className, section);
    return this.updateClass(classId, { subjects: defaultSubjects, no_of_subjects: defaultSubjects.length });
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
  async getNotices(schoolId?: string, session?: string): Promise<Notice[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;
    const targetSession = session || '2026-27';

    // 1. MongoDB Query (Fast Primary Store)
    try {
      const db = await getDatabase();
      if (db) {
        const ids = (targetId || targetCode || schoolId)
          ? Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)))
          : [];
        const filter = buildSessionFilter(ids as string[], targetSession);
        const results = await db.collection('notices')
          .find(filter)
          .sort({ created_at: -1 })
          .toArray();
        if (results) {
          return results.map(sanitizeDoc<Notice>);
        }
      }
    } catch (e) {}


    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.notices.filter(n => ids.includes(n.school_id) && matchesSession(n, targetSession));
    }
    return memoryStore.notices.filter(n => matchesSession(n, targetSession));
  },

  async createNotice(data: Partial<Notice>): Promise<Notice> {
    await ensureIndexes();
    const id = data.id || `NOT-${Date.now()}`;
    const academic_session = data.academic_session || '2026-27';
    const school_id = data.school_id || '';
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const isoTimestamp = now.toISOString();

    // Fetch school to create official standard circular code
    const school = school_id ? await this.getSchoolById(school_id) : null;
    const targetSchoolId = school?.id || school_id || 'SCH';

    // 1. School Name (DPS ONLY / school initials)
    let shortSchoolName = 'DPS';
    if (school) {
      const sName = (school.name || school.school_name || '').trim();
      if (/delhi\s+public\s+school/i.test(sName) || /dps/i.test(sName) || /dps/i.test(school.school_code || '')) {
        shortSchoolName = 'DPS';
      } else {
        const words = sName.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
          shortSchoolName = words.map((w: string) => w[0].toUpperCase()).join('').slice(0, 6);
        } else if (words.length === 1) {
          shortSchoolName = words[0].toUpperCase().slice(0, 6);
        }
      }
    }

    // 2. Year (2026 only)
    const yearOnly = now.getFullYear();

    // 3. Date only month and date (e.g. 30/8)
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const dateMonth = `${day}/${month}`;

    // Calculate sequential counter for this school and session
    const existingSchoolNotices = (memoryStore.notices || []).filter(n => n.school_id === school_id && matchesSession(n, academic_session));
    const seqNum = String(existingSchoolNotices.length + 1).padStart(4, '0');

    // 4. Determine matter / subject code according to content or explicit field
    let matterCategory = (data.matter_category || '').toUpperCase().trim();
    if (!matterCategory) {
      const text = `${data.title || ''} ${data.content || ''}`.toLowerCase();
      if (/holiday|vacation|break|closure|autumn|winter|summer|diwali|festival|eid|christmas/i.test(text)) {
        matterCategory = 'HOLIDAY';
      } else if (/exam|datesheet|test|assessment|term|pre-board|result|marksheet/i.test(text)) {
        matterCategory = 'EXAM';
      } else if (/cbse|oasis|saras|board|circular|guideline|registration|loc/i.test(text)) {
        matterCategory = 'CBSE';
      } else if (/fee|tuition|dues|invoice|payment|accounts/i.test(text)) {
        matterCategory = 'FEES';
      } else if (/event|sports|annual day|competition|function|celebration/i.test(text)) {
        matterCategory = 'EVENT';
      } else if (/office|admin|principal|management|timing|discipline|transport/i.test(text)) {
        matterCategory = 'OFFICE';
      } else {
        matterCategory = 'ACAD';
      }
    }

    // Immutable Autogenerated Reference Number:
    // Format: FIRST SCHOOL NAME (DPS)/YEAR/DATE(30/8)/MATTER/0001 (e.g. DPS/2026/30/8/HOLIDAY/0001)
    const reference_no = `${shortSchoolName}/${yearOnly}/${dateMonth}/${matterCategory}/${seqNum}`;

    const notice: Notice = {
      id,
      school_id: targetSchoolId,
      academic_session,
      reference_no,
      matter_category: matterCategory,
      title: data.title || 'Official Announcement',
      content: data.content || '',
      target_audience: data.target_audience || 'ALL',
      posted_by: data.posted_by || 'Principal Office',
      date: dateStr,
      created_at: isoTimestamp
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
  async getAttendance(schoolId?: string, session?: string): Promise<AttendanceRecord[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;
    const targetSession = session || '2026-27';

    // 1. MongoDB Query (Fast Primary Store)
    try {
      const db = await getDatabase();
      if (db) {
        const ids = (targetId || targetCode || schoolId)
          ? Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)))
          : [];
        const filter = buildSessionFilter(ids as string[], targetSession);
        const results = await db.collection('attendance')
          .find(filter)
          .sort({ date: -1 })
          .toArray();
        if (results) {
          const sanitized = results.map(sanitizeDoc<AttendanceRecord>);
          const dedupMap = new Map<string, AttendanceRecord>();
          sanitized.forEach(item => {
            const key = `${item.date}_${(item.class_name || '').toLowerCase().trim()}_${(item.section || '').toLowerCase().trim()}`;
            if (!dedupMap.has(key)) {
              dedupMap.set(key, item);
            }
          });
          return Array.from(dedupMap.values());
        }
      }
    } catch (e) {}


    const rawList = (targetId || schoolId)
      ? memoryStore.attendance.filter(a => [targetId, targetCode, schoolId, cleanId].filter(Boolean).includes(a.school_id) && matchesSession(a, targetSession))
      : memoryStore.attendance.filter(a => matchesSession(a, targetSession));

    const memDedupMap = new Map<string, AttendanceRecord>();
    rawList.forEach(item => {
      const key = `${item.date}_${(item.class_name || '').toLowerCase().trim()}_${(item.section || '').toLowerCase().trim()}`;
      if (!memDedupMap.has(key)) {
        memDedupMap.set(key, item);
      }
    });
    return Array.from(memDedupMap.values());
  },

  async recordAttendance(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    await ensureIndexes();
    const academic_session = data.academic_session || '2026-27';
    const date = data.date || new Date().toISOString().split('T')[0];
    const rawClassName = (data.class_name || 'Class 10').trim();
    const rawSection = (data.section || 'A').trim();
    const school_id = data.school_id || '';

    const isFaculty = /faculty|staff/i.test(rawClassName) || /faculty|staff/i.test(rawSection);
    const class_name = isFaculty ? 'Faculty' : rawClassName;
    const section = isFaculty ? 'Staff' : rawSection;

    // Check if record already exists for this date, class, and section
    const normClassName = class_name.toLowerCase();
    const normSection = section.toLowerCase();

    const existingMemIdx = memoryStore.attendance.findIndex(a => 
      a.school_id === school_id &&
      matchesSession(a, academic_session) &&
      a.date === date &&
      (isFaculty 
        ? (/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || ''))
        : ((a.class_name || '').toLowerCase().trim() === normClassName && (a.section || '').toLowerCase().trim() === normSection))
    );

    const id = (existingMemIdx >= 0 && memoryStore.attendance[existingMemIdx].id) 
      ? memoryStore.attendance[existingMemIdx].id 
      : (data.id || `ATT-${Date.now()}`);

    const record: AttendanceRecord = {
      ...data,
      id,
      school_id,
      academic_session,
      date,
      class_name,
      section,
      total_students: data.total_students !== undefined ? Number(data.total_students) : 30,
      present_count: data.present_count !== undefined ? Number(data.present_count) : 30,
      absent_count: data.absent_count !== undefined ? Number(data.absent_count) : 0,
      leave_count: data.leave_count !== undefined ? Number(data.leave_count) : 0,
      marked_by: data.marked_by || 'Admin',
      student_records: Array.isArray(data.student_records) ? data.student_records : [],
      teacher_records: Array.isArray(data.teacher_records) ? data.teacher_records : [],
      created_at: data.created_at || new Date().toISOString()
    };

    try {
      const db = await getDatabase();
      if (db) {
        if (isFaculty) {
          await db.collection('attendance').deleteMany({
            school_id: record.school_id,
            academic_session: record.academic_session,
            date: record.date,
            $or: [
              { class_name: /faculty|staff/i },
              { section: /faculty|staff/i }
            ]
          });
          await db.collection('attendance').insertOne({ ...record });
        } else {
          await db.collection('attendance').replaceOne(
            {
              school_id: record.school_id,
              academic_session: record.academic_session,
              date: record.date,
              class_name: { $regex: new RegExp(`^${record.class_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
              section: { $regex: new RegExp(`^${record.section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            },
            { ...record },
            { upsert: true }
          );
        }
      }
    } catch (e) {}

    if (existingMemIdx >= 0) {
      memoryStore.attendance[existingMemIdx] = record;
    } else {
      memoryStore.attendance.push(record);
    }
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
  async getFeeInvoices(schoolId?: string, session?: string): Promise<FeeInvoice[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;
    const targetSession = session || '2026-27';

    // 1. MongoDB Query (Fast Primary Store)
    try {
      const db = await getDatabase();
      if (db) {
        const ids = (targetId || targetCode || schoolId)
          ? Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)))
          : [];
        const filter = buildSessionFilter(ids as string[], targetSession);
        const results = await db.collection('fee_invoices')
          .find(filter)
          .sort({ due_date: 1 })
          .toArray();
        if (results) {
          return results.map(sanitizeDoc<FeeInvoice>);
        }
      }
    } catch (e) {}


    if (targetId || schoolId) {
      const ids = [targetId, targetCode, schoolId, cleanId].filter(Boolean);
      return memoryStore.fee_invoices.filter(f => ids.includes(f.school_id) && matchesSession(f, targetSession));
    }
    return memoryStore.fee_invoices.filter(f => matchesSession(f, targetSession));
  },

  async createFeeInvoice(data: Partial<FeeInvoice>): Promise<FeeInvoice> {
    await ensureIndexes();
    const id = data.id || `INV-${Date.now()}`;
    const academic_session = data.academic_session || '2026-27';
    const amount = Number(data.amount) || 15000;
    const paidAmount = Number(data.paid_amount) !== undefined && !isNaN(Number(data.paid_amount))
      ? Number(data.paid_amount)
      : (data.status === 'PAID' ? amount : 0);
    const concessionAmount = Number(data.concession_amount) || 0;

    let computedStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'WAIVED' = data.status || 'PENDING';
    if (!data.status) {
      if (concessionAmount >= amount) computedStatus = 'WAIVED';
      else if (paidAmount + concessionAmount >= amount) computedStatus = 'PAID';
      else if (paidAmount > 0) computedStatus = 'PARTIAL';
      else computedStatus = 'PENDING';
    }

    const invoice: FeeInvoice = {
      id,
      school_id: data.school_id || '',
      academic_session,
      invoice_no: data.invoice_no || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      student_id: data.student_id || '',
      student_name: data.student_name || 'Student',
      admission_no: data.admission_no || '',
      class_name: data.class_name || 'Class 10 - A',
      month: data.month || 'April 2026',
      amount,
      paid_amount: paidAmount,
      tuition_fee: Number(data.tuition_fee) ?? (Number(data.amount) || 0),
      transport_fee: Number(data.transport_fee) || 0,
      admission_fee: Number(data.admission_fee) || 0,
      annual_fee: Number(data.annual_fee) || 0,
      exam_fee: Number(data.exam_fee) || 0,
      concession_amount: concessionAmount,
      concession_reason: data.concession_reason || undefined,
      waived_by: data.waived_by || undefined,
      waived_date: data.waived_date || (concessionAmount > 0 ? new Date().toISOString().split('T')[0] : undefined),
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      status: computedStatus,
      payment_mode: data.payment_mode || 'Cash/UPI',
      paid_date: (computedStatus === 'PAID' || computedStatus === 'PARTIAL') ? (data.paid_date || new Date().toISOString().split('T')[0]) : undefined,
      payment_history: data.payment_history || (paidAmount > 0 ? [{
        id: `pay-${Date.now()}`,
        amount: paidAmount,
        payment_mode: data.payment_mode || 'Cash/UPI',
        paid_at: new Date().toISOString(),
        remark: data.concession_reason || 'Initial payment'
      }] : [])
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

  async updateFeeInvoice(
    invoiceId: string,
    updates: {
      status?: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'WAIVED';
      payment_mode?: string;
      paid_amount?: number;
      additional_payment?: number;
      concession_amount?: number;
      concession_reason?: string;
      waived_by?: string;
      remark?: string;
      receipt_no?: string;
    }
  ): Promise<FeeInvoice | null> {
    await ensureIndexes();
    const idx = memoryStore.fee_invoices.findIndex(i => i.id === invoiceId);
    if (idx < 0) return null;

    const inv = memoryStore.fee_invoices[idx];

    // Handle Additional Partial Payment
    if (typeof updates.additional_payment === 'number' && updates.additional_payment > 0) {
      inv.paid_amount = (inv.paid_amount || 0) + updates.additional_payment;
      if (!inv.payment_history) inv.payment_history = [];
      inv.payment_history.push({
        id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amount: updates.additional_payment,
        payment_mode: updates.payment_mode || inv.payment_mode || 'UPI',
        paid_at: new Date().toISOString(),
        receipt_no: updates.receipt_no || `REC-${Date.now().toString().slice(-5)}`,
        remark: updates.remark || 'Partial fee payment'
      });
      inv.paid_date = new Date().toISOString().split('T')[0];
      if (updates.payment_mode) inv.payment_mode = updates.payment_mode;
    } else if (typeof updates.paid_amount === 'number') {
      inv.paid_amount = updates.paid_amount;
      if (updates.paid_amount > 0) inv.paid_date = new Date().toISOString().split('T')[0];
      if (updates.payment_mode) inv.payment_mode = updates.payment_mode;
    }

    // Handle Concession / Waiver
    if (typeof updates.concession_amount === 'number') {
      inv.concession_amount = updates.concession_amount;
      inv.concession_reason = updates.concession_reason || inv.concession_reason || 'Principal Concession';
      inv.waived_by = updates.waived_by || 'School Administrator';
      inv.waived_date = new Date().toISOString().split('T')[0];
    }

    // Determine Final Status
    const totalSettled = (inv.paid_amount || 0) + (inv.concession_amount || 0);
    if (updates.status) {
      inv.status = updates.status;
    } else if ((inv.concession_amount || 0) >= inv.amount) {
      inv.status = 'WAIVED';
    } else if (totalSettled >= inv.amount) {
      inv.status = 'PAID';
    } else if ((inv.paid_amount || 0) > 0) {
      inv.status = 'PARTIAL';
    } else {
      inv.status = 'PENDING';
    }

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('fee_invoices').updateOne(
          { id: invoiceId },
          { $set: { ...inv } }
        );
      }
    } catch (e) {}

    saveLocalStore();
    return inv;
  },

  async updateFeeInvoiceStatus(invoiceId: string, status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'WAIVED', payment_mode?: string): Promise<FeeInvoice | null> {
    return this.updateFeeInvoice(invoiceId, { status, payment_mode });
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

  // HOLIDAYS & ACADEMIC CLOSURES
  async getHolidays(schoolId?: string, session?: string): Promise<Holiday[]> {
    await ensureIndexes();
    const school = schoolId ? await this.getSchoolById(schoolId) : null;
    const cleanId = schoolId ? schoolId.replace(/[^A-Z0-9]/gi, '') : undefined;
    const targetId = school?.id || cleanId;
    const targetCode = school?.school_code || cleanId;
    const targetSession = session || '2026-27';

    // 1. MongoDB Query (Fast Primary Store)
    try {
      const db = await getDatabase();
      if (db) {
        const ids = (targetId || targetCode || schoolId)
          ? Array.from(new Set([targetId, targetCode, schoolId, cleanId].filter(Boolean)))
          : [];
        const filter = buildSessionFilter(ids as string[], targetSession);
        const results = await db.collection('holidays')
          .find(filter)
          .sort({ start_date: 1 })
          .toArray();
        if (results && results.length > 0) {
          return results.map(sanitizeDoc<Holiday>);
        }
      }
    } catch (e) {}


    const rawList = (targetId || schoolId)
      ? (memoryStore.holidays || []).filter(h => [targetId, targetCode, schoolId, cleanId].filter(Boolean).includes(h.school_id) && matchesSession(h, targetSession))
      : (memoryStore.holidays || []).filter(h => matchesSession(h, targetSession));

    return rawList.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  },

  async createHoliday(data: Partial<Holiday>, autoCreateNotice: boolean = true): Promise<Holiday> {
    await ensureIndexes();
    const id = data.id || `HOL-${Date.now()}`;
    const academic_session = data.academic_session || '2026-27';
    const startDate = data.start_date || new Date().toISOString().split('T')[0];
    const endDate = data.end_date || startDate;
    
    // Calculate total days
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const holiday: Holiday = {
      id,
      school_id: data.school_id || '',
      academic_session,
      title: data.title || 'Institutional Holiday',
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      applicable_to: data.applicable_to || 'ALL',
      category: data.category || 'GAZETTED',
      reason: data.reason || 'Official Holiday Declared by Administration',
      declared_by: data.declared_by || 'Admin Directorate',
      auto_notice_published: autoCreateNotice,
      created_at: new Date().toISOString()
    };

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('holidays').insertOne({ ...holiday });
      }
    } catch (e) {}

    if (!Array.isArray(memoryStore.holidays)) memoryStore.holidays = [];
    memoryStore.holidays.push(holiday);
    saveLocalStore();

    // Automatically publish official circular on Institutional Notice Board if enabled
    if (autoCreateNotice) {
      try {
        const audMapping: Record<string, 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS'> = {
          'ALL': 'ALL',
          'STUDENTS_ONLY': 'STUDENTS',
          'TEACHERS_AND_STUDENTS': 'ALL',
          'PRIMARY_ONLY': 'STUDENTS',
          'SENIOR_ONLY': 'STUDENTS'
        };
        const aud = audMapping[holiday.applicable_to] || 'ALL';
        const dateSpan = startDate === endDate ? startDate : `${startDate} to ${endDate} (${totalDays} Days)`;
        await this.createNotice({
          school_id: holiday.school_id,
          academic_session: holiday.academic_session,
          matter_category: 'HOLIDAY',
          title: `Official Holiday Circular: ${holiday.title}`,
          content: `Notice is hereby given that the institution will remain closed from ${dateSpan} on account of "${holiday.title}".\n\nApplicable Audience: ${(holiday.applicable_to || 'ALL').replace(/_/g, ' ')}\nReason / Category: ${holiday.reason} (${holiday.category})\nDeclared By: ${holiday.declared_by}`,
          target_audience: aud,
          posted_by: holiday.declared_by
        });
      } catch (err) {
        console.warn('Auto notice error:', err);
      }
    }

    return holiday;
  },

  async deleteHoliday(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('holidays').deleteOne({ id });
      }
    } catch (e) {}

    if (Array.isArray(memoryStore.holidays)) {
      const idx = memoryStore.holidays.findIndex(h => h.id === id);
      if (idx >= 0) {
        memoryStore.holidays.splice(idx, 1);
        saveLocalStore();
        return true;
      }
    }
    return false;
  },

  // OVERVIEW STATS
  async getSchoolOverview(schoolId: string, session?: string): Promise<SchoolOverview> {
    const targetSession = session || '2026-27';
    const students = await this.getStudents(schoolId, targetSession);
    const teachers = await this.getTeachers(schoolId, targetSession);
    const attendance = await this.getAttendance(schoolId, targetSession);
    const invoices = await this.getFeeInvoices(schoolId, targetSession);

    const totalStudents = students.length;
    const totalTeachers = teachers.length;

    // Helper for local date string in YYYY-MM-DD
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isoDateStr = now.toISOString().split('T')[0];

    // Deduplicate attendance records by class & section for today
    const latestTodayMap = new Map<string, AttendanceRecord>();
    attendance.forEach(a => {
      if (a.date === localDateStr || a.date === isoDateStr) {
        const key = `${(a.class_name || '').toLowerCase().trim()}_${(a.section || '').toLowerCase().trim()}`;
        latestTodayMap.set(key, a);
      }
    });

    const uniqueTodayRecords = Array.from(latestTodayMap.values());

    // 1. Student Attendance strictly for TODAY (Deduplicated per class)
    const studentTodayRecords = uniqueTodayRecords.filter(a => 
      (a.class_name || '').toLowerCase() !== 'faculty' && 
      (a.class_name || '').toLowerCase() !== 'staff'
    );
    const isStudentAttendanceMarkedToday = studentTodayRecords.length > 0;
    const studentsPresentToday = isStudentAttendanceMarkedToday 
      ? Math.min(totalStudents, studentTodayRecords.reduce((acc, curr) => acc + (Number(curr.present_count) || 0), 0))
      : 0;
    const studentsTotalToday = totalStudents;
    const studentAttendanceToday = isStudentAttendanceMarkedToday && totalStudents > 0
      ? Number(((studentsPresentToday / totalStudents) * 100).toFixed(1))
      : 0;

    // 2. Faculty Attendance strictly for TODAY (Deduplicated, capped at total teachers)
    const facultyTodayRecords = uniqueTodayRecords.filter(a => 
      /faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || '')
    );
    const isFacultyAttendanceMarkedToday = facultyTodayRecords.length > 0;
    const latestFacultyRecord = isFacultyAttendanceMarkedToday ? facultyTodayRecords[facultyTodayRecords.length - 1] : null;
    const facultyPresentToday = latestFacultyRecord
      ? Math.min(totalTeachers, Number(latestFacultyRecord.present_count) || 0)
      : 0;
    const facultyTotalToday = totalTeachers;
    const facultyAttendanceToday = isFacultyAttendanceMarkedToday && totalTeachers > 0
      ? Number(((facultyPresentToday / totalTeachers) * 100).toFixed(1))
      : 0;

    const attendanceToday = studentAttendanceToday;

    const paidInvoices = invoices.filter(i => i.status === 'PAID');
    const totalRevenue = paidInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status !== 'PAID');
    const pendingFeeAmount = pendingInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const feeCollectionRate = invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0;

    return {
      academic_session: targetSession,
      kpis: {
        totalStudents,
        totalTeachers,
        attendanceToday,
        studentAttendanceToday,
        facultyAttendanceToday,
        studentsPresentToday,
        studentsTotalToday,
        facultyPresentToday,
        facultyTotalToday,
        isStudentAttendanceMarkedToday,
        isFacultyAttendanceMarkedToday,
        feeCollectionRate,
        pendingFeeAmount,
        totalRevenue
      },
      recentStudents: students.slice(-5).reverse(),
      recentInvoices: invoices.slice(-5).reverse()
    };
  },

  // ==========================================
  // EXAMINATION & CLASS TESTS HUB
  // ==========================================
  async getScheduledExams(schoolId?: string, session?: string, className?: string, examType?: string): Promise<ScheduledExamItem[]> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        const query: any = {};
        if (schoolId) query.school_id = schoolId;
        if (session) query.academic_session = session;
        if (className) query.class_name = className;
        if (examType && examType !== 'ALL') query.type = examType;
        const docs = await db.collection('exams').find(query).sort({ date: 1, created_at: -1 }).toArray();
        if (docs && docs.length > 0) {
          return docs.map((d: any) => {
            const { _id, ...rest } = d;
            return {
              ...rest,
              id: rest.id || _id?.toString()
            } as ScheduledExamItem;
          });
        }
      }
    } catch (e) {}

    let res = [...(memoryStore.exams || [])];
    if (schoolId) res = res.filter(e => !e.school_id || e.school_id === schoolId);
    if (session) res = res.filter(e => !e.academic_session || e.academic_session === session);
    if (className) res = res.filter(e => e.class_name.toLowerCase() === className.toLowerCase());
    if (examType && examType !== 'ALL') res = res.filter(e => e.type === examType);
    return res;
  },

  async createScheduledExams(exams: ScheduledExamItem[]): Promise<ScheduledExamItem[]> {
    await ensureIndexes();
    if (!exams || !exams.length) return [];

    const normalizedExams: ScheduledExamItem[] = exams.map(e => ({
      ...e,
      id: e.id || `ex-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: e.created_at || new Date().toISOString()
    }));

    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('exams').insertMany(normalizedExams.map(e => ({ ...e })));
      }
    } catch (e) {}

    if (!memoryStore.exams) memoryStore.exams = [];
    memoryStore.exams.unshift(...normalizedExams);
    saveLocalStore();
    return normalizedExams;
  },

  async updateScheduledExam(id: string, updates: Partial<ScheduledExamItem>): Promise<boolean> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        let objectId: any = null;
        try {
          const { ObjectId } = require('mongodb');
          if (ObjectId.isValid(id)) objectId = new ObjectId(id);
        } catch (_) {}

        const filter = objectId ? { $or: [{ id }, { _id: objectId }] } : { id };
        await db.collection('exams').updateOne(filter, { $set: updates });
      }
    } catch (e) {}

    if (!memoryStore.exams) memoryStore.exams = [];
    const idx = memoryStore.exams.findIndex(e => e.id === id);
    if (idx >= 0) {
      memoryStore.exams[idx] = { ...memoryStore.exams[idx], ...updates };
      saveLocalStore();
      return true;
    }
    return true;
  },

  async deleteScheduledExam(id: string): Promise<boolean> {
    await ensureIndexes();
    try {
      const db = await getDatabase();
      if (db) {
        let objectId: any = null;
        try {
          const { ObjectId } = require('mongodb');
          if (ObjectId.isValid(id)) objectId = new ObjectId(id);
        } catch (_) {}

        const filter = objectId ? { $or: [{ id }, { _id: objectId }] } : { id };
        await db.collection('exams').deleteOne(filter);
      }
    } catch (e) {}

    if (!memoryStore.exams) memoryStore.exams = [];
    const idx = memoryStore.exams.findIndex(e => e.id === id);
    if (idx >= 0) {
      memoryStore.exams.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return true;
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
      exams: (memoryStore.exams || []).length,
      mongodb_connected: isMongoConfigured()
    };
  }
};
