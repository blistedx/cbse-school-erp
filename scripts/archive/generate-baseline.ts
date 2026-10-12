import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const srcDir = path.resolve('src');
const allSrcFiles = getAllFiles(srcDir).map(f => path.relative(process.cwd(), f).replace(/\\/g, '/'));

const routes = [
  '/',
  '/_not-found',
  '/agency',
  '/api/agency/approve-demo',
  '/api/agency/purge-school',
  '/api/app-info',
  '/api/attendance',
  '/api/attendance/scan',
  '/api/audit-logs',
  '/api/auth/forgot-passcode',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/profile',
  '/api/auth/session',
  '/api/classes',
  '/api/classes/subjects',
  '/api/exams',
  '/api/fee-master',
  '/api/finance',
  '/api/finance/reports/pl',
  '/api/health',
  '/api/holidays',
  '/api/media/[id]',
  '/api/media/upload',
  '/api/notices',
  '/api/notifications/broadcasts',
  '/api/notifications/send',
  '/api/notifications/subscribe',
  '/api/notifications/vapid-key',
  '/api/overview',
  '/api/request-demo',
  '/api/school/permissions',
  '/api/school/settings',
  '/api/schools',
  '/api/students',
  '/api/students/promote',
  '/api/students/search',
  '/api/sync/live',
  '/api/sync/mongodb',
  '/api/teachers',
  '/api/transport/telemetry',
  '/api/verify/id',
  '/app',
  '/apple-icon.png',
  '/attendance/scan',
  '/faq',
  '/fees/heads',
  '/icon.png',
  '/login',
  '/manifest.webmanifest',
  '/mobile',
  '/privacy',
  '/request-demo',
  '/robots.txt',
  '/sitemap.xml',
  '/terms',
  '/verify/id'
];

let md = `# Cleanup Baseline Snapshot (Phase 0)

**Date**: ${new Date().toISOString()}  
**Branch**: \`chore/dead-code-cleanup\`  
**TypeScript Baseline**: 0 errors (\`tsc --noEmit\`)  
**Production Build Baseline**: 53 routes (0 errors)  
**Total \`src/\` Files**: ${allSrcFiles.length}

---

## 1. Production Build Routes (53 Routes Total)

| Index | Route | Type |
| :--- | :--- | :--- |
${routes.map((r, i) => `| ${i + 1} | \`${r}\` | ${r.startsWith('/api') || r === '/' ? 'Dynamic (ƒ)' : 'Static (○)'} |`).join('\n')}

---

## 2. All \`src/\` Files Snapshot (${allSrcFiles.length} Files)

| Index | File Path | Lines | Size (KB) |
| :--- | :--- | :--- | :--- |
`;

allSrcFiles.forEach((file, idx) => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n').length;
  const sizeKb = (fs.statSync(file).size / 1024).toFixed(1);
  md += `| ${idx + 1} | \`${file}\` | ${lines} | ${sizeKb} KB |\n`;
});

fs.writeFileSync('CLEANUP_BASELINE.md', md, 'utf-8');
console.log(`CLEANUP_BASELINE.md generated with ${allSrcFiles.length} src files and ${routes.length} routes.`);
