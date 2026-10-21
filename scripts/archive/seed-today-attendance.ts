import { Database } from '../src/lib/db';
import { getDatabase } from '../src/lib/mongodb';

export async function seedRecentWeekAttendance() {
  const db = await getDatabase();
  if (!db) {
    console.error('Failed to connect to database');
    return;
  }

  const schoolId = 'DPS2026';
  const session = '2026-27';

  // Seed last 7 days excluding Sunday (Oct 18)
  const datesToSeed = [
    '2026-10-15', // Thu
    '2026-10-16', // Fri
    '2026-10-17', // Sat
    '2026-10-19', // Mon
    '2026-10-20', // Tue
    '2026-10-21'  // Wed (Today)
  ];

  const [students, teachers, classes] = await Promise.all([
    Database.getStudents(schoolId, session),
    Database.getTeachers(schoolId, session),
    Database.getClasses(schoolId, session)
  ]);

  console.log(`Found ${students.length} students, ${teachers.length} teachers, ${classes.length} classes.`);

  const attendanceCollection = db.collection('attendance');

  for (const dayStr of datesToSeed) {
    // Delete existing records for this day
    await attendanceCollection.deleteMany({
      school_id: schoolId,
      academic_session: session,
      date: dayStr
    });

    const recordsToInsert: any[] = [];
    const daySeed = dayStr.split('-').map(Number).reduce((a, b) => a + b, 0);

    for (const cls of classes) {
      const rawName = cls.class_name || cls.name || '';
      const section = cls.section || 'A';
      
      const clsStudents = students.filter(s => {
        const sCls = (s.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
        const targetCls = rawName.toLowerCase().trim().replace(/^class\s*/i, '');
        const sSec = (s.section || 'A').toUpperCase().trim();
        const targetSec = section.toUpperCase().trim();
        return (sCls === targetCls || s.class_name === rawName) && sSec === targetSec;
      });

      const totalStudents = clsStudents.length || 28;
      const studentRecords = clsStudents.map((s, idx) => {
        const attPct = typeof s.attendance_percent === 'number' ? s.attendance_percent : 92;
        // Deterministic variation per date
        const isAbsent = attPct < 75 ? ((idx + daySeed) % 3 === 0) : ((idx + daySeed) % 18 === 0);
        const isLate = !isAbsent && ((idx + daySeed) % 13 === 0);
        const status = isAbsent ? 'ABSENT' : (isLate ? 'LATE' : 'PRESENT');
        return {
          student_id: s.id,
          admission_no: s.admission_no || '',
          full_name: s.full_name || '',
          roll_no: s.roll_no || String(idx + 1),
          status: status,
          time: status !== 'ABSENT' ? (isLate ? '08:35 AM' : '08:10 AM') : undefined
        };
      });

      const presentCount = studentRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
      const absentCount = studentRecords.filter(r => r.status === 'ABSENT').length;

      const normClassKey = rawName.toLowerCase().trim().replace(/^class\s*/i, '').replace(/[-\s]+/g, '');
      const cleanId = `ATT-${schoolId}-${session}-${dayStr}-${normClassKey}-${section}`;

      recordsToInsert.push({
        id: cleanId,
        school_id: schoolId,
        academic_session: session,
        date: dayStr,
        class_name: rawName,
        section: section,
        total_students: totalStudents,
        present_count: presentCount,
        absent_count: absentCount,
        holiday_count: 0,
        leave_count: 0,
        marked_by: 'Class Teacher / System Sync',
        student_records: studentRecords,
        teacher_records: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Faculty record for dayStr
    const totalFaculty = teachers.length;
    const teacherRecords = teachers.map((t, idx) => {
      const isAbsent = (idx + daySeed) % 15 === 0;
      const isLate = !isAbsent && (idx + daySeed) % 8 === 0;
      const status = isAbsent ? 'ON_LEAVE' : (isLate ? 'LATE' : 'PRESENT');
      return {
        teacher_id: t.id,
        staff_code: t.staff_code || '',
        full_name: t.full_name || '',
        status: status,
        time: status !== 'ON_LEAVE' ? (isLate ? '08:45 AM' : '07:55 AM') : undefined,
        is_late: isLate
      };
    });
    const facPresent = teacherRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const facAbsent = teacherRecords.filter(r => r.status === 'ON_LEAVE').length;

    recordsToInsert.push({
      id: `ATT-${schoolId}-${session}-${dayStr}-faculty-Staff`,
      school_id: schoolId,
      academic_session: session,
      date: dayStr,
      class_name: 'Faculty',
      section: 'Staff',
      total_students: totalFaculty,
      present_count: facPresent,
      absent_count: facAbsent,
      holiday_count: 0,
      leave_count: facAbsent,
      marked_by: 'Biometric Attendance System',
      student_records: [],
      teacher_records: teacherRecords,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await attendanceCollection.insertMany(recordsToInsert);
    const pCount = recordsToInsert.filter(r => r.class_name !== 'Faculty').reduce((acc, c) => acc + c.present_count, 0);
    const tCount = recordsToInsert.filter(r => r.class_name !== 'Faculty').reduce((acc, c) => acc + c.total_students, 0);
    console.log(`[${dayStr}] Students: ${pCount}/${tCount} (${((pCount / tCount) * 100).toFixed(1)}%) | Staff: ${facPresent}/${totalFaculty} (${((facPresent / totalFaculty) * 100).toFixed(1)}%)`);
  }

  console.log('Successfully completed 7-day attendance seeding.');
}

seedRecentWeekAttendance()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
