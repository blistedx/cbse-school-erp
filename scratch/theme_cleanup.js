const fs = require('fs');

const filePath = 'src/app/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/text-blue-600/g, 'text-[var(--board-2)]');
content = content.replace(/hover:text-blue-600/g, 'hover:text-[var(--red-pen)]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned remaining blue color references in app/page.tsx');
