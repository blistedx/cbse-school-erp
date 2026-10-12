const fs = require('fs');

function searchDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = dir + '/' + f.name;
    if (f.isDirectory()) {
      if (f.name !== 'node_modules' && f.name !== '.next') searchDir(full);
    } else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
      const c = fs.readFileSync(full, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, i) => {
        const upper = l.toUpperCase();
        if (upper.includes("=== 'PRINCIPAL'") || upper.includes('=== "PRINCIPAL"') || upper.includes("== 'PRINCIPAL'") || upper.includes('ADMIN_ROLES') || upper.includes('STAFF_ROLES')) {
          console.log(full + ':' + (i + 1) + ': ' + l.trim());
        }
      });
    }
  }
}

searchDir('src');
