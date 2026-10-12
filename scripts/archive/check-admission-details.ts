import { getDatabase } from '../src/lib/mongodb';

async function checkDetails() {
  const db = await getDatabase();
  const schoolId = 'DPS2026';
  const session = '2026-27';

  // 1. Check students
  const students = await db.collection('students').find({ school_id: schoolId }).toArray();
  console.log(`Total students for ${schoolId}: ${students.length}`);
  
  // Inspect student fields
  console.log('Sample student keys:', Object.keys(students[0] || {}));
  console.log('Sample student admission fields:', {
    admission_no: students[0].admission_no,
    admission_date: students[0].admission_date,
    admissionDate: students[0].admissionDate,
    created_at: students[0].created_at,
    academic_session: students[0].academic_session,
    joinedSession: (students[0] as any).joinedSession,
    status: students[0].status,
    class_name: students[0].class_name,
    section: students[0].section,
  });

  // Check how many students have admissionDate or joinedSession or created_at in 2026-27
  let newAdmissionsCount = 0;
  for (const s of students) {
    const sDoc = s as any;
    const admDate = sDoc.admission_date || sDoc.admissionDate || sDoc.created_at;
    const admSession = sDoc.academic_session || sDoc.admission_session || sDoc.joinedSession;
    if (admDate && (String(admDate).includes('2026') || String(admSession) === '2026-27')) {
      newAdmissionsCount++;
    }
  }
  console.log(`Students with 2026 date/session: ${newAdmissionsCount}`);

  // 2. Check fee demands by feeHead
  const demands = await db.collection('fee_demands').find({ schoolId, sessionId: session }).toArray();
  console.log(`Total demands: ${demands.length}`);
  const headTotals: Record<string, { count: number; net: number }> = {};
  for (const d of demands as any[]) {
    if (!headTotals[d.feeHead]) headTotals[d.feeHead] = { count: 0, net: 0 };
    headTotals[d.feeHead].count++;
    headTotals[d.feeHead].net += (d.netAmount || 0);
  }
  console.log('Fee Heads breakdown in fee_demands:');
  for (const [head, info] of Object.entries(headTotals)) {
    console.log(`  - ${head}: ${info.count} demands, ₹${info.net / 100}`);
  }

  // 3. Check where fee_demands were created / seeded
  // Let's check files in scripts/ that seed fee_demands or fee structures
}

checkDetails().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
