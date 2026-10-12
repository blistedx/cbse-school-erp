import fs from 'fs';
import path from 'path';

function getFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(getFiles(filePath, exts));
      }
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  return results;
}

// 1. Gather all API routes
const apiFiles = getFiles('src/app/api');
const apiRouteMap = {};

for (const f of apiFiles) {
  if (!f.includes('route.')) continue;
  const content = fs.readFileSync(f, 'utf8');
  const rel = f.replace(/\\/g, '/').replace(/^src\/app/, '').replace(/\/route\.(ts|js)$/, '');
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].filter(m => {
    return new RegExp('export\\s+(async\\s+)?function\\s+' + m + '\\b').test(content) ||
           new RegExp('export\\s+const\\s+' + m + '\\b').test(content);
  });
  apiRouteMap[rel] = {
    file: f.replace(/\\/g, '/'),
    methods,
    content,
    callers: []
  };
}

// 2. Gather all Pages
const pageFiles = getFiles('src/app');
const pageRouteMap = {};
for (const f of pageFiles) {
  if (!f.includes('page.')) continue;
  const rel = f.replace(/\\/g, '/').replace(/^src\/app/, '').replace(/\/page\.(tsx|jsx|js|ts)$/, '');
  const cleanRoute = rel === '' ? '/' : rel.replace(/\/\([^)]+\)/g, ''); // strip route groups e.g. (dashboard)
  pageRouteMap[cleanRoute] = {
    file: f.replace(/\\/g, '/'),
    rawRoute: rel === '' ? '/' : rel,
    callers: []
  };
}

// 3. Scan all source files for API calls and Links
const allSrcFiles = getFiles('src');

const brokenLinks = [];
const brokenApiCalls = [];

const allHrefs = [];
const allFetches = [];

for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = file.replace(/\\/g, '/');

  // Match (fetch|apiFetch)\s*\(...
  const fetchBlockRegex = /(?:apiFetch|fetch)\s*\(\s*([`'"][^`'"]+[`'"]|`[^`]+`|\w+)(?:\s*,\s*(\{[\s\S]*?\}))?\s*\)/g;
  let fMatch;
  while ((fMatch = fetchBlockRegex.exec(content)) !== null) {
    const rawUrl = fMatch[1];
    const rawOptions = fMatch[2] || '';
    
    // Extract method
    let method = 'GET';
    const methodMatch = rawOptions.match(/method\s*:\s*['"](GET|POST|PUT|DELETE|PATCH)['"]/i);
    if (methodMatch) {
      method = methodMatch[1].toUpperCase();
    }
    allFetches.push({ file: relFile, rawUrl, method, optionsSnippet: rawOptions.slice(0, 100) });
  }

  // Find hrefs in JSX: href="..." or href={`...`}
  const hrefRegex = /href\s*=\s*(?:\{?['"`]([^'"`]+)['"`]\}?)/g;
  let hMatch;
  while ((hMatch = hrefRegex.exec(content)) !== null) {
    allHrefs.push({ file: relFile, href: hMatch[1], type: 'href' });
  }

  // router.push
  const routerPushRegex = /router\.push\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let rMatch;
  while ((rMatch = routerPushRegex.exec(content)) !== null) {
    allHrefs.push({ file: relFile, href: rMatch[1], type: 'router.push' });
  }
}

const knownApiRoutes = Object.keys(apiRouteMap).sort((a, b) => b.length - a.length);

for (const fetchItem of allFetches) {
  let urlClean = fetchItem.rawUrl.replace(/['"`]/g, '').split('?')[0];
  if (urlClean.startsWith('/api')) {
    let matched = null;
    for (const r of knownApiRoutes) {
      const routePattern = new RegExp('^' + r.replace(/\[\w+\]/g, '[^/]+') + '$');
      const testUrl = urlClean.replace(/\$\{[^}]+\}/g, 'PLACEHOLDER');
      if (routePattern.test(testUrl) || urlClean.startsWith(r)) {
        matched = r;
        break;
      }
    }
    if (matched) {
      apiRouteMap[matched].callers.push({
        file: fetchItem.file,
        method: fetchItem.method
      });
      if (!apiRouteMap[matched].methods.includes(fetchItem.method)) {
        brokenApiCalls.push({
          caller: fetchItem.file,
          url: urlClean,
          method: fetchItem.method,
          reason: `Method ${fetchItem.method} not supported by route ${matched} (supports: ${apiRouteMap[matched].methods.join(', ')})`
        });
      }
    } else {
      brokenApiCalls.push({
        caller: fetchItem.file,
        url: urlClean,
        method: fetchItem.method,
        reason: `API Route not found in src/app/api/`
      });
    }
  }
}

const knownPageRoutes = Object.keys(pageRouteMap);
const publicFiles = getFiles('public').map(f => f.replace(/\\/g, '/').replace(/^public/, ''));

for (const linkItem of allHrefs) {
  let href = linkItem.href.split('?')[0].split('#')[0];
  if (!href.startsWith('/') || href.startsWith('//')) {
    continue;
  }
  if (href.startsWith('/api')) {
    continue;
  }

  let matched = null;
  for (const pr of knownPageRoutes) {
    const pagePattern = new RegExp('^' + pr.replace(/\[\w+\]/g, '[^/]+') + '$');
    const testHref = href.replace(/\$\{[^}]+\}/g, 'PLACEHOLDER');
    if (pagePattern.test(testHref) || testHref === pr) {
      matched = pr;
      break;
    }
  }

  if (!matched && !publicFiles.includes(href) && href !== '/favicon.ico' && href !== '/manifest.json' && href !== '/robots.txt' && href !== '/sitemap.xml') {
    brokenLinks.push({
      caller: linkItem.file,
      href: linkItem.href,
      type: linkItem.type,
      reason: `Target route "${href}" does not exist in app pages or public static assets`
    });
  }
}

console.log('=== API ROUTES SUMMARY ===');
for (const [route, data] of Object.entries(apiRouteMap)) {
  const callerFiles = Array.from(new Set(data.callers.map(c => `${c.file} [${c.method}]`)));
  console.log(`${route} [${data.methods.join(', ')}] -> ${callerFiles.length} callers`);
  callerFiles.forEach(cf => console.log(`   └─ ${cf}`));
}

console.log('\n=== BROKEN API CALLS (' + brokenApiCalls.length + ') ===');
console.log(JSON.stringify(brokenApiCalls, null, 2));

console.log('\n=== BROKEN LINKS (' + brokenLinks.length + ') ===');
console.log(JSON.stringify(brokenLinks, null, 2));
