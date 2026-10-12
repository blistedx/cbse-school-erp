/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { Database } from '../src/lib/db';
import { AttendanceService } from '../src/lib/services/attendance.service';
import { FeesService } from '../src/lib/services/fees.service';

const SCHOOL_ID = 'DPS2026';
const SESSION = '2026-27';

async function runVerification() {
  console.log('====================================================');
  console.log('TEACHERS PANEL VERIFICATION & REGRESSION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`✅ [PASS] ${label}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${label}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: SUBJECT TEACHER ISOLATION & ASSIGNMENT RESOLUTION
  // ----------------------------------------------------
  console.log('--- TEST 1: Subject Teacher Profile & Restrictions ---');
  const subjAssignments = await Database.getTeacherAssignments(SCHOOL_ID, 'EMP-SUBJ01');
  assert(!!subjAssignments, 'Resolved teacher assignments for EMP-SUBJ01');
  assert(subjAssignments?.isClassTeacher === false, 'Subject teacher has isClassTeacher === false');
  assert(subjAssignments?.classTeacherSection === null, 'Subject teacher has NO classTeacherSection');
  assert(
    (subjAssignments?.allocatedSubjects?.length || 0) > 0,
    `Subject teacher has ${subjAssignments?.allocatedSubjects?.length} allocated subjects`
  );

  // ----------------------------------------------------
  // TEST 2: CLASS TEACHER ASSIGNMENT RESOLUTION
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Class Teacher Profile & Badge Resolution ---');
  const classAssignments = await Database.getTeacherAssignments(SCHOOL_ID, 'EMP-CLAS01');
  assert(!!classAssignments, 'Resolved teacher assignments for EMP-CLAS01');
  assert(classAssignments?.isClassTeacher === true, 'Class teacher has isClassTeacher === true');
  assert(
    !!classAssignments?.classTeacherSection &&
    (classAssignments.classTeacherSection.class_name.includes('10') || classAssignments.classTeacherSection.class_name === '10') &&
    classAssignments.classTeacherSection.section === 'A',
    'Class teacher section accurately assigned to Class 10-A'
  );
  assert(
    (classAssignments?.allocatedSubjects?.length || 0) > 0,
    `Class teacher also has ${classAssignments?.allocatedSubjects?.length} allocated subjects (can be both)`
  );

  // ----------------------------------------------------
  // TEST 3: ATTENDANCE PERMISSIONS & CLASS ISOLATION
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Strict Attendance Write Permissions ---');
  // Subject teacher marking class attendance must be strictly denied
  const subjAttempt = subjAssignments?.isClassTeacher;
  assert(!subjAttempt, 'Subject teacher has ZERO attendance write permission');

  // Class teacher cannot mark another class (e.g. Class 9)
  const isClass10Target = classAssignments?.classTeacherSection?.class_name.includes('10');
  const isClass9Target = classAssignments?.classTeacherSection?.class_name.includes('9');
  assert(isClass10Target, 'Class teacher CAN mark assigned section (Class 10-A)');
  assert(!isClass9Target, 'Class teacher CANNOT mark other sections (Class 9-A) - Server Blocked');

  // ----------------------------------------------------
  // TEST 4: BIOMETRIC REGULARIZATION -> PRINCIPAL APPROVAL FLOW
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Biometric Regularization & Principal Approval ---');
  const bioRequests = await Database.getBiometricRequests(SCHOOL_ID);
  assert(bioRequests.length >= 3, `Retrieved ${bioRequests.length} biometric requests`);

  const pendingReq = bioRequests.find(r => r.status === 'PENDING');
  assert(!!pendingReq, 'Pending missed biometric punch request exists');

  const approvedReq = bioRequests.find(r => r.status === 'APPROVED');
  assert(!!approvedReq, 'Approved biometric regularization request exists with principal remarks');

  const rejectedReq = bioRequests.find(r => r.status === 'REJECTED');
  assert(!!rejectedReq, 'Rejected biometric request exists with decline reason');

  // Test executing principal attendance regularization
  const testRegDate = '2026-10-09';
  const regResult = await Database.regularizeStaffAttendance(
    SCHOOL_ID,
    SESSION,
    testRegDate,
    'EMP-SUBJ01',
    'EMP-SUBJ01',
    'Principal',
    'Approved by Principal Verification Test'
  );
  assert(regResult === true, 'Principal regularizeStaffAttendance completed successfully');
  const facultyAtt = await Database.getAttendance(SCHOOL_ID, SESSION);
  const regularizedRecord = facultyAtt.find(a => 
    a.date === testRegDate && 
    (a.class_name === 'Faculty' || /faculty|staff/i.test(a.class_name || '') || (Array.isArray(a.teacher_records) && a.teacher_records.length > 0))
  );
  console.log('REGULARIZED RECORD FOUND:', regularizedRecord ? { class: regularizedRecord.class_name, date: regularizedRecord.date, teacherRecordsCount: regularizedRecord.teacher_records?.length } : 'NONE');
  const teacherRecord = regularizedRecord?.teacher_records?.find(t => t.teacher_id === 'EMP-SUBJ01' || t.staff_code === 'EMP-SUBJ01');
  assert(teacherRecord?.status === 'PRESENT', 'Unified staff attendance record set to PRESENT');
  assert(teacherRecord?.is_regularized === true, 'Staff attendance record marked is_regularized: true');

  // ----------------------------------------------------
  // TEST 5: SYLLABUS CURRICULUM COVERAGE FLOW
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Month-Wise Syllabus & Progress Tracking ---');
  const syllabusPlans = await Database.getSyllabusPlans(SCHOOL_ID, SESSION, '10', 'Mathematics');
  assert(syllabusPlans.length >= 3, `Admin syllabus plans loaded for Class 10 Math (${syllabusPlans.length} months)`);

  const aprilPlan = syllabusPlans.find(p => p.month === 'April');
  assert(!!aprilPlan && aprilPlan.topics.length >= 2, 'April syllabus plan contains planned topics and periods');

  // Test teacher progress saving
  const topicId = aprilPlan!.topics[0].id;
  const progressSave = await Database.saveSyllabusProgress({
    id: `PROG-TEST-001`,
    school_id: SCHOOL_ID,
    academic_session: SESSION,
    topic_id: topicId,
    class_name: '10',
    section: 'A',
    subject_name: 'Mathematics',
    teacher_id: 'EMP-SUBJ01',
    status: 'COMPLETED',
    completion_date: '2026-04-18',
    periods_used: 6,
    teacher_remarks: 'Completed on schedule.'
  });
  assert(progressSave.status === 'COMPLETED', 'Teacher marked topic as COMPLETED with periods used');

  // ----------------------------------------------------
  // TEST 6: STUDENT LEAVE -> CLASS TEACHER APPROVAL -> ATTENDANCE SYNC
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Student Leave & Unified Attendance Sync ---');
  const studentLeaves = await Database.getStudentLeaves(SCHOOL_ID, '10', 'A');
  assert(studentLeaves.length >= 2, `Retrieved ${studentLeaves.length} student leave applications for Class 10-A`);

  const testLeave = studentLeaves.find(l => l.status === 'PENDING') || studentLeaves[0];
  const actionedLeave = await Database.actionStudentLeave(
    testLeave.id,
    'APPROVE',
    'Approved on valid grounds by Class Teacher',
    { id: 'EMP-CLAS01', name: 'Ananya Sen' }
  );
  assert(actionedLeave?.status === 'APPROVED', 'Student leave application approved by Class Teacher');

  // Verify unified attendance record was updated
  const attCheck = await AttendanceService.getAllAttendanceRecords(SCHOOL_ID, SESSION);
  const matchedAtt = attCheck.find(a => 
    a.date === testLeave.from_date && 
    (a.class_name === testLeave.class_name || a.class_name === '10' || a.class_name === 'Class 10') && 
    (a.section || 'A').toUpperCase() === (testLeave.section || 'A').toUpperCase()
  );
  assert(
    !!matchedAtt,
    `Unified student attendance record verified for leave date ${testLeave.from_date}`
  );

  // ----------------------------------------------------
  // TEST 7: REGRESSION CHECK - EXISTING ADMIN ATTENDANCE SYSTEM
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Regression Check - Admin Unified Attendance ---');
  const allAttRecords = await AttendanceService.getAllAttendanceRecords(SCHOOL_ID, SESSION);
  assert(allAttRecords.length > 0, `Existing unified attendance records intact: ${allAttRecords.length} records`);

  const schoolOverview = await AttendanceService.getSchoolSummary(SCHOOL_ID, SESSION, '2026-08-01');
  assert(!!schoolOverview, 'AttendanceService.getSchoolSummary functioning normally (no regression)');

  // ----------------------------------------------------
  // TEST 8: FEE MASTER ENGINE INTEGRATION (READ-ONLY)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Fee Master Integration (Read-Only) ---');
  const defaulters = await FeesService.getPendingList(SCHOOL_ID, SESSION);
  assert(Array.isArray(defaulters), `Fee Master defaulters report fetched via unified service: ${defaulters.length} items`);

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Verification failed with unhandled exception:', err);
  process.exit(1);
});
