require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGODB_URI configured.');
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const hash = await bcrypt.hash('123123', 10);
    const res = await db.collection('students').updateMany(
      { $or: [{ admission_no: 'ADM-0556' }, { id: 'STU-1788408097875' }] },
      { $set: { passcode: hash, plain_passcode: '123123' } }
    );
    console.log(`MongoDB update completed: ${res.matchedCount} matched, ${res.modifiedCount} modified.`);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
