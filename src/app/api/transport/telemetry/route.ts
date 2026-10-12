/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth, requireRole, STAFF_ROLES, resolveTenantSchoolId } from '@/lib/auth-guard';

export interface TelemetryPayload {
  school_id?: string;
  routeId: string;
  vehicleNo?: string;
  driver?: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  accuracyMeters: number;
  active: boolean;
  timestamp: number;
  lastUpdatedText?: string;
}

// In-memory fallback telemetry cache (scoped by tenant:routeId)
const memoryStore = new Map<string, TelemetryPayload>();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;
    const schoolId = tenant;

    const routeId = searchParams.get('routeId');
    const now = Date.now();
    const timeoutMs = 25000; // Consider offline if no ping in 25s

    // Try reading from MongoDB Atlas Cloud for multi-serverless sync
    try {
      const db = await getDatabase();
      if (db) {
        const col = db.collection<TelemetryPayload>('transport_telemetry');
        if (routeId) {
          const doc = await col.findOne({ routeId, school_id: schoolId });
          const isOnline = doc ? (now - doc.timestamp < timeoutMs && doc.active) : false;
          return NextResponse.json({
            success: true,
            routeId,
            isOnline,
            telemetry: doc || null
          });
        } else {
          const docs = await col.find({ school_id: schoolId }).toArray();
          const all: Record<string, TelemetryPayload & { isOnline: boolean }> = {};
          for (const d of docs) {
            all[d.routeId] = {
              ...d,
              isOnline: (now - d.timestamp < timeoutMs && d.active)
            };
          }
          return NextResponse.json({ success: true, telemetries: all });
        }
      }
    } catch (dbErr) {
      // Fallback to in-memory store
    }

    // In-memory fallback
    if (routeId) {
      const key = `${schoolId}:${routeId}`;
      const data = memoryStore.get(key) || memoryStore.get(routeId);
      const isOnline = data ? (now - data.timestamp < timeoutMs && data.active) : false;
      return NextResponse.json({
        success: true,
        routeId,
        isOnline,
        telemetry: data || null
      });
    }

    const all: Record<string, TelemetryPayload & { isOnline: boolean }> = {};
    for (const [key, tData] of memoryStore.entries()) {
      if (tData.school_id && tData.school_id !== schoolId) continue;
      all[tData.routeId] = {
        ...tData,
        isOnline: (now - tData.timestamp < timeoutMs && tData.active)
      };
    }

    return NextResponse.json({
      success: true,
      telemetries: all
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const allowedRoles = [...STAFF_ROLES, 'DRIVER'];
    const auth = requireRole(req, allowedRoles);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (tenant instanceof NextResponse) return tenant;
    const schoolId = tenant;

    const {
      routeId,
      vehicleNo,
      driver,
      latitude,
      longitude,
      speedKmh,
      heading,
      accuracyMeters,
      active = true
    } = body;

    if (!routeId) {
      return NextResponse.json({ success: false, error: 'routeId is required' }, { status: 400 });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const spd = Number(speedKmh);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ success: false, error: 'Invalid latitude/longitude coordinates.' }, { status: 400 });
    }
    if (isNaN(spd) || spd < 0 || spd > 250) {
      return NextResponse.json({ success: false, error: 'Invalid speed value.' }, { status: 400 });
    }

    const payload: TelemetryPayload = {
      school_id: schoolId,
      routeId,
      vehicleNo: vehicleNo || 'UP-32-AB-9876',
      driver: driver || 'Ramesh Yadav',
      latitude: lat,
      longitude: lng,
      speedKmh: spd,
      heading: Number(heading) || 0,
      accuracyMeters: Number(accuracyMeters) || 5,
      active: Boolean(active),
      timestamp: Date.now(),
      lastUpdatedText: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Update in-memory fallback
    memoryStore.set(`${schoolId}:${routeId}`, payload);
    memoryStore.set(routeId, payload);

    // Persist to MongoDB Atlas for real-time global multi-device sync
    try {
      const db = await getDatabase();
      if (db) {
        const col = db.collection('transport_telemetry');
        await col.updateOne(
          { routeId, school_id: schoolId },
          { $set: payload },
          { upsert: true }
        );
      }
    } catch (e) {
      console.warn('[Telemetry MongoDB Sync Notice]', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Telemetry broadcast received successfully',
      payload
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
