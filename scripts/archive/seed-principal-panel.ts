/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const uri = process.env.MONGODB_URI || '';
const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');

const sampleApprovals = [
  // 1. TC / Character Certificates
  {
    id: 'APP-TC-2026-001',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'CERTIFICATE_TC',
    status: 'PENDING',
    title: 'Transfer Certificate Application for Aarav Sharma',
    requested_by: {
      id: 'USR-PARENT-01',
      name: 'Sunil Sharma (Father)',
      role: 'PARENT',
      email: 'sunil.sharma@gmail.com'
    },
    requested_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    details: {
      student_id: 'SR-2026-C01-002',
      student_name: 'Aarav Sharma',
      admission_no: 'DPS-2026-001',
      class_name: 'Class 10',
      section: 'A',
      certificate_type: 'TRANSFER_CERTIFICATE',
      reason: 'Parent transfer to Bangalore corporate office',
      conduct: 'Exemplary'
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Sunil Sharma (Father)',
        role: 'PARENT',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        remarks: 'Transfer Certificate requested due to inter-state corporate relocation.'
      }
    ],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'APP-TC-2026-002',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'CERTIFICATE_TC',
    status: 'APPROVED',
    title: 'Character & Bonafide Certificate for Vivaan Joshi',
    requested_by: {
      id: 'TCH-001',
      name: 'Class Teacher (Class 10-A)',
      role: 'TEACHER',
      email: 'teacher@dps2026.edu'
    },
    requested_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    actioned_by: {
      id: 'principal_admin',
      name: 'Dr. Abhishek Shukla',
      role: 'PRINCIPAL'
    },
    actioned_at: new Date(Date.now() - 86400000).toISOString(),
    remarks: 'Approved for National Science Olympiad regional qualification.',
    details: {
      student_id: 'SR-2026-C01-029',
      student_name: 'Vivaan Joshi',
      admission_no: 'DPS-2026-029',
      class_name: 'Class 10',
      section: 'A',
      certificate_type: 'CHARACTER_CERTIFICATE',
      reason: 'National Science Olympiad verification',
      conduct: 'Outstanding',
      serial_no: 'DPS/TC/2026/089'
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Class Teacher (Class 10-A)',
        role: 'TEACHER',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        remarks: 'Endorsed for external Olympiad identity verification.'
      },
      {
        action: 'APPROVED',
        by: 'Dr. Abhishek Shukla',
        role: 'PRINCIPAL',
        date: new Date(Date.now() - 86400000).toISOString(),
        remarks: 'Approved for National Science Olympiad regional qualification.'
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },

  // 2. Fee Concession / Waivers
  {
    id: 'APP-CONC-2026-001',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'FEE_CONCESSION',
    status: 'PENDING',
    title: 'Sibling Discount 20% Authorization for Ananya Verma',
    requested_by: {
      id: 'ACC-01',
      name: 'Fee Accounts Counter Desk',
      role: 'ACCOUNTANT',
      email: 'accounts@dps2026.edu'
    },
    requested_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    details: {
      student_id: 'SR-2026-C01-003',
      student_name: 'Ananya Verma',
      admission_no: 'DPS-2026-003',
      class_name: 'Class 9',
      section: 'B',
      concession_type: 'SIBLING',
      amount_paise: 350000,
      fee_head: 'TUITION',
      concession_percent: 20,
      reason: 'Second child enrolled in school (Elder brother: Rohan Verma in Class 12-A).'
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Fee Accounts Counter Desk',
        role: 'ACCOUNTANT',
        date: new Date(Date.now() - 3600000 * 4).toISOString(),
        remarks: 'Sibling proof verified against admission register records.'
      }
    ],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'APP-CONC-2026-002',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'FEE_CONCESSION',
    status: 'PENDING',
    title: 'Merit Scholarship 50% Tuition Waiver for Kabir Mehta',
    requested_by: {
      id: 'USR-PARENT-02',
      name: 'Rakesh Mehta (Parent)',
      role: 'PARENT',
      email: 'rakesh.mehta@gmail.com'
    },
    requested_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    details: {
      student_id: 'SR-2026-C01-004',
      student_name: 'Kabir Mehta',
      admission_no: 'DPS-2026-004',
      class_name: 'Class 10',
      section: 'A',
      concession_type: 'MERIT',
      amount_paise: 600000,
      fee_head: 'TUITION',
      concession_percent: 50,
      reason: 'Achieved State Rank 3 in National Junior Mathematics Olympiad.'
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Rakesh Mehta (Parent)',
        role: 'PARENT',
        date: new Date(Date.now() - 3600000 * 8).toISOString(),
        remarks: 'Submitted state Olympiad certificate for institutional merit waiver.'
      }
    ],
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },

  // 3. Staff Leave Applications
  {
    id: 'APP-LV-2026-001',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'STAFF_LEAVE',
    status: 'PENDING',
    title: 'Casual Leave (2 Days) for Dr. Rajesh Sharma',
    requested_by: {
      id: 'TCH-001',
      name: 'Dr. Rajesh Sharma',
      role: 'TEACHER',
      email: 'rajesh.sharma@dps2026.edu'
    },
    requested_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    details: {
      staff_id: 'TCH-001',
      staff_code: 'TCH01',
      staff_name: 'Dr. Rajesh Sharma',
      department: 'Mathematics',
      designation: 'Senior Faculty PGT',
      leave_type: 'Casual Leave (CL)',
      start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      days: 2,
      reason: 'Attending CBSE Capacity Building Program & Pedagogical Workshop at COE Delhi.',
      substitution_required: true
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Dr. Rajesh Sharma',
        role: 'TEACHER',
        date: new Date(Date.now() - 3600000 * 3).toISOString(),
        remarks: 'Official CBSE workshop nomination; timetable substitution pre-arranged.'
      }
    ],
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'APP-LV-2026-002',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'STAFF_LEAVE',
    status: 'PENDING',
    title: 'Medical Leave (3 Days) for Sunita Verma',
    requested_by: {
      id: 'TCH-002',
      name: 'Sunita Verma',
      role: 'TEACHER',
      email: 'sunita.verma@dps2026.edu'
    },
    requested_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    details: {
      staff_id: 'TCH-002',
      staff_code: 'TCH02',
      staff_name: 'Sunita Verma',
      department: 'Science',
      designation: 'Faculty TGT',
      leave_type: 'Medical Leave (ML)',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      days: 3,
      reason: 'Severe viral fever and physician recommended clinical bed rest.',
      substitution_required: true
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Sunita Verma',
        role: 'TEACHER',
        date: new Date(Date.now() - 3600000 * 6).toISOString(),
        remarks: 'Medical certificate attached for 3 days clinical rest.'
      }
    ],
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },

  // 4. New Scholar Admissions
  {
    id: 'APP-ADM-2026-001',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'ADMISSION',
    status: 'PENDING',
    title: 'Admission Verification for Reyansh Singhal (Class 11 - Science)',
    requested_by: {
      id: 'ADM-OFFICE-01',
      name: 'Admissions & Front Desk',
      role: 'ADMIN',
      email: 'admissions@dps2026.edu'
    },
    requested_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    details: {
      applicant_name: 'Reyansh Singhal',
      applied_class: 'Class 11',
      father_name: 'Vikram Singhal',
      mother_name: 'Pooja Singhal',
      mobile: '+91 98112 45890',
      previous_school: 'St. Xavier High School, Delhi',
      entrance_score: '94.5% (Class 10 CBSE Board)',
      category: 'GENERAL',
      admission_fee_status: 'Registration & Entrance Test Cleared'
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Admissions & Front Desk',
        role: 'ADMIN',
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        remarks: 'Board marksheet and migration certificate verified; awaiting Principal approval.'
      }
    ],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'APP-ADM-2026-002',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    type: 'ADMISSION',
    status: 'PENDING',
    title: 'RTE Quota Admission Verification for Meera Kumari (Class 1)',
    requested_by: {
      id: 'ADM-OFFICE-01',
      name: 'Admissions & Front Desk',
      role: 'ADMIN',
      email: 'admissions@dps2026.edu'
    },
    requested_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    details: {
      applicant_name: 'Meera Kumari',
      applied_class: 'Class 1',
      father_name: 'Ramji Lal',
      mother_name: 'Kamla Devi',
      mobile: '+91 94120 78231',
      previous_school: 'Anganwadi Center 4',
      entrance_score: 'RTE Section 12(1)(c) Allotment No: RTE-2026-DEL-049',
      category: 'SC / EWS',
      admission_fee_status: 'Exempt under RTE Statutory Provisions'
    },
    history: [
      {
        action: 'REQUESTED',
        by: 'Admissions & Front Desk',
        role: 'ADMIN',
        date: new Date(Date.now() - 3600000 * 7).toISOString(),
        remarks: 'Directorate of Education lottery allotment slip verified.'
      }
    ],
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 7).toISOString()
  }
];

