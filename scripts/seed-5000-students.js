/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP";

const FIRST_NAMES_MALE = [
  "Aarav", "Rudra", "Vivaan", "Advik", "Kabir", "Ananya", "Devansh", "Reyansh", "Atharva", "Krishna",
  "Shaurya", "Dhruv", "Ishaan", "Aayush", "Pranav", "Utkarsh", "Samar", "Vihaan", "Aditya", "Yash",
  "Karan", "Tanmay", "Rohan", "Manav", "Kunal", "Harshit", "Ayush", "Varun", "Nikhil", "Shivam",
  "Arnav", "Tushar", "Siddharth", "Keshav", "Parth", "Madhav", "Raghav", "Gautam", "Abhay", "Chirag",
  "Armaan", "Daksh", "Jayant", "Mayank", "Nirvaan", "Piyush", "Rishabh", "Shlok", "Tejas", "Vedant"
];

const FIRST_NAMES_FEMALE = [
  "Aadhya", "Saanvi", "Ananya", "Diya", "Pari", "Myra", "Anika", "Navya", "Avani", "Riya",
  "Isha", "Kavya", "Sneha", "Tanvi", "Prisha", "Khushi", "Shruti", "Anushka", "Aditi", "Meera",
  "Pooja", "Simran", "Palak", "Divya", "Neha", "Nisha", "Swati", "Rashmi", "Muskan", "Bhavna",
  "Sakshi", "Gauri", "Vanya", "Samaira", "Kriti", "Trisha", "Tara", "Kiara", "Lavanya", "Siya",
  "Ira", "Mahi", "Nandini", "Ahana", "Zoya", "Avanti", "Charvi", "Jhanvi", "Ojaswi", "Ridhima"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Iyer", "Nair", "Patel", "Reddy", "Choudhury",
  "Mishra", "Pandey", "Agarwal", "Bose", "Chatterjee", "Banerjee", "Mukherjee", "Dutta", "Sengupta", "Das",
  "Joshi", "Kulkarni", "Deshmukh", "Patil", "Shinde", "Pawar", "Bhat", "Rao", "Hegde", "Menon",
  "Pillai", "Kurup", "Gowda", "Naidu", "Chauhan", "Rathore", "Rajput", "Yadav", "Malhotra", "Kapoor",
  "Khanna", "Mehta", "Shah", "Jain", "Bhatia", "Grover", "Saxena", "Srivastava", "Tripathi", "Dubey"
];

const CLASSES_CONFIG = [
  { name: "Playgroup", sections: ["A", "B", "C"], fee: 1200 },
  { name: "Nursery", sections: ["A", "B", "C", "D"], fee: 1400 },
  { name: "LKG", sections: ["A", "B", "C", "D"], fee: 1400 },
  { name: "UKG", sections: ["A", "B", "C", "D"], fee: 1500 },
  { name: "Class I", sections: ["A", "B", "C", "D", "E"], fee: 1600 },
  { name: "Class II", sections: ["A", "B", "C", "D", "E"], fee: 1600 },
  { name: "Class III", sections: ["A", "B", "C", "D", "E"], fee: 1700 },
  { name: "Class IV", sections: ["A", "B", "C", "D", "E"], fee: 1700 },
  { name: "Class V", sections: ["A", "B", "C", "D", "E", "F"], fee: 1800 },
  { name: "Class VI", sections: ["A", "B", "C", "D", "E", "F"], fee: 1900 },
  { name: "Class VII", sections: ["A", "B", "C", "D", "E", "F"], fee: 2000 },
  { name: "Class VIII", sections: ["A", "B", "C", "D", "E", "F"], fee: 2100 },
  { name: "Class IX", sections: ["A", "B", "C", "D", "E", "F"], fee: 2300 },
  { name: "Class X", sections: ["A", "B", "C", "D", "E", "F"], fee: 2500 },
  { name: "Class XI Science", sections: ["A", "B", "C"], fee: 2800 },
  { name: "Class XI Commerce", sections: ["A", "B"], fee: 2700 },
  { name: "Class XI Humanities", sections: ["A", "B"], fee: 2600 },
  { name: "Class XII Science", sections: ["A", "B", "C"], fee: 3000 },
  { name: "Class XII Commerce", sections: ["A", "B"], fee: 2900 },
  { name: "Class XII Humanities", sections: ["A", "B"], fee: 2800 }
];

