/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = '';

async function syncFacultyAttendance() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const today = '2026-08-30';
  const schoolId = 'DPS2026';
  const session = '2026-27';

  // 1. Delete all duplicate or conflicting faculty records for today
  const delResult = await db.collection('attendance').deleteMany({
    $or: [
      { class_name: /faculty|staff/i },
      { section: /faculty|staff/i }
    ],
    date: today
  });
  console.log(`Deleted ${delResult.deletedCount} old faculty attendance records for ${today}.`);

  // 2. Build teacher_records array with 38 Present and 2 Absent out of 40 teachers
  const storeFile = 'data/erp_store.json';
  const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  const allTeachers = store.teachers || [];

  const teacherRecords = allTeachers.map((t, idx) => ({
    teacher_id: t.id,
    staff_code: t.staff_code,
    full_name: t.full_name,
    status: idx >= (allTeachers.length - 2) ? 'ABSENT' : 'PRESENT'
  }));

  const cleanFacultyRecord = {
    id: `ATT-FACULTY-${Date.now()}`,
    school_id: schoolId,
    academic_session: session,
    date: today,
    class_name: 'Faculty',
    section: 'Staff',
    total_students: allTeachers.length || 40,
    present_count: (allTeachers.length || 40) - 2,
    absent_count: 2,
    leave_count: 0,
    marked_by: 'Principal Directorate',
    teacher_records: teacherRecords,
    created_at: new Date().toISOString()
  };

  await db.collection('attendance').insertOne({ ...cleanFacultyRecord });
  console.log('Inserted clean faculty attendance record into Atlas:', cleanFacultyRecord.id);

  // 3. Update local store
  if (fs.existsSync(storeFile)) {
    store.attendance = (store.attendance || []).filter(a => {
      const isFac = /faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || '');
      return !(isFac && a.date === today);
    });
    store.attendance.push(cleanFacultyRecord);
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
    console.log('Updated data/erp_store.json with clean faculty record.');
  }

  await client.close();
}

syncFacultyAttendance().catch(console.error);
