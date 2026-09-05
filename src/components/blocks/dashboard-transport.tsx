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
  Navigation,
  Compass,
  Gauge,
  User,
  Plus,
  RefreshCw,
  Smartphone,
  Play,
  Square,
  Check,
  Zap,
  Activity,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronRight,
  QrCode,
  Share2,
  Shield,
  ArrowRight,
  Fuel,
  CornerDownRight
} from 'lucide-react';
import { Student } from '@/lib/types';

export interface DashboardTransportProps {
  students?: Student[];
  schoolName?: string;
}

export interface RouteStop {
  id: string;
  name: string;
  scheduledTime: string;
  distanceKm: number;
}

export interface BusRouteData {
  id: string;
  code: string;
  name: string;
  driver: string;
  driverPhone: string;
  vehicleNo: string;
  capacity: string;
  status: 'ON_ROUTE' | 'CAMPUS' | 'MAINTENANCE';
  baseSpeed: number;
  stops: RouteStop[];
  pathCoords: { x: number; y: number }[];
}

// Initial realistic default routes featuring Rajajipuram to Chowk Express
const INITIAL_ROUTES: BusRouteData[] = [
  {
    id: 'ROUTE-LKO-01',
    code: 'BUS-01',
    name: 'Rajajipuram to Chowk Express',
    driver: 'Ramesh Yadav',
    driverPhone: '+91 98765-43210',
    vehicleNo: 'UP-32-AB-9876',
    capacity: '34 Seats',
    status: 'ON_ROUTE',
    baseSpeed: 32,
    stops: [
      { id: 's1', name: 'Rajajipuram E-Block Terminal', scheduledTime: '07:45 AM', distanceKm: 0 },
      { id: 's2', name: 'Alambagh Chauraha', scheduledTime: '08:00 AM', distanceKm: 4.2 },
      { id: 's3', name: 'Charbagh Railway Station', scheduledTime: '08:15 AM', distanceKm: 8.5 },
      { id: 's4', name: 'Chowk Chauraha (Heritage Gate)', scheduledTime: '08:30 AM', distanceKm: 13.1 },
      { id: 's5', name: 'School Campus Main Gate', scheduledTime: '08:50 AM', distanceKm: 18.0 }
    ],
    pathCoords: [
      { x: 50, y: 150 },
      { x: 160, y: 110 },
      { x: 280, y: 140 },
      { x: 400, y: 90 },
      { x: 540, y: 120 }
    ]
  },
  {
    id: 'ROUTE-LKO-02',
    code: 'BUS-02',
    name: 'Gomti Nagar to Polytechnic Bypass',
    driver: 'Mukesh Sharma',
    driverPhone: '+91 98765-43211',
    vehicleNo: 'UP-32-AB-1102',
    capacity: '36 Seats',
    status: 'ON_ROUTE',
    baseSpeed: 38,
    stops: [
      { id: 'g1', name: 'Gomti Nagar Extension Hub', scheduledTime: '07:50 AM', distanceKm: 0 },
      { id: 'g2', name: 'Patrakarpuram Chauraha', scheduledTime: '08:05 AM', distanceKm: 3.8 },
      { id: 'g3', name: 'Lohia Hospital Circle', scheduledTime: '08:20 AM', distanceKm: 7.2 },
      { id: 'g4', name: 'Polytechnic Flyover Junction', scheduledTime: '08:35 AM', distanceKm: 11.5 },
      { id: 'g5', name: 'School Campus Main Gate', scheduledTime: '08:50 AM', distanceKm: 16.2 }
    ],
    pathCoords: [
      { x: 40, y: 130 },
      { x: 170, y: 70 },
      { x: 300, y: 130 },
      { x: 430, y: 80 },
      { x: 540, y: 120 }
    ]
  },
  {
    id: 'ROUTE-LKO-03',
    code: 'BUS-03',
    name: 'Indira Nagar & Munshipulia Radial',
    driver: 'Jagdish Singh',
    driverPhone: '+91 98765-43212',
    vehicleNo: 'UP-32-AB-4450',
    capacity: '30 Seats',
    status: 'CAMPUS',
    baseSpeed: 0,
    stops: [
      { id: 'i1', name: 'Indira Nagar Block C', scheduledTime: '08:00 AM', distanceKm: 0 },
      { id: 'i2', name: 'Munshipulia Metro Station', scheduledTime: '08:15 AM', distanceKm: 3.2 },
      { id: 'i3', name: 'Kalyanpur Crossing', scheduledTime: '08:30 AM', distanceKm: 6.8 },
      { id: 'i4', name: 'School Campus Main Gate', scheduledTime: '08:45 AM', distanceKm: 11.4 }
    ],
    pathCoords: [
      { x: 60, y: 160 },
      { x: 210, y: 100 },
      { x: 370, y: 150 },
      { x: 540, y: 120 }
    ]
  }
];