const samplePrincipalNotices = [
  {
    id: 'NOT-PRIN-001',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    title: 'Advisory: Monsoon Preparedness & Student Safety Protocols',
    content: 'All faculty and transport drivers are directed to ensure utmost caution during heavy rainfall. Buses must adhere strictly to speed limits and students must remain inside classrooms during inclement weather.',
    target_audience: 'ALL',
    category: 'SAFETY',
    posted_by: 'Dr. Abhishek Shukla (Principal)',
    is_pinned: true,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'NOT-PRIN-002',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    title: 'CBSE Periodic Assessment 2 Broad-Sheet Finalization Schedule',
    content: 'All Head of Departments and Class Teachers are required to complete mark entry for Periodic Assessment 2 by the end of this academic week. Report card moderation will commence on Monday.',
    target_audience: 'STAFF',
    category: 'ACADEMIC',
    posted_by: 'Dr. Abhishek Shukla (Principal)',
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'NOT-PRIN-003',
    school_id: 'DPS2026',
    academic_session: '2026-27',
    title: 'Class 10 CBSE Board Examination Form Verification Directive',
    content: 'Class 10 students and parents are requested to verify their spelling, subject codes and date of birth details on the CBSE LOC broadsheets available with their respective class teachers.',
    target_audience: 'CLASS:Class 10',
    category: 'EXAMINATION',
    posted_by: 'Dr. Abhishek Shukla (Principal)',
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

async function seedPrincipalPanel() {
  console.log('Seeding Principal Panel test data...');

  // 1. Update local store
  if (fs.existsSync(localStorePath)) {
    try {
      const store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
      store.approvals = sampleApprovals;
      store.notices = [...samplePrincipalNotices, ...(store.notices || [])];
      fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
      console.log('✅ Updated data/erp_store.json with approvals and principal circulars!');
    } catch (e: any) {
      console.warn('Local store update note:', e.message);
    }
  }

  // 2. Update MongoDB Atlas if connected
  if (uri) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db('edugit');

      // Bulk upsert approvals
      for (const app of sampleApprovals) {
        await db.collection('approvals').updateOne(
          { id: app.id },
          { $set: app },
          { upsert: true }
        );
      }
      console.log(`✅ Upserted ${sampleApprovals.length} approval petitions into MongoDB Atlas!`);

      // Bulk upsert notices
      for (const not of samplePrincipalNotices) {
        await db.collection('notices').updateOne(
          { id: not.id },
          { $set: not },
          { upsert: true }
        );
      }
      console.log(`✅ Upserted ${samplePrincipalNotices.length} principal notices into MongoDB Atlas!`);

      await client.close();
    } catch (err: any) {
      console.warn('MongoDB Atlas seed warning (proceeding with local store):', err.message);
    }
  }

  console.log('🎉 Principal Panel seeding successfully completed!');
}

seedPrincipalPanel().catch(console.error);
