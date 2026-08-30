const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

const sampleHolidays = [
  {
    id: 'HOL-2026-09-01',
    school_id: 'SCH-DELHI-001',
    academic_session: '2026-27',
    title: 'Autumn Break & Teacher\'s Day Special Break',
    start_date: '2026-09-01',
    end_date: '2026-09-05',
    total_days: 5,
    applicable_to: 'ALL',
    category: 'VACATION',
    reason: 'Annual Mid-Term Autumn Break & Institutional Staff Development',
    declared_by: 'Principal & CBSE Directorate',
    auto_notice_published: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'HOL-2026-10-02',
    school_id: 'SCH-DELHI-001',
    academic_session: '2026-27',
    title: 'Mahatma Gandhi Jayanti',
    start_date: '2026-10-02',
    end_date: '2026-10-02',
    total_days: 1,
    applicable_to: 'ALL',
    category: 'GAZETTED',
    reason: 'National Holiday on account of Gandhi Jayanti',
    declared_by: 'Government of India / CBSE',
    auto_notice_published: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'HOL-2026-10-20',
    school_id: 'SCH-DELHI-001',
    academic_session: '2026-27',
    title: 'Dussehra (Vijayadashami) Festival Break',
    start_date: '2026-10-20',
    end_date: '2026-10-22',
    total_days: 3,
    applicable_to: 'ALL',
    category: 'VACATION',
    reason: 'Dussehra Festivities and Vijayadashami celebration',
    declared_by: 'Principal Office',
    auto_notice_published: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'HOL-2026-11-08',
    school_id: 'SCH-DELHI-001',
    academic_session: '2026-27',
    title: 'Deepawali & Bhai Dooj Festive Break',
    start_date: '2026-11-08',
    end_date: '2026-11-13',
    total_days: 6,
    applicable_to: 'ALL',
    category: 'VACATION',
    reason: 'Deepawali, Govardhan Puja & Bhai Dooj Celebrations',
    declared_by: 'Managing Committee',
    auto_notice_published: true,
    created_at: new Date().toISOString()
  }
];

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');

  for (const h of sampleHolidays) {
    await db.collection('holidays').replaceOne(
      { id: h.id },
      { ...h },
      { upsert: true }
    );
  }
  console.log(`Seeded ${sampleHolidays.length} sample holidays into MongoDB Atlas.`);

  const storeFile = 'data/erp_store.json';
  if (fs.existsSync(storeFile)) {
    const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    store.holidays = sampleHolidays;
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
    console.log('Updated data/erp_store.json with initial holidays.');
  }

  await client.close();
}

seed().catch(console.error);
