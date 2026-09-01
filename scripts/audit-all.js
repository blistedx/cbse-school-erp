const http = require('http');

const endpoints = [
  '/api/schools',
  '/api/students?school_id=DPS2026&session=2026-27',
  '/api/teachers?school_id=DPS2026&session=2026-27',
  '/api/classes?school_id=DPS2026&session=2026-27',
  '/api/attendance?school_id=DPS2026&session=2026-27',
  '/api/fees?school_id=DPS2026&session=2026-27',
  '/api/notifications/vapid-key',
  '/api/notifications/broadcasts',
  '/api/holidays',
  '/api/overview?school_id=DPS2026&session=2026-27',
  '/app'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:3000' + path, (res) => {
      resolve({ path, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log('--- STARTING ERP HEALTH AUDIT ---');
  for (const ep of endpoints) {
    const result = await checkUrl(ep);
    if (result.status === 200) {
      console.log(`[PASS 200] ${result.path}`);
    } else {
      console.log(`[STATUS ${result.status}] ${result.path}`);
    }
  }
  console.log('--- AUDIT COMPLETED ---');
}

run();
