/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';

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

// In-memory telemetry cache keyed by routeId
const telemetryStore = new Map<string, TelemetryPayload>();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('routeId');

    const now = Date.now();
    const timeoutMs = 20000; // Consider offline if no ping in 20s

    if (routeId) {
      const data = telemetryStore.get(routeId);
      const isOnline = data ? (now - data.timestamp < timeoutMs && data.active) : false;
      return NextResponse.json({
        success: true,
        routeId,
        isOnline,
        telemetry: data || null
      });
    }

    // Return all active fleet telemetries
    const all: Record<string, TelemetryPayload & { isOnline: boolean }> = {};
    for (const [rId, tData] of telemetryStore.entries()) {
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

    telemetryStore.set(routeId, payload);

    return NextResponse.json({
      success: true,
      message: 'Telemetry broadcast received successfully',
      payload
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
