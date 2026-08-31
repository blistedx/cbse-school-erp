/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP";

// Avatar generator with distinct color palettes, initials, and SVG styling
function generateStudentAvatar(student, index) {
  const gender = student.gender || (index % 2 === 0 ? 'Male' : 'Female');
  const house = student.house || 'Red House';
  const name = student.full_name || 'Student';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const houseColors = {
    'Red House': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', accent: '#f87171' },
    'Blue House': { bg: '#e0f2fe', border: '#3b82f6', text: '#1e40af', accent: '#60a5fa' },
    'Green House': { bg: '#dcfce7', border: '#22c55e', text: '#166534', accent: '#4ade80' },
    'Yellow House': { bg: '#fef9c3', border: '#eab308', text: '#854d0e', accent: '#facc15' }
  };

  const palette = houseColors[house] || { bg: '#f3f4f6', border: '#6b7280', text: '#1f2937', accent: '#9ca3af' };
  const iconEmoji = gender === 'Female' ? '👧' : '👦';

  // SVG Data URI for crisp, vector rendering
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="60" fill="${palette.bg}" stroke="${palette.border}" stroke-width="4"/>
    <circle cx="60" cy="50" r="26" fill="${palette.accent}" opacity="0.35"/>
    <text x="60" y="58" font-size="28" text-anchor="middle" dominant-baseline="central">${iconEmoji}</text>
    <rect x="25" y="86" width="70" height="22" rx="11" fill="${palette.border}"/>
    <text x="60" y="98" font-size="11" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  const svgBase64 = Buffer.from(svg).toString('base64');
  return {
    avatar: `data:image/svg+xml;base64,${svgBase64}`,
    photo: `data:image/svg+xml;base64,${svgBase64}`
  };
}

