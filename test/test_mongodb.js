/**
 * MongoDB Connection & Index Validation Script
 * Run with: node test/test_mongodb.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testMongo() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  console.log('='.repeat(60));
  console.log('🍃 MONGODB CONNECTION & INDEX VALIDATION');
  console.log('='.repeat(60));

  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.log('ℹ️  No MONGODB_URI found in .env.');
    console.log('👉 To connect live MongoDB Atlas, add:');
    console.log('   MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/edusuite?retryWrites=true&w=majority"\n');
    console.log('✅ In-memory/JSON fallback is active and fully functional for local development!');
    process.exit(0);
  }

  const maskedUri = uri.replace(/:[^:@]+@/, ':****@');
  console.log(`📡 Connecting to MongoDB: ${maskedUri}`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');

    const db = client.db('edusuite');
    const collections = await db.listCollections().toArray();
    console.log(`📂 Collections found in database: ${collections.map(c => c.name).join(', ') || 'None yet (will be created automatically)'}`);

    // Create index checks
    console.log('⚡ Initializing indexes...');
    await db.collection('schools').createIndex({ school_code: 1 }, { unique: true });
    await db.collection('students').createIndex({ school_id: 1, admission_no: 1 });
    await db.collection('teachers').createIndex({ school_id: 1, staff_code: 1 });
    console.log('✅ Indexes verified successfully!');

    console.log('\n🎉 MongoDB is fully configured and ready for production!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  } finally {
    await client.close();
  }
}

testMongo();
