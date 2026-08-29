'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bus,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Send,
  ShieldAlert,
  UserCheck,
  Users,
  X
} from 'lucide-react';

export interface RoleDriverViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface BoardingStudent {
  id: string;
  name: string;
  class: string;
  stopName: string;
  parentPhone: string;
  boarded: boolean;
  time?: string;
}

export default function RoleDriverView({ activeTab, setActiveTab }: RoleDriverViewProps) {
  const [gpsActive, setGpsActive] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(34);
  const [sosSent, setSosSent] = useState(false);
  const [selectedSosType, setSelectedSosType] = useState('Traffic Congestion (15 min delay)');

  const [students, setStudents] = useState<BoardingStudent[]>([
    { id: 'b1', name: 'Aarav Sharma', class: 'VI-A', stopName: 'Green Park Main Gate', parentPhone: '+91 98102-38491', boarded: true, time: '08:12 AM' },
    { id: 'b2', name: 'Ananya Singhania', class: 'VI-A', stopName: 'Green Park Main Gate', parentPhone: '+91 98111-22334', boarded: true, time: '08:14 AM' },
    { id: 'b3', name: 'Ayush Mehra', class: 'VI-A', stopName: 'Hauz Khas Metro', parentPhone: '+91 98222-33445', boarded: false },
    { id: 'b4', name: 'Bhavya Joshi', class: 'VI-A', stopName: 'Hauz Khas Metro', parentPhone: '+91 98333-44556', boarded: false },
    { id: 'b5', name: 'Dhruv Rastogi', class: 'VII-B', stopName: 'Saket City Terminal', parentPhone: '+91 98444-55667', boarded: false },
    { id: 'b6', name: 'Divya Iyer', class: 'VIII-A', stopName: 'Saket City Terminal', parentPhone: '+91 98555-66778', boarded: false },
  ]);

  const boardedCount = students.filter((s) => s.boarded).length;

  const toggleBoarding = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nowBoarded = !s.boarded;
        return {
          ...s,
          boarded: nowBoarded,
          time: nowBoarded ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      })
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Driver Top Badge */}
      <div className="p-4 bg-gradient-to-br from-[#122A24] to-[#1C443A] text-white rounded-3xl shadow-lg border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white font-bold flex items-center justify-center text-xl shadow-md">
            🚌
          </div>
          <div>
            <div className="font-extrabold text-base text-white">Ramesh Kumar (Driver)</div>
            <div className="text-xs text-blue-200">Vehicle #DL-01-AB-8492 • Bus #04</div>
            <div className="text-[11px] text-emerald-300 font-mono mt-0.5">Route South 2: DPS to Saket Terminal</div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className={`w-2.5 h-2.5 rounded-full ${gpsActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
            <span className="text-[10px] font-bold text-emerald-300 uppercase font-mono">
              {gpsActive ? 'LIVE GPS' : 'GPS OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: ROUTE RADAR & LIVE TELEMETRY
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div className="space-y-4 animate-fade-in">
          {/* Animated Speed & GPS Card */}
          <div className="bg-[#122A24] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider">Active Telemetry</span>
                <h3 className="font-black text-xl text-white">Next: Hauz Khas Metro</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black font-mono text-amber-300">{currentSpeed}</span>
                <span className="text-xs text-neutral-300 ml-1">km/h</span>
              </div>
            </div>

            {/* Visual Route Progress */}
            <div className="my-5 p-3.5 bg-emerald-950/70 rounded-2xl border border-emerald-800/40">
              <div className="flex justify-between text-xs text-emerald-200 font-semibold mb-2">
                <span>Green Park (Passed)</span>
                <span className="text-amber-300 font-bold">Hauz Khas (0.9 km • 4 min)</span>
              </div>
              <div className="w-full bg-emerald-900 h-2.5 rounded-full overflow-hidden relative">
                <div className="bg-emerald-400 h-full rounded-full w-[55%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setGpsActive(!gpsActive)}
                className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  gpsActive ? 'bg-emerald-600 text-white shadow-md' : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                {gpsActive ? 'GPS Broadcast Active' : 'Start GPS Beacon'}
              </button>

              <button
                onClick={() => setActiveTab('sos')}
                className="py-2.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                SOS Alert
              </button>
            </div>
          </div>

          {/* Quick Boarding Summary Card */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700">Passenger Count</span>
              <h3 className="font-extrabold text-base text-neutral-900 mt-0.5">
                {boardedCount} of {students.length} Students Onboard
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Tap below to open stop passenger check-in</p>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Checklist
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: BOARDING CHECKLIST WITH PARENT AUTO-SMS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'students' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900">Student Boarding Check</h3>
                <p className="text-xs text-neutral-500">Tap name to punch In/Out • Auto-alerts parent</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                {boardedCount}/{students.length} Boarded
              </span>
            </div>

            <div className="space-y-2.5">
              {students.map((st) => (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    st.boarded ? 'bg-emerald-50/70 border-emerald-300' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleBoarding(st.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                        st.boarded ? 'bg-emerald-600 text-white shadow-sm' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {st.boarded ? <Check className="w-5 h-5 stroke-[3]" /> : '—'}
                    </button>
                    <div>
                      <div className="font-bold text-xs text-neutral-900">{st.name}</div>
                      <div className="text-[10px] text-neutral-500">
                        {st.class} • Stop: <span className="font-semibold text-neutral-700">{st.stopName}</span>
                      </div>
                      {st.time && (
                        <div className="text-[9px] text-emerald-700 font-mono font-bold mt-0.5">
                          Boarded at {st.time} (SMS sent)
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    href={`tel:${st.parentPhone}`}
                    className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-emerald-700 shadow-sm"
                    title="Call Parent"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: ROUTE STOP TIMES
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'stops' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              Route #04 Schedule Timetable
            </h3>

            <div className="space-y-3">
              {[
                { stop: 'DPS Campus Departure', sched: '08:00 AM', status: 'Departed 08:02 AM' },
                { stop: 'Green Park Main Gate', sched: '08:15 AM', status: 'Completed 08:14 AM' },
                { stop: 'Hauz Khas Metro Junction', sched: '08:25 AM', status: 'Approaching (4 mins)' },
                { stop: 'Saket City Terminal', sched: '08:40 AM', status: 'Scheduled' },
              ].map((st, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-neutral-900">{st.stop}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Scheduled: {st.sched}</div>
                  </div>
                  <span className="font-bold text-emerald-800 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: EMERGENCY SOS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'sos' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-extrabold text-base text-neutral-900">Transport Emergency / Delay SOS</h3>
            </div>
            <p className="text-xs text-neutral-600">
              Immediately alerts School Transport Command & broadcasts delay SMS to all parents on this route.
            </p>

            <div className="space-y-2">
              {[
                'Traffic Congestion (15 min delay)',
                'Tyre Puncture / Mechanical Issue',
                'Road Blockage / Waterlogging',
                'Medical Assistance Required'
              ].map((reason, idx) => (
                <label
                  key={idx}
                  onClick={() => setSelectedSosType(reason)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer transition-all ${
                    selectedSosType === reason ? 'bg-red-50 border-red-500 text-red-900' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <span>{reason}</span>
                  <input type="radio" checked={selectedSosType === reason} readOnly className="accent-red-600" />
                </label>
              ))}
            </div>

            <button
              onClick={() => {
                setSosSent(true);
                setTimeout(() => setSosSent(false), 5000);
              }}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              {sosSent ? 'Emergency SOS Sent to Transport Desk & Parents! ✓' : 'Transmit SOS Alert Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