const TEACHER_SUBJECTS = [
  { subject: "English Core & Literature", designation: "PGT English", qual: "M.A. English, B.Ed" },
  { subject: "Mathematics & Applied Maths", designation: "PGT Mathematics", qual: "M.Sc Mathematics, B.Ed" },
  { subject: "Physics & Astronomy", designation: "PGT Physics", qual: "M.Sc Physics, B.Ed" },
  { subject: "Chemistry & Bio-Chemistry", designation: "PGT Chemistry", qual: "M.Sc Chemistry, B.Ed" },
  { subject: "Biology & Biotechnology", designation: "PGT Biology", qual: "M.Sc Zoology/Botany, B.Ed" },
  { subject: "Accountancy & Financial Mkts", designation: "PGT Commerce", qual: "M.Com, B.Ed" },
  { subject: "Business Studies & Mgmt", designation: "PGT Business Studies", qual: "M.Com / MBA, B.Ed" },
  { subject: "Economics & Statistics", designation: "PGT Economics", qual: "M.A. Economics, B.Ed" },
  { subject: "Computer Science & Python", designation: "PGT Computer Science", qual: "MCA / M.Tech (CS)" },
  { subject: "Artificial Intelligence & Robotics", designation: "PGT AI & IT", qual: "B.Tech (CS) / MCA" },
  { subject: "History & Heritage Studies", designation: "PGT History", qual: "M.A. History, B.Ed" },
  { subject: "Political Science & Civics", designation: "PGT Pol Science", qual: "M.A. Pol Sci, B.Ed" },
  { subject: "Geography & Earth Sciences", designation: "PGT Geography", qual: "M.A. Geography, B.Ed" },
  { subject: "Hindi Sahitya & Vyakaran", designation: "TGT Hindi", qual: "M.A. Hindi, B.Ed" },
  { subject: "Sanskrit Language", designation: "TGT Sanskrit", qual: "M.A. Sanskrit, B.Ed" },
  { subject: "General Science & Labs", designation: "TGT Science", qual: "B.Sc, B.Ed" },
  { subject: "Social Science", designation: "TGT Social Science", qual: "B.A. (Hons), B.Ed" },
  { subject: "Primary All-Rounder (PRT)", designation: "PRT Primary Teacher", qual: "B.A./B.Sc, D.El.Ed / B.Ed" },
  { subject: "Physical Education & Yoga", designation: "PET Sports Coach", qual: "M.P.Ed / B.P.Ed" },
  { subject: "Art & Craft / Visual Design", designation: "Art Faculty", qual: "B.F.A. / M.F.A." },
  { subject: "Music & Performing Arts", designation: "Music Faculty", qual: "M.Mus / Sangeet Visharad" },
  { subject: "Child Psychology & Guidance", designation: "School Counselor", qual: "M.A. Clinical Psychology" },
  { subject: "Inclusive Education & Remedial", designation: "Special Educator", qual: "B.Ed Special Education" }
];

