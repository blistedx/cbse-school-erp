const http = require('http');

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

async function runTeacherAttendanceTests() {
  console.log('=== STARTING TEACHER CLASS ATTENDANCE RESTRICTION TESTS ===\n');

  // 1. Authenticate Class Teacher (Dr. Aniruddh Shastri, EMP01 - Class Teacher of Playgroup A)
  console.log('1. Authenticating Dr. Aniruddh Shastri (EMP01 - Class Teacher of Playgroup A)...');
  const ctLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'EMP01', password: '123456', school_code: 'DPS2026' }));

  const ctUser = JSON.parse(ctLoginRes.body);
  const ctToken = ctUser.session_token;
  console.log(`✓ Authenticated: ${ctUser.user.full_name} (${ctUser.user.role})`);

  // Test A: Class Teacher saving attendance for his ASSIGNED class (Playgroup A) -> MUST SUCCEED
  console.log('\n2. Testing Class Teacher marking attendance for ASSIGNED class (Playgroup A)...');
  const validPayload = JSON.stringify({
    school_id: 'DPS2026',
    academic_session: '2026-27',
    date: '2026-09-02',
    class_name: 'Playgroup',
    section: 'A',
    total_students: 5,
    present_count: 5,
    absent_count: 0,
    student_records: []
  });

  const ctValidRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/attendance',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ctToken}`,
      'x-session-token': ctToken,
      'Content-Type': 'application/json'
    }
  }, validPayload);

  console.log(`✓ Status: ${ctValidRes.statusCode}`, JSON.parse(ctValidRes.body).message || JSON.parse(ctValidRes.body).error);
  if (ctValidRes.statusCode !== 200) {
    console.error('✗ Expected 200 for assigned class attendance!');
    process.exit(1);
  }

  // Test B: Class Teacher attempting to mark attendance for UNASSIGNED class (Class 10 A) -> MUST BE 403 FORBIDDEN
  console.log('\n3. Testing Class Teacher attempting to mark attendance for UNASSIGNED class (Class 10 A)...');
  const invalidClassPayload = JSON.stringify({
    school_id: 'DPS2026',
    academic_session: '2026-27',
    date: '2026-09-02',
    class_name: 'Class 10',
    section: 'A',
    total_students: 5,
    present_count: 5,
    absent_count: 0,
    student_records: []
  });

  const ctInvalidRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/attendance',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ctToken}`,
      'x-session-token': ctToken,
      'Content-Type': 'application/json'
    }
  }, invalidClassPayload);

  const ctInvalidBody = JSON.parse(ctInvalidRes.body);
  console.log(`✓ Status: ${ctInvalidRes.statusCode} - Error: "${ctInvalidBody.error}"`);
  if (ctInvalidRes.statusCode === 403) {
    console.log('✓ Verified: Class Teacher CANNOT mark attendance for other classes!');
  } else {
    console.error(`✗ Security issue: Expected 403 Forbidden but got ${ctInvalidRes.statusCode}`);
    process.exit(1);
  }

  // Test C: Class Teacher attempting to record FACULTY attendance -> MUST BE 403 FORBIDDEN
  console.log('\n4. Testing Class Teacher attempting to record FACULTY attendance...');
  const facultyPayload = JSON.stringify({
    school_id: 'DPS2026',
    type: 'FACULTY',
    date: '2026-09-02',
    total_faculty: 10,
    present_count: 10,
    teacher_records: []
  });

  const ctFacultyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/attendance',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ctToken}`,
      'x-session-token': ctToken,
      'Content-Type': 'application/json'
    }
  }, facultyPayload);

  const ctFacultyBody = JSON.parse(ctFacultyRes.body);
  console.log(`✓ Status: ${ctFacultyRes.statusCode} - Error: "${ctFacultyBody.error}"`);
  if (ctFacultyRes.statusCode === 403) {
    console.log('✓ Verified: Teacher CANNOT record faculty attendance!');
  } else {
    console.error(`✗ Security issue: Expected 403 Forbidden for faculty attendance but got ${ctFacultyRes.statusCode}`);
    process.exit(1);
  }

  // 2. Authenticate Subject Teacher (Mr. Gurpreet Singh Sandhu, EMP-202622 - Physical Education, NO assigned class)
  console.log('\n5. Authenticating Subject Teacher (Mr. Gurpreet Singh Sandhu, EMP-202622 - PE)...');
  const stLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'EMP-202622', password: '123456', school_code: 'DPS2026' }));

  const stUser = JSON.parse(stLoginRes.body);
  const stToken = stUser.session_token;
  console.log(`✓ Authenticated Subject Teacher: ${stUser.user.full_name} (${stUser.user.role})`);

  // Test D: Subject Teacher attempting to mark attendance for ANY class (Playgroup A) -> MUST BE 403 FORBIDDEN
  console.log('\n6. Testing Subject Teacher attempting to mark attendance for Playgroup A...');
  const stAttemptRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/attendance',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stToken}`,
      'x-session-token': stToken,
      'Content-Type': 'application/json'
    }
  }, validPayload);

  const stAttemptBody = JSON.parse(stAttemptRes.body);
  console.log(`✓ Status: ${stAttemptRes.statusCode} - Error: "${stAttemptBody.error}"`);
  if (stAttemptRes.statusCode === 403) {
    console.log('✓ Verified: Subject Teacher CANNOT mark attendance for ANY class!');
  } else {
    console.error(`✗ Security issue: Expected 403 Forbidden for subject teacher attendance but got ${stAttemptRes.statusCode}`);
    process.exit(1);
  }

  // 3. Authenticate Administrator -> Full executive access across all classes
  console.log('\n7. Verifying Administrator has full executive attendance access across all classes...');
  const adminLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: '123456', school_code: 'DPS2026' }));

  const adminUser = JSON.parse(adminLoginRes.body);
  const adminToken = adminUser.session_token;

  const adminRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/attendance',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'x-session-token': adminToken,
      'Content-Type': 'application/json'
    }
  }, invalidClassPayload); // Class 10 A

  console.log(`✓ Admin Status: ${adminRes.statusCode}`, JSON.parse(adminRes.body).message);
  if (adminRes.statusCode === 200) {
    console.log('✓ Verified: School Administrator retains full institutional attendance authorization!');
  } else {
    console.error(`✗ Admin attendance failed: ${adminRes.body}`);
    process.exit(1);
  }

  console.log('\n=== ALL TEACHER ATTENDANCE RESTRICTION TESTS PASSED! ===');
}

runTeacherAttendanceTests().catch(err => {
  console.error(err);
  process.exit(1);
});
