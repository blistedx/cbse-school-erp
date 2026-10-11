'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Building2, 
  Printer, 
  RefreshCw, 
  Layers
} from 'lucide-react';

interface TimetableEntry {
  id?: string;
  day: string;
  period_no: number;
  class_name: string;
  section?: string;
  subject_name: string;
  start_time?: string;
  end_time?: string;
  room_no?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherTimetablePage() {
  const [scheduleByDay, setScheduleByDay] = useState<Record<string, TimetableEntry[]>>({});
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    // Default active day to current day if weekday
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    if (todayIndex >= 1 && todayIndex <= 6) {
      setActiveDay(DAYS[todayIndex - 1]);
    }
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/timetable');
      const data = await res.json();
      if (data.success) {
        setScheduleByDay(data.weekly_schedule || {});
      }
    } catch (err) {
      console.error('Failed to load timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const currentDaySlots = scheduleByDay[activeDay] || [];
  const totalWeeklyPeriods = Object.values(scheduleByDay).reduce((acc, list) => acc + (list?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#122A24] text-white p-6 rounded-2xl shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Academic Schedule
            </span>
            <span className="text-emerald-300/60 text-xs">{totalWeeklyPeriods} Weekly Periods</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Weekly Timetable</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Official teaching schedule, class period allocations, and room assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <div className="bg-emerald-950/60 p-1 rounded-lg border border-emerald-800/60 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'day' ? 'bg-emerald-500 text-[#122A24] font-semibold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'week' ? 'bg-emerald-500 text-[#122A24] font-semibold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Full Week Grid
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
          Loading your master schedule...
        </div>
      ) : viewMode === 'day' ? (
        /* Day View */
        <div className="space-y-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 print:hidden">
            {DAYS.map((day) => {
              const count = scheduleByDay[day]?.length || 0;
              const isActive = activeDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                    isActive
                      ? 'bg-[#122A24] text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{day}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-emerald-500 text-[#122A24]' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count} {count === 1 ? 'Period' : 'Periods'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slots List for Selected Day */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-700" />
                <span>{activeDay}&apos;s Periods</span>
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                {currentDaySlots.length} Teaching Sessions
              </span>
            </div>

            {currentDaySlots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="font-medium text-gray-700">No scheduled periods for {activeDay}</p>
                <p className="text-xs text-gray-500 mt-1">Enjoy your prep time or check other weekdays.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentDaySlots.map((slot, index) => (
                  <div 
                    key={slot.id || index}
                    className="p-5 rounded-xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/20 to-white hover:border-emerald-300 transition shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#122A24] text-emerald-300">
                        Period {slot.period_no}
                      </span>
                      {slot.start_time && slot.end_time && (
                        <span className="text-xs font-mono font-medium text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {slot.start_time} - {slot.end_time}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      {slot.subject_name}
                    </h3>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <span className="font-semibold text-emerald-900">
                        Class {slot.class_name} - Sec {slot.section || 'A'}
                      </span>
                      {slot.room_no && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Building2 className="w-3.5 h-3.5" />
                          Room {slot.room_no}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Week Grid */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-semibold">
                  <th className="py-3 px-4 w-28">Day</th>
                  <th className="py-3 px-4">Periods &amp; Allocations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DAYS.map((day) => {
                  const slots = scheduleByDay[day] || [];
                  return (
                    <tr key={day} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4 font-bold text-gray-900 align-top">
                        {day}
                        <p className="text-[10px] font-normal text-gray-500 mt-0.5">{slots.length} periods</p>
                      </td>
                      <td className="py-4 px-4">
                        {slots.length === 0 ? (
                          <span className="text-gray-400 italic">No periods</span>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {slots.map((s, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70 text-xs">
                                <div className="flex items-center justify-between font-bold text-[#122A24]">
                                  <span>P{s.period_no}: {s.subject_name}</span>
                                </div>
                                <div className="text-[11px] text-emerald-800 mt-1">
                                  Class {s.class_name}-{s.section || 'A'}
                                </div>
                                {s.start_time && (
                                  <div className="text-[10px] text-gray-500 mt-0.5">
                                    {s.start_time} - {s.end_time}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
