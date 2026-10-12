import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const dateStr = new Date().toISOString().split('T')[0];
const backupDir = path.join(process.cwd(), 'backups', dateStr);

async function runBackup() {
  console.log(`[Backup] Initializing full MongoDB Atlas JSON export to ${backupDir}...`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const client = new MongoClient(process.env.MONGODB_URI, { tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db('edugit');
    const collections = await db.listCollections().toArray();
    console.log(`[Backup] Found ${collections.length} collections in database 'edugit'.`);

    const manifest = {
      backupDate: new Date().toISOString(),
      database: 'edugit',
      collections: []
    };

    for (const col of collections) {
      const colName = col.name;
      const count = await db.collection(colName).countDocuments();
      console.log(`[Backup] Exporting collection: ${colName} (${count} documents)...`);
      const docs = await db.collection(colName).find({}).toArray();
      const filePath = path.join(backupDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
      manifest.collections.push({ name: colName, count, file: `${colName}.json` });
    }

    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n[Backup Complete] Successfully backed up all ${collections.length} collections to: ${backupDir}`);
  } catch (err) {
    console.error('[Backup Error]:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runBackup();
