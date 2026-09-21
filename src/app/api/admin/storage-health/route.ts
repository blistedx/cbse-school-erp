/*! EduSuite Cloud Storage Health & Automated Garbage Collector v2.0.0 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { list, del } from '@vercel/blob';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isBlobConfigured } from '@/lib/media';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ['AGENCY_SUPERADMIN', 'SUPERADMIN']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id'));
    if (tenant instanceof NextResponse) return tenant;

    // 1. Fetch live MongoDB Atlas stats
    let mongoStats = {
      is_connected: false,
      collections_count: 0,
      total_records: 0,
      data_size_mb: 0,
      storage_size_mb: 0,
      index_size_mb: 0,
      total_used_mb: 0,
      quota_mb: 512,
      remaining_mb: 512,
      percent_used: 0,
      collections: [] as Array<{ name: string; count: number }>
    };

    try {
      const db = await getDatabase();
      if (db) {
        const stats = await db.stats();
        const dataMB = Number((stats.dataSize / (1024 * 1024)).toFixed(2));
        const storageMB = Number((stats.storageSize / (1024 * 1024)).toFixed(2));
        const indexMB = Number((stats.indexSize / (1024 * 1024)).toFixed(2));
        const totalUsed = Number(((stats.storageSize + stats.indexSize) / (1024 * 1024)).toFixed(2));
        const quota = 512;
        const remaining = Number((quota - totalUsed).toFixed(2));
        const percent = Number(((totalUsed / quota) * 100).toFixed(1));

        const cols = await db.listCollections().toArray();
        const colList: Array<{ name: string; count: number }> = [];
        for (const c of cols) {
          const count = await db.collection(c.name).countDocuments();
          colList.push({ name: c.name, count });
        }
        colList.sort((a, b) => b.count - a.count);

        mongoStats = {
          is_connected: true,
          collections_count: stats.collections,
          total_records: stats.objects,
          data_size_mb: dataMB,
          storage_size_mb: storageMB,
          index_size_mb: indexMB,
          total_used_mb: totalUsed,
          quota_mb: quota,
          remaining_mb: remaining,
          percent_used: percent,
          collections: colList
        };
      }
    } catch (err: any) {
      console.warn('[Storage Health] MongoDB stats error:', err.message);
    }

    // 2. Fetch live Vercel Blob stats
    let blobStats = {
      is_configured: isBlobConfigured(),
      files_count: 0,
      total_used_mb: 0,
      quota_mb: 1024,
      remaining_mb: 1024,
      percent_used: 0,
    };

    if (isBlobConfigured()) {
      try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        const { blobs } = await list({ token, limit: 1000 });
        let totalBytes = 0;
        blobs.forEach(b => {
          totalBytes += (b.size || 0);
        });
        const usedMB = Number((totalBytes / (1024 * 1024)).toFixed(2));
        const quotaMB = 1024;
        const remainingMB = Number((quotaMB - usedMB).toFixed(2));
        const percent = Number(((usedMB / quotaMB) * 100).toFixed(2));

        blobStats = {
          is_configured: true,
          files_count: blobs.length,
          total_used_mb: usedMB,
          quota_mb: quotaMB,
          remaining_mb: remainingMB,
          percent_used: percent,
        };
      } catch (err: any) {
        console.warn('[Storage Health] Vercel Blob list error:', err.message);
      }
    }

    // Combined summary
    const combinedUsedMB = Number((mongoStats.total_used_mb + blobStats.total_used_mb).toFixed(2));
    const combinedQuotaMB = mongoStats.quota_mb + blobStats.quota_mb; // 1,536 MB
    const combinedRemainingMB = Number((combinedQuotaMB - combinedUsedMB).toFixed(2));
    const combinedPercent = Number(((combinedUsedMB / combinedQuotaMB) * 100).toFixed(1));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_used_mb: combinedUsedMB,
        total_quota_mb: combinedQuotaMB,
        total_remaining_mb: combinedRemainingMB,
        percent_used: combinedPercent,
        health_status: combinedPercent < 80 ? 'EXCELLENT' : (combinedPercent < 95 ? 'HEALTHY' : 'NEARING_CAPACITY')
      },
      mongodb: mongoStats,
      vercel_blob: blobStats
    });
  } catch (error: any) {
    console.error('[API_STORAGE_HEALTH_GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch storage health.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, body.school_id || searchParams.get('school_id'));
    if (tenant instanceof NextResponse) return tenant;

    const action = body.action || 'clean_junk';

    if (action === 'clean_junk' || action === 'garbage_collect') {
      let cleanedBlobsCount = 0;
      let cleanedRecordsCount = 0;

      // 1. Clean orphaned blobs from Vercel Blob
      if (isBlobConfigured()) {
        try {
          const token = process.env.BLOB_READ_WRITE_TOKEN;
          const { blobs } = await list({ token, limit: 1000 });
          const db = await getDatabase();

          if (db && blobs.length > 0) {
            // Get all active photo URLs in students, teachers, schools
            const students = await db.collection('students').find({}, { projection: { photo: 1, avatar: 1 } }).toArray();
            const teachers = await db.collection('teachers').find({}, { projection: { photo: 1, avatar: 1 } }).toArray();
            const schools = await db.collection('schools').find({}, { projection: { logo: 1, logo_url: 1, principal_avatar: 1, photo: 1 } }).toArray();

            const activeUrls = new Set<string>();
            students.forEach(s => {
              if (s.photo) activeUrls.add(s.photo);
              if (s.avatar) activeUrls.add(s.avatar);
            });
            teachers.forEach(t => {
              if (t.photo) activeUrls.add(t.photo);
              if (t.avatar) activeUrls.add(t.avatar);
            });
            schools.forEach(sc => {
              if (sc.logo) activeUrls.add(sc.logo);
              if (sc.logo_url) activeUrls.add(sc.logo_url);
              if (sc.principal_avatar) activeUrls.add(sc.principal_avatar);
              if (sc.photo) activeUrls.add(sc.photo);
            });

            // Find blobs not in active URLs
            const orphanedBlobs = blobs.filter(b => !activeUrls.has(b.url) && !activeUrls.has(b.pathname));
            
            // Delete orphaned blobs
            for (const ob of orphanedBlobs) {
              try {
                await del(ob.url, { token });
                cleanedBlobsCount++;
              } catch (e) {}
            }
          }
        } catch (e: any) {
          console.warn('[Garbage Collector] Blob cleaning note:', e.message);
        }
      }

      // 2. Clean stale telemetry and expired push subscriptions
      try {
        const db = await getDatabase();
        if (db) {
          // Purge 30+ day old telemetry pings
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const telemRes = await db.collection('transport_telemetry').deleteMany({
            created_at: { $lt: thirtyDaysAgo }
          });
          cleanedRecordsCount += (telemRes.deletedCount || 0);

          // Purge 90+ day old broadcast delivery logs
          const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
          const bcastRes = await db.collection('broadcast_notifications').deleteMany({
            created_at: { $lt: ninetyDaysAgo }
          });
          cleanedRecordsCount += (bcastRes.deletedCount || 0);
        }
      } catch (e: any) {
        console.warn('[Garbage Collector] DB purge note:', e.message);
      }

      return NextResponse.json({
        success: true,
        message: `Garbage collection complete! Removed ${cleanedBlobsCount} orphaned cloud files and ${cleanedRecordsCount} expired logs.`,
        cleanedBlobsCount,
        cleanedRecordsCount
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_STORAGE_HEALTH_POST]', error);
    return NextResponse.json({ success: false, error: error.message || 'Garbage collection failed.' }, { status: 500 });
  }
}
