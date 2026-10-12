import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function doBackup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('No MONGODB_URI found in env');
  const backupDir = path.resolve('..', 'erp_backup_phase2_pre_bcrypt');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  console.log('[Backup] Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  await client.connect();
  console.log('[Backup] Connected to database (edugit)');

  const db = client.db('edugit');
  const collections = await db.listCollections().toArray();
  const manifest: { timestamp: string; collections: Record<string, number> } = {
    timestamp: new Date().toISOString(),
    collections: {}
  };

  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).toArray();
    fs.writeFileSync(path.join(backupDir, `${col.name}.json`), JSON.stringify(docs, null, 2), 'utf8');
    manifest.collections[col.name] = docs.length;
    console.log(`[Backup] Saved ${col.name}: ${docs.length} documents`);
  }

  fs.writeFileSync(path.join(backupDir, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('[Backup] Completed successfully to:', backupDir);
  await client.close();
}

doBackup().catch(err => {
  console.error('[Backup Error]:', err);
  process.exit(1);
});
