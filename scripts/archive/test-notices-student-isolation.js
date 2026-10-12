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

async function runNoticeIsolationTests() {
  console.log('=== STARTING NOTICE BOARD STUDENT ISOLATION VERIFICATION ===\n');

  // Step 1: Login as Student (DPS-2026-0128)
  console.log('1. Authenticating as Student (DPS-2026-0128 / 123456)...');
  const studentLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'DPS-2026-0128', password: '123456', school_code: 'DPS2026' }));

  const studentUser = JSON.parse(studentLoginRes.body);
  const studentToken = studentUser.session_token;
  console.log(`✓ Student authenticated: ${studentUser.user.full_name} (${studentUser.user.role})`);

  // Step 2: Login as Admin to create a confidential teacher notice
  console.log('\n2. Authenticating as Admin to create a confidential teacher circular...');
  const adminLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: '123456', school_code: 'DPS2026' }));

  const adminUser = JSON.parse(adminLoginRes.body);
  const adminToken = adminUser.session_token;

  // Post Teacher-only notice
  const createNoticeRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/notices',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'x-session-token': adminToken,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    school_id: 'DPS2026',
    title: 'Confidential Faculty Salary & Staff Meeting Notice',
    content: 'Staff meeting strictly for teachers and management on Friday at 3:00 PM.',
    target_audience: 'TEACHERS',
    posted_by: 'Principal Office'
  }));

  const createdNotice = JSON.parse(createNoticeRes.body);
  console.log(`✓ Created Teacher-only Notice: "${createdNotice.notice.title}" (ID: ${createdNotice.notice.id})`);

  // Step 3: Fetch notices as Student
  console.log('\n3. Fetching notices as Student to verify isolation...');
  const studentNoticesRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/notices?school_id=DPS2026',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'x-session-token': studentToken
    }
  });

  const studentNotices = JSON.parse(studentNoticesRes.body);
  console.log(`✓ Total notices returned to Student: ${studentNotices.notices.length}`);
  
  const leakedTeacherNotice = studentNotices.notices.find(n => n.id === createdNotice.notice.id || n.target_audience === 'TEACHERS');
  if (leakedTeacherNotice) {
    console.error('✗ SECURITY LEAK: Student received a teacher-only notice!', leakedTeacherNotice);
    process.exit(1);
  }
  console.log('✓ Verified: Teacher-only notice is NOT visible to student!');

  studentNotices.notices.forEach((n, i) => {
    console.log(`  [${i+1}] Title: "${n.title}" | Audience: ${n.target_audience}`);
  });

  // Step 4: Verify Student cannot POST notice
  console.log('\n4. Verifying Student cannot publish notice (Forbidden)...');
  const studentPostRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/notices',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'x-session-token': studentToken,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    school_id: 'DPS2026',
    title: 'Unauthorized Student Post',
    content: 'Testing permission block',
    target_audience: 'STUDENTS'
  }));

  if (studentPostRes.statusCode === 403) {
    console.log('✓ Verified: Student POST /api/notices returned 403 Forbidden!');
  } else {
    console.error(`✗ Security issue: Expected 403 but got ${studentPostRes.statusCode}`);
    process.exit(1);
  }

  // Step 5: Clean up test notice
  await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/notices?id=${createdNotice.notice.id}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'x-session-token': adminToken
    }
  });
  console.log('\n✓ Cleaned up temporary test notice.');

  console.log('\n=== ALL NOTICE BOARD STUDENT ISOLATION CHECKS PASSED! ===');
}

runNoticeIsolationTests().catch(err => {
  console.error(err);
  process.exit(1);
});