async function generateAndSync() {
  console.log('====================================================');
  console.log('STARTING CBSE DEMO DATA GENERATION: 5,000 STUDENTS & 180 FACULTY');
  console.log('====================================================');

  const schoolId = 'DPS2026';
  const academicSession = '2026-27';

  // 1. Generate 180 CBSE Faculty
  console.log('1. Generating 180 Qualified Faculty Members according to CBSE STR Norms...');
  const teachers = [];
  for (let i = 1; i <= 180; i++) {
    const isMale = i % 2 === 0;
    const fName = isMale ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
    const lName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const subjConf = TEACHER_SUBJECTS[(i - 1) % TEACHER_SUBJECTS.length];
    const empCode = `DPS-EMP-${String(i).padStart(3, '0')}`;
    const exp = 3 + (i % 18);
    const basicPay = 44900 + (exp * 1400);

    teachers.push({
      id: `TEA${String(i).padStart(4, '0')}`,
      school_id: schoolId,
      employee_code: empCode,
      name: `${fName} ${lName}`,
      designation: subjConf.designation,
      subject: subjConf.subject,
      qualification: subjConf.qual,
      phone: `+91 ${9811000000 + i}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@dps2026.edu`,
      status: 'Active',
      academic_session: academicSession,
      oasis_id: `OASIS-${84000 + i}`,
      pan_no: `ABCDE${String(1000 + i).slice(-4)}F`,
      experience_years: exp,
      basic_pay: basicPay,
      ctc_annual: (basicPay * 1.6) * 12,
      created_at: new Date(Date.now() - (i * 86400000)).toISOString()
    });
  }

  // 2. Generate Classes and Class Rooms
  console.log('2. Generating Class Rooms and Sections...');
  const classes = [];
  let totalSections = 0;
  CLASSES_CONFIG.forEach((c) => {
    c.sections.forEach((sec, sIdx) => {
      totalSections++;
      const classTeacher = teachers[(totalSections - 1) % teachers.length];
      classes.push({
        id: `CLS-${c.name.replace(/\s+/g, '')}-${sec}`,
        school_id: schoolId,
        name: c.name,
        section: sec,
        class_teacher_id: classTeacher.id,
        class_teacher_name: classTeacher.name,
        room_no: `Room ${100 + totalSections}`,
        capacity: 45,
        academic_session: academicSession,
        monthly_tuition_fee: c.fee
      });
    });
  });

  // 3. Generate 5,000 Students Distributed Across All Sections
  console.log(`3. Generating 5,000 Students across ${classes.length} Class Sections...`);
  const students = [];
  const invoices = [];
  const attendance = [];

  const targetStudentCount = 5000;
  const studentsPerSection = Math.ceil(targetStudentCount / classes.length);

  let currentStudentNumber = 1;

  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx];
    const sectionQuota = (cIdx === classes.length - 1) 
      ? (targetStudentCount - (currentStudentNumber - 1)) 
      : studentsPerSection;

    for (let r = 1; r <= sectionQuota && currentStudentNumber <= targetStudentCount; r++) {
      const isMale = currentStudentNumber % 2 === 0;
      const fName = isMale ? FIRST_NAMES_MALE[currentStudentNumber % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[currentStudentNumber % FIRST_NAMES_FEMALE.length];
      const lName = LAST_NAMES[(currentStudentNumber * 7) % LAST_NAMES.length];
      const fatherFName = FIRST_NAMES_MALE[(currentStudentNumber + 3) % FIRST_NAMES_MALE.length];
      const motherFName = FIRST_NAMES_FEMALE[(currentStudentNumber + 5) % FIRST_NAMES_FEMALE.length];

      const admNo = `DPS2026${String(currentStudentNumber).padStart(4, '0')}`;
      const stuId = `STU${String(currentStudentNumber).padStart(4, '0')}`;

      // Fee status realistic distribution (85% paid, 15% pending)
      const hasPaid = currentStudentNumber % 7 !== 0;
      const feeStatus = hasPaid ? 'PAID' : 'PENDING';

      const student = {
        id: stuId,
        school_id: schoolId,
        admission_no: admNo,
        roll_no: String(r),
        full_name: `${fName} ${lName}`,
        class_name: cls.name,
        section: cls.section,
        gender: isMale ? 'Male' : 'Female',
        father_name: `${fatherFName} ${lName}`,
        mother_name: `${motherFName} ${lName}`,
        guardian_name: `${fatherFName} ${lName}`,
        emergency_contact: `+91 ${9820000000 + currentStudentNumber}`,
        guardian_phone: `+91 ${9820000000 + currentStudentNumber}`,
        dob: `201${Math.max(0, 8 - Math.floor(cIdx / 3))}-${String(1 + (currentStudentNumber % 12)).padStart(2, '0')}-${String(1 + (currentStudentNumber % 28)).padStart(2, '0')}`,
        blood_group: ['A+', 'B+', 'O+', 'AB+', 'O-'][(currentStudentNumber) % 5],
        address: `House #${10 + (currentStudentNumber % 900)}, Sector ${1 + (currentStudentNumber % 24)}, New Delhi`,
        apaar_id: `APAAR-2026-${String(100000 + currentStudentNumber)}`,
        pen_no: `PEN2026${String(100000 + currentStudentNumber)}`,
        aadhaar_no: `XXXX-XXXX-${String(1000 + (currentStudentNumber % 9000))}`,
        fee_status: feeStatus,
        attendance_percent: hasPaid ? 94 : 88,
        status: 'ACTIVE',
        passcode: '123456',
        academic_session: academicSession,
        created_at: new Date(Date.now() - (currentStudentNumber * 3600000)).toISOString()
      };

      students.push(student);

      // Create Fee Invoice
      const tuitionAmt = cls.monthly_tuition_fee || 1600;
      const invId = `INV-${admNo}-Q1`;
      invoices.push({
        id: invId,
        invoice_no: `DPS-2026-INV-${String(currentStudentNumber).padStart(5, '0')}`,
        school_id: schoolId,
        student_id: stuId,
        student_name: student.full_name,
        admission_no: admNo,
        class_name: cls.name,
        section: cls.section,
        title: `Tuition Fee Quarter 1 (Apr - Jun 2026)`,
        amount: tuitionAmt * 3,
        paid_amount: hasPaid ? tuitionAmt * 3 : 0,
        due_date: '2026-04-15',
        payment_date: hasPaid ? '2026-04-10' : undefined,
        payment_mode: hasPaid ? (currentStudentNumber % 2 === 0 ? 'UPI / NetBanking' : 'Debit Card') : undefined,
        status: feeStatus,
        receipt_no: hasPaid ? `RCP-${20260000 + currentStudentNumber}` : undefined,
        academic_session: academicSession
      });

      currentStudentNumber++;
    }
  }

  console.log(`Generated: ${students.length} Students, ${teachers.length} Teachers, ${classes.length} Classes, ${invoices.length} Fee Invoices.`);

  // 4. Save to local data/erp_store.json
  console.log('4. Saving entire dataset to data/erp_store.json...');
  const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
  let existingStore = {};
  if (fs.existsSync(storePath)) {
    try {
      existingStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch (e) {}
  }

  const updatedStore = {
    ...existingStore,
    schools: existingStore.schools?.length ? existingStore.schools : [{
      id: schoolId,
      school_code: schoolId,
      school_name: "Delhi Public International School",
      board: "CBSE",
      city: "New Delhi",
      state: "Delhi",
      principal_name: "Dr. Abhishek Shukla",
      admin_id: "admin",
      admin_name: "Dr. Abhishek Shukla",
      admin_pin: "123456",
      status: "ACTIVE",
      academic_session: academicSession,
      created_at: new Date().toISOString()
    }],
    students: students,
    teachers: teachers,
    classes: classes,
    fee_invoices: invoices
  };

  fs.writeFileSync(storePath, JSON.stringify(updatedStore, null, 2), 'utf8');
  console.log('✅ Local erp_store.json updated successfully!');

  // 5. Sync to MongoDB Atlas Cloud Database in optimized batches
  console.log('5. Connecting to MongoDB Atlas Cloud Database and Syncing Collections in Bulk...');
  try {
    const client = new MongoClient(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });

    await client.connect();
    console.log('✅ Connected to MongoDB Atlas Cloud!');
    const db = client.db('edugit');

    // Sync Schools
    if (updatedStore.schools?.length) {
      const ops = updatedStore.schools.map(s => {
        const { _id, ...rest } = s;
        return { updateOne: { filter: { id: s.id }, update: { $set: rest }, upsert: true } };
      });
      await db.collection('schools').bulkWrite(ops);
      console.log(`✅ MongoDB Atlas: Synced Schools`);
    }

    // Sync Teachers
    if (teachers.length) {
      console.log(`Uploading ${teachers.length} Faculty to Atlas...`);
      const ops = teachers.map(t => {
        const { _id, ...rest } = t;
        return { updateOne: { filter: { id: t.id }, update: { $set: rest }, upsert: true } };
      });
      await db.collection('teachers').bulkWrite(ops);
      console.log(`✅ MongoDB Atlas: Synced ${teachers.length} Faculty Members`);
    }

    // Sync Classes
    if (classes.length) {
      console.log(`Uploading ${classes.length} Classes to Atlas...`);
      const ops = classes.map(c => {
        const { _id, ...rest } = c;
        return { updateOne: { filter: { id: c.id }, update: { $set: rest }, upsert: true } };
      });
      await db.collection('classes').bulkWrite(ops);
      console.log(`✅ MongoDB Atlas: Synced ${classes.length} Classes`);
    }

    // Sync Students in 1000-doc chunks
    console.log(`Uploading ${students.length} Students to Atlas in chunks...`);
    const chunkSize = 1000;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const ops = chunk.map(s => {
        const { _id, ...rest } = s;
        return { updateOne: { filter: { id: s.id }, update: { $set: rest }, upsert: true } };
      });
      await db.collection('students').bulkWrite(ops);
      console.log(`✅ MongoDB Atlas: Synced Students ${i + 1} to ${Math.min(i + chunkSize, students.length)}`);
    }

    // Sync Fee Invoices in 1000-doc chunks
    console.log(`Uploading ${invoices.length} Fee Invoices to Atlas in chunks...`);
    for (let i = 0; i < invoices.length; i += chunkSize) {
      const chunk = invoices.slice(i, i + chunkSize);
      const ops = chunk.map(f => {
        const { _id, ...rest } = f;
        return { updateOne: { filter: { id: f.id }, update: { $set: rest }, upsert: true } };
      });
      await db.collection('fee_invoices').bulkWrite(ops);
      console.log(`✅ MongoDB Atlas: Synced Fee Invoices ${i + 1} to ${Math.min(i + chunkSize, invoices.length)}`);
    }

    // Final verification
    const countStudents = await db.collection('students').countDocuments({ school_id: schoolId });
    const countTeachers = await db.collection('teachers').countDocuments({ school_id: schoolId });
    const countClasses = await db.collection('classes').countDocuments({ school_id: schoolId });
    const countInvoices = await db.collection('fee_invoices').countDocuments({ school_id: schoolId });

    console.log('\n====================================================');
    console.log('🎉 MONGO DB ATLAS UPLOAD VERIFICATION COMPLETE:');
    console.log(`- Enrolled Students: ${countStudents}`);
    console.log(`- CBSE Faculty:     ${countTeachers}`);
    console.log(`- Classes/Sections: ${countClasses}`);
    console.log(`- Fee Invoices:     ${countInvoices}`);
    console.log('====================================================\n');

    await client.close();
  } catch (err) {
    console.error('MongoDB Atlas Bulk Upload Error:', err.message);
  }
}

generateAndSync().catch(console.error);
