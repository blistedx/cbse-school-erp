import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

interface TestResult {
  route: string;
  method: string;
  role: string;
  status: number;
  latencyMs: number;
  expectedShape: boolean;
  notes: string;
}

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const SESSION_SECRET = (process.env.SESSION_SECRET || 'giterp-super-secret-key-cbse-erp-2026').replace(/^["']|["']$/g, '').trim();

function createToken(userId: string, schoolId: string, role: string): string {
  const iat = Date.now();
  const exp = iat + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, schoolId, role, iat, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

async function makeRequest(
  urlPath: string,
  method: string = 'GET',
  body: any = null,
  role: string = 'PRINCIPAL',
  schoolId: string = 'DPS2026'
): Promise<{ status: number; latencyMs: number; data: any }> {
  const start = Date.now();
  try {
    const token = role === 'PUBLIC' ? '' : createToken(`USR-${role}`, schoolId, role);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-session-token'] = token;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${urlPath}`, fetchOptions);
    const latencyMs = Date.now() - start;
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, latencyMs, data };
  } catch (err: any) {
    return { status: 0, latencyMs: Date.now() - start, data: { error: err.message } };
  }
}

async function runSmokeTests() {
  console.log(`\n================================================================`);
  console.log(`  EduSuite School ERP — Live Runtime API Smoke Test Suite`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`================================================================\n`);

  const results: TestResult[] = [];

  const testCases = [
    // Health & System
    { route: '/api/health', method: 'GET', body: null, role: 'PUBLIC' },
    { route: '/api/app-info', method: 'GET', body: null, role: 'PUBLIC' },
    { route: '/api/app-init?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/overview?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/stats?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    
    // Core ERP Data
    { route: '/api/schools', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/classes?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/classes/subjects?school_id=DPS2026&class_id=CLS-DPS-001', method: 'GET', body: null, role: 'TEACHER' },
    { route: '/api/students?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/students/search?school_id=DPS2026&q=Aarav', method: 'GET', body: null, role: 'TEACHER' },
    { route: '/api/teachers?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    
    // Attendance & Calendar
    { route: '/api/attendance?school_id=DPS2026&date=2026-09-01', method: 'GET', body: null, role: 'TEACHER' },
    { route: '/api/attendance/scan?school_id=DPS2026&student_id=STU-DPS-0005', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/holidays?school_id=DPS2026', method: 'GET', body: null, role: 'STUDENT' },
    
    // Exams & Academic
    { route: '/api/exams?school_id=DPS2026', method: 'GET', body: null, role: 'TEACHER' },
    
    // Fees & Finance
    { route: '/api/fee-master?school_id=DPS2026&tab=overview', method: 'GET', body: null, role: 'ACCOUNTANT' },
    { route: '/api/fee-master?action=receipts&school_id=DPS2026', method: 'GET', body: null, role: 'ACCOUNTANT' },
    { route: '/api/finance?school_id=DPS2026', method: 'GET', body: null, role: 'ACCOUNTANT' },
    { route: '/api/finance/reports/pl?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    
    // Communications & Push
    { route: '/api/notices?school_id=DPS2026', method: 'GET', body: null, role: 'STUDENT' },
    { route: '/api/notifications/broadcasts?school_id=DPS2026', method: 'GET', body: null, role: 'PARENT' },
    { route: '/api/notifications/vapid-key', method: 'GET', body: null, role: 'PUBLIC' },
    { route: '/api/notifications/subscribe?school_id=DPS2026', method: 'GET', body: null, role: 'PARENT' },
    
    // Logs, Telemetry & Verification
    { route: '/api/audit-logs?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/admin/storage-health', method: 'GET', body: null, role: 'AGENCY_SUPERADMIN' },
    { route: '/api/transport/telemetry?school_id=DPS2026', method: 'GET', body: null, role: 'PARENT' },
    { route: '/api/verify/id?student_id=STU-DPS-0005&school_id=DPS2026', method: 'GET', body: null, role: 'PUBLIC' },
    { route: '/api/request-demo', method: 'GET', body: null, role: 'AGENCY_SUPERADMIN' },
    { route: '/api/school/permissions?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/sync/mongodb?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    
    // Auth & Identity Endpoints
    { route: '/api/auth/profile?school_id=DPS2026', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/auth/session', method: 'GET', body: null, role: 'PRINCIPAL' },
    { route: '/api/auth/forgot-passcode', method: 'POST', body: { school_code: 'DPS2026', username: 'admin' }, role: 'PUBLIC' },
  ];

  for (const tc of testCases) {
    const res = await makeRequest(tc.route, tc.method, tc.body, tc.role);
    const validShape = res.status >= 200 && res.status < 300 && res.data !== null;
    let notes = 'OK';
    if (res.status === 0) notes = 'Connection Refused / Server Down';
    else if (res.status >= 500) notes = `5xx Server Error: ${res.data?.error || 'Internal error'}`;
    else if (res.status === 401 || res.status === 403) notes = `Auth Failure (${res.data?.error || 'Denied'})`;
    else if (res.data?.success !== undefined) notes = `success=${res.data.success}`;
    else if (Array.isArray(res.data)) notes = `Array(${res.data.length})`;

    results.push({
      route: tc.route.split('?')[0],
      method: tc.method,
      role: tc.role,
      status: res.status,
      latencyMs: res.latencyMs,
      expectedShape: validShape,
      notes,
    });
  }

  // Print Table
  console.log('| Method | Endpoint | Role | Status | Latency | Schema Shape | Notes |');
  console.log('|:---|:---|:---|:---|:---|:---|:---|');
  for (const r of results) {
    const statusStr = r.status >= 200 && r.status < 300 ? `✅ ${r.status}` : `❌ ${r.status}`;
    const shapeStr = r.expectedShape ? '✅ Valid' : '❌ Malformed/Error';
    console.log(`| ${r.method.padEnd(6)} | ${r.route.padEnd(30)} | ${r.role.padEnd(17)} | ${statusStr.padEnd(8)} | ${(`${r.latencyMs}ms`).padEnd(7)} | ${shapeStr.padEnd(17)} | ${r.notes} |`);
  }

  const passed = results.filter(r => r.status >= 200 && r.status < 300).length;
  console.log(`\nResults: ${passed}/${results.length} endpoints returned 2xx OK responses.`);
}

runSmokeTests();
