/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const FIRST_NAMES_FEMALE = [
  "Aadhya", "Saanvi", "Ananya", "Diya", "Pari", "Myra", "Anika", "Navya", "Avani", "Riya",
  "Isha", "Kavya", "Sneha", "Tanvi", "Prisha", "Khushi", "Shruti", "Anushka", "Aditi", "Meera",
  "Pooja", "Simran", "Palak", "Divya", "Neha", "Nisha", "Swati", "Rashmi", "Muskan", "Bhavna",
  "Sakshi", "Gauri", "Vanya", "Samaira", "Kriti", "Trisha", "Tara", "Kiara", "Lavanya", "Siya",
  "Ira", "Mahi", "Nandini", "Ahana", "Zoya", "Avanti", "Charvi", "Jhanvi", "Ojaswi", "Ridhima",
  "Ishita", "Aarohi", "Rhea", "Anaya", "Tanya", "Vidhi", "Kashish", "Aaradhya", "Manya", "Priya",
  "Vaishnavi", "Shreya", "Sanya", "Rashi", "Vrinda", "Pranjal", "Harshita", "Payal", "Garima", "Komal",
  "Juhi", "Mansi", "Akanksha", "Sanskriti", "Bhoomi", "Sonakshi", "Natasha", "Anjali", "Radhika", "Kalyani",
  "Mehak", "Gunjan", "Rupal", "Simi", "Chhavi", "Devika", "Esha", "Barkha", "Pallavi", "Alka",
  "Deepika", "Shalini", "Sunita", "Anita", "Mamta", "Kavita", "Sangeeta", "Babita", "Geeta", "Seema"
];

const FATHER_FIRST_NAMES = [
  "Rajesh", "Sanjay", "Vikram", "Rakesh", "Amit", "Anil", "Sunil", "Manoj", "Pradeep", "Ashok",
  "Dinesh", "Ramesh", "Mukesh", "Alok", "Praveen", "Suresh", "Ajay", "Vijay", "Kamal", "Mahesh"
];

const MOTHER_FIRST_NAMES = [
  "Sunita", "Anita", "Rekha", "Pooja", "Suman", "Vandana", "Shalini", "Meenakshi", "Preeti", "Neelam",
  "Kavita", "Geeta", "Mamta", "Manju", "Asha", "Saroj", "Seema", "Ritu", "Anupama", "Geetika"
];

