/**
 * migrate-passwords.js
 * One-time migration script to hash all plain-text passwords and PINs in data/erp_store.json
 * using bcryptjs (cost factor 10).
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
const backupPath = path.join(__dirname, '..', 'data', 'erp_store.json.bak');

if (!fs.existsSync(storePath)) {
  console.error(`Store file not found at: ${storePath}`);
  process.exit(1);
}

// 1. Create a safe backup before modifying
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(storePath, backupPath);
  console.log(`[BACKUP] Created backup at ${backupPath}`);
} else {
  console.log(`[BACKUP] Existing backup preserved at ${backupPath}`);
}

const raw = fs.readFileSync(storePath, 'utf8');
const store = JSON.parse(raw);

let schoolsMigrated = 0;
let teachersMigrated = 0;
let studentsMigrated = 0;

function isBcryptHash(str) {
  return typeof str === 'string' && (str.startsWith('$2a$') || str.startsWith('$2b$'));
}

// 2. Migrate Schools (admin_pin)
if (Array.isArray(store.schools)) {
  store.schools.forEach(school => {
    if (school.admin_pin && typeof school.admin_pin === 'string') {
      const pin = school.admin_pin.trim();
      if (pin && !isBcryptHash(pin)) {
        school.admin_pin = bcrypt.hashSync(pin, 10);
        schoolsMigrated++;
      }
    }
  });
}

// 3. Migrate Teachers (passcode)
if (Array.isArray(store.teachers)) {
  store.teachers.forEach(teacher => {
    if (teacher.passcode && typeof teacher.passcode === 'string') {
      const pass = teacher.passcode.trim();
      if (pass && !isBcryptHash(pass)) {
        teacher.passcode = bcrypt.hashSync(pass, 10);
        teachersMigrated++;
      }
    }
  });
}

// 4. Migrate Students (passcode)
if (Array.isArray(store.students)) {
  store.students.forEach(student => {
    if (student.passcode && typeof student.passcode === 'string') {
      const pass = student.passcode.trim();
      if (pass && !isBcryptHash(pass)) {
        student.passcode = bcrypt.hashSync(pass, 10);
        studentsMigrated++;
      }
    }
  });
}

// 5. Write updated store
fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');

console.log('====================================================');
console.log('PASSWORD & PIN MIGRATION COMPLETE');
console.log(`- Schools admin PINs hashed: ${schoolsMigrated}`);
console.log(`- Teachers passcodes hashed: ${teachersMigrated}`);
console.log(`- Students passcodes hashed: ${studentsMigrated}`);
console.log('All passwords in data/erp_store.json are now securely hashed with bcrypt.');
console.log('====================================================');
