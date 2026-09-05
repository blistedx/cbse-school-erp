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
  ExternalLink,
  Maximize2,
  Minimize2
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

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface RouteShiftConfig {
  id: ShiftType;
  name: string;
  shortLabel: string;
  timing: string;
  type: 'PICKUP' | 'DROP';
  description: string;
}

export const ROUTE_SHIFTS_METADATA: Record<ShiftType, RouteShiftConfig> = {
  MORNING: {
    id: 'MORNING',
    name: 'Morning Pickup Shift',
    shortLabel: 'Pickup to School',
    timing: '07:15 AM – 08:30 AM',
    type: 'PICKUP',
    description: 'Residential Terminals &rarr; City Stops &rarr; School Main Gate'
  },
  AFTERNOON: {
    id: 'AFTERNOON',
    name: 'Afternoon Drop Shift',
    shortLabel: 'Junior School Drop',
    timing: '01:45 PM – 03:00 PM',
    type: 'DROP',
    description: 'School Main Gate &rarr; Reverse Residential Drops'
  },
  EVENING: {
    id: 'EVENING',
    name: 'Evening Special Transit',
    shortLabel: 'Senior & Remedial',
    timing: '04:30 PM – 05:30 PM',
    type: 'DROP',
    description: 'School Main Gate &rarr; Senior & Sports Hub Drops'
  }
};

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
  const [allTelemetries, setAllTelemetries] = useState<Record<string, any>>({});
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState(false);
  const [isLivePhoneStreaming, setIsLivePhoneStreaming] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string>('Ready to Transmit');

  // Fetch live telemetry from server to check if driver's mobile is actively transmitting
  const fetchTelemetry = useCallback(async () => {
    setIsRefreshingTelemetry(true);
    try {
      const res = await fetch(`/api/transport/telemetry?t=${Date.now()}`);
      const data = await res.json();
      if (data && data.success && data.telemetries) {
        setAllTelemetries(data.telemetries);
        let activeTele: any = null;
        if (data.telemetries[selectedRouteId]?.isOnline) {
          activeTele = data.telemetries[selectedRouteId];
        } else {
          activeTele = Object.values(data.telemetries).find((t: any) => t.isOnline);
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
    } catch (e) {} finally {
      setTimeout(() => setIsRefreshingTelemetry(false), 400);
    }
  }, [selectedRouteId]);

  // Poll live telemetry every 2 seconds
  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(timer);
  }, [fetchTelemetry]);

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
  // Dynamic Map Sizing presets: STANDARD (580px), LARGE (740px), THEATER (880px)
  const [mapSize, setMapSize] = useState<'STANDARD' | 'LARGE' | 'THEATER'>('LARGE');
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);

  // Active Operating Shift for the Bus (Morning Pickup vs Afternoon Drop vs Evening Transit)
  // Auto-detects based on current clock time, with manual 1-click override
  const [activeShift, setActiveShift] = useState<ShiftType>(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 16) return 'AFTERNOON';
    return 'EVENING';
  });

  // Dynamic stops sequence for the currently active shift
  const currentShiftStops = useMemo((): RouteStop[] => {
    const baseStops = activeRoute.stops || [];
    if (!baseStops.length) return [];
    if (activeShift === 'MORNING') {
      return baseStops;
    }

    if (activeShift === 'AFTERNOON') {
      // Reverse order: originates at School Campus, visits residential stops in reverse to drop kids home
      const schoolStop = baseStops[baseStops.length - 1];
      const otherStops = baseStops.slice(0, baseStops.length - 1).reverse();
      const dropStops: RouteStop[] = [
        {
          id: `${schoolStop.id}-aft-start`,
          name: `${schoolStop.name} (Departure Point)`,
          scheduledTime: '01:45 PM',
          distanceKm: 0,
          lat: schoolStop.lat,
          lng: schoolStop.lng
        },
        ...otherStops.map((s, idx) => {
          const mins = 15 + idx * 12;
          const h = 2;
          const m = mins < 60 ? mins : mins - 60;
          const timeStr = `0${h}:${m < 10 ? '0' : ''}${m} PM`;
          return {
            id: `${s.id}-aft`,
            name: `${s.name} (Drop Point)`,
            scheduledTime: timeStr,
            distanceKm: Number((4.5 + idx * 4.2).toFixed(1)),
            lat: s.lat,
            lng: s.lng
          };
        })
      ];
      return dropStops;
    }

    // EVENING shift: Senior & Remedial transit
    const schoolStop = baseStops[baseStops.length - 1];
    const keyStops = baseStops.slice(0, Math.min(3, baseStops.length - 1)).reverse();
    return [
      {
        id: `${schoolStop.id}-eve-start`,
        name: `${schoolStop.name} (Campus Gate)`,
        scheduledTime: '04:30 PM',
        distanceKm: 0,
        lat: schoolStop.lat,
        lng: schoolStop.lng
      },
      ...keyStops.map((s, idx) => {
        const mins = 20 + idx * 15;
        return {
          id: `${s.id}-eve`,
          name: `${s.name} (Express Hub)`,
          scheduledTime: `04:${mins} PM`,
          distanceKm: Number((6.0 + idx * 5.5).toFixed(1)),
          lat: s.lat,
          lng: s.lng
        };
      })
    ];
  }, [activeRoute, activeShift]);

  const handleShiftChange = (newShift: ShiftType) => {
    setActiveShift(newShift);
    setCompletedStopIds([]); // Reset reached stops for the new shift's journey
  };

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

    currentShiftStops.forEach(st => {
      if (st.lat && st.lng && !completedStopIds.includes(st.id)) {
        const dist = calculateDistanceKm(currentLat, currentLng, st.lat, st.lng);
        if (dist <= 0.35) { // within 350m of stop
          setCompletedStopIds(prev => prev.includes(st.id) ? prev : [...prev, st.id]);
        }
      }
    });
  }, [driverTripActive, liveDriverGeo.latitude, liveDriverGeo.longitude, currentShiftStops, completedStopIds, calculateDistanceKm]);

  // Next stop calculation from uncompleted stops of the ACTIVE SHIFT
  const nextDriverStop = useMemo(() => {
    const uncompleted = currentShiftStops.filter(s => !completedStopIds.includes(s.id));
    if (uncompleted.length > 0) return uncompleted[0];
    return currentShiftStops[currentShiftStops.length - 1] || currentShiftStops[0];
  }, [currentShiftStops, completedStopIds]);

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

  // Dynamic progress percentage: 100% computed from real live location and stops of ACTIVE SHIFT
  const dynamicProgressPercent = useMemo(() => {
    if (!currentShiftStops || currentShiftStops.length === 0) return 0;
    return Math.round((completedStopIds.length / currentShiftStops.length) * 100);
  }, [completedStopIds, currentShiftStops]);

  // Master telemetry coordinates for Admin Fleet View
  const adminBusCoords = useMemo(() => {
    if (serverTelemetry && serverTelemetry.latitude && serverTelemetry.longitude) {
      return {
        lat: Number(serverTelemetry.latitude),
        lng: Number(serverTelemetry.longitude),
        speedKmh: Number(serverTelemetry.speedKmh || 0),
        heading: Number(serverTelemetry.heading || 0),
        accuracyMeters: Number(serverTelemetry.accuracyMeters || 4),
        isStreaming: isLivePhoneStreaming,
        lastUpdated: serverTelemetry.lastUpdatedText || 'Live Streaming'
      };
    }
    return {
      lat: liveDriverGeo.latitude || currentShiftStops[0]?.lat || 26.8378,
      lng: liveDriverGeo.longitude || currentShiftStops[0]?.lng || 80.8872,
      speedKmh: liveDriverGeo.speedKmh || 0,
      heading: liveDriverGeo.heading || 0,
      accuracyMeters: liveDriverGeo.accuracyMeters || 5,
      isStreaming: driverTripActive || isLivePhoneStreaming,
      lastUpdated: liveDriverGeo.lastUpdated || 'Standby'
    };
  }, [serverTelemetry, isLivePhoneStreaming, liveDriverGeo, driverTripActive, currentShiftStops]);

  // Filter students strictly assigned to this driver's bus route, filtered by active shift
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

    let pool = directMatches;
    if (pool.length === 0) {
      const transportStudents = students.filter((st: any) => st.bus_route || st.transport_opted || st.transport_stop);
      pool = transportStudents.length > 0 ? transportStudents.slice(0, 28) : students.slice(0, 24);
    }

    // Filter by shift:
    if (activeShift === 'AFTERNOON') {
      // Junior students drop shift (Nursery to 8th)
      const juniors = pool.filter((st: any) => {
        const cl = (st.class_name || st.class || '').toUpperCase();
        return !cl.includes('9') && !cl.includes('10') && !cl.includes('11') && !cl.includes('12');
      });
      if (juniors.length > 0) pool = juniors;
    } else if (activeShift === 'EVENING') {
      // Senior students drop shift (9th to 12th)
      const seniors = pool.filter((st: any) => {
        const cl = (st.class_name || st.class || '').toUpperCase();
        return cl.includes('9') || cl.includes('10') || cl.includes('11') || cl.includes('12');
      });
      if (seniors.length > 0) pool = seniors;
    }

    return pool.map((st: any, i) => ({
      id: st.id || `st-${i}`,
      name: st.name || `Student ${i + 1}`,
      class: st.class_name || st.class || 'Assigned',
      stop: st.transport_stop || currentShiftStops[i % currentShiftStops.length]?.name || 'Bus Stop',
      avatar: i % 2 === 0 ? '👦' : '👧',
      phone: st.parent_phone || st.phone || '+91 98765-43210'
    }));
  }, [students, activeRoute, activeShift, currentShiftStops]);

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
          
          {/* Left Column: Master Google Maps Console & Telemetry */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. ACTIVE BUS SHIFT SELECTOR BAR FOR ADMIN */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#DCE8E0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shrink-0 border border-[#C5E2CF]">
                  <Repeat className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#122A24] uppercase tracking-wider">
                      {activeRoute.code} &bull; Fleet Transit Shift
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono uppercase">
                      {ROUTE_SHIFTS_METADATA[activeShift].shortLabel}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#122A24] mt-0.5">
                    {ROUTE_SHIFTS_METADATA[activeShift].name} ({ROUTE_SHIFTS_METADATA[activeShift].timing})
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {ROUTE_SHIFTS_METADATA[activeShift].description}
                  </p>
                </div>
              </div>

              {/* 3 Shift Switcher Buttons */}
              <div className="flex items-center gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] self-start md:self-auto overflow-x-auto max-w-full">
                {(['MORNING', 'AFTERNOON', 'EVENING'] as ShiftType[]).map((shiftKey) => {
                  const shift = ROUTE_SHIFTS_METADATA[shiftKey];
                  const isActive = activeShift === shiftKey;
                  return (
                    <button
                      key={shiftKey}
                      type="button"
                      onClick={() => handleShiftChange(shiftKey)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-[#122A24] text-white shadow-sm ring-2 ring-emerald-500/40'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-white/80'
                      }`}
                      title={`Switch to ${shift.name}`}
                    >
                      <span>{shiftKey === 'MORNING' ? '🌅' : shiftKey === 'AFTERNOON' ? '☀️' : '🌙'}</span>
                      <span>{shiftKey === 'MORNING' ? 'Morning Pickup' : shiftKey === 'AFTERNOON' ? 'Afternoon Drop' : 'Evening Transit'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. MASTER GOOGLE MAPS FLEET RADAR CONSOLE (REPLACES SYNTHETIC SVG & OPENSTREETMAP) */}
            <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE8E0] shadow-sm space-y-4 transition-all ${
              isMapFullscreen ? 'fixed inset-0 z-50 rounded-none p-4 sm:p-6 bg-slate-900 border-none flex flex-col overflow-auto' : ''
            }`}>
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shrink-0 border border-[#C5E2CF]">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-base ${isMapFullscreen ? 'text-white' : 'text-[#122A24]'}`}>
                        {activeRoute.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#122A24] text-emerald-300 font-mono text-[10px] font-bold">
                        {activeRoute.code}
                      </span>
                      {activeRoute.substituteDriver && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Relief: {activeRoute.substituteDriver}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isMapFullscreen ? 'text-slate-300' : 'text-slate-500'}`}>
                      Vehicle: <strong className="font-mono">{activeRoute.vehicleNo}</strong> &bull; Driver: {activeRoute.driver} ({activeRoute.driverPhone})
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Streaming Status Pill */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                    adminBusCoords.isStreaming
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${adminBusCoords.isStreaming ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                    <span>{adminBusCoords.isStreaming ? 'LIVE GPS STREAMING' : 'GPS STANDBY'}</span>
                  </span>

                  {/* Refresh Telemetry */}
                  <button
                    type="button"
                    onClick={fetchTelemetry}
                    disabled={isRefreshingTelemetry}
                    className="p-2 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] transition-colors cursor-pointer"
                    title="Refresh GPS Telemetry"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingTelemetry ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>

                  {/* Map Size Buttons */}
                  <div className="hidden sm:flex items-center bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0] gap-0.5">
                    <button
                      type="button"
                      onClick={() => { setMapSize('STANDARD'); setIsMapFullscreen(false); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                        mapSize === 'STANDARD' && !isMapFullscreen
                          ? 'bg-[#122A24] text-white shadow-xs'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      540px
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMapSize('THEATER'); setIsMapFullscreen(false); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                        mapSize === 'THEATER' && !isMapFullscreen
                          ? 'bg-[#122A24] text-white shadow-xs'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      780px
                    </button>
                  </div>

                  {/* Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsMapFullscreen(prev => !prev)}
                    className="p-2 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] transition-colors cursor-pointer"
                    title={isMapFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
                  >
                    {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  {/* Launch Native Google Maps */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${adminBusCoords.lat},${adminBusCoords.lng}&destination=${currentShiftStops[currentShiftStops.length - 1]?.lat || 26.8520},${currentShiftStops[currentShiftStops.length - 1]?.lng || 80.9400}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center gap-1.5 no-underline shadow-xs cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* 4 Interactive Map Mode Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] text-xs">
                <button
                  type="button"
                  onClick={() => setGoogleMapMode('ROUTE_PATH')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                    googleMapMode === 'ROUTE_PATH'
                      ? 'bg-[#122A24] text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🗺️ Marked Driving Route
                </button>

                <button
                  type="button"
                  onClick={() => setGoogleMapMode('LIVE_PIN')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                    googleMapMode === 'LIVE_PIN'
                      ? 'bg-[#122A24] text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📍 Live Bus GPS Pin
                </button>

                <button
                  type="button"
                  onClick={() => setGoogleMapMode('LIVE_NAV')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                    googleMapMode === 'LIVE_NAV'
                      ? 'bg-[#122A24] text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎯 Nav to Current Stop ({nextDriverStop?.name?.replace('Stop', '').trim() || 'Next'})
                </button>

                <button
                  type="button"
                  onClick={() => setGoogleMapMode('RADAR_CANVAS')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                    googleMapMode === 'RADAR_CANVAS'
                      ? 'bg-[#122A24] text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🧭 Stops Radar Canvas
                </button>
              </div>

              {/* Embedded Google Maps Container */}
              <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-[#DCE8E0] shadow-inner transition-all duration-300 ${
                isMapFullscreen
                  ? 'flex-1 min-h-[400px]'
                  : mapSize === 'THEATER'
                  ? 'h-[720px] sm:h-[780px]'
                  : 'h-[480px] sm:h-[540px]'
              }`}>
                {/* Mode 1: Marked Route Path Directions */}
                {googleMapMode === 'ROUTE_PATH' && (
                  <iframe
                    src={`https://maps.google.com/maps?saddr=${currentShiftStops[0]?.lat || 26.8378},${currentShiftStops[0]?.lng || 80.8872}&daddr=${currentShiftStops[currentShiftStops.length - 1]?.lat || 26.8520},${currentShiftStops[currentShiftStops.length - 1]?.lng || 80.9400}&hl=en&z=13&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Marked Bus Route Directions on Google Maps"
                  />
                )}

                {/* Mode 2: Live Bus GPS Pin */}
                {googleMapMode === 'LIVE_PIN' && (
                  <iframe
                    src={`https://maps.google.com/maps?q=${adminBusCoords.lat},${adminBusCoords.lng}&hl=en&z=16&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Live Moving Bus Pin on Google Maps"
                  />
                )}

                {/* Mode 3: Navigation to Approaching Stop */}
                {googleMapMode === 'LIVE_NAV' && (
                  <iframe
                    src={`https://maps.google.com/maps?saddr=${adminBusCoords.lat},${adminBusCoords.lng}&daddr=${nextDriverStop?.lat || currentShiftStops[currentShiftStops.length - 1]?.lat || 26.8520},${nextDriverStop?.lng || currentShiftStops[currentShiftStops.length - 1]?.lng || 80.9400}&hl=en&z=14&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Live Navigation to Approaching Stop"
                  />
                )}

                {/* Mode 4: Radar Canvas */}
                {googleMapMode === 'RADAR_CANVAS' && (
                  <div className="w-full h-full bg-[#122A24] p-6 flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent opacity-80 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-bold text-emerald-300 font-mono uppercase tracking-wider">{activeRoute.code} &bull; {ROUTE_SHIFTS_METADATA[activeShift].shortLabel} Radar</span>
                      </div>
                      <span className="font-mono text-xs text-slate-300">{currentShiftStops.length} Stops &bull; Real-time GPS</span>
                    </div>

                    {/* Progress Track */}
                    <div className="relative z-10 my-auto py-8">
                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-2 bg-emerald-950 rounded-full border border-emerald-500/30 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-500"
                            style={{ width: `${Math.max(10, dynamicProgressPercent)}%` }}
                          />
                        </div>

                        {currentShiftStops.map((st, i) => {
                          const isPast = completedStopIds.includes(st.id);
                          const isCurrent = !isPast && nextDriverStop?.id === st.id;
                          return (
                            <div key={st.id} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shadow-md ${
                                  isPast
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                    ? 'bg-emerald-300 text-[#122A24] ring-4 ring-emerald-500/50 scale-125 font-black'
                                    : 'bg-[#1C443A] text-slate-300 border border-emerald-500/40'
                                }`}
                              >
                                {isPast ? '✓' : i + 1}
                              </div>
                              <span className={`text-[10.5px] font-bold mt-2 text-center max-w-[80px] truncate block ${
                                isCurrent ? 'text-emerald-300 font-extrabold' : 'text-slate-400'
                              }`}>
                                {st.name.replace('Stop', '').replace('(Drop Point)', '').replace('(Campus Gate)', '').replace('(Departure Point)', '').trim()}
                              </span>
                              <span className="text-[9.5px] font-mono text-slate-400">
                                {st.scheduledTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm font-mono bg-black/40 p-3.5 rounded-2xl border border-white/10">
                      <span className="text-slate-300">Approaching: <strong className="text-emerald-300">{nextDriverStop?.name}</strong></span>
                      <span className="text-emerald-400 font-bold">{liveDistanceToNextKm} km &bull; ~{dynamicEtaMinutes}m Dynamic ETA</span>
                    </div>
                  </div>
                )}

                {/* Floating Telemetry HUD over Google Maps */}
                <div className="absolute top-3 left-3 bg-[#122A24]/90 backdrop-blur-md text-white p-3 rounded-2xl border border-emerald-500/30 shadow-xl text-xs space-y-1.5 z-10 max-w-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{adminBusCoords.isStreaming ? 'Live Smartphone Telemetry' : 'Standby Telemetry'}</span>
                    </div>
                    <span className="font-mono text-[10.5px] text-slate-300">{adminBusCoords.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-200 flex-wrap">
                    <span>Lat: <strong>{adminBusCoords.lat.toFixed(4)}&deg;</strong></span>
                    <span>Lng: <strong>{adminBusCoords.lng.toFixed(4)}&deg;</strong></span>
                    <span className="text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      ⚡ {adminBusCoords.speedKmh} km/h
                    </span>
                    <span className="text-slate-400">&plusmn;{adminBusCoords.accuracyMeters}m</span>
                  </div>
                </div>
              </div>

              {/* 3. 4-Card Telemetry Dashboard (FUEL COMPLETELY REMOVED) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Card 1: Active Shift */}
                <div className="bg-[#F4F8F5] border border-[#DCE8E0] rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Active Shift</span>
                  </div>
                  <div className="text-base font-bold text-[#122A24] leading-tight line-clamp-1">
                    {ROUTE_SHIFTS_METADATA[activeShift].shortLabel}
                  </div>
                  <div className="text-[10.5px] text-emerald-700 font-mono font-bold">
                    {ROUTE_SHIFTS_METADATA[activeShift].timing}
                  </div>
                </div>

                {/* Card 2: Live Speed & Bearing */}
                <div className="bg-[#F4F8F5] border border-[#DCE8E0] rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Live Speed</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-[#122A24] leading-tight">
                    {adminBusCoords.speedKmh} <span className="text-xs font-normal text-slate-500">km/h</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 font-mono">
                    Bearing: {Math.round(adminBusCoords.heading)}&deg; NE
                  </div>
                </div>

                {/* Card 3: Route Stops Progress */}
                <div className="bg-[#F4F8F5] border border-[#DCE8E0] rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    <span>Shift Progress</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-[#122A24] leading-tight">
                    {dynamicProgressPercent}%
                  </div>
                  <div className="text-[10.5px] text-slate-500 font-mono">
                    {completedStopIds.length} of {currentShiftStops.length} stops reached
                  </div>
                </div>

                {/* Card 4: Vehicle & Driver Telemetry */}
                <div className="bg-[#F4F8F5] border border-[#DCE8E0] rounded-2xl p-3.5 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Vehicle &amp; Driver</span>
                  </div>
                  <div className="text-sm font-bold text-[#122A24] leading-tight line-clamp-1">
                    {activeRoute.vehicleNo}
                  </div>
                  <div className="text-[10.5px] text-slate-500 line-clamp-1">
                    {activeRoute.substituteDriver ? `Relief: ${activeRoute.substituteDriver}` : activeRoute.driver}
                  </div>
                </div>
              </div>

            </div>

            {/* 4. ROUTE STOPS SEQUENCE PROGRESSION (DYNAMIC BASED ON ACTIVE SHIFT) */}
            <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[#122A24] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>{ROUTE_SHIFTS_METADATA[activeShift].name} Progression &bull; {activeRoute.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {completedStopIds.length} of {currentShiftStops.length} stops reached &bull; Next: <strong className="text-[#122A24]">{nextDriverStop?.name}</strong> (~{dynamicEtaMinutes}m ETA)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCompletedStopIds([])}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border-none"
                    title="Reset stop sequence for this shift"
                  >
                    Reset Shift Stops
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {currentShiftStops.map((stop, sIdx) => {
                  const isPassed = completedStopIds.includes(stop.id);
                  const isCurrent = !isPassed && nextDriverStop?.id === stop.id;
                  const isFinalTerminus = sIdx === currentShiftStops.length - 1;

                  return (
                    <div
                      key={stop.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-[#EBF5EF] border-[#C5E2CF] shadow-sm ring-2 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-[#F4F8F5]/80 border-slate-200 opacity-80'
                          : 'bg-white border-[#DCE8E0]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                            isCurrent
                              ? 'bg-[#1C443A] text-white shadow-sm ring-4 ring-emerald-100'
                              : isPassed
                              ? 'bg-emerald-600 text-white'
                              : isFinalTerminus
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isFinalTerminus ? <Flag className="w-3 h-3 fill-rose-600" /> : sIdx + 1}
                        </div>

                        <div>
                          <div className="font-bold text-xs text-[#122A24] flex items-center gap-2">
                            <span className={isPassed ? 'line-through text-slate-500' : ''}>{stop.name}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                                BUS APPROACHING ({liveDistanceToNextKm} km)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Scheduled: <strong>{stop.scheduledTime}</strong> &bull; Distance: <strong>{stop.distanceKm} km</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        {isPassed ? (
                          <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Departed
                          </span>
                        ) : isCurrent ? (
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-800 text-xs font-bold font-mono bg-emerald-100 px-2 py-1 rounded-lg">
                              ETA: ~{dynamicEtaMinutes}m
                            </span>
                            <button
                              type="button"
                              onClick={() => setCompletedStopIds(prev => [...prev, stop.id])}
                              className="px-2.5 py-1 rounded-lg bg-[#122A24] hover:bg-[#1C443A] text-white text-[10px] font-bold cursor-pointer transition-colors border-none"
                            >
                              Mark Reached
                            </button>
                          </div>
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
                  const busTele = allTelemetries[r.id] || Object.values(allTelemetries).find((t: any) => t.vehicleNo === r.vehicleNo || t.routeId === r.id);
                  const isBusOnline = busTele?.isOnline || (r.id === selectedRouteId && (isLivePhoneStreaming || driverTripActive));

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedRouteId(r.id);
                        setCompletedStopIds([]);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-md ring-2 ring-emerald-500/40'
                          : 'bg-[#F4F8F5] text-[#122A24] border-[#DCE8E0] hover:bg-[#EBF5EF]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-xs">
                          {r.name}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isBusOnline ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono bg-emerald-500 text-white animate-pulse">
                              LIVE
                            </span>
                          ) : (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono ${isSelected ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                              STANDBY
                            </span>
                          )}
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
                      </div>

                      <div className={`text-[11px] mt-1.5 flex items-center justify-between ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span>Driver: {r.substituteDriver ? `Relief: ${r.substituteDriver}` : r.driver}</span>
                        <span className="font-mono">{r.vehicleNo}</span>
                      </div>

                      <div className={`text-[10px] mt-1 flex items-center justify-between ${isSelected ? 'text-emerald-300' : 'text-emerald-700 font-semibold'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isBusOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{r.stops.length} Stops &bull; {r.capacity}</span>
                        </div>
                        <span className="font-mono text-[9.5px] opacity-80">
                          {ROUTE_SHIFTS_METADATA[activeShift].shortLabel}
                        </span>
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

          {/* 1.5. ACTIVE BUS SHIFT & SCHEDULE SELECTOR */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#DCE8E0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shrink-0 border border-[#C5E2CF]">
                <Repeat className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#122A24] uppercase tracking-wider">
                    {activeRoute.code} &bull; Multi-Shift Transit
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono uppercase">
                    {ROUTE_SHIFTS_METADATA[activeShift].shortLabel}
                  </span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#122A24] mt-0.5">
                  {ROUTE_SHIFTS_METADATA[activeShift].name} ({ROUTE_SHIFTS_METADATA[activeShift].timing})
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {ROUTE_SHIFTS_METADATA[activeShift].description}
                </p>
              </div>
            </div>

            {/* 3 Shift Switcher Buttons */}
            <div className="flex items-center gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] self-start md:self-auto overflow-x-auto max-w-full">
              {(['MORNING', 'AFTERNOON', 'EVENING'] as ShiftType[]).map((shiftKey) => {
                const shift = ROUTE_SHIFTS_METADATA[shiftKey];
                const isActive = activeShift === shiftKey;
                return (
                  <button
                    key={shiftKey}
                    type="button"
                    onClick={() => handleShiftChange(shiftKey)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#122A24] text-white shadow-sm ring-2 ring-emerald-500/40'
                        : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-white/80'
                    }`}
                    title={`Switch to ${shift.name}`}
                  >
                    <span>{shiftKey === 'MORNING' ? '🌅' : shiftKey === 'AFTERNOON' ? '☀️' : '🌙'}</span>
                    <span>{shiftKey === 'MORNING' ? 'Morning Pickup' : shiftKey === 'AFTERNOON' ? 'Afternoon Drop' : 'Evening Transit'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. TOP 4 METRIC CARDS ROW / GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: Route & Shift */}
            <div className="bg-white border border-[#DCE8E0] rounded-3xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C5E2CF] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center shadow-sm">
                  <Bus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase font-mono">
                  {ROUTE_SHIFTS_METADATA[activeShift].shortLabel}
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-[#122A24] text-sm leading-tight line-clamp-1">
                  {ROUTE_SHIFTS_METADATA[activeShift].name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium font-mono">
                  {ROUTE_SHIFTS_METADATA[activeShift].timing}
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
                  {activeShift} Sequence
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-medium">Shift Stops</p>
                <p className="text-2xl sm:text-3xl font-black text-[#122A24] tracking-tight leading-none">
                  {currentShiftStops.length}
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-600 flex items-center gap-2">
                <span>Reached: <strong className="text-emerald-700 font-bold">{completedStopIds.length}</strong></span>
                <span>&bull;</span>
                <span>Pending: <strong className="text-slate-600 font-bold">{Math.max(0, currentShiftStops.length - completedStopIds.length)}</strong></span>
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

          {/* 3. HERO FULL-WIDTH LIVE GOOGLE MAP & MARKED ROUTE RADAR */}
          <div className={`bg-white rounded-3xl p-4 sm:p-6 border border-[#DCE8E0] shadow-md space-y-4 transition-all duration-300 ${
            isMapFullscreen ? 'fixed inset-0 z-[100] rounded-none p-3 sm:p-5 flex flex-col h-screen w-screen bg-[#0A1814] text-white overflow-hidden border-none' : ''
          }`}>
            {/* Header: Title + Modes + Size Controls + Native Maps Launcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center font-bold">
                  <Navigation className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-base sm:text-lg leading-tight ${isMapFullscreen ? 'text-white' : 'text-[#122A24]'}`}>
                      Live Google Maps &amp; Route Navigation
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live GPS
                    </span>
                  </div>
                  <p className={`text-xs ${isMapFullscreen ? 'text-slate-300' : 'text-slate-500'}`}>
                    Active Route: <strong className={isMapFullscreen ? 'text-emerald-400' : 'text-[#122A24]'}>{activeRoute.code} &bull; {activeRoute.name}</strong>
                  </p>
                </div>
              </div>

              {/* Map Size Controls & Fullscreen Launcher */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Size Presets (When not in fullscreen) */}
                {!isMapFullscreen && (
                  <div className="flex items-center bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0] text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setMapSize('STANDARD')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none ${
                        mapSize === 'STANDARD' ? 'bg-[#122A24] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                      }`}
                      title="Standard View (580px)"
                    >
                      580px
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapSize('LARGE')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none ${
                        mapSize === 'LARGE' ? 'bg-[#122A24] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                      }`}
                      title="Large View (750px)"
                    >
                      750px (Large)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapSize('THEATER')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none ${
                        mapSize === 'THEATER' ? 'bg-[#122A24] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                      }`}
                      title="Theater View (900px)"
                    >
                      900px (Max)
                    </button>
                  </div>
                )}

                {/* Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMapFullscreen(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    isMapFullscreen
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-none'
                      : 'bg-[#122A24] hover:bg-[#1C443A] text-white border-none'
                  }`}
                  title={isMapFullscreen ? 'Exit Fullscreen Mode' : 'Expand to Fullscreen Map'}
                >
                  {isMapFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Fullscreen Map</span>
                    </>
                  )}
                </button>

                {/* Native App Launcher */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${liveDriverGeo.latitude},${liveDriverGeo.longitude}&destination=${nextDriverStop?.lat || currentShiftStops[currentShiftStops.length - 1]?.lat || 26.8520},${nextDriverStop?.lng || currentShiftStops[currentShiftStops.length - 1]?.lng || 80.9400}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 bg-[#EBF5EF] hover:bg-[#D8EEDF] px-3 py-1.5 rounded-xl border border-[#C5E2CF] no-underline transition-all shadow-xs"
                  title="Launch Google Maps App with Turn-by-Turn Voice Navigation"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Google Maps App</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* 4 Interactive Map Mode Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] text-xs">
              <button
                type="button"
                onClick={() => setGoogleMapMode('ROUTE_PATH')}
                className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                  googleMapMode === 'ROUTE_PATH'
                    ? 'bg-[#122A24] text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                🗺️ Marked Driving Route
              </button>

              <button
                type="button"
                onClick={() => setGoogleMapMode('LIVE_NAV')}
                className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                  googleMapMode === 'LIVE_NAV'
                    ? 'bg-[#122A24] text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                🎯 Nav to Next Stop ({nextDriverStop?.name || 'School'})
              </button>

              <button
                type="button"
                onClick={() => setGoogleMapMode('LIVE_PIN')}
                className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                  googleMapMode === 'LIVE_PIN'
                    ? 'bg-[#122A24] text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                📍 Live Moving Bus Pin
              </button>

              <button
                type="button"
                onClick={() => setGoogleMapMode('RADAR_CANVAS')}
                className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border-none text-center ${
                  googleMapMode === 'RADAR_CANVAS'
                    ? 'bg-[#122A24] text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                🧭 Stops Radar Canvas
              </button>
            </div>

            {/* MASSIVE EMBEDDED MAP CONTAINER (DOUBLED/TRIPLED HEIGHT + FULLSCREEN CAPABILITY) */}
            <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-[#DCE8E0] shadow-inner transition-all duration-300 ${
              isMapFullscreen
                ? 'flex-1 min-h-[400px]'
                : mapSize === 'STANDARD'
                ? 'h-[520px] sm:h-[580px]'
                : mapSize === 'THEATER'
                ? 'h-[820px] sm:h-[900px]'
                : 'h-[660px] sm:h-[750px]'
            }`}>
              {/* Mode 1: Marked Route Driving Directions with exact start & end coordinates */}
              {googleMapMode === 'ROUTE_PATH' && (
                <iframe
                  src={`https://maps.google.com/maps?saddr=${currentShiftStops[0]?.lat || 26.8378},${currentShiftStops[0]?.lng || 80.8872}&daddr=${currentShiftStops[currentShiftStops.length - 1]?.lat || 26.8520},${currentShiftStops[currentShiftStops.length - 1]?.lng || 80.9400}&hl=en&z=13&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  title="Assigned Bus Route Driving Directions on Google Maps"
                />
              )}

              {/* Mode 2: Live Navigation from Driver's Phone to Approaching Next Stop */}
              {googleMapMode === 'LIVE_NAV' && (
                <iframe
                  src={`https://maps.google.com/maps?saddr=${liveDriverGeo.latitude},${liveDriverGeo.longitude}&daddr=${nextDriverStop?.lat || currentShiftStops[currentShiftStops.length - 1]?.lat || 26.8520},${nextDriverStop?.lng || currentShiftStops[currentShiftStops.length - 1]?.lng || 80.9400}&hl=en&z=14&output=embed`}
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
                <div className="w-full h-full bg-[#122A24] p-6 flex flex-col justify-between relative overflow-hidden text-white">
                  {/* Subtle radar sweep grid background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent opacity-80 pointer-events-none" />

                  {/* Header radar status */}
                  <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-emerald-300 font-mono uppercase tracking-wider">{activeRoute.code} &bull; {ROUTE_SHIFTS_METADATA[activeShift].shortLabel} Radar</span>
                    </div>
                    <span className="font-mono text-xs text-slate-300">{currentShiftStops.length} Stops Marked &bull; Live Telemetry</span>
                  </div>

                  {/* Route Path Track Visualization */}
                  <div className="relative z-10 my-auto py-8">
                    <div className="relative flex items-center justify-between">
                      {/* Connecting track line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-2 bg-emerald-950 rounded-full border border-emerald-500/30 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-500"
                          style={{ width: `${Math.max(10, dynamicProgressPercent)}%` }}
                        />
                      </div>

                      {/* Stops Pointers */}
                      {currentShiftStops.map((st, i) => {
                        const isPast = completedStopIds.includes(st.id);
                        const isCurrent = !isPast && nextDriverStop.id === st.id;
                        return (
                          <div key={st.id} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shadow-md ${
                                isPast
                                  ? 'bg-emerald-500 text-white'
                                  : isCurrent
                                  ? 'bg-emerald-300 text-[#122A24] ring-4 ring-emerald-500/50 scale-125 font-black'
                                  : 'bg-[#1C443A] text-slate-300 border border-emerald-500/40'
                              }`}
                            >
                              {isPast ? '✓' : i + 1}
                            </div>
                            <span className={`text-[10.5px] font-bold mt-2 text-center max-w-[80px] truncate block ${
                              isCurrent ? 'text-emerald-300 font-extrabold' : 'text-slate-400'
                            }`}>
                              {st.name.replace('Stop', '').replace('(Drop Point)', '').replace('(Campus Gate)', '').replace('(Departure Point)', '').trim()}
                            </span>
                            <span className="text-[9.5px] font-mono text-slate-400">
                              {st.scheduledTime}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Radar Footer Info */}
                  <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm font-mono bg-black/40 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-slate-300">Approaching: <strong className="text-emerald-300">{nextDriverStop?.name}</strong></span>
                    <span className="text-emerald-400 font-bold">{liveDistanceToNextKm} km &bull; {dynamicEtaMinutes}m Dynamic ETA</span>
                  </div>
                </div>
              )}

              {/* FLOATING MOBILE LIVE TELEMETRY STATUS HUD OVER GOOGLE MAP */}
              <div className="absolute top-4 left-4 right-4 sm:right-auto z-10 bg-[#122A24]/90 backdrop-blur-md text-white p-3 rounded-2xl border border-emerald-500/30 shadow-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile GPS: {driverTripActive ? 'Streaming Live' : 'Hardware Ready'}</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-slate-300">{liveDriverGeo.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-3.5 text-xs font-mono text-slate-200 flex-wrap">
                  <span>Lat: <strong>{liveDriverGeo.latitude.toFixed(4)}&deg;</strong></span>
                  <span>Lng: <strong>{liveDriverGeo.longitude.toFixed(4)}&deg;</strong></span>
                  <span className="text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    ⚡ {liveDriverGeo.speedKmh} km/h
                  </span>
                  <span className="text-slate-400">&plusmn;{liveDriverGeo.accuracyMeters}m</span>
                </div>
              </div>

              {/* Center GPS Crosshair Button */}
              <button
                type="button"
                onClick={readAndTransmitLivePosition}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white shadow-xl border border-slate-300 text-[#122A24] flex items-center justify-center hover:bg-[#EBF5EF] transition-all cursor-pointer z-10 hover:scale-105"
                title="Center My Live GPS Position"
              >
                <LocateFixed className="w-6 h-6 text-[#1C443A]" />
              </button>
            </div>

            {/* GPS Transmitter Action Button & Next Stop Glance */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-8">
                {!driverTripActive ? (
                  <button
                    type="button"
                    onClick={startDriverTrip}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>START GPS TRIP (TRANSMIT LIVE LOCATION)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopDriverTrip}
                    className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>END TRIP &bull; STOP TRANSMITTING GPS</span>
                  </button>
                )}
                <p className={`text-[11px] text-center font-medium mt-1 ${isMapFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
                  {gpsStatusMessage}
                </p>
              </div>

              <div className={`sm:col-span-4 p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                isMapFullscreen ? 'bg-[#122A24] border-emerald-800 text-white' : 'bg-[#F4F8F5] border-[#DCE8E0]'
              }`}>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Next Stop</span>
                  <span className="font-bold text-xs sm:text-sm truncate block max-w-[140px]">{nextDriverStop?.name || 'School'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">{liveDistanceToNextKm} km</span>
                  <span className="font-black text-emerald-600 font-mono text-sm sm:text-base">
                    {liveDistanceToNextKm <= 0.25 ? 'ARRIVED' : `${dynamicEtaMinutes}m`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. MAIN DASHBOARD CONTENT (2 COLUMNS) */}
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
                    <span>{completedStopIds.length} of {currentShiftStops.length} stops reached</span>
                    <span>{Math.max(0, currentShiftStops.length - completedStopIds.length)} stops remaining</span>
                  </div>
                </div>

                {/* Notice: Stops Fixed by Transport Incharge */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#1C443A] text-xs font-semibold">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{ROUTE_SHIFTS_METADATA[activeShift].name} Sequence (Fixed by Incharge)</span>
                </div>

                {/* STOPS VERTICAL TIMELINE (READ-ONLY FOR DRIVER) */}
                <div className="pt-2 space-y-3 relative before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[#DCE8E0]">
                  {currentShiftStops.map((st, idx) => {
                    const isCompleted = completedStopIds.includes(st.id);
                    const isCurrent = !isCompleted && nextDriverStop.id === st.id;
                    const isFinalDropPoint = idx === currentShiftStops.length - 1;

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
                          ) : isFinalDropPoint ? (
                            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                              <Flag className="w-3.5 h-3.5 fill-rose-600" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0" />
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold leading-tight ${
                                isCurrent ? 'text-[#1C443A]' : isCompleted ? 'text-slate-500 line-through' : isFinalDropPoint ? 'text-rose-700' : 'text-slate-800'
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
                              {isFinalDropPoint ? (activeShift === 'MORNING' ? 'School Campus Main Arrival' : 'Shift Final Drop Terminus') : idx === 0 && activeShift !== 'MORNING' ? 'Campus Departure Gate' : `Stop #${idx + 1}`}
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
                              type="button"
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
                  Quick Operations
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Action 1: Refresh Status */}
                  <button
                    type="button"
                    onClick={readAndTransmitLivePosition}
                    className="p-3.5 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] border border-[#DCE8E0] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:rotate-180 transition-transform">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Refresh GPS
                    </span>
                  </button>

                  {/* Action 2: Report Traffic Jam */}
                  <button
                    type="button"
                    onClick={() => setShowReportIssueModal(true)}
                    className="p-3.5 rounded-2xl bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FEF3C7] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Report Traffic
                    </span>
                  </button>

                  {/* Action 3: Driver Absence / Relief */}
                  <button
                    type="button"
                    onClick={() => setShowAbsenceModal(true)}
                    className="p-3.5 rounded-2xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FEE2E2] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserX className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
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
                    type="button"
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

            {/* ────── RIGHT COLUMN: NEXT STOP CARD & TODAY'S SCHEDULE ────── */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              
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
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    View Details
                  </button>
                </div>

                {/* Schedule Timeline Items */}
                <div className="space-y-2.5 pt-1">
                  {(['MORNING', 'AFTERNOON', 'EVENING'] as ShiftType[]).map((shiftKey) => {
                    const shift = ROUTE_SHIFTS_METADATA[shiftKey];
                    const isActive = activeShift === shiftKey;
                    return (
                      <button
                        key={shiftKey}
                        type="button"
                        onClick={() => handleShiftChange(shiftKey)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isActive
                            ? 'bg-[#EBF5EF] border-[#C5E2CF] shadow-xs'
                            : 'bg-white hover:bg-[#F4F8F5] border-[#DCE8E0]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {shiftKey === 'MORNING' ? <Play className="w-3.5 h-3.5 fill-current" /> : shiftKey === 'AFTERNOON' ? <Bus className="w-3.5 h-3.5" /> : <Square className="w-3 h-3 fill-current" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold truncate ${isActive ? 'text-[#122A24]' : 'text-slate-800'}`}>
                              {shift.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold uppercase">
                                  Active
                                </span>
                              )}
                              <span className={`text-[11px] font-mono font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {shift.timing}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                            {shift.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
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

                <div className="space-y-3">
                  {(['MORNING', 'AFTERNOON', 'EVENING'] as ShiftType[]).map((shiftKey) => {
                    const shift = ROUTE_SHIFTS_METADATA[shiftKey];
                    const isActive = activeShift === shiftKey;
                    return (
                      <div
                        key={shiftKey}
                        className={`p-4 rounded-2xl border transition-all space-y-2 ${
                          isActive
                            ? 'bg-[#EBF5EF] border-[#C5E2CF] shadow-xs'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#122A24] uppercase">
                              {shift.name}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-extrabold uppercase">
                                Active Shift
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-mono font-bold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {shift.timing}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {shift.description}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            {shiftKey === 'MORNING' ? 'Pickup Roster (All Classes)' : shiftKey === 'AFTERNOON' ? 'Junior Drop Roster (Nursery-8th)' : 'Senior Express Roster (9th-12th)'}
                          </span>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                handleShiftChange(shiftKey);
                                setShowScheduleModal(false);
                              }}
                              className="px-3 py-1 rounded-lg bg-[#122A24] hover:bg-[#1C443A] text-white text-[11px] font-bold cursor-pointer border-none"
                            >
                              Switch to this Shift
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
