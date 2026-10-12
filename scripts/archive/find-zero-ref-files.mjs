import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(getFiles(filePath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs')) {
      results.push(filePath);
    }
  });
  return results;
}

const allSrc = getFiles('src');
const map = {};

for (const file of allSrc) {
  const norm = file.replace(/\\/g, '/');
  map[norm] = 0;
}

for (const file of allSrc) {
  const content = fs.readFileSync(file, 'utf8');
  for (const target of Object.keys(map)) {
    if (target === file.replace(/\\/g, '/')) continue;
    const base = path.parse(target).name;
    if (base === 'index') {
      const parent = path.basename(path.dirname(target));
      if (content.includes('/' + parent) || content.includes("'" + parent) || content.includes('"' + parent)) {
        map[target]++;
      }
    } else {
      if (content.includes(base)) {
        map[target]++;
      }
    }
  }
}

console.log('=== ALL SRC FILES WITH ZERO REFERENCES (Excluding pages/routes/layouts) ===');
for (const [f, count] of Object.entries(map)) {
  if (count === 0 && !f.includes('/page.') && !f.includes('/layout.') && !f.includes('/route.') && !f.includes('/error.') && !f.includes('/not-found.') && !f.includes('/manifest.') && !f.includes('/robots.') && !f.includes('/sitemap.') && !f.includes('globals.css')) {
    const stat = fs.statSync(f);
    console.log(`${f} (${stat.size} bytes)`);
  }
}
