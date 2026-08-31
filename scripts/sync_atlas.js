/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

function cleanDoc(doc) {
  const { _id, ...rest } = doc;
  return rest;
}

async function run() {
  console.log('Connecting to MongoDB Atlas with Whitelisted IP...');
  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });

  await client.connect();
  console.log('Successfully Connected to MongoDB Atlas Cloud!');
  const db = client.db('edugit');

  const storePath = path.join(__dirname, '..', 'data', 'erp_store.json');
  if (!fs.existsSync(storePath)) {
    console.log('No erp_store.json found.');
    await client.close();
    return;
  }

  const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Upload Schools
  if (data.schools?.length) {
    const ops = data.schools.map(s => ({
      updateOne: { filter: { id: s.id }, update: { $set: cleanDoc(s) }, upsert: true }
    }));
    const res = await db.collection('schools').bulkWrite(ops);
    console.log(`Schools Synced: ${res.upsertedCount + res.modifiedCount + res.matchedCount}`);
  }

  // Upload Students
  if (data.students?.length) {
    const ops = data.students.map(s => ({
      updateOne: { filter: { id: s.id }, update: { $set: cleanDoc(s) }, upsert: true }
    }));
    const res = await db.collection('students').bulkWrite(ops);
    console.log(`Students Synced: ${res.upsertedCount + res.modifiedCount + res.matchedCount}`);
  }

  // Upload Teachers
  if (data.teachers?.length) {
    const ops = data.teachers.map(t => ({
      updateOne: { filter: { id: t.id }, update: { $set: cleanDoc(t) }, upsert: true }
    }));
    const res = await db.collection('teachers').bulkWrite(ops);
    console.log(`Teachers Synced: ${res.upsertedCount + res.modifiedCount + res.matchedCount}`);
  }

  // Upload Classes
  if (data.classes?.length) {
    const ops = data.classes.map(c => ({
      updateOne: { filter: { id: c.id }, update: { $set: cleanDoc(c) }, upsert: true }
    }));
    const res = await db.collection('classes').bulkWrite(ops);
    console.log(`Classes Synced: ${res.upsertedCount + res.modifiedCount + res.matchedCount}`);
  }

  // Upload Invoices
  if (data.fee_invoices?.length) {
    const ops = data.fee_invoices.map(f => ({
      updateOne: { filter: { id: f.id }, update: { $set: cleanDoc(f) }, upsert: true }
    }));
    const res = await db.collection('fee_invoices').bulkWrite(ops);
    console.log(`Fee Invoices Synced: ${res.upsertedCount + res.modifiedCount + res.matchedCount}`);
  }

  // Final verification counts
  const studentCount = await db.collection('students').countDocuments();
  const teacherCount = await db.collection('teachers').countDocuments();
  const classCount = await db.collection('classes').countDocuments();
  const invoiceCount = await db.collection('fee_invoices').countDocuments();

  console.log('\n=============================================');
  console.log('MONGODB ATLAS CLOUD TOTAL COUNTS:');
  console.log(`Students:     ${studentCount}`);
  console.log(`Faculty:      ${teacherCount}`);
  console.log(`Classes:      ${classCount}`);
  console.log(`Fee Invoices: ${invoiceCount}`);
  console.log('=============================================\n');

  await client.close();
}

run().catch(err => {
  console.error('Atlas Sync Error:', err.message);
});
