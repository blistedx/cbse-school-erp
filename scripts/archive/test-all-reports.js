const crypto = require('crypto');
require('dotenv').config();

function createToken(userId, schoolId, role) {
  const secret = (process.env.SESSION_SECRET || '').replace(/^["']|["']$/g, '').trim();
  const iat = Date.now();
  const exp = iat + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, schoolId, role, iat, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

async function run() {
  const token = createToken('TCH-PRIN-DPS2026', 'DPS2026', 'PRINCIPAL');

  const endpoints = [
    '/api/fee-master?action=overview&session=2026-27&school_id=DPS2026',
    '/api/fee-master?action=config&session=2026-27&school_id=DPS2026',
    '/api/fee-master?action=report&report_id=month_class_collection&session=2026-27&school_id=DPS2026&month=SEP',
    '/api/fee-master?action=report&report_id=pending_fees_list&session=2026-27&school_id=DPS2026',
    '/api/fee-master?action=student_ledger_view&student_id=STU-DPS-0001&session=2026-27&school_id=DPS2026'
  ];

  for (const ep of endpoints) {
    const start = Date.now();
    const res = await fetch(`http://localhost:3000${ep}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const duration = Date.now() - start;
    const json = await res.json();
    console.log(`✅ ${ep.split('?')[1].slice(0, 45)} -> Status: ${res.status} (${duration}ms), Success: ${json.success}`);
  }
}

run().catch(console.error);
