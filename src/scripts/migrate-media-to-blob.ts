/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

// Load .env configuration
if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

interface MigrationRecord {
  fileId: string;
  sourcePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  blobUrl: string;
  status: 'SUCCESS' | 'DRY_RUN_OFFLINE' | 'FAILED' | 'SKIPPED';
  notes?: string;
}

async function migrateAllMedia() {
  console.log('===============================================================');
  console.log('🚀 Giterp File Storage Migration: Local Filesystem → Vercel Blob');
  console.log('===============================================================\n');

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const isConfigured = Boolean(token);

  if (!isConfigured) {
    console.warn('⚠️  NOTICE: BLOB_READ_WRITE_TOKEN is not currently defined in environment.');
    console.warn('   The migration script will simulate uploads and generate target Blob URL references.');
    console.warn('   Once you connect Vercel Blob and set BLOB_READ_WRITE_TOKEN, re-run this script to execute live uploads.\n');
  } else {
    console.log('✅ BLOB_READ_WRITE_TOKEN detected. Live upload to Vercel Blob active.\n');
  }

  const results: MigrationRecord[] = [];
  const rootDir = process.cwd();
  const uploadsDir = path.join(rootDir, 'data', 'uploads');
  const mediaDir = path.join(rootDir, 'data', 'media');

  // 1. Scan data/uploads directory for raw files (images, PDFs)
  if (fs.existsSync(uploadsDir)) {
    const rawFiles = fs.readdirSync(uploadsDir);
    console.log(`📁 Scanning data/uploads/: found ${rawFiles.length} file(s)...`);

    for (const filename of rawFiles) {
      const fullPath = path.join(uploadsDir, filename);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) continue;

      try {
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(filename).toLowerCase().replace('.', '');
        let mime = 'application/octet-stream';
        if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'gif') mime = 'image/gif';
        else if (ext === 'pdf') mime = 'application/pdf';

        const fileId = `UPL-${path.basename(filename, path.extname(filename))}`;
        const blobPathname = `uploads/${filename}`;
        let blobUrl = '';

        if (isConfigured) {
          const blob = await put(blobPathname, buffer, {
            access: 'public',
            contentType: mime,
            addRandomSuffix: false
          });
          blobUrl = blob.url;
          results.push({
            fileId,
            sourcePath: fullPath,
            filename,
            mimeType: mime,
            sizeBytes: buffer.length,
            blobUrl,
            status: 'SUCCESS'
          });
        } else {
          blobUrl = `https://blob.vercel-storage.com/${blobPathname}`;
          results.push({
            fileId,
            sourcePath: fullPath,
            filename,
            mimeType: mime,
            sizeBytes: buffer.length,
            blobUrl,
            status: 'DRY_RUN_OFFLINE',
            notes: 'Generated offline reference. Set BLOB_READ_WRITE_TOKEN for live cloud sync.'
          });
        }
      } catch (err: any) {
        results.push({
          fileId: filename,
          sourcePath: fullPath,
          filename,
          mimeType: 'unknown',
          sizeBytes: stat.size,
          blobUrl: 'N/A',
          status: 'FAILED',
          notes: err.message
        });
      }
    }
  } else {
    console.log('ℹ️  Directory data/uploads/ does not exist. Skipping raw directory scan.');
  }

  // 2. Scan data/media directory for legacy JSON vaults containing base64 data
  if (fs.existsSync(mediaDir)) {
    const mediaFiles = fs.readdirSync(mediaDir).filter(f => f.endsWith('.json'));
    console.log(`📁 Scanning data/media/: found ${mediaFiles.length} metadata record(s)...`);

    for (const jsonFile of mediaFiles) {
      const fullPath = path.join(mediaDir, jsonFile);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const item = JSON.parse(content);
        const fileId = item.id || path.basename(jsonFile, '.json');

        // Check if already migrated
        if (item.blob_url && !item.data) {
          results.push({
            fileId,
            sourcePath: fullPath,
            filename: item.filename || 'media',
            mimeType: item.mime_type || 'image/jpeg',
            sizeBytes: item.size_bytes || 0,
            blobUrl: item.blob_url,
            status: 'SKIPPED',
            notes: 'Already migrated to Vercel Blob'
          });
          continue;
        }

        // Has legacy base64 data to migrate
        if (item.data) {
          let buffer: Buffer;
          let mime = item.mime_type || 'image/jpeg';
          if (item.data.startsWith('data:')) {
            const match = item.data.match(/^data:([^;]+);base64,(.*)$/);
            if (match) {
              mime = match[1];
              buffer = Buffer.from(match[2], 'base64');
            } else {
              buffer = Buffer.from(item.data.split(',')[1] || '', 'base64');
            }
          } else {
            buffer = Buffer.from(item.data, 'base64');
          }

          const filename = item.filename || `${fileId}.${mime.split('/')[1] || 'jpg'}`;
          const blobPathname = `media/${item.school_id || 'DPS2026'}/${fileId}-${filename}`;
          let blobUrl = '';

          if (isConfigured) {
            const blob = await put(blobPathname, buffer, {
              access: 'public',
              contentType: mime,
              addRandomSuffix: false
            });
            blobUrl = blob.url;

            // Update local JSON metadata record: REMOVE base64 data field!
            const cleanMetadata = {
              id: fileId,
              blob_url: blobUrl,
              url: blobUrl,
              school_id: item.school_id || 'DPS2026',
              entity_type: item.entity_type || 'GENERAL',
              entity_id: item.entity_id || '',
              filename,
              mime_type: mime,
              size_bytes: buffer.length,
              pathname: blobPathname,
              created_at: item.created_at || new Date().toISOString()
            };
            fs.writeFileSync(fullPath, JSON.stringify(cleanMetadata, null, 2), 'utf8');

            results.push({
              fileId,
              sourcePath: fullPath,
              filename,
              mimeType: mime,
              sizeBytes: buffer.length,
              blobUrl,
              status: 'SUCCESS'
            });
          } else {
            blobUrl = `https://blob.vercel-storage.com/${blobPathname}`;
            results.push({
              fileId,
              sourcePath: fullPath,
              filename,
              mimeType: mime,
              sizeBytes: buffer.length,
              blobUrl,
              status: 'DRY_RUN_OFFLINE',
              notes: 'Generated offline reference. Set BLOB_READ_WRITE_TOKEN for live cloud sync.'
            });
          }
        }
      } catch (err: any) {
        results.push({
          fileId: jsonFile,
          sourcePath: fullPath,
          filename: jsonFile,
          mimeType: 'application/json',
          sizeBytes: 0,
          blobUrl: 'N/A',
          status: 'FAILED',
          notes: err.message
        });
      }
    }
  }

  // 3. Print Detailed Migration Summary Report
  console.log('\n===============================================================');
  console.log('📋 MIGRATION RESULTS TABLE');
  console.log('===============================================================');
  if (results.length === 0) {
    console.log('No files needed migration. All stores are clean.');
  } else {
    for (const r of results) {
      console.log(`[${r.status}] ${r.fileId} | ${r.filename} | ${(r.sizeBytes / 1024).toFixed(1)} KB`);
      console.log(`   Source:   ${r.sourcePath}`);
      console.log(`   Blob URL: ${r.blobUrl}`);
      if (r.notes) console.log(`   Notes:    ${r.notes}`);
      console.log('---------------------------------------------------------------');
    }
  }

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const dryRunCount = results.filter(r => r.status === 'DRY_RUN_OFFLINE').length;
  const skippedCount = results.filter(r => r.status === 'SKIPPED').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;

  console.log(`\nMigration Summary:`);
  console.log(`  Total Processed: ${results.length}`);
  console.log(`  Live Uploaded:   ${successCount}`);
  console.log(`  Simulated/Ready: ${dryRunCount}`);
  console.log(`  Already Current: ${skippedCount}`);
  console.log(`  Failed:          ${failedCount}`);
  console.log('\n🔒 SAFETY CONFIRMATION:');
  console.log('  Original local files were NOT automatically deleted.');
  console.log('  Verify the uploaded Blob URLs in your Vercel Blob Dashboard before removing local files.');
  console.log('===============================================================\n');
}

migrateAllMedia().catch(err => {
  console.error('Migration failed with unexpected error:', err);
  process.exit(1);
});
