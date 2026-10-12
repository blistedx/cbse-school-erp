import { getDatabase } from '../src/lib/mongodb';

async function checkStudentsDetails() {
  const db = await getDatabase();
  const students = await db.collection('students').find({ school_id: 'DPS2026' }).toArray();
  
  console.log(`Total students: ${students.length}`);
  
  const admTypeCounts: Record<string, number> = {};
  const classCounts: Record<string, number> = {};
  const admDateCounts: Record<string, number> = {};
  
  for (const s of students as any[]) {
    const at = s.admission_type || 'NONE';
    admTypeCounts[at] = (admTypeCounts[at] || 0) + 1;
    
    const cn = s.class_name || 'UNKNOWN';
    classCounts[cn] = (classCounts[cn] || 0) + 1;
    
    const ad = s.admission_date || 'NONE';
    admDateCounts[ad] = (admDateCounts[ad] || 0) + 1;
  }
  
  console.log('Admission Types:', admTypeCounts);
  console.log('Classes count:', Object.keys(classCounts).length, classCounts);
  console.log('Admission Dates count:', Object.keys(admDateCounts).length);
  
  // Let's sample 5 students
  console.log('Sample 5 students:', students.slice(0, 5).map((s: any) => ({
    name: s.full_name,
    admNo: s.admission_no,
    cls: s.class_name,
    sec: s.section,
    admType: s.admission_type,
    admDate: s.admission_date,
    createdAt: s.created_at
  })));
}

checkStudentsDetails().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
