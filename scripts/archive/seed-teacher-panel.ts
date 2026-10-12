/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const uri = process.env.MONGODB_URI || '';
const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');

const SCHOOL_ID = 'DPS2026';
const SESSION = '2026-27';

async function seedTeacherPanel() {
  console.log('--- SEEDING TEACHER PANEL DEMO DATA ---');

  // 1. Define Teachers
  // Teacher A: Only Subject Teacher
  const subjectTeacher = {
    id: 'EMP-SUBJ01',
    staff_code: 'EMP-SUBJ01',
    school_id: SCHOOL_ID,
    full_name: 'Rajesh Verma',
    email: 'rajesh.verma@dps2026.edu',
    phone: '+91 98765 43210',
    department: 'Mathematics',
    designation: 'Senior PGT Mathematics',
    qualification: 'M.Sc. Mathematics, B.Ed.',
    subject_specialization: ['Mathematics'],
    subjects: ['Mathematics'],
    is_class_teacher: false,
    assigned_class: '',
    allocated_classes: [
      { class_name: '10', section: 'A', subject_name: 'Mathematics' },
      { class_name: '9', section: 'A', subject_name: 'Mathematics' }
    ],
    status: 'ACTIVE',
    passcode: '123456',
    role: 'TEACHER'
  };

  // Teacher B: Both Class Teacher and Subject Teacher
  const classAndSubjectTeacher = {
    id: 'EMP-CLAS01',
    staff_code: 'EMP-CLAS01',
    school_id: SCHOOL_ID,
    full_name: 'Ananya Sen',
    email: 'ananya.sen@dps2026.edu',
    phone: '+91 98765 12345',
    department: 'Languages',
    designation: 'Head of English & Class Incharge',
    qualification: 'M.A. English Literature, B.Ed.',
    subject_specialization: ['English'],
    subjects: ['English'],
    is_class_teacher: true,
    assigned_class: '10',
    class_teacher_section: { class_name: '10', section: 'A' },
    allocated_classes: [
      { class_name: '10', section: 'A', subject_name: 'English' },
      { class_name: '9', section: 'A', subject_name: 'English' }
    ],
    status: 'ACTIVE',
    passcode: '123456',
    role: 'TEACHER'
  };

  // 2. Biometric Regularization Requests in all 3 statuses
  const biometricRequests = [
    {
      id: 'BIO-REQ-2026-001',
      school_id: SCHOOL_ID,
      teacher_id: 'EMP-SUBJ01',
      teacher_code: 'EMP-SUBJ01',
      teacher_name: 'Rajesh Verma',
      date: '2026-10-08',
      request_type: 'MISSED_OUT',
      reason: 'Biometric terminal 2 reader timed out during evening dispersal due to network glitch.',
      expected_in: '07:55',
      expected_out: '14:30',
      actual_in: '07:55',
      actual_out: null,
      status: 'PENDING',
      applied_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: 'BIO-REQ-2026-002',
      school_id: SCHOOL_ID,
      teacher_id: 'EMP-CLAS01',
      teacher_code: 'EMP-CLAS01',
      teacher_name: 'Ananya Sen',
      date: '2026-10-05',
      request_type: 'MISSED_IN',
      reason: 'Gate biometric sensor reader was under calibration by IT team; verified with main gate entry register.',
      expected_in: '07:50',
      expected_out: '14:35',
      actual_in: null,
      actual_out: '14:35',
      status: 'APPROVED',
      reviewed_by_id: 'admin',
      reviewed_by_name: 'Dr. R. K. Trivedi (Principal)',
      reviewed_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      principal_remarks: 'Verified with physical logbook. Attendance regularized to Present.',
      applied_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
    },
    {
      id: 'BIO-REQ-2026-003',
      school_id: SCHOOL_ID,
      teacher_id: 'EMP-CLAS01',
      teacher_code: 'EMP-CLAS01',
      teacher_name: 'Ananya Sen',
      date: '2026-09-28',
      request_type: 'MISSED_BOTH',
      reason: 'Attended CBSE zonal workshop at Pragati Maidan with prior intimation.',
      expected_in: '08:00',
      expected_out: '14:30',
      actual_in: null,
      actual_out: null,
      status: 'REJECTED',
      reviewed_by_id: 'admin',
      reviewed_by_name: 'Dr. R. K. Trivedi (Principal)',
      reviewed_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
      principal_remarks: 'Please apply under On-Duty (OD) Leave category with certificate instead of missed punch.',
      applied_at: new Date(Date.now() - 3600000 * 24 * 13).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 24 * 13).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString()
    }
  ];

  // 3. Syllabus Plans: 2 Classes (Class 10, Class 9) x 3 Subjects (Mathematics, English, Science) x 3 Months (April, May, July)
  const syllabusClasses = ['10', '9'];
  const syllabusSubjects = ['Mathematics', 'English', 'Science'];
  const syllabusMonths = [
    { name: 'April', order: 1 },
    { name: 'May', order: 2 },
    { name: 'July', order: 3 }
  ];

  const syllabusPlans: any[] = [];
  const syllabusProgressList: any[] = [];

  for (const cls of syllabusClasses) {
    for (const subj of syllabusSubjects) {
      for (const m of syllabusMonths) {
        const planId = `SYL-${cls}-${subj.replace(/\s+/g, '')}-${m.name}`;
        const topics = [
          {
            id: `TOPIC-${cls}-${subj.substring(0, 3)}-${m.name}-01`,
            chapter_no: m.order * 2 - 1,
            chapter_title: `${subj} Foundations Pt. ${m.order}`,
            topic_title: `Core Principles of ${subj} Unit ${m.order}A`,
            description: `Theoretical introduction and NCERT syllabus benchmarks for ${subj}.`,
            planned_periods: 6,
            target_date: `2026-0${m.order + 3}-15`,
            order: 1
          },
          {
            id: `TOPIC-${cls}-${subj.substring(0, 3)}-${m.name}-02`,
            chapter_no: m.order * 2,
            chapter_title: `Applied ${subj} Practicum`,
            topic_title: `Problem Solving & Assessment Unit ${m.order}B`,
            description: `Exemplar problems, class exercises and formative assessment.`,
            planned_periods: 8,
            target_date: `2026-0${m.order + 3}-28`,
            order: 2
          }
        ];

        syllabusPlans.push({
          id: planId,
          school_id: SCHOOL_ID,
          academic_session: SESSION,
          class_name: cls,
          subject_name: subj,
          month: m.name,
          month_order: m.order,
          topics
        });

        // Add some progress for April and May topics
        if (m.name === 'April') {
          syllabusProgressList.push({
            id: `PROG-${topics[0].id}`,
            school_id: SCHOOL_ID,
            academic_session: SESSION,
            topic_id: topics[0].id,
            class_name: cls,
            section: 'A',
            subject_name: subj,
            teacher_id: subj === 'Mathematics' ? 'EMP-SUBJ01' : 'EMP-CLAS01',
            status: 'COMPLETED',
            completion_date: '2026-04-18',
            periods_used: 6,
            teacher_remarks: 'Covered all exemplar problems and NCERT exercises.'
          });
          syllabusProgressList.push({
            id: `PROG-${topics[1].id}`,
            school_id: SCHOOL_ID,
            academic_session: SESSION,
            topic_id: topics[1].id,
            class_name: cls,
            section: 'A',
            subject_name: subj,
            teacher_id: subj === 'Mathematics' ? 'EMP-SUBJ01' : 'EMP-CLAS01',
            status: 'COMPLETED',
            completion_date: '2026-04-29',
            periods_used: 8,
            teacher_remarks: 'Conducted weekly class assessment.'
          });
        } else if (m.name === 'May') {
          syllabusProgressList.push({
            id: `PROG-${topics[0].id}`,
            school_id: SCHOOL_ID,
            academic_session: SESSION,
            topic_id: topics[0].id,
            class_name: cls,
            section: 'A',
            subject_name: subj,
            teacher_id: subj === 'Mathematics' ? 'EMP-SUBJ01' : 'EMP-CLAS01',
            status: 'IN_PROGRESS',
            periods_used: 4,
            teacher_remarks: 'In progress, 2 periods remaining.'
          });
        }
      }
    }
  }

  // 4. Student Leaves for Class 10-A
  const studentLeaves = [
    {
      id: 'STU-LV-2026-001',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      student_id: 'SR-2026-C01-001',
      student_name: 'Aarav Sharma',
      admission_no: 'DPS-2026-001',
      class_name: '10',
      section: 'A',
      roll_no: '1',
      from_date: '2026-10-12',
      to_date: '2026-10-14',
      days: 3,
      reason: 'Fever and viral infection diagnosed by physician. Medical certificate attached.',
      status: 'PENDING',
      applied_by: 'Sunil Sharma (Father)',
      applied_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'STU-LV-2026-002',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      student_id: 'SR-2026-C01-002',
      student_name: 'Vivaan Joshi',
      admission_no: 'DPS-2026-002',
      class_name: '10',
      section: 'A',
      roll_no: '2',
      from_date: '2026-10-06',
      to_date: '2026-10-07',
      days: 2,
      reason: 'Attending family wedding ceremony out of town.',
      status: 'APPROVED',
      action_by_id: 'EMP-CLAS01',
      action_by_name: 'Ananya Sen',
      action_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      action_remarks: 'Granted. Please ensure homework is completed upon return.',
      applied_by: 'Mahesh Joshi (Father)',
      applied_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
    },
    {
      id: 'STU-LV-2026-003',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      student_id: 'SR-2026-C01-003',
      student_name: 'Ananya Deshmukh',
      admission_no: 'DPS-2026-003',
      class_name: '10',
      section: 'A',
      roll_no: '3',
      from_date: '2026-09-25',
      to_date: '2026-09-29',
      days: 5,
      reason: 'Unplanned personal vacation during regular term.',
      status: 'REJECTED',
      action_by_id: 'EMP-CLAS01',
      action_by_name: 'Ananya Sen',
      action_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
      action_remarks: 'Vacations during active assessment window cannot be sanctioned as leave.',
      applied_by: 'Rohit Deshmukh (Father)',
      applied_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString()
    }
  ];

  // 5. Homework Assignments
  const homeworkList = [
    {
      id: 'HW-2026-001',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      teacher_id: 'EMP-SUBJ01',
      teacher_name: 'Rajesh Verma',
      class_name: '10',
      section: 'A',
      subject_name: 'Mathematics',
      title: 'Quadratic Equations Exercise 4.3 and Word Problems',
      description: 'Complete NCERT Exercise 4.3 questions 1 to 10 in fair homework notebook. Pay special attention to speed-distance problems.',
      due_date: '2026-10-14',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'HW-2026-002',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      teacher_id: 'EMP-CLAS01',
      teacher_name: 'Ananya Sen',
      class_name: '10',
      section: 'A',
      subject_name: 'English',
      title: 'Formal Letter Writing to the Editor on Road Safety',
      description: 'Draft a 150-word formal letter adhering to CBSE format addressing municipal traffic concerns.',
      due_date: '2026-10-15',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ];

  // 6. Study Materials
  const studyMaterials = [
    {
      id: 'MAT-2026-001',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      teacher_id: 'EMP-SUBJ01',
      teacher_name: 'Rajesh Verma',
      class_name: '10',
      section: 'A',
      subject_name: 'Mathematics',
      chapter_title: 'Chapter 4: Quadratic Equations',
      title: 'Formulas Cheat Sheet & Previous Year Board Questions',
      description: 'Comprehensive compilation of quadratic formula derivations and 2018-2025 CBSE board questions.',
      material_type: 'DOCUMENT',
      created_at: new Date().toISOString()
    },
    {
      id: 'MAT-2026-002',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      teacher_id: 'EMP-CLAS01',
      teacher_name: 'Ananya Sen',
      class_name: '10',
      section: 'A',
      subject_name: 'English',
      chapter_title: 'Writing Skills & Grammar',
      title: 'CBSE Sample Letters and Rubrics Guide',
      description: 'Marking rubrics breakdown, format guidelines, and exemplary high-scoring letter samples.',
      material_type: 'NOTES',
      created_at: new Date().toISOString()
    }
  ];

  // 7. Student Behaviour Remarks
  const studentRemarks = [
    {
      id: 'REM-2026-001',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      student_id: 'SR-2026-C01-001',
      student_name: 'Aarav Sharma',
      admission_no: 'DPS-2026-001',
      class_name: '10',
      section: 'A',
      category: 'ACHIEVEMENT',
      severity: 'POSITIVE',
      remark: 'Secured 1st Prize in Inter-School CBSE Mathematics Olympiad. Displayed extraordinary analytical dexterity.',
      created_by_teacher_id: 'EMP-CLAS01',
      created_by_teacher_name: 'Ananya Sen',
      visible_to_parents: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: 'REM-2026-002',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      student_id: 'SR-2026-C01-002',
      student_name: 'Vivaan Joshi',
      admission_no: 'DPS-2026-002',
      class_name: '10',
      section: 'A',
      category: 'DISCIPLINE',
      severity: 'NEUTRAL',
      remark: 'Reminded to maintain uniform protocol during morning assembly.',
      created_by_teacher_id: 'EMP-CLAS01',
      created_by_teacher_name: 'Ananya Sen',
      visible_to_parents: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
    }
  ];

  // 8. Report Card Conduct Remarks
  const reportCardRemarks = [
    {
      id: 'RCR-2026-001',
      school_id: SCHOOL_ID,
      academic_session: SESSION,
      student_id: 'SR-2026-C01-001',
      conduct: 'Outstanding',
      attendance_remark: 'Regular & Punctual',
      class_teacher_remark: 'Exemplary academic scholar and disciplined class leader.',
      updated_by_teacher_id: 'EMP-CLAS01',
      updated_at: new Date().toISOString()
    }
  ];

  // 9. Persist to MongoDB (if available) and local store
  if (uri) {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db();
      console.log('Connected to MongoDB. Inserting / Updating demo records...');

      // Upsert Teachers
      await db.collection('teachers').updateOne({ id: subjectTeacher.id }, { $set: subjectTeacher }, { upsert: true });
      await db.collection('teachers').updateOne({ id: classAndSubjectTeacher.id }, { $set: classAndSubjectTeacher }, { upsert: true });

      // Upsert Users (for login authentication)
      await db.collection('users').updateOne(
        { username: subjectTeacher.email },
        { 
          $set: {
            id: subjectTeacher.id,
            username: subjectTeacher.email,
            email: subjectTeacher.email,
            full_name: subjectTeacher.full_name,
            role: 'TEACHER',
            school_id: SCHOOL_ID,
            schoolId: SCHOOL_ID,
            passcode: '123456',
            status: 'ACTIVE'
          }
        },
        { upsert: true }
      );

      await db.collection('users').updateOne(
        { username: classAndSubjectTeacher.email },
        { 
          $set: {
            id: classAndSubjectTeacher.id,
            username: classAndSubjectTeacher.email,
            email: classAndSubjectTeacher.email,
            full_name: classAndSubjectTeacher.full_name,
            role: 'TEACHER',
            school_id: SCHOOL_ID,
            schoolId: SCHOOL_ID,
            passcode: '123456',
            status: 'ACTIVE'
          }
        },
        { upsert: true }
      );

      // Ensure Class 10 has Ananya Sen as class teacher and subjects assigned
      await db.collection('classes').updateOne(
        { class_name: '10' },
        {
          $set: {
            class_teacher: 'Ananya Sen',
            class_teacher_id: 'EMP-CLAS01',
            class_teacher_name: 'Ananya Sen'
          }
        }
      );

      // Biometric Requests
      for (const req of biometricRequests) {
        await db.collection('biometric_requests').updateOne({ id: req.id }, { $set: req }, { upsert: true });
      }

      // Syllabus Plans
      for (const sp of syllabusPlans) {
        await db.collection('syllabus_plans').updateOne({ id: sp.id }, { $set: sp }, { upsert: true });
      }

      // Syllabus Progress
      for (const prg of syllabusProgressList) {
        await db.collection('syllabus_progress').updateOne({ id: prg.id }, { $set: prg }, { upsert: true });
      }

      // Student Leaves
      for (const sl of studentLeaves) {
        await db.collection('student_leaves').updateOne({ id: sl.id }, { $set: sl }, { upsert: true });
      }

      // Homework
      for (const hw of homeworkList) {
        await db.collection('homework').updateOne({ id: hw.id }, { $set: hw }, { upsert: true });
      }

      // Study Materials
      for (const sm of studyMaterials) {
        await db.collection('study_materials').updateOne({ id: sm.id }, { $set: sm }, { upsert: true });
      }

      // Student Remarks
      for (const sr of studentRemarks) {
        await db.collection('student_remarks').updateOne({ id: sr.id }, { $set: sr }, { upsert: true });
      }

      // Report Card Remarks
      for (const rcr of reportCardRemarks) {
        await db.collection('report_card_remarks').updateOne({ id: rcr.id }, { $set: rcr }, { upsert: true });
      }

      await client.close();
      console.log('MongoDB successfully seeded with teacher panel demo data.');
    } catch (dbErr) {
      console.warn('MongoDB connection issue, falling back to local erp_store.json:', dbErr);
    }
  }

  // 10. Also update local store (for dev offline / fallback safety)
  try {
    let localData: any = {};
    if (fs.existsSync(localStorePath)) {
      localData = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
    }

    if (!localData.teachers) localData.teachers = [];
    const idxSub = localData.teachers.findIndex((t: any) => t.id === subjectTeacher.id);
    if (idxSub >= 0) localData.teachers[idxSub] = subjectTeacher;
    else localData.teachers.push(subjectTeacher);

    const idxClas = localData.teachers.findIndex((t: any) => t.id === classAndSubjectTeacher.id);
    if (idxClas >= 0) localData.teachers[idxClas] = classAndSubjectTeacher;
    else localData.teachers.push(classAndSubjectTeacher);

    if (!localData.users) localData.users = [];
    localData.users = localData.users.filter((u: any) => u.username !== subjectTeacher.email && u.username !== classAndSubjectTeacher.email);
    localData.users.push({
      id: subjectTeacher.id,
      username: subjectTeacher.email,
      email: subjectTeacher.email,
      full_name: subjectTeacher.full_name,
      role: 'TEACHER',
      school_id: SCHOOL_ID,
      schoolId: SCHOOL_ID,
      passcode: '123456',
      status: 'ACTIVE'
    });
    localData.users.push({
      id: classAndSubjectTeacher.id,
      username: classAndSubjectTeacher.email,
      email: classAndSubjectTeacher.email,
      full_name: classAndSubjectTeacher.full_name,
      role: 'TEACHER',
      school_id: SCHOOL_ID,
      schoolId: SCHOOL_ID,
      passcode: '123456',
      status: 'ACTIVE'
    });

    if (localData.classes) {
      const cls10 = localData.classes.find((c: any) => c.class_name === '10');
      if (cls10) {
        cls10.class_teacher = 'Ananya Sen';
        cls10.class_teacher_id = 'EMP-CLAS01';
        cls10.class_teacher_name = 'Ananya Sen';
      }
    }

    localData.biometric_requests = biometricRequests;
    localData.syllabus_plans = syllabusPlans;
    localData.syllabus_progress = syllabusProgressList;
    localData.student_leaves = studentLeaves;
    localData.homework = homeworkList;
    localData.study_materials = studyMaterials;
    localData.student_remarks = studentRemarks;
    localData.report_card_remarks = reportCardRemarks;

    fs.writeFileSync(localStorePath, JSON.stringify(localData, null, 2), 'utf8');
    console.log('data/erp_store.json successfully updated with teacher panel seed data.');
  } catch (fsErr) {
    console.warn('Could not write to erp_store.json:', fsErr);
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

seedTeacherPanel().catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});