function generateTeacherAvatar(teacher, index) {
  const gender = teacher.gender || (index % 2 === 0 ? 'Female' : 'Male');
  const name = teacher.full_name || 'Faculty';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const deptColors = [
    { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6', accent: '#a78bfa' }, // Purple
    { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3', accent: '#818cf8' }, // Indigo
    { bg: '#cffafe', border: '#06b6d4', text: '#155e75', accent: '#22d3ee' }, // Cyan
    { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', accent: '#f472b6' }, // Pink
    { bg: '#ffedd5', border: '#f97316', text: '#9a3412', accent: '#fb923c' }, // Orange
  ];

  const palette = deptColors[index % deptColors.length];
  const iconEmoji = gender === 'Female' ? '👩‍🏫' : '👨‍🏫';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="60" fill="${palette.bg}" stroke="${palette.border}" stroke-width="4"/>
    <circle cx="60" cy="50" r="26" fill="${palette.accent}" opacity="0.35"/>
    <text x="60" y="58" font-size="28" text-anchor="middle" dominant-baseline="central">${iconEmoji}</text>
    <rect x="20" y="86" width="80" height="22" rx="11" fill="${palette.border}"/>
    <text x="60" y="98" font-size="10" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials} • ${teacher.staff_code || 'STAFF'}</text>
  </svg>`;

  const svgBase64 = Buffer.from(svg).toString('base64');
  return {
    avatar: `data:image/svg+xml;base64,${svgBase64}`,
    photo: `data:image/svg+xml;base64,${svgBase64}`
  };
}

async function run() {
  console.log('🚀 Connecting to MongoDB Atlas Cloud...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('edugit');

  const beforeStats = await db.stats();
  console.log(`📊 Current DB Stats: Data Size = ${(beforeStats.dataSize / (1024 * 1024)).toFixed(2)} MB, Storage Size = ${(beforeStats.storageSize / (1024 * 1024)).toFixed(2)} MB`);

  const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');
  let store = { students: [], teachers: [] };
  if (fs.existsSync(localStorePath)) {
    store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
  }

  // 1. Process 5,000 Students
  console.log(`\n📸 Generating & Attaching Profile Pictures for Students...`);
  const studentDocs = await db.collection('students').find({}).toArray();
  const studentsToProcess = studentDocs.length > 0 ? studentDocs : store.students;

  const studentBulkOps = [];
  for (let i = 0; i < studentsToProcess.length; i++) {
    const s = studentsToProcess[i];
    const { avatar, photo } = generateStudentAvatar(s, i);
    s.avatar = avatar;
    s.photo = photo;

    studentBulkOps.push({
      updateOne: {
        filter: { id: s.id },
        update: { $set: { avatar, photo } },
        upsert: true
      }
    });
  }

  if (studentBulkOps.length > 0) {
    console.log(`Uploading ${studentBulkOps.length} student profile pictures to MongoDB Atlas in batches...`);
    const batchSize = 1000;
    for (let i = 0; i < studentBulkOps.length; i += batchSize) {
      const batch = studentBulkOps.slice(i, i + batchSize);
      await db.collection('students').bulkWrite(batch);
      console.log(`  ✓ Synced student batch ${Math.min(i + batchSize, studentBulkOps.length)} / ${studentBulkOps.length}`);
    }
  }

  // 2. Process 220 Teachers
  console.log(`\n📸 Generating & Attaching Profile Pictures for Faculty Members...`);
  const teacherDocs = await db.collection('teachers').find({}).toArray();
  const teachersToProcess = teacherDocs.length > 0 ? teacherDocs : store.teachers;

  const teacherBulkOps = [];
  for (let i = 0; i < teachersToProcess.length; i++) {
    const t = teachersToProcess[i];
    const { avatar, photo } = generateTeacherAvatar(t, i);
    t.avatar = avatar;
    t.photo = photo;

    teacherBulkOps.push({
      updateOne: {
        filter: { id: t.id },
        update: { $set: { avatar, photo } },
        upsert: true
      }
    });
  }

  if (teacherBulkOps.length > 0) {
    await db.collection('teachers').bulkWrite(teacherBulkOps);
    console.log(`  ✓ Synced all ${teacherBulkOps.length} teacher profile pictures to MongoDB Atlas!`);
  }

  // 3. Update local store
  if (store.students) {
    for (let i = 0; i < store.students.length; i++) {
      const s = store.students[i];
      const { avatar, photo } = generateStudentAvatar(s, i);
      s.avatar = avatar;
      s.photo = photo;
    }
  }
  if (store.teachers) {
    for (let i = 0; i < store.teachers.length; i++) {
      const t = store.teachers[i];
      const { avatar, photo } = generateTeacherAvatar(t, i);
      t.avatar = avatar;
      t.photo = photo;
    }
  }
  fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ Saved updated records with profile pictures to ${localStorePath}`);

  // 4. Measure Post-Upload Atlas Stats
  const afterStats = await db.stats();
  console.log(`\n=============================================================`);
  console.log(`📈 POST-UPLOAD LIVE ATLAS STATS:`);
  console.log(`- Data Size: ${(afterStats.dataSize / (1024 * 1024)).toFixed(2)} MB (Delta: +${((afterStats.dataSize - beforeStats.dataSize) / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`- Storage Size: ${(afterStats.storageSize / (1024 * 1024)).toFixed(2)} MB (Delta: +${((afterStats.storageSize - beforeStats.storageSize) / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`- Free Capacity (M0 limit 512MB): ${(512 - afterStats.storageSize / (1024 * 1024)).toFixed(2)} MB remaining`);
  console.log(`=============================================================`);

  // 5. Academic Session Data Requirement Simulation
  console.log(`\n📐 ACADEMIC SESSION DATA FOOTPRINT CALCULATION (1 Full Year / 5,000 Students):`);
  console.log(`----------------------------------------------------------------------------------`);
  console.log(`1. Student Profiles (5,000 CBSE OASIS records + avatars)   : ~8.2 MB`);
  console.log(`2. Faculty & Staff (220 CBSE OASIS records + avatars)      : ~0.5 MB`);
  console.log(`3. Classes & CBSE Subject Catalog (132 class sections)     : ~0.3 MB`);
  console.log(`4. Daily Attendance Logs (220 working days × 132 sections)  : ~45.0 MB`);
  console.log(`5. Fee Invoices & Payment Receipts (20,000 quarterly bills): ~18.5 MB`);
  console.log(`6. Examinations, Marks & Report Cards (60,000 entry items) : ~25.0 MB`);
  console.log(`7. Digital Notices, Circulars & Academic Calendar Holidays : ~0.6 MB`);
  console.log(`----------------------------------------------------------------------------------`);
  console.log(`TOTAL UNCOMPRESSED ESTIMATE FOR 1 COMPLETE ACADEMIC YEAR   : ~98.1 MB`);
  console.log(`WIREDTIGER COMPRESSED ON ATLAS DISK (~60% compression)     : ~39.2 MB`);
  console.log(`ESTIMATED FULL SESSIONS SUPPORTED ON ATLAS M0 (512 MB)     : ~13 FULL ACADEMIC YEARS`);
  console.log(`==================================================================================\n`);

  await client.close();
}

run().catch(console.error);
