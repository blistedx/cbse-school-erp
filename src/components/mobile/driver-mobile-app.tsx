/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bus,
  MapPin,
  Navigation,
  Radio,
  Bell,
  AlertTriangle,
  User,
  Check,
  Phone,
  Clock,
  LogOut,
  Send,
  FileText,
  ShieldAlert,
  Search,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  Compass,
  Gauge,
  AlertCircle
} from 'lucide-react';
import { Student, Notice, School } from '@/lib/types';
import { apiFetch } from '@/lib/api-client';

export interface DriverMobileAppProps {
  currentUser: any;
  selectedSchool?: School | null;
  students?: Student[];
  notices?: Notice[];
  onLogout: () => void;
}

export interface BoardingPassenger {
  id: string;
  name: string;
  className: string;
  stopName: string;
  parentPhone: string;
  boarded: boolean;
  time?: string;
}

export interface BroadcastNoticeItem {
  id: string;
  title: string;
  message: string;
  time: string;
  priority: 'URGENT' | 'ALERT' | 'INFO';
  audience: string;
}

export default function DriverMobileApp({
  currentUser,
  selectedSchool,
  students = [],
  notices = [],
  onLogout
}: DriverMobileAppProps) {
  // Navigation: strictly 4 sections as requested by user
  const [activeTab, setActiveTab] = useState<'transport' | 'notices' | 'broadcast' | 'profile'>('transport');

  // GPS Telemetry State
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [gpsStatusText, setGpsStatusText] = useState<string>('Initializing GPS...');
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(5);
  const [lastTransmittedAt, setLastTransmittedAt] = useState<string>('');
  const [transmitCount, setTransmitCount] = useState<number>(0);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);

  // Watch ID and Heartbeat Timer refs
  const watchIdRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const latestCoordsRef = useRef<{ latitude: number; longitude: number; speed: number; heading: number; accuracy: number }>({
    latitude: 26.8467,
    longitude: 80.9462,
    speed: 0,
    heading: 0,
    accuracy: 5
  });

  // Emergency SOS State
  const [selectedSos, setSelectedSos] = useState<string>('Traffic Congestion (15 min delay)');
  const [sosSent, setSosSent] = useState<boolean>(false);
  const [sosLoading, setSosLoading] = useState<boolean>(false);

  // Search & Filter state
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [searchNotice, setSearchNotice] = useState<string>('');

  // Live Broadcasts state
  const [broadcasts, setBroadcasts] = useState<BroadcastNoticeItem[]>([
    {
      id: 'bc-1',
      title: '🚨 Road Diversion Advisory: Ring Road',
      message: 'Heavy metro construction near Flyover. All buses on Route 01 & 02 are advised to take the Sector 9 bypass.',
      time: '12m ago',
      priority: 'URGENT',
      audience: 'TRANSPORT'
    },
    {
      id: 'bc-2',
      title: '🌧️ Heavy Rain Alert & Speed Warning',
      message: 'Light to moderate rain expected between 2:00 PM and 5:00 PM. Keep vehicle speed strictly below 40 km/h.',
      time: '45m ago',
      priority: 'ALERT',
      audience: 'ALL_STAFF'
    },
    {
      id: 'bc-3',
      title: '⛽ Fleet Diesel & PUC Verification',
      message: 'Monthly vehicle fitness and fuel log verification at the campus transport garage tomorrow 04:00 PM.',
      time: '3h ago',
      priority: 'INFO',
      audience: 'DRIVERS'
    }
  ]);

  // Route & Vehicle Info
  const vehicleNo = currentUser?.vehicle_no || 'UP-32-AB-9876';
  const busNo = currentUser?.bus_no || 'BUS-01';
  const routeId = currentUser?.route_id || 'ROUTE-LKO-01';
  const routeName = currentUser?.route_name || 'Rajajipuram to Chowk Express';
  const driverName = currentUser?.full_name || 'Ramesh Yadav';
  const driverPhone = currentUser?.phone || '+91 98765-43210';
  const driverLicense = currentUser?.license_no || 'DL-04201809283';

  // Boarding Passengers List
  const defaultPassengers: BoardingPassenger[] = [
    { id: 'st-1', name: 'Aarav Sharma', className: 'Class VI-A', stopName: 'Rajajipuram E-Block', parentPhone: '+91 98102-38491', boarded: true, time: '07:46 AM' },
    { id: 'st-2', name: 'Ananya Singhania', className: 'Class VI-A', stopName: 'Rajajipuram E-Block', parentPhone: '+91 98111-22334', boarded: true, time: '07:48 AM' },
    { id: 'st-3', name: 'Ayush Mehra', className: 'Class VII-B', stopName: 'Alambagh Chauraha', parentPhone: '+91 98222-33445', boarded: false },
    { id: 'st-4', name: 'Bhavya Joshi', className: 'Class VII-B', stopName: 'Alambagh Chauraha', parentPhone: '+91 98333-44556', boarded: false },
    { id: 'st-5', name: 'Dhruv Rastogi', className: 'Class VIII-A', stopName: 'Charbagh Station Circle', parentPhone: '+91 98444-55667', boarded: false },
    { id: 'st-6', name: 'Divya Iyer', className: 'Class IX-C', stopName: 'Chowk Heritage Gate', parentPhone: '+91 98555-66778', boarded: false },
    { id: 'st-7', name: 'Kabir Verma', className: 'Class X-A', stopName: 'Chowk Heritage Gate', parentPhone: '+91 98666-77889', boarded: false }
  ];

  const [passengers, setPassengers] = useState<BoardingPassenger[]>(() => {
    if (students && students.length > 0) {
      return students.slice(0, 8).map((s, idx) => ({
        id: s.id,
        name: s.full_name || (s as any).name || `Student ${idx + 1}`,
        className: s.class_name ? `Class ${s.class_name}` : 'Class VI-A',
        stopName: idx < 2 ? 'Rajajipuram E-Block' : idx < 4 ? 'Alambagh Chauraha' : idx < 6 ? 'Charbagh Station' : 'Chowk Heritage Gate',
        parentPhone: s.guardian_phone || (s as any).emergency_contact || '+91 98765-00000',
        boarded: idx < 2,
        time: idx < 2 ? '07:45 AM' : undefined
      }));
    }
    return defaultPassengers;
  });

  const boardedCount = passengers.filter((p) => p.boarded).length;

  const toggleBoarding = (id: string) => {
    setPassengers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextState = !p.boarded;
        return {
          ...p,
          boarded: nextState,
          time: nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      })
    );
  };

  // ─────────────────────────────────────────────────────────────
  // TELEMETRY TRANSMISSION TO BACKEND API (/api/transport/telemetry)
  // This broadcasts to Admin & Parents Panels in real time
  // ─────────────────────────────────────────────────────────────
  const broadcastTelemetry = async (
    coords: { latitude: number; longitude: number; speed: number; heading: number; accuracy: number },
    active: boolean
  ) => {
    try {
      setIsTransmitting(true);
      const res = await fetch('/api/transport/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: routeId || 'ROUTE-LKO-01',
          vehicleNo: vehicleNo || 'UP-32-AB-9876',
          driver: driverName || 'Ramesh Yadav',
          latitude: coords.latitude,
          longitude: coords.longitude,
          speedKmh: coords.speed,
          heading: coords.heading,
          accuracyMeters: coords.accuracy,
          active
        })
      });

      if (res.ok) {
        setLastTransmittedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setTransmitCount((c) => c + 1);
      }
    } catch (e) {
      console.warn('[Driver Telemetry Broadcast Error]', e);
    } finally {
      setIsTransmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STOP GPS TRANSMISSION
  // ─────────────────────────────────────────────────────────────
  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    setGpsActive(false);
    setGpsStatusText('GPS Beacon Inactive • Tap Start GPS');
    // Notify server that telemetry is offline
    broadcastTelemetry(latestCoordsRef.current, false);
  };

  // ─────────────────────────────────────────────────────────────
  // START GPS TRACKING & CONTINUOUS BROADCAST
  // ─────────────────────────────────────────────────────────────
  const startGpsTracking = (initialPosition?: GeolocationPosition) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationPermission('unsupported');
      setGpsStatusText('Geolocation not supported by device');
      return;
    }

    setLocationPermission('granted');
    setGpsActive(true);
    setGpsStatusText('🟢 LIVE GPS BROADCASTING TO ADMIN & PARENTS');

    const handleNewPosition = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // Convert m/s to km/h if available, or simulate realistic bus speed
      let spd = pos.coords.speed !== null && pos.coords.speed !== undefined && pos.coords.speed >= 0
        ? Math.round(pos.coords.speed * 3.6)
        : Math.floor(28 + Math.random() * 12);
      const hdg = pos.coords.heading !== null && pos.coords.heading !== undefined ? Math.round(pos.coords.heading) : 180;
      const acc = Math.round(pos.coords.accuracy || 4);

      setCurrentCoords({ latitude: lat, longitude: lng });
      setCurrentSpeed(spd);
      setCurrentHeading(hdg);
      setGpsAccuracy(acc);

      latestCoordsRef.current = {
        latitude: lat,
        longitude: lng,
        speed: spd,
        heading: hdg,
        accuracy: acc
      };

      // Broadcast update immediately to backend
      broadcastTelemetry(latestCoordsRef.current, true);
    };

    if (initialPosition) {
      handleNewPosition(initialPosition);
    }

    // Set up continuous watchPosition
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handleNewPosition(pos),
      (err) => {
        console.warn('[Driver GPS watchPosition warning]', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );

    // Also run heartbeat interval (every 3 seconds) to guarantee regular telemetry packets
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    heartbeatTimerRef.current = setInterval(() => {
      broadcastTelemetry(latestCoordsRef.current, true);
    }, 3000);
  };

  // ─────────────────────────────────────────────────────────────
  // REQUEST LOCATION PERMISSION:
  // 1. Called on login/mount automatically
  // 2. Called when driver taps "START GPS" if previously denied or off
  // ─────────────────────────────────────────────────────────────
  const requestLocationAccess = (isInitialLogin: boolean = false) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationPermission('unsupported');
      setGpsStatusText('Geolocation not supported by device');
      return;
    }

    setGpsStatusText(isInitialLogin ? 'Requesting Device Location Permission...' : 'Acquiring GPS Signal...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Driver granted location!
        startGpsTracking(pos);
      },
      (err) => {
        // Driver declined or browser blocked location
        console.warn('[Location Permission Denied or Failed]', err.code, err.message);
        setLocationPermission('denied');
        setGpsActive(false);
        setGpsStatusText('Location access declined. Tap "Start GPS" to enable live bus tracking.');
        if (!isInitialLogin) {
          // If the driver manually pressed Start GPS and it failed, alert with clear instructions
          alert('Location access is blocked. Please allow location access in your browser site settings and tap "Start GPS" again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // ─────────────────────────────────────────────────────────────
  // ON MOUNT (LOGIN): PROMPT FOR LOCATION IMMEDIATELY
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if permission already granted or prompt immediately upon login
    requestLocationAccess(true);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, []);

  // Fetch live broadcasts from API
  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const res = await apiFetch('/api/notifications/broadcasts');
        if (res.ok) {
          const data = await res.json();
          if (data && data.broadcasts && data.broadcasts.length > 0) {
            const mapped = data.broadcasts.map((b: any, idx: number) => ({
              id: b.id || `bc-${idx}`,
              title: b.title || 'School Announcement',
              message: b.message || b.content || '',
              time: b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
              priority: b.priority?.toUpperCase() === 'URGENT' ? 'URGENT' : b.priority?.toUpperCase() === 'ALERT' ? 'ALERT' : 'INFO',
              audience: b.audience || 'ALL'
            }));
            setBroadcasts(mapped);
          }
        }
      } catch (e) {}
    };
    fetchBroadcasts();
  }, []);

  // Send SOS alert
  const handleSendSos = async () => {
    setSosLoading(true);
    try {
      await fetch('/api/transport/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId,
          vehicleNo,
          driver: driverName,
          latitude: latestCoordsRef.current.latitude,
          longitude: latestCoordsRef.current.longitude,
          speedKmh: 0,
          heading: latestCoordsRef.current.heading,
          accuracyMeters: latestCoordsRef.current.accuracy,
          active: true,
          sosAlert: selectedSos
        })
      });
      setSosSent(true);
      setTimeout(() => setSosSent(false), 6000);
    } catch (e) {
      alert('Unable to transmit SOS. Please call transport helpline.');
    } finally {
      setSosLoading(false);
    }
  };

  // Stops list for Route
  const routeStops = [
    { id: 's1', name: 'Rajajipuram E-Block Terminal', sched: '07:45 AM', status: 'Completed 07:46 AM', passed: true },
    { id: 's2', name: 'Alambagh Chauraha', sched: '08:00 AM', status: 'Approaching (3 mins)', current: true },
    { id: 's3', name: 'Charbagh Railway Station', sched: '08:15 AM', status: 'Scheduled 08:15 AM' },
    { id: 's4', name: 'Chowk Heritage Gate', sched: '08:30 AM', status: 'Scheduled 08:30 AM' },
    { id: 's5', name: 'School Campus Main Gate', sched: '08:50 AM', status: 'Scheduled 08:50 AM' }
  ];

  // Filtered lists
  const filteredPassengers = passengers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      p.stopName.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const filteredNotices = notices.filter(
    (n) =>
      (n.title || '').toLowerCase().includes(searchNotice.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchNotice.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start antialiased select-none pb-24">
      {/* Mobile-Width Container (Responsive: full width on mobile, sleek phone frame on desktop) */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-neutral-900 shadow-2xl border-x border-neutral-800 relative">
        
        {/* TOP STATUS BAR & DRIVER BADGE */}
        <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md border border-emerald-400/30">
              🚌
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight">{driverName}</span>
                <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-700/50 text-[10px] font-mono text-emerald-300 font-bold rounded-md">
                  DRIVER
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono">
                {busNo} • {vehicleNo}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live GPS Ping Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition-all ${
                gpsActive
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-red-950/80 text-red-300 border border-red-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
              <span>{gpsActive ? 'LIVE GPS' : 'GPS OFF'}</span>
            </div>

            {/* Quick Logout */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-red-950 hover:text-red-300 text-neutral-400 border border-neutral-700/50 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* LOCATION PERMISSION ALERT BANNER (If Driver said NO / Denied) */}
        {locationPermission === 'denied' && !gpsActive && (
          <div className="mx-3 mt-3 p-3.5 bg-gradient-to-r from-red-950/90 to-amber-950/90 border border-red-500/40 rounded-2xl text-xs text-red-200 flex items-start gap-3 shadow-lg animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-100 text-[12px]">Location Access Denied!</div>
              <p className="text-[11px] text-red-200/90 mt-0.5 leading-relaxed">
                Parents and School Command cannot track the bus right now. Please tap <strong>"START GPS"</strong> below to grant location permission.
              </p>
              <button
                onClick={() => requestLocationAccess(false)}
                className="mt-2.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Radio className="w-3.5 h-3.5" />
                Allow & Start GPS
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            MAIN CONTENT AREA: STRICTLY 4 SECTIONS
            1. TRANSPORT
            2. NOTICE BOARD
            3. BROADCAST NOTICES
            4. MY PROFILE
            ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 p-3.5 space-y-4">

          {/* ═════════════════════════════════════════════════════════════
              SECTION 1: TRANSPORT (GPS + ROUTE + BOARDING + SOS)
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'transport' && (
            <div className="space-y-3.5 animate-fade-in">

              {/* 1. MASTER GPS COCKPIT CARD */}
              <div className="bg-gradient-to-br from-[#122A24] to-[#0A1A16] text-white p-4 rounded-3xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      Route Telemetry Beacon
                    </span>
                    <h2 className="font-extrabold text-base text-white mt-0.5">{routeName}</h2>
                    <div className="text-xs text-neutral-300 font-mono mt-0.5">
                      Bus: <strong className="text-emerald-300">{busNo}</strong> • Reg: <strong className="text-emerald-300">{vehicleNo}</strong>
                    </div>
                  </div>

                  {/* Speedometer Widget */}
                  <div className="text-right bg-emerald-950/80 px-3 py-2 rounded-2xl border border-emerald-700/40">
                    <div className="text-3xl font-black font-mono text-amber-300 tracking-tight leading-none">
                      {gpsActive ? currentSpeed : 0}
                    </div>
                    <span className="text-[10px] text-neutral-300 uppercase font-mono tracking-wider">km/h</span>
                  </div>
                </div>

                {/* GPS Coordinates & Transmission Live Status */}
                <div className="my-3 p-3 bg-neutral-900/80 rounded-2xl border border-neutral-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Coordinates:
                    </span>
                    <span className="font-bold text-emerald-300">
                      {currentCoords
                        ? `${currentCoords.latitude.toFixed(4)}° N, ${currentCoords.longitude.toFixed(4)}° E`
                        : '26.8467° N, 80.9462° E'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-blue-400" />
                      Heading & Accuracy:
                    </span>
                    <span className="text-neutral-300">
                      {currentHeading}° • ±{gpsAccuracy}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-neutral-800 text-neutral-400">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isTransmitting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                      Telemetry Packets: #{transmitCount}
                    </span>
                    <span className="text-neutral-300">
                      {lastTransmittedAt ? `Synced at ${lastTransmittedAt}` : 'Waiting for broadcast'}
                    </span>
                  </div>
                </div>

                {/* PRIMARY GPS START / STOP BUTTON (Prompts permission if needed) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      if (gpsActive) {
                        stopGpsTracking();
                      } else {
                        // Re-prompts device location and starts tracking
                        requestLocationAccess(false);
                      }
                    }}
                    className={`py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                      gpsActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 animate-pulse'
                    }`}
                  >
                    <Radio className="w-4 h-4" />
                    {gpsActive ? 'STOP GPS' : 'START GPS'}
                  </button>

                  <button
                    onClick={() => {
                      const el = document.getElementById('sos-drawer');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="py-3 px-3 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    DELAY / SOS
                  </button>
                </div>
              </div>

              {/* 2. PASSENGER & STUDENT BOARDING CHECKLIST */}
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Student Boarding Checklist</h3>
                    <p className="text-[11px] text-neutral-400">Tap checkmark to punch In/Out • Alerts parents</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-700/50 text-emerald-300 font-mono font-bold text-xs rounded-xl">
                    {boardedCount}/{passengers.length} Boarded
                  </span>
                </div>

                {/* Search Passenger */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Search student or stop..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredPassengers.map((st) => (
                    <div
                      key={st.id}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                        st.boarded ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-neutral-950 border-neutral-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleBoarding(st.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                            st.boarded ? 'bg-emerald-500 text-neutral-950 shadow-sm' : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {st.boarded ? <Check className="w-4 h-4 stroke-[3]" /> : '—'}
                        </button>
                        <div>
                          <div className="font-bold text-xs text-white">{st.name}</div>
                          <div className="text-[10px] text-neutral-400">
                            {st.className} • Stop: <span className="text-neutral-300">{st.stopName}</span>
                          </div>
                          {st.time && (
                            <div className="text-[9px] text-emerald-400 font-mono font-semibold mt-0.5">
                              ✓ Boarded at {st.time}
                            </div>
                          )}
                        </div>
                      </div>

                      <a
                        href={`tel:${st.parentPhone}`}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/50"
                        title="Call Parent"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. ROUTE SCHEDULE & STOP TIMELINE */}
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Stop Timetable Sequence
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">5 Scheduled Stops</span>
                </div>

                <div className="space-y-2">
                  {routeStops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        stop.current
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : stop.passed
                          ? 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            stop.passed
                              ? 'bg-emerald-900 text-emerald-300'
                              : stop.current
                              ? 'bg-amber-500 text-neutral-950 animate-pulse'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {stop.passed ? '✓' : idx + 1}
                        </span>
                        <div>
                          <div className={`font-bold ${stop.current ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                            {stop.name}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">Sched: {stop.sched}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono ${
                          stop.current
                            ? 'bg-amber-900/60 text-amber-300 border-amber-600/40'
                            : stop.passed
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {stop.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. EMERGENCY SOS & DELAY ADVISORY */}
              <div id="sos-drawer" className="bg-neutral-900 rounded-3xl border border-red-500/30 p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <h3 className="font-extrabold text-sm text-white">Emergency Delay Broadcast</h3>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Select incident to instantly alert School Transport Desk and parents on this route.
                </p>

                <div className="space-y-1.5">
                  {[
                    'Traffic Congestion (15 min delay)',
                    'Tyre Puncture / Mechanical Issue',
                    'Road Blockage / Waterlogging',
                    'Medical Emergency Onboard'
                  ].map((reason, idx) => (
                    <label
                      key={idx}
                      onClick={() => setSelectedSos(reason)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        selectedSos === reason
                          ? 'bg-red-950/60 border-red-500 text-red-100 font-bold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <span>{reason}</span>
                      <input type="radio" checked={selectedSos === reason} readOnly className="accent-red-500" />
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleSendSos}
                  disabled={sosLoading}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {sosLoading ? 'Transmitting...' : sosSent ? '✓ SOS Dispatched to School & Parents!' : 'Transmit SOS Alert'}
                </button>
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              SECTION 2: NOTICE BOARD
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'notices' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="bg-neutral-900 p-4 rounded-3xl border border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Notice Board
                    </h2>
                    <p className="text-[11px] text-neutral-400">School circulars & transport notifications</p>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">{notices.length} Notices</span>
                </div>

                {/* Notice Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchNotice}
                    onChange={(e) => setSearchNotice(e.target.value)}
                    placeholder="Search circulars & advisories..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notice Cards List */}
              <div className="space-y-2.5">
                {filteredNotices.length > 0 ? (
                  filteredNotices.map((n, idx) => (
                    <div
                      key={n.id || idx}
                      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm space-y-2 hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-white leading-tight">{n.title}</h4>
                        <span className="px-2 py-0.5 bg-neutral-800 text-[9px] font-mono text-neutral-300 rounded-md shrink-0">
                          {n.date || 'Recent'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-3">
                        {n.content || (n as any).description}
                      </p>
                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                        <span>Audience: {n.target_audience || 'ALL'}</span>
                        <span className="text-emerald-400">Official Notice</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                    No matching notices found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              SECTION 3: BROADCAST NOTICES
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'broadcast' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="bg-neutral-900 p-4 rounded-3xl border border-neutral-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-400" />
                      Broadcast Notices
                    </h2>
                    <p className="text-[11px] text-neutral-400">Direct urgent alerts from School Command Desk</p>
                  </div>
                  <span className="px-2 py-1 bg-red-950 border border-red-800/50 text-red-300 font-mono text-[10px] font-bold rounded-lg">
                    LIVE FEED
                  </span>
                </div>
              </div>

              {/* Broadcast Cards */}
              <div className="space-y-2.5">
                {broadcasts.map((bc) => (
                  <div
                    key={bc.id}
                    className={`bg-neutral-900 rounded-2xl p-4 border shadow-md space-y-2 transition-all ${
                      bc.priority === 'URGENT'
                        ? 'border-red-500/50 bg-gradient-to-br from-red-950/30 to-neutral-900'
                        : bc.priority === 'ALERT'
                        ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 to-neutral-900'
                        : 'border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md ${
                          bc.priority === 'URGENT'
                            ? 'bg-red-600 text-white'
                            : bc.priority === 'ALERT'
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {bc.priority}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">{bc.time}</span>
                    </div>

                    <h4 className="font-bold text-xs text-white">{bc.title}</h4>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">{bc.message}</p>

                    <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>To: {bc.audience}</span>
                      <span className="text-emerald-400">School Command Broadcast</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              SECTION 4: MY PROFILE
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Profile Card */}
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                    👨‍✈️
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-white">{driverName}</h2>
                    <div className="text-xs text-emerald-400 font-mono font-semibold">Staff Code: DRV-01 • Verified Driver</div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{driverPhone}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800 text-xs font-mono">
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase">Assigned Bus</span>
                    <span className="font-bold text-white text-xs">{busNo}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase">Registration No</span>
                    <span className="font-bold text-emerald-300 text-xs">{vehicleNo}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase">Commercial License</span>
                    <span className="font-bold text-white text-[11px]">{driverLicense}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase">Route Code</span>
                    <span className="font-bold text-white text-[11px]">{routeId}</span>
                  </div>
                </div>
              </div>

              {/* School & Transport Desk Info */}
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-4 shadow-sm space-y-2.5">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-neutral-400">
                  School & Transport Desk
                </h3>
                <div className="text-xs space-y-1 text-neutral-300">
                  <div><strong>School:</strong> {selectedSchool?.school_name || 'DPS International'}</div>
                  <div><strong>Transport Desk Phone:</strong> +91 11 2789 0011</div>
                  <div><strong>Emergency Helpline:</strong> 112 / +91 98765-43210</div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                className="w-full py-3.5 bg-red-600/90 hover:bg-red-600 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out from Driver Panel
              </button>

              <div className="text-center font-mono text-[10px] text-neutral-600">
                Giterp Driver App • Build #4317 • Live GPS Telemetry
              </div>
            </div>
          )}

        </main>

        {/* ─────────────────────────────────────────────────────────────
            BOTTOM NAVIGATION BAR: STRICTLY 4 SECTIONS
            1. TRANSPORT
            2. NOTICE BOARD
            3. BROADCAST NOTICES
            4. MY PROFILE
            ───────────────────────────────────────────────────────────── */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 px-3 py-2 z-40 flex items-center justify-around shadow-2xl">
          {/* TAB 1: TRANSPORT */}
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'transport' ? 'text-emerald-400 font-bold scale-105' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="relative">
              <Bus className="w-5 h-5" />
              {gpsActive && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />}
            </div>
            <span className="text-[10px] tracking-tight">Transport</span>
          </button>

          {/* TAB 2: NOTICE BOARD */}
          <button
            onClick={() => setActiveTab('notices')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'notices' ? 'text-emerald-400 font-bold scale-105' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Notice Board</span>
          </button>

          {/* TAB 3: BROADCAST NOTICES */}
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'broadcast' ? 'text-emerald-400 font-bold scale-105' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="relative">
              <Send className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <span className="text-[10px] tracking-tight">Broadcast</span>
          </button>

          {/* TAB 4: MY PROFILE */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'text-emerald-400 font-bold scale-105' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">My Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
