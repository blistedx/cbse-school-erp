/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function removeAugustAttendance() {
  console.log('======================================================');
  console.log('🗑️ REMOVING ATTENDANCE RECORDS FROM 1 AUG 2026');
  console.log('======================================================\n');

  // 1. Update data/erp_store.json
  const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const originalCount = (store.attendance || []).length;
  
  // Filter out any records from 2026-08-01 onwards or matching August 2026
  store.attendance = (store.attendance || []).filter(a => {
    const isAugRecord = (a.date && a.date >= '2026-08-01') || (a.date && a.date.startsWith('2026-08'));
    return !isAugRecord;
  });

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ Local JSON Store (data/erp_store.json):`);
  console.log(`   - Removed: ${originalCount - store.attendance.length} record(s)`);
  console.log(`   - Remaining: ${store.attendance.length} record(s)\n`);

  // 2. Update MongoDB Atlas
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('edugit');
      const mongoDelResult = await db.collection('attendance').deleteMany({
        $or: [
          { date: { $gte: '2026-08-01' } },
          { date: { $regex: '^2026-08' } }
        ]
      });
      console.log(`✅ MongoDB Atlas (attendance collection):`);
      console.log(`   - Deleted: ${mongoDelResult.deletedCount} record(s)`);
      const remainingMongo = await db.collection('attendance').countDocuments();
      console.log(`   - Remaining: ${remainingMongo} record(s)\n`);
    } catch (e) {
      console.error('❌ MongoDB Atlas error:', e.message);
    } finally {
      await client.close();
    }
  }

  console.log('======================================================');
  console.log('🎉 ATTENDANCE RECORDS FROM 1 AUG 2026 REMOVED SUCCESSFULLY!');
  console.log('======================================================');
}

removeAugustAttendance().catch(console.error);
