/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  CornerDownRight,
  Bell,
  CheckSquare,
  Users,
  MessageSquare,
  AlertCircle,
  Award,
  FileText,
  Flag,
  MoreHorizontal,
  PhoneCall,
  ClipboardCheck,
  AlertOctagon,
  LocateFixed,
  CircleDot,
  Circle,
  Menu,
  CheckCircle,
  Home,
  UserCheck,
  UserX,
  Repeat,
  Layers,
  ExternalLink
} from 'lucide-react';
import { Student } from '@/lib/types';

export interface DashboardTransportProps {
  students?: Student[];
  schoolName?: string;
  currentUser?: any;
  userRole?: string;
}

export interface RouteStop {
  id: string;
  name: string;
  scheduledTime: string;
  distanceKm: number;
  lat?: number;
  lng?: number;
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
  driverStatus?: 'PRESENT' | 'ABSENT' | 'RELIEF_ASSIGNED';
  substituteDriver?: string;
  substitutePhone?: string;
  reliefReason?: string;
  reliefNote?: string;
  onboardGpsTracking?: boolean;
  baseSpeed: number;
  stops: RouteStop[];
  pathCoords: { x: number; y: number }[];
}

// Standby Reserve Relief Drivers Pool for absence replacement
export const STANDBY_RELIEF_DRIVERS = [
  { id: 'rel-1', name: 'Mohan Lal', phone: '+91 98765-43220', badge: 'Depot Standby #1', license: 'DL-UP32-2018-9921', vehicleNo: 'UP-32-AB-9876' },
  { id: 'rel-2', name: 'Suresh Verma', phone: '+91 98765-43221', badge: 'Reserve Pool #2', license: 'DL-UP32-2020-4412', vehicleNo: 'UP-32-AB-9876' },
  { id: 'rel-3', name: 'Deepak Singh', phone: '+91 98765-43222', badge: 'Senior Standby #3', license: 'DL-UP32-2015-8833', vehicleNo: 'UP-32-AB-9876' },
];

// Initial realistic default routes featuring Rajajipuram to Chowk Express & Route 04
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
    driverStatus: 'PRESENT',
    baseSpeed: 32,
    stops: [
      { id: 's1', name: 'Rajajipuram E-Block Terminal', scheduledTime: '07:45 AM', distanceKm: 0, lat: 26.8378, lng: 80.8872 },
      { id: 's2', name: 'Alambagh Chauraha', scheduledTime: '08:00 AM', distanceKm: 4.2, lat: 26.8150, lng: 80.9020 },
      { id: 's3', name: 'Charbagh Railway Station', scheduledTime: '08:15 AM', distanceKm: 8.5, lat: 26.8322, lng: 80.9238 },
      { id: 's4', name: 'Chowk Chauraha (Heritage Gate)', scheduledTime: '08:30 AM', distanceKm: 13.1, lat: 26.8680, lng: 80.9050 },
      { id: 's5', name: 'School Campus Main Gate', scheduledTime: '08:50 AM', distanceKm: 18.0, lat: 26.8520, lng: 80.9400 }
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
    id: 'ROUTE-04',
    code: 'BUS-04',
    name: 'Route 04 - Morning Express',
    driver: 'Rajesh Kumar',
    driverPhone: '+91 98765-43214',
    vehicleNo: 'UP32 AB 1234',
    capacity: '36 Seats',
    status: 'ON_ROUTE',
    driverStatus: 'PRESENT',
    baseSpeed: 34,
    stops: [
      { id: 'r4-s1', name: 'Green Park Stop', scheduledTime: '07:15 AM', distanceKm: 0, lat: 26.8410, lng: 80.8950 },
      { id: 'r4-s2', name: 'Sector 62 Stop', scheduledTime: '07:22 AM', distanceKm: 3.2, lat: 26.8450, lng: 80.9080 },
      { id: 'r4-s3', name: 'City Center Stop', scheduledTime: '07:30 AM', distanceKm: 6.8, lat: 26.8480, lng: 80.9250 },
      { id: 'r4-s4', name: 'River Side Stop', scheduledTime: '07:38 AM', distanceKm: 9.4, lat: 26.8520, lng: 80.9380 },
      { id: 'r4-s5', name: 'Sunrise Villa Stop', scheduledTime: '07:45 AM', distanceKm: 12.1, lat: 26.8560, lng: 80.9450 },
      { id: 'r4-s6', name: 'Park View Stop', scheduledTime: '07:53 AM', distanceKm: 14.6, lat: 26.8610, lng: 80.9520 },
      { id: 'r4-s7', name: 'Shanti Nagar Stop', scheduledTime: '08:02 AM', distanceKm: 16.9, lat: 26.8670, lng: 80.9580 },
      { id: 'r4-s8', name: 'Anand School Campus Gate', scheduledTime: '08:20 AM', distanceKm: 19.5, lat: 26.8720, lng: 80.9650 }
    ],
    pathCoords: [
      { x: 50, y: 150 },
      { x: 120, y: 130 },
      { x: 200, y: 100 },
      { x: 280, y: 120 },
      { x: 360, y: 90 },
      { x: 440, y: 110 },
      { x: 520, y: 80 },
      { x: 580, y: 120 }
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
      { id: 'g1', name: 'Gomti Nagar Extension Hub', scheduledTime: '07:50 AM', distanceKm: 0, lat: 26.8350, lng: 80.9980 },
      { id: 'g2', name: 'Patrakarpuram Chauraha', scheduledTime: '08:05 AM', distanceKm: 3.8, lat: 26.8480, lng: 80.9900 },
      { id: 'g3', name: 'Lohia Hospital Circle', scheduledTime: '08:20 AM', distanceKm: 7.2, lat: 26.8580, lng: 80.9850 },
      { id: 'g4', name: 'Polytechnic Flyover Junction', scheduledTime: '08:35 AM', distanceKm: 11.5, lat: 26.8720, lng: 80.9820 },
      { id: 'g5', name: 'School Campus Main Gate', scheduledTime: '08:50 AM', distanceKm: 16.2, lat: 26.8520, lng: 80.9400 }
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
      { id: 'i1', name: 'Indira Nagar Block C', scheduledTime: '08:00 AM', distanceKm: 0, lat: 26.8750, lng: 80.9850 },
      { id: 'i2', name: 'Munshipulia Metro Station', scheduledTime: '08:15 AM', distanceKm: 3.2, lat: 26.8820, lng: 80.9920 },
      { id: 'i3', name: 'Kalyanpur Crossing', scheduledTime: '08:30 AM', distanceKm: 6.8, lat: 26.8900, lng: 80.9780 },
      { id: 'i4', name: 'School Campus Main Gate', scheduledTime: '08:45 AM', distanceKm: 11.4, lat: 26.8520, lng: 80.9400 }
    ],
    pathCoords: [
      { x: 60, y: 160 },
      { x: 210, y: 100 },
      { x: 370, y: 150 },
      { x: 540, y: 120 }
    ]
  }
];