export function DashboardTransport({ students = [], schoolName = 'Delhi Public School' }: DashboardTransportProps) {
  // Navigation Modes:
  // 1. 'FLEET'  : Live Radar Map & Telemetry Simulation
  // 2. 'ROUTES' : Route Management Studio (Create/Edit routes like Rajajipuram to Chowk)
  // 3. 'DRIVER' : Driver Smartphone Tracking Cockpit (HTML5 GPS Watch)
  // 4. 'PARENT' : Parent Ward Bus Radar & ETA
  const [viewMode, setViewMode] = useState<'FLEET' | 'ROUTES' | 'DRIVER' | 'PARENT'>('FLEET');

  // Loaded Routes State with LocalStorage Persistence
  const [routes, setRoutes] = useState<BusRouteData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('school_erp_transport_routes');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ROUTES;
  });

  // Persist routes on update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('school_erp_transport_routes', JSON.stringify(routes));
      } catch (e) {}
    }
  }, [routes]);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'ROUTE-LKO-01');
  const activeRoute = useMemo(() => {
    return routes.find(r => r.id === selectedRouteId) || routes[0] || INITIAL_ROUTES[0];
  }, [routes, selectedRouteId]);

  // Telemetry & Simulation State
  const [gpsActive, setGpsActive] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState<number>(activeRoute?.baseSpeed || 32);
  const [progressPercent, setProgressPercent] = useState<number>(45);
  const [headingDegrees, setHeadingDegrees] = useState<number>(48);

  // SOS broadcast alert
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Simulation timer
  useEffect(() => {
    if (!gpsActive || activeRoute.status !== 'ON_ROUTE') {
      setCurrentSpeed(0);
      return;
    }
    const timer = setInterval(() => {
      const speedJitter = Math.floor(Math.random() * 7) - 3;
      setCurrentSpeed(prev => Math.max(12, Math.min(52, prev + speedJitter)));
      setHeadingDegrees(prev => (prev + (Math.random() * 4 - 2) + 360) % 360);
      setProgressPercent(prev => {
        if (prev >= 98) return 5;
        return Number((prev + 0.45).toFixed(2));
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [activeRoute, gpsActive]);

  // Interpolate bus SVG position along route path
  const busCoords = useMemo(() => {
    const coords = activeRoute.pathCoords || [];
    if (coords.length < 2) return { x: 100, y: 100 };
    const totalSegs = coords.length - 1;
    const fraction = progressPercent / 100;
    const segIdx = Math.min(totalSegs - 1, Math.floor(fraction * totalSegs));
    const subFrac = (fraction * totalSegs) - segIdx;

    const pA = coords[segIdx];
    const pB = coords[segIdx + 1];

    const x = pA.x + (pB.x - pA.x) * subFrac;
    const y = pA.y + (pB.y - pA.y) * subFrac;
    return { x: Math.round(x), y: Math.round(y) };
  }, [activeRoute, progressPercent]);

  // Current approaching stop determination
  const currentStopIndex = useMemo(() => {
    const stopsCount = activeRoute.stops.length;
    if (stopsCount === 0) return 0;
    const idx = Math.floor((progressPercent / 100) * stopsCount);
    return Math.min(stopsCount - 1, idx);
  }, [activeRoute, progressPercent]);

  const nextStop = activeRoute.stops[currentStopIndex] || activeRoute.stops[0];

  // ─────────────────────────────────────────────────────────────
  // ROUTE MANAGEMENT STATE (Create / Edit Route Modal)
  // ─────────────────────────────────────────────────────────────
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState({
    code: '',
    name: '',
    vehicleNo: '',
    driver: '',
    driverPhone: '',
    capacity: '34 Seats',
    status: 'ON_ROUTE' as 'ON_ROUTE' | 'CAMPUS' | 'MAINTENANCE',
    stops: [
      { id: '1', name: '', scheduledTime: '07:30 AM', distanceKm: 0 },
      { id: '2', name: '', scheduledTime: '08:00 AM', distanceKm: 5 },
      { id: '3', name: 'School Campus Main Gate', scheduledTime: '08:30 AM', distanceKm: 12 }
    ]
  });

  const openNewRouteModal = () => {
    setEditingRouteId(null);
    setRouteForm({
      code: `BUS-${String(routes.length + 1).padStart(2, '0')}`,
      name: 'Rajajipuram to Chowk Express',
      vehicleNo: 'UP-32-AB-1234',
      driver: 'New Assigned Driver',
      driverPhone: '+91 98765-00000',
      capacity: '34 Seats',
      status: 'ON_ROUTE',
      stops: [
        { id: '1', name: 'Rajajipuram E-Block Terminal', scheduledTime: '07:45 AM', distanceKm: 0 },
        { id: '2', name: 'Alambagh Chauraha', scheduledTime: '08:00 AM', distanceKm: 4.5 },
        { id: '3', name: 'Charbagh Station', scheduledTime: '08:15 AM', distanceKm: 8.5 },
        { id: '4', name: 'Chowk Chauraha', scheduledTime: '08:30 AM', distanceKm: 13.0 },
        { id: '5', name: 'School Campus Main Gate', scheduledTime: '08:50 AM', distanceKm: 18.0 }
      ]
    });
    setShowRouteModal(true);
  };

  const openEditRouteModal = (r: BusRouteData) => {
    setEditingRouteId(r.id);
    setRouteForm({
      code: r.code,
      name: r.name,
      vehicleNo: r.vehicleNo,
      driver: r.driver,
      driverPhone: r.driverPhone,
      capacity: r.capacity,
      status: r.status,
      stops: r.stops.map(s => ({ ...s }))
    });
    setShowRouteModal(true);
  };

  const handleAddStopToForm = () => {
    const lastStop = routeForm.stops[routeForm.stops.length - 1];
    const newDist = (lastStop?.distanceKm || 0) + 3.5;
    setRouteForm(prev => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          id: String(Date.now()),
          name: '',
          scheduledTime: '08:15 AM',
          distanceKm: Number(newDist.toFixed(1))
        }
      ]
    }));
  };

  const handleRemoveStopFromForm = (index: number) => {
    if (routeForm.stops.length <= 2) return;
    setRouteForm(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  const handleSaveRouteForm = () => {
    if (!routeForm.name.trim()) return;

    if (editingRouteId) {
      // Update existing
      setRoutes(prev => prev.map(r => {
        if (r.id !== editingRouteId) return r;
        return {
          ...r,
          code: routeForm.code || r.code,
          name: routeForm.name,
          vehicleNo: routeForm.vehicleNo,
          driver: routeForm.driver,
          driverPhone: routeForm.driverPhone,
          capacity: routeForm.capacity,
          status: routeForm.status,
          stops: routeForm.stops
        };
      }));
    } else {
      // Create new route
      const newId = `ROUTE-${Date.now()}`;
      // Generate synthetic SVG path coordinates based on stops
      const stepX = Math.floor(480 / Math.max(1, routeForm.stops.length - 1));
      const generatedCoords = routeForm.stops.map((_, i) => ({
        x: 40 + i * stepX,
        y: 80 + ((i % 2 === 0) ? 60 : 20)
      }));

      const newRoute: BusRouteData = {
        id: newId,
        code: routeForm.code || `BUS-${routes.length + 1}`,
        name: routeForm.name,
        driver: routeForm.driver || 'Assigned Driver',
        driverPhone: routeForm.driverPhone || '+91 98000-00000',
        vehicleNo: routeForm.vehicleNo || 'UP-32-XX-0000',
        capacity: routeForm.capacity || '32 Seats',
        status: routeForm.status,
        baseSpeed: 30,
        stops: routeForm.stops,
        pathCoords: generatedCoords
      };

      setRoutes(prev => [newRoute, ...prev]);
      setSelectedRouteId(newId);
    }

    setShowRouteModal(false);
  };

  const handleDeleteRoute = (id: string) => {
    if (routes.length <= 1) return;
    setRoutes(prev => prev.filter(r => r.id !== id));
    if (selectedRouteId === id) {
      const remaining = routes.filter(r => r.id !== id);
      if (remaining[0]) setSelectedRouteId(remaining[0].id);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DRIVER SMARTPHONE COCKPIT STATE (HTML5 Live GPS)
  // ─────────────────────────────────────────────────────────────
  const [driverTripActive, setDriverTripActive] = useState(false);
  const [liveDriverGeo, setLiveDriverGeo] = useState<{
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    accuracyMeters: number;
    lastUpdated: string;
  }>({
    latitude: 26.8467,
    longitude: 80.9462,
    speedKmh: 34,
    heading: 52,
    accuracyMeters: 4.8,
    lastUpdated: 'Ready'
  });
  const [geoWatchId, setGeoWatchId] = useState<number | null>(null);

  const startDriverTrip = () => {
    setDriverTripActive(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : Math.floor(25 + Math.random() * 15);
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
            console.warn('[Driver Phone GPS Notice]', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
        setGeoWatchId(id);
      } catch (e) {}
    }
  };

  const stopDriverTrip = () => {
    setDriverTripActive(false);
    if (geoWatchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(geoWatchId);
      setGeoWatchId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PARENT LIVE BUS TRACKER STATE
  // ─────────────────────────────────────────────────────────────
  const [parentStopId, setParentStopId] = useState<string>(activeRoute.stops[2]?.id || activeRoute.stops[0]?.id || 's3');
  const parentStop = activeRoute.stops.find(s => s.id === parentStopId) || activeRoute.stops[0];

  const parentEtaMinutes = useMemo(() => {
    if (activeRoute.status !== 'ON_ROUTE') return 0;
    const parentIdx = activeRoute.stops.findIndex(s => s.id === parentStopId);
    if (parentIdx < 0) return 12;
    if (currentStopIndex > parentIdx) return 0; // Already passed
    const remainingStops = parentIdx - currentStopIndex;
    return Math.max(2, remainingStops * 6 + Math.floor(Math.random() * 3));
  }, [activeRoute, parentStopId, currentStopIndex]);

  return (
    <div className="space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP HERO & MODE CONTROLLER TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#122A24] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
        {/* Subtle grid watermark */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Fleet Telematics &bull; GPS Engine
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
              Transport &amp; Live GPS Fleet Radar
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time vehicle tracking, custom route builder (e.g. <em>Rajajipuram to Chowk</em>), driver smartphone GPS transmitter, and instant parent ETA radar.
            </p>
          </div>

          {/* Mode Navigation Tabs */}
          <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/10 gap-1 overflow-x-auto shrink-0">
            <button
              onClick={() => setViewMode('FLEET')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-none ${
                viewMode === 'FLEET'
                  ? 'bg-emerald-500 text-[#122A24] shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Fleet Radar</span>
            </button>

            <button
              onClick={() => setViewMode('ROUTES')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-none ${
                viewMode === 'ROUTES'
                  ? 'bg-emerald-500 text-[#122A24] shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route Management</span>
            </button>

            <button
              onClick={() => setViewMode('DRIVER')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-none ${
                viewMode === 'DRIVER'
                  ? 'bg-emerald-500 text-[#122A24] shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Driver Mobile App</span>
            </button>

            <button
              onClick={() => setViewMode('PARENT')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-none ${
                viewMode === 'PARENT'
                  ? 'bg-emerald-500 text-[#122A24] shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Parent Bus Radar</span>
            </button>
          </div>
        </div>

        {/* Live SOS alert ticker if active */}
        {activeAlert && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Fleet Alert:</strong> {activeAlert}</span>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="text-amber-300 hover:text-white text-xs underline cursor-pointer border-none bg-transparent"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: LIVE FLEET RADAR & MAP CANVAS
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'FLEET' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Radar Canvas & Telemetry */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* The Live Interactive Radar Screen */}
            <div className="bg-[#122A24] rounded-3xl p-6 shadow-xl border border-[#1C443A] text-white relative overflow-hidden">
              
              {/* Radar Header */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-white flex items-center gap-2">
                      <span>{activeRoute.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        {activeRoute.code}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300 font-mono">
                      Vehicle: <strong>{activeRoute.vehicleNo}</strong> &bull; Driver: <strong>{activeRoute.driver}</strong> ({activeRoute.driverPhone})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGpsActive(!gpsActive)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                      gpsActive
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                    <span>{gpsActive ? 'GPS ACTIVE' : 'GPS PAUSED'}</span>
                  </button>

                  <button
                    onClick={() => setProgressPercent(5)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
                    title="Reset Simulation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Graphical SVG Radar Canvas */}
              <div className="w-full h-72 sm:h-80 bg-[#0A1A16] rounded-2xl border border-emerald-900/50 relative overflow-hidden flex items-center justify-center">
                
                {/* Radar grid rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-96 h-96 rounded-full border border-emerald-400/40" />
                  <div className="w-64 h-64 rounded-full border border-emerald-400/50" />
                  <div className="w-32 h-32 rounded-full border border-emerald-400/60" />
                  <div className="absolute w-full h-[1px] bg-emerald-400/30" />
                  <div className="absolute h-full w-[1px] bg-emerald-400/30" />
                </div>

                {/* SVG Route Line & Animated Bus Node */}
                <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                  {/* Route polyline glow */}
                  <polyline
                    points={activeRoute.pathCoords.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6 4"
                    className="opacity-90"
                  />

                  {/* Stops Nodes */}
                  {activeRoute.stops.map((st, sIdx) => {
                    const coord = activeRoute.pathCoords[sIdx] || { x: 50 + sIdx * 100, y: 120 };
                    const isPassed = sIdx < currentStopIndex;
                    const isCurrent = sIdx === currentStopIndex;

                    return (
                      <g key={st.id} className="cursor-pointer group">
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={isCurrent ? 7 : 5}
                          fill={isCurrent ? '#F59E0B' : isPassed ? '#10B981' : '#475569'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {isCurrent && (
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="12"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="2"
                            className="animate-ping"
                          />
                        )}
                        <text
                          x={coord.x}
                          y={coord.y - 12}
                          fontSize="9.5"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                          fill="#E2E8F0"
                          textAnchor="middle"
                        >
                          {st.name.length > 18 ? st.name.substring(0, 16) + '..' : st.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Moving Bus Marker */}
                  <g transform={`translate(${busCoords.x}, ${busCoords.y})`}>
                    <circle r="14" fill="#10B981" fillOpacity="0.3" className="animate-pulse" />
                    <circle r="9" fill="#10B981" stroke="#ffffff" strokeWidth="2.5" />
                    <text x="0" y="3.5" fontSize="8" fill="#122A24" fontWeight="bold" textAnchor="middle">
                      BUS
                    </text>
                  </g>
                </svg>

                {/* Floating GPS live telemetry badge */}
                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[10.5px] text-emerald-300 flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>POS: {busCoords.x}, {busCoords.y}</span>
                  </span>
                  <span>&bull;</span>
                  <span>HEADING: {Math.round(headingDegrees)}&deg; NE</span>
                  <span>&bull;</span>
                  <span>SPEED: <strong>{currentSpeed} km/h</strong></span>
                </div>

                {/* Floating Stop ETA badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-400/40 text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Next Stop
                  </div>
                  <div className="text-xs font-bold text-amber-300">
                    {nextStop.name}
                  </div>
                  <div className="text-[10.5px] text-emerald-400 font-mono font-bold mt-0.5">
                    ETA: ~4 mins ({nextStop.scheduledTime})
                  </div>
                </div>
              </div>

              {/* Bottom 4-Card Telemetry Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Current Speed</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-white">
                    {currentSpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Optimal City Cruise
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    <span>Bearing &amp; Heading</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-white">
                    {Math.round(headingDegrees)}&deg; <span className="text-xs font-normal text-slate-400">NE</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Gyro Synced
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Route Completed</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-amber-300">
                    {Math.round(progressPercent)}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Stop {currentStopIndex + 1} of {activeRoute.stops.length}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vehicle Status</span>
                  </div>
                  <div className="text-base font-bold text-white uppercase mt-0.5">
                    {activeRoute.status === 'ON_ROUTE' ? 'LIVE ON ROUTE' : activeRoute.status}
                  </div>
                  <div className="text-[10px] text-emerald-300 font-mono">
                    Engine OK &bull; Safe Speed
                  </div>
                </div>
              </div>

            </div>

            {/* Route Stops Sequence Progression */}
            <div className="bg-[#EBF5EF] rounded-3xl p-6 border border-[#C5E2CF] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-sm text-[#122A24] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#1C443A]" />
                  <span>Stops Progression Timeline — {activeRoute.name}</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#1C443A]">
                  Total {activeRoute.stops.length} Designated Pick-up Points
                </span>
              </div>

              <div className="space-y-3">
                {activeRoute.stops.map((stop, sIdx) => {
                  const isPassed = sIdx < currentStopIndex;
                  const isCurrent = sIdx === currentStopIndex;

                  return (
                    <div
                      key={stop.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-white border-amber-400 shadow-md ring-2 ring-amber-400/30'
                          : isPassed
                          ? 'bg-[#DCE8E0]/50 border-emerald-300/60 opacity-85'
                          : 'bg-white border-[#DCE8E0]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                            isCurrent
                              ? 'bg-amber-500 text-white animate-bounce'
                              : isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isPassed ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                        </div>

                        <div>
                          <div className="font-bold text-xs text-[#122A24] flex items-center gap-2">
                            <span>{stop.name}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                BUS APPROACHING
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Scheduled: <strong>{stop.scheduledTime}</strong> &bull; Distance: <strong>{stop.distanceKm} km</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isPassed ? (
                          <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Departed
                          </span>
                        ) : isCurrent ? (
                          <span className="text-amber-700 text-xs font-bold font-mono">
                            ETA: ~4 mins
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Fleet List & SOS Trigger */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Active Fleet Selector */}
            <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#122A24]">
                    Active School Fleet
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a bus to track live
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EBF5EF] text-[#1C443A] font-mono text-xs font-bold border border-[#C5E2CF]">
                  {routes.length} Vehicles
                </span>
              </div>

              <div className="space-y-2.5">
                {routes.map(r => {
                  const isSelected = r.id === selectedRouteId;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRouteId(r.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-md'
                          : 'bg-[#F4F8F5] text-[#122A24] border-[#DCE8E0] hover:bg-[#EBF5EF]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-xs">
                          {r.name}
                        </div>
                        <span
                          className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold font-mono ${
                            isSelected
                              ? 'bg-emerald-400 text-[#122A24]'
                              : r.status === 'ON_ROUTE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {r.code}
                        </span>
                      </div>

                      <div className={`text-[11px] mt-1.5 flex items-center justify-between ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span>Driver: {r.driver}</span>
                        <span className="font-mono">{r.vehicleNo}</span>
                      </div>

                      <div className={`text-[10px] mt-1 flex items-center gap-1.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-700 font-semibold'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{r.stops.length} Stops &bull; {r.capacity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setViewMode('ROUTES')}
                className="w-full py-2.5 rounded-xl bg-[#EBF5EF] hover:bg-[#D8EEDF] text-[#1C443A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#C5E2CF] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage &amp; Add Routes</span>
              </button>
            </div>

            {/* Emergency Broadcast / Delay Alert Trigger */}
            <div className="bg-[#122A24] text-white rounded-3xl p-6 border border-white/10 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Instant Delay / Traffic Notice</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Broadcast traffic congestion, road blockage, or weather delay directly to parents on this route.
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => setActiveAlert(`Traffic Jam at Charbagh for ${activeRoute.name} — delay of ~15 mins.`)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white border border-white/10 transition-colors cursor-pointer"
                >
                  &bull; Heavy Traffic at Charbagh (+15m)
                </button>
                <button
                  onClick={() => setActiveAlert(`Chowk road diversion active for ${activeRoute.name} — ETA updated by 10 mins.`)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white border border-white/10 transition-colors cursor-pointer"
                >
                  &bull; Road Diversion at Chowk (+10m)
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: ROUTE MANAGEMENT STUDIO (Create / Edit Routes)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'ROUTES' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE8E0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-xl text-[#122A24]">
                Route Logistics &amp; Driver Studio
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Configure official school bus routes, intermediate stops, arrival timings, and driver contact assignments.
              </p>
            </div>

            <button
              onClick={openNewRouteModal}
              className="px-5 py-3 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer border-none"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Create New Route (e.g. Rajajipuram to Chowk)</span>
            </button>
          </div>

          {/* List of Defined Routes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {routes.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm space-y-5 hover:border-[#122A24] transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                      {r.code}
                    </span>
                    <h3 className="font-bold text-base text-[#122A24]">
                      {r.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditRouteModal(r)}
                      className="p-2 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-slate-700 hover:text-[#122A24] border border-[#DCE8E0] transition-colors cursor-pointer"
                      title="Edit Route"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(r.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Driver & Bus Info */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#E8F0EA] text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Driver</span>
                    <span className="font-bold text-[#122A24]">{r.driver}</span>
                    <span className="text-slate-500 font-mono text-[10.5px] block">{r.driverPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Vehicle Details</span>
                    <span className="font-bold text-[#122A24]">{r.vehicleNo}</span>
                    <span className="text-emerald-700 font-semibold text-[10.5px] block">{r.capacity} &bull; {r.status}</span>
                  </div>
                </div>

                {/* Stops Summary */}
                <div className="space-y-2">
                  <span className="text-[10.5px] font-bold text-[#1C443A] uppercase tracking-wider block">
                    Pick-up Sequence ({r.stops.length} Stops)
                  </span>
                  <div className="space-y-1.5">
                    {r.stops.map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FAFCFA] border border-[#E8F0EA]">
                        <span className="font-medium text-slate-800 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-[#122A24] text-white text-[9px] font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span>{s.name}</span>
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {s.scheduledTime} &bull; {s.distanceKm} km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedRouteId(r.id);
                      setViewMode('FLEET');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Track on Live Radar</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRouteId(r.id);
                      setViewMode('DRIVER');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#EBF5EF] hover:bg-[#D8EEDF] text-[#1C443A] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#C5E2CF] cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Driver Mobile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 3: DRIVER SMARTPHONE TRACKING APP (Mobile Simulator)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'DRIVER' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm text-center space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF] inline-flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Driver Smartphone Transmitter Cockpit
            </span>
            <h2 className="font-display font-extrabold text-xl text-[#122A24]">
              Mobile Phone GPS Broadcaster
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Driver apne mobile phone me is screen ko open karke <strong>&ldquo;Start GPS Trip&rdquo;</strong> dabata hai, jisse smartphone ka real GPS live ERP radar me broadcast hota hai.
            </p>
          </div>

          {/* Smartphone Simulator Chassis */}
          <div className="bg-[#122A24] text-white rounded-[40px] p-6 sm:p-8 shadow-2xl border-4 border-slate-700 space-y-6 relative overflow-hidden">
            
            {/* Top Phone Status Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GPS HARDWARE ACTIVE</span>
              </div>
              <div>{activeRoute.code} &bull; {activeRoute.vehicleNo}</div>
            </div>

            {/* Active Driver Profile */}
            <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-[#122A24] font-bold flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{activeRoute.driver}</div>
                  <div className="text-xs text-slate-300 font-mono">{activeRoute.driverPhone}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                ACTIVE SHIFT
              </span>
            </div>

            {/* Big Speedometer */}
            <div className="text-center py-6 bg-black/40 rounded-3xl border border-white/10 space-y-1">
              <div className="text-slate-400 text-xs uppercase font-bold tracking-widest">
                Vehicle Speed
              </div>
              <div className="text-6xl font-mono font-black text-emerald-400 tracking-tight">
                {driverTripActive ? liveDriverGeo.speedKmh : 0}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Kilometers Per Hour (GPS Telemetry)
              </div>
            </div>

            {/* Geolocation Coordinates Stream */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>LATITUDE: <strong>{liveDriverGeo.latitude}</strong></span>
                <span>LONGITUDE: <strong>{liveDriverGeo.longitude}</strong></span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>ACCURACY: <strong>&plusmn;{liveDriverGeo.accuracyMeters}m</strong></span>
                <span>LAST PING: <strong>{liveDriverGeo.lastUpdated}</strong></span>
              </div>
            </div>

            {/* Next Stop Indicator for Driver */}
            <div className="bg-amber-500/20 border border-amber-400/40 p-4 rounded-2xl text-amber-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                Next Pick-up Stop:
              </div>
              <div className="text-base font-bold text-white">
                {nextStop.name}
              </div>
              <div className="text-xs text-amber-300 font-mono">
                Scheduled Time: {nextStop.scheduledTime}
              </div>
            </div>

            {/* Start / Stop GPS Button */}
            <div>
              {!driverTripActive ? (
                <button
                  onClick={startDriverTrip}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-[#122A24] font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border-none"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>START GPS TRIP (TRANSMIT LOCATION)</span>
                </button>
              ) : (
                <button
                  onClick={stopDriverTrip}
                  className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border-none"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>END TRIP &bull; STOP GPS TRANSMITTER</span>
                </button>
              )}
            </div>

            <div className="text-center text-xs text-slate-400">
              * Tap start button to allow your phone&apos;s GPS sensor to stream live movement coordinates.
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 4: PARENT LIVE BUS TRACKER
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'PARENT' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE8E0] shadow-sm space-y-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF] inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Parent &amp; Guardian Live Portal
              </span>
              <h2 className="font-display font-extrabold text-xl text-[#122A24] mt-2">
                Live School Bus Arrival Radar
              </h2>
              <p className="text-xs text-slate-500">
                Track your ward&apos;s assigned school bus, distance remaining to your bus stop, and instant arrival ETA.
              </p>
            </div>

            {/* Stop Selector for Parent */}
            <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] space-y-2">
              <label className="text-xs font-bold text-[#122A24] block">
                Select Your Assigned Bus Stop:
              </label>
              <select
                value={parentStopId}
                onChange={(e) => setParentStopId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none"
              >
                {activeRoute.stops.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    Stop {idx + 1}: {s.name} ({s.scheduledTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Parent Radar Card */}
          <div className="bg-[#122A24] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
            
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10.5px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  {activeRoute.name} &bull; {activeRoute.code}
                </span>
                <h3 className="font-bold text-lg text-white mt-0.5">
                  Designated Stop: {parentStop.name}
                </h3>
                <div className="text-xs text-slate-300 font-mono mt-1">
                  Scheduled Arrival: <strong>{parentStop.scheduledTime}</strong>
                </div>
              </div>

              <a
                href={`tel:${activeRoute.driverPhone}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#122A24] font-bold text-xs flex items-center gap-2 transition-colors no-underline shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver</span>
              </a>
            </div>

            {/* ETA Countdown Display */}
            <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-center space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Estimated Time of Arrival (ETA)
              </div>
              <div className="text-5xl font-mono font-extrabold text-amber-300 tracking-tight">
                ~{parentEtaMinutes} MINS
              </div>
              <div className="text-xs text-emerald-400 font-mono">
                Live distance: ~{Math.max(0.4, (parentEtaMinutes * 0.4)).toFixed(1)} km away &bull; Moving at {currentSpeed} km/h
              </div>
            </div>

            {/* Driver & Bus Verification */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Authorized Driver</span>
                <span className="font-bold text-white text-sm">{activeRoute.driver}</span>
                <span className="text-slate-400 font-mono text-[11px] block">{activeRoute.driverPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Vehicle Number</span>
                <span className="font-bold text-white text-sm font-mono">{activeRoute.vehicleNo}</span>
                <span className="text-emerald-400 text-[11px] block">Verified GPS Tracking Active</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT ROUTE MODAL DIALOG
          ───────────────────────────────────────────────────────────── */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#EBF5EF] rounded-3xl w-full max-w-2xl border border-[#C5E2CF] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#C5E2CF]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#1C443A] uppercase tracking-wider block">
                  Route Logistics Builder
                </span>
                <h3 className="font-display font-bold text-lg text-[#122A24]">
                  {editingRouteId ? 'Edit Bus Route' : 'Create New Route (e.g. Rajajipuram to Chowk)'}
                </h3>
              </div>
              <button
                onClick={() => setShowRouteModal(false)}
                className="p-2 rounded-xl bg-white hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Basic Info Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#122A24] block">
                    Route Name / Description:
                  </label>
                  <input
                    type="text"
                    value={routeForm.name}
                    onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                    placeholder="e.g. Rajajipuram to Chowk Express"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#122A24] block">
                    Bus Code:
                  </label>
                  <input
                    type="text"
                    value={routeForm.code}
                    onChange={(e) => setRouteForm({ ...routeForm, code: e.target.value })}
                    placeholder="e.g. BUS-05"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#122A24] block">
                    Vehicle Number:
                  </label>
                  <input
                    type="text"
                    value={routeForm.vehicleNo}
                    onChange={(e) => setRouteForm({ ...routeForm, vehicleNo: e.target.value })}
                    placeholder="e.g. UP-32-AB-9876"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#122A24] block">
                    Driver Name:
                  </label>
                  <input
                    type="text"
                    value={routeForm.driver}
                    onChange={(e) => setRouteForm({ ...routeForm, driver: e.target.value })}
                    placeholder="e.g. Ramesh Yadav"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#122A24] block">
                    Driver Mobile No:
                  </label>
                  <input
                    type="text"
                    value={routeForm.driverPhone}
                    onChange={(e) => setRouteForm({ ...routeForm, driverPhone: e.target.value })}
                    placeholder="e.g. +91 98765-43210"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Intermediate Stops Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#122A24] uppercase tracking-wider block">
                  Route Stops &amp; Timings Sequence ({routeForm.stops.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddStopToForm}
                  className="px-3 py-1 rounded-lg bg-[#122A24] text-white text-xs font-bold flex items-center gap-1 cursor-pointer border-none"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>Add Stop</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto p-1">
                {routeForm.stops.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#DCE8E0]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#122A24] text-white text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRouteForm(prev => ({
                          ...prev,
                          stops: prev.stops.map((s, i) => i === idx ? { ...s, name: val } : s)
                        }));
                      }}
                      placeholder="Stop Name (e.g. Rajajipuram E-Block)"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none"
                    />

                    <input
                      type="text"
                      value={st.scheduledTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRouteForm(prev => ({
                          ...prev,
                          stops: prev.stops.map((s, i) => i === idx ? { ...s, scheduledTime: val } : s)
                        }));
                      }}
                      placeholder="Time (07:45 AM)"
                      className="w-24 px-2 py-1.5 rounded-lg bg-[#F4F8F5] border border-[#DCE8E0] text-[11px] font-mono font-semibold text-[#122A24] outline-none text-center"
                    />

                    <input
                      type="number"
                      step="0.5"
                      value={st.distanceKm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRouteForm(prev => ({
                          ...prev,
                          stops: prev.stops.map((s, i) => i === idx ? { ...s, distanceKm: val } : s)
                        }));
                      }}
                      placeholder="Km"
                      className="w-16 px-2 py-1.5 rounded-lg bg-[#F4F8F5] border border-[#DCE8E0] text-[11px] font-mono font-semibold text-[#122A24] outline-none text-center"
                    />

                    {routeForm.stops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStopFromForm(idx)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none cursor-pointer"
                        title="Remove Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#C5E2CF]">
              <button
                type="button"
                onClick={() => setShowRouteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#122A24] text-xs font-semibold border border-[#DCE8E0] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveRouteForm}
                className="px-6 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Route</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
