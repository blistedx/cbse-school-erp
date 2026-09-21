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

// 1. Unused packages
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = Object.keys(pkg.dependencies || {});
const allSrcFiles = getFiles('src');
const allProjectCodeFiles = getFiles('.').filter(f => !f.startsWith('.next') && !f.startsWith('node_modules'));

const allSrcContent = allSrcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const allProjectContent = allProjectCodeFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const unusedDepsSrc = [];
const buildTools = ['autoprefixer', 'postcss', 'tailwindcss', 'typescript', 'next', 'react', 'react-dom', '@netlify/plugin-nextjs', '@types/node', '@types/react', '@types/react-dom', '@types/bcryptjs', '@types/pg', '@types/qrcode', '@types/web-push', '@types/nodemailer'];

for (const dep of deps) {
  if (buildTools.includes(dep)) continue;
  const cleanName = dep.replace('/', '\\/');
  const re = new RegExp(`['"\`]${cleanName}['"\`]|['"\`]${cleanName}/`, 'm');
  if (!re.test(allSrcContent)) {
    unusedDepsSrc.push(dep);
  }
}

console.log('=== PACKAGE USAGE IN SRC/ ===');
console.log('Unused packages in src/:', unusedDepsSrc);

// 2. Scan each file in src/ to see if it is imported anywhere
console.log('\n=== UNUSED FILES IN SRC/ ===');
const unusedFiles = [];
for (const file of allSrcFiles) {
  const normPath = file.replace(/\\/g, '/');
  // Skip Next.js app entrypoints: layout, page, error, not-found, manifest, robots, sitemap, route
  if (
    normPath.includes('/page.') ||
    normPath.includes('/layout.') ||
    normPath.includes('/route.') ||
    normPath.includes('/error.') ||
    normPath.includes('/not-found.') ||
    normPath.includes('/manifest.') ||
    normPath.includes('/robots.') ||
    normPath.includes('/sitemap.') ||
    normPath.includes('src/app/globals.css')
  ) {
    continue;
  }

  // File basename without extension
  const parsed = path.parse(normPath);
  const baseNameNoExt = parsed.name;
  
  // Search for references in other files
  let refCount = 0;
  for (const otherFile of allSrcFiles) {
    if (otherFile.replace(/\\/g, '/') === normPath) continue;
    const content = fs.readFileSync(otherFile, 'utf8');
    if (content.includes(baseNameNoExt)) {
      refCount++;
    }
  }

  if (refCount === 0) {
    const stat = fs.statSync(file);
    unusedFiles.push({ file: normPath, sizeBytes: stat.size });
  }
}

console.log(`Found ${unusedFiles.length} potentially unused files in src/:`);
unusedFiles.forEach(u => console.log(`- ${u.file} (${u.sizeBytes} bytes)`));

// 3. Scan root folders (models, lib, legacy_html, scratch)
console.log('\n=== ROOT FOLDERS SCAN ===');
const rootDirs = ['models', 'lib', 'legacy_html', 'scratch', 'test'];
for (const rd of rootDirs) {
  if (fs.existsSync(rd)) {
    const files = getFiles(rd, ['.ts', '.tsx', '.js', '.jsx', '.html', '.sql', '.json', '.mjs']);
    console.log(`Folder "${rd}": ${files.length} files`);
  }
}

// 4. Scan .env variables vs usage
console.log('\n=== ENV VARIABLES USAGE ===');
const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const envKeys = envContent.split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#') && l.includes('='))
  .map(l => l.split('=')[0].trim());

const unusedEnv = [];
for (const k of envKeys) {
  const re = new RegExp(`process\\.env\\.${k}|process\\.env\\[['"\`]${k}['"\`]\\]`, 'm');
  if (!re.test(allProjectContent)) {
    unusedEnv.push(k);
  }
}
console.log('Configured env vars in .env:', envKeys);
console.log('Unused env vars in code:', unusedEnv);
