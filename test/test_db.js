/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Multi-School Database Automated Test Runner
 * Tests data storage, multi-tenant isolation, CRUD operations, and multi-school KPIs.
 */

const { Database } = require('../lib/db');

async function runDatabaseTests() {
  console.log('\n======================================================');
  console.log('🧪 MULTI-SCHOOL DATABASE VERIFICATION & TEST RUNNER');
  console.log('======================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: REGISTER MULTIPLE SCHOOLS
    // ----------------------------------------------------
    console.log('▶️ TEST 1: Registering Multiple Schools...');
    
    const schoolA = await Database.createSchool({
      school_code: 'DPS-2026',
      school_name: 'Delhi Public School, Gomti Nagar',
      board: 'CBSE',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      principal_name: 'Dr. Rajiv Malhotra',
      admin_id: 'DPS-1001',
      admin_pin: 'DPS001'
    });
    console.log(`   ✅ Created School A: ${schoolA.school_name} [${schoolA.school_code}]`);

    const schoolB = await Database.createSchool({
      school_code: 'SXHS-2026',
      school_name: 'St. Xavier High School',
      board: 'CISCE (ICSE / ISC)',
      city: 'Mumbai',
      state: 'Maharashtra',
      principal_name: 'Fr. Anthony Fernandez',
      admin_id: 'SXHS-1001',
      admin_pin: 'SXHS001'
    });
    console.log(`   ✅ Created School B: ${schoolB.school_name} [${schoolB.school_code}]`);

    const schoolC = await Database.createSchool({
      school_code: 'KV-2026',
      school_name: 'Kendriya Vidyalaya No. 1',
      board: 'CBSE',
      city: 'Delhi',
      state: 'Delhi',
      principal_name: 'Mrs. Sunita Sharma',
      admin_id: 'KV-1001',
      admin_pin: 'KV001'
    });
    console.log(`   ✅ Created School C: ${schoolC.school_name} [${schoolC.school_code}]`);

    // ----------------------------------------------------
    // TEST 2: CREATE STUDENTS IN DIFFERENT SCHOOLS
    // ----------------------------------------------------
    console.log('\n▶️ TEST 2: Enrolling Students into Respective School Datasets...');
    
    // School A Students
    const stuA1 = await Database.createStudent(schoolA.id, {
      roll_no: '101',
      name: 'Aarav Verma',
      class_name: 'Class 10 - A',
      guardian_name: 'Vikas Verma',
      guardian_phone: '+91 98111 00001'
    });
    const stuA2 = await Database.createStudent(schoolA.id, {
      roll_no: '102',
      name: 'Riya Gupta',
      class_name: 'Class 10 - A',
      guardian_name: 'Amit Gupta',
      guardian_phone: '+91 98111 00002'
    });
    console.log(`   ✅ Enrolled 2 Students into [${schoolA.school_code}]`);

    // School B Students
    const stuB1 = await Database.createStudent(schoolB.id, {
      roll_no: '201',
      name: 'Rohan D\'Souza',
      class_name: 'Class 9 - ICSE',
      guardian_name: 'Michael D\'Souza',
      guardian_phone: '+91 98222 00001'
    });
    console.log(`   ✅ Enrolled 1 Student into [${schoolB.school_code}]`);

    // ----------------------------------------------------
    // TEST 3: MULTI-TENANT ISOLATION CHECK
    // ----------------------------------------------------
    console.log('\n▶️ TEST 3: Testing Strict Multi-Tenant Data Isolation...');
    
    const studentsA = await Database.getStudents(schoolA.id);
    const studentsB = await Database.getStudents(schoolB.id);

    console.log(`   📊 School A [${schoolA.school_code}] Student Count: ${studentsA.length}`);
    console.log(`   📊 School B [${schoolB.school_code}] Student Count: ${studentsB.length}`);

    const hasOverlap = studentsA.some(sa => studentsB.some(sb => sb.id === sa.id));
    if (hasOverlap) {
      throw new Error('❌ DATA LEAK DETECTED: School A and School B student records overlapped!');
    }
    console.log('   ✅ DATA ISOLATION VERIFIED: No cross-tenant leakage between schools!');

    // ----------------------------------------------------
    // TEST 4: ATTENDANCE & FEE INVOICING PER SCHOOL
    // ----------------------------------------------------
    console.log('\n▶️ TEST 4: Recording Attendance & Fee Invoices per School...');
    
    await Database.recordAttendance(schoolA.id, {
      member_id: stuA1.id,
      member_name: stuA1.name,
      member_type: 'STUDENT',
      status: 'PRESENT'
    });

    const invA = await Database.createFeeInvoice(schoolA.id, {
      student_id: stuA1.id,
      student_name: stuA1.name,
      fee_type: 'Term 1 Tuition',
      amount: 15000,
      paid_amount: 15000,
      status: 'PAID'
    });
    console.log(`   ✅ Recorded Attendance & Fee Bill (${invA.id}) for [${schoolA.school_code}]`);

    // ----------------------------------------------------
    // TEST 5: MULTI-SCHOOL AUTHENTICATION & LOGIN
    // ----------------------------------------------------
    console.log('\n▶️ TEST 5: Testing Multi-School Administrator Authentication...');
    
    const authA = await Database.authenticateUser('DPS-2026', 'DPS-1001', 'DPS001');
    if (!authA || authA.user.role !== 'SCHOOL_ADMIN') {
      throw new Error('❌ Authentication failed for School A admin');
    }
    console.log(`   ✅ Authenticated Admin for School A (${authA.school.school_name})`);

    const authB = await Database.authenticateUser('SXHS-2026', 'SXHS-1001', 'SXHS001');
    if (!authB) {
      throw new Error('❌ Authentication failed for School B admin');
    }
    console.log(`   ✅ Authenticated Admin for School B (${authB.school.school_name})`);

    // ----------------------------------------------------
    // TEST 6: DATABASE STATISTICS
    // ----------------------------------------------------
    console.log('\n▶️ TEST 6: Overall Database Multi-School Statistics...');
    const stats = await Database.getDatabaseStats();
    console.table(stats.schoolsList);

    console.log('\n======================================================');
    console.log('🎉 ALL DATABASE MULTI-SCHOOL TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ DATABASE TEST FAILED:', err);
    process.exit(1);
  }
}

runDatabaseTests();
