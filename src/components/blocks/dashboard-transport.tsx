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
  Home
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

  // Actively fetch real smartphone GPS even when stationary
  const readAndTransmitLivePosition = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatusMessage('Geolocation not supported in this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
        const newGeo = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          speedKmh: speedKmh,
          heading: pos.coords.heading || 0,
          accuracyMeters: Math.round(pos.coords.accuracy || 3),
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setLiveDriverGeo(newGeo);
        setGpsStatusMessage(`🟢 Streaming live GPS: ${newGeo.latitude}, ${newGeo.longitude}`);
        broadcastTelemetry(newGeo, true);
      },
      (err) => {
        if (err.code === 1) {
          setGpsStatusMessage('❌ Location permission denied. Please allow location in browser.');
        } else {
          setGpsStatusMessage(`Searching GPS satellite signal... (${err.message})`);
        }
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const startDriverTrip = () => {
    setDriverTripActive(true);
    setGpsStatusMessage('Connecting to smartphone GPS sensor...');

    // 1. Fetch immediately
    readAndTransmitLivePosition();

    // 2. Continuous interval every 2 seconds so stationary phone streams live coordinates
    const intervalId = setInterval(readAndTransmitLivePosition, 2000);
    setGpsPollTimer(intervalId);

    // 3. Native watch position for movement tracking
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
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
          { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
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
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [isDriverUser]);

  // ─────────────────────────────────────────────────────────────
  // MODERN DRIVER MOBILE APP STATE (Matching Reference Screenshot)
  // ─────────────────────────────────────────────────────────────
  const [driverActiveTab, setDriverActiveTab] = useState<'dashboard' | 'trips' | 'students' | 'messages' | 'more'>('dashboard');
  const [driverFuelLevel, setDriverFuelLevel] = useState<number>(72);
  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState<boolean>(false);
  const [showFuelModal, setShowFuelModal] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [issueType, setIssueType] = useState<string>('Heavy Traffic Jam (+15m)');
  const [issueNotes, setIssueNotes] = useState<string>('');
  const [fuelInput, setFuelInput] = useState<number>(72);
  const [fuelLiters, setFuelLiters] = useState<string>('45');
  const [fuelOdometer, setFuelOdometer] = useState<string>('14,280 km');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3);
  const [currentDriverStopIndex, setCurrentDriverStopIndex] = useState<number>(4); // Stop 5: Sunrise Villa (0-indexed 4)
  const [driverStudentSearch, setDriverStudentSearch] = useState<string>('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PICKED' | 'PENDING' | 'DROPPED'>('ALL');

  const [driverStudents, setDriverStudents] = useState([
    { id: 'st-1', name: 'Aarav Sharma', class: 'Class 5-A', stop: 'Green Park Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43211' },
    { id: 'st-2', name: 'Ananya Verma', class: 'Class 4-B', stop: 'Green Park Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43212' },
    { id: 'st-3', name: 'Vihaan Gupta', class: 'Class 6-A', stop: 'Sector 62 Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43213' },
    { id: 'st-4', name: 'Sara Ali', class: 'Class 3-A', stop: 'Sector 62 Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43214' },
    { id: 'st-5', name: 'Reyansh Joshi', class: 'Class 7-B', stop: 'City Center Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43215' },
    { id: 'st-6', name: 'Myra Khan', class: 'Class 2-C', stop: 'City Center Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43216' },
    { id: 'st-7', name: 'Advik Patel', class: 'Class 8-A', stop: 'River Side Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43217' },
    { id: 'st-8', name: 'Ishita Sen', class: 'Class 5-B', stop: 'River Side Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43218' },
    { id: 'st-9', name: 'Kabir Das', class: 'Class 4-A', stop: 'River Side Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43219' },
    { id: 'st-10', name: 'Diya Reddy', class: 'Class 1-A', stop: 'Green Park Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43220' },
    { id: 'st-11', name: 'Aryan Mehta', class: 'Class 9-B', stop: 'Sector 62 Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43221' },
    { id: 'st-12', name: 'Riya Chopra', class: 'Class 6-B', stop: 'Sector 62 Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43222' },
    { id: 'st-13', name: 'Atharv Saxena', class: 'Class 3-B', stop: 'City Center Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43223' },
    { id: 'st-14', name: 'Saanvi Nair', class: 'Class 5-C', stop: 'City Center Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43224' },
    { id: 'st-15', name: 'Devansh Tiwari', class: 'Class 8-C', stop: 'River Side Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43225' },
    { id: 'st-16', name: 'Avni Yadav', class: 'Class 4-C', stop: 'Green Park Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43226' },
    { id: 'st-17', name: 'Arjun Kapoor', class: 'Class 7-A', stop: 'Sector 62 Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43227' },
    { id: 'st-18', name: 'Pari Bhatia', class: 'Class 2-A', stop: 'City Center Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43228' },
    { id: 'st-19', name: 'Rudra Singh', class: 'Class 6-C', stop: 'River Side Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43229' },
    { id: 'st-20', name: 'Kavya Malhotra', class: 'Class 5-A', stop: 'Green Park Stop', status: 'PICKED', avatar: '👧', phone: '+91 98765 43230' },
    { id: 'st-21', name: 'Tanmay Jain', class: 'Class 3-C', stop: 'Sector 62 Stop', status: 'PICKED', avatar: '👦', phone: '+91 98765 43231' },
    // 7 Pending / Left
    { id: 'st-22', name: 'Prisha Agarwal', class: 'Class 4-A', stop: 'Sunrise Villa Stop', status: 'PENDING', avatar: '👧', phone: '+91 98765 43232' },
    { id: 'st-23', name: 'Shaurya Chauhan', class: 'Class 8-B', stop: 'Sunrise Villa Stop', status: 'PENDING', avatar: '👦', phone: '+91 98765 43233' },
    { id: 'st-24', name: 'Anvi Saxena', class: 'Class 1-B', stop: 'Park View Stop', status: 'PENDING', avatar: '👧', phone: '+91 98765 43234' },
    { id: 'st-25', name: 'Yashwardhan Roy', class: 'Class 7-C', stop: 'Park View Stop', status: 'PENDING', avatar: '👦', phone: '+91 98765 43235' },
    { id: 'st-26', name: 'Navya Singhal', class: 'Class 6-A', stop: 'Shanti Nagar Stop', status: 'PENDING', avatar: '👧', phone: '+91 98765 43236' },
    { id: 'st-27', name: 'Harshvardhan Rao', class: 'Class 9-A', stop: 'Shanti Nagar Stop', status: 'PENDING', avatar: '👦', phone: '+91 98765 43237' },
    { id: 'st-28', name: 'Meera Nambiar', class: 'Class 5-B', stop: 'Green Park Stop', status: 'ABSENT', avatar: '👧', phone: '+91 98765 43238' },
  ]);

  const driverGreeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning,';
    if (hr < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const driverTotalStudents = driverStudents.length;
  const driverPickedCount = useMemo(() => driverStudents.filter(s => s.status === 'PICKED').length, [driverStudents]);
  const driverDroppedCount = useMemo(() => driverStudents.filter(s => s.status === 'DROPPED').length, [driverStudents]);
  const driverLeftCount = useMemo(() => driverStudents.filter(s => s.status === 'PENDING' || s.status === 'ABSENT').length, [driverStudents]);

  const driverStopsTimeline = [
    { id: 'ds-1', name: 'Green Park Stop', time: '07:15 AM', type: 'STOP' },
    { id: 'ds-2', name: 'Sector 62 Stop', time: '07:22 AM', type: 'STOP' },
    { id: 'ds-3', name: 'City Center Stop', time: '07:30 AM', type: 'STOP' },
    { id: 'ds-4', name: 'River Side Stop', time: '07:38 AM', type: 'STOP' },
    { id: 'ds-5', name: 'Sunrise Villa Stop', time: '07:45 AM', type: 'STOP', address: '2nd Cross Road, Sunrise Villa' },
    { id: 'ds-6', name: 'Park View Stop', time: '07:53 AM', type: 'STOP' },
    { id: 'ds-7', name: 'Shanti Nagar Stop', time: '08:02 AM', type: 'STOP' },
    { id: 'ds-8', name: 'Anand School', time: '08:20 AM', type: 'DROP' },
  ];

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
          MODE 3: MODERN DRIVER SMARTPHONE APP (SCREENSHOT REFERENCE)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'DRIVER' && (
        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-fade-in font-sans pb-12">
          
          {/* 1. TOP DRIVER BAR */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <button 
                onClick={() => setShowNotificationModal(true)}
                className="p-2 rounded-2xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer border-none bg-transparent"
                title="Driver Menu"
              >
                <Menu className="w-6 h-6 text-slate-800" />
              </button>

              {/* Driver Avatar (Stylized Cap & Uniform from Screenshot) */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1E3A8A] flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="50" fill="#E2E8F0" />
                  <path d="M20 95 C20 70, 35 65, 50 65 C65 65, 80 70, 80 95 Z" fill="#1E3A8A" />
                  <path d="M45 65 L50 78 L55 65 Z" fill="#F8FAFC" />
                  <path d="M48 72 L50 85 L52 72 Z" fill="#F59E0B" />
                  <rect x="44" y="55" width="12" height="12" rx="4" fill="#F6C8A6" />
                  <ellipse cx="50" cy="46" rx="16" ry="18" fill="#F6C8A6" />
                  <path d="M40 52 C45 49, 48 53, 50 51 C52 53, 55 49, 60 52 C57 56, 43 56, 40 52 Z" fill="#1E293B" />
                  <circle cx="43" cy="43" r="2" fill="#0F172A" />
                  <circle cx="57" cy="43" r="2" fill="#0F172A" />
                  <path d="M40 39 Q43 37 46 39" stroke="#0F172A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M54 39 Q57 37 60 39" stroke="#0F172A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M30 35 C30 20, 70 20, 70 35 Z" fill="#1E3A8A" />
                  <path d="M26 35 C35 32, 65 32, 74 35 C70 41, 30 41, 26 35 Z" fill="#0F172A" />
                  <ellipse cx="50" cy="29" rx="4" ry="4" fill="#F59E0B" />
                  <polygon points="50,26 52,31 48,31" fill="#FDE047" />
                </svg>
              </div>

              {/* Greeting & Driver Details */}
              <div>
                <p className="text-xs text-slate-500 font-medium leading-none">
                  {driverGreeting}
                </p>
                <h1 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-tight mt-0.5 flex items-center gap-1.5">
                  <span>{driverDisplayName}</span>
                  <span>👋</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Driver &bull; <strong className="text-slate-700">{driverVehicleNo}</strong>
                </p>
              </div>
            </div>

            {/* Top Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="w-11 h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 transition-colors cursor-pointer relative"
                title="Notifications"
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

          {/* 2. TOP 4 METRIC CARDS ROW / GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: Route & Status */}
            <div className="bg-[#F0F5FF] border border-[#D9E6FE] rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center shadow-sm">
                  <Bus className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm leading-tight">
                  {activeRoute.name || 'Route 04 Morning'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  07:15 AM – 08:20 AM
                </p>
              </div>
              <div className="mt-3">
                {driverTripActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[11px] font-semibold">
                    Ready to Start
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Students */}
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-medium">Students</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {driverTotalStudents}
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-600 flex items-center gap-2">
                <span>Picked: <strong className="text-emerald-600">{driverPickedCount}</strong></span>
                <span>&bull;</span>
                <span>Left: <strong className="text-amber-600">{driverLeftCount}</strong></span>
              </div>
            </div>

            {/* Card 3: Stops */}
            <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-medium">Stops</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  12
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-600 flex items-center gap-2">
                <span>Done: <strong className="text-emerald-600">7</strong></span>
                <span>&bull;</span>
                <span>Pending: <strong className="text-amber-600">5</strong></span>
              </div>
            </div>

            {/* Card 4: Fuel Level */}
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shadow-sm">
                  <Fuel className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-medium">Fuel Level</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {driverFuelLevel}%
                </p>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Good
                </span>
              </div>
            </div>

          </div>

          {/* 3. TWO-COLUMN MIDDLE SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            
            {/* ────── LEFT COLUMN: TRIP PROGRESS & QUICK ACTIONS ────── */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              
              {/* CURRENT TRIP PROGRESS CARD */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">
                    Current Trip Progress
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    View Route
                  </button>
                </div>

                {/* Subtitle & Route Path */}
                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    Route 04 - Morning
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Green Park &rarr; Anand School
                  </p>
                </div>

                {/* Progress Bar with Stops Completed */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: '58%' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>7 / 12 Stops Completed</span>
                    <span className="font-mono text-emerald-600 font-bold">58%</span>
                  </div>
                </div>

                {/* Vertical Stops Timeline */}
                <div className="pt-2 space-y-3 relative before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {driverStopsTimeline.map((st, idx) => {
                    const isCompleted = idx < 4;
                    const isCurrent = idx === 4;
                    const isUpcoming = idx > 4 && idx < 7;
                    const isDropPoint = idx === 7;

                    return (
                      <div key={st.id} className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex items-start gap-2.5">
                          {isCompleted && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          {isCurrent && (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-blue-100">
                              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            </div>
                          )}

                          {isUpcoming && (
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0" />
                          )}

                          {isDropPoint && (
                            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                              <Flag className="w-3.5 h-3.5 fill-rose-600" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold leading-tight ${
                                isCurrent ? 'text-blue-600' : isDropPoint ? 'text-rose-600' : 'text-slate-800'
                              }`}>
                                {st.name}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase">
                                  Current
                                </span>
                              )}
                            </div>
                            {isDropPoint && (
                              <span className="text-[11px] text-slate-400 font-medium block">Drop Point</span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-mono text-slate-500 font-semibold shrink-0">
                          {st.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QUICK ACTIONS CARD */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-bold text-base text-slate-900">
                  Quick Actions
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Action 1: Mark Attendance */}
                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="p-3.5 rounded-2xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#DCFCE7] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
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
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Report Issue
                    </span>
                  </button>

                  {/* Action 3: Call School */}
                  <a
                    href="tel:+915222610000"
                    className="p-3.5 rounded-2xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer no-underline group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Call School
                    </span>
                  </a>

                  {/* Action 4: Call Transport Incharge */}
                  <a
                    href="tel:+919876543210"
                    className="p-3.5 rounded-2xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#F3E8FF] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer no-underline group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Call Transport Incharge
                    </span>
                  </a>

                  {/* Action 5: Fuel Log */}
                  <button
                    onClick={() => setShowFuelModal(true)}
                    className="p-3.5 rounded-2xl bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FEF3C7] text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Fuel className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Fuel Log
                    </span>
                  </button>

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

            {/* ────── RIGHT COLUMN: LIVE TRACKING, NEXT STOP, SCHEDULE ────── */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              
              {/* LIVE TRACKING MAP CARD */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">
                    Live Tracking
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Vector Map Graphic Canvas */}
                <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#E2E8F0] border border-slate-200/80 shadow-inner">
                  <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
                    {/* Map Base Background */}
                    <rect width="400" height="300" fill="#EDF2F7" />

                    {/* Green Park Patch */}
                    <path d="M 280,30 C 320,20 370,40 380,80 C 370,120 330,130 290,100 Z" fill="#DCFCE7" />
                    <path d="M 30,160 C 50,140 90,150 100,190 C 80,220 40,210 30,180 Z" fill="#DCFCE7" />

                    {/* City Road Network Grid */}
                    <path d="M 0,90 L 400,120" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 0,210 L 400,190" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 120,0 L 90,300" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 270,0 L 310,300" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 200,0 L 230,300" stroke="#E2E8F0" strokeWidth="4" />
                    <path d="M 0,160 L 400,150" stroke="#E2E8F0" strokeWidth="4" />

                    {/* Blue Active Route Track */}
                    <path
                      d="M 345,65 Q 280,75 250,110 T 170,140 T 120,210 T 220,240 T 315,195"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="none"
                    />

                    {/* Route Stops Markers */}
                    {/* Stop 1: Green Park */}
                    <circle cx="345" cy="65" r="8" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="345" cy="65" r="3" fill="#FFFFFF" />
                    <text x="345" y="50" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold">Green Park</text>

                    {/* Stop 2: Sector 62 */}
                    <circle cx="250" cy="110" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="250" cy="110" r="2.5" fill="#FFFFFF" />
                    <text x="250" y="98" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="600">Sector 62</text>

                    {/* Stop 3: City Center */}
                    <circle cx="120" cy="210" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="120" cy="210" r="2.5" fill="#FFFFFF" />
                    <text x="120" y="228" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="600">City Center</text>

                    {/* Drop Point: Anand School */}
                    <circle cx="315" cy="195" r="9" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="315" cy="195" r="3.5" fill="#FFFFFF" />
                    <text x="315" y="215" textAnchor="middle" fill="#DC2626" fontSize="10" fontWeight="bold">Anand School</text>

                    {/* Current Live Bus Marker */}
                    <g transform="translate(195, 140)">
                      {/* Pulse circle */}
                      <circle cx="0" cy="0" r="20" fill="#F59E0B" fillOpacity="0.25" className="animate-ping" />
                      {/* Outer shadow badge */}
                      <circle cx="0" cy="0" r="14" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
                      {/* Small bus icon inside badge */}
                      <rect x="-6" y="-6" width="12" height="12" rx="2.5" fill="#0F172A" />
                      <circle cx="-3" cy="4" r="1.5" fill="#F59E0B" />
                      <circle cx="3" cy="4" r="1.5" fill="#F59E0B" />
                      <rect x="-4.5" y="-4" width="9" height="4" rx="1" fill="#FFFFFF" />
                    </g>
                  </svg>

                  {/* Locate Crosshair Button */}
                  <button
                    onClick={readAndTransmitLivePosition}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 text-blue-600 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Center GPS Target"
                  >
                    <LocateFixed className="w-4 h-4" />
                  </button>
                </div>

                {/* GPS Transmitter Action Button */}
                <div className="space-y-2">
                  {!driverTripActive ? (
                    <button
                      onClick={startDriverTrip}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none"
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

                  {/* Live Telemetry Ping */}
                  <p className="text-[11px] font-mono text-center text-slate-500">
                    {driverTripActive ? (
                      <span className="text-emerald-700 font-semibold">
                        &bull; GPS Streaming: {liveDriverGeo.latitude}&deg;N, {liveDriverGeo.longitude}&deg;E &bull; {liveDriverGeo.speedKmh} km/h
                      </span>
                    ) : (
                      <span>Tap Start GPS Trip to broadcast your real smartphone location</span>
                    )}
                  </p>
                </div>
              </div>

              {/* NEXT STOP CARD */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Next Stop
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                      Sunrise Villa Stop
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      2nd Cross Road, Sunrise Villa
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    ETA
                  </span>
                  <span className="text-lg sm:text-xl font-black text-emerald-600 leading-tight">
                    3 min
                  </span>
                </div>
              </div>

              {/* TODAY'S SCHEDULE CARD */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">
                    Today&apos;s Schedule
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    View All
                  </button>
                </div>

                {/* Schedule Timeline Items */}
                <div className="space-y-3 pt-1">
                  {/* Item 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Play className="w-3 h-3 fill-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Start from Depot</span>
                        <span className="text-xs font-mono font-semibold text-slate-500">07:15 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">Green Park</span>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                      <Bus className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Route 04 - Morning</span>
                        <span className="text-xs font-mono font-semibold text-slate-500">07:15 AM – 08:20 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">Pickup Students</span>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200">
                      <Flag className="w-3 h-3 fill-rose-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Drop at School</span>
                        <span className="text-xs font-mono font-semibold text-slate-500">08:20 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">Anand School</span>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 border border-slate-300">
                      <Square className="w-2.5 h-2.5 fill-slate-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">End of Trip</span>
                        <span className="text-xs font-mono font-semibold text-slate-500">08:30 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">Back to Depot</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* 4. TODAY'S ATTENDANCE SUMMARY CARD */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                Today&apos;s Attendance Summary
              </h3>
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer border-none bg-transparent"
              >
                View Details
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat 1: Total Assigned */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 leading-tight block">
                    {driverTotalStudents}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total Assigned
                  </span>
                </div>
              </div>

              {/* Stat 2: Picked Up */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 leading-tight block">
                    {driverPickedCount}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Picked Up
                  </span>
                </div>
              </div>

              {/* Stat 3: Dropped */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 leading-tight block">
                    {driverDroppedCount}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Dropped
                  </span>
                </div>
              </div>

              {/* Stat 4: Left / Absent */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 leading-tight block">
                    {driverLeftCount}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Left / Absent
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. IN-APP BOTTOM NAVIGATION DOCK (MATCHING SCREENSHOT) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-2 flex items-center justify-around">
            <button
              onClick={() => setDriverActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all border-none bg-transparent cursor-pointer ${
                driverActiveTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[11px]">Dashboard</span>
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all border-none bg-transparent cursor-pointer text-slate-400 hover:text-slate-600 font-medium"
            >
              <Navigation className="w-5 h-5" />
              <span className="text-[11px]">My Trips</span>
            </button>

            <button
              onClick={() => setShowAttendanceModal(true)}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all border-none bg-transparent cursor-pointer text-slate-400 hover:text-slate-600 font-medium"
            >
              <Users className="w-5 h-5" />
              <span className="text-[11px]">Students</span>
            </button>

            <button
              onClick={() => setShowNotificationModal(true)}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all border-none bg-transparent cursor-pointer text-slate-400 hover:text-slate-600 font-medium relative"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  2
                </span>
              </div>
              <span className="text-[11px]">Messages</span>
            </button>

            <button
              onClick={() => setShowFuelModal(true)}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all border-none bg-transparent cursor-pointer text-slate-400 hover:text-slate-600 font-medium"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[11px]">More</span>
            </button>
          </div>

          {/* ────── INTERACTIVE DRIVER MODAL DIALOGS ────── */}

          {/* MODAL 1: STUDENT ATTENDANCE & PICKUP ROSTER */}
          {showAttendanceModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Student Pickup Attendance
                    </h3>
                    <p className="text-xs text-slate-500">
                      Route 04 &bull; {driverPickedCount} Picked &bull; {driverLeftCount} Remaining
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAttendanceModal(false)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                  <input
                    type="text"
                    value={driverStudentSearch}
                    onChange={(e) => setDriverStudentSearch(e.target.value)}
                    placeholder="Search student or stop name..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    {(['ALL', 'PICKED', 'PENDING', 'DROPPED'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setAttendanceFilter(tab)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all border cursor-pointer ${
                          attendanceFilter === tab
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab} ({
                          tab === 'ALL' ? driverStudents.length :
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
                  {driverStudents
                    .filter(s => {
                      if (attendanceFilter === 'PICKED') return s.status === 'PICKED';
                      if (attendanceFilter === 'PENDING') return s.status === 'PENDING' || s.status === 'ABSENT';
                      if (attendanceFilter === 'DROPPED') return s.status === 'DROPPED';
                      return true;
                    })
                    .filter(s => {
                      if (!driverStudentSearch) return true;
                      const q = driverStudentSearch.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.stop.toLowerCase().includes(q) || s.class.toLowerCase().includes(q);
                    })
                    .map(student => (
                      <div
                        key={student.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{student.avatar}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{student.name}</span>
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
                              setDriverStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'PICKED' } : s));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              student.status === 'PICKED'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            Picked
                          </button>

                          <button
                            onClick={() => {
                              setDriverStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'ABSENT' } : s));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              student.status === 'ABSENT'
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            onClick={() => {
                              setDriverStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'DROPPED' } : s));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              student.status === 'DROPPED'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            }`}
                          >
                            Drop
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Changes save automatically to ERP
                  </span>
                  <button
                    onClick={() => setShowAttendanceModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer border-none"
                  >
                    Done
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* MODAL 2: REPORT ISSUE */}
          {showReportIssueModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-bold text-base text-slate-900">
                      Report Trip Delay / Issue
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
                    Broadcast Alert
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 3: FUEL LOG */}
          {showFuelModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Fuel className="w-5 h-5" />
                    <h3 className="font-bold text-base text-slate-900">
                      Fuel Log Entry
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowFuelModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Fuel Slider */}
                <div className="space-y-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Current Fuel Gauge</span>
                    <span className="text-xl font-black text-amber-700 font-mono">{fuelInput}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={fuelInput}
                    onChange={(e) => setFuelInput(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Empty (10%)</span>
                    <span>Half (50%)</span>
                    <span>Full (100%)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Liters Filled</label>
                    <input
                      type="text"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Odometer (Km)</label>
                    <input
                      type="text"
                      value={fuelOdometer}
                      onChange={(e) => setFuelOdometer(e.target.value)}
                      placeholder="e.g. 14,280"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowFuelModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setDriverFuelLevel(fuelInput);
                      setShowFuelModal(false);
                      alert('✅ Fuel log saved successfully.');
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#122A24] text-xs font-bold transition-colors cursor-pointer border-none shadow-md"
                  >
                    Save Fuel Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 4: EMERGENCY SOS */}
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

          {/* MODAL 5: NOTIFICATIONS & DISPATCH */}
          {showNotificationModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-base text-slate-900">
                      Driver Dispatch Messages
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-900">Parent of Aarav Sharma</span>
                      <span className="text-[10px] text-slate-400 font-mono">07:20 AM</span>
                    </div>
                    <p className="text-xs text-slate-600">
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
                      &ldquo;Morning trip assigned to UP32 AB 1234. Please ensure GPS transmitter is active.&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setUnreadNotifications(0);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Mark All as Read
                  </button>

                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer border-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 6: FULL SCHEDULE MODAL */}
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">
                    Route 04 - Daily Schedule
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#F0F5FF] border border-[#D9E6FE] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-900 uppercase">Morning Shift (Current)</span>
                      <span className="text-xs font-mono font-bold text-blue-600">07:15 AM – 08:30 AM</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Depot &rarr; Green Park &rarr; Sector 62 &rarr; City Center &rarr; Sunrise Villa &rarr; Anand School
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
