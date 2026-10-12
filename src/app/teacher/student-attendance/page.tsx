'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ShieldAlert, 
  Download, 
  Printer, 
  RefreshCw,
  Info
} from 'lucide-react';

interface AllocatedClass {
  class_name: string;
  section: string;
}

interface StudentAttendanceRecord {
  student_id: string;
  admission_no: string;
  full_name: string;
  roll_no: string;
  attendance_percent: number;
  present_days: number;
  total_working_days: number;
  is_defaulter: boolean;
}

export default function SubjectTeacherStudentAttendancePage() {
  const [allocatedClasses, setAllocatedClasses] = useState<AllocatedClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
  const [defaultersCount, setDefaultersCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [fetchingRoster, setFetchingRoster] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyDefaulters, setOnlyDefaulters] = useState(false);

  useEffect(() => {
    fetchInitialClasses();
  }, []);

  const fetchInitialClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/student-attendance');
      const data = await res.json();
      if (data.success && data.allocated_classes?.length > 0) {
        setAllocatedClasses(data.allocated_classes);
        setSelectedClass(data.allocated_classes[0].class_name);
        setSelectedSection(data.allocated_classes[0].section || 'A');
      }
    } catch (err) {
      console.error('Failed to load allocated classes', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRoster = async () => {
    if (!selectedClass) return;
    try {
      setFetchingRoster(true);
      const params = new URLSearchParams({
        class_name: selectedClass,
        section: selectedSection,
      });
      const res = await fetch(`/api/teacher/student-attendance?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setDefaultersCount(data.defaulters_count || 0);
      }
    } catch (err) {
      console.error('Failed to load student attendance', err);
    } finally {
      setFetchingRoster(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadAttendanceRoster();
    }
  }, [selectedClass, selectedSection]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.admission_no && s.admission_no.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (onlyDefaulters) {
      return matchesSearch && s.is_defaulter;
    }
    return matchesSearch;
  });

  const avgAttendance = students.length > 0 
    ? Math.round(students.reduce((acc, s) => acc + s.attendance_percent, 0) / students.length)
    : 0;

  const exportCSV = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Admission No', 'Student Name', 'Present Days', 'Working Days', 'Attendance %', 'Status'];
    const rows = students.map(s => [
      `"${s.roll_no || ''}"`,
      `"${s.admission_no}"`,
      `"${s.full_name}"`,
      s.present_days,
      s.total_working_days,
      `${s.attendance_percent}%`,
      s.is_defaulter ? 'Defaulter (<75%)' : 'Regular'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Attendance_Class_${selectedClass}_${selectedSection}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header (Admin Deep Green Theme) */}
      <div className="bg-gradient-to-br from-[#0F2620] via-[#14352B] to-[#1A4237] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-700/60 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-[#0F2620] shadow-xs">
              Read-Only Ledger
            </span>
            <span className="text-emerald-300 text-xs font-mono font-bold">
              Unified School Attendance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Student Attendance %</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Read-only overview of student attendance percentages in your assigned teaching sections.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 print:hidden">
          <button
            onClick={exportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F2620] shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Strict Policy Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900">
          <p className="font-semibold text-amber-950">Subject Teacher View Policy</p>
          <p className="mt-0.5 text-amber-800">
            Attendance marking and modifications are restricted to the designated Class Teacher and School Administration.
            Subject teachers have read-only visibility into student attendance percentages to monitor eligibility and engagement.
          </p>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
            Allocated Class:
          </label>
          <select
            value={`${selectedClass}___${selectedSection}`}
            onChange={(e) => {
              const [cName, sSec] = e.target.value.split('___');
              setSelectedClass(cName);
              setSelectedSection(sSec);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-60"
          >
            {allocatedClasses.map((item) => (
              <option key={`${item.class_name}-${item.section}`} value={`${item.class_name}___${item.section}`}>
                Class {item.class_name} - Section {item.section}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search scholar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            onClick={() => setOnlyDefaulters(!onlyDefaulters)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition whitespace-nowrap ${
              onlyDefaulters 
                ? 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' 
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Defaulters Only (&lt;75%)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Enrolled Scholars</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
            <p className="text-[11px] text-gray-500">Active in Section {selectedSection}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Section Average</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{avgAttendance}%</p>
            <p className="text-[11px] text-gray-500">Overall attendance rate</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase">Attendance Defaulters</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{defaultersCount}</p>
            <p className="text-[11px] text-rose-600">Scholars with &lt; 75% attendance</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {fetchingRoster ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading attendance records from unified system...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No students found matching filters</p>
          </div>
        ) : (
          <div>
            {/* Mobile Student Attendance Feed (< md) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredStudents.map((s) => (
                <div key={s.student_id} className={`p-4 space-y-2.5 hover:bg-gray-50 transition ${s.is_defaulter ? 'bg-rose-50/20' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500">
                        {s.roll_no && <span className="font-bold text-gray-700">Roll: {s.roll_no}</span>}
                        <span>Adm: {s.admission_no}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 mt-0.5">{s.full_name}</h4>
                    </div>

                    <div className="shrink-0">
                      {s.is_defaulter ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Defaulter (&lt;75%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Regular
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-500">
                        Present: <strong className="text-gray-900">{s.present_days}</strong> / {s.total_working_days} Days
                      </span>
                      <span className={`font-black ${s.is_defaulter ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {s.attendance_percent}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${s.is_defaulter ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(s.attendance_percent, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Broadsheet Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Adm No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Present Days</th>
                    <th className="py-3 px-4">Working Days</th>
                    <th className="py-3 px-4">Attendance %</th>
                    <th className="py-3 px-4">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.student_id} className={`hover:bg-gray-50 transition ${s.is_defaulter ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-3 px-4 font-mono font-medium text-gray-600">{s.roll_no || '-'}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{s.admission_no}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{s.full_name}</td>
                      <td className="py-3 px-4 text-gray-700">{s.present_days}</td>
                      <td className="py-3 px-4 text-gray-500">{s.total_working_days}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full ${s.is_defaulter ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(s.attendance_percent, 100)}%` }} 
                            />
                          </div>
                          <span className={`font-bold ${s.is_defaulter ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {s.attendance_percent}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {s.is_defaulter ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Defaulter (&lt;75%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Regular
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
