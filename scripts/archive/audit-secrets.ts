import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  } catch (e: any) {
    return e.stdout || '';
  }
}

function mask(val: string): string {
  const clean = val.replace(/^["']|["']$/g, '').trim();
  if (clean.length <= 4) return '****';
  return clean.slice(0, 2) + '****' + clean.slice(-2);
}

function auditSecrets() {
  console.log('='.repeat(60));
  console.log('SECRETS AUDIT (REPO FILES & GIT COMMIT HISTORY)');
  console.log('='.repeat(60));

  const gitDiff = run('git log -p -n 100');
  const secretPatterns: Array<{ name: string; regex: RegExp }> = [
    { name: 'MongoDB Atlas URI', regex: /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi },
    { name: 'Session Secret', regex: /SESSION_SECRET\s*[:=]\s*["']?([^"'\r\n\s]+)["']?/gi },
    { name: 'SMTP Password', regex: /SMTP_PASS(?:WORD)?\s*[:=]\s*["']?([^"'\r\n\s]+)["']?/gi },
    { name: 'Brevo API Key', regex: /(?:BREVO_API_KEY|SIB_API_KEY)\s*[:=]\s*["']?([^"'\r\n\s]+)["']?/gi },
    { name: 'Vercel Blob Token', regex: /BLOB_READ_WRITE_TOKEN\s*[:=]\s*["']?([^"'\r\n\s]+)["']?/gi },
    { name: 'Agency Superadmin Password', regex: /AGENCY_SUPERADMIN_PASSWORD(?:_HASH)?\s*[:=]\s*["']?([^"'\r\n\s]+)["']?/gi },
    { name: 'JWT / API Secret', regex: /(?:JWT_SECRET|API_SECRET)\s*[:=]\s*["']?([^"'\r\n\s]+)["']?/gi }
  ];

  const secretsToRotate: Array<{ name: string; foundIn: string; maskedSample: string }> = [];

  for (const item of secretPatterns) {
    let match;
    while ((match = item.regex.exec(gitDiff)) !== null) {
      const full = match[0];
      if (full.includes('process.env.') || full.includes('export ') || full.includes('interface ')) continue;
      let maskedVal = '';
      if (item.name === 'MongoDB Atlas URI') {
        maskedVal = full.replace(/:\/\/[^:]+:[^@]+@/, '://[MASKED_USER]:[MASKED_PASSWORD]@');
      } else {
        const val = match[1] || full.split(/[=:]/)[1] || '';
        maskedVal = mask(val);
      }
      if (!secretsToRotate.some(s => s.name === item.name && s.maskedSample === maskedVal)) {
        secretsToRotate.push({
          name: item.name,
          foundIn: 'Git Commit History / Diffs',
          maskedSample: maskedVal
        });
      }
    }
  }

  // Also check local .env / .env.local if present
  for (const envFile of ['.env', '.env.local']) {
    const p = path.join(process.cwd(), envFile);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const item of secretPatterns) {
        let match;
        while ((match = item.regex.exec(content)) !== null) {
          const val = match[1] || match[0].split(/[=:]/)[1] || '';
          const maskedVal = item.name === 'MongoDB Atlas URI'
            ? match[0].replace(/:\/\/[^:]+:[^@]+@/, '://[MASKED_USER]:[MASKED_PASSWORD]@')
            : mask(val);
          if (!secretsToRotate.some(s => s.name === item.name && s.maskedSample === maskedVal)) {
            secretsToRotate.push({
              name: item.name,
              foundIn: `${envFile} (Local Environment)`,
              maskedSample: maskedVal
            });
          }
        }
      }
    }
  }

  console.log(`\nIdentified ${secretsToRotate.length} secret keys/credentials requiring rotation:\n`);
  for (const s of secretsToRotate) {
    console.log(`- [${s.name}]: ${s.maskedSample} (Found in: ${s.foundIn})`);
  }
}

auditSecrets();
