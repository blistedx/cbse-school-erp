/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const FIRST_NAMES_MALE = [
  "Aarav", "Rudra", "Vivaan", "Advik", "Kabir", "Devansh", "Reyansh", "Atharva", "Krishna", "Shaurya",
  "Dhruv", "Ishaan", "Aayush", "Pranav", "Utkarsh", "Samar", "Vihaan", "Aditya", "Yash", "Karan",
  "Tanmay", "Rohan", "Manav", "Kunal", "Harshit", "Ayush", "Varun", "Nikhil", "Shivam", "Arnav",
  "Tushar", "Siddharth", "Keshav", "Parth", "Madhav", "Raghav", "Gautam", "Abhay", "Chirag", "Armaan",
  "Daksh", "Jayant", "Mayank", "Nirvaan", "Piyush", "Rishabh", "Shlok", "Tejas", "Vedant", "Hrithik"
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

const LOCALITIES = [
  "Sector 12, R.K. Puram, New Delhi", "Vasant Vihar, New Delhi", "Hauz Khas Enclave, New Delhi",
  "Safdarjung Enclave, New Delhi", "Green Park Main, New Delhi", "Greater Kailash I, New Delhi",
  "South Extension II, New Delhi", "Saket, New Delhi", "Malviya Nagar, New Delhi",
  "Chanakyapuri, New Delhi", "Gulmohar Park, New Delhi", "Vasant Kunj Sector B, New Delhi"
];

const TEACHER_PROFILES = [
  { name: "Dr. Aniruddh Shastri", gender: "Male", role: "Vice Principal & HOD Science", qual: "Ph.D Physics, M.Sc, B.Ed", exp: 22, dept: "Science", sub: "Physics" },
  { name: "Mrs. Sunita Deshpande", gender: "Female", role: "PGT Mathematics & Academic Head", qual: "M.Sc Mathematics, B.Ed", exp: 18, dept: "Mathematics", sub: "Mathematics" },
  { name: "Dr. Meenakshi Sundaram", gender: "Female", role: "PGT Chemistry & Lab Superintendent", qual: "Ph.D Chemistry, B.Ed", exp: 16, dept: "Science", sub: "Chemistry" },
  { name: "Mr. Rajeshwar Chauhan", gender: "Male", role: "PGT Biology & Eco Club In-charge", qual: "M.Sc Botany, B.Ed", exp: 15, dept: "Science", sub: "Biology" },
  { name: "Mrs. Shalini Saxena", gender: "Female", role: "PGT English & Literary Society Dean", qual: "M.A. English Lit, B.Ed", exp: 17, dept: "Languages", sub: "English Core" },
  { name: "Mr. Vikramaditya Rathore", gender: "Male", role: "PGT Accountancy & Financial Studies", qual: "M.Com, FCA, B.Ed", exp: 14, dept: "Commerce", sub: "Accountancy" },
  { name: "Mrs. Preeti Kulkarni", gender: "Female", role: "PGT Business Studies & Career Counselor", qual: "MBA, M.Com, B.Ed", exp: 13, dept: "Commerce", sub: "Business Studies" },
  { name: "Mr. Alok Nath Mishra", gender: "Male", role: "PGT Economics & Statistics", qual: "M.A. Economics, B.Ed", exp: 12, dept: "Commerce", sub: "Economics" },
  { name: "Mrs. Divya Chandrasekhar", gender: "Female", role: "PGT Computer Science & AI Lab Head", qual: "M.Tech CSE, B.Ed", exp: 11, dept: "Computer Science", sub: "Computer Science" },
  { name: "Mr. Hemant Bhattacharya", gender: "Male", role: "TGT Mathematics", qual: "M.Sc Maths, B.Ed", exp: 9, dept: "Mathematics", sub: "Maths" },
  { name: "Mrs. Vandana Agnihotri", gender: "Female", role: "TGT Science & STEM Coordinator", qual: "M.Sc Physics, B.Ed", exp: 10, dept: "Science", sub: "Science" },
  { name: "Mr. Suresh Gopinath", gender: "Male", role: "TGT Social Science & Model UN Advisor", qual: "M.A. History, B.Ed", exp: 11, dept: "Social Studies", sub: "Social Science" },
  { name: "Mrs. Neerja Kaushik", gender: "Female", role: "TGT Hindi Sahitya", qual: "M.A. Hindi, B.Ed", exp: 14, dept: "Languages", sub: "Hindi" },
  { name: "Mrs. Ritu Singhal", gender: "Female", role: "TGT English Language", qual: "M.A. English, B.Ed", exp: 8, dept: "Languages", sub: "English" },
  { name: "Mrs. Anupama Mukherjee", gender: "Female", role: "PRT Primary Coordinator", qual: "B.Sc, B.Ed", exp: 12, dept: "Primary", sub: "General Science" },
  { name: "Mrs. Geetika Malhotra", gender: "Female", role: "PRT Primary Teacher", qual: "B.A. English, D.El.Ed", exp: 7, dept: "Primary", sub: "English" },
  { name: "Mrs. Poonam Joshi", gender: "Female", role: "PRT Mathematics", qual: "B.Sc Maths, B.Ed", exp: 9, dept: "Primary", sub: "Maths" },
  { name: "Mrs. Shweta Bhandari", gender: "Female", role: "PRT EVS & Activity In-charge", qual: "B.A., D.El.Ed", exp: 6, dept: "Primary", sub: "EVS" },
  { name: "Mrs. Rashmi Narang", gender: "Female", role: "Pre-Primary Head (Early Childhood)", qual: "M.A. Child Psychology, NTT", exp: 15, dept: "Pre-Primary", sub: "Foundational Literacy" },
  { name: "Mrs. Suman Lata", gender: "Female", role: "Kindergarten Specialist Teacher", qual: "B.A., Montessori Certified", exp: 8, dept: "Pre-Primary", sub: "Early Numeracy" },
  { name: "Mrs. Barkha Chawla", gender: "Female", role: "Playgroup & Nursery Mentor", qual: "B.A. Education, NTT", exp: 6, dept: "Pre-Primary", sub: "Activity & Play" },
  { name: "Mr. Gurpreet Singh Sandhu", gender: "Male", role: "Director of Physical Education & Sports", qual: "M.P.Ed, NIS Coach", exp: 16, dept: "Physical Education", sub: "Physical Education" },
  { name: "Mrs. Manasi Roy", gender: "Female", role: "Fine Arts & CBSE Visual Arts Mentor", qual: "M.F.A. Fine Arts", exp: 10, dept: "Arts", sub: "Fine Arts" },
  { name: "Pandit Debojyoti Sanyal", gender: "Male", role: "Performing Arts & Indian Classical Music", qual: "M.Mus, Sangeet Visharad", exp: 18, dept: "Music", sub: "Music" }
];

function generateSvgAvatar(name, gender, index) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const maleGradients = [
    ['#1e3a8a', '#3b82f6'],
    ['#065f46', '#10b981'],
    ['#1e293b', '#475569'],
    ['#0f766e', '#14b8a6'],
    ['#4338ca', '#6366f1'],
    ['#701a75', '#d946ef']
  ];
  const femaleGradients = [
    ['#831843', '#ec4899'],
    ['#581c87', '#a855f7'],
    ['#7c2d12', '#f97316'],
    ['#065f46', '#34d399'],
    ['#1e3a8a', '#60a5fa'],
    ['#881337', '#f43f5e']
  ];
  const palette = (gender === 'Female' ? femaleGradients : maleGradients)[index % 6];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="grad-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}"/>
        <stop offset="100%" stop-color="${palette[1]}"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="58" fill="url(#grad-${index})" stroke="#ffffff" stroke-width="3"/>
    <circle cx="60" cy="46" r="22" fill="#ffffff" opacity="0.9"/>
    <path d="M24 104 C24 78 40 72 60 72 C80 72 96 78 96 104 Z" fill="#ffffff" opacity="0.9"/>
    <text x="60" y="52" font-size="14" font-weight="900" font-family="system-ui, sans-serif" fill="${palette[0]}" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function main() {
  console.log('🚀 INITIALIZING CBSE ERP DATASET FOR PLAYGROUP TO CLASS XII');
  console.log('================================================================');

  const schoolId = 'DPS2026';
  const academicSession = '2026-27';

  // 1. Define Classes per specification:
  // - PG to Class X: only ONE section 'A'
  // - Class XI & Class XII: TWO sections 'A' and 'B'
  // - <= 30 students per class (we set 28 students per class)
  const classConfigs = [
    { name: 'Playgroup', sections: ['A'], room: 'Room PG-01', cap: 30, fee: 12500 },
    { name: 'Nursery', sections: ['A'], room: 'Room NUR-01', cap: 30, fee: 13500 },
    { name: 'LKG', sections: ['A'], room: 'Room LKG-01', cap: 30, fee: 13500 },
    { name: 'UKG', sections: ['A'], room: 'Room UKG-01', cap: 30, fee: 14000 },
    { name: 'Class 1', sections: ['A'], room: 'Room 101', cap: 30, fee: 15000 },
    { name: 'Class 2', sections: ['A'], room: 'Room 102', cap: 30, fee: 15000 },
    { name: 'Class 3', sections: ['A'], room: 'Room 103', cap: 30, fee: 15500 },
    { name: 'Class 4', sections: ['A'], room: 'Room 104', cap: 30, fee: 15500 },
    { name: 'Class 5', sections: ['A'], room: 'Room 105', cap: 30, fee: 16000 },
    { name: 'Class 6', sections: ['A'], room: 'Room 201', cap: 30, fee: 17000 },
    { name: 'Class 7', sections: ['A'], room: 'Room 202', cap: 30, fee: 17000 },
    { name: 'Class 8', sections: ['A'], room: 'Room 203', cap: 30, fee: 17500 },
    { name: 'Class 9', sections: ['A'], room: 'Room 301', cap: 30, fee: 19000 },
    { name: 'Class 10', sections: ['A'], room: 'Room 302', cap: 30, fee: 19500 },
    { name: 'Class 11', sections: ['A', 'B'], room: 'Room 401', cap: 30, fee: 22000 },
    { name: 'Class 12', sections: ['A', 'B'], room: 'Room 402', cap: 30, fee: 23500 }
  ];

  // 2. Prepare Local Media Directory
  const DATA_DIR = path.join(process.cwd(), 'data');
  const MEDIA_DIR = path.join(DATA_DIR, 'media');
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }

  // 3. Generate Teachers
  console.log('👩‍🏫 Generating Faculty & Class Teachers...');
  const teachers = [];
  TEACHER_PROFILES.forEach((p, idx) => {
    const tchId = `TCH-DPS-${String(idx + 1).padStart(3, '0')}`;
    const staffCode = `EMP-${202600 + idx + 1}`;
    const photoBase64 = generateSvgAvatar(p.name, p.gender, idx + 100);
    const mediaId = `MEDIA-TCH-${tchId}`;

    // Save to local media vault
    const mediaFile = path.join(MEDIA_DIR, `${mediaId}.json`);
    fs.writeFileSync(mediaFile, JSON.stringify({
      id: mediaId,
      school_id: schoolId,
      entity_type: 'TEACHER_PHOTO',
      entity_id: tchId,
      filename: `${staffCode}.svg`,
      mime_type: 'image/svg+xml',
      data: photoBase64,
      created_at: new Date().toISOString()
    }), 'utf8');

    teachers.push({
      id: tchId,
      school_id: schoolId,
      academic_session: academicSession,
      staff_code: staffCode,
      full_name: p.name,
      designation: p.role,
      department: p.dept,
      subject_specialization: p.sub,
      email: `${p.name.toLowerCase().replace(/[^a-z]/g, '')}@dpsrkp.edu.in`,
      phone: `+91 9811${String(200000 + idx).slice(-6)}`,
      qualification: p.qual,
      experience_years: p.exp,
      gender: p.gender,
      joining_date: '2020-04-01',
      salary: 55000 + (p.exp * 2500),
      attendance_percent: 96 + (idx % 4),
      status: 'ACTIVE',
      photo: `/api/media/${mediaId}`,
      avatar: `/api/media/${mediaId}`,
      created_at: new Date().toISOString()
    });
  });

  // 4. Generate Classrooms with assigned Class Teachers & CBSE Subjects
  console.log('🏫 Generating 18 Standard Classrooms (PG to X with Sec A; XI & XII with Sec A & B)...');
  const classes = [];
  let classCounter = 1;

  classConfigs.forEach((cfg) => {
    cfg.sections.forEach((sec, secIdx) => {
      const clsId = `CLS-DPS-${String(classCounter).padStart(3, '0')}`;
      const teacherIdx = (classCounter - 1) % teachers.length;
      const assignedTeacher = teachers[teacherIdx];
      const roomNumber = sec === 'B' ? `${cfg.room}-B` : cfg.room;

      // Prescribed CBSE subjects based on class & stream
      let subjects = [];
      const norm = cfg.name.toLowerCase();
      if (norm.includes('11') || norm.includes('12')) {
        if (sec === 'B') {
          // Commerce stream
          subjects = [
            { code: '301', name: 'English Core', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
            { code: '054', name: 'Business Studies (BST)', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
            { code: '055', name: 'Accountancy', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
            { code: '030', name: 'Economics', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
            { code: '041', name: 'Mathematics / Applied Maths', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
            { code: '048', name: 'Physical Education (P.Ed)', type: 'ELECTIVE', weekly_periods: 4, max_marks: 100 }
          ];
        } else {
          // Science stream
          subjects = [
            { code: '301', name: 'English Core', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
            { code: '042', name: 'Physics', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
            { code: '043', name: 'Chemistry', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
            { code: '041', name: 'Mathematics', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
            { code: '044', name: 'Biology', type: 'ELECTIVE', weekly_periods: 6, max_marks: 100 },
            { code: '083', name: 'Computer Science', type: 'ELECTIVE', weekly_periods: 5, max_marks: 100 }
          ];
        }
      } else if (norm.includes('9') || norm.includes('10')) {
        subjects = [
          { code: '184', name: 'English Language and Literature', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
          { code: '002', name: 'Hindi Course-A', type: 'LANGUAGE', weekly_periods: 5, max_marks: 100 },
          { code: '041', name: 'Mathematics', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
          { code: '086', name: 'Science', type: 'COMPULSORY', weekly_periods: 7, max_marks: 100 },
          { code: '087', name: 'Social Science (S.St)', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
          { code: '402', name: 'Information Technology (I.T.)', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
        ];
      } else if (norm.includes('6') || norm.includes('7') || norm.includes('8')) {
        subjects = [
          { code: '001', name: 'English', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
          { code: '002', name: 'Hindi', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
          { code: '003', name: 'Maths', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
          { code: '004', name: 'Science', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
          { code: '005', name: 'Social Studies (S.St)', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
          { code: '006', name: 'Computer Applications', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
        ];
      } else if (norm.includes('1') || norm.includes('2') || norm.includes('3') || norm.includes('4') || norm.includes('5')) {
        subjects = [
          { code: '101', name: 'English', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
          { code: '102', name: 'Hindi', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
          { code: '103', name: 'Mathematics', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
          { code: '104', name: 'EVS & Environmental Studies', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
          { code: '105', name: 'Art & Craft', type: 'SKILL', weekly_periods: 4, max_marks: 100 }
        ];
      } else {
        // Pre-Primary: PG, Nursery, LKG, UKG
        subjects = [
          { code: '01', name: 'English Oral & Rhymes', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
          { code: '02', name: 'Hindi Oral & Storytelling', type: 'LANGUAGE', weekly_periods: 6, max_marks: 100 },
          { code: '03', name: 'Number Work & Numeracy', type: 'COMPULSORY', weekly_periods: 6, max_marks: 100 },
          { code: '04', name: 'Creativity, Art & Motor Skills', type: 'SKILL', weekly_periods: 4, max_marks: 50 }
        ];
      }

      classes.push({
        id: clsId,
        school_id: schoolId,
        academic_session: academicSession,
        class_name: cfg.name,
        section: sec,
        capacity: cfg.cap,
        room_no: roomNumber,
        class_teacher_id: assignedTeacher.id,
        class_teacher_name: assignedTeacher.full_name,
        subjects: subjects,
        created_at: new Date().toISOString()
      });

      classCounter++;
    });
  });

  // 5. Generate Students (Strictly <= 30 students per class, setting 28 students per class)
  console.log('👨‍🎓 Generating Students (28 students per class across all 18 classrooms = 504 students)...');
  const students = [];
  const feeInvoices = [];
  let studentGlobalIdx = 1;
  const STUDENTS_PER_CLASS = 28;

  classes.forEach((cls) => {
    const classFee = classConfigs.find(c => c.name === cls.class_name)?.fee || 15000;

    for (let roll = 1; roll <= STUDENTS_PER_CLASS; roll++) {
      const stuId = `STU-DPS-${String(studentGlobalIdx).padStart(4, '0')}`;
      const admNo = `DPS-2026-${String(studentGlobalIdx).padStart(4, '0')}`;
      const isMale = (studentGlobalIdx + roll) % 2 === 0;
      const firstName = isMale
        ? FIRST_NAMES_MALE[(studentGlobalIdx * 3 + roll) % FIRST_NAMES_MALE.length]
        : FIRST_NAMES_FEMALE[(studentGlobalIdx * 3 + roll) % FIRST_NAMES_FEMALE.length];
      const lastName = LAST_NAMES[(studentGlobalIdx * 7 + roll) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const guardianName = isMale ? `Mr. Rajesh ${lastName}` : `Mr. Sunil ${lastName}`;
      const locality = LOCALITIES[studentGlobalIdx % LOCALITIES.length];
      const isPaid = (studentGlobalIdx % 5) !== 0; // 80% paid
      const attPercent = 88 + ((studentGlobalIdx + roll) % 11); // 88% - 98%

      // Create profile picture & store in local media vault
      const avatarSvg = generateSvgAvatar(fullName, isMale ? 'Male' : 'Female', studentGlobalIdx);
      const mediaId = `MEDIA-STU-${stuId}`;
      const mediaFile = path.join(MEDIA_DIR, `${mediaId}.json`);
      fs.writeFileSync(mediaFile, JSON.stringify({
        id: mediaId,
        school_id: schoolId,
        entity_type: 'STUDENT_PHOTO',
        entity_id: stuId,
        filename: `${admNo}.svg`,
        mime_type: 'image/svg+xml',
        data: avatarSvg,
        created_at: new Date().toISOString()
      }), 'utf8');

      const student = {
        id: stuId,
        school_id: schoolId,
        academic_session: academicSession,
        admission_no: admNo,
        full_name: fullName,
        class_name: cls.class_name,
        section: cls.section,
        roll_no: String(roll),
        gender: isMale ? 'Male' : 'Female',
        dob: '2014-05-15',
        guardian_name: guardianName,
        guardian_phone: `+91 9811${String(300000 + studentGlobalIdx).slice(-6)}`,
        guardian_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        address: locality,
        fee_status: isPaid ? 'PAID' : 'PENDING',
        attendance_percent: attPercent,
        status: 'ACTIVE',
        passcode: '123456',
        photo: `/api/media/${mediaId}`,
        avatar: `/api/media/${mediaId}`,
        created_at: new Date().toISOString()
      };

      students.push(student);

      // Fee Invoice for April / Term 1 2026
      const invId = `INV-2026-${String(studentGlobalIdx).padStart(4, '0')}`;
      feeInvoices.push({
        id: invId,
        school_id: schoolId,
        academic_session: academicSession,
        invoice_no: `DPS-INV-${String(studentGlobalIdx).padStart(5, '0')}`,
        student_id: stuId,
        student_name: fullName,
        admission_no: admNo,
        class_name: `${cls.class_name} - ${cls.section}`,
        month: 'April 2026 (Q1 Term)',
        amount: classFee,
        paid_amount: isPaid ? classFee : 0,
        tuition_fee: classFee - 3000,
        transport_fee: 2000,
        exam_fee: 1000,
        due_date: '2026-04-15',
        status: isPaid ? 'PAID' : 'PENDING',
        payment_mode: isPaid ? (roll % 2 === 0 ? 'UPI / NetBanking' : 'HDFC Payment Gateway') : undefined,
        paid_date: isPaid ? '2026-04-08' : undefined,
        created_at: new Date().toISOString()
      });

      studentGlobalIdx++;
    }
  });

  // 6. Generate Class Attendance strictly for all 18 classes
  console.log('📝 Marking Daily Class Attendance for 18 Classes (2026-27 Session)...');
  const today = new Date().toISOString().split('T')[0];
  const attendance = [];

  classes.forEach((cls, idx) => {
    const classStudents = students.filter(s => s.class_name === cls.class_name && s.section === cls.section);
    const presentCount = Math.max(24, classStudents.length - (idx % 3)); // 25 to 28 present
    const absentCount = classStudents.length - presentCount;

    attendance.push({
      id: `ATT-DPS-${today}-${cls.id}`,
      school_id: schoolId,
      academic_session: academicSession,
      date: today,
      class_name: cls.class_name,
      section: cls.section,
      total_students: classStudents.length,
      present_count: presentCount,
      absent_count: absentCount,
      percentage: Number(((presentCount / classStudents.length) * 100).toFixed(1)),
      marked_by: cls.class_teacher_name || 'Class Teacher',
      created_at: new Date().toISOString()
    });
  });

  // Also add Faculty Attendance record for today
  attendance.push({
    id: `ATT-FAC-${today}`,
    school_id: schoolId,
    academic_session: academicSession,
    date: today,
    class_name: 'Faculty',
    section: 'Staff',
    total_students: teachers.length,
    present_count: teachers.length - 1,
    absent_count: 1,
    percentage: Number((((teachers.length - 1) / teachers.length) * 100).toFixed(1)),
    marked_by: 'Dr. Aniruddh Shastri (VP)',
    created_at: new Date().toISOString()
  });

  // 7. Standard Notices & Circulars
  const notices = [
    {
      id: 'NOT-DPS-001',
      school_id: schoolId,
      academic_session: academicSession,
      title: 'Commencement of Academic Session 2026-27 (PG to Class XII)',
      content: 'Delhi Public School warmly welcomes all students from Playgroup to Class XII for the new Academic Session 2026-27. Regular classes, labs, and sports coaching are now in full swing.',
      category: 'ACADEMIC',
      priority: 'HIGH',
      target_audience: 'ALL',
      published_by: 'Principal Office',
      ref_no: 'DPS/RKP/2026/CIR-01',
      created_at: '2026-04-01T08:00:00.000Z'
    },
    {
      id: 'NOT-DPS-002',
      school_id: schoolId,
      academic_session: academicSession,
      title: 'CBSE Secondary & Senior Secondary Registration Guidelines (Classes 9 to 12)',
      content: 'Mandatory verification of student demographic details, CBSE subject combinations (Science & Commerce), and OASIS registration is underway.',
      category: 'EXAMINATION',
      priority: 'URGENT',
      target_audience: 'STUDENTS',
      published_by: 'CBSE Examination Cell',
      ref_no: 'DPS/RKP/2026/CIR-02',
      created_at: '2026-04-10T09:30:00.000Z'
    },
    {
      id: 'NOT-DPS-003',
      school_id: schoolId,
      academic_session: academicSession,
      title: 'Annual Inter-House Robotics, AI & Science Exhibition',
      content: 'Registration is open for students of Classes 6 to 12 to participate in the Annual AI & Science Expo in the Atal Tinkering Lab.',
      category: 'ACTIVITY',
      priority: 'NORMAL',
      target_audience: 'STUDENTS',
      published_by: 'STEM & Robotics Department',
      ref_no: 'DPS/RKP/2026/CIR-03',
      created_at: '2026-04-18T10:00:00.000Z'
    }
  ];

  // 8. Timetable
  const timetable = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { period_no: 1, start_time: '08:00', end_time: '08:45' },
    { period_no: 2, start_time: '08:45', end_time: '09:30' },
    { period_no: 3, start_time: '09:30', end_time: '10:15' },
    { period_no: 4, start_time: '10:35', end_time: '11:20' },
    { period_no: 5, start_time: '11:20', end_time: '12:05' },
    { period_no: 6, start_time: '12:05', end_time: '12:50' },
    { period_no: 7, start_time: '01:10', end_time: '01:50' }
  ];

  classes.forEach((cls) => {
    days.forEach((day) => {
      periods.forEach((p, pIdx) => {
        const sub = cls.subjects[pIdx % cls.subjects.length];
        timetable.push({
          id: `TT-${cls.id}-${day.slice(0, 3)}-P${p.period_no}`,
          school_id: schoolId,
          academic_session: academicSession,
          class_name: cls.class_name,
          section: cls.section,
          day_of_week: day,
          period_no: p.period_no,
          start_time: p.start_time,
          end_time: p.end_time,
          subject_name: sub.name,
          teacher_name: cls.class_teacher_name || 'Faculty Member',
          room_no: cls.room_no
        });
      });
    });
  });

  // 9. Load School & Existing Users
  const STORE_FILE = path.join(DATA_DIR, 'erp_store.json');
  let currentStore = {};
  if (fs.existsSync(STORE_FILE)) {
    try {
      currentStore = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    } catch (e) {}
  }

  const finalStore = {
    schools: currentStore.schools && currentStore.schools.length > 0 ? currentStore.schools : [{
      id: schoolId,
      school_code: schoolId,
      school_name: 'Delhi Public School',
      board: 'CBSE',
      city: 'New Delhi',
      state: 'Delhi',
      address: 'Sector 12, R.K. Puram, New Delhi',
      pincode: '110022',
      phone: '+91 11 4987 6543',
      email: 'principal@dpsrkp.edu.in',
      principal_name: 'Dr. V. K. Sharma',
      admin_id: 'dpsadmin',
      admin_name: 'DPS Administrator',
      admin_pin: '123456',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }],
    demo_requests: currentStore.demo_requests || [],
    users: currentStore.users && currentStore.users.length > 0 ? currentStore.users : [
      {
        id: 'USR-DPS-001',
        school_id: schoolId,
        username: 'dpsadmin',
        role: 'SUPERADMIN',
        full_name: 'DPS System Administrator',
        email: 'admin@dpsrkp.edu.in',
        status: 'ACTIVE',
        is_god_admin: true
      },
      {
        id: 'USR-DPS-002',
        school_id: schoolId,
        username: 'principal',
        role: 'PRINCIPAL',
        full_name: 'Dr. V. K. Sharma',
        email: 'principal@dpsrkp.edu.in',
        status: 'ACTIVE'
      }
    ],
    students: students,
    teachers: teachers,
    classes: classes,
    timetable: timetable,
    notices: notices,
    attendance: attendance,
    fee_invoices: feeInvoices,
    holidays: currentStore.holidays || []
  };

  // 10. Write to Local JSON Store
  fs.writeFileSync(STORE_FILE, JSON.stringify(finalStore, null, 2), 'utf8');
  console.log('✅ Local Store data/erp_store.json successfully saved!');
  console.log(`📊 STATS:`);
  console.log(`   - Classrooms: ${classes.length} (PG to 10 Sec A; 11 & 12 Sec A, B)`);
  console.log(`   - Students  : ${students.length} (exactly ${STUDENTS_PER_CLASS} per class, strictly <= 30)`);
  console.log(`   - Teachers  : ${teachers.length}`);
  console.log(`   - Invoices  : ${feeInvoices.length}`);
  console.log(`   - Timetable : ${timetable.length} periods`);
  console.log(`   - Media Vault: ${students.length + teachers.length} profile photos saved locally to data/media/`);

  // 11. Synchronize to MongoDB Atlas if available
  if (MONGODB_URI) {
    try {
      console.log('☁️ Attempting optional MongoDB Atlas sync...');
      const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      const db = client.db('edugit');

      await Promise.all([
        db.collection('classes').deleteMany({ school_id: schoolId }),
        db.collection('students').deleteMany({ school_id: schoolId }),
        db.collection('teachers').deleteMany({ school_id: schoolId }),
        db.collection('attendance').deleteMany({ school_id: schoolId }),
        db.collection('fee_invoices').deleteMany({ school_id: schoolId }),
        db.collection('notices').deleteMany({ school_id: schoolId })
      ]);

      if (classes.length > 0) await db.collection('classes').insertMany(classes);
      if (students.length > 0) await db.collection('students').insertMany(students);
      if (teachers.length > 0) await db.collection('teachers').insertMany(teachers);
      if (attendance.length > 0) await db.collection('attendance').insertMany(attendance);
      if (feeInvoices.length > 0) await db.collection('fee_invoices').insertMany(feeInvoices);
      if (notices.length > 0) await db.collection('notices').insertMany(notices);

      console.log('✅ MongoDB Atlas synchronized successfully!');
      await client.close();
    } catch (e) {
      console.log('ℹ️ MongoDB Atlas sync skipped or offline:', e.message);
    }
  }

  console.log('🎉 ALL DONE!');
}

main().catch(console.error);
