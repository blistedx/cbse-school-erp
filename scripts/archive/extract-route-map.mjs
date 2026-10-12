import fs from 'fs';
import path from 'path';

function getFiles(dir, match) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, match));
    } else if (match(file)) {
      results.push(filePath);
    }
  });
  return results;
}

const apiFiles = getFiles('src/app/api', f => f.startsWith('route.'));
console.log('=== API ROUTES (' + apiFiles.length + ') ===');
for (const f of apiFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].filter(m => {
    return new RegExp('export\\s+(async\\s+)?function\\s+' + m + '\\b').test(content) ||
           new RegExp('export\\s+const\\s+' + m + '\\b').test(content);
  });
  const rel = f.replace(/\\/g, '/').replace(/^src\/app/, '').replace(/\/route\.(ts|js)$/, '');
  console.log(`${rel} [${methods.join(', ')}]`);
}

const pageFiles = getFiles('src/app', f => f.startsWith('page.'));
console.log('\n=== PAGES (' + pageFiles.length + ') ===');
for (const f of pageFiles) {
  const rel = f.replace(/\\/g, '/').replace(/^src\/app/, '').replace(/\/page\.(tsx|jsx|js|ts)$/, '');
  console.log(rel === '' ? '/' : rel);
}
