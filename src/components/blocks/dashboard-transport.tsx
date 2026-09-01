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
  RefreshCw
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
  // Mode switch: 'FLEET' (Admin) vs 'PARENT' (Ward tracking view)
  const [viewMode, setViewMode] = useState<'FLEET' | 'PARENT'>('FLEET');
  const [selectedRouteId, setSelectedRouteId] = useState('ROUTE-04');
  const [gpsActive, setGpsActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sosSent, setSosSent] = useState(false);
  const [selectedSosReason, setSelectedSosReason] = useState('Traffic Congestion (15 mins delay)');
  const [parentSelectedWard, setParentSelectedWard] = useState('Aarav Sharma');

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
        { id: 'w1', name: 'Janakpuri District Centre', scheduledTime: '07:50 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 8 },
        { id: 'w2', name: 'Tilak Nagar Metro Station', scheduledTime: '08:05 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 6 },
        { id: 'w3', name: 'Rajouri Garden Roundabout', scheduledTime: '08:20 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 7 },
        { id: 'w4', name: 'School Main Campus Gate', scheduledTime: '08:40 AM', status: 'PASSED', etaMinutes: 0, studentsCount: 0 },
      ],
      pathCoords: [
        { x: 30, y: 100 },
        { x: 170, y: 130 },
        { x: 330, y: 100 },
        { x: 500, y: 120 }
      ]
    }
  ], []);

  const activeRoute = useMemo(() => {
    return routesData.find(r => r.id === selectedRouteId) || routesData[0];
  }, [routesData, selectedRouteId]);

  // Live Simulated Speed & Coordinates Ticker
  const [currentSpeed, setCurrentSpeed] = useState(activeRoute.baseSpeed);
  const [busProgressPercent, setBusProgressPercent] = useState(38); // 0 to 100% along path

  useEffect(() => {
    setCurrentSpeed(activeRoute.baseSpeed);
    if (activeRoute.status === 'CAMPUS') {
      setBusProgressPercent(100);
      return;
    }
    setBusProgressPercent(38);

    const interval = setInterval(() => {
      if (!gpsActive) return;
      const delta = Math.floor(Math.random() * 7) - 3;
      const newSpeed = Math.max(18, Math.min(42, activeRoute.baseSpeed + delta));
      setCurrentSpeed(newSpeed);
      setBusProgressPercent(prev => (prev >= 96 ? 20 : prev + 0.3));
    }, 2500);

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

        {/* View Mode Toggle: Fleet Command vs Parent Ward View */}
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
          PARENT LIVE WARD TRACKER VIEW
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'PARENT' ? (
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
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      {wardPassenger.class}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
                    Designated Stop: <strong>{wardPassenger.stop}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-300">Select Ward:</span>
                <select
                  value={parentSelectedWard}
                  onChange={(e) => setParentSelectedWard(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-xs text-white font-bold focus:outline-emerald-400 cursor-pointer"
                >
                  {studentBoarding.map(s => (
                    <option key={s.id} value={s.name} className="bg-slate-900 text-white">
                      {s.name} ({s.class})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Distance & ETA Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 space-y-1">
                <span className="text-[11px] font-mono uppercase text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Estimated Time of Arrival (ETA)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
                  ~ {wardStop.etaMinutes} Minutes
                </div>
                <div className="text-[11px] text-emerald-200/80">
                  {wardStop.status === 'PASSED' ? 'Bus has departed this stop' : 'Bus is en route to your stop'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 space-y-1">
                <span className="text-[11px] font-mono uppercase text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  Live Distance From Stop
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {wardStop.status === 'PASSED' ? '0.0 km' : `${(wardStop.etaMinutes * 0.28).toFixed(1)} km`}
                </div>
                <div className="text-[11px] text-emerald-200/80">
                  Speed: {currentSpeed} km/h (CBSE Compliant)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 space-y-1">
                <span className="text-[11px] font-mono uppercase text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Student Boarding Status
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-mono">
                  {wardPassenger.status === 'BOARDED' ? `✅ ${wardPassenger.status}` : `⏳ ${wardPassenger.status}`}
                </div>
                <div className="text-[11px] text-emerald-200/80">
                  {wardPassenger.time ? `Boarded at ${wardPassenger.time}` : 'Awaiting boarding punch'}
                </div>
              </div>
            </div>

            {/* Crew Contacts & Call Desk */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Designated Driver</span>
                  <span className="font-bold text-white text-sm">{activeRoute.driver}</span>
                  <span className="text-slate-300 font-mono text-[11px] ml-2">({activeRoute.vehicleNo})</span>
                </div>
                <div className="border-l border-white/15 pl-4">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Bus Attendant</span>
                  <span className="font-bold text-white text-sm">{activeRoute.attendant}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${activeRoute.driverPhone}`}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all text-xs no-underline"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver
                </a>
                <a
                  href={`tel:${activeRoute.attendantPhone}`}
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all text-xs no-underline border border-white/20"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Attendant
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────
          REAL-TIME FLEET TELEMETRY METRICS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-1">
          <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>ACTIVE BUS FLEET</span>
            <Bus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#122A24] font-mono">
            {routesData.filter(r => r.status === 'ON_ROUTE').length} / {routesData.length}
          </div>
          <div className="text-xs text-emerald-700 font-semibold">100% Vehicles Operational</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-1">
          <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>STUDENTS BOARDED</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
            {boardedCount} / {studentBoarding.length}
          </div>
          <div className="text-xs text-emerald-700 font-semibold">Morning Pickup Route Active</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-1">
          <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>CURRENT SPEED ({activeRoute.code})</span>
            <Gauge className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {currentSpeed} km/h
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {currentSpeed <= 40 ? '✓ Within CBSE 40 km/h speed limit' : '⚠️ Warning: Near limit'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-1">
          <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>SOS &amp; DELAY ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#122A24] font-mono">
            {sosSent ? 1 : 0}
          </div>
          <div className="text-xs text-emerald-700 font-semibold">
            {sosSent ? 'Delay broadcast active' : 'All routes on schedule'}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN INTERACTIVE MAP RADAR & STOPS MATRIX
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual GPS Map Canvas & Route Selector (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Route Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {routesData.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRouteId(r.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedRouteId === r.id
                    ? 'bg-[#122A24] text-white border-[#122A24] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Animated Route Map Canvas */}
          <div className="bg-[#122A24] text-white p-6 rounded-3xl shadow-xl border border-emerald-500/20 relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-extrabold text-base text-white">
                  Live GPS Radar: {activeRoute.code} ({activeRoute.vehicleNo})
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold">
                  Lat: 28.5355° N • Lng: 77.2090° E
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-600/50 font-bold">
                  {currentSpeed} km/h
                </span>
              </div>
            </div>

            {/* SVG Visual Road Map Canvas with Dynamic Moving Bus */}
            <div className="relative w-full h-56 sm:h-64 bg-emerald-950/80 rounded-2xl border border-emerald-800/60 overflow-hidden shadow-inner flex items-center justify-center">
              {/* Radar Grid Lines Background */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle at center, #34D399 1px, transparent 1px), linear-gradient(to right, #059669 1px, transparent 1px), linear-gradient(to bottom, #059669 1px, transparent 1px)`,
                  backgroundSize: '32px 32px'
                }}
              />

              {/* Pulsing Radar Ring */}
              <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20 animate-ping pointer-events-none" />

              <svg viewBox="0 0 540 220" className="w-full h-full p-4 relative z-10">
                {/* Route Path Polyline (Glow Effect) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-50"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Stop Nodes */}
                {activeRoute.pathCoords.map((pt, idx) => {
                  const stopInfo = activeRoute.stops[idx];
                  const isCampus = idx === activeRoute.pathCoords.length - 1;
                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isCampus ? 7 : 5}
                        fill={isCampus ? '#F59E0B' : stopInfo?.status === 'PASSED' ? '#10B981' : '#E2E8F0'}
                        stroke="#064E3B"
                        strokeWidth="2"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#E2E8F0"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {stopInfo ? stopInfo.name.split(' ')[0] : ''}
                      </text>
                    </g>
                  );
                })}

                {/* Moving Bus Marker */}
                <g transform={`translate(${busCoordinates.x - 14}, ${busCoordinates.y - 14})`}>
                  <circle cx="14" cy="14" r="18" fill="#34D399" className="opacity-30 animate-pulse" />
                  <rect x="2" y="2" width="24" height="24" rx="7" fill="#F59E0B" stroke="#000" strokeWidth="1.5" />
                  <text x="14" y="17" textAnchor="middle" fontSize="11" fontWeight="bold">🚌</text>
                </g>
              </svg>

              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-xl text-[10px] font-mono text-emerald-300 border border-white/10">
                GPS Satellite Fix: 14 Sats • Signal: 98% (High Precision)
              </div>
            </div>

            {/* Stops Timeline & Live ETA Badges */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider block">
                STOP SEQUENCE &amp; LIVE TIMELINE
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeRoute.stops.map((stop, i) => (
                  <div
                    key={stop.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1 transition-all ${
                      stop.status === 'PASSED'
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-slate-300'
                        : stop.status === 'APPROACHING'
                        ? 'bg-amber-950/60 border-amber-500/80 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[10px] text-slate-400 font-bold">Stop #{i + 1}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                        stop.status === 'PASSED'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : stop.status === 'APPROACHING'
                          ? 'bg-amber-500 text-black animate-pulse'
                          : 'bg-white/10 text-slate-300'
                      }`}>
                        {stop.status === 'APPROACHING' ? `~${stop.etaMinutes}m ETA` : stop.status}
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs">{stop.name}</div>
                    <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Sched: {stop.scheduledTime}</span>
                      <span>{stop.studentsCount} Students</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Buses Fleet Registry Table */}
          <div className="bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-3">
            <h3 className="font-display font-bold text-sm text-[#122A24]">
              Campus Fleet Telemetry Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-[#DCE8E0] text-[10px] uppercase font-mono font-bold text-slate-400">
                    <th className="pb-2">Bus Code</th>
                    <th className="pb-2">Assigned Route</th>
                    <th className="pb-2">Driver Name</th>
                    <th className="pb-2">Vehicle Plate</th>
                    <th className="pb-2">Capacity</th>
                    <th className="pb-2">Live Speed</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {routesData.map((bus) => (
                    <tr
                      key={bus.id}
                      onClick={() => setSelectedRouteId(bus.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedRouteId === bus.id ? 'bg-emerald-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 font-bold text-[#122A24]">{bus.code}</td>
                      <td className="py-2.5 font-sans font-semibold text-[#122A24]">{bus.name}</td>
                      <td className="py-2.5 font-sans text-slate-600">{bus.driver}</td>
                      <td className="py-2.5 text-slate-600">{bus.vehicleNo}</td>
                      <td className="py-2.5 font-bold text-emerald-800">{bus.capacity}</td>
                      <td className="py-2.5 font-bold text-amber-600">
                        {bus.id === selectedRouteId ? `${currentSpeed} km/h` : `${bus.baseSpeed} km/h`}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bus.status === 'ON_ROUTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {bus.status === 'ON_ROUTE' ? 'Active On-Route' : 'At Campus'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Student Boarding Checklist & Emergency SOS Dispatcher (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Student Boarding Punch Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8F0EA]">
              <div>
                <h3 className="font-display font-bold text-sm text-[#122A24]">
                  Passenger Check-in Ledger
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {activeRoute.code} Passengers • Tap to Check-in
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                {boardedCount}/{studentBoarding.length} Boarded
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or stop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredBoarding.map((st) => (
                <div
                  key={st.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    st.status === 'BOARDED' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleBoarding(st.id)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer border-none ${
                        st.status === 'BOARDED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st.status === 'BOARDED' ? '✓' : '—'}
                    </button>
                    <div>
                      <div className="font-bold text-xs text-[#122A24]">{st.name}</div>
                      <div className="text-[10px] text-slate-500">{st.class} • {st.stop.split(' ')[0]}</div>
                      {st.time && (
                        <div className="text-[9.5px] font-mono text-emerald-700 font-bold">
                          Boarded at {st.time} (SMS Alert Sent)
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    href={`tel:${st.parentPhone}`}
                    className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 shadow-2xs no-underline"
                    title="Call Guardian"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Transport Delay & Emergency SOS Dispatcher */}
          <div className="bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#122A24]">
                  Route Delay &amp; SOS Dispatcher
                </h3>
                <p className="text-[11px] text-slate-500">
                  Broadcasts emergency/delay SMS to all parents on {activeRoute.code}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">Select Delay Reason *</label>
              <select
                value={selectedSosReason}
                onChange={(e) => setSelectedSosReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none font-semibold"
              >
                <option>Traffic Congestion (15 mins delay)</option>
                <option>Tyre Puncture / Mechanical Repair</option>
                <option>Heavy Monsoon Waterlogging / Diversion</option>
                <option>Emergency Medical Halt</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSosSent(true);
                setTimeout(() => setSosSent(false), 4500);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all border-none cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sosSent ? 'Delay Broadcast Dispatched to Parents! ✓' : 'Broadcast Delay Alert to Parents'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
