'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Lock, 
  Save, 
  Download, 
  Printer, 
  RefreshCw,
  Search,
  Check,
  Phone
} from 'lucide-react';
import { getTodayDateStr } from '@/lib/utils';

interface StudentAttendanceItem {
  student_id: string;
  admission_no: string;
  full_name: string;
  roll_no: string;
  parent_phone: string;
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  remark?: string;
}

interface Defaulter {
  student_id: string;
  admission_no: string;
  full_name: string;
  roll_no: string;
  parent_phone: string;
  attendance_percent: number;
  absent_days: number;
  total_days: number;
}

export default function ClassTeacherAttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [className, setClassName] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [isLockedByAdmin, setIsLockedByAdmin] = useState(false);
  const [isMarked, setIsMarked] = useState(false);
  const [markedBy, setMarkedBy] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'register' | 'defaulters'>('register');

  useEffect(() => {
    fetchClassAttendance();
  }, [selectedDate]);

  const fetchClassAttendance = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch(`/api/teacher/class/attendance?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setClassName(data.class_name);
        setSection(data.section);
        // Sanitize status to strictly PRESENT, ABSENT, HOLIDAY
        const sanitizedStudents = (data.students || []).map((s: any) => {
          let status: StudentAttendanceItem['status'] = 'PRESENT';
          const raw = String(s.status || 'PRESENT').toUpperCase();
          if (raw === 'HOLIDAY') status = 'HOLIDAY';
          else if (raw === 'ABSENT' || raw === 'LEAVE') status = 'ABSENT';
          else status = 'PRESENT';
          return { ...s, status };
        });
        setStudents(sanitizedStudents);
        setDefaulters(data.defaulters || []);
        setIsLockedByAdmin(!!data.is_locked_by_admin);
        setIsMarked(!!data.is_marked);
        setMarkedBy(data.marked_by || '');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load class attendance' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error connecting to attendance service' });
    } finally {
      setLoading(false);
    }
  };

  const setStudentStatus = (studentId: string, status: StudentAttendanceItem['status']) => {
    if (isLockedByAdmin) return;
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  // Tap-to-cycle status: PRESENT -> ABSENT -> HOLIDAY -> PRESENT (Strictly No LEAVE)
  const toggleStudentStatus = (studentId: string) => {
    if (isLockedByAdmin) return;
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s;
      const nextStatus: StudentAttendanceItem['status'] = 
        s.status === 'PRESENT' ? 'ABSENT' : 
        s.status === 'ABSENT' ? 'HOLIDAY' : 
        'PRESENT';
      return { ...s, status: nextStatus };
    }));
  };

  const setStudentRemark = (studentId: string, remark: string) => {
    if (isLockedByAdmin) return;
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, remark } : s));
  };

  const markAll = (status: StudentAttendanceItem['status']) => {
    if (isLockedByAdmin) return;
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const payload = {
        date: selectedDate,
        class_name: className,
        section,
        records: students.map(s => ({
          student_id: s.student_id,
          status: s.status,
          remarks: s.remark || ''
        }))
      };

      const res = await fetch('/api/teacher/class/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Attendance saved successfully for Class ${className}-${section} on ${selectedDate}!` });
        setIsMarked(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to record attendance' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An unexpected error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const exportRegisterCSV = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Admission No', 'Student Name', 'Status', 'Date', 'Teacher Remark'];
    const rows = students.map(s => [
      `"${s.roll_no || ''}"`,
      `"${s.admission_no}"`,
      `"${s.full_name}"`,
      `"${s.status}"`,
      `"${selectedDate}"`,
      `"${s.remark || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Register_${className}_${section}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = [...students]
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    .filter(s => 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.admission_no && s.admission_no.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const absentCount = students.filter(s => s.status === 'ABSENT').length;
  const holidayCount = students.filter(s => s.status === 'HOLIDAY').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#122A24] text-white p-6 rounded-2xl shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-[#122A24]">
              Class Teacher Desk
            </span>
            {className && (
              <span className="text-emerald-300 text-xs font-bold">
                Assigned: Class {className}-{section}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daily Student Attendance Register</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Direct integration with the unified school attendance system. Marks reflect in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={exportRegisterCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-semibold transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Admin Lock Warning */}
      {isLockedByAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Attendance Locked by School Administration</p>
            <p className="text-xs text-amber-800">
              This attendance register for {selectedDate} has been locked ({markedBy || 'Admin'}). Modifications are currently restricted.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {message && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Date & Filter Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <label className="text-xs font-semibold text-gray-700 uppercase">Attendance Date:</label>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => markAll('PRESENT')}
              disabled={isLockedByAdmin}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
            >
              All Present
            </button>
            <button
              onClick={() => markAll('ABSENT')}
              disabled={isLockedByAdmin}
              className="px-2.5 py-1 text-xs font-medium rounded text-rose-700 hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
            >
              All Absent
            </button>
            <button
              onClick={() => markAll('HOLIDAY')}
              disabled={isLockedByAdmin}
              className="px-2.5 py-1 text-xs font-medium rounded text-amber-800 hover:bg-amber-50 transition disabled:opacity-50 cursor-pointer"
            >
              Mark Holiday
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search scholar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            onClick={saveAttendance}
            disabled={saving || isLockedByAdmin || students.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Register'}
          </button>
        </div>
      </div>

      {/* Tabs & Summary Bar */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'register' 
                ? 'border-emerald-600 text-emerald-800' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Today&apos;s Register ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'defaulters' 
                ? 'border-rose-600 text-rose-700' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Defaulters List</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
              {defaulters.length}
            </span>
          </button>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-1.5 pb-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
            P: {presentCount}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
            A: {absentCount}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
            H: {holidayCount}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
          Loading student roster for Class {className}...
        </div>
      ) : activeTab === 'register' ? (
        /* Register Roster (Mobile Cards + Desktop Table) */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* MOBILE VIEW: Touch-Friendly Tap-to-Change Roll Call Cards */}
          <div className="block md:hidden divide-y divide-gray-100 pb-20">
            <div className="p-3 bg-emerald-50/50 text-emerald-900 border-b border-emerald-100 text-xs flex items-center justify-between">
              <span className="font-semibold">💡 Tap scholar card or button to cycle status:</span>
              <span className="font-mono text-[11px] font-bold text-emerald-800">P → A → H</span>
            </div>

            {filteredStudents.map((s) => (
              <div 
                key={s.student_id} 
                className="p-4 space-y-3 hover:bg-gray-50/80 transition"
              >
                <div 
                  onClick={() => toggleStudentStatus(s.student_id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-800 font-mono font-bold text-xs flex items-center justify-center">
                      {s.roll_no || '--'}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-tight">{s.full_name}</h4>
                      <p className="text-[10px] font-mono text-gray-400">Adm: {s.admission_no}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black font-mono shadow-xs border transition ${
                        s.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                          : s.status === 'ABSENT'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                          : 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-500/20'
                      }`}
                    >
                      {s.status === 'PRESENT' ? '✓ Present' : s.status === 'ABSENT' ? '✕ Absent' : '🌴 Holiday'}
                    </span>
                    {s.parent_phone && (
                      <a
                        href={`tel:${s.parent_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-xs flex items-center justify-center"
                        title="Call Guardian"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 3-Segment Touch Selector for Mobile Finger Taps (Strictly PRESENT, ABSENT, HOLIDAY - No LEAVE) */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStudentStatus(s.student_id, 'PRESENT')}
                    disabled={isLockedByAdmin}
                    className={`py-2 rounded-lg text-xs font-black transition flex flex-col items-center justify-center cursor-pointer ${
                      s.status === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-emerald-700 bg-white/60'
                    }`}
                  >
                    <span>P</span>
                    <span className="text-[9.5px] font-medium opacity-90">Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentStatus(s.student_id, 'ABSENT')}
                    disabled={isLockedByAdmin}
                    className={`py-2 rounded-lg text-xs font-black transition flex flex-col items-center justify-center cursor-pointer ${
                      s.status === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-rose-700 bg-white/60'
                    }`}
                  >
                    <span>A</span>
                    <span className="text-[9.5px] font-medium opacity-90">Absent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentStatus(s.student_id, 'HOLIDAY')}
                    disabled={isLockedByAdmin}
                    className={`py-2 rounded-lg text-xs font-black transition flex flex-col items-center justify-center cursor-pointer ${
                      s.status === 'HOLIDAY'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-amber-800 bg-white/60'
                    }`}
                  >
                    <span>H</span>
                    <span className="text-[9.5px] font-medium opacity-90">Holiday</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Optional remark / reason for scholar..."
                  value={s.remark || ''}
                  disabled={isLockedByAdmin}
                  onChange={(e) => setStudentRemark(s.student_id, e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: High-Density Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 w-16">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4 text-center">Attendance Status (Tap to toggle)</th>
                  <th className="py-3 px-4">Remark / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-mono font-medium text-gray-700">{s.roll_no || '-'}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{s.full_name}</p>
                      {s.parent_phone && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          {s.parent_phone}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">{s.admission_no}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStudentStatus(s.student_id, 'PRESENT')}
                          disabled={isLockedByAdmin}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            s.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                              : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(s.student_id, 'ABSENT')}
                          disabled={isLockedByAdmin}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            s.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                              : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(s.student_id, 'HOLIDAY')}
                          disabled={isLockedByAdmin}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            s.status === 'HOLIDAY'
                              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                              : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-800'
                          }`}
                        >
                          H
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(s.student_id)}
                          disabled={isLockedByAdmin}
                          className="text-[10px] text-gray-400 hover:text-emerald-700 font-mono underline ml-1 cursor-pointer"
                        >
                          Toggle
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional reason..."
                        value={s.remark || ''}
                        disabled={isLockedByAdmin}
                        onChange={(e) => setStudentRemark(s.student_id, e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sticky Bottom Bar for Quick Save on Mobile */}
          <div className="md:hidden fixed bottom-14 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 shadow-2xl flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-emerald-700 font-bold">{presentCount} P</span>
              <span className="text-slate-400 mx-1">•</span>
              <span className="text-rose-600 font-bold">{absentCount} A</span>
              <span className="text-slate-400 mx-1">•</span>
              <span className="text-amber-700 font-bold">{holidayCount} H</span>
            </div>
            <button
              onClick={saveAttendance}
              disabled={saving || isLockedByAdmin || students.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Saving...' : 'Save Register'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Defaulters Tab */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Attendance Defaulters Roster (&lt; 75%)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Scholars who have fallen below the mandatory 75% attendance threshold.
              </p>
            </div>
          </div>

          {defaulters.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 rounded-xl text-emerald-800 text-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold">No Attendance Defaulters</p>
              <p className="text-xs text-emerald-700 mt-1">All scholars in your class meet or exceed 75% attendance!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Parent Mobile</th>
                    <th className="py-3 px-4">Attendance %</th>
                    <th className="py-3 px-4">Absent Days</th>
                    <th className="py-3 px-4">Total Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {defaulters.map((d) => (
                    <tr key={d.student_id} className="hover:bg-rose-50/20">
                      <td className="py-3 px-4 font-mono font-medium">{d.roll_no || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{d.full_name}</td>
                      <td className="py-3 px-4 font-mono text-gray-600">{d.parent_phone || 'NA'}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-rose-700">{d.attendance_percent}%</span>
                      </td>
                      <td className="py-3 px-4 text-rose-600">{d.absent_days}</td>
                      <td className="py-3 px-4 text-gray-500">{d.total_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
