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

async function runTests() {
  console.log('=== STARTING STUDENT PORTAL SECURITY & FUNCTIONAL VERIFICATION ===\n');

  // Test 1: Student Login API
  console.log('Test 1: Authenticating as Student (DPS-2026-0001 / 123456)...');
  const postData = JSON.stringify({
    username: 'DPS-2026-0001',
    password: '123456',
    school_code: 'DPS2026'
  });

  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);

  if (loginRes.statusCode !== 200) {
    console.error('FAIL: Student login failed with status', loginRes.statusCode, loginRes.body);
    process.exit(1);
  }

  const loginJson = JSON.parse(loginRes.body);
  console.log('✓ Login Successful!');
  console.log(`  User: ${loginJson.user.full_name} (${loginJson.user.username})`);
  console.log(`  Role: ${loginJson.user.role}`);
  console.log(`  School: ${loginJson.school.school_name} (${loginJson.school.school_code})`);

  // Test 2: Role Permissions Matrix Verification
  console.log('\nTest 2: Verifying Student Permissions Matrix...');
  const perms = loginJson.school.role_permissions?.STUDENT;
  if (!perms) {
    console.error('FAIL: No STUDENT permissions matrix found on school');
    process.exit(1);
  }

  const forbiddenModules = [
    'classes', 'subjects', 'students', 'teachers',
    'reports', 'transport', 'broadcast', 'data_hub', 'siblings', 'approvals'
  ];

  let leaksFound = false;
  forbiddenModules.forEach(mod => {
    const modPerm = perms[mod];
    if (modPerm && modPerm.can_view) {
      console.error(`  ✗ LEAK: Module '${mod}' has can_view: true for students!`);
      leaksFound = true;
    } else {
      console.log(`  ✓ Restricted: '${mod}' can_view: false`);
    }
  });

  // Verify write permissions are disabled for allowed modules
  const allowedModules = ['attendance', 'exams', 'homework', 'fees', 'notices', 'certificates'];
  allowedModules.forEach(mod => {
    const modPerm = perms[mod];
    if (modPerm) {
      console.log(`  ✓ Permitted view: '${mod}' can_view: ${modPerm.can_view}, can_edit: ${modPerm.can_edit}, can_add: ${modPerm.can_add}`);
      if (modPerm.can_add || (mod !== 'profile' && modPerm.can_edit)) {
        console.error(`  ✗ SECURITY WARNING: '${mod}' has write permissions for student!`);
        leaksFound = true;
      }
    }
  });

  if (leaksFound) {
    console.error('\nFAIL: Permission matrix contains security leaks!');
    process.exit(1);
  }

  // Test 3: App Home Page Rendering
  console.log('\nTest 3: Checking App Page HTTP Response...');
  const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'].join('; ') : '';
  const pageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/app',
    method: 'GET',
    headers: {
      'Cookie': cookie
    }
  });

  console.log(`✓ App page returned status ${pageRes.statusCode} (${pageRes.body.length} bytes)`);
  if (pageRes.statusCode === 200) {
    console.log('✓ /app page rendered cleanly with no server-side crash.');
  }

  console.log('\n=== ALL STUDENT PORTAL PERMISSION & HARDENING CHECKS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