function generateFemaleSvgAvatar(name, index) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const femaleGradients = [
    ['#831843', '#ec4899'], // Deep Pink
    ['#581c87', '#a855f7'], // Purple
    ['#7c2d12', '#f97316'], // Coral/Warm
    ['#0f766e', '#14b8a6'], // Teal
    ['#4338ca', '#818cf8'], // Indigo/Violet
    ['#881337', '#f43f5e'], // Rose
    ['#701a75', '#d946ef'], // Fuchsia
    ['#065f46', '#34d399']  // Emerald
  ];
  const palette = femaleGradients[index % femaleGradients.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="fem-grad-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}"/>
        <stop offset="100%" stop-color="${palette[1]}"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="58" fill="url(#fem-grad-${index})" stroke="#ffffff" stroke-width="3"/>
    <circle cx="60" cy="46" r="22" fill="#ffffff" opacity="0.9"/>
    <path d="M24 104 C24 78 40 72 60 72 C80 72 96 78 96 104 Z" fill="#ffffff" opacity="0.9"/>
    <text x="60" y="52" font-size="14" font-weight="900" font-family="system-ui, sans-serif" fill="${palette[0]}" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function run() {
  console.log('🔄 STARTING GENDER BALANCING: CONVERTING 200 BOYS TO GIRLS');
  console.log('========================================================\n');

  const mg = new MongoClient(process.env.MONGODB_URI);
  await mg.connect();
  const db = mg.db('edugit');

  const studentsColl = db.collection('students');
  const allStudents = await studentsColl.find({}).sort({ class_name: 1, section: 1, roll_no: 1 }).toArray();
  console.log(`Found ${allStudents.length} total students in MongoDB.`);

  // Group by class and section
  const classMap = new Map();
  for (const s of allStudents) {
    const key = `${s.class_name || 'Unknown'}_${s.section || 'A'}`;
    if (!classMap.has(key)) classMap.set(key, []);
    classMap.get(key).push(s);
  }

  console.log(`Found ${classMap.size} distinct classrooms.`);

  // We want exactly 200 girls across the 18 classes:
  // 18 classes * 11 girls = 198 girls. Plus 2 classes get 12 girls = 200 girls!
  const targetPerClass = [];
  let allocated = 0;
  let clsIndex = 0;
  for (const [key, classStudents] of classMap.entries()) {
    // Determine how many girls for this class
    let girlsForClass = 11;
    if (clsIndex === 0 || clsIndex === 17) {
      // First and last class get 12
      girlsForClass = 12;
    }
    targetPerClass.push({ key, count: girlsForClass, students: classStudents });
    allocated += girlsForClass;
    clsIndex++;
  }

  console.log(`Target allocation plan: Exactly ${allocated} girls will be added replacing 200 boys.\n`);

  const DATA_DIR = path.join(process.cwd(), 'data');
  const MEDIA_DIR = path.join(DATA_DIR, 'media');
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }

  let girlsConvertedCount = 0;
  const nameUpdatesMap = new Map(); // studentId -> { oldName, newName, admissionNo }

  for (const item of targetPerClass) {
    const { key, count, students } = item;
    // We choose every second/third student up to count
    // e.g. alternate indices: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23 (approx half)
    const indicesToConvert = [];
    for (let i = 0; i < students.length && indicesToConvert.length < count; i++) {
      // Pick even/odd positions nicely spread out
      if (i % 2 === 1 || indicesToConvert.length + (students.length - i) <= count) {
        indicesToConvert.push(i);
      }
    }

    console.log(`Class ${key} (${students.length} students): converting ${indicesToConvert.length} students to girls.`);

    for (const idx of indicesToConvert) {
      const student = students[idx];
      const girlNameIndex = girlsConvertedCount;
      const girlFirstName = FIRST_NAMES_FEMALE[girlNameIndex % FIRST_NAMES_FEMALE.length];

      // Extract existing last name
      const nameParts = (student.full_name || '').trim().split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Sharma';

      const newFullName = `${girlFirstName} ${lastName}`;
      const fatherFirstName = FATHER_FIRST_NAMES[girlNameIndex % FATHER_FIRST_NAMES.length];
      const motherFirstName = MOTHER_FIRST_NAMES[girlNameIndex % MOTHER_FIRST_NAMES.length];
      const fatherName = `Mr. ${fatherFirstName} ${lastName}`;
      const motherName = `Mrs. ${motherFirstName} ${lastName}`;
      const guardianName = fatherName;
      const guardianEmail = `${girlFirstName.toLowerCase()}.${lastName.toLowerCase()}${girlNameIndex > 50 ? (girlNameIndex % 100) : ''}@gmail.com`;

      // Generate female SVG avatar
      const avatarSvg = generateFemaleSvgAvatar(newFullName, girlNameIndex);
      const mediaId = `MEDIA-STU-${student.id}`;
      const mediaFile = path.join(MEDIA_DIR, `${mediaId}.json`);
      fs.writeFileSync(mediaFile, JSON.stringify({
        id: mediaId,
        school_id: student.school_id || 'DPS2026',
        entity_type: 'STUDENT_PHOTO',
        entity_id: student.id,
        filename: `${student.admission_no || student.id}.svg`,
        mime_type: 'image/svg+xml',
        data: avatarSvg,
        created_at: new Date().toISOString()
      }), 'utf8');

      // Update student document in MongoDB
      await studentsColl.updateOne(
        { _id: student._id },
        {
          $set: {
            gender: 'Female',
            full_name: newFullName,
            guardian_name: guardianName,
            father_name: fatherName,
            mother_name: motherName,
            guardian_email: guardianEmail,
            avatar: `/api/media/${mediaId}`,
            photo: `/api/media/${mediaId}`,
            updated_at: new Date().toISOString()
          }
        }
      );

      nameUpdatesMap.set(student.id, {
        oldName: student.full_name,
        newName: newFullName,
        admissionNo: student.admission_no
      });

      girlsConvertedCount++;
    }
  }

  console.log(`\n✅ Converted exactly ${girlsConvertedCount} students to Female!`);

  // Now sync related records: fee_invoices and attendance
  console.log('🔄 Syncing fee_invoices with updated student names...');
  let invoicesUpdated = 0;
  for (const [studentId, info] of nameUpdatesMap.entries()) {
    const res = await db.collection('fee_invoices').updateMany(
      { student_id: studentId },
      { $set: { student_name: info.newName } }
    );
    invoicesUpdated += res.modifiedCount;
  }
  console.log(`  ✓ Updated ${invoicesUpdated} fee invoices.`);

  console.log('🔄 Syncing attendance records with updated student names...');
  const attendanceColl = db.collection('attendance');
  const allAttendance = await attendanceColl.find({}).toArray();
  let attDocsUpdated = 0;

  for (const att of allAttendance) {
    let modified = false;
    const records = att.student_records || [];
    for (const rec of records) {
      if (rec.student_id && nameUpdatesMap.has(rec.student_id)) {
        rec.full_name = nameUpdatesMap.get(rec.student_id).newName;
        modified = true;
      }
    }
    if (modified) {
      await attendanceColl.updateOne(
        { _id: att._id },
        { $set: { student_records: records } }
      );
      attDocsUpdated++;
    }
  }
  console.log(`  ✓ Updated ${attDocsUpdated} attendance registers.`);

  // Also sync the entire fresh dataset into local store `data/erp_store.json`
  console.log('💾 Syncing complete database into local store (data/erp_store.json)...');
  const freshStudents = await studentsColl.find({}).toArray();
  const freshSchools = await db.collection('schools').find({}).toArray();
  const freshClasses = await db.collection('classes').find({}).toArray();
  const freshTeachers = await db.collection('teachers').find({}).toArray();
  const freshAttendance = await db.collection('attendance').find({}).toArray();
  const freshFeeInvoices = await db.collection('fee_invoices').find({}).toArray();
  const freshHolidays = await db.collection('holidays').find({}).toArray();
  const freshNotices = await db.collection('notices').find({}).toArray();

  let localStore = {};
  try {
    if (fs.existsSync('data/erp_store.json')) {
      localStore = JSON.parse(fs.readFileSync('data/erp_store.json', 'utf8'));
    }
  } catch (e) {}

  localStore.schools = freshSchools.map(s => { const { _id, ...rest } = s; return rest; });
  localStore.classes = freshClasses.map(c => { const { _id, ...rest } = c; return rest; });
  localStore.teachers = freshTeachers.map(t => { const { _id, ...rest } = t; return rest; });
  localStore.students = freshStudents.map(s => { const { _id, ...rest } = s; return rest; });
  localStore.attendance = freshAttendance.map(a => { const { _id, ...rest } = a; return rest; });
  localStore.fee_invoices = freshFeeInvoices.map(f => { const { _id, ...rest } = f; return rest; });
  localStore.holidays = freshHolidays.map(h => { const { _id, ...rest } = h; return rest; });
  localStore.notices = freshNotices.map(n => { const { _id, ...rest } = n; return rest; });

  fs.writeFileSync('data/erp_store.json', JSON.stringify(localStore, null, 2), 'utf8');
  console.log('  ✓ data/erp_store.json successfully synced.');

  // Final verification counts
  console.log('\n========================================================');
  console.log('📊 FINAL VERIFICATION COUNTS:');
  console.log('========================================================');
  const finalStudents = await studentsColl.find({}).toArray();
  const finalGenders = {};
  finalStudents.forEach(s => {
    finalGenders[s.gender] = (finalGenders[s.gender] || 0) + 1;
  });
  console.log(`Total students in DB : ${finalStudents.length}`);
  console.log(`Gender breakdown     :`, finalGenders);

  // Per class breakdown
  console.log('\nPer-class Gender Breakdown:');
  const perClassGender = {};
  finalStudents.forEach(s => {
    const k = `${s.class_name} - Sec ${s.section}`;
    if (!perClassGender[k]) perClassGender[k] = { Male: 0, Female: 0, Total: 0 };
    perClassGender[k][s.gender] = (perClassGender[k][s.gender] || 0) + 1;
    perClassGender[k].Total++;
  });
  console.table(perClassGender);

  await mg.close();
  console.log('\n🎉 ALL OPERATIONS COMPLETED SUCCESSFULLY!');
}

run().catch(console.error);
