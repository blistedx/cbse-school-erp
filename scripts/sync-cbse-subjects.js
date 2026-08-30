const fs = require('fs');
const { MongoClient } = require('mongodb');

function getDefaultCbseSubjectsForClass(className, section) {
  const norm = (className || '').toLowerCase().trim();
  
  // 1. Foundational / Pre-Primary Stage (Nursery, LKG, UKG)
  if (norm.includes('nursery') || norm.includes('lkg') || norm.includes('ukg') || norm.includes('kg') || norm.includes('pre-primary')) {
    return [
      { id: 'SUB-PRE-1', name: 'English (Early Literacy & Phonics)', code: 'ENG-F01', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRE-2', name: 'Hindi (Akshar Gyan & Kavita)', code: 'HIN-F02', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRE-3', name: 'Foundational Mathematics (Numeracy)', code: 'MATH-F03', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-PRE-4', name: 'Environmental Awareness & Discovery', code: 'EVS-F04', type: 'COMPULSORY', weekly_periods: 4, max_marks: 100 },
      { id: 'SUB-PRE-5', name: 'Creative Arts & Craft', code: 'ART-F05', type: 'INTERNAL_ASSESSMENT', weekly_periods: 3, max_marks: 50 },
      { id: 'SUB-PRE-6', name: 'Physical Well-being & Motor Skills', code: 'PHE-F06', type: 'INTERNAL_ASSESSMENT', weekly_periods: 3, max_marks: 50 }
    ];
  }

  // 2. Primary Stage (Classes 1 to 5 / I to V)
  if (
    norm.includes('class 1') || norm.includes('class 2') || norm.includes('class 3') || norm.includes('class 4') || norm.includes('class 5') ||
    norm.includes('class i') || norm.includes('class ii') || norm.includes('class iii') || norm.includes('class iv') || norm.includes('class v')
  ) {
    if (!/\b(vi|vii|viii|ix|x|xi|xii|6|7|8|9|10|11|12)\b/i.test(norm)) {
      return [
        { id: 'SUB-PRI-1', name: 'English Language & Grammar', code: '101', type: 'LANGUAGE', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-PRI-2', name: 'Hindi Bhasha & Vyakaran', code: '102', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-PRI-3', name: 'Mathematics & Mental Arithmetic', code: '041', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-PRI-4', name: 'Environmental Studies (EVS)', code: '104', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-PRI-5', name: 'Computer Applications & ICT', code: '165', type: 'SKILL', weekly_periods: 3, max_marks: 50 },
        { id: 'SUB-PRI-6', name: 'Visual & Performing Arts', code: '502', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 },
        { id: 'SUB-PRI-7', name: 'Health & Physical Education', code: '506', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 }
      ];
    }
  }

  // 3. Middle Stage (Classes 6 to 8 / VI to VIII)
  if (
    norm.includes('class 6') || norm.includes('class 7') || norm.includes('class 8') ||
    norm.includes('class vi') || norm.includes('class vii') || norm.includes('class viii') ||
    /\b(class\s*6|class\s*7|class\s*8|class\s*vi|class\s*vii|class\s*viii|vi|vii|viii|6|7|8)\b/i.test(norm)
  ) {
    if (!/\b(ix|x|xi|xii|9|10|11|12|iv|v|1|2|3|4|5)\b/i.test(norm)) {
      return [
        { id: 'SUB-MID-1', name: 'English Language & Literature', code: '184', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-MID-2', name: 'Hindi Course-A', code: '002', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
        { id: 'SUB-MID-3', name: 'Sanskrit / Third Language', code: '122', type: 'LANGUAGE', weekly_periods: 4, max_marks: 100 },
        { id: 'SUB-MID-4', name: 'Mathematics', code: '041', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-MID-5', name: 'Science', code: '086', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-MID-6', name: 'Social Science', code: '087', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-MID-7', name: 'Artificial Intelligence & Coding', code: '417', type: 'SKILL', weekly_periods: 3, max_marks: 50 },
        { id: 'SUB-MID-8', name: 'Art Education', code: '502', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 },
        { id: 'SUB-MID-9', name: 'Physical & Health Education', code: '506', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 }
      ];
    }
  }

  // 4. Secondary Stage (Classes 9 and 10 / IX and X)
  if (
    norm.includes('class 9') || norm.includes('class 10') ||
    norm.includes('class ix') || norm.includes('class x') ||
    /\b(class\s*9|class\s*10|class\s*ix|class\s*x|ix|x)\b/i.test(norm)
  ) {
    if (!/\b(xi|xii|11|12)\b/i.test(norm)) {
      return [
        { id: 'SUB-SEC-1', name: 'English Language and Literature', code: '184', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-SEC-2', name: 'Hindi Course-A', code: '002', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
        { id: 'SUB-SEC-3', name: 'Mathematics Standard', code: '041', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-SEC-4', name: 'Science (Theory & Lab Practical)', code: '086', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-SEC-5', name: 'Social Science', code: '087', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-SEC-6', name: 'Information Technology (Skill Subject)', code: '402', type: 'SKILL', weekly_periods: 4, max_marks: 100 },
        { id: 'SUB-SEC-7', name: 'Health and Physical Education', code: '506', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 },
        { id: 'SUB-SEC-8', name: 'Art Education & Work Experience', code: '502', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 }
      ];
    }
  }

  // 5. Senior Secondary Stage (Classes 11 and 12 / XI and XII)
  if (
    norm.includes('class 11') || norm.includes('class 12') ||
    norm.includes('class xi') || norm.includes('class xii') ||
    /\b(class\s*11|class\s*12|class\s*xi|class\s*xii|xi|xii|11|12)\b/i.test(norm)
  ) {
    const sec = (section || '').toUpperCase().trim();
    
    // Commerce Stream (Section B)
    if (sec === 'B' || norm.includes('commerce') || norm.includes('comm')) {
      return [
        { id: 'SUB-COM-1', name: 'Accountancy', code: '055', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-COM-2', name: 'Business Studies (BST)', code: '054', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-COM-3', name: 'Economics (Micro & Macro)', code: '030', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-COM-4', name: 'English Core', code: '301', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-COM-5', name: 'Applied Mathematics', code: '241', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-COM-6', name: 'Physical Education', code: '048', type: 'ELECTIVE', weekly_periods: 4, max_marks: 100 },
        { id: 'SUB-COM-7', name: 'General Studies & SEWA', code: '500', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 },
        { id: 'SUB-COM-8', name: 'Health & Physical Education', code: '506', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 }
      ];
    }

    // Humanities / Arts Stream (Section C)
    if (sec === 'C' || norm.includes('arts') || norm.includes('humanities') || norm.includes('hum')) {
      return [
        { id: 'SUB-ART-1', name: 'History', code: '027', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
        { id: 'SUB-ART-2', name: 'Political Science', code: '028', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-ART-3', name: 'Geography', code: '029', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-ART-4', name: 'Economics', code: '030', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-ART-5', name: 'English Core', code: '301', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
        { id: 'SUB-ART-6', name: 'Physical Education', code: '048', type: 'ELECTIVE', weekly_periods: 4, max_marks: 100 },
        { id: 'SUB-ART-7', name: 'General Studies & SEWA', code: '500', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 },
        { id: 'SUB-ART-8', name: 'Health & Physical Education', code: '506', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 }
      ];
    }

    // Science Stream (Default / Section A: PCM & PCB)
    return [
      { id: 'SUB-SCI-1', name: 'Physics (Theory & Lab Practical)', code: '042', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
      { id: 'SUB-SCI-2', name: 'Chemistry (Theory & Lab Practical)', code: '043', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
      { id: 'SUB-SCI-3', name: 'Mathematics', code: '041', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
      { id: 'SUB-SCI-4', name: 'Biology (Botany & Zoology)', code: '044', type: 'ELECTIVE', weekly_periods: 7, max_marks: 100 },
      { id: 'SUB-SCI-5', name: 'English Core', code: '301', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
      { id: 'SUB-SCI-6', name: 'Computer Science (Python & SQL)', code: '083', type: 'ELECTIVE', weekly_periods: 5, max_marks: 100 },
      { id: 'SUB-SCI-7', name: 'Physical Education', code: '048', type: 'ELECTIVE', weekly_periods: 4, max_marks: 100 },
      { id: 'SUB-SCI-8', name: 'General Studies & SEWA', code: '500', type: 'INTERNAL_ASSESSMENT', weekly_periods: 2, max_marks: 50 }
    ];
  }

  // Fallback general CBSE subjects
  return [
    { id: 'SUB-GEN-1', name: 'English Language and Literature', code: '184', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
    { id: 'SUB-GEN-2', name: 'Hindi Course-A', code: '002', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
    { id: 'SUB-GEN-3', name: 'Mathematics', code: '041', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
    { id: 'SUB-GEN-4', name: 'Science', code: '086', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
    { id: 'SUB-GEN-5', name: 'Social Science', code: '087', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
    { id: 'SUB-GEN-6', name: 'Information Technology', code: '402', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
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
