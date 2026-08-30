const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

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

  // 2. Insert single clean faculty attendance record for today (38 Present / 2 Absent out of 40)
  const cleanFacultyRecord = {
    id: `ATT-FACULTY-${Date.now()}`,
    school_id: schoolId,
    academic_session: session,
    date: today,
    class_name: 'Faculty',
    section: 'Staff',
    total_students: 40,
    present_count: 38,
    absent_count: 2,
    marked_by: 'Principal Directorate',
    created_at: new Date().toISOString()
  };

  await db.collection('attendance').insertOne({ ...cleanFacultyRecord });
  console.log('Inserted clean faculty attendance record into Atlas:', cleanFacultyRecord);

  // 3. Update local store
  const storeFile = 'data/erp_store.json';
  if (fs.existsSync(storeFile)) {
    const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
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
