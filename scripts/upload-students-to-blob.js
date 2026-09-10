/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Upload all student photos to Vercel Blob using reference pictures.
 * Tests Vercel Blob live upload, records media vault metadata, updates
 * erp_store.json and synchronizes students with MongoDB Atlas Cloud.
 */

const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const REF_PICS = [
  'C:/Users/Mohit/.gemini/antigravity-ide/brain/06bf8008-7179-4bbe-8ba5-461aa9ce9589/.user_uploaded/media_1789036245319.png',
  'C:/Users/Mohit/.gemini/antigravity-ide/brain/06bf8008-7179-4bbe-8ba5-461aa9ce9589/.user_uploaded/media_1789036253604.png'
];

async function runUpload() {
  console.log('================================================================');
  console.log('📸 UPLOADING ALL STUDENT PHOTOS TO VERCEL BLOB VIA REFERENCE PICS');
  console.log('================================================================');

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN missing in .env!');
  }

  // Load reference buffers
  const buffers = REF_PICS.map(p => fs.readFileSync(p));
  console.log(`Loaded ${buffers.length} reference photos (${buffers[0].length} & ${buffers[1].length} bytes).`);

  // Load store
  const storePath = path.join(process.cwd(), 'data', 'erp_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const students = store.students || [];
  console.log(`Found ${students.length} students to update with Vercel Blob photos.`);

  // Upload the two reference variants to Vercel Blob
  console.log('\n--- 1. Uploading Master Variants to Vercel Blob ---');
  const blobVariant1 = await put('students/reference-girl-portrait-variant-a.png', buffers[0], {
    access: 'public',
    contentType: 'image/png',
    token: token
  });
  console.log('✅ Variant A uploaded:', blobVariant1.url);

  const blobVariant2 = await put('students/reference-girl-portrait-variant-b.png', buffers[1], {
    access: 'public',
    contentType: 'image/png',
    token: token
  });
  console.log('✅ Variant B uploaded:', blobVariant2.url);

  // We also upload uniquely keyed student photos to Vercel Blob for individual student endpoints
  console.log('\n--- 2. Batch Uploading Student Profiles to Vercel Blob ---');
  const filesDir = path.join(process.cwd(), 'data', 'media', 'files');
  const metaDir = path.join(process.cwd(), 'data', 'media');
  if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });

  const BATCH_SIZE = 15;
  let successCount = 0;

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const chunk = students.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async (student, idxInChunk) => {
      const globalIdx = i + idxInChunk;
      const bufIdx = globalIdx % buffers.length;
      const buf = buffers[bufIdx];
      const mediaId = `MEDIA-STU-${student.id}`;
      const pathname = `media/${student.school_id || 'DPS2026'}/${student.id}-photo.png`;

      try {
        // Upload to Vercel Blob
        const uploadedBlob = await put(pathname, buf, {
          access: 'public',
          contentType: 'image/png',
          token: token
        });

        // Update student record in store
        student.photo = uploadedBlob.url;
        student.avatar = uploadedBlob.url;

        // Save local media files & metadata for 100% offline resilience
        const safeId = mediaId.replace(/[^a-zA-Z0-9_-]/g, '_');
        fs.writeFileSync(path.join(filesDir, `${safeId}.bin`), buf);
        fs.writeFileSync(path.join(metaDir, `${safeId}.json`), JSON.stringify({
          id: mediaId,
          blob_url: uploadedBlob.url,
          url: uploadedBlob.url,
          school_id: student.school_id || 'DPS2026',
          entity_type: 'STUDENT_PHOTO',
          entity_id: student.id,
          filename: `${student.id}.png`,
          mime_type: 'image/png',
          size_bytes: buf.length,
          pathname: uploadedBlob.pathname,
          uploaded_by: 'system_blob_sync',
          created_at: new Date().toISOString()
        }, null, 2), 'utf8');

        successCount++;
      } catch (err) {
        console.error(`Failed uploading ${student.id}:`, err.message);
      }
    }));

    process.stdout.write(`\r[Vercel Blob] Uploaded: ${successCount} / ${students.length} students (${Math.round(successCount / students.length * 100)}%)`);
  }

  console.log(`\n\n✅ Successfully uploaded ${successCount} student photos to Vercel Blob!`);

  // Save updated erp_store.json
  console.log('\n--- 3. Updating Local erp_store.json ---');
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ Local store saved with direct Vercel Blob CDN URLs.');

  // Sync to MongoDB Atlas Cloud
  console.log('\n--- 4. Synchronizing to MongoDB Atlas Cloud ---');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('edugit');

  const ops = students.map(s => ({
    updateOne: {
      filter: { id: s.id },
      update: { $set: { photo: s.photo, avatar: s.avatar } }
    }
  }));

  const res = await db.collection('students').bulkWrite(ops);
  console.log(`✅ MongoDB Atlas: ${res.modifiedCount || res.matchedCount} student records updated with Vercel Blob URLs.`);

  await client.close();
  console.log('================================================================');
  console.log('🎉 ALL STUDENT PHOTOS NOW ACTIVELY SERVED FROM VERCEL BLOB!');
  console.log('Sample Live Vercel Blob URL:', students[0].photo);
  console.log('================================================================');
}

runUpload().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
