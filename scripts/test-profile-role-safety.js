const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runProfileSafetyTests() {
  console.log('=== STARTING PROFILE ROLE SAFETY & CLEARANCE VERIFICATION ===\n');

  // Step 1: Login as Student
  console.log('1. Authenticating as Student (DPS-2026-0001)...');
  const studentLoginData = JSON.stringify({
    username: 'DPS-2026-0001',
    password: '123456',
    school_code: 'DPS2026'
  });

  const studentLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(studentLoginData)
    }
  }, studentLoginData);

  const studentUser = JSON.parse(studentLoginRes.body);
  console.log(`✓ Student authenticated: ${studentUser.user.full_name} (${studentUser.user.role})`);

  // Step 2: GET /api/auth/profile as Student
  console.log('\n2. Testing GET /api/auth/profile as Student...');
  const token = studentUser.session_token;
  const getProfileRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-session-token': token
    }
  });

  const profileData = JSON.parse(getProfileRes.body);
  console.log(`✓ Profile received:`, profileData);
  if (profileData.profile?.admin_pin) {
    console.error('✗ SECURITY LEAK: admin_pin returned to student!');
    process.exit(1);
  }
  console.log('✓ Verified: No admin_pin exposed to student');

  // Step 3: POST /api/auth/profile as Student (Updating phone & email)
  console.log('\n3. Testing POST /api/auth/profile as Student (Updating phone & email)...');
  const updateData = JSON.stringify({
    full_name: studentUser.user.full_name,
    email: 'kabir.reddy@student.dps.edu',
    phone: '+91 98765 11111'
  });

  const postProfileRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/profile',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-session-token': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateData)
    }
  }, updateData);

  const updateResult = JSON.parse(postProfileRes.body);
  console.log(`✓ Response: ${updateResult.message}`);
  console.log(`  Updated Email: ${updateResult.user?.email}`);
  console.log(`  Updated Phone: ${updateResult.user?.phone}`);

  // Step 4: Verify School Admin PIN remains intact
  const adminLoginData = JSON.stringify({
    username: 'admin',
    password: '123456',
    school_code: 'DPS2026'
  });

  const adminLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(adminLoginData)
    }
  }, adminLoginData);

  if (adminLoginRes.statusCode === 200) {
    console.log('✓ Verified: Master Admin credentials remain secure and unchanged!');
  } else {
    console.error('✗ Admin login failed! Admin PIN might have been corrupted.');
    process.exit(1);
  }

  console.log('\n=== ALL PROFILE SECURITY & PERMISSION TESTS PASSED! ===');
}

runProfileSafetyTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
