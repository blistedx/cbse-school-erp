const { MongoClient } = require('mongodb');
const fs = require('fs');

async function testMongo() {
  const envText = fs.readFileSync('.env', 'utf8');
  const lines = envText.split('\n');
  let uri = '';
  for (const line of lines) {
    if (line.startsWith('MONGODB_URI=')) {
      uri = line.replace('MONGODB_URI=', '').trim().replace(/^"/, '').replace(/"$/, '');
    }
  }
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('edugit');
  const count = await db.collection('students').countDocuments();
  console.log('Mongo students count:', count);
  const mediaCount = await db.collection('media_vault').countDocuments();
  console.log('Mongo media_vault count:', mediaCount);
  await client.close();
}

testMongo().catch(console.error);
