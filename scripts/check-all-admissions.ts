import { getDatabase } from '../src/lib/mongodb';

async function checkAdmissions() {
  const db = await getDatabase();
  const students = await db.collection('students').find({ school_id: 'DPS2026' }).toArray();
  
  const withAdmType = students.filter((s: any) => s.admission_type);
  const withAdmDate = students.filter((s: any) => s.admission_date);
  const withAdmNoADM = students.filter((s: any) => s.admission_no && s.admission_no.startsWith('ADM-'));
  
  console.log(`With admission_type: ${withAdmType.length}`);
  console.log('Students with admission_type:', withAdmType.map((s: any) => ({ name: s.full_name, admNo: s.admission_no, cls: s.class_name, admType: s.admission_type, date: s.admission_date })));
  
  console.log(`With admission_date: ${withAdmDate.length}`);
  console.log('Students with admission_date:', withAdmDate.map((s: any) => ({ name: s.full_name, admNo: s.admission_no, cls: s.class_name, admType: s.admission_type, date: s.admission_date })));

  console.log(`With admission_no starting with ADM-: ${withAdmNoADM.length}`);
  console.log('Students with ADM-:', withAdmNoADM.map((s: any) => ({ name: s.full_name, admNo: s.admission_no, cls: s.class_name, admType: s.admission_type, date: s.admission_date })));
}

checkAdmissions().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
