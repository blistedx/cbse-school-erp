/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'erp_store.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const MONGODB_URI = process.env.MONGODB_URI || '';

async function main() {
  console.log('🧹 REMOVING PROFILE PICTURES FOR ALL USERS, STUDENTS, AND TEACHERS...');

  // 1. Update local erp_store.json
  if (fs.existsSync(STORE_FILE)) {
    const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));

    let studentCount = 0;
    let teacherCount = 0;
    let userCount = 0;

    if (Array.isArray(store.students)) {
      store.students.forEach(s => {
        s.avatar = '';
        s.photo = '';
        studentCount++;
      });
    }

    if (Array.isArray(store.teachers)) {
      store.teachers.forEach(t => {
        t.avatar = '';
        t.photo = '';
        teacherCount++;
      });
    }

    if (Array.isArray(store.users)) {
      store.users.forEach(u => {
        u.avatar = '';
        u.photo = '';
        userCount++;
      });
    }

    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
    console.log(`✓ Local Store updated: Removed profile pictures for ${studentCount} students, ${teacherCount} teachers, and ${userCount} system users.`);
  }

  // 2. Clear local media vault files
  if (fs.existsSync(MEDIA_DIR)) {
    const files = fs.readdirSync(MEDIA_DIR);
    let deleted = 0;
    files.forEach(f => {
      if (f.endsWith('.json') || f.endsWith('.svg') || f.endsWith('.jpg') || f.endsWith('.png')) {
        try {
          fs.unlinkSync(path.join(MEDIA_DIR, f));
          deleted++;
        } catch (e) {}
      }
    });
    console.log(`✓ Local Media Vault cleaned: Deleted ${deleted} cached media files.`);
  }

  // 3. Sync update to MongoDB Atlas if connected
  if (MONGODB_URI) {
    try {
      console.log('☁️ Updating MongoDB Atlas to clear avatars...');
      const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      const db = client.db('edugit');

      await Promise.all([
        db.collection('students').updateMany({}, { $set: { avatar: '', photo: '' } }),
        db.collection('teachers').updateMany({}, { $set: { avatar: '', photo: '' } }),
        db.collection('users').updateMany({}, { $set: { avatar: '', photo: '' } })
      ]);

      console.log('✓ MongoDB Atlas updated: All avatars cleared.');
      await client.close();
    } catch (e) {
      console.log('ℹ️ MongoDB Atlas sync note:', e.message);
    }
  }

  console.log('🎉 ALL PROFILE PICTURES REMOVED SUCCESSFULLY!');
}

main().catch(console.error);
