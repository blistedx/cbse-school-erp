/**
 * Synchronize elevated role permissions for ADMIN and VICE_PRINCIPAL across
 * MongoDB Atlas and local data/erp_store.json.
 * 
 * Rules:
 * - ADMIN and VICE_PRINCIPAL have identical powers as PRINCIPAL across all modules
 * - Exception: Leave approval (approvals module) is strictly restricted to PRINCIPAL only
 *   (can_view: true, can_edit: false, can_add: true, can_delete: false)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

const ADMIN_AND_VP_PERMISSIONS = {
  classes: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  subjects: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  attendance: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  exams: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  homework: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  approvals: { can_view: true, can_edit: false, can_add: true, can_delete: false },
  notices: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  students: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  siblings: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  teachers: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  fees: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  reports: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  certificates: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  transport: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  library: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  visitors: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  broadcast: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  data_hub: { can_view: true, can_edit: true, can_add: true, can_delete: true },
  audit_logs: { can_view: true, can_edit: false, can_add: false, can_delete: false },
  profile: { can_view: true, can_edit: true, can_add: false, can_delete: false }
};

async function syncPermissions() {
  console.log('🔄 Starting Role Permissions Sync for ADMIN and VICE_PRINCIPAL...');

  // 1. Sync local data/erp_store.json
  const storePath = path.join(process.cwd(), 'data', 'erp_store.json');
  if (fs.existsSync(storePath)) {
    try {
      const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (Array.isArray(storeData.schools)) {
        let updatedCount = 0;
        storeData.schools.forEach(school => {
          if (!school.role_permissions) school.role_permissions = {};
          school.role_permissions.ADMIN = { ...ADMIN_AND_VP_PERMISSIONS };
          school.role_permissions.VICE_PRINCIPAL = { ...ADMIN_AND_VP_PERMISSIONS };
          updatedCount++;
        });
        fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf8');
        console.log(`✅ Updated ${updatedCount} schools in data/erp_store.json`);
      }
    } catch (e) {
      console.error('⚠️ Error updating data/erp_store.json:', e.message);
    }
  }

  // 2. Sync MongoDB Atlas
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('edugit');
      const schoolsColl = db.collection('schools');

      const result = await schoolsColl.updateMany(
        {},
        {
          $set: {
            'role_permissions.ADMIN': ADMIN_AND_VP_PERMISSIONS,
            'role_permissions.VICE_PRINCIPAL': ADMIN_AND_VP_PERMISSIONS
          }
        }
      );

      console.log(`✅ MongoDB Atlas schools updated: matched ${result.matchedCount}, modified ${result.modifiedCount}`);

      // Verify school DPS2026
      const dps = await schoolsColl.findOne({ id: 'DPS2026' });
      if (dps) {
        console.log('DPS2026 ADMIN approvals permission:', JSON.stringify(dps.role_permissions?.ADMIN?.approvals));
        console.log('DPS2026 VICE_PRINCIPAL approvals permission:', JSON.stringify(dps.role_permissions?.VICE_PRINCIPAL?.approvals));
        console.log('DPS2026 ADMIN fees permission:', JSON.stringify(dps.role_permissions?.ADMIN?.fees));
        console.log('DPS2026 VICE_PRINCIPAL fees permission:', JSON.stringify(dps.role_permissions?.VICE_PRINCIPAL?.fees));
      }
    } catch (err) {
      console.error('❌ MongoDB Atlas sync error:', err.message);
    } finally {
      await client.close();
    }
  }

  console.log('🎉 Role Permissions Sync completed successfully!');
}

syncPermissions();
