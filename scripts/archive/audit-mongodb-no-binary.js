const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkNoBinary() {
  console.log('🔍 AUDITING MONGODB ATLAS FOR BINARY / BASE64 FILES...');
  const mg = new MongoClient(process.env.MONGODB_URI);
  await mg.connect();
  const db = mg.db('edugit');

  const collections = await db.listCollections().toArray();
  let totalBinaryViolations = 0;
  let totalDocsScanned = 0;

  for (const col of collections) {
    const collName = col.name;
    const docs = await db.collection(collName).find({}).toArray();
    totalDocsScanned += docs.length;
    let colViolations = 0;

    for (const doc of docs) {
      function scan(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;
        for (const [k, v] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${k}` : k;
          if (Buffer.isBuffer(v)) {
            console.warn(`❌ [VIOLATION] Buffer found in ${collName} [${doc._id || doc.id}] at ${currentPath}`);
            colViolations++;
          } else if (typeof v === 'string') {
            if (v.startsWith('data:') && v.includes(';base64,') && v.length > 300) {
              console.warn(`❌ [VIOLATION] Base64 data URI (${v.length} chars) found in ${collName} [${doc._id || doc.id}] at ${currentPath}`);
              colViolations++;
            }
          } else if (typeof v === 'object') {
            scan(v, currentPath);
          }
        }
      }
      scan(doc);
    }

    console.log(`• Collection '${collName}' (${docs.length} docs): ${colViolations === 0 ? '✅ Clean (0 binary/base64 files)' : `❌ ${colViolations} violations`}`);
    totalBinaryViolations += colViolations;
  }

  console.log('\n======================================================');
  console.log(`TOTAL COLLECTIONS SCANNED : ${collections.length}`);
  console.log(`TOTAL DOCUMENTS SCANNED   : ${totalDocsScanned}`);
  console.log(`TOTAL BINARY VIOLATIONS   : ${totalBinaryViolations}`);
  console.log('======================================================');

  await mg.close();
}

checkNoBinary().catch(console.error);
