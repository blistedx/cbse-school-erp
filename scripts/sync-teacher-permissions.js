const { MongoClient } = require('mongodb');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

const SAFE_TEACHER_PERMISSIONS = {
  classes: { can_view: true, can_edit: true, can_add: false, can_delete: false },
  subjects: { can_view: true, can_edit: true, can_add: false, can_delete: false },
  attendance: { can_view: true, can_edit: true, can_add: true, can_delete: false },
  exams: { can_view: true, can_edit: true, can_add: true, can_delete: false },
  homework: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  approvals: { can_view: true, can_edit: true, can_add: false, can_delete: false },
  notices: { can_view: true, can_edit: false, can_add: true, can_delete: false },
  students: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  siblings: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  teachers: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  fees: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  reports: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  certificates: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  transport: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  broadcast: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  data_hub: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  profile: { can_view: true, can_edit: true, can_add: false, can_delete: false }
};

async function syncPermissions() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db('edugit');
    
    // Update all schools in MongoDB
    const res = await db.collection('schools').updateMany(
      {},
      {
        $set: {
          'role_permissions.TEACHER': SAFE_TEACHER_PERMISSIONS
        }
      }
    );
    console.log(`Updated ${res.modifiedCount} schools in MongoDB!`);

    // Verify
    const dps = await db.collection('schools').findOne({ school_code: 'DPS2026' });
    console.log('DPS2026 role_permissions.TEACHER in Mongo:', dps?.role_permissions?.TEACHER);
  } catch (err) {
    console.error('Mongo error:', err);
  } finally {
    await client.close();
  }
}

syncPermissions();
