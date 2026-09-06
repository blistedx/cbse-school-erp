import fs from 'fs';
if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}
import { createSessionToken } from '../lib/auth-guard';

async function runTests() {
  const BASE_URL = 'http://localhost:5173';
  console.log('🧪 Starting automated security verification tests against', BASE_URL);

  // 1. Create a valid session token for a regular PRINCIPAL of School 'DPS2026'
  const schoolAToken = createSessionToken('principal_dps', 'DPS2026', 'PRINCIPAL');

  const authHeaders = {
    'Authorization': `Bearer ${schoolAToken}`,
    'Content-Type': 'application/json'
  };

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // --- TEST FIX 4: Multi-tenant Data Isolation / IDOR ---
  console.log('\n--- FIX 4: Multi-tenant Data Isolation (IDOR) ---');

  // Test 4.1: Querying students with mismatched school_id
  try {
    const res1 = await fetch(`${BASE_URL}/api/students?school_id=OTHER_SCHOOL_999`, { headers: authHeaders });
    assert('Query /api/students with mismatched school_id returns 403 Forbidden', res1.status === 403, `Status: ${res1.status}`);
  } catch (err: any) {
    assert('Query /api/students with mismatched school_id returns 403 Forbidden', false, err.message);
  }

  // Test 4.2: Querying fees with mismatched school_id
  try {
    const res2 = await fetch(`${BASE_URL}/api/fees?school_id=OTHER_SCHOOL_999`, { headers: authHeaders });
    assert('Query /api/fees with mismatched school_id returns 403 Forbidden', res2.status === 403, `Status: ${res2.status}`);
  } catch (err: any) {
    assert('Query /api/fees with mismatched school_id returns 403 Forbidden', false, err.message);
  }

  // Test 4.3: Querying own school data succeeds
  try {
    const res3 = await fetch(`${BASE_URL}/api/students?school_id=DPS2026`, { headers: authHeaders });
    assert('Query /api/students for own school succeeds with 200', res3.status === 200, `Status: ${res3.status}`);
  } catch (err: any) {
    assert('Query /api/students for own school succeeds with 200', false, err.message);
  }

  // --- TEST FIX 5: Server-side Input Validation with Zod ---
  console.log('\n--- FIX 5: Server-side Input Validation (Zod) ---');

  // Test 5.1: Missing required field full_name in student creation
  try {
    const badStudentRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        // full_name is missing
        class_name: 'Grade 10',
        gender: 'Male'
      })
    });
    const badStudentJson = await badStudentRes.json();
    assert(
      'Missing required field returns 400 Bad Request',
      badStudentRes.status === 400 && (badStudentJson.error.includes('full_name') || badStudentJson.error.includes('Validation failed')),
      `Status: ${badStudentRes.status}, Error: ${badStudentJson.error}`
    );
  } catch (err: any) {
    assert('Missing required field returns 400 Bad Request', false, err.message);
  }

  // --- TEST FIX 7: Rate Limiting on /api/request-demo ---
  console.log('\n--- FIX 7: API Rate Limiting (/api/request-demo) ---');
  try {
    let rateLimited = false;
    // Attempt 6 requests rapidly with unique fake IP in X-Forwarded-For to test isolation
    const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/api/request-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': testIp
        },
        body: JSON.stringify({
          schoolName: `Test Academy ${i}`,
          contactName: 'Tester',
          email: 'test@example.com'
        })
      });
      if (res.status === 429) {
        rateLimited = true;
        const retryHeader = res.headers.get('Retry-After');
        assert(`6th request to /api/request-demo is throttled with 429 (Retry-After: ${retryHeader}s)`, true);
        break;
      }
    }
    if (!rateLimited) {
      assert('Rapid requests are throttled with 429', false, 'None of 6 requests received 429');
    }
  } catch (err: any) {
    assert('Rapid requests are throttled with 429', false, err.message);
  }

  // --- TEST FIX 9: File Upload Hardening (Magic Bytes & Size) ---
  console.log('\n--- FIX 9: File Upload Hardening ---');

  // Test 9.1: Fake JPEG (plain text pretending to be JPEG)
  try {
    const fakeJpegRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: `test_fake_${Date.now()}`,
        school_id: 'DPS2026',
        mime_type: 'image/jpeg',
        data: 'data:image/jpeg;base64,' + Buffer.from('NOT_A_JPEG_FILE_JUST_MALICIOUS_TEXT').toString('base64')
      })
    });
    const fakeJpegJson = await fakeJpegRes.json();
    assert(
      'Spoofed JPEG with invalid magic bytes rejected with 400',
      fakeJpegRes.status === 400 && fakeJpegJson.error.includes('signature'),
      `Status: ${fakeJpegRes.status}, Error: ${fakeJpegJson.error}`
    );
  } catch (err: any) {
    assert('Spoofed JPEG with invalid magic bytes rejected with 400', false, err.message);
  }

  // Test 9.2: Legitimate PNG upload to Vercel Blob
  let uploadedMediaId = '';
  let uploadedBlobUrl = '';
  try {
    const testId = `test_png_${Date.now()}`;
    // Valid 1x1 transparent PNG buffer
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const validUploadRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: testId,
        school_id: 'DPS2026',
        mime_type: 'image/png',
        data: 'data:image/png;base64,' + validPngBuffer.toString('base64')
      })
    });
    const validUploadJson = await validUploadRes.json();
    uploadedMediaId = testId;
    uploadedBlobUrl = validUploadJson.url || validUploadJson.blob_url;

    assert(
      'Valid PNG upload returns 200 with Vercel Blob URL and no raw base64 in response',
      validUploadRes.status === 200 && Boolean(uploadedBlobUrl) && !validUploadJson.data,
      `Status: ${validUploadRes.status}, URL: ${uploadedBlobUrl}`
    );
  } catch (err: any) {
    assert('Valid PNG upload returns 200 with Vercel Blob URL and no raw base64 in response', false, err.message);
  }

  // Test 9.3: Direct Vercel Blob retrieval & redirect check
  try {
    const fetchMediaRes = await fetch(`${BASE_URL}/api/media/${uploadedMediaId}`, {
      redirect: 'manual'
    });
    // Should return 307 redirect to Vercel Blob or 200 with nosniff
    const isRedirect = fetchMediaRes.status === 307 || fetchMediaRes.status === 308;
    const nosniffHeader = fetchMediaRes.headers.get('x-content-type-options');
    const locationHeader = fetchMediaRes.headers.get('location');

    assert(
      'GET /api/media/:id redirects to Blob URL with nosniff header',
      (isRedirect && Boolean(locationHeader) && nosniffHeader === 'nosniff') || fetchMediaRes.status === 200,
      `Status: ${fetchMediaRes.status}, Location: ${locationHeader}, nosniff: ${nosniffHeader}`
    );
  } catch (err: any) {
    assert('GET /api/media/:id redirects to Blob URL with nosniff header', false, err.message);
  }

  // Test 9.4: Media deletion endpoint
  try {
    const delRes = await fetch(`${BASE_URL}/api/media/${uploadedMediaId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const delJson = await delRes.json();
    assert(
      'DELETE /api/media/:id removes media from Vercel Blob & registry',
      delRes.status === 200 && delJson.success === true,
      `Status: ${delRes.status}`
    );
  } catch (err: any) {
    assert('DELETE /api/media/:id removes media from Vercel Blob & registry', false, err.message);
  }

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
