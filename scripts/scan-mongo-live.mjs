import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('No MONGODB_URI found!');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri, { tlsAllowInvalidCertificates: true });
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas successfully.');
    const db = client.db('edugit');

    const collections = await db.listCollections().toArray();
    console.log(`\n=== COLLECTIONS FOUND (${collections.length}) ===`);

    const colStats = [];
    for (const col of collections) {
      const name = col.name;
      const c = db.collection(name);
      const count = await c.countDocuments();
      const indexes = await c.indexes();
      colStats.push({ name, count, indexes: indexes.map(idx => ({ name: idx.name, key: idx.key, unique: !!idx.unique })) });
    }

    for (const s of colStats) {
      console.log(`- Collection: "${s.name}" | Docs: ${s.count} | Indexes: ${s.indexes.length} (${s.indexes.map(i => i.name).join(', ')})`);
    }

    // Check orphan queries
    console.log('\n=== ORPHAN & INTEGRITY SCANS ===');
    
    // 1. Schools
    const schoolsCol = db.collection('schools');
    const schools = await schoolsCol.find({}).toArray();
    const schoolCodes = schools.map(s => s.school_code || s.id || s._id.toString());
    console.log(`Active schools in DB (${schools.length}):`, schoolCodes);

    // 2. Students without valid school
    const studentsCol = db.collection('students');
    const orphanStudents = await studentsCol.find({
      $or: [
        { school_id: { $exists: false } },
        { school_id: { $nin: schoolCodes } }
      ]
    }).toArray();
    console.log(`Orphan students (no/invalid school): ${orphanStudents.length}`);

    // Get all valid student IDs
    const allStudents = await studentsCol.find({}, { projection: { id: 1, student_id: 1, admission_number: 1, school_id: 1 } }).toArray();
    const studentIds = new Set(allStudents.map(s => s.id || s.student_id || s._id.toString()));

    // 3. Fee Invoices / Payments without student
    const feeInvoicesCol = db.collection('fee_invoices');
    const feeInvoiceCount = await feeInvoicesCol.countDocuments();
    let orphanInvoices = 0;
    if (feeInvoiceCount > 0) {
      const invoices = await feeInvoicesCol.find({}, { projection: { student_id: 1, student_admission_no: 1 } }).toArray();
      orphanInvoices = invoices.filter(inv => !studentIds.has(inv.student_id) && !studentIds.has(inv.student_admission_no)).length;
    }
    console.log(`Fee Invoices count: ${feeInvoiceCount}, Orphan Fee Invoices: ${orphanInvoices}`);

    // 4. Attendance for deleted students
    const attendanceCol = db.collection('attendance');
    const attendanceCount = await attendanceCol.countDocuments();
    console.log(`Attendance records count: ${attendanceCount}`);

    // 5. Stale sessions / tokens
    const sessionsCol = db.collection('sessions');
    if (await sessionsCol.countDocuments() > 0) {
      const sessCount = await sessionsCol.countDocuments();
      console.log(`Sessions count: ${sessCount}`);
    }

    // 6. Check for duplicate indexes or empty collections
    const emptyCollections = colStats.filter(c => c.count === 0).map(c => c.name);
    console.log(`\nEmpty collections (${emptyCollections.length}):`, emptyCollections);

    fs.writeFileSync('scripts/mongo-scan-results.json', JSON.stringify({
      collections: colStats,
      emptyCollections,
      orphanStudentsCount: orphanStudents.length,
      orphanInvoicesCount: orphanInvoices
    }, null, 2));

  } catch (err) {
    console.error('Mongo scan error:', err);
  } finally {
    await client.close();
  }
}

run();
