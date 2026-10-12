const http = require('http');
const fs = require('fs');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTeacherExamRestrictionsTests() {
  console.log('=== STARTING TEACHER EXAM POSTING RESTRICTIONS VERIFICATION ===\n');

  // 1. Authenticate Teacher (Dr. Aniruddh Shastri, EMP01)
  console.log('1. Authenticating Faculty Member (Dr. Aniruddh Shastri - EMP01)...');
  const teacherLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'EMP01', password: '123456', school_code: 'DPS2026' }));

  const teacherUser = JSON.parse(teacherLoginRes.body);
  const teacherToken = teacherUser.session_token;
  console.log(`✓ Authenticated: ${teacherUser.user.full_name} (${teacherUser.user.role})`);

  // Test A: Teacher posting a CLASS_TEST (Unit Test 1) -> MUST SUCCEED
  console.log('\n2. Testing Teacher posting a CLASS_TEST (Unit Test 1)...');
  const validTestPayload = JSON.stringify({
    school_id: 'DPS2026',
    academic_session: '2026-27',
    title: 'Unit Test 1 - Playgroup A',
    type: 'CLASS_TEST',
    class_name: 'Playgroup',
    section: 'A',
    subject_name: 'English Oral & Rhymes',
    date: '2026-09-10',
    time: '09:30 AM',
    max_marks: 20,
    pass_marks: 7,
    status: 'PENDING'
  });

  const teacherTestRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/exams',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${teacherToken}`,
      'x-session-token': teacherToken,
      'Content-Type': 'application/json'
    }
  }, validTestPayload);

  console.log(`✓ Teacher CLASS_TEST Status: ${teacherTestRes.statusCode}`);
  if (teacherTestRes.statusCode !== 200) {
    console.error('✗ Expected 200 for teacher posting CLASS_TEST!');
    process.exit(1);
  }
  console.log('✓ Verified: Teacher CAN post classroom tests & unit quizzes!');

  // Test B: Teacher attempting to post a SCHOOL_EXAM (Annual Board Assessment / Half Yearly) -> MUST BE 403 FORBIDDEN
  console.log('\n3. Testing Teacher attempting to post a SCHOOL_EXAM (Annual Board Assessment)...');
  const invalidExamPayload = JSON.stringify({
    school_id: 'DPS2026',
    academic_session: '2026-27',
    title: 'Annual Board Assessment - Playgroup A',
    type: 'SCHOOL_EXAM',
    class_name: 'Playgroup',
    section: 'A',
    subject_name: 'English Oral & Rhymes',
    date: '2026-09-15',
    time: '09:30 AM - 12:30 PM',
    max_marks: 80,
    pass_marks: 27,
    status: 'PENDING'
  });

  const teacherExamRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/exams',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${teacherToken}`,
      'x-session-token': teacherToken,
      'Content-Type': 'application/json'
    }
  }, invalidExamPayload);

  const teacherExamBody = JSON.parse(teacherExamRes.body);
  console.log(`✓ Teacher SCHOOL_EXAM Status: ${teacherExamRes.statusCode} - Error: "${teacherExamBody.error}"`);
  if (teacherExamRes.statusCode === 403) {
    console.log('✓ Verified: Teacher CANNOT post official school examinations (Forbidden)!');
  } else {
    console.error(`✗ Security issue: Expected 403 Forbidden but got ${teacherExamRes.statusCode}`);
    process.exit(1);
  }

  // Test C: Admin posting a SCHOOL_EXAM -> MUST SUCCEED
  console.log('\n4. Testing School Administrator posting a SCHOOL_EXAM...');
  const adminLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: '123456', school_code: 'DPS2026' }));

  const adminUser = JSON.parse(adminLoginRes.body);
  const adminToken = adminUser.session_token;

  const adminExamRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/exams',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'x-session-token': adminToken,
      'Content-Type': 'application/json'
    }
  }, invalidExamPayload);

  console.log(`✓ Admin SCHOOL_EXAM Status: ${adminExamRes.statusCode}`);
  if (adminExamRes.statusCode === 200) {
    console.log('✓ Verified: School Administrator retains authority to post official School Exams!');
  } else {
    console.error(`✗ Admin school exam failed: ${adminExamRes.body}`);
    process.exit(1);
  }

  // 5. Code inspection checks for UI
  console.log('\n5. Inspecting dashboard-exams.tsx UI role hardening...');
  const examsCode = fs.readFileSync('src/components/blocks/dashboard-exams.tsx', 'utf8');

  if (examsCode.includes('(!isTeacher || exam.type === \'CLASS_TEST\')')) {
    console.log('✓ Verified: Teachers cannot delete official SCHOOL_EXAM slots');
  } else {
    console.error('✗ Teacher delete exam guard missing');
    process.exit(1);
  }

  if (examsCode.includes('{!isTeacher && showWholeSchoolModal && (')) {
    console.log('✓ Verified: Bulk Master modal is strictly hidden from teachers');
  } else {
    console.error('✗ Bulk master modal guard missing');
    process.exit(1);
  }

  console.log('\n=== ALL TEACHER EXAM RESTRICTION CHECKS PASSED! ===');
}

runTeacherExamRestrictionsTests().catch(err => {
  console.error(err);
  process.exit(1);
});
