/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Navigation,
  ShieldCheck,
  Send,
  Plus,
  Compass,
  Gauge,
  User,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Smartphone,
  Play,
  Square,
  Check,
  Zap,
  Activity
} from 'lucide-react';
import { Student } from '@/lib/types';

export interface DashboardTransportProps {
  students: Student[];
  schoolName?: string;
}

interface RouteStop {
  id: string;
  name: string;
  scheduledTime: string;
  status: 'PASSED' | 'APPROACHING' | 'UPCOMING';
  etaMinutes: number;
  studentsCount: number;
}

interface BusRouteData {
  id: string;
  code: string;
  name: string;
  driver: string;
  driverPhone: string;
  attendant: string;
  attendantPhone: string;
  vehicleNo: string;
  capacity: string;
  status: 'ON_ROUTE' | 'CAMPUS' | 'MAINTENANCE';
  baseSpeed: number;
  stops: RouteStop[];
  pathCoords: { x: number; y: number }[];
}

export function DashboardTransport({ students, schoolName = 'DPS International — CBSE' }: DashboardTransportProps) {
  // Mode switch: 'FLEET' (Admin) vs 'DRIVER' (Option A Smartphone App) vs 'PARENT' (Ward tracking view)
  const [viewMode, setViewMode] = useState<'FLEET' | 'DRIVER' | 'PARENT'>('FLEET');
  const [selectedRouteId, setSelectedRouteId] = useState('ROUTE-04');
  const [gpsActive, setGpsActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sosSent, setSosSent] = useState(false);
  const [selectedSosReason, setSelectedSosReason] = useState('Traffic Congestion (15 mins delay)');
  const [parentSelectedWard, setParentSelectedWard] = useState('Aarav Sharma');

  // Option A: Real Device Geolocation Tracking State for Driver Smartphone
  const [driverTripActive, setDriverTripActive] = useState(false);
  const [liveDriverGeo, setLiveDriverGeo] = useState<{
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    accuracyMeters: number;
    lastUpdated: string;
  }>({
    latitude: 28.5355,
    longitude: 77.2090,
    speedKmh: 34,
    heading: 42,
    accuracyMeters: 4.2,
    lastUpdated: 'Just now'
  });
  const [geoWatchId, setGeoWatchId] = useState<number | null>(null);

  // Start Driver Trip & Watch HTML5 Geolocation
  const startDriverTrip = () => {
    setDriverTripActive(true);
    setGpsActive(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : Math.floor(28 + Math.random() * 12);
            setLiveDriverGeo({
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              speedKmh: speedKmh,
              heading: pos.coords.heading || 45,
              accuracyMeters: Math.round(pos.coords.accuracy || 5),
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });
          },
          (err) => {
            console.warn('[Driver GPS Geolocation Notice]', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
        setGeoWatchId(id);
      } catch (e) {}
    }
  };

  // Stop Driver Trip
  const stopDriverTrip = () => {
    setDriverTripActive(false);
    if (geoWatchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(geoWatchId);
      setGeoWatchId(null);
    }
  };

  // Multi-Route Fleet Definitions
  const routesData: BusRouteData[] = useMemo(() => [
    {
      id: 'ROUTE-04',
      code: 'BUS-04',
      name: 'Route 04 - South City & Hauz Khas',
      driver: 'Ramesh Kumar',
      driverPhone: '+91 98765-43210',
      attendant: 'Sunita Devi (Nanny)',
      attendantPhone: '+91 98765-43219',
      vehicleNo: 'DL-01-AB-8492',
      capacity: '32/36',
      status: 'ON_ROUTE',
      baseSpeed: 34,
      stops: [
        { id: 's1', name: 'Green Park Main Gate', scheduledTime: '08:05 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 4 },
        { id: 's2', name: 'Hauz Khas Metro Station', scheduledTime: '08:18 AM', status: 'APPROACHING', etaMinutes: 3, studentsCount: 8 },
        { id: 's3', name: 'Saket City Terminal', scheduledTime: '08:30 AM', status: 'UPCOMING', etaMinutes: 14, studentsCount: 6 },
        { id: 's4', name: 'Pushp Vihar Sector 3', scheduledTime: '08:42 AM', status: 'UPCOMING', etaMinutes: 26, studentsCount: 5 },
        { id: 's5', name: 'School Main Campus Gate', scheduledTime: '08:55 AM', status: 'UPCOMING', etaMinutes: 38, studentsCount: 0 },
      ],
      pathCoords: [
        { x: 30, y: 150 },
        { x: 130, y: 110 },
        { x: 250, y: 130 },
        { x: 380, y: 90 },
        { x: 500, y: 120 }
      ]
    },
    {
      id: 'ROUTE-01',
      code: 'BUS-01',
      name: 'Route 01 - North Campus & Civil Lines',
      driver: 'Sukhwinder Singh',
      driverPhone: '+91 98765-43211',
      attendant: 'Kavita Bai',
      attendantPhone: '+91 98765-43220',
      vehicleNo: 'DL-01-AB-1102',
      capacity: '36/36',
      status: 'ON_ROUTE',
      baseSpeed: 38,
      stops: [
        { id: 'n1', name: 'Model Town Metro', scheduledTime: '08:00 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 6 },
        { id: 'n2', name: 'Civil Lines Officer Enclave', scheduledTime: '08:15 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 10 },
        { id: 'n3', name: 'Kashmere Gate ISBT', scheduledTime: '08:28 AM', status: 'APPROACHING', etaMinutes: 4, studentsCount: 8 },
        { id: 'n4', name: 'School Main Campus Gate', scheduledTime: '08:50 AM', status: 'UPCOMING', etaMinutes: 25, studentsCount: 0 },
      ],
      pathCoords: [
        { x: 30, y: 160 },
        { x: 160, y: 80 },
        { x: 320, y: 140 },
        { x: 500, y: 120 }
      ]
    },
    {
      id: 'ROUTE-02',
      code: 'BUS-02',
      name: 'Route 02 - East Ring Road & Mayur Vihar',
      driver: 'Mukesh Sharma',
      driverPhone: '+91 98765-43212',
      attendant: 'Geeta Rani',
      attendantPhone: '+91 98765-43221',
      vehicleNo: 'DL-01-AB-2941',
      capacity: '28/36',
      status: 'ON_ROUTE',
      baseSpeed: 31,
      stops: [
        { id: 'e1', name: 'Preet Vihar Commercial Complex', scheduledTime: '08:10 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 5 },
        { id: 'e2', name: 'Mayur Vihar Phase 1 Pocket 2', scheduledTime: '08:22 AM', status: 'APPROACHING', etaMinutes: 2, studentsCount: 7 },
        { id: 'e3', name: 'Akshardham Flyover Junction', scheduledTime: '08:35 AM', status: 'UPCOMING', etaMinutes: 15, studentsCount: 4 },
        { id: 'e4', name: 'School Main Campus Gate', scheduledTime: '08:52 AM', status: 'UPCOMING', etaMinutes: 32, studentsCount: 0 },
      ],
      pathCoords: [
        { x: 40, y: 120 },
        { x: 180, y: 150 },
        { x: 350, y: 90 },
        { x: 500, y: 120 }
      ]
    },
    {
      id: 'ROUTE-03',
      code: 'BUS-03',
      name: 'Route 03 - West Metro & Janakpuri',
      driver: 'Jagdish Yadav',
      driverPhone: '+91 98765-43213',
      attendant: 'Santosh Kumar',
      attendantPhone: '+91 98765-43222',
      vehicleNo: 'DL-01-AB-3081',
      capacity: '30/36',
      status: 'CAMPUS',
      baseSpeed: 0,
      stops: [
        { id: 'w1', name: 'Uttam Nagar East', scheduledTime: '08:00 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 8 },
        { id: 'w2', name: 'Janakpuri District Centre', scheduledTime: '08:16 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 12 },
        { id: 'w3', name: 'Tilak Nagar Metro Pillar 420', scheduledTime: '08:30 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 10 },
        { id: 'w4', name: 'School Main Campus Gate', scheduledTime: '08:48 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 0 },
      ],
      pathCoords: [
        { x: 20, y: 140 },
        { x: 150, y: 100 },
        { x: 300, y: 150 },
        { x: 500, y: 120 }
      ]
    }
  ], []);

  const activeRoute = routesData.find(r => r.id === selectedRouteId) || routesData[0];

  // Dynamic Real-Time Simulation
  const [currentSpeed, setCurrentSpeed] = useState(activeRoute.baseSpeed);
  const [busProgressPercent, setBusProgressPercent] = useState(42);

  useEffect(() => {
    if (!gpsActive || activeRoute.status !== 'ON_ROUTE') {
      setCurrentSpeed(0);
      return;
    }
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 4;
      setCurrentSpeed(prev => Math.max(15, Math.min(45, Math.round(prev + delta))));
      setBusProgressPercent(prev => (prev >= 98 ? 10 : prev + 0.35));
    }, 2000);
    return () => clearInterval(interval);
  }, [activeRoute, gpsActive]);

  // Student Boarding Roster
  const [studentBoarding, setStudentBoarding] = useState([
    { id: 'b1', rollNo: '01', name: 'Aarav Sharma', class: 'Class VI-A', stop: 'Hauz Khas Metro Station', parentPhone: '+91 98102-38491', status: 'BOARDED', time: '08:12 AM' },
    { id: 'b2', rollNo: '04', name: 'Ananya Singhania', class: 'Class VI-A', stop: 'Green Park Main Gate', parentPhone: '+91 98111-22334', status: 'BOARDED', time: '08:04 AM' },
    { id: 'b3', rollNo: '05', name: 'Ayush Mehra', class: 'Class VI-A', stop: 'Hauz Khas Metro Station', parentPhone: '+91 98222-33445', status: 'WAITING', time: '' },
    { id: 'b4', rollNo: '06', name: 'Bhavya Joshi', class: 'Class VI-A', stop: 'Hauz Khas Metro Station', parentPhone: '+91 98333-44556', status: 'WAITING', time: '' },
    { id: 'b5', rollNo: '07', name: 'Dhruv Rastogi', class: 'Class VII-B', stop: 'Saket City Terminal', parentPhone: '+91 98444-55667', status: 'WAITING', time: '' },
    { id: 'b6', rollNo: '08', name: 'Divya Iyer', class: 'Class VIII-A', stop: 'Saket City Terminal', parentPhone: '+91 98555-66778', status: 'WAITING', time: '' },
  ]);

  const toggleBoarding = (id: string) => {
    setStudentBoarding(prev => prev.map(s => {
      if (s.id !== id) return s;
      const isBoarded = s.status === 'BOARDED';
      return {
        ...s,
        status: isBoarded ? 'WAITING' : 'BOARDED',
        time: isBoarded ? '' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }));
  };

  const boardedCount = studentBoarding.filter(s => s.status === 'BOARDED').length;
  const filteredBoarding = studentBoarding.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.stop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute interpolated coordinates on the SVG radar map
  const busCoordinates = useMemo(() => {
    const coords = activeRoute.pathCoords;
    const totalSegments = coords.length - 1;
    const segmentFraction = busProgressPercent / 100;
    const currentSegmentIndex = Math.min(totalSegments - 1, Math.floor(segmentFraction * totalSegments));
    const subT = (segmentFraction * totalSegments) - currentSegmentIndex;

    const p1 = coords[currentSegmentIndex];
    const p2 = coords[currentSegmentIndex + 1];

    const currentX = p1.x + (p2.x - p1.x) * subT;
    const currentY = p1.y + (p2.y - p1.y) * subT;

    return { x: Math.round(currentX), y: Math.round(currentY) };
  }, [activeRoute, busProgressPercent]);

  // SVG Path String
  const pathD = useMemo(() => {
    return activeRoute.pathCoords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [activeRoute]);

  // Ward Specific Data for Parent View
  const wardPassenger = studentBoarding.find(s => s.name === parentSelectedWard) || studentBoarding[0];
  const wardStop = activeRoute.stops.find(s => s.name === wardPassenger.stop) || activeRoute.stops[1];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs relative overflow-hidden">
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          TELEMETRY
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
            <Bus className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Transport &amp; Live GPS Fleet Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                4G LTE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E]">
              Real-time vehicle coordinates, stop sequence ETA, student boarding punches &amp; parent alerts.
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Fleet Command vs Driver GPS App vs Parent Ward View */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('FLEET')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border-none ${
                viewMode === 'FLEET' ? 'bg-white text-[#122A24] shadow-xs' : 'bg-transparent text-slate-600 hover:text-black'
              }`}
            >
              Fleet Command (Admin)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('DRIVER')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border-none flex items-center gap-1 ${
                viewMode === 'DRIVER' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600 hover:text-black'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Driver GPS App (Option A)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('PARENT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border-none flex items-center gap-1 ${
                viewMode === 'PARENT' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600 hover:text-black'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Track My Ward (Parent)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setGpsActive(!gpsActive)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs border-none cursor-pointer ${
              gpsActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${gpsActive ? 'animate-pulse' : ''}`} />
            <span>{gpsActive ? 'GPS Signal Locked' : 'GPS Offline'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DRIVER SMARTPHONE APP VIEW (OPTION A - ZERO HARDWARE PHONE GPS)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'DRIVER' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
          
          {/* Driver Phone Shell Container */}
          <div className="bg-[#122A24] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-500/30 space-y-6 relative overflow-hidden">
            
            {/* Top Status & Route Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/60">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-400/30 uppercase">
                    Driver Console • {activeRoute.code}
                  </span>
                  <span className="text-xs text-emerald-200 font-mono">{activeRoute.vehicleNo}</span>
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
                  {activeRoute.name}
                </h2>
                <div className="text-xs text-emerald-200/80 mt-0.5">
                  Assigned Driver: <strong>{activeRoute.driver}</strong> • Attendant: <strong>{activeRoute.attendant}</strong>
                </div>
              </div>

              {/* Start / Stop Route GPS Streaming Switch */}
              <div>
                {!driverTripActive ? (
                  <button
                    type="button"
                    onClick={startDriverTrip}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none animate-bounce"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START TRIP &amp; TRANSMIT GPS</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopDriverTrip}
                    className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>STOP TRIP (PARK BUS)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Telemetry KPI Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Live Speed</span>
                </div>
                <div className="font-display font-black text-2xl mt-1 text-white">
                  {driverTripActive ? liveDriverGeo.speedKmh : 0} <span className="text-xs font-normal text-emerald-300">km/h</span>
                </div>
                <div className="text-[9.5px] text-emerald-400 mt-0.5">CBSE Speed Limit: 40 km/h</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GPS Lock</span>
                </div>
                <div className="font-display font-black text-lg mt-1 text-emerald-300">
                  {driverTripActive ? `±${liveDriverGeo.accuracyMeters}m Sat Accuracy` : 'Standby Mode'}
                </div>
                <div className="text-[9.5px] text-slate-300 mt-0.5">HTML5 Geolocation High-Acc</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>On-Board Count</span>
                </div>
                <div className="font-display font-black text-2xl mt-1 text-white">
                  {boardedCount} / {studentBoarding.length}
                </div>
                <div className="text-[9.5px] text-emerald-400 mt-0.5">{studentBoarding.length - boardedCount} Remaining to Board</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next Stop ETA</span>
                </div>
                <div className="font-display font-black text-2xl mt-1 text-amber-400">
                  {activeRoute.stops[1]?.etaMinutes || 3} <span className="text-xs font-normal text-white">mins</span>
                </div>
                <div className="text-[9.5px] text-slate-300 mt-0.5">{activeRoute.stops[1]?.name.split(' ')[0]}</div>
              </div>
            </div>

            {/* Current Coordinates Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Current Coordinates: <strong>{liveDriverGeo.latitude}° N, {liveDriverGeo.longitude}° E</strong>
                </span>
              </div>
              <div className="text-emerald-300 text-[11px]">
                Updated: <strong>{liveDriverGeo.lastUpdated}</strong> • Status: <span className={driverTripActive ? 'text-emerald-300 font-bold' : 'text-slate-400'}>{driverTripActive ? 'TRANSMITTING LIVE' : 'STOPPED'}</span>
              </div>
            </div>

          </div>

          {/* Interactive Stop-By-Stop Passenger Roster */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA] flex-wrap gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Student Boarding Passenger Manifest ({studentBoarding.length} Scholars)</span>
                </h3>
                <p className="text-xs text-[#2D5A4E]">
                  Tap the checkmark when each student boards the bus. Auto SMS/WhatsApp alerts trigger for parents.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#F4F8F5] text-[#1C443A] text-xs font-mono font-bold border border-[#DCE8E0]">
                {boardedCount} of {studentBoarding.length} Boarded
              </span>
            </div>

            {/* Student List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studentBoarding.map(st => (
                <div
                  key={st.id}
                  onClick={() => toggleBoarding(st.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    st.status === 'BOARDED'
                      ? 'bg-[#EBF5EF] border-emerald-300 text-[#122A24]'
                      : 'bg-[#F9FCFA] border-[#DCE8E0] text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center transition-all border-none cursor-pointer ${
                        st.status === 'BOARDED'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-400 border border-slate-300'
                      }`}
                    >
                      {st.status === 'BOARDED' ? <Check className="w-4 h-4" /> : '—'}
                    </button>
                    <div>
                      <div className="font-bold text-xs text-[#122A24]">{st.name}</div>
                      <div className="text-[10px] text-[#2D5A4E]">{st.class} • Stop: {st.stop}</div>
                      {st.time && (
                        <div className="text-[9.5px] font-mono text-emerald-700 font-bold mt-0.5">
                          ✓ Boarded at {st.time} (Parent SMS Sent)
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    href={`tel:${st.parentPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 shadow-2xs no-underline"
                    title="Call Guardian"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Driver 1-Tap Emergency SOS Delay Dispatcher */}
          <div className="bg-white p-6 rounded-3xl border-2 border-rose-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#122A24]">
                  Driver SOS Delay Broadcast (1-Tap Alert)
                </h3>
                <p className="text-xs text-[#2D5A4E]">
                  Instantly sends delay notifications to all parents and alerts school transport desk.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                'Traffic Congestion (+15 mins delay)',
                'Tyre Puncture / Mechanic Repair (+25 mins)',
                'Monsoon Waterlogging / Route Diversion',
                'Emergency Mechanical Breakdown'
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedSosReason(reason)}
                  className={`p-3 rounded-xl text-left font-semibold border cursor-pointer transition-all ${
                    selectedSosReason === reason
                      ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                      : 'bg-[#F9FCFA] border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setSosSent(true);
                setTimeout(() => setSosSent(false), 4500);
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all border-none cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{sosSent ? 'Emergency Delay Broadcast Dispatched to All Parents! ✓' : `Broadcast Delay: "${selectedSosReason}"`}</span>
            </button>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PARENT LIVE WARD TRACKER VIEW
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'PARENT' && (
        <div className="space-y-6">
          {/* Parent Hero Card */}
          <div className="bg-gradient-to-br from-[#122A24] via-[#1A3D34] to-[#122A24] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-500/30 space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/60">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 font-display font-bold text-xl flex items-center justify-center border border-emerald-400/30 shadow-inner">
                  {wardPassenger.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                      {wardPassenger.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      {wardPassenger.class}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5 font-mono">
                    Assigned: <strong>{activeRoute.name}</strong> • Bus: <strong>{activeRoute.code} ({activeRoute.vehicleNo})</strong>
                  </p>
                </div>
              </div>

              {/* Ward Selector (For multi-child parents) */}
              <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto">
                <span className="text-[11px] font-mono text-emerald-200 px-2 font-bold">Select Ward:</span>
                <select
                  value={parentSelectedWard}
                  onChange={(e) => setParentSelectedWard(e.target.value)}
                  className="bg-[#122A24] text-emerald-100 text-xs px-3 py-1.5 rounded-xl border border-emerald-600/50 outline-none font-semibold cursor-pointer"
                >
                  {studentBoarding.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.class})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parent Live Stop ETA & Status Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Designated Stop</div>
                <div className="font-display font-bold text-base mt-1 text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{wardPassenger.stop}</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-1 font-mono">Scheduled Time: {wardStop?.scheduledTime || '08:18 AM'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Live Bus ETA</div>
                <div className="font-display font-bold text-2xl mt-1 text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-5 h-5" />
                  <span>{wardStop?.etaMinutes || 3} mins</span>
                </div>
                <div className="text-[10px] text-emerald-300 mt-1 font-mono">
                  Bus Status: <strong className="text-white">{wardStop?.status === 'PASSED' ? 'DEPARTED STOP' : 'APPROACHING STOP'}</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Ward Boarding Punch</div>
                <div className="font-display font-bold text-base mt-1 flex items-center gap-1.5 text-white">
                  <span className={`w-2.5 h-2.5 rounded-full ${wardPassenger.status === 'BOARDED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{wardPassenger.status === 'BOARDED' ? 'BOARDED SAFELY' : 'AWAITING PICKUP'}</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-1 font-mono">
                  {wardPassenger.time ? `Boarded at ${wardPassenger.time}` : 'Attendance not punched yet'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FLEET COMMAND RADAR (ADMIN MASTER FLEET RADAR)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'FLEET' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Columns: Multi-Route Selector & Interactive Live SVG Map */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Route Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {routesData.map((route) => {
                const isSelected = route.id === selectedRouteId;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-md ring-2 ring-emerald-600/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {route.code}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        route.status === 'ON_ROUTE' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div className="font-bold text-xs truncate">{route.name.split(' - ')[1] || route.name}</div>
                    <div className={`text-[10px] mt-1 font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {route.vehicleNo}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Vector Map Canvas */}
            <div className="bg-[#122A24] text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60 flex-wrap gap-2">
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    LIVE RADAR CANVAS • {activeRoute.code}
                  </div>
                  <h3 className="font-display font-bold text-base text-white mt-0.5">
                    {activeRoute.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="text-[10px] text-slate-400 uppercase">Live Speed</div>
                    <div className="text-base font-bold text-emerald-400">{currentSpeed} km/h</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5 animate-spin-slow" />
                  </div>
                </div>
              </div>

              {/* Simulated Graphical Route SVG */}
              <div className="relative w-full h-64 bg-emerald-950/40 rounded-2xl border border-emerald-900/50 p-4 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

                <svg className="w-full h-full" viewBox="0 0 550 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Route Track Path */}
                  <path
                    d={pathD}
                    stroke="#047857"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                  <path
                    d={pathD}
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Stop Waypoints */}
                  {activeRoute.pathCoords.map((pt, idx) => {
                    const stopInfo = activeRoute.stops[idx];
                    return (
                      <g key={idx}>
                        <circle cx={pt.x} cy={pt.y} r="7" fill="#122A24" stroke="#10B981" strokeWidth="2.5" />
                        <text x={pt.x} y={pt.y - 12} fill="#A7F3D0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {stopInfo?.name.split(' ')[0] || `Stop ${idx+1}`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Dynamic Moving Bus Marker */}
                  <g transform={`translate(${busCoordinates.x - 14}, ${busCoordinates.y - 14})`}>
                    <circle cx="14" cy="14" r="18" fill="#10B981" opacity="0.3" className="animate-ping" />
                    <rect x="2" y="2" width="24" height="24" rx="7" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="14" y="17" fill="#122A24" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                      BUS
                    </text>
                  </g>
                </svg>

                <div className="absolute bottom-3 left-3 bg-[#122A24]/90 px-3 py-1 rounded-xl border border-emerald-700/50 text-[10px] font-mono text-emerald-300">
                  Telemetry Ping: {gpsActive ? 'Active (Every 2s)' : 'Disconnected'}
                </div>
              </div>

              {/* Stop Progress Tracker Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                {activeRoute.stops.map((stop, i) => (
                  <div key={stop.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Stop {i + 1}</span>
                      <span className={stop.status === 'PASSED' ? 'text-emerald-400' : 'text-amber-400'}>
                        {stop.status}
                      </span>
                    </div>
                    <div className="font-bold text-white text-[11px] truncate mt-0.5">{stop.name}</div>
                    <div className="text-[10px] text-emerald-300 mt-1">ETA: {stop.etaMinutes}m ({stop.scheduledTime})</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Driver Details & Emergency Dispatch Panel */}
          <div className="space-y-6">
            
            {/* Driver & Attendant Contact Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-[#122A24] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Crew &amp; Safety Officers</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#122A24]">{activeRoute.driver}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Designated Driver • DL Validated</div>
                  </div>
                  <a
                    href={`tel:${activeRoute.driverPhone}`}
                    className="px-3 py-1.5 bg-[#122A24] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs no-underline"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Call</span>
                  </a>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#122A24]">{activeRoute.attendant}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Bus Attendant / Nanny</div>
                  </div>
                  <a
                    href={`tel:${activeRoute.attendantPhone}`}
                    className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1.5 no-underline"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Passenger Boarding Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-display font-bold text-sm text-[#122A24]">
                  Passenger Boarding ({boardedCount}/{studentBoarding.length})
                </h3>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  {Math.round((boardedCount / studentBoarding.length) * 100)}% Boarded
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {studentBoarding.map(st => (
                  <div key={st.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#122A24]">{st.name}</div>
                      <div className="text-[10px] text-slate-500">{st.class} • {st.stop.split(' ')[0]}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      st.status === 'BOARDED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
