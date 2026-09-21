import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSCODES = new Set(['123456', 'admin@4317', 'password', 'passcode', 'admin123']);

function isAlreadyHashed(str?: string): boolean {
  if (!str) return false;
  return str.startsWith('$2a$') || str.startsWith('$2b$') || str.startsWith('$2y$');
}

async function processInChunks<T>(items: T[], chunkSize: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(fn));
    if (items.length > 50) {
      console.log(`Processed ${Math.min(i + chunkSize, items.length)} / ${items.length}...`);
    }
  }
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;

  console.log('='.repeat(60));
  console.log(`BCRYPT PASSCODE MIGRATION SCRIPT (${isDryRun ? 'DRY-RUN MODE' : 'LIVE APPLICATION MODE'})`);
  console.log(`Bcrypt Work Factor: ${BCRYPT_ROUNDS}`);
  console.log('='.repeat(60));

  if (!uri) {
    console.error('Error: MONGODB_URI not found in environment.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  try {
    // 1. Teachers Collection
    const teachers = await db.collection('teachers').find({}).toArray();
    let teachersToHash = 0;
    let teachersFlaggedMustChange = 0;
    const teacherRoleBreakdown: Record<string, number> = {};

    const teachersToProcess: any[] = [];
    for (const t of teachers) {
      const passcode = (t.passcode || '').trim();
      if (passcode && !isAlreadyHashed(passcode)) {
        teachersToHash++;
        const desig = t.designation || 'TEACHER';
        teacherRoleBreakdown[desig] = (teacherRoleBreakdown[desig] || 0) + 1;
        const isDefault = DEFAULT_PASSCODES.has(passcode);
        if (isDefault) teachersFlaggedMustChange++;
        teachersToProcess.push({ doc: t, passcode, isDefault });
      }
    }

    if (!isDryRun && teachersToProcess.length > 0) {
      console.log(`Hashing ${teachersToProcess.length} teachers...`);
      await processInChunks(teachersToProcess, 10, async ({ doc, passcode, isDefault }) => {
        const hashed = await bcrypt.hash(passcode, BCRYPT_ROUNDS);
        await db.collection('teachers').updateOne(
          { _id: doc._id },
          {
            $set: {
              passcode: hashed,
              must_change_password: isDefault || doc.must_change_password === true,
              updated_at: new Date().toISOString()
            }
          }
        );
      });
    }

    // 2. Students Collection
    const students = await db.collection('students').find({}).toArray();
    let studentsToHash = 0;
    let studentsFlaggedMustChange = 0;
    const studentsToProcess: any[] = [];

    for (const s of students) {
      const passcode = (s.passcode || '').trim();
      if (passcode && !isAlreadyHashed(passcode)) {
        studentsToHash++;
        const isDefault = DEFAULT_PASSCODES.has(passcode);
        if (isDefault) studentsFlaggedMustChange++;
        studentsToProcess.push({ doc: s, passcode, isDefault });
      }
    }

    if (!isDryRun && studentsToProcess.length > 0) {
      console.log(`Hashing ${studentsToProcess.length} students...`);
      await processInChunks(studentsToProcess, 15, async ({ doc, passcode, isDefault }) => {
        const hashed = await bcrypt.hash(passcode, BCRYPT_ROUNDS);
        await db.collection('students').updateOne(
          { _id: doc._id },
          {
            $set: {
              passcode: hashed,
              must_change_password: isDefault || doc.must_change_password === true,
              updated_at: new Date().toISOString()
            }
          }
        );
      });
    }

    // 3. Users Collection
    const users = await db.collection('users').find({}).toArray();
    let usersToHash = 0;
    let usersFlaggedMustChange = 0;
    const userRoleBreakdown: Record<string, number> = {};
    const usersToProcess: any[] = [];

    for (const u of users) {
      const passcode = (u.password || u.passcode || '').trim();
      if (passcode && !isAlreadyHashed(passcode)) {
        usersToHash++;
        const role = u.role || 'USER';
        userRoleBreakdown[role] = (userRoleBreakdown[role] || 0) + 1;
        const isDefault = DEFAULT_PASSCODES.has(passcode);
        if (isDefault) usersFlaggedMustChange++;
        usersToProcess.push({ doc: u, passcode, isDefault });
      }
    }

    if (!isDryRun && usersToProcess.length > 0) {
      console.log(`Hashing ${usersToProcess.length} users...`);
      await processInChunks(usersToProcess, 5, async ({ doc, passcode, isDefault }) => {
        const hashed = await bcrypt.hash(passcode, BCRYPT_ROUNDS);
        await db.collection('users').updateOne(
          { _id: doc._id },
          {
            $set: {
              password: hashed,
              passcode: hashed,
              must_change_password: isDefault || doc.must_change_password === true,
              updated_at: new Date().toISOString()
            }
          }
        );
      });
    }

    // Also update local store if exists
    const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');
    if (!isDryRun && fs.existsSync(localStorePath)) {
      try {
        const raw = fs.readFileSync(localStorePath, 'utf8');
        const store = JSON.parse(raw);
        let storeModified = false;
        if (Array.isArray(store.teachers)) {
          for (const t of store.teachers) {
            if (t.passcode && !isAlreadyHashed(t.passcode)) {
              const isDef = DEFAULT_PASSCODES.has(t.passcode);
              t.passcode = await bcrypt.hash(t.passcode, BCRYPT_ROUNDS);
              t.must_change_password = isDef;
              storeModified = true;
            }
          }
        }
        if (Array.isArray(store.students)) {
          for (const s of store.students) {
            if (s.passcode && !isAlreadyHashed(s.passcode)) {
              const isDef = DEFAULT_PASSCODES.has(s.passcode);
              s.passcode = await bcrypt.hash(s.passcode, BCRYPT_ROUNDS);
              s.must_change_password = isDef;
              storeModified = true;
            }
          }
        }
        if (storeModified) {
          fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
          console.log('Updated local store file data/erp_store.json with bcrypt hashes.');
        }
      } catch (e) {
        console.warn('Local store update warning:', e);
      }
    }

    console.log('\n--- MIGRATION SUMMARY REPORT ---');
    console.log(`Teachers: ${teachersToHash} / ${teachers.length} hashed (Flagged must_change_password: ${teachersFlaggedMustChange})`);
    console.log(`Students: ${studentsToHash} / ${students.length} hashed (Flagged must_change_password: ${studentsFlaggedMustChange})`);
    console.log(`Users: ${usersToHash} / ${users.length} hashed (Flagged must_change_password: ${usersFlaggedMustChange})`);
    console.log('\nResult:');
    if (isDryRun) {
      console.log('DRY-RUN COMPLETED. No changes were committed to MongoDB.');
    } else {
      console.log('LIVE MIGRATION COMPLETED SUCCESSFULLY. All credentials now bcrypt hashed.');
    }
  } finally {
    await client.close();
  }
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
