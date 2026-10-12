import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

interface SecurityTestResult {
  category: string;
  testName: string;
  endpoint: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const SESSION_SECRET = (process.env.SESSION_SECRET || 'giterp-super-secret-key-cbse-erp-2026').replace(/^["']|["']$/g, '').trim();

function createValidToken(userId: string, schoolId: string, role: string, ttlMs: number = 12 * 3600 * 1000): string {
  const iat = Date.now();
  const exp = iat + ttlMs;
  const payload = Buffer.from(JSON.stringify({ userId, schoolId, role, iat, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function createExpiredToken(userId: string, schoolId: string, role: string): string {
  const iat = Date.now() - 24 * 3600 * 1000;
  const exp = Date.now() - 12 * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, schoolId, role, iat, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function createTamperedToken(userId: string, schoolId: string, role: string): string {
  const token = createValidToken(userId, schoolId, role);
  const [payload] = token.split('.');
  const badSig = 'tampered_signature_xyz_1234567890';
  return `${payload}.${badSig}`;
}

function createPrivilegeEscalatedToken(userId: string, schoolId: string): string {
  // Create valid student token then modify payload to PRINCIPAL without re-signing
  const validStudentToken = createValidToken(userId, schoolId, 'STUDENT');
  const [, sig] = validStudentToken.split('.');
  const fakePayload = Buffer.from(JSON.stringify({
    userId,
    schoolId,
    role: 'PRINCIPAL',
    iat: Date.now(),
    exp: Date.now() + 3600000
  })).toString('base64url');
  return `${fakePayload}.${sig}`;
}

async function request(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; data: any; headers: Headers }> {
  const method = options.method || 'GET';
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.token) {
    reqHeaders['Authorization'] = `Bearer ${options.token}`;
    reqHeaders['x-session-token'] = options.token;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: reqHeaders,
  };

  if (options.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data, headers: res.headers };
  } catch (err: any) {
    return { status: 0, data: { error: err.message }, headers: new Headers() };
  }
}

async function runSecurityTestSuite() {
  console.log('================================================================');
  console.log('  CBSE School ERP — Comprehensive Phase 2 Security Test Suite');
  console.log(`  Target: ${BASE_URL}`);
  console.log('================================================================\n');

  const results: SecurityTestResult[] = [];

  // -------------------------------------------------------------
  // 1. Vector 1: No Token / Unauthenticated Access to Protected APIs
  // -------------------------------------------------------------
  const protectedEndpoints = [
    '/api/overview?school_id=DPS2026',
    '/api/classes?school_id=DPS2026',
    '/api/teachers?school_id=DPS2026',
    '/api/students?school_id=DPS2026',
    '/api/fee-master?school_id=DPS2026',
    '/api/finance?school_id=DPS2026',
    '/api/audit-logs?school_id=DPS2026',
    '/api/admin/storage-health',
  ];

  for (const ep of protectedEndpoints) {
    const res = await request(ep);
    const passed = res.status === 401;
    results.push({
      category: '1. No Token (Auth Required)',
      testName: `Unauthenticated ${ep.split('?')[0]}`,
      endpoint: ep,
      expected: '401 Unauthorized',
      actual: `${res.status}`,
      passed,
      notes: passed ? 'Blocked' : `Exposed (Status ${res.status})`,
    });
  }

  // -------------------------------------------------------------
  // 2. Vector 2: Expired Token
  // -------------------------------------------------------------
  const expiredToken = createExpiredToken('TCH-DPS-0001', 'DPS2026', 'PRINCIPAL');
  const resExpired = await request('/api/overview?school_id=DPS2026', { token: expiredToken });
  results.push({
    category: '2. Expired Token',
    testName: 'Expired Token Rejection',
    endpoint: '/api/overview',
    expected: '401 Unauthorized',
    actual: `${resExpired.status}`,
    passed: resExpired.status === 401,
    notes: resExpired.status === 401 ? 'Rejected expired token' : 'Failed to reject expired token',
  });

  // -------------------------------------------------------------
  // 3. Vector 3: Tampered Token Signature
  // -------------------------------------------------------------
  const tamperedToken = createTamperedToken('TCH-DPS-0001', 'DPS2026', 'PRINCIPAL');
  const resTampered = await request('/api/overview?school_id=DPS2026', { token: tamperedToken });
  results.push({
    category: '3. Tampered Signature',
    testName: 'Forged Signature Rejection',
    endpoint: '/api/overview',
    expected: '401 Unauthorized',
    actual: `${resTampered.status}`,
    passed: resTampered.status === 401,
    notes: resTampered.status === 401 ? 'HMAC validation rejected forged signature' : 'Accepted forged signature',
  });

  // -------------------------------------------------------------
  // 4. Vector 4: Cross-Tenant Isolation
  // -------------------------------------------------------------
  // Principal of DPS2026 trying to access school_id=OTHER_SCHOOL
  const dpsToken = createValidToken('TCH-DPS-0001', 'DPS2026', 'PRINCIPAL');
  const crossTenantEndpoints = [
    '/api/students?school_id=OTHER_SCHOOL_999',
    '/api/classes?school_id=OTHER_SCHOOL_999',
    '/api/attendance?school_id=OTHER_SCHOOL_999&date=2026-09-01',
    '/api/overview?school_id=OTHER_SCHOOL_999',
  ];

  for (const ep of crossTenantEndpoints) {
    const res = await request(ep, { token: dpsToken });
    // In auth-guard, resolveTenantSchoolId throws 403 if token schoolId !== query schoolId
    const passed = res.status === 403;
    results.push({
      category: '4. Multi-Tenant Isolation',
      testName: `Cross-Tenant Access ${ep.split('?')[0]}`,
      endpoint: ep,
      expected: '403 Forbidden',
      actual: `${res.status}`,
      passed,
      notes: passed ? 'Cross-tenant school_id access forbidden' : `Leaked or unexpected status ${res.status}`,
    });
  }

  // -------------------------------------------------------------
  // 5. Vector 5: Role Escalation / RBAC Enforcement
  // -------------------------------------------------------------
  const studentToken = createValidToken('STU-DPS-0001', 'DPS2026', 'STUDENT');
  const teacherToken = createValidToken('TCH-DPS-0002', 'DPS2026', 'TEACHER');

  const rbacCases = [
    { name: 'Student -> Audit Logs', token: studentToken, ep: '/api/audit-logs?school_id=DPS2026', expectedStatus: 403 },
    { name: 'Student -> Fee Master', token: studentToken, ep: '/api/fee-master?school_id=DPS2026', expectedStatus: 403 },
    { name: 'Student -> Teachers List', token: studentToken, ep: '/api/teachers?school_id=DPS2026', expectedStatus: 403 },
    { name: 'Student -> Storage Health', token: studentToken, ep: '/api/admin/storage-health', expectedStatus: 403 },
    { name: 'Teacher -> Storage Health (Superadmin only)', token: teacherToken, ep: '/api/admin/storage-health', expectedStatus: 403 },
    { name: 'Teacher -> Purge School', token: teacherToken, ep: '/api/agency/purge-school', method: 'POST', body: { school_code: 'DPS2026', confirm_school_code: 'DPS2026' }, expectedStatus: 403 },
  ];

  for (const tc of rbacCases) {
    const res = await request(tc.ep, { token: tc.token, method: tc.method || 'GET', body: tc.body });
    const passed = res.status === tc.expectedStatus;
    results.push({
      category: '5. RBAC & Privilege Escalation',
      testName: tc.name,
      endpoint: tc.ep,
      expected: `${tc.expectedStatus} Forbidden`,
      actual: `${res.status}`,
      passed,
      notes: passed ? 'RBAC rule enforced' : `Privilege escalation possible (Status ${res.status})`,
    });
  }

  // -------------------------------------------------------------
  // 6. Vector 6: Modified Role Claim without Valid Signature
  // -------------------------------------------------------------
  const forgedRoleToken = createPrivilegeEscalatedToken('STU-DPS-0001', 'DPS2026');
  const resForgedRole = await request('/api/audit-logs?school_id=DPS2026', { token: forgedRoleToken });
  results.push({
    category: '6. Payload Tampering',
    testName: 'Payload Claim Modification Rejection',
    endpoint: '/api/audit-logs',
    expected: '401 Unauthorized',
    actual: `${resForgedRole.status}`,
    passed: resForgedRole.status === 401,
    notes: resForgedRole.status === 401 ? 'HMAC verification detected tampered payload' : 'Accepted forged claims',
  });

  // -------------------------------------------------------------
  // 7. Vector 7: NoSQL Injection Attacks
  // -------------------------------------------------------------
  const nosqlLoginPayload = {
    school_code: { $ne: null },
    username: { $ne: null },
    password: { $ne: null },
  };
  const resNosqlLogin = await request('/api/auth/login', {
    method: 'POST',
    body: nosqlLoginPayload,
  });
  // Zod validation should fail with 400 or 401
  const passedNosqlLogin = resNosqlLogin.status === 400 || resNosqlLogin.status === 401;
  results.push({
    category: '7. NoSQL Injection Resistance',
    testName: 'NoSQL Operator Injection on /api/auth/login',
    endpoint: '/api/auth/login',
    expected: '400 / 401 (Rejected)',
    actual: `${resNosqlLogin.status}`,
    passed: passedNosqlLogin,
    notes: passedNosqlLogin ? 'Zod strict string schema rejected object payload' : 'Vulnerable to NoSQL operator injection',
  });

  // -------------------------------------------------------------
  // 8. Vector 8: Neutralized Session Mint Backdoor
  // -------------------------------------------------------------
  const resSessionMint = await request('/api/auth/session', {
    method: 'POST',
    body: {
      userId: 'FAKE-SUPERADMIN',
      schoolId: 'DPS2026',
      role: 'AGENCY_SUPERADMIN',
      username: 'hacker',
    },
  });
  // Since there is no valid session token provided, POST /api/auth/session must reject with 400 or 401
  const passedSessionMint = resSessionMint.status === 400 || resSessionMint.status === 401;
  results.push({
    category: '8. Backdoor Remediation',
    testName: 'Arbitrary Session Token Minting Backdoor',
    endpoint: '/api/auth/session',
    expected: '400 / 401 (Rejected)',
    actual: `${resSessionMint.status}`,
    passed: passedSessionMint,
    notes: passedSessionMint ? 'Arbitrary session minting removed' : 'VULNERABLE: /api/auth/session minted arbitrary token',
  });

  // -------------------------------------------------------------
  // 9. Vector 9: Sensitive Field Leakage (Passcodes & PII)
  // -------------------------------------------------------------
  // A. Teachers list should not contain passcode / password_hash
  const resTeachers = await request('/api/teachers?school_id=DPS2026', { token: dpsToken });
  let teachersLeaked = false;
  if (resTeachers.status === 200 && Array.isArray(resTeachers.data)) {
    for (const t of resTeachers.data) {
      if (t.passcode || t.password_hash || t.salt) {
        teachersLeaked = true;
        break;
      }
    }
  }
  results.push({
    category: '9. Sensitive Data Exposure',
    testName: 'Passcode Stripping in /api/teachers',
    endpoint: '/api/teachers',
    expected: 'No passcodes in response',
    actual: teachersLeaked ? 'Passcodes exposed' : 'Clean (Passcodes stripped)',
    passed: resTeachers.status === 200 && !teachersLeaked,
    notes: teachersLeaked ? 'Passcode field leaked' : 'Protected',
  });

  // B. Students list should not contain passcode / password_hash
  const resStudents = await request('/api/students?school_id=DPS2026', { token: dpsToken });
  let studentsLeaked = false;
  if (resStudents.status === 200 && Array.isArray(resStudents.data)) {
    for (const s of resStudents.data) {
      if (s.passcode || s.password_hash || s.salt) {
        studentsLeaked = true;
        break;
      }
    }
  }
  results.push({
    category: '9. Sensitive Data Exposure',
    testName: 'Passcode Stripping in /api/students',
    endpoint: '/api/students',
    expected: 'No passcodes in response',
    actual: studentsLeaked ? 'Passcodes exposed' : 'Clean (Passcodes stripped)',
    passed: resStudents.status === 200 && !studentsLeaked,
    notes: studentsLeaked ? 'Passcode field leaked' : 'Protected',
  });

  // C. Student ID Card verification public endpoint stripping PII
  const resVerifyId = await request('/api/verify/id?student_id=STU-DPS-0005&school_id=DPS2026');
  let piiLeaked = false;
  if (resVerifyId.status === 200 && resVerifyId.data?.data) {
    const d = resVerifyId.data.data;
    if (d.phone || d.address || d.dob || d.father_name || d.mother_name || d.passcode) {
      piiLeaked = true;
    }
  }
  results.push({
    category: '9. Sensitive Data Exposure',
    testName: 'PII Stripping on Public ID Verification',
    endpoint: '/api/verify/id',
    expected: 'Only public directory fields (no phone/address/DOB/passcode)',
    actual: piiLeaked ? 'PII exposed' : 'PII stripped safely',
    passed: resVerifyId.status === 200 && !piiLeaked,
    notes: piiLeaked ? 'PII leaked on unauthenticated route' : 'Sanitized',
  });

  // D. Public Schools list should only return public directory info and never admin_pin
  const resSchools = await request('/api/schools');
  let schoolsPinLeaked = false;
  if (resSchools.status === 200 && Array.isArray(resSchools.data)) {
    for (const sc of resSchools.data) {
      if (sc.admin_pin || sc.admin_pin_hash || sc.settings?.passcode) {
        schoolsPinLeaked = true;
        break;
      }
    }
  }
  results.push({
    category: '9. Sensitive Data Exposure',
    testName: 'Admin PIN Stripping on /api/schools',
    endpoint: '/api/schools',
    expected: 'No admin PIN in public directory',
    actual: schoolsPinLeaked ? 'PIN leaked' : 'Admin PIN stripped',
    passed: resSchools.status === 200 && !schoolsPinLeaked,
    notes: schoolsPinLeaked ? 'Admin PIN exposed' : 'Public directory minimal',
  });

  // -------------------------------------------------------------
  // 10. Vector 10: Dangerous Route Lockdown (/api/agency/purge-school)
  // -------------------------------------------------------------
  // GET must return 405
  const resPurgeGet = await request('/api/agency/purge-school');
  results.push({
    category: '10. Dangerous Endpoint Lockdown',
    testName: 'GET /api/agency/purge-school Method Not Allowed',
    endpoint: '/api/agency/purge-school',
    expected: '405 Method Not Allowed',
    actual: `${resPurgeGet.status}`,
    passed: resPurgeGet.status === 405,
    notes: resPurgeGet.status === 405 ? 'GET blocked' : `Unexpected status ${resPurgeGet.status}`,
  });

  // POST without confirmation match
  const superadminToken = createValidToken('AGY-SUPER-001', 'ALL', 'AGENCY_SUPERADMIN');
  const resPurgeNoConfirm = await request('/api/agency/purge-school', {
    method: 'POST',
    token: superadminToken,
    body: { school_code: 'DPS2026', confirm_school_code: 'WRONG_CODE' },
  });
  results.push({
    category: '10. Dangerous Endpoint Lockdown',
    testName: 'POST /api/agency/purge-school Mismatched Confirmation',
    endpoint: '/api/agency/purge-school',
    expected: '400 Bad Request',
    actual: `${resPurgeNoConfirm.status}`,
    passed: resPurgeNoConfirm.status === 400,
    notes: resPurgeNoConfirm.status === 400 ? 'Confirmation check enforced' : 'Bypassed confirmation check',
  });

  // -------------------------------------------------------------
  // 11. Vector 11: Token Revocation / Logout Invalidation
  // -------------------------------------------------------------
  const tokenToRevoke = createValidToken('TCH-DPS-0001', 'DPS2026', 'TEACHER');
  // First verify token works
  const resBeforeLogout = await request('/api/classes?school_id=DPS2026', { token: tokenToRevoke });
  const workingBefore = resBeforeLogout.status === 200;

  // Call logout endpoint
  const resLogout = await request('/api/auth/logout', { method: 'POST', token: tokenToRevoke });
  const logoutWorked = resLogout.status === 200;

  // Verify token is rejected after logout
  const resAfterLogout = await request('/api/classes?school_id=DPS2026', { token: tokenToRevoke });
  const revokedSuccessfully = resAfterLogout.status === 401;

  results.push({
    category: '11. Token Revocation',
    testName: 'Session Invalidation on Logout',
    endpoint: '/api/auth/logout',
    expected: '401 after logout',
    actual: `${resAfterLogout.status}`,
    passed: workingBefore && logoutWorked && revokedSuccessfully,
    notes: revokedSuccessfully ? 'Token revoked and rejected' : 'Token still valid after logout',
  });

  // -------------------------------------------------------------
  // 12. Vector 12: Uniform Forgot-Passcode Response (No Enumeration)
  // -------------------------------------------------------------
  const resForgotNonexistent = await request('/api/auth/forgot-passcode', {
    method: 'POST',
    body: { school_code: 'DPS2026', username: 'definitely_nonexistent_user_xyz' },
  });
  const resForgotReal = await request('/api/auth/forgot-passcode', {
    method: 'POST',
    body: { school_code: 'DPS2026', username: 'admin' },
  });
  const uniformResponse =
    resForgotNonexistent.status === 200 &&
    resForgotReal.status === 200 &&
    resForgotNonexistent.data?.message === resForgotReal.data?.message;

  results.push({
    category: '12. Account Enumeration Prevention',
    testName: 'Uniform Forgot-Passcode Responses',
    endpoint: '/api/auth/forgot-passcode',
    expected: 'Identical 200 response for existing & non-existing users',
    actual: uniformResponse ? 'Uniform responses' : 'Divergent responses',
    passed: uniformResponse,
    notes: uniformResponse ? 'Account enumeration mitigated' : 'Username enumeration possible',
  });

  // -------------------------------------------------------------
  // Report Summary
  // -------------------------------------------------------------
  console.log('\n### Security Test Results Table\n');
  console.log('| Category | Test Description | Expected | Actual | Result | Notes |');
  console.log('|:---|:---|:---|:---|:---|:---|');
  for (const r of results) {
    const passStr = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${r.category} | ${r.testName} | ${r.expected} | ${r.actual} | ${passStr} | ${r.notes || ''} |`);
  }

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`\n================================================================`);
  console.log(`  Security Test Suite Complete: ${passedCount}/${totalCount} Passed (${((passedCount / totalCount) * 100).toFixed(1)}%)`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runSecurityTestSuite();
