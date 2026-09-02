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

const SAFE_STUDENT_PERMISSIONS = {
  classes: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  subjects: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  attendance: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  exams: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  homework: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  approvals: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  notices: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  students: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  siblings: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  teachers: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  fees: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  reports: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  certificates: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  transport: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  broadcast: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  data_hub: { can_view: false, can_edit: false, can_add: false, can_delete: false },
  profile: { can_view: true, can_edit: true, can_add: false, can_delete: false }
};

// 1. Update data/erp_store.json
try {
  const storePath = 'data/erp_store.json';
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (store.schools && store.schools.length > 0) {
      store.schools.forEach(s => {
        if (!s.role_permissions) s.role_permissions = {};
        s.role_permissions.STUDENT = SAFE_STUDENT_PERMISSIONS;
      });
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
      console.log('Updated data/erp_store.json with SAFE_STUDENT_PERMISSIONS!');
    }
  }
} catch (e) {
  console.error('Error updating local store:', e);
}

// 2. Update MongoDB
async function syncMongo() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db('edugit');
    const res = await db.collection('schools').updateMany(
      {},
      {
        $set: {
          'role_permissions.STUDENT': SAFE_STUDENT_PERMISSIONS
        }
      }
    );
    console.log(`Updated ${res.modifiedCount} schools in MongoDB with SAFE_STUDENT_PERMISSIONS!`);
  } catch (err) {
    console.error('Mongo error:', err);
  } finally {
    await client.close();
  }
}

syncMongo();
