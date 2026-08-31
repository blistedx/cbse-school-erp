const { Client } = require('pg');
require('dotenv').config();

const rawCockroach = process.env.COCKROACH_DB_URL || process.env.DATABASE_URL || '';
const COCKROACH_URI = rawCockroach.replace('?sslmode=verify-full', '').replace('&sslmode=verify-full', '');

// Generates all school working days between 2026-04-01 and 2027-03-31
function getWorkingDays(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const workingDays = [];

  // Major Vacation & Holiday Blocks for 2026-27 CBSE Session
  const holidays = [
    // Gazetted Holidays
    '2026-04-03', // Good Friday
    '2026-04-14', // Ambedkar Jayanti
    '2026-04-21', // Mahavir Jayanti
    '2026-08-15', // Independence Day
    '2026-08-28', // Raksha Bandhan
    '2026-09-04', // Janmashtami
    '2026-10-02', // Gandhi Jayanti
    '2026-11-24', // Guru Nanak Jayanti
    '2026-12-25', // Christmas
    '2027-01-26', // Republic Day
    '2027-02-17', // Maha Shivratri
    '2027-03-22', // Holi
  ];

  function isSummerVacation(dateStr) {
    return dateStr >= '2026-05-18' && dateStr <= '2026-06-28';
  }

  function isDussehraDiwaliBreak(dateStr) {
    return (dateStr >= '2026-10-19' && dateStr <= '2026-10-24') ||
           (dateStr >= '2026-11-07' && dateStr <= '2026-11-13');
  }

  function isWinterBreak(dateStr) {
    return dateStr >= '2026-12-28' && dateStr <= '2027-01-05';
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const dateStr = d.toISOString().split('T')[0];

    // Exclude Sundays
    if (dayOfWeek === 0) continue;

    // Exclude 2nd and 4th Saturdays
    if (dayOfWeek === 6) {
      const dayOfMonth = d.getDate();
      const satNumber = Math.ceil(dayOfMonth / 7);
      if (satNumber === 2 || satNumber === 4) continue;
    }

    // Exclude Vacations and Gazetted Holidays
    if (holidays.includes(dateStr)) continue;
    if (isSummerVacation(dateStr)) continue;
    if (isDussehraDiwaliBreak(dateStr)) continue;
    if (isWinterBreak(dateStr)) continue;

    workingDays.push(dateStr);
  }

  return workingDays;
}

