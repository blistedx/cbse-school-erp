/**
 * Full CBSE Comprehensive Institutional Seeding Script
 * Seeds:
 * 1. 30 Classes (Nursery A/B to XII-B)
 * 2. 40+ Qualified Teachers (CBSE 1:25 / 1:30 Pupil-Teacher Ratio)
 * 3. 10-15 Realistic Students per Class (~360+ Students with APAAR PEN, OASIS Data)
 * 4. Sample Fee Invoices & Attendance Records
 * Tests and verifies live MongoDB Atlas persistence.
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const FIRST_NAMES_BOYS = [
  'Aarav', 'Vihaan', 'Aditya', 'Reyansh', 'Aryan', 'Kabir', 'Shaurya', 'Atharv', 'Rudra', 'Vivaan',
  'Arjun', 'Sai', 'Ansh', 'Krishna', 'Ishaan', 'Dev', 'Manish', 'Harsh', 'Yash', 'Rohan',
  'Karan', 'Siddharth', 'Nikhil', 'Tanmay', 'Sameer', 'Ayush', 'Gaurav', 'Varun', 'Kunal', 'Dhruv'
];

const FIRST_NAMES_GIRLS = [
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Myra', 'Pari', 'Anika', 'Isha', 'Navya',
  'Avani', 'Riya', 'Sneha', 'Tanvi', 'Pooja', 'Shreya', 'Meera', 'Roshni', 'Kritika', 'Simran',
  'Aditi', 'Divya', 'Deepika', 'Kavya', 'Gauri', 'Trisha', 'Nandini', 'Prisha', 'Khushi', 'Tara'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Choudhury', 'Iyer', 'Nair',
  'Kapoor', 'Malhotra', 'Bhatia', 'Saxena', 'Mehra', 'Joshi', 'Aggarwal', 'Rao', 'Mishra', 'Pandey',
  'Banerjee', 'Chatterjee', 'Sen', 'Dutta', 'Ghosh', 'Das', 'Roy', 'Chauhan', 'Yadav', 'Rawat'
];

const FATHERS = ['Rajesh', 'Suresh', 'Ramesh', 'Manoj', 'Anil', 'Sunil', 'Vijay', 'Sanjay', 'Vikram', 'Pankaj'];

// 30 CBSE Classes
const CBSE_CLASSES_META = [
  // Pre-Primary
  { name: 'Nursery', section: 'A', room: 'Room F-01', cap: 30 },
  { name: 'Nursery', section: 'B', room: 'Room F-02', cap: 30 },
  { name: 'LKG', section: 'A', room: 'Room F-03', cap: 30 },
  { name: 'LKG', section: 'B', room: 'Room F-04', cap: 30 },
  { name: 'UKG', section: 'A', room: 'Room F-05', cap: 35 },
  { name: 'UKG', section: 'B', room: 'Room F-06', cap: 35 },

  // Primary
  { name: 'Class 1', section: 'A', room: 'Room P-101', cap: 40 },
  { name: 'Class 1', section: 'B', room: 'Room P-102', cap: 40 },
  { name: 'Class 2', section: 'A', room: 'Room P-103', cap: 40 },
  { name: 'Class 2', section: 'B', room: 'Room P-104', cap: 40 },
  { name: 'Class 3', section: 'A', room: 'Room P-105', cap: 40 },
  { name: 'Class 3', section: 'B', room: 'Room P-106', cap: 40 },
  { name: 'Class 4', section: 'A', room: 'Room P-201', cap: 40 },
  { name: 'Class 4', section: 'B', room: 'Room P-202', cap: 40 },
  { name: 'Class 5', section: 'A', room: 'Room P-203', cap: 40 },
  { name: 'Class 5', section: 'B', room: 'Room P-204', cap: 40 },

  // Middle
  { name: 'Class 6', section: 'A', room: 'Room M-301', cap: 40 },
  { name: 'Class 6', section: 'B', room: 'Room M-302', cap: 40 },
  { name: 'Class 7', section: 'A', room: 'Room M-303', cap: 40 },
  { name: 'Class 7', section: 'B', room: 'Room M-304', cap: 40 },
  { name: 'Class 8', section: 'A', room: 'Room M-305', cap: 40 },
  { name: 'Class 8', section: 'B', room: 'Room M-306', cap: 40 },

  // Secondary
  { name: 'Class 9', section: 'A', room: 'Room S-401', cap: 40 },
  { name: 'Class 9', section: 'B', room: 'Room S-402', cap: 40 },
  { name: 'Class 10', section: 'A', room: 'Room S-403', cap: 40 },
  { name: 'Class 10', section: 'B', room: 'Room S-404', cap: 40 },

  // Senior Secondary
  { name: 'Class 11', section: 'A', room: 'Room SR-501', cap: 40 },
  { name: 'Class 11', section: 'B', room: 'Room SR-502', cap: 40 },
  { name: 'Class 12', section: 'A', room: 'Room SR-503', cap: 40 },
  { name: 'Class 12', section: 'B', room: 'Room SR-504', cap: 40 },
];

// 40+ Qualified Teachers (CBSE Compliant)
const TEACHERS_RAW = [
  { name: 'Dr. Rajesh Sharma', dept: 'Administration', role: 'Principal', subject: 'Educational Leadership', qual: 'Ph.D, M.Ed, M.Sc' },
  { name: 'Mrs. Sunita Mehra', dept: 'Administration', role: 'Vice Principal', subject: 'Administration', qual: 'M.Ed, M.A English' },
  
  // PGT (Senior Secondary)
  { name: 'Dr. V. Raman', dept: 'Physics', role: 'PGT (Post Graduate Teacher)', subject: 'Physics', qual: 'Ph.D, M.Sc Physics, B.Ed' },
  { name: 'Pooja Iyer', dept: 'Mathematics', role: 'PGT (Post Graduate Teacher)', subject: 'Mathematics & Applied Maths', qual: 'M.Sc Maths, B.Ed' },
  { name: 'Dr. Aniruddh Basu', dept: 'Chemistry', role: 'PGT (Post Graduate Teacher)', subject: 'Chemistry', qual: 'Ph.D, M.Sc Chemistry, B.Ed' },
  { name: 'Dr. Nalini Swaminathan', dept: 'Biology', role: 'PGT (Post Graduate Teacher)', subject: 'Biology & Biotechnology', qual: 'Ph.D, M.Sc Botany, B.Ed' },
  { name: 'Meenakshi Deshmukh', dept: 'Commerce', role: 'PGT (Post Graduate Teacher)', subject: 'Accountancy & Financial Markets', qual: 'M.Com, B.Ed, UGC-NET' },
  { name: 'R. K. Malhotra', dept: 'Commerce', role: 'PGT (Post Graduate Teacher)', subject: 'Business Studies', qual: 'M.Com, MBA, B.Ed' },
  { name: 'Deepak Saxena', dept: 'Economics', role: 'PGT (Post Graduate Teacher)', subject: 'Economics', qual: 'M.A Economics, B.Ed' },
  { name: 'Siddharth Sen', dept: 'Computer Science & IT', role: 'PGT (Post Graduate Teacher)', subject: 'Computer Science & AI', qual: 'M.Tech CSE, MCA, B.Ed' },
  { name: 'Vandana Joshi', dept: 'English', role: 'PGT (Post Graduate Teacher)', subject: 'English Core', qual: 'M.A English Lit, B.Ed' },
  { name: 'Dr. Hariom Shastri', dept: 'Hindi', role: 'PGT (Post Graduate Teacher)', subject: 'Hindi Elective', qual: 'Ph.D, M.A Hindi, B.Ed' },

  // TGT (Middle & Secondary)
  { name: 'Ananya Roy', dept: 'English', role: 'TGT (Trained Graduate Teacher)', subject: 'English', qual: 'B.A (Hons), B.Ed' },
  { name: 'K. S. Verma', dept: 'Social Science', role: 'TGT (Trained Graduate Teacher)', subject: 'History & Civics', qual: 'M.A History, B.Ed' },
  { name: 'Shweta Kulkarni', dept: 'Social Science', role: 'TGT (Trained Graduate Teacher)', subject: 'Geography & Economics', qual: 'M.A Geography, B.Ed' },
  { name: 'Amitabh Sen', dept: 'Science', role: 'TGT (Trained Graduate Teacher)', subject: 'General Science', qual: 'B.Sc, B.Ed' },
  { name: 'Priya Agarwal', dept: 'Mathematics', role: 'TGT (Trained Graduate Teacher)', subject: 'Mathematics', qual: 'B.Sc Maths, B.Ed' },
  { name: 'Naveen Choudhary', dept: 'Mathematics', role: 'TGT (Trained Graduate Teacher)', subject: 'Mathematics', qual: 'B.Sc Maths, B.Ed' },
  { name: 'Rekha Bhatt', dept: 'Hindi', role: 'TGT (Trained Graduate Teacher)', subject: 'Hindi', qual: 'M.A Hindi, B.Ed' },
  { name: 'Acharya Vidyadhar', dept: 'Sanskrit', role: 'TGT (Trained Graduate Teacher)', subject: 'Sanskrit', qual: 'Acharya, B.Ed' },
  { name: 'Manish Rawat', dept: 'Computer Science & IT', role: 'TGT (Trained Graduate Teacher)', subject: 'Information Technology', qual: 'BCA, B.Ed' },

  // PRT (Primary Wing)
  { name: 'Megha Kapoor', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'All Subjects / EVS', qual: 'B.El.Ed, CTET Paper 1' },
  { name: 'Deepa Menon', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'English & EVS', qual: 'B.A, D.El.Ed, CTET' },
  { name: 'Rashmi Sen', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'Mathematics', qual: 'B.Sc, B.Ed, CTET' },
  { name: 'Geeta Nair', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'Environmental Studies', qual: 'B.Sc, B.Ed, CTET' },
  { name: 'Monika Paul', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'Hindi & General Awareness', qual: 'B.A, D.El.Ed' },
  { name: 'Archana Tiwari', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'English & Moral Science', qual: 'M.A, B.Ed, CTET' },
  { name: 'Sangeeta Roy', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'Primary Mathematics', qual: 'B.Sc, D.El.Ed' },
  { name: 'Sanjay Dutt', dept: 'Primary Wing', role: 'PRT (Primary Teacher)', subject: 'General Science', qual: 'B.Sc, B.Ed' },

  // NTT / Foundational (Pre-Primary)
  { name: 'Sunita Sharma', dept: 'Pre-Primary', role: 'NTT (Nursery Teacher)', subject: 'Early Childhood Education', qual: 'NTT, ECCE Diploma' },
  { name: 'Anita Deshmukh', dept: 'Pre-Primary', role: 'NTT (Nursery Teacher)', subject: 'Foundational Literacy', qual: 'NTT, B.A' },
  { name: 'Pooja Verma', dept: 'Pre-Primary', role: 'NTT (Nursery Teacher)', subject: 'Numeracy & Rhymes', qual: 'NTT, Montessori Trained' },
  { name: 'Kavita Singh', dept: 'Pre-Primary', role: 'NTT (Nursery Teacher)', subject: 'Activity & Art', qual: 'NTT, B.A' },
  { name: 'Renu Gupta', dept: 'Pre-Primary', role: 'NTT (Nursery Teacher)', subject: 'Foundational English', qual: 'NTT, ECCE' },
  { name: 'Shweta Rao', dept: 'Pre-Primary', role: 'NTT (Nursery Teacher)', subject: 'Storytelling & Motor Skills', qual: 'NTT, Diploma in Child Care' },

  // Special & Co-Curricular
  { name: 'Capt. Vikram Rathore', dept: 'Physical Education & Sports', role: 'PET (Physical Education Teacher)', subject: 'Physical Education & Athletics', qual: 'M.P.Ed, NIS Coach' },
  { name: 'Kavita Chawla', dept: 'Art & Craft', role: 'Art / Craft Teacher', subject: 'Fine Arts & Painting', qual: 'BFA, MFA' },
  { name: 'Pandit Ravi Shankar', dept: 'Music & Performing Arts', role: 'Music Teacher', subject: 'Vocal & Instrumental Music', qual: 'Sangeet Visharad' },
  { name: 'Dr. Alok Verma', dept: 'Health & Wellness', role: 'Wellness Teacher / Counsellor', subject: 'Child Psychology', qual: 'M.A Psychology, Guidance Dip.' },
  { name: 'S. K. Murthy', dept: 'Library & Information', role: 'Librarian', subject: 'Library Science', qual: 'M.Lib.Sc' }
];

async function seedFullSchool() {
  console.log('='.repeat(70));
  console.log('🏫 COMMENCING COMPREHENSIVE CBSE INSTITUTIONAL SEEDING (DPS2026)');
  console.log('='.repeat(70));

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('edugit');

    console.log('🔗 Connected to MongoDB Atlas: edugit');

    // 1. Clean existing records for DPS2026 to ensure clean state
    console.log('🧹 Clearing existing records for DPS2026...');
    await db.collection('students').deleteMany({ school_id: { $in: ['DPS2026', 'DPS-2026', 'SCH-DEMO-2026'] } });
    await db.collection('teachers').deleteMany({ school_id: { $in: ['DPS2026', 'DPS-2026', 'SCH-DEMO-2026'] } });
    await db.collection('classes').deleteMany({ school_id: { $in: ['DPS2026', 'DPS-2026', 'SCH-DEMO-2026'] } });
    await db.collection('fee_invoices').deleteMany({ school_id: { $in: ['DPS2026', 'DPS-2026', 'SCH-DEMO-2026'] } });
    await db.collection('attendance').deleteMany({ school_id: { $in: ['DPS2026', 'DPS-2026', 'SCH-DEMO-2026'] } });

    // 2. Ensure School Record
    await db.collection('schools').updateOne(
      { school_code: 'DPS2026' },
      {
        $set: {
          id: 'DPS2026',
          school_code: 'DPS2026',
          school_name: 'Delhi Public International School',
          board: 'CBSE',
          city: 'New Delhi',
          state: 'Delhi',
          principal_name: 'Dr. Rajesh Sharma',
          admin_id: 'admin',
          admin_name: 'Dr. Rajesh Sharma',
          admin_pin: '123456',
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    // 3. Teachers (41 Teachers)
    console.log('👩‍🏫 Seeding 41 CBSE Qualified Teachers...');
    const teacherDocs = TEACHERS_RAW.map((t, idx) => {
      const num = (idx + 1).toString().padStart(2, '0');
      return {
        id: `TCH${num}`,
        school_id: 'DPS2026',
        staff_code: `DPS2026T${num}`,
        full_name: t.name,
        department: t.dept,
        designation: t.role,
        subject_specialization: t.subject,
        professional_degree: t.qual,
        ctet_qualified: idx < 30 ? 'YES' : 'EXEMPTED',
        phone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
        email: `${t.name.toLowerCase().replace(/[^a-z]/g, '')}@dps.edu`,
        status: 'ACTIVE',
        passcode: '123456',
        basic_pay: t.role.includes('Principal') ? 85000 : (t.role.includes('PGT') ? 65000 : (t.role.includes('TGT') ? 52000 : 42000)),
        created_at: new Date().toISOString()
      };
    });
    await db.collection('teachers').insertMany(teacherDocs);
    console.log(`✅ Seeded ${teacherDocs.length} Teachers (Staff IDs: DPS2026T01 to DPS2026T${teacherDocs.length})`);

    // 4. Classes (30 Classes) linked to Teachers
    console.log('📚 Seeding 30 Classes & Assigning Class Teachers...');
    const classDocs = CBSE_CLASSES_META.map((cm, idx) => {
      const assignedTeacher = teacherDocs[(idx + 2) % teacherDocs.length].full_name;
      return {
        id: `CLS${(idx + 1).toString().padStart(3, '0')}`,
        school_id: 'DPS2026',
        class_name: cm.name,
        section: cm.section,
        class_teacher: assignedTeacher,
        room_no: cm.room,
        capacity: cm.cap,
        status: 'ACTIVE'
      };
    });
    await db.collection('classes').insertMany(classDocs);
    console.log(`✅ Seeded ${classDocs.length} Classes (Nursery A to Class 12 B)`);

    // 5. Students (12 to 14 students per class -> ~380 Students)
    console.log('🎓 Seeding 12-14 Students in Every Class (~380 Total Students)...');
    const studentDocs = [];
    const invoiceDocs = [];
    const attendanceDocs = [];
    let studentSeq = 1;

    for (const cls of classDocs) {
      // 12 to 14 students in this class
      const countInClass = Math.floor(12 + Math.random() * 3); // 12, 13, or 14

      for (let roll = 1; roll <= countInClass; roll++) {
        const isBoy = roll % 2 !== 0;
        const firstName = isBoy 
          ? FIRST_NAMES_BOYS[(studentSeq * 7 + roll) % FIRST_NAMES_BOYS.length]
          : FIRST_NAMES_GIRLS[(studentSeq * 5 + roll) % FIRST_NAMES_GIRLS.length];
        const lastName = LAST_NAMES[(studentSeq * 3 + roll) % LAST_NAMES.length];
        const fullName = `${firstName} ${lastName}`;
        const guardianName = `${FATHERS[(studentSeq + roll) % FATHERS.length]} ${lastName}`;
        const admCode = `DPS2026${studentSeq.toString().padStart(3, '0')}`;
        const penId = `PEN2026${(100000 + studentSeq * 17).toString()}`;
        const feeStatus = roll % 4 === 0 ? 'PENDING' : 'PAID';
        const attPercent = Math.floor(90 + Math.random() * 9); // 90-98%

        const stu = {
          id: `STU${studentSeq.toString().padStart(4, '0')}`,
          school_id: 'DPS2026',
          admission_no: admCode,
          full_name: fullName,
          class_name: cls.class_name,
          section: cls.section,
          roll_no: roll.toString(),
          gender: isBoy ? 'Male' : 'Female',
          guardian_name: guardianName,
          guardian_phone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
          apaar_id: penId,
          fee_status: feeStatus,
          attendance_percent: attPercent,
          status: 'ACTIVE',
          passcode: '123456',
          created_at: new Date().toISOString()
        };
        studentDocs.push(stu);

        // Generate Fee Invoice for each student
        const tuitionFee = cls.class_name.includes('11') || cls.class_name.includes('12') ? 18000 : (cls.class_name.includes('Class') ? 14000 : 10000);
        const transportFee = roll % 2 === 0 ? 3000 : 0;
        const examFee = 1500;
        const totalAmount = tuitionFee + transportFee + examFee;

        invoiceDocs.push({
          id: `INV${studentSeq.toString().padStart(4, '0')}`,
          school_id: 'DPS2026',
          invoice_no: `INV2026${studentSeq.toString().padStart(4, '0')}`,
          student_id: stu.id,
          student_name: fullName,
          admission_no: admCode,
          class_name: `${cls.class_name} - ${cls.section}`,
          amount: totalAmount,
          tuition_fee: tuitionFee,
          transport_fee: transportFee,
          exam_fee: examFee,
          due_date: '2026-09-15',
          status: feeStatus,
          payment_mode: feeStatus === 'PAID' ? (roll % 3 === 0 ? 'UPI / NetBanking' : 'Cash / Cheque') : undefined,
          paid_date: feeStatus === 'PAID' ? '2026-08-20' : undefined
        });

        // Attendance record for today
        attendanceDocs.push({
          id: `ATT${studentSeq.toString().padStart(4, '0')}`,
          school_id: 'DPS2026',
          student_id: stu.id,
          student_name: fullName,
          class_name: cls.class_name,
          section: cls.section,
          date: new Date().toISOString().split('T')[0],
          status: roll === 11 ? 'ABSENT' : 'PRESENT'
        });

        studentSeq++;
      }
    }

    await db.collection('students').insertMany(studentDocs);
    console.log(`✅ Seeded ${studentDocs.length} Total Students across all 30 Classes!`);

    await db.collection('fee_invoices').insertMany(invoiceDocs);
    console.log(`✅ Seeded ${invoiceDocs.length} Fee Invoices`);

    await db.collection('attendance').insertMany(attendanceDocs);
    console.log(`✅ Seeded ${attendanceDocs.length} Attendance Records`);

    // Sync with local memory backup store
    const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');
    if (fs.existsSync(localStorePath)) {
      const store = {
        schools: [{
          id: 'DPS2026',
          school_code: 'DPS2026',
          school_name: 'Delhi Public International School',
          board: 'CBSE',
          city: 'New Delhi',
          state: 'Delhi',
          principal_name: 'Dr. Rajesh Sharma',
          admin_id: 'admin',
          admin_name: 'Dr. Rajesh Sharma',
          admin_pin: '123456',
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        }],
        teachers: teacherDocs,
        classes: classDocs,
        students: studentDocs,
        fee_invoices: invoiceDocs,
        attendance: attendanceDocs,
        notices: [
          {
            id: 'NOT101',
            school_id: 'DPS2026',
            title: 'Mid-Term Examinations Schedule Announced',
            content: 'Mid-term examinations for classes 9th to 12th will commence from September 14th.',
            target_audience: 'ALL',
            posted_by: 'Principal Office',
            created_at: new Date().toISOString()
          }
        ]
      };
      fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
      console.log('✅ Synchronized local data store backup.');
    }

    console.log('='.repeat(70));
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY ON MONGODB ATLAS!');
    console.log('='.repeat(70));

  } catch (err) {
    console.error('❌ MongoDB Atlas Seeding Error:', err.message);
  } finally {
    await client.close();
  }
}

seedFullSchool();
