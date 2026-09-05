/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export interface TelemetryPayload {
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

// In-memory fallback telemetry cache
const memoryStore = new Map<string, TelemetryPayload>();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('routeId');

    const now = Date.now();
    const timeoutMs = 25000; // Consider offline if no ping in 25s

    // Try reading from MongoDB Atlas Cloud for multi-serverless sync
    try {
      const db = await getDatabase();
      if (db) {
        const col = db.collection<TelemetryPayload>('transport_telemetry');
        if (routeId) {
          const doc = await col.findOne({ routeId });
          const isOnline = doc ? (now - doc.timestamp < timeoutMs && doc.active) : false;
          return NextResponse.json({
            success: true,
            routeId,
            isOnline,
            telemetry: doc || null
          });
        } else {
          const docs = await col.find({}).toArray();
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
      const data = memoryStore.get(routeId);
      const isOnline = data ? (now - data.timestamp < timeoutMs && data.active) : false;
      return NextResponse.json({
        success: true,
        routeId,
        isOnline,
        telemetry: data || null
      });
    }

    const all: Record<string, TelemetryPayload & { isOnline: boolean }> = {};
    for (const [rId, tData] of memoryStore.entries()) {
      all[rId] = {
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
    const body = await req.json();
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

    const payload: TelemetryPayload = {
      routeId,
      vehicleNo: vehicleNo || 'UP-32-AB-9876',
      driver: driver || 'Ramesh Yadav',
      latitude: Number(latitude) || 26.8467,
      longitude: Number(longitude) || 80.9462,
      speedKmh: Number(speedKmh) || 0,
      heading: Number(heading) || 0,
      accuracyMeters: Number(accuracyMeters) || 5,
      active: Boolean(active),
      timestamp: Date.now(),
      lastUpdatedText: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Update in-memory fallback
    memoryStore.set(routeId, payload);

    // Persist to MongoDB Atlas for real-time global multi-device sync
    try {
      const db = await getDatabase();
      if (db) {
        const col = db.collection('transport_telemetry');
        await col.updateOne(
          { routeId },
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
