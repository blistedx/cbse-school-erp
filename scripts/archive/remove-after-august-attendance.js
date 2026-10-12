/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function removeAfterAugustAttendance() {
  console.log('======================================================');
  console.log('🗑️ REMOVING ALL ATTENDANCE DATA AFTER AUGUST 2026');
  console.log('   (Date > 2026-08-31 / September 2026 onwards)');
  console.log('======================================================\n');

  // 1. Check & Clean Local JSON Store (data/erp_store.json)
  const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const originalLocalCount = (store.attendance || []).length;

  store.attendance = (store.attendance || []).filter(a => {
    if (!a.date) return true;
    // Filter out anything after August 31, 2026 (e.g. 2026-09-01 onwards)
    return a.date <= '2026-08-31';
  });

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ Local Store (data/erp_store.json):`);
  console.log(`   - Removed: ${originalLocalCount - store.attendance.length} record(s)`);
  console.log(`   - Total Remaining Attendance: ${store.attendance.length} record(s)\n`);

  // 2. Check & Clean MongoDB Atlas
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('edugit');

      const delResult = await db.collection('attendance').deleteMany({
        date: { $gt: '2026-08-31' }
      });

      const totalMongo = await db.collection('attendance').countDocuments();
      console.log(`✅ MongoDB Atlas Cloud (attendance collection):`);
      console.log(`   - Removed: ${delResult.deletedCount} record(s) with date > 2026-08-31`);
      console.log(`   - Total Remaining Attendance: ${totalMongo} record(s)\n`);
    } catch (e) {
      console.error('❌ MongoDB Atlas error:', e.message);
    } finally {
      await client.close();
    }
  }

  console.log('======================================================');
  console.log('🎉 ALL POST-AUGUST 2026 ATTENDANCE DATA CLEANED!');
  console.log('======================================================');
}

removeAfterAugustAttendance().catch(console.error);
