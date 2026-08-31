/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Seed all CBSE Norms Classes from Pre-Primary (Nursery, LKG, UKG) to Class XII-B
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const CBSE_CLASSES = [
  // Foundational Stage / Pre-Primary
  { class_name: 'Nursery', section: 'A', room_no: 'Room F-01', capacity: 30, class_teacher: 'Sunita Sharma' },
  { class_name: 'Nursery', section: 'B', room_no: 'Room F-02', capacity: 30, class_teacher: 'Anita Deshmukh' },
  { class_name: 'LKG', section: 'A', room_no: 'Room F-03', capacity: 30, class_teacher: 'Pooja Verma' },
  { class_name: 'LKG', section: 'B', room_no: 'Room F-04', capacity: 30, class_teacher: 'Kavita Singh' },
  { class_name: 'UKG', section: 'A', room_no: 'Room F-05', capacity: 35, class_teacher: 'Renu Gupta' },
  { class_name: 'UKG', section: 'B', room_no: 'Room F-06', capacity: 35, class_teacher: 'Shweta Rao' },

  // Preparatory & Primary Stage (Classes 1 to 5)
  { class_name: 'Class 1', section: 'A', room_no: 'Room P-101', capacity: 40, class_teacher: 'Megha Kapoor' },
  { class_name: 'Class 1', section: 'B', room_no: 'Room P-102', capacity: 40, class_teacher: 'Deepa Menon' },
  { class_name: 'Class 2', section: 'A', room_no: 'Room P-103', capacity: 40, class_teacher: 'Rashmi Sen' },
  { class_name: 'Class 2', section: 'B', room_no: 'Room P-104', capacity: 40, class_teacher: 'Geeta Nair' },
  { class_name: 'Class 3', section: 'A', room_no: 'Room P-105', capacity: 40, class_teacher: 'Vandana Joshi' },
  { class_name: 'Class 3', section: 'B', room_no: 'Room P-106', capacity: 40, class_teacher: 'Monika Paul' },
  { class_name: 'Class 4', section: 'A', room_no: 'Room P-201', capacity: 40, class_teacher: 'Archana Tiwari' },
  { class_name: 'Class 4', section: 'B', room_no: 'Room P-202', capacity: 40, class_teacher: 'Sangeeta Roy' },
  { class_name: 'Class 5', section: 'A', room_no: 'Room P-203', capacity: 40, class_teacher: 'Pooja Iyer' },
  { class_name: 'Class 5', section: 'B', room_no: 'Room P-204', capacity: 40, class_teacher: 'Sanjay Dutt' },

  // Middle Stage (Classes 6 to 8)
  { class_name: 'Class 6', section: 'A', room_no: 'Room M-301', capacity: 40, class_teacher: 'Dr. V. Raman' },
  { class_name: 'Class 6', section: 'B', room_no: 'Room M-302', capacity: 40, class_teacher: 'Rajesh Mishra' },
  { class_name: 'Class 7', section: 'A', room_no: 'Room M-303', capacity: 40, class_teacher: 'K. S. Verma' },
  { class_name: 'Class 7', section: 'B', room_no: 'Room M-304', capacity: 40, class_teacher: 'Neha Agarwal' },
  { class_name: 'Class 8', section: 'A', room_no: 'Room M-305', capacity: 40, class_teacher: 'Ananya Roy' },
  { class_name: 'Class 8', section: 'B', room_no: 'Room M-306', capacity: 40, class_teacher: 'Vikram Seth' },

  // Secondary Stage (Classes 9 & 10)
  { class_name: 'Class 9', section: 'A', room_no: 'Room S-401', capacity: 40, class_teacher: 'Amitabh Sen' },
  { class_name: 'Class 9', section: 'B', room_no: 'Room S-402', capacity: 40, class_teacher: 'Swati Kulkarni' },
  { class_name: 'Class 10', section: 'A', room_no: 'Room S-403', capacity: 40, class_teacher: 'Pooja Iyer' },
  { class_name: 'Class 10', section: 'B', room_no: 'Room S-404', capacity: 40, class_teacher: 'Dr. V. Raman' },

  // Senior Secondary Stage (Classes 11 & 12)
  { class_name: 'Class 11', section: 'A', room_no: 'Room SR-501', capacity: 40, class_teacher: 'Dr. V. Raman' },
  { class_name: 'Class 11', section: 'B', room_no: 'Room SR-502', capacity: 40, class_teacher: 'Meenakshi D.' },
  { class_name: 'Class 12', section: 'A', room_no: 'Room SR-503', capacity: 40, class_teacher: 'K. S. Verma' },
  { class_name: 'Class 12', section: 'B', room_no: 'Room SR-504', capacity: 40, class_teacher: 'Meenakshi D.' },
];

async function seedClasses() {
  console.log('='.repeat(60));
  console.log('📚 SEEDING FULL CBSE CURRICULUM CLASSES (PRE-PRIMARY TO XII-B)');
  console.log('='.repeat(60));

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found.');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('edugit');

    console.log('Clearing old classes for DPS2026...');
    await db.collection('classes').deleteMany({ school_id: { $in: ['DPS2026', 'DPS-2026', 'SCH-DEMO-2026'] } });

    const classDocuments = CBSE_CLASSES.map((c, idx) => ({
      id: `CLS${(idx + 1).toString().padStart(3, '0')}`,
      school_id: 'DPS2026',
      class_name: c.class_name,
      section: c.section,
      class_teacher: c.class_teacher,
      room_no: c.room_no,
      capacity: c.capacity
    }));

    await db.collection('classes').insertMany(classDocuments);
    console.log(`✅ Successfully seeded ${classDocuments.length} CBSE Classes & Sections into MongoDB!`);

    // Also update local store
    const localStorePath = path.join(process.cwd(), 'data', 'erp_store.json');
    if (fs.existsSync(localStorePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
        store.classes = classDocuments;
        fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
        console.log('✅ Local store synchronized with CBSE classes.');
      } catch (e) {}
    }

  } catch (err) {
    console.error('Seeding error:', err.message);
  } finally {
    await client.close();
  }
}

seedClasses();
