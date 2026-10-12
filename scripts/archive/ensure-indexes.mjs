import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error('MONGODB_URI is not set in environment.');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || 'edugit');
  console.log('Connected to MongoDB. Creating compound indexes...');

  const safeCreateIndex = async (col, spec, options = {}) => {
    try {
      await col.createIndex(spec, options);
    } catch (e) {
      if (e.code === 85 || e.codeName === 'IndexOptionsConflict') {
        // Index with same keys already exists
      } else {
        console.warn(`Index note on ${col.collectionName}:`, e.message);
      }
    }
  };

  // 1. fee_ledger indexes
  const feeLedger = db.collection('fee_ledger');
  await safeCreateIndex(feeLedger, { school_id: 1, academic_session: 1, is_cancelled: 1 });
  await safeCreateIndex(feeLedger, { school_id: 1, student_id: 1, is_cancelled: 1 });
  await safeCreateIndex(feeLedger, { school_id: 1, receipt_no: 1 });
  await safeCreateIndex(feeLedger, { school_id: 1, month: 1, line_type: 1 });
  console.log('✓ fee_ledger indexes verified');

  // 2. fee_receipts indexes
  const feeReceipts = db.collection('fee_receipts');
  await safeCreateIndex(feeReceipts, { school_id: 1, academic_session: 1, is_cancelled: 1 });
  await safeCreateIndex(feeReceipts, { school_id: 1, student_id: 1, academic_session: 1 });
  await safeCreateIndex(feeReceipts, { school_id: 1, receipt_no: 1 });
  await safeCreateIndex(feeReceipts, { school_id: 1, payment_date: -1 });
  console.log('✓ fee_receipts indexes verified');

  // 3. students indexes
  const students = db.collection('students');
  await safeCreateIndex(students, { school_id: 1, academic_session: 1, status: 1 });
  await safeCreateIndex(students, { school_id: 1, id: 1 });
  await safeCreateIndex(students, { school_id: 1, admission_no: 1 });
  await safeCreateIndex(students, { school_id: 1, class_name: 1, section: 1 });
  console.log('✓ students indexes verified');

  // 4. attendance indexes
  const attendance = db.collection('attendance');
  await safeCreateIndex(attendance, { school_id: 1, academic_session: 1, date: 1 });
  await safeCreateIndex(attendance, { school_id: 1, date: 1, class_name: 1, section: 1 });
  console.log('✓ attendance indexes verified');

  // 5. teachers indexes
  const teachers = db.collection('teachers');
  await safeCreateIndex(teachers, { school_id: 1, status: 1 });
  console.log('✓ teachers indexes verified');

  // 6. classes indexes
  const classes = db.collection('classes');
  await safeCreateIndex(classes, { school_id: 1, academic_session: 1 });
  console.log('✓ classes indexes verified');

  // 7. notices indexes
  const notices = db.collection('notices');
  await safeCreateIndex(notices, { school_id: 1, academic_session: 1, date: -1 });
  console.log('✓ notices indexes verified');

  // 8. school_stats indexes
  const schoolStats = db.collection('school_stats');
  await safeCreateIndex(schoolStats, { school_id: 1, session: 1 }, { unique: true });
  console.log('✓ school_stats indexes verified');

  await client.close();
  console.log('All compound indexes ensured successfully.');
}

run().catch(console.error);
