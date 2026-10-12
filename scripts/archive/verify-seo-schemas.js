/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
async function testSchemas() {
  const routes = ['/', '/privacy', '/terms', '/faq', '/request-demo', '/login'];
  let passed = 0;

  for (const route of routes) {
    const url = `http://localhost:3000${route}`;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const regex = /<script type="application\/ld\+json">(.*?)<\/script>/gs;
      let match;
      let found = 0;

      while ((match = regex.exec(html)) !== null) {
        found++;
        const parsed = JSON.parse(match[1]);
        const types = Array.isArray(parsed)
          ? parsed.map(p => p['@type']).join(', ')
          : parsed['@type'];
        console.log(`[PASS] ${route} -> JSON-LD (${types})`);
      }

      if (found > 0) {
        passed++;
      } else {
        console.warn(`[WARN] ${route} has no JSON-LD`);
      }
    } catch (err) {
      console.error(`[FAIL] ${route}:`, err.message);
    }
  }

  console.log(`\nVerified ${passed}/${routes.length} routes with valid JSON-LD schemas.`);
}

testSchemas();
