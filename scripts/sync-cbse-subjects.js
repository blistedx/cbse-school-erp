/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');
const { MongoClient } = require('mongodb');

function getDefaultCbseSubjectsForClass(className, section) {
  const norm = (className || '').toLowerCase().trim();
  const sec = (section || '').toUpperCase().trim();
  
  // 1. Senior Secondary Stage (Class XI & Class XII / 11 & 12)
  // Prescribed CBSE Subjects & Codes: English, Physics, Chemistry, Biology, Maths, Accounts, Business Studies, Economics, Computer Science, Hindi, P.Ed
  if (
    norm.includes('class 11') || norm.includes('class 12') ||
    norm.includes('class xi') || norm.includes('class xii') ||
    /\b(class\s*11|class\s*12|class\s*xi|class\s*xii|xi|xii|11|12)\b/i.test(norm)
  ) {
    // Commerce Stream (Section B)
    if (sec === 'B' || norm.includes('commerce') || norm.includes('comm')) {
      return [
        { id: 'SUB-XI-ENG', name: 'English Core', code: '301', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-XI-BST', name: 'Business Studies (BST)', code: '054', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-XI-ACC', name: 'Accountancy', code: '055', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-XI-ECO', name: 'Economics', code: '030', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-XI-MATH', name: 'Mathematics / Applied Maths', code: '041', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-XI-COMP', name: 'Computer Science', code: '083', type: 'ELECTIVE', weekly_periods: 5, max_marks: 100 },
        { id: 'SUB-XI-HIN', name: 'Hindi Core', code: '302', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
        { id: 'SUB-XI-PED', name: 'Physical Education (P.Ed)', code: '048', type: 'ELECTIVE', weekly_periods: 4, max_marks: 100 }
      ];
    }

    // Science Stream (Default / Section A)
    if (sec === 'A' || norm.includes('science') || norm.includes('sci')) {
      return [
        { id: 'SUB-XI-ENG', name: 'English Core', code: '301', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-XI-PHY', name: 'Physics', code: '042', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-XI-CHEM', name: 'Chemistry', code: '043', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-XI-MATH', name: 'Mathematics', code: '041', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-XI-BIO', name: 'Biology', code: '044', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-XI-COMP', name: 'Computer Science', code: '083', type: 'ELECTIVE', weekly_periods: 5, max_marks: 100 },
        { id: 'SUB-XI-HIN', name: 'Hindi Core', code: '302', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
        { id: 'SUB-XI-PED', name: 'Physical Education (P.Ed)', code: '048', type: 'ELECTIVE', weekly_periods: 4, max_marks: 100 }
      ];
    }

    // Combined Standard Stream (All subjects from chart with official CBSE codes)
    return [
      { id: 'SUB-XI-ENG', name: 'English Core', code: '301', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-PHY', name: 'Physics', code: '042', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-CHEM', name: 'Chemistry', code: '043', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-BST', name: 'Business Studies (BST)', code: '054', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-ACC', name: 'Accountancy', code: '055', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-ECO', name: 'Economics', code: '030', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-MATH', name: 'Mathematics', code: '041', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-BIO', name: 'Biology', code: '044', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-XI-COMP', name: 'Computer Science', code: '083', type: 'ELECTIVE', weekly_periods: 5, max_marks: 100 },
      { id: 'SUB-XI-HIN', name: 'Hindi Core', code: '302', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
      { id: 'SUB-XI-PED', name: 'Physical Education (P.Ed)', code: '048', type: 'ELECTIVE', weekly_periods: 4, max_marks: 100 }
    ];
  }

  // 2. Secondary Stage (Classes 9 & 10 / IX & X) with Official CBSE Codes
  if (
    norm.includes('class 9') || norm.includes('class 10') ||
    norm.includes('class ix') || norm.includes('class x') ||
    /\b(class\s*9|class\s*10|class\s*ix|class\s*x|ix|x)\b/i.test(norm)
  ) {
    return [
      { id: 'SUB-SEC-ENG', name: 'English Language and Literature', code: '184', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-SEC-HIN', name: 'Hindi Course-A', code: '002', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
      { id: 'SUB-SEC-MATH', name: 'Mathematics', code: '041', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
      { id: 'SUB-SEC-SCI', name: 'Science', code: '086', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
      { id: 'SUB-SEC-SST', name: 'Social Science (S.St)', code: '087', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-SEC-IT', name: 'Information Technology (I.T.)', code: '402', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
    ];
  }

  // 3. Classes VI to VIII (Middle Stage) - No codes
  if (norm.includes('class 6') || norm.includes('class 7') || norm.includes('class 8') || /\b(vi|vii|viii|6|7|8)\b/i.test(norm)) {
    return [
      { id: 'SUB-MID-ENG', name: 'English', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-MID-HIN', name: 'Hindi', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-MID-MATH', name: 'Maths', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-MID-SCI', name: 'Science', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-MID-SST', name: 'Social Studies (S.St)', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-MID-COMP', name: 'Computer / Sanskrit', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
    ];
  }

  // 4. Classes III to V (Primary Stage) - No codes
  if (norm.includes('class 3') || norm.includes('class 4') || norm.includes('class 5') || /\b(iii|iv|v|3|4|5)\b/i.test(norm)) {
    return [
      { id: 'SUB-PRI-HIN', name: 'Hindi', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI-ENG', name: 'English', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI-MATH', name: 'Maths', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI-SCI', name: 'Science', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI-SST', name: 'Social Studies (S.St)', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI-COMP', name: 'Computer', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
    ];
  }

  // 5. Classes I & II - No codes
  if (norm.includes('class 1') || norm.includes('class 2') || /\b(class\s*i|class\s*ii|i|ii|1|2)\b/i.test(norm)) {
    return [
      { id: 'SUB-PRI12-ENG', name: 'English', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI12-HIN', name: 'Hindi', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI12-MATH', name: 'Maths', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI12-EVS', name: 'EVS', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRI12-COMP', name: 'Computer', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
    ];
  }

  // 6. Pre-Primary (PG, Nursery, LKG, UKG) - No codes
  if (norm.includes('ukg') || norm.includes('kg 2') || norm.includes('kg-2')) {
    return [
      { id: 'SUB-UKG-HIN', name: 'Hindi Oral + Written', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-UKG-ENG', name: 'English Oral + Written', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-UKG-MATH', name: 'Maths Oral + Written', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-UKG-ART', name: 'Art + Conversation', type: 'INTERNAL_ASSESSMENT', weekly_periods: 4, max_marks: 50 },
      { id: 'SUB-UKG-EVS', name: 'EVS Oral + Written', type: 'COMPULSORY', weekly_periods: 4, max_marks: 100 }
    ];
  }

  // PG, Nursery, LKG
  return [
    { id: 'SUB-PRE-HIN', name: 'Hindi Oral + Written', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
    { id: 'SUB-PRE-ENG', name: 'English Oral + Written', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
    { id: 'SUB-PRE-MATH', name: 'Maths Oral + Written', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
    { id: 'SUB-PRE-ART', name: 'Art + Conversation', type: 'INTERNAL_ASSESSMENT', weekly_periods: 4, max_marks: 50 }
  ];
}

function getClassWeight(className) {
  const norm = (className || '').toLowerCase().trim();
  if (norm.includes('pre-nursery') || norm.includes('playgroup')) return 1;
  if (norm.includes('nursery') || norm.includes('nur')) return 2;
  if (norm.includes('lkg')) return 3;
  if (norm.includes('ukg')) return 4;
  if (/\b(class\s*12|class\s*xii|xii)\b/i.test(norm)) return 16;
  if (/\b(class\s*11|class\s*xi|xi)\b/i.test(norm)) return 15;
  if (/\b(class\s*10|class\s*x|x)\b/i.test(norm)) return 14;
  if (/\b(class\s*9|class\s*ix|ix)\b/i.test(norm)) return 13;
  if (/\b(class\s*8|class\s*viii|viii)\b/i.test(norm)) return 12;
  if (/\b(class\s*7|class\s*vii|vii)\b/i.test(norm)) return 11;
  if (/\b(class\s*6|class\s*vi|vi)\b/i.test(norm)) return 10;
  if (/\b(class\s*5|class\s*v|v)\b/i.test(norm)) return 9;
  if (/\b(class\s*4|class\s*iv|iv)\b/i.test(norm)) return 8;
  if (/\b(class\s*3|class\s*iii|iii)\b/i.test(norm)) return 7;
  if (/\b(class\s*2|class\s*ii|ii)\b/i.test(norm)) return 6;
  if (/\b(class\s*1|class\s*i|i)\b/i.test(norm)) return 5;
  return 100;
}

function sortClassesChronologically(list) {
  return [...list].sort((a, b) => {
    const wA = getClassWeight(a.class_name || '');
    const wB = getClassWeight(b.class_name || '');
    if (wA !== wB) return wA - wB;
    const secA = (a.section || '').toUpperCase();
    const secB = (b.section || '').toUpperCase();
    return secA.localeCompare(secB);
  });
}

async function syncAllClassesCbse() {
  const file = 'data/erp_store.json';
  const store = JSON.parse(fs.readFileSync(file, 'utf8'));

  store.classes = (store.classes || []).map(cls => {
    const subjects = getDefaultCbseSubjectsForClass(cls.class_name, cls.section);
    return {
      ...cls,
      subjects,
      no_of_subjects: subjects.length,
      academic_session: cls.academic_session || '2026-27'
    };
  });

  store.classes = sortClassesChronologically(store.classes);

  fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ Normalized ${store.classes.length} classes in data/erp_store.json`);

  const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  const ops = store.classes.map(c => {
    const { _id, ...clean } = c;
    return {
      updateOne: {
        filter: { id: clean.id },
        update: { $set: clean },
        upsert: true
      }
    };
  });
  const res = await db.collection('classes').bulkWrite(ops);
  console.log(`✅ Synced ${res.upsertedCount + res.modifiedCount + res.matchedCount} classes with CBSE Science / Commerce / Arts subjects to MongoDB Atlas`);

  // Verify Class XI & Class XII
  const sampleXI_A = store.classes.find(c => (c.class_name || '').toUpperCase().includes('XI') && c.section === 'A');
  const sampleXI_B = store.classes.find(c => (c.class_name || '').toUpperCase().includes('XI') && c.section === 'B');
  console.log('\n--- VERIFICATION: Class XI - Section A (Science PCM/PCB) ---');
  console.log(sampleXI_A?.subjects?.map(s => `${s.name} (${s.code})`));

  console.log('\n--- VERIFICATION: Class XI - Section B (Commerce) ---');
  console.log(sampleXI_B?.subjects?.map(s => `${s.name} (${s.code})`));

  await client.close();
}

syncAllClassesCbse().catch(console.error);
