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

async function testHttp() {
  const token = createToken('TCH-PRIN-DPS2026', 'DPS2026', 'PRINCIPAL');
  console.log('Generated token length:', token.length);

  const start = Date.now();
  const res = await fetch('http://localhost:3000/api/fee-master?action=overview&session=2026-27&school_id=DPS2026', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const duration = Date.now() - start;
  console.log('HTTP Status:', res.status, 'Duration:', duration, 'ms');
  const json = await res.json();
  console.log('Response summary:', {
    success: json.success,
    totalBilledPaise: json.overview?.totalBilledPaise,
    totalCollectedPaise: json.overview?.totalCollectedPaise,
    totalPendingPaise: json.overview?.totalPendingPaise,
    thisMonthCount: json.overview?.thisMonthBreakdown?.length,
    topPendingCount: json.overview?.topPending?.length,
  });
}

testHttp().catch(console.error);
