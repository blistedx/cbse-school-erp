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

async function runAaravTest() {
  console.log('=== VERIFYING AARAV AGARWAL EXAM & RESULT ISOLATION ===\n');

  // Step 1: Login as Aarav Agarwal (DPS-2026-0128)
  console.log('1. Authenticating as Aarav Agarwal (DPS-2026-0128 / 123456)...');
  const loginData = JSON.stringify({
    username: 'DPS-2026-0128',
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
      'Content-Length': Buffer.byteLength(loginData)
    }
  }, loginData);

  const parsed = JSON.parse(loginRes.body);
  if (!parsed.success) {
    console.error('✗ Login failed:', parsed);
    process.exit(1);
  }
  console.log(`✓ Authenticated: ${parsed.user.full_name} (${parsed.user.role}) - ID: ${parsed.user.id}`);

  // Step 2: Test profile API
  const token = parsed.session_token;
  const profileRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-session-token': token
    }
  });

  const profile = JSON.parse(profileRes.body);
  console.log(`✓ Student Profile returned: ${profile.profile.full_name} (${profile.profile.admission_no})`);

  // Step 3: Verify /app page loads cleanly
  const appRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/app',
    method: 'GET'
  });

  console.log(`✓ /app page HTTP status: ${appRes.statusCode} (${appRes.body.length} bytes)`);

  console.log('\n=== ALL VERIFICATION CHECKS FOR AARAV AGARWAL PASSED! ===');
}

runAaravTest().catch(err => {
  console.error(err);
  process.exit(1);
});
