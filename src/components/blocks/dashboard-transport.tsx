'use client';

import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { Student } from '@/lib/types';

export interface DashboardTransportProps {
  students: Student[];
  schoolName?: string;
}

export function DashboardTransport({ students, schoolName = 'DPS International — CBSE' }: DashboardTransportProps) {
  const [selectedRoute, setSelectedRoute] = useState('Route 04 - South City 2');
  const [gpsActive, setGpsActive] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(34);
  const [searchQuery, setSearchQuery] = useState('');
  const [sosSent, setSosSent] = useState(false);
  const [selectedSosReason, setSelectedSosReason] = useState('Traffic Congestion (15 mins delay)');

  const [studentBoarding, setStudentBoarding] = useState([
    { id: 'b1', rollNo: '01', name: 'Aarav Sharma', class: 'Class VI-A', stop: 'Green Park Main Gate', parentPhone: '+91 98102-38491', status: 'BOARDED', time: '08:12 AM' },
    { id: 'b2', rollNo: '04', name: 'Ananya Singhania', class: 'Class VI-A', stop: 'Green Park Main Gate', parentPhone: '+91 98111-22334', status: 'BOARDED', time: '08:14 AM' },
    { id: 'b3', rollNo: '05', name: 'Ayush Mehra', class: 'Class VI-A', stop: 'Hauz Khas Metro', parentPhone: '+91 98222-33445', status: 'WAITING', time: '' },
    { id: 'b4', rollNo: '06', name: 'Bhavya Joshi', class: 'Class VI-A', stop: 'Hauz Khas Metro', parentPhone: '+91 98333-44556', status: 'WAITING', time: '' },
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

  const fleetList = [
    { id: 'BUS-04', route: 'Route 04 - South City 2', driver: 'Ramesh Kumar', phone: '+91 98765-43210', vehicleNo: 'DL-01-AB-8492', capacity: '32/36', status: 'ON_ROUTE', speed: '34 km/h' },
    { id: 'BUS-01', route: 'Route 01 - North Campus', driver: 'Sukhwinder Singh', phone: '+91 98765-43211', vehicleNo: 'DL-01-AB-1102', capacity: '36/36', status: 'ON_ROUTE', speed: '42 km/h' },
    { id: 'BUS-02', route: 'Route 02 - East Ring Road', driver: 'Mukesh Sharma', phone: '+91 98765-43212', vehicleNo: 'DL-01-AB-2941', capacity: '28/36', status: 'ON_ROUTE', speed: '28 km/h' },
    { id: 'BUS-03', route: 'Route 03 - West Metro Hub', driver: 'Jagdish Yadav', phone: '+91 98765-43213', vehicleNo: 'DL-01-AB-3081', capacity: '30/36', status: 'CAMPUS', speed: '0 km/h' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Bus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Transport & Live GPS Fleet Command
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                Real-time vehicle telemetry, stop sequence, student boarding logs & auto-parent SMS alerts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setGpsActive(!gpsActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              gpsActive ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            <Radio className="w-4 h-4" />
            {gpsActive ? 'GPS Broadcast Active' : 'Start GPS Broadcast'}
          </button>
        </div>
      </div>

      {/* Real-time Fleet Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Bus Fleet</div>
          <div className="text-2xl font-black text-[#122A24] mt-1 font-mono">12 / 12</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">100% Vehicles Operational</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Students Boarded</div>
          <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">{boardedCount} / {studentBoarding.length}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Morning Pickup Run</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Speed (Bus #04)</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{currentSpeed} km/h</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Within CBSE 40 km/h speed limit</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SOS Delay Alerts</div>
          <div className="text-2xl font-black text-[#122A24] mt-1 font-mono">0</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">All routes on schedule</div>
        </div>
      </div>

      {/* Main Grid: Visual Route Radar & Student Boarding Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Telemetry Map & Active Fleet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Animated Route Map Canvas */}
          <div className="bg-[#122A24] text-white p-6 rounded-3xl shadow-lg border border-emerald-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-extrabold text-base text-white">Live Route Telemetry: Bus #04 (Route South 2)</span>
              </div>
              <span className="text-xs font-mono bg-emerald-950 px-2.5 py-1 rounded-full text-emerald-300 border border-emerald-500/40 font-bold">
                Speed: {currentSpeed} km/h • On Schedule
              </span>
            </div>

            {/* Interactive Visual Progress Bar */}
            <div className="my-6 p-5 bg-emerald-950/70 rounded-2xl border border-emerald-800/50">
              <div className="flex justify-between text-xs text-emerald-200 font-semibold mb-3">
                <span>Green Park Main Gate (Completed)</span>
                <span className="text-amber-300 font-bold">Hauz Khas Metro Junction (0.9 km • 4 mins ETA)</span>
                <span className="text-slate-400">Saket City Terminal</span>
              </div>
              <div className="w-full bg-emerald-900 h-3 rounded-full overflow-hidden relative">
                <div className="bg-emerald-400 h-full rounded-full w-[60%]" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-lg"
                  style={{ left: '56%' }}
                >
                  <Bus className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Route Driver Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-emerald-800/50 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-neutral-950 font-bold flex items-center justify-center text-lg shadow-sm">
                  👨‍✈️
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Ramesh Kumar (Designated Driver)</div>
                  <div className="text-emerald-300">DL-01-AB-8492 • Contact: +91 98765-43210</div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <a
                  href="tel:9876543210"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all text-xs"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver Desk
                </a>
              </div>
            </div>
          </div>

          {/* Active Fleet Registry Table */}
          <div className="bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs">
            <h3 className="font-display font-bold text-sm text-[#122A24] mb-3">All Active School Buses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE8E0] text-[10.5px] uppercase font-bold text-slate-400">
                    <th className="pb-2">Bus Code</th>
                    <th className="pb-2">Assigned Route</th>
                    <th className="pb-2">Driver Name</th>
                    <th className="pb-2">Vehicle Plate</th>
                    <th className="pb-2">Capacity</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fleetList.map((bus) => (
                    <tr key={bus.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold font-mono text-[#122A24]">{bus.id}</td>
                      <td className="py-2.5 font-semibold text-slate-700">{bus.route}</td>
                      <td className="py-2.5 text-slate-600">{bus.driver}</td>
                      <td className="py-2.5 font-mono text-slate-600">{bus.vehicleNo}</td>
                      <td className="py-2.5 font-mono font-bold text-emerald-800">{bus.capacity}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bus.status === 'ON_ROUTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {bus.status === 'ON_ROUTE' ? `Active (${bus.speed})` : 'At Campus'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Student Boarding Checklist & Emergency SOS */}
        <div className="space-y-6">
          {/* Student Boarding Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-[#122A24]">Student Boarding Punch</h3>
                <p className="text-[11px] text-slate-500">Route 04 Passengers • Tap to Check-in</p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                {boardedCount}/{studentBoarding.length} Boarded
              </span>
            </div>

            <div className="space-y-2.5">
              {studentBoarding.map((st) => (
                <div
                  key={st.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    st.status === 'BOARDED' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleBoarding(st.id)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                        st.status === 'BOARDED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st.status === 'BOARDED' ? '✓' : '—'}
                    </button>
                    <div>
                      <div className="font-bold text-xs text-[#122A24]">{st.name}</div>
                      <div className="text-[10px] text-slate-500">{st.class} • Stop: {st.stop}</div>
                      {st.time && (
                        <div className="text-[9px] font-mono text-emerald-700 font-bold">
                          Boarded at {st.time} (SMS Alert Sent)
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    href={`tel:${st.parentPhone}`}
                    className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 shadow-2xs"
                    title="Call Guardian"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Transport Delay / Emergency SOS Dispatcher */}
          <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-display font-bold text-sm text-[#122A24]">Route Delay / SOS Dispatcher</h3>
            </div>
            <p className="text-xs text-slate-600">
              Broadcasts immediate delay SMS to all parents on Route 04.
            </p>

            <select
              value={selectedSosReason}
              onChange={(e) => setSelectedSosReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option>Traffic Congestion (15 mins delay)</option>
              <option>Tyre Puncture / Mechanical Issue</option>
              <option>Road Diversion / Waterlogging</option>
              <option>Medical Assistance Required</option>
            </select>

            <button
              onClick={() => {
                setSosSent(true);
                setTimeout(() => setSosSent(false), 4000);
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {sosSent ? 'Delay SMS Broadcasted to Parents! ✓' : 'Broadcast Delay SMS to Parents'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
