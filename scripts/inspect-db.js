const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const mg = new MongoClient(process.env.MONGODB_URI);
  await mg.connect();
  const db = mg.db('edugit');

  const users = await db.collection('users').find({}).toArray();
  console.log('Total users:', users.length);
  const roles = {};
  users.forEach(u => {
    roles[u.role] = (roles[u.role] || 0) + 1;
  });
  console.log('Roles in users table:', roles);

  // Check if any user links to students
  const stuUsers = users.filter(u => u.student_id || u.role === 'STUDENT' || u.role === 'PARENT');
  console.log('Users linked to students:', stuUsers.length);

  await mg.close();
}

run().catch(console.error);