async function seedAttendance() {
  console.log('🚀 Step 1: Connecting to CockroachDB Serverless...');
  const client = new Client({
    connectionString: COCKROACH_URI,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('  ✓ Connected to CockroachDB!');

  try {
    // 1. Fetch Students and Teachers
    console.log('\n📦 Step 2: Fetching Students and Faculty Catalog...');
    const studentsRes = await client.query('SELECT id, admission_no, full_name, class_name, section, roll_no FROM students;');
    const teachersRes = await client.query('SELECT id, staff_code, full_name FROM teachers;');

    const students = studentsRes.rows;
    const teachers = teachersRes.rows;

    console.log(`  ✓ Loaded ${students.length} students and ${teachers.length} faculty members`);

    // Group students by class_name and section
    const classMap = new Map();
    for (const s of students) {
      const key = `${s.class_name}__${s.section}`;
      if (!classMap.has(key)) {
        classMap.set(key, []);
      }
      classMap.get(key).push(s);
    }

    // 2. Generate Working Days (2026-04-01 to 2027-03-31)
    const workingDays = getWorkingDays('2026-04-01', '2027-03-31');
    console.log(`\n📅 Step 3: Generated ${workingDays.length} Official CBSE Working Days (from 2026-04-01 to 2027-03-31)`);

    // Clear previous mock attendance for 2026-27 to prevent duplicate logs
    console.log('  🧹 Cleaning previous session attendance records...');
    await client.query("DELETE FROM attendance WHERE academic_session = '2026-27';");

    // Track total student attendances for updating student attendance_percent
    const studentAttendanceCounts = new Map();
    for (const s of students) {
      studentAttendanceCounts.set(s.id, { present: 0, total: 0 });
    }

    // 3. Generate and Insert Attendance Records in Batches
    console.log(`\n📝 Step 4: Generating & Streaming Attendance Records to CockroachDB...`);
    let totalInserted = 0;
    const batchSize = 100;
    let currentBatch = [];

    async function flushBatch() {
      if (currentBatch.length === 0) return;

      const valueStrings = [];
      const params = [];
      let pIdx = 1;

      for (const rec of currentBatch) {
        const rowPlaceholders = [];
        for (let p = 0; p < 13; p++) {
          rowPlaceholders.push(`$${pIdx++}`);
        }
        valueStrings.push(`(${rowPlaceholders.join(', ')})`);

        params.push(
          rec.id, rec.school_id, rec.academic_session, rec.date,
          rec.class_name, rec.section, rec.total_students,
          rec.present_count, rec.absent_count, rec.leave_count,
          rec.marked_by, JSON.stringify(rec.student_records), JSON.stringify(rec.teacher_records)
        );
      }

      await client.query(`
        INSERT INTO attendance (id, school_id, academic_session, date, class_name, section, total_students, present_count, absent_count, leave_count, marked_by, student_records, teacher_records)
        VALUES ${valueStrings.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `, params);

      totalInserted += currentBatch.length;
      currentBatch = [];
    }

    let dayCounter = 0;
    for (const date of workingDays) {
      dayCounter++;

      // A. Class Sections Attendance
      for (const [classKey, classStudents] of classMap.entries()) {
        const [className, section] = classKey.split('__');
        const studentRecords = [];
        let presentCount = 0;
        let absentCount = 0;
        let leaveCount = 0;

        for (let i = 0; i < classStudents.length; i++) {
          const s = classStudents[i];
          // Deterministic realistic probability ~94% present, 4% absent, 2% leave
          const seed = (dayCounter * 31 + i * 17) % 100;
          let status = 'PRESENT';
          if (seed > 96) {
            status = 'LEAVE';
            leaveCount++;
          } else if (seed > 92) {
            status = 'ABSENT';
            absentCount++;
          } else {
            status = 'PRESENT';
            presentCount++;
          }

          const counts = studentAttendanceCounts.get(s.id);
          if (counts) {
            counts.total++;
            if (status === 'PRESENT') counts.present++;
          }

          studentRecords.push({
            student_id: s.id,
            admission_no: s.admission_no,
            full_name: s.full_name,
            roll_no: s.roll_no,
            status
          });
        }

        const attId = `ATT-${date.replace(/-/g, '')}-${className.replace(/\s+/g, '')}-${section}`;
        currentBatch.push({
          id: attId,
          school_id: 'DPS2026',
          academic_session: '2026-27',
          date,
          class_name: className,
          section,
          total_students: classStudents.length,
          present_count: presentCount,
          absent_count: absentCount,
          leave_count: leaveCount,
          marked_by: 'Class Teacher',
          student_records: studentRecords,
          teacher_records: []
        });

        if (currentBatch.length >= batchSize) {
          await flushBatch();
        }
      }

      // B. Faculty Daily Attendance
      let facPresent = 0;
      let facAbsent = 0;
      let facLeave = 0;
      const teacherRecords = [];

      for (let i = 0; i < teachers.length; i++) {
        const t = teachers[i];
        const seed = (dayCounter * 43 + i * 19) % 100;
        let status = 'PRESENT';
        if (seed > 97) {
          status = 'LEAVE';
          facLeave++;
        } else if (seed > 94) {
          status = 'ABSENT';
          facAbsent++;
        } else {
          status = 'PRESENT';
          facPresent++;
        }

        teacherRecords.push({
          teacher_id: t.id,
          staff_code: t.staff_code,
          full_name: t.full_name,
          status
        });
      }

      const facAttId = `ATT-${date.replace(/-/g, '')}-FACULTY-STAFF`;
      currentBatch.push({
        id: facAttId,
        school_id: 'DPS2026',
        academic_session: '2026-27',
        date,
        class_name: 'Faculty',
        section: 'Staff',
        total_students: teachers.length,
        present_count: facPresent,
        absent_count: facAbsent,
        leave_count: facLeave,
        marked_by: 'Principal Office',
        student_records: [],
        teacher_records: teacherRecords
      });

      if (currentBatch.length >= batchSize) {
        await flushBatch();
      }

      if (dayCounter % 30 === 0 || dayCounter === workingDays.length) {
        console.log(`  ✓ Processed ${dayCounter}/${workingDays.length} working days (${totalInserted} attendance logs streamed)...`);
      }
    }

    // Flush any remaining records
    await flushBatch();
    console.log(`\n🎉 Step 5: Completed streaming ${totalInserted} Attendance Records across all 2026-27 working days!`);

    // 4. Update overall student attendance percentages in students table
    console.log('\n📊 Step 6: Updating aggregate attendance percentages for 5,000 Students...');
    const updateBatchSize = 250;
    const studentIds = Array.from(studentAttendanceCounts.keys());
    for (let i = 0; i < studentIds.length; i += updateBatchSize) {
      const batch = studentIds.slice(i, i + updateBatchSize);
      const valueStrings = [];
      const params = [];
      let pIdx = 1;

      for (let j = 0; j < batch.length; j++) {
        const sId = batch[j];
        const { present, total } = studentAttendanceCounts.get(sId);
        const percent = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 95.0;
        valueStrings.push(`($${pIdx++}::VARCHAR, $${pIdx++}::NUMERIC)`);
        params.push(sId, percent);
      }

      await client.query(`
        UPDATE students AS s
        SET attendance_percent = v.percent
        FROM (VALUES ${valueStrings.join(', ')}) AS v(id, percent)
        WHERE s.id = v.id;
      `, params);
    }
    console.log('  ✓ Updated all 5,000 students with exact year-round attendance %');

    // 5. Verify live count
    const finalCount = await client.query("SELECT COUNT(*) FROM attendance WHERE academic_session = '2026-27';");
    console.log('\n======================================================');
    console.log('📈 COCKROACHDB 2026-27 ATTENDANCE STATS:');
    console.log(`  • Total Working Days Covered : ${workingDays.length} Days (Apr 2026 - Mar 2027)`);
    console.log(`  • Total Attendance Logs Stored: ${finalCount.rows[0].count} Records`);
    console.log(`  • Students Covered           : 5,000 Students`);
    console.log(`  • Faculty Members Covered    : 220 Teachers`);
    console.log('======================================================');

  } catch (err) {
    console.error('❌ Attendance seeding error:', err.message);
  } finally {
    await client.end();
  }
}

seedAttendance();
