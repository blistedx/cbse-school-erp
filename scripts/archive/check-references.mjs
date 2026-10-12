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

const allFiles = getFiles('.');
console.log('Total source files found:', allFiles.length);

const rootModelsRefs = [];
const rootLibRefs = [];
const cockroachRefs = [];
const legacyHtmlRefs = [];
const scratchRefs = [];

for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('../models') || content.includes('../../models') || content.includes('@/../models') || content.includes("'models/") || content.includes('"models/')) {
    rootModelsRefs.push(f);
  }
  if (content.includes('lib/db.js') || content.includes('lib/schema.sql')) {
    rootLibRefs.push(f);
  }
  if (content.toLowerCase().includes('cockroach')) {
    cockroachRefs.push(f);
  }
  if (content.includes('legacy_html')) {
    legacyHtmlRefs.push(f);
  }
  if (content.includes('scratch/')) {
    scratchRefs.push(f);
  }
}

console.log('Root models refs:', rootModelsRefs);
console.log('Root lib refs:', rootLibRefs);
console.log('Cockroach refs in src/:', cockroachRefs.filter(f => f.startsWith('src')));
console.log('Legacy HTML refs:', legacyHtmlRefs);
console.log('Scratch refs:', scratchRefs);