export function DashboardTransport({
  students = [],
  schoolName = 'Delhi Public School',
  currentUser,
  userRole
}: DashboardTransportProps) {
  // Navigation Modes:
  // 1. 'FLEET'  : Live Radar Map & Telemetry Simulation
  // 2. 'ROUTES' : Route Management Studio (Create/Edit routes like Rajajipuram to Chowk)
  // 3. 'DRIVER' : Driver Smartphone Tracking Cockpit (HTML5 GPS Watch)
  // 4. 'PARENT' : Parent Ward Bus Radar & ETA
  const isDriverUser = userRole === 'DRIVER' || currentUser?.role === 'DRIVER';
  const [viewMode, setViewMode] = useState<'FLEET' | 'ROUTES' | 'DRIVER' | 'PARENT'>(() => {
    if (isDriverUser) return 'DRIVER';
    if (userRole === 'PARENT' || currentUser?.role === 'PARENT') return 'PARENT';
    return 'FLEET';
  });

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

  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    if (isDriverUser && currentUser) {
      const cName = (currentUser.name || '').toLowerCase();
      const cUser = (currentUser.username || '').toLowerCase();
      const matched = INITIAL_ROUTES.find(r => 
        (cName && r.driver.toLowerCase().includes(cName)) ||
        (cName && cName.includes(r.driver.toLowerCase())) ||
        (cName.includes('01') && r.code === 'BUS-01') ||
        (cUser === 'driver' && r.code === 'BUS-01')
      );
      if (matched) return matched.id;
    }
    return INITIAL_ROUTES[0]?.id || 'ROUTE-LKO-01';
  });
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
  // DRIVER SMARTPHONE COCKPIT STATE (HTML5 Live GPS & Cloud Broadcast)
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
  const [gpsPollTimer, setGpsPollTimer] = useState<any>(null);
  const [serverTelemetry, setServerTelemetry] = useState<any>(null);
  const [isLivePhoneStreaming, setIsLivePhoneStreaming] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string>('Ready to Transmit');

  // Poll live telemetry from server to check if driver's mobile is actively transmitting
  useEffect(() => {
    let timer: any;
    const pollTelemetry = async () => {
      try {
        const res = await fetch(`/api/transport/telemetry?t=${Date.now()}`);
        const data = await res.json();
        if (data && data.success) {
          // Check all active telemetries or current route
          let activeTele: any = null;
          if (data.telemetries) {
            if (data.telemetries[selectedRouteId]?.isOnline) {
              activeTele = data.telemetries[selectedRouteId];
            } else {
              activeTele = Object.values(data.telemetries).find((t: any) => t.isOnline);
            }
          }
          if (activeTele && activeTele.isOnline) {
            setServerTelemetry(activeTele);
            setIsLivePhoneStreaming(true);
            if (activeTele.speedKmh !== undefined) {
              setCurrentSpeed(activeTele.speedKmh);
            }
            if (activeTele.heading !== undefined) {
              setHeadingDegrees(activeTele.heading);
            }
          } else {
            setIsLivePhoneStreaming(false);
          }
        }
      } catch (e) {}
    };

    pollTelemetry();
    timer = setInterval(pollTelemetry, 2000);
    return () => clearInterval(timer);
  }, [selectedRouteId]);

  // Broadcast driver's mobile coordinates to cloud API
  const broadcastTelemetry = async (
    coords: { latitude: number; longitude: number; speedKmh: number; heading: number; accuracyMeters: number },
    active: boolean = true
  ) => {
    try {
      await fetch('/api/transport/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: activeRoute.id,
          vehicleNo: activeRoute.vehicleNo,
          driver: activeRoute.driver,
          latitude: coords.latitude,
          longitude: coords.longitude,
          speedKmh: coords.speedKmh,
          heading: coords.heading,
          accuracyMeters: coords.accuracyMeters,
          active
        })
      });
    } catch (e) {}
  };

  // ─────────────────────────────────────────────────────────────
  // HIGH-FREQUENCY SUB-SECOND GPS ACQUISITION ENGINE
  // ─────────────────────────────────────────────────────────────
  const lastGpsFixRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const [manualSpeedSim, setManualSpeedSim] = useState<number | null>(null);

  // Absence & Relief Driver Management States
  const [showAbsenceModal, setShowAbsenceModal] = useState<boolean>(false);
  const [showReliefModal, setShowReliefModal] = useState<boolean>(false);
  const [showRouteSelectModal, setShowRouteSelectModal] = useState<boolean>(false);
  const [absenceReason, setAbsenceReason] = useState<string>('Medical / Sick Leave');
  const [absenceNotes, setAbsenceNotes] = useState<string>('');
  const [selectedReliefDriverId, setSelectedReliefDriverId] = useState<string>('rel-1');

  // Actively fetch real smartphone GPS with instant sub-second delta speed calculation
  const readAndTransmitLivePosition = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatusMessage('Geolocation not supported in this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const now = Date.now();
        let speedKmh = 0;

        // 1. Manual testing speed simulation override (for desk/stationary testing)
        if (manualSpeedSim !== null) {
          speedKmh = manualSpeedSim;
        }
        // 2. Hardware GPS native speed if valid (>0)
        else if (pos.coords.speed !== null && pos.coords.speed !== undefined && !isNaN(pos.coords.speed) && pos.coords.speed > 0) {
          speedKmh = Math.round(pos.coords.speed * 3.6);
        }
        // 3. Ultra-responsive GPS Delta Distance over Delta Time calculation (works when phone speed API is null)
        else if (lastGpsFixRef.current) {
          const distKm = calculateDistanceKm(
            lastGpsFixRef.current.lat,
            lastGpsFixRef.current.lng,
            pos.coords.latitude,
            pos.coords.longitude
          );
          const deltaSec = (now - lastGpsFixRef.current.time) / 1000;
          if (deltaSec > 0.4 && distKm > 0.0015) { // moved > 1.5 meters
            const calcSpeed = Math.round(distKm / (deltaSec / 3600));
            speedKmh = Math.min(85, Math.max(0, calcSpeed));
          } else {
            speedKmh = 0; // Stationary
          }
        }

        lastGpsFixRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: now
        };

        const newGeo = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          speedKmh: speedKmh,
          heading: pos.coords.heading || 0,
          accuracyMeters: Math.round(pos.coords.accuracy || 3),
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setLiveDriverGeo(newGeo);
        setGpsStatusMessage(`🟢 Live GPS Active: ${newGeo.latitude.toFixed(4)}°N, ${newGeo.longitude.toFixed(4)}°E (${speedKmh} km/h)`);
        broadcastTelemetry(newGeo, true);
      },
      (err) => {
        if (err.code === 1) {
          setGpsStatusMessage('❌ Location permission denied. Please allow location in browser.');
        } else {
          setGpsStatusMessage(`Searching GPS satellite signal... (${err.message})`);
        }
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 1000 } // 1000ms cache eliminates cold start 6-second lag
    );
  };

  const startDriverTrip = () => {
    setDriverTripActive(true);
    setGpsStatusMessage('Connecting to smartphone GPS sensor with sub-second tracking...');

    // 1. Fetch immediately
    readAndTransmitLivePosition();

    // 2. Continuous interval every 1 second (1000ms) for high-frequency telemetry
    const intervalId = setInterval(readAndTransmitLivePosition, 1000);
    setGpsPollTimer(intervalId);

    // 3. Native watch position for immediate movement delta
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            let speedKmh = 0;
            if (manualSpeedSim !== null) {
              speedKmh = manualSpeedSim;
            } else if (pos.coords.speed !== null && pos.coords.speed !== undefined && !isNaN(pos.coords.speed) && pos.coords.speed > 0) {
              speedKmh = Math.round(pos.coords.speed * 3.6);
            } else if (lastGpsFixRef.current) {
              const distKm = calculateDistanceKm(lastGpsFixRef.current.lat, lastGpsFixRef.current.lng, pos.coords.latitude, pos.coords.longitude);
              const deltaSec = (now - lastGpsFixRef.current.time) / 1000;
              if (deltaSec > 0.4 && distKm > 0.0015) {
                speedKmh = Math.min(85, Math.max(0, Math.round(distKm / (deltaSec / 3600))));
              }
            }

            lastGpsFixRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, time: now };

            const newGeo = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              speedKmh: speedKmh,
              heading: pos.coords.heading || 0,
              accuracyMeters: Math.round(pos.coords.accuracy || 3),
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            setLiveDriverGeo(newGeo);
            broadcastTelemetry(newGeo, true);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );
        setGeoWatchId(id);
      } catch (e) {}
    }
  };

  const stopDriverTrip = () => {
    setDriverTripActive(false);
    setGpsStatusMessage('Trip Ended. GPS Transmitter Stopped.');
    if (gpsPollTimer) {
      clearInterval(gpsPollTimer);
      setGpsPollTimer(null);
    }
    if (geoWatchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(geoWatchId);
      setGeoWatchId(null);
    }
    broadcastTelemetry(liveDriverGeo, false);
  };

  // Auto-request location permission on login for Driver
  useEffect(() => {
    if (isDriverUser && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          startDriverTrip();
        },
        (err) => {
          setDriverTripActive(false);
          setGpsStatusMessage('❌ Location permission not allowed. Tap "START GPS TRIP" to retry and allow live bus tracking.');
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 1000 }
      );
    }
  }, [isDriverUser]);

  // ─────────────────────────────────────────────────────────────
  // MODERN DRIVER MOBILE APP STATE (Matching Reference Screenshot)
  // ─────────────────────────────────────────────────────────────
  const [driverActiveTab, setDriverActiveTab] = useState<'dashboard' | 'trips' | 'students' | 'messages' | 'more'>('dashboard');
  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [issueType, setIssueType] = useState<string>('Heavy Traffic Jam (+15m)');
  const [issueNotes, setIssueNotes] = useState<string>('');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3);
  const [driverStudentSearch, setDriverStudentSearch] = useState<string>('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PICKED' | 'PENDING' | 'DROPPED'>('ALL');
  // Default to ROUTE_PATH so marked route directions display immediately on load
  const [googleMapMode, setGoogleMapMode] = useState<'ROUTE_PATH' | 'LIVE_PIN' | 'LIVE_NAV' | 'RADAR_CANVAS'>('ROUTE_PATH');

  // Haversine distance calculator in kilometers
  const calculateDistanceKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }, []);

  // Real-time trip progress: dynamically tracks which stops have been reached based on live GPS
  const [completedStopIds, setCompletedStopIds] = useState<string[]>([]);

  // Auto-detect completed stops when driver is within 350 meters of a stop's coordinates
  useEffect(() => {
    if (!driverTripActive || !liveDriverGeo.latitude || !liveDriverGeo.longitude) return;
    const currentLat = liveDriverGeo.latitude;
    const currentLng = liveDriverGeo.longitude;

    activeRoute.stops.forEach(st => {
      if (st.lat && st.lng && !completedStopIds.includes(st.id)) {
        const dist = calculateDistanceKm(currentLat, currentLng, st.lat, st.lng);
        if (dist <= 0.35) { // within 350m of stop
          setCompletedStopIds(prev => prev.includes(st.id) ? prev : [...prev, st.id]);
        }
      }
    });
  }, [driverTripActive, liveDriverGeo.latitude, liveDriverGeo.longitude, activeRoute.stops, completedStopIds, calculateDistanceKm]);

  // Next stop calculation from uncompleted stops (fixed by transport incharge)
  const nextDriverStop = useMemo(() => {
    const uncompleted = activeRoute.stops.filter(s => !completedStopIds.includes(s.id));
    if (uncompleted.length > 0) return uncompleted[0];
    return activeRoute.stops[activeRoute.stops.length - 1] || activeRoute.stops[0];
  }, [activeRoute.stops, completedStopIds]);

  // Real-time distance to next stop
  const liveDistanceToNextKm = useMemo(() => {
    if (!nextDriverStop?.lat || !nextDriverStop?.lng) {
      return Math.max(0.5, Number((nextDriverStop?.distanceKm || 1.2).toFixed(1)));
    }
    return calculateDistanceKm(liveDriverGeo.latitude, liveDriverGeo.longitude, nextDriverStop.lat, nextDriverStop.lng);
  }, [liveDriverGeo, nextDriverStop, calculateDistanceKm]);

  // Real-time ETA in minutes based on actual speed and distance
  const dynamicEtaMinutes = useMemo(() => {
    if (liveDistanceToNextKm <= 0.25) return 0; // Arrived at stop
    const speed = liveDriverGeo.speedKmh > 5 ? liveDriverGeo.speedKmh : 24; // realistic bus city speed (24 km/h)
    return Math.max(1, Math.round((liveDistanceToNextKm / speed) * 60));
  }, [liveDistanceToNextKm, liveDriverGeo.speedKmh]);

  // Dynamic progress percentage: 100% computed from real live location and stops
  const dynamicProgressPercent = useMemo(() => {
    if (!activeRoute.stops || activeRoute.stops.length === 0) return 0;
    return Math.round((completedStopIds.length / activeRoute.stops.length) * 100);
  }, [completedStopIds, activeRoute.stops]);

  // Filter students strictly assigned to this driver's bus route
  const busAssignedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    const rCode = (activeRoute.code || '').toLowerCase().trim();
    const rName = (activeRoute.name || '').toLowerCase().trim();
    const rId = (activeRoute.id || '').toLowerCase().trim();

    // 1. Direct match on student's bus_route or transport_route
    const directMatches = students.filter((st: any) => {
      const sRoute = (st.bus_route || st.route || st.transport_route || st.transportRoute || '').toLowerCase().trim();
      if (!sRoute) return false;
      return sRoute === rCode || sRoute === rName || sRoute === rId || sRoute.includes(rCode) || rName.includes(sRoute);
    });

    if (directMatches.length > 0) {
      return directMatches.map((st: any, i) => ({
        id: st.id || `st-${i}`,
        name: st.name || `Student ${i + 1}`,
        class: st.class_name || st.class || 'Assigned',
        stop: st.transport_stop || activeRoute.stops[i % activeRoute.stops.length]?.name || 'Bus Stop',
        avatar: i % 2 === 0 ? '👦' : '👧',
        phone: st.parent_phone || st.phone || '+91 98765-43210'
      }));
    }

    // 2. Transport-opted students
    const transportStudents = students.filter((st: any) => st.bus_route || st.transport_opted || st.transport_stop);
    if (transportStudents.length > 0) {
      return transportStudents.slice(0, 28).map((st: any, i) => ({
        id: st.id || `st-${i}`,
        name: st.name || `Student ${i + 1}`,
        class: st.class_name || st.class || 'Assigned',
        stop: st.transport_stop || activeRoute.stops[i % activeRoute.stops.length]?.name || 'Bus Stop',
        avatar: i % 2 === 0 ? '👦' : '👧',
        phone: st.parent_phone || st.phone || '+91 98765-43210'
      }));
    }

    // 3. Fallback slice assigned to this bus route
    return students.slice(0, 24).map((st: any, i) => ({
      id: st.id || `st-${i}`,
      name: st.name || `Student ${i + 1}`,
      class: st.class_name || st.class || 'Assigned',
      stop: activeRoute.stops[i % activeRoute.stops.length]?.name || 'Campus Stop',
      avatar: i % 2 === 0 ? '👦' : '👧',
      phone: st.parent_phone || st.phone || '+91 98765-43210'
    }));
  }, [students, activeRoute]);

  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, 'PICKED' | 'ABSENT' | 'DROPPED' | 'PENDING'>>({});

  const driverPickedCount = useMemo(() => {
    return busAssignedStudents.filter(s => studentStatusMap[s.id] === 'PICKED').length;
  }, [busAssignedStudents, studentStatusMap]);

  const driverDroppedCount = useMemo(() => {
    return busAssignedStudents.filter(s => studentStatusMap[s.id] === 'DROPPED').length;
  }, [busAssignedStudents, studentStatusMap]);

  const driverLeftCount = useMemo(() => {
    return busAssignedStudents.length - driverPickedCount - driverDroppedCount;
  }, [busAssignedStudents.length, driverPickedCount, driverDroppedCount]);

  const driverGreeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning,';
    if (hr < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const driverDisplayName = currentUser?.name || activeRoute.driver || 'Rajesh Kumar';
  const driverVehicleNo = activeRoute.vehicleNo || 'UP32 AB 1234';

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
          1. TOP HERO & MODE CONTROLLER TOOLBAR (For Admins / Managers)
          ───────────────────────────────────────────────────────────── */}
      {!isDriverUser && (
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
      )}

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

              {/* Live Driver Smartphone Active Cloud Banner */}
              {isLivePhoneStreaming && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400/60 shadow-inner flex items-center justify-between flex-wrap gap-2 text-xs animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span>LIVE DRIVER SMARTPHONE TRANSMITTING</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      {serverTelemetry?.vehicleNo}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 flex items-center gap-3 flex-wrap">
                    <span>GPS: <strong>{serverTelemetry?.latitude}</strong>, <strong>{serverTelemetry?.longitude}</strong></span>
                    <span>Speed: <strong className="text-emerald-300 font-bold">{serverTelemetry?.speedKmh} km/h</strong></span>
                    <span>Acc: <strong>&plusmn;{serverTelemetry?.accuracyMeters}m</strong></span>
                    <span>Last Ping: <strong className="text-emerald-400">{serverTelemetry?.lastUpdatedText}</strong></span>
                  </div>
                </div>
              )}

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

            {/* Live Real-Time Driver Smartphone GPS Pinpoint Card */}
            {serverTelemetry && serverTelemetry.latitude ? (
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />
                    </div>
                    <div>
                      <div className="font-bold text-base text-[#122A24] flex items-center gap-2">
                        <span>Driver Smartphone Live GPS</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${isLivePhoneStreaming ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                          {isLivePhoneStreaming ? '● LIVE MOBILE STREAMING' : 'IDLE / RECENT'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {serverTelemetry.driver} &bull; Vehicle: {serverTelemetry.vehicleNo} &bull; Last ping: {serverTelemetry.lastUpdatedText || 'Just now'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${serverTelemetry.latitude},${serverTelemetry.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center gap-1.5 transition-colors no-underline shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open in Google Maps &rarr;</span>
                  </a>
                </div>

                {/* Live Coordinates Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Latitude</span>
                    <span className="font-bold text-slate-800 text-sm">{serverTelemetry.latitude}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Longitude</span>
                    <span className="font-bold text-slate-800 text-sm">{serverTelemetry.longitude}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Speed</span>
                    <span className="font-bold text-emerald-600 text-sm">{serverTelemetry.speedKmh} km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">GPS Accuracy</span>
                    <span className="font-bold text-blue-600 text-sm">&plusmn;{serverTelemetry.accuracyMeters}m</span>
                  </div>
                </div>

                {/* Real OpenStreetMap View of Driver's Exact Location */}
                <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100">
                  <iframe
                    title="Live Driver GPS Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(serverTelemetry.longitude) - 0.008}%2C${Number(serverTelemetry.latitude) - 0.008}%2C${Number(serverTelemetry.longitude) + 0.008}%2C${Number(serverTelemetry.latitude) + 0.008}&layer=mapnik&marker=${serverTelemetry.latitude}%2C${serverTelemetry.longitude}`}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : null}

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
                    {r.stops.slice(0, 3).map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100/60">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
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
          MODE 3: MODERN DRIVER SMARTPHONE APP (SCREENSHOT REFERENCE)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'DRIVER' && (
        <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 animate-fade-in font-sans pb-12">
          
          {/* 1. TOP BRANDED DRIVER BAR (MATCHING WEBSITE THEME #122A24) */}
          <div className="bg-[#122A24] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-800/30 relative overflow-hidden">
            {/* Subtle emerald gradient ambient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-60 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                {/* Driver Avatar with forest green cap & uniform */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0B1915] flex-shrink-0 border-2 border-emerald-400/40 shadow-md flex items-center justify-center relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="50" fill="#1C443A" />
                    <path d="M20 95 C20 70, 35 65, 50 65 C65 65, 80 70, 80 95 Z" fill="#122A24" />
                    <path d="M45 65 L50 78 L55 65 Z" fill="#F8FAFC" />
                    <path d="M48 72 L50 85 L52 72 Z" fill="#10B981" />
                    <rect x="44" y="55" width="12" height="12" rx="4" fill="#F6C8A6" />
                    <ellipse cx="50" cy="46" rx="16" ry="18" fill="#F6C8A6" />
                    <path d="M40 52 C45 49, 48 53, 50 51 C52 53, 55 49, 60 52 C57 56, 43 56, 40 52 Z" fill="#0B1915" />
                    <circle cx="43" cy="43" r="2" fill="#0B1915" />
                    <circle cx="57" cy="43" r="2" fill="#0B1915" />
                    <path d="M40 39 Q43 37 46 39" stroke="#0B1915" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M54 39 Q57 37 60 39" stroke="#0B1915" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M30 35 C30 20, 70 20, 70 35 Z" fill="#122A24" />
                    <path d="M26 35 C35 32, 65 32, 74 35 C70 41, 30 41, 26 35 Z" fill="#0B1915" />
                    <ellipse cx="50" cy="29" rx="4" ry="4" fill="#10B981" />
                    <polygon points="50,26 52,31 48,31" fill="#34D399" />
                  </svg>
                </div>

                {/* Driver Details */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      DRIVER COCKPIT
                    </span>
                    {/* Driver Duty Status Badge */}
                    {activeRoute.driverStatus === 'ABSENT' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-400/40 animate-pulse">
                        🔴 DRIVER ABSENT
                      </span>
                    ) : activeRoute.driverStatus === 'RELIEF_ASSIGNED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-400/40">
                        🟡 RELIEF DRIVER COVERAGE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        🟢 ON DUTY
                      </span>
                    )}
                    <span className="text-xs text-emerald-200/70 font-medium">
                      {driverGreeting}
                    </span>
                  </div>

                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white leading-tight mt-0.5 flex items-center gap-2">
                    <span>{driverDisplayName}</span>
                    <span>👋</span>
                  </h1>

                  <div className="flex items-center gap-2 flex-wrap mt-0.5 text-xs text-emerald-100/70 font-medium">
                    <span>Vehicle: <strong className="text-white font-mono">{driverVehicleNo}</strong></span>
                    <span>&bull;</span>
                    <span>Route: <strong className="text-white">{activeRoute.name} ({activeRoute.code})</strong></span>
                    <button
                      onClick={() => setShowRouteSelectModal(true)}
                      className="ml-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-emerald-200 text-[10px] font-bold border border-white/20 transition-all cursor-pointer flex items-center gap-1"
                      title="Switch bus route"
                    >
                      <Repeat className="w-3 h-3" />
                      <span>Switch Bus</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Status Indicators */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                {/* Driver Absence / Leave Action Button */}
                <button
                  onClick={() => setShowAbsenceModal(true)}
                  className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    activeRoute.driverStatus === 'ABSENT'
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-400/40'
                      : activeRoute.driverStatus === 'RELIEF_ASSIGNED'
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                  title="Report Driver Absence / Manage Relief Driver"
                >
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span>{activeRoute.driverStatus === 'ABSENT' ? 'Relief Needed' : 'Report Leave'}</span>
                </button>

                {/* Live GPS State Pill */}
                <div className="px-3 py-1.5 rounded-2xl bg-black/30 border border-white/10 text-xs flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${driverTripActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-bold text-white text-[11px]">
                    {driverTripActive ? 'LIVE GPS ACTIVE' : 'GPS STANDBY'}
                  </span>
                </div>

                {/* Dispatch Notifications Bell */}
                <button
                  onClick={() => setShowNotificationModal(true)}
                  className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer relative shrink-0"
                  title="Dispatch Messages"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ────── DRIVER ABSENCE & RELIEF HANDOVER ALERT BANNER ────── */}
          {activeRoute.driverStatus === 'ABSENT' && (
            <div className="bg-[#FFF5F5] border-2 border-rose-300 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-up">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      ASSIGNED DRIVER ABSENT TODAY
                    </span>
                    <span className="text-xs font-semibold text-rose-700 font-mono">
                      Reason: {activeRoute.reliefReason || 'Medical / Sick Leave'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-rose-950 mt-1">
                    Regular driver {activeRoute.driver} is unavailable for {activeRoute.name} ({activeRoute.code})
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    {activeRoute.onboardGpsTracking
                      ? '✅ Automated Vehicle Hardware GPS Mode is active. Bus location and ETAs are transmitting automatically.'
                      : '⚠️ Assign a Standby Relief Driver below, or activate Automated Vehicle Onboard GPS so parents can still track the bus.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={() => setShowReliefModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer border-none flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign Relief Driver</span>
                </button>

                <button
                  onClick={() => {
                    setRoutes(prev => prev.map(r => r.id === activeRoute.id ? { ...r, onboardGpsTracking: !r.onboardGpsTracking } : r));
                    alert(activeRoute.onboardGpsTracking ? 'Automated Vehicle GPS mode deactivated.' : '✅ Automated Onboard Vehicle IoT GPS Mode activated for Route ' + activeRoute.code);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition-all shadow-md cursor-pointer border-none flex items-center gap-1.5"
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>{activeRoute.onboardGpsTracking ? 'Stop Onboard GPS' : 'Activate Onboard GPS'}</span>
                </button>

                <button
                  onClick={() => {
                    setRoutes(prev => prev.map(r => r.id === activeRoute.id ? { ...r, driverStatus: 'PRESENT', substituteDriver: undefined } : r));
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 cursor-pointer"
                >
                  Cancel Absence
                </button>
              </div>
            </div>
          )}

          {activeRoute.driverStatus === 'RELIEF_ASSIGNED' && (
            <div className="bg-[#EBF5EF] border border-[#C5E2CF] rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-black uppercase">
                      RELIEF DRIVER ACTIVE
                    </span>
                    <span className="text-xs text-emerald-800 font-medium">Covering for regular driver {activeRoute.driver}</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#122A24] mt-0.5">
                    Substitute Driver: {activeRoute.substituteDriver} &bull; <span className="font-mono text-xs">{activeRoute.substitutePhone}</span>
                  </h4>
                  <p className="text-xs text-slate-600">Bus attendance, route navigation, and live GPS streaming are fully active.</p>
                </div>
              </div>

              <button
                onClick={() => setShowReliefModal(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#1C443A] border border-[#C5E2CF] text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              >
                Change Relief Driver
              </button>
            </div>
          )}

          {/* 2. TOP 4 METRIC CARDS ROW / GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: Route & Shift */}
            <div className="bg-white border border-[#DCE8E0] rounded-3xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C5E2CF] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shadow-sm">
                  <Bus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Shift Info</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-[#122A24] text-sm leading-tight line-clamp-1">
                  {activeRoute.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  07:15 AM – 08:30 AM
                </p>
              </div>
              <div className="mt-3">
                {driverTripActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Trip In Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    Ready to Depart
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Assigned Students strictly in this driver's bus */}
            <div className="bg-white border border-[#DCE8E0] rounded-3xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C5E2CF] transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Assigned Only
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-medium">Bus Students</p>
                <p className="text-2xl sm:text-3xl font-black text-[#122A24] tracking-tight leading-none">
                  {busAssignedStudents.length}
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-600 flex items-center gap-2">
                <span>Picked: <strong className="text-emerald-700 font-bold">{driverPickedCount}</strong></span>
                <span>&bull;</span>
                <span>Left: <strong className="text-amber-700 font-bold">{driverLeftCount}</strong></span>
              </div>
            </div>

            {/* Card 3: Route Stops (Fixed by Transport Incharge) */}
            <div className="bg-white border border-[#DCE8E0] rounded-3xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C5E2CF] transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#F4F8F5] text-[#122A24] flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Fixed by Incharge
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-medium">Route Stops</p>
                <p className="text-2xl sm:text-3xl font-black text-[#122A24] tracking-tight leading-none">
                  {activeRoute.stops.length}
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-600 flex items-center gap-2">
                <span>Reached: <strong className="text-emerald-700 font-bold">{completedStopIds.length}</strong></span>
                <span>&bull;</span>
                <span>Pending: <strong className="text-slate-600 font-bold">{Math.max(0, activeRoute.stops.length - completedStopIds.length)}</strong></span>
              </div>
            </div>

            {/* Card 4: Real-time Mobile GPS Telemetry with Instant Speed Testing Controls */}
            <div className="bg-white border border-[#DCE8E0] rounded-3xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C5E2CF] transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Radio className="w-4 h-4" />
                </div>
                <span className="text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Sub-Second GPS
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs text-slate-500 font-medium">Live Speed</p>
                  <span className="text-[10px] font-mono text-slate-400">{liveDriverGeo.lastUpdated}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#122A24] tracking-tight leading-none font-mono">
                  {liveDriverGeo.speedKmh} <span className="text-xs font-semibold text-slate-500">km/h</span>
                </p>
              </div>

              {/* Speed Testing Stepper Controls (for testing live speed & ETA reaction when stationary) */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                <span className="text-slate-400 font-medium">Test Speed:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const newSpeed = Math.min(80, (manualSpeedSim ?? liveDriverGeo.speedKmh) + 10);
                      setManualSpeedSim(newSpeed);
                      setLiveDriverGeo(prev => ({ ...prev, speedKmh: newSpeed }));
                    }}
                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 cursor-pointer"
                    title="Simulate +10 km/h"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => {
                      const newSpeed = Math.max(0, (manualSpeedSim ?? liveDriverGeo.speedKmh) - 10);
                      setManualSpeedSim(newSpeed);
                      setLiveDriverGeo(prev => ({ ...prev, speedKmh: newSpeed }));
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
                    title="Simulate -10 km/h"
                  >
                    -10
                  </button>
                  {manualSpeedSim !== null && (
                    <button
                      onClick={() => setManualSpeedSim(null)}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 cursor-pointer"
                      title="Reset to real GPS hardware"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* 3. MAIN DASHBOARD CONTENT (2 COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            
            {/* ────── LEFT COLUMN: DYNAMIC TRIP PROGRESS & FIXED STOPS TIMELINE ────── */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              
              {/* DYNAMIC TRIP PROGRESS CARD (COMPUTED 100% FROM LIVE GPS - NO DEMO STATIC PROGRESS) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE8E0] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#122A24]">
                      Trip Progress
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Calculated 100% dynamically from live mobile GPS
                    </p>
                  </div>
                  <span className="text-2xl font-black text-[#122A24] font-mono">
                    {dynamicProgressPercent}%
                  </span>
                </div>

                {/* Dynamic Real-time Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-[#EBF5EF] rounded-full overflow-hidden p-0.5 border border-[#DCE8E0]">
                    <div
                      className="h-full bg-gradient-to-r from-[#1C443A] to-emerald-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(4, dynamicProgressPercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{completedStopIds.length} of {activeRoute.stops.length} stops reached</span>
                    <span>{activeRoute.stops.length - completedStopIds.length} stops remaining</span>
                  </div>
                </div>

                {/* Notice: Stops Fixed by Transport Incharge */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#1C443A] text-xs font-semibold">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Stops &amp; Schedule Fixed by Transport Incharge (Read-Only)</span>
                </div>

                {/* STOPS VERTICAL TIMELINE (READ-ONLY FOR DRIVER) */}
                <div className="pt-2 space-y-3 relative before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[#DCE8E0]">
                  {activeRoute.stops.map((st, idx) => {
                    const isCompleted = completedStopIds.includes(st.id);
                    const isCurrent = !isCompleted && nextDriverStop.id === st.id;
                    const isDropPoint = idx === activeRoute.stops.length - 1;

                    return (
                      <div key={st.id} className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex items-start gap-2.5">
                          {isCompleted ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-6 h-6 rounded-full bg-[#1C443A] text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-emerald-100">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            </div>
                          ) : isDropPoint ? (
                            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                              <Flag className="w-3.5 h-3.5 fill-rose-600" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0" />
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold leading-tight ${
                                isCurrent ? 'text-[#1C443A]' : isCompleted ? 'text-slate-500 line-through' : isDropPoint ? 'text-rose-700' : 'text-slate-800'
                              }`}>
                                {st.name}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                                  Next Approaching
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium block">
                              {isDropPoint ? 'Final School Drop Point' : `Stop #${idx + 1}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono text-slate-500 font-semibold">
                            {st.scheduledTime}
                          </span>
                          {/* Driver can confirm stop reached manually if GPS accuracy jitter occurs */}
                          {isCurrent && (
                            <button
                              onClick={() => {
                                setCompletedStopIds(prev => [...prev, st.id]);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#EBF5EF] hover:bg-[#D8EEDF] text-[#1C443A] border border-[#C5E2CF] text-[10px] font-bold cursor-pointer transition-colors"
                              title="Confirm Reached"
                            >
                              Arrived
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QUICK ACTIONS CARD */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE8E0] shadow-sm space-y-3">
                <h3 className="font-bold text-base text-[#122A24]">
                  Driver Quick Actions
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Action 1: Mark Attendance */}
                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="p-3.5 rounded-2xl bg-[#EBF5EF] hover:bg-[#D8EEDF] border border-[#C5E2CF] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/15 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#122A24] leading-tight">
                      Mark Attendance
                    </span>
                  </button>

                  {/* Action 2: Report Issue */}
                  <button
                    onClick={() => setShowReportIssueModal(true)}
                    className="p-3.5 rounded-2xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FEE2E2] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#122A24] leading-tight">
                      Report Delay
                    </span>
                  </button>

                  {/* Action 3: Report Leave / Absence */}
                  <button
                    onClick={() => setShowAbsenceModal(true)}
                    className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserX className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-amber-900 leading-tight">
                      Driver Leave / Relief
                    </span>
                  </button>

                  {/* Action 4: Call School */}
                  <a
                    href="tel:+915222610000"
                    className="p-3.5 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] border border-[#DCE8E0] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer no-underline group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#122A24]/10 text-[#122A24] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Call School
                    </span>
                  </a>

                  {/* Action 5: Call Transport Incharge */}
                  <a
                    href="tel:+919876543210"
                    className="p-3.5 rounded-2xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#F3E8FF] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer no-underline group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Call Incharge
                    </span>
                  </a>

                  {/* Action 6: Emergency SOS */}
                  <button
                    onClick={() => setShowSosModal(true)}
                    className="p-3.5 rounded-2xl bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FFE4E6] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform font-bold text-xs shadow-sm">
                      SOS
                    </div>
                    <span className="text-xs font-extrabold text-rose-700 leading-tight">
                      Emergency SOS
                    </span>
                  </button>
                </div>
              </div>

            </div>

            {/* ────── RIGHT COLUMN: LIVE GOOGLE MAP, DYNAMIC ETA, SCHEDULE ────── */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              
              {/* LIVE TRACKING GOOGLE MAP & MARKED ROUTE CARD WITH REAL-TIME MOBILE TELEMETRY HUD */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE8E0] shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#122A24]">
                      Live Google Maps &amp; Route Radar
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Map
                    </span>
                  </div>

                  {/* Open in Native Google Maps App Button for Turn-by-Turn Voice Navigation */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${liveDriverGeo.latitude},${liveDriverGeo.longitude}&destination=${nextDriverStop?.lat || activeRoute.stops[activeRoute.stops.length - 1]?.lat || 26.8520},${nextDriverStop?.lng || activeRoute.stops[activeRoute.stops.length - 1]?.lng || 80.9400}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 bg-[#EBF5EF] hover:bg-[#D8EEDF] px-3 py-1.5 rounded-xl border border-[#C5E2CF] no-underline transition-all shadow-xs"
                    title="Launch voice navigation in Google Maps app"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Open in Maps App</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                {/* 4 Interactive Map Mode Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] text-[11px]">
                  <button
                    onClick={() => setGoogleMapMode('ROUTE_PATH')}
                    className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                      googleMapMode === 'ROUTE_PATH'
                        ? 'bg-[#122A24] text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🗺️ Marked Route
                  </button>

                  <button
                    onClick={() => setGoogleMapMode('LIVE_NAV')}
                    className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                      googleMapMode === 'LIVE_NAV'
                        ? 'bg-[#122A24] text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎯 Nav to Next Stop
                  </button>

                  <button
                    onClick={() => setGoogleMapMode('LIVE_PIN')}
                    className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                      googleMapMode === 'LIVE_PIN'
                        ? 'bg-[#122A24] text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📍 Live Bus Pin
                  </button>

                  <button
                    onClick={() => setGoogleMapMode('RADAR_CANVAS')}
                    className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                      googleMapMode === 'RADAR_CANVAS'
                        ? 'bg-[#122A24] text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧭 Stops Radar
                  </button>
                </div>

                {/* Interactive Embedded Map Container */}
                <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 border border-[#DCE8E0] shadow-inner">
                  {/* Mode 1: Marked Route Driving Directions with exact start & end coordinates */}
                  {googleMapMode === 'ROUTE_PATH' && (
                    <iframe
                      src={`https://maps.google.com/maps?saddr=${activeRoute.stops[0]?.lat || 26.8378},${activeRoute.stops[0]?.lng || 80.8872}&daddr=${activeRoute.stops[activeRoute.stops.length - 1]?.lat || 26.8520},${activeRoute.stops[activeRoute.stops.length - 1]?.lng || 80.9400}&hl=en&z=13&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      title="Assigned Bus Route Driving Directions on Google Maps"
                    />
                  )}

                  {/* Mode 2: Live Navigation from Driver's Phone to Approaching Next Stop */}
                  {googleMapMode === 'LIVE_NAV' && (
                    <iframe
                      src={`https://maps.google.com/maps?saddr=${liveDriverGeo.latitude},${liveDriverGeo.longitude}&daddr=${nextDriverStop?.lat || activeRoute.stops[activeRoute.stops.length - 1]?.lat || 26.8520},${nextDriverStop?.lng || activeRoute.stops[activeRoute.stops.length - 1]?.lng || 80.9400}&hl=en&z=14&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      title="Live Turn-by-Turn to Next Bus Stop"
                    />
                  )}

                  {/* Mode 3: Live Driver GPS High-Zoom Pin */}
                  {googleMapMode === 'LIVE_PIN' && (
                    <iframe
                      src={`https://maps.google.com/maps?q=${liveDriverGeo.latitude},${liveDriverGeo.longitude}&hl=en&z=16&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      title="Driver Live Location on Google Maps"
                    />
                  )}

                  {/* Mode 4: Interactive Route & Stops Radar Canvas */}
                  {googleMapMode === 'RADAR_CANVAS' && (
                    <div className="w-full h-full bg-[#122A24] p-4 flex flex-col justify-between relative overflow-hidden text-white">
                      {/* Subtle radar sweep grid background */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent opacity-80 pointer-events-none" />

                      {/* Header radar status */}
                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="font-bold text-emerald-300 font-mono uppercase tracking-wider">{activeRoute.code} &bull; Radar Path</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-300">{activeRoute.stops.length} Stops Marked</span>
                      </div>

                      {/* Route Path Track Visualization */}
                      <div className="relative z-10 my-auto py-4">
                        <div className="relative flex items-center justify-between">
                          {/* Connecting track line */}
                          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 bg-emerald-950 rounded-full border border-emerald-500/30 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-500"
                              style={{ width: `${Math.max(10, dynamicProgressPercent)}%` }}
                            />
                          </div>

                          {/* Stops Pointers */}
                          {activeRoute.stops.map((st, i) => {
                            const isPast = completedStopIds.includes(st.id);
                            const isCurrent = !isPast && nextDriverStop.id === st.id;
                            return (
                              <div key={st.id} className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all shadow-md ${
                                    isPast
                                      ? 'bg-emerald-500 text-white'
                                      : isCurrent
                                      ? 'bg-emerald-300 text-[#122A24] ring-4 ring-emerald-500/50 scale-125'
                                      : 'bg-[#1C443A] text-slate-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {isPast ? '✓' : i + 1}
                                </div>
                                <span className={`text-[9px] font-bold mt-1 text-center max-w-[55px] truncate block ${
                                  isCurrent ? 'text-emerald-300 font-extrabold' : 'text-slate-400'
                                }`}>
                                  {st.name.replace('Stop', '').trim()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Radar Footer Info */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono bg-black/40 p-2.5 rounded-xl border border-white/10">
                        <span className="text-slate-300">Next: <strong className="text-emerald-300">{nextDriverStop?.name}</strong></span>
                        <span className="text-emerald-400 font-bold">{liveDistanceToNextKm} km &bull; {dynamicEtaMinutes}m ETA</span>
                      </div>
                    </div>
                  )}

                  {/* FLOATING MOBILE LIVE TELEMETRY STATUS HUD OVER GOOGLE MAP */}
                  <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 bg-[#122A24]/90 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-2xl border border-emerald-500/30 shadow-lg text-xs space-y-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Mobile GPS Status: {driverTripActive ? 'Streaming' : 'Ready'}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-300">{liveDriverGeo.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-200">
                      <span>Lat: {liveDriverGeo.latitude.toFixed(4)}&deg;</span>
                      <span>Lng: {liveDriverGeo.longitude.toFixed(4)}&deg;</span>
                      <span className="text-emerald-300 font-bold">{liveDriverGeo.speedKmh} km/h</span>
                      <span className="text-slate-400">&plusmn;{liveDriverGeo.accuracyMeters}m</span>
                    </div>
                  </div>

                  {/* Center GPS Crosshair Button */}
                  <button
                    onClick={readAndTransmitLivePosition}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-300 text-[#122A24] flex items-center justify-center hover:bg-[#EBF5EF] transition-colors cursor-pointer z-10"
                    title="Center My Live GPS"
                  >
                    <LocateFixed className="w-5 h-5 text-[#1C443A]" />
                  </button>
                </div>

                {/* GPS Transmitter Action Button */}
                <div className="space-y-2">
                  {!driverTripActive ? (
                    <button
                      onClick={startDriverTrip}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>START GPS TRIP (TRANSMIT LIVE LOCATION)</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopDriverTrip}
                      className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>END TRIP &bull; STOP TRANSMITTING GPS</span>
                    </button>
                  )}

                  {/* Live Status Description */}
                  <p className="text-[11px] text-center text-slate-500 font-medium">
                    {gpsStatusMessage}
                  </p>
                </div>
              </div>

              {/* NEXT STOP CARD WITH LIVE DYNAMIC ETA (NO DEMO ETA) */}
              <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shrink-0 border border-[#C5E2CF]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Next Approaching Stop
                    </span>
                    <h4 className="font-bold text-base text-[#122A24] leading-tight">
                      {nextDriverStop?.name || 'School Campus'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Distance: <strong className="text-slate-800 font-mono">{liveDistanceToNextKm} km</strong> away &bull; Scheduled: {nextDriverStop?.scheduledTime}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-[#F4F8F5] p-3 rounded-2xl border border-[#DCE8E0]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    DYNAMIC ETA
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 leading-tight font-mono">
                    {liveDistanceToNextKm <= 0.25 ? 'ARRIVED' : `${dynamicEtaMinutes}m`}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-medium">
                    {liveDistanceToNextKm <= 0.25 ? 'At Bus Stop' : 'Live Speed Calc'}
                  </span>
                </div>
              </div>

              {/* TODAY'S SCHEDULE CARD (FIXED BY TRANSPORT INCHARGE) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE8E0] shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#122A24]">
                      Today&apos;s Route Shifts
                    </h3>
                    <p className="text-xs text-slate-500">Fixed by Transport Incharge</p>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    View Details
                  </button>
                </div>

                {/* Schedule Timeline Items */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Play className="w-3 h-3 fill-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#122A24]">Morning Pickup Shift</span>
                        <span className="text-xs font-mono font-semibold text-emerald-700">07:15 AM – 08:30 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">Depot &rarr; City Stops &rarr; School Main Gate</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                      <Bus className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Afternoon Drop Shift</span>
                        <span className="text-xs font-mono font-semibold text-slate-500">01:45 PM – 03:00 PM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">School Main Gate &rarr; Reverse Route Terminals</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 border border-slate-300">
                      <Square className="w-2.5 h-2.5 fill-slate-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Evening Special Transit</span>
                        <span className="text-xs font-mono font-semibold text-slate-500">04:30 PM – 05:30 PM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">Campus Special Transit &bull; Senior Class 9-12 Evening Drop</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* 4. TODAY'S ATTENDANCE SUMMARY CARD (STRICTLY FOR ASSIGNED BUS STUDENTS) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE8E0] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#122A24]">
                  Today&apos;s Bus Attendance Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Strictly showing {busAssignedStudents.length} students assigned to this bus ({activeRoute.name})
                </p>
              </div>
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="px-4 py-2 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition-colors cursor-pointer border-none"
              >
                Manage Pickup Roster
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat 1: Total Assigned */}
              <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-[#122A24] leading-tight block">
                    {busAssignedStudents.length}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Assigned Students
                  </span>
                </div>
              </div>

              {/* Stat 2: Picked Up */}
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-emerald-700 leading-tight block">
                    {driverPickedCount}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Picked Up
                  </span>
                </div>
              </div>

              {/* Stat 3: Dropped */}
              <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-blue-700 leading-tight block">
                    {driverDroppedCount}
                  </span>
                  <span className="text-[11px] text-blue-600 font-medium">
                    Dropped at School
                  </span>
                </div>
              </div>

              {/* Stat 4: Left / Absent */}
              <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-rose-700 leading-tight block">
                    {driverLeftCount}
                  </span>
                  <span className="text-[11px] text-rose-600 font-medium">
                    Pending / Absent
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ────── INTERACTIVE DRIVER MODAL DIALOGS ────── */}

          {/* MODAL 1: STUDENT ATTENDANCE & PICKUP ROSTER */}
          {showAttendanceModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DCE8E0] overflow-hidden animate-scale-up">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#F4F8F5]">
                  <div>
                    <h3 className="font-bold text-base text-[#122A24]">
                      Bus Student Attendance Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeRoute.name} &bull; {driverPickedCount} Picked &bull; {driverLeftCount} Remaining
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAttendanceModal(false)}
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-[#F4F8F5]/60">
                  <input
                    type="text"
                    value={driverStudentSearch}
                    onChange={(e) => setDriverStudentSearch(e.target.value)}
                    placeholder="Search assigned student or stop..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    {(['ALL', 'PICKED', 'PENDING', 'DROPPED'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setAttendanceFilter(tab)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all border cursor-pointer ${
                          attendanceFilter === tab
                            ? 'bg-[#122A24] text-white border-[#122A24]'
                            : 'bg-white text-slate-600 border-[#DCE8E0] hover:bg-[#F4F8F5]'
                        }`}
                      >
                        {tab} ({
                          tab === 'ALL' ? busAssignedStudents.length :
                          tab === 'PICKED' ? driverPickedCount :
                          tab === 'PENDING' ? driverLeftCount :
                          driverDroppedCount
                        })
                      </button>
                    ))}
                  </div>
                </div>

                {/* Students List */}
                <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
                  {busAssignedStudents
                    .filter(s => {
                      const status = studentStatusMap[s.id] || 'PENDING';
                      if (attendanceFilter === 'PICKED') return status === 'PICKED';
                      if (attendanceFilter === 'PENDING') return status === 'PENDING' || status === 'ABSENT';
                      if (attendanceFilter === 'DROPPED') return status === 'DROPPED';
                      return true;
                    })
                    .filter(s => {
                      if (!driverStudentSearch) return true;
                      const q = driverStudentSearch.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.stop.toLowerCase().includes(q) || s.class.toLowerCase().includes(q);
                    })
                    .map(student => {
                      const currentStatus = studentStatusMap[student.id] || 'PENDING';
                      return (
                        <div
                          key={student.id}
                          className="p-3 rounded-2xl bg-white border border-[#DCE8E0] hover:border-emerald-300 flex items-center justify-between gap-3 shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{student.avatar}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#122A24]">{student.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-semibold">
                                  {student.class}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium block">
                                Stop: {student.stop}
                              </span>
                            </div>
                          </div>

                          {/* Status Toggle Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setStudentStatusMap(prev => ({ ...prev, [student.id]: 'PICKED' }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                currentStatus === 'PICKED'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              Picked
                            </button>

                            <button
                              onClick={() => {
                                setStudentStatusMap(prev => ({ ...prev, [student.id]: 'ABSENT' }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              Absent
                            </button>

                            <button
                              onClick={() => {
                                setStudentStatusMap(prev => ({ ...prev, [student.id]: 'DROPPED' }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                currentStatus === 'DROPPED'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              }`}
                            >
                              Drop
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-[#F4F8F5] flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Changes synced to School Transport Database
                  </span>
                  <button
                    onClick={() => setShowAttendanceModal(false)}
                    className="px-5 py-2 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition-colors cursor-pointer border-none"
                  >
                    Done
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* MODAL 2: REPORT TRIP DELAY / ISSUE */}
          {showReportIssueModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-bold text-base text-slate-900">
                      Report Route Delay / Issue
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowReportIssueModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Select issue type to instantly notify the School Control Room and Parents on this route:
                </p>

                {/* Issue Type Chips */}
                <div className="space-y-2">
                  {[
                    'Heavy Traffic Jam (+15m delay)',
                    'Flat Tyre / Puncture (+20m delay)',
                    'Road Diversion / Construction (+10m delay)',
                    'Vehicle Engine Heating / Breakdown',
                    'Heavy Rainfall / Waterlogging'
                  ].map(item => (
                    <button
                      key={item}
                      onClick={() => setIssueType(item)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        issueType === item
                          ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      &bull; {item}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Additional Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    placeholder="Location landmark or extra message..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowReportIssueModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setActiveAlert(`${issueType} reported by ${driverDisplayName} for ${activeRoute.name}.`);
                      setShowReportIssueModal(false);
                      alert('✅ Issue broadcasted to School Transport Manager and Parent Portal.');
                    }}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer border-none shadow-md"
                  >
                    Send Delay Notice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 3: EMERGENCY SOS */}
          {showSosModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-rose-500 p-6 space-y-5 animate-scale-up">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md animate-pulse">
                    <AlertOctagon className="w-9 h-9" />
                  </div>
                  <h3 className="font-display font-black text-xl text-rose-600">
                    EMERGENCY DRIVER SOS
                  </h3>
                  <p className="text-xs text-slate-600">
                    One-tap priority emergency hotline for school bus drivers in distress:
                  </p>
                </div>

                <div className="space-y-2.5">
                  <a
                    href="tel:+915222610000"
                    className="w-full p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-between font-bold text-xs no-underline cursor-pointer"
                  >
                    <span>📞 School Emergency Dispatch</span>
                    <span className="font-mono text-[11px]">+91 522 2610000</span>
                  </a>

                  <a
                    href="tel:+919876543210"
                    className="w-full p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 flex items-center justify-between font-bold text-xs no-underline cursor-pointer"
                  >
                    <span>📞 Transport Manager</span>
                    <span className="font-mono text-[11px]">+91 98765 43210</span>
                  </a>

                  <a
                    href="tel:112"
                    className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-between font-bold text-xs no-underline cursor-pointer"
                  >
                    <span>🚨 Police Emergency Control</span>
                    <span className="font-mono text-[11px]">Dial 112</span>
                  </a>

                  <a
                    href="tel:108"
                    className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between font-bold text-xs no-underline cursor-pointer"
                  >
                    <span>🚑 Medical Ambulance</span>
                    <span className="font-mono text-[11px]">Dial 108</span>
                  </a>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveAlert(`🚨 SOS ALERT: Emergency triggered by Driver ${driverDisplayName} for vehicle ${driverVehicleNo}!`);
                      setShowSosModal(false);
                      alert('🚨 SOS alert broadcasted to school management and authorities.');
                    }}
                    className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer border-none shadow-lg"
                  >
                    Trigger Live SOS Broadcast
                  </button>
                  <button
                    onClick={() => setShowSosModal(false)}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer border-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 4: NOTIFICATIONS & DISPATCH (READ-ONLY FOR DRIVER AS INSTRUCTED) */}
          {showNotificationModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-base text-slate-900">
                      Transport Dispatch Notices
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Official notices sent from the School Control Room &amp; Parents:
                </p>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#122A24]">Parent of Aarav Sharma</span>
                      <span className="text-[10px] text-slate-400 font-mono">07:20 AM</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      &ldquo;Aarav will board at Green Park Stop today. Running 2 minutes ahead.&rdquo;
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">School Control Room</span>
                      <span className="text-[10px] text-slate-400 font-mono">07:10 AM</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      &ldquo;Road diversion near Anand School cleared. You can use standard route gate 2.&rdquo;
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Shift Started</span>
                      <span className="text-[10px] text-slate-400 font-mono">07:05 AM</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      &ldquo;Morning trip assigned to {driverVehicleNo}. GPS transmitter active.&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setUnreadNotifications(0);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Mark All as Read
                  </button>

                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="px-5 py-2 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition-colors cursor-pointer border-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 5: FULL SCHEDULE MODAL (FIXED BY TRANSPORT INCHARGE) */}
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#122A24]">
                      {activeRoute.name} &bull; Daily Schedule
                    </h3>
                    <p className="text-xs text-slate-500">Fixed by Transport Incharge</p>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#122A24] uppercase">Morning Shift (Current)</span>
                      <span className="text-xs font-mono font-bold text-emerald-700">07:15 AM – 08:30 AM</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      Depot &rarr; City Stops &rarr; Campus Main Gate
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 uppercase">Afternoon Drop Shift</span>
                      <span className="text-xs font-mono font-bold text-slate-500">01:45 PM – 03:00 PM</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Anand School (Gate 2) &rarr; Sunrise Villa &rarr; City Center &rarr; Sector 62 &rarr; Green Park &rarr; Depot
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 uppercase">Remedial Class Evening Shift</span>
                      <span className="text-xs font-mono font-bold text-slate-500">04:30 PM – 05:30 PM</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Campus Special Transit &bull; Senior Class 9-12 Evening Drop
                    </p>
                  </div>
                </div>

                <div className="text-right pt-2">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer border-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

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
