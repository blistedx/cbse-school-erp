/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  X,
  Users
} from 'lucide-react';

interface TeacherItem {
  id: string;
  staff_code?: string;
  employee_code?: string;
  full_name: string;
  department?: string;
  designation?: string;
  qualification?: string;
  phone?: string;
  email?: string;
  status?: string;
  employment_type?: string;
  assigned_class?: string;
  subjects?: string[] | string;
  classes_taught?: string;
  joining_date?: string;
  gender?: string;
}

export default function PrincipalFacultyPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Faculty Detail Modal
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);

  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/teachers');
      if (!res.ok) throw new Error('Failed to load faculty directory');
      const json = await res.json();
      if (json.success && Array.isArray(json.teachers)) {
        setTeachers(json.teachers);
      } else {
        setTeachers([]);
      }
    } catch (err: any) {
      console.error('Fetch faculty error:', err);
      setError(err.message || 'Unable to load faculty roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  // Unique Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach(t => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set).sort();
  }, [teachers]);

  // Filtered Faculty
  const filteredFaculty = useMemo(() => {
    return teachers.filter(t => {
      if (selectedDept !== 'ALL' && t.department !== selectedDept) return false;
      if (selectedStatus !== 'ALL') {
        const isLeave = (t.status || '').toUpperCase() === 'ON_LEAVE';
        if (selectedStatus === 'ACTIVE' && isLeave) return false;
        if (selectedStatus === 'ON_LEAVE' && !isLeave) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (t.full_name || '').toLowerCase().includes(q);
        const matchCode = (t.staff_code || t.employee_code || '').toLowerCase().includes(q);
        const matchDept = (t.department || '').toLowerCase().includes(q);
        const matchDesig = (t.designation || '').toLowerCase().includes(q);
        const matchSubj = Array.isArray(t.subjects)
          ? t.subjects.some(s => s.toLowerCase().includes(q))
          : String(t.subjects || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDept && !matchDesig && !matchSubj) return false;
      }
      return true;
    });
  }, [teachers, selectedDept, selectedStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => (t.status || '').toUpperCase() !== 'ON_LEAVE').length;
    const onLeave = teachers.filter(t => (t.status || '').toUpperCase() === 'ON_LEAVE').length;
    const classTeachers = teachers.filter(t => Boolean(t.assigned_class && t.assigned_class !== 'None')).length;
    return { total, active, onLeave, classTeachers };
  }, [teachers]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredFaculty.length === 0) return;
    const headers = ['Staff Code', 'Full Name', 'Designation', 'Department', 'Qualification', 'Assigned Class', 'Phone', 'Email', 'Status', 'Employment Type'];
    let csv = '\uFEFF' + headers.join(',') + '\r\n';
    filteredFaculty.forEach(t => {
      const row = [
        `"${t.staff_code || t.employee_code || ''}"`,
        `"${t.full_name || ''}"`,
        `"${t.designation || ''}"`,
        `"${t.department || ''}"`,
        `"${t.qualification || ''}"`,
        `"${t.assigned_class || 'None'}"`,
        `"${t.phone || ''}"`,
        `"${t.email || ''}"`,
        `"${t.status || 'ACTIVE'}"`,
        `"${t.employment_type || 'PERMANENT'}"`
      ];
      csv += row.join(',') + '\r\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faculty_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER WITH SIGNATURE WATERMARK TYPOGRAPHY
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 sm:p-8 relative overflow-hidden">
        {/* Signature watermark typography */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[210px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
          >
            Faculty
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
          >
            Roster
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F2EC] text-[#122A24] text-xs font-semibold mb-2 border border-[#DCE8E0]">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Teaching Staff &amp; Faculty Registers</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#122A24] tracking-tight">
              Faculty &amp; Staff Master Roster
            </h1>
            <p className="text-xs sm:text-sm text-[#2D5A4E] mt-1 max-w-2xl leading-relaxed">
              Official faculty registry: credentials, academic qualifications, class teacher allocations, contact lines, and duty status.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-semibold text-[#122A24] transition shadow-2xs cursor-pointer active:scale-95"
              title="Download formatted CSV roster"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Print Faculty Register"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY KPI TILES
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">Total Faculty</div>
          <div className="text-2xl font-black text-[#122A24] mt-1">{stats.total}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Sanctioned Staff Roll</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">Active On-Duty</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{stats.active}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Biometrics Active Today</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">On Leave</div>
          <div className="text-2xl font-black text-amber-800 mt-1">{stats.onLeave}</div>
          <div className="text-[10px] text-amber-700 font-medium mt-0.5">Approved Statutory Leave</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">Assigned Class Teachers</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">{stats.classTeachers}</div>
          <div className="text-[10px] text-indigo-700 font-medium mt-0.5">Section In-Charges</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH & DEPARTMENT FILTERS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#2D5A4E]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by teacher name, staff code, designation, subject, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE8E0] bg-[#F4F8F5] text-xs text-[#122A24] focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-medium"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DCE8E0] bg-white text-xs font-semibold text-[#122A24] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DCE8E0] bg-white text-xs font-semibold text-[#122A24] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active On-Duty</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-[#E9F2EC] p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-[#122A24] text-white' : 'text-[#2D5A4E] hover:text-[#122A24]'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'cards' ? 'bg-[#122A24] text-white' : 'text-[#2D5A4E] hover:text-[#122A24]'
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#2D5A4E]">
          <span>
            Showing <strong>{filteredFaculty.length}</strong> of {teachers.length} faculty members
          </span>
          {(searchQuery || selectedDept !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FACULTY ROSTER (TABLE / CARDS)
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] p-12 text-center text-xs text-[#2D5A4E] animate-pulse">
          Loading faculty roster...
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Unable to load faculty</h3>
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] p-12 text-center space-y-2 text-[#2D5A4E]">
          <Briefcase className="w-10 h-10 text-[#2D5A4E]/30 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#122A24]">No faculty found</h3>
          <p className="text-xs">No records matched your search query or department filter.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#122A24]">
              <thead className="bg-[#F0F5F2] text-[#2D5A4E] font-mono uppercase text-[10px] tracking-wider border-b border-[#DCE8E0]">
                <tr>
                  <th className="p-4">Faculty Member</th>
                  <th className="p-4">Staff Code</th>
                  <th className="p-4">Department &amp; Designation</th>
                  <th className="p-4">Qualification</th>
                  <th className="p-4">Class In-Charge</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EBE5]">
                {filteredFaculty.map(teacher => {
                  const isOnLeave = (teacher.status || '').toUpperCase() === 'ON_LEAVE';
                  return (
                    <tr key={teacher.id} className="hover:bg-[#F8FAF9] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {teacher.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[#122A24] hover:text-emerald-800 transition">
                              {teacher.full_name}
                            </div>
                            <div className="text-[11px] text-[#2D5A4E]">
                              {teacher.employment_type || 'Permanent Faculty'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-[#122A24]">
                        {teacher.staff_code || teacher.employee_code || 'EMP'}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-[#122A24]">{teacher.designation || 'Faculty'}</div>
                        <div className="text-[11px] text-[#2D5A4E] font-mono">{teacher.department || 'Academics'}</div>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-[11px] bg-[#E9F2EC] px-2 py-0.5 rounded text-[#122A24] font-medium border border-[#DCE8E0]">
                          {teacher.qualification || 'M.A., B.Ed'}
                        </span>
                      </td>

                      <td className="p-4">
                        {teacher.assigned_class && teacher.assigned_class !== 'None' ? (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {teacher.assigned_class}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#2D5A4E]/50">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          {teacher.phone && (
                            <a href={`tel:${teacher.phone}`} className="font-mono text-emerald-700 hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{teacher.phone}</span>
                            </a>
                          )}
                          {teacher.email && (
                            <a href={`mailto:${teacher.email}`} className="font-mono text-xs text-[#2D5A4E] hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#2D5A4E]/70" />
                              <span className="truncate max-w-[140px]">{teacher.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isOnLeave ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {isOnLeave ? 'ON LEAVE' : 'ON DUTY'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedTeacher(teacher)}
                          className="px-3 py-1.5 rounded-xl bg-[#122A24] text-white hover:bg-[#1C443A] text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer active:scale-95"
                        >
                          <span>Card</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFaculty.map(teacher => {
            const isOnLeave = (teacher.status || '').toUpperCase() === 'ON_LEAVE';
            return (
              <div
                key={teacher.id}
                className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-base">
                        {teacher.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#122A24] text-sm">{teacher.full_name}</h4>
                        <p className="text-[11px] text-[#2D5A4E] font-mono">
                          Code: <strong>{teacher.staff_code || teacher.employee_code || 'EMP'}</strong>
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-xl text-[10px] font-bold font-mono ${
                      isOnLeave ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {isOnLeave ? 'ON LEAVE' : 'ON DUTY'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DCE8E0] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Role &amp; Department:</span>
                      <strong className="text-[#122A24]">{teacher.designation || 'Faculty'} ({teacher.department || 'Academics'})</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Qualification:</span>
                      <span className="font-mono text-[#122A24]">{teacher.qualification || 'M.A., B.Ed'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Class In-Charge:</span>
                      <strong className="font-mono text-emerald-800">{teacher.assigned_class || 'None'}</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Phone:</span>
                      {teacher.phone ? (
                        <a href={`tel:${teacher.phone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                          {teacher.phone}
                        </a>
                      ) : (
                        <span className="text-[#2D5A4E]/50">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeacher(teacher)}
                  className="w-full py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>View Full Profile Card</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. FACULTY DETAILS MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setSelectedTeacher(null)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#DCE8E0] z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-lg">
                  {selectedTeacher.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#122A24]">
                    {selectedTeacher.full_name}
                  </h3>
                  <div className="text-xs text-[#2D5A4E] font-mono">
                    Staff Code: {selectedTeacher.staff_code || selectedTeacher.employee_code || 'EMP'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-1.5 rounded-xl text-[#2D5A4E] hover:bg-[#F4F8F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0]">
                <div>
                  <span className="text-[#2D5A4E] block">Department:</span>
                  <strong className="text-[#122A24]">{selectedTeacher.department || 'Academics'}</strong>
                </div>
                <div>
                  <span className="text-[#2D5A4E] block">Designation:</span>
                  <strong className="text-[#122A24]">{selectedTeacher.designation || 'Faculty'}</strong>
                </div>
                <div>
                  <span className="text-[#2D5A4E] block">Qualification:</span>
                  <strong className="text-[#122A24]">{selectedTeacher.qualification || 'M.A., B.Ed'}</strong>
                </div>
                <div>
                  <span className="text-[#2D5A4E] block">Assigned Class:</span>
                  <strong className="text-emerald-800">{selectedTeacher.assigned_class || 'General Faculty'}</strong>
                </div>
              </div>

              <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-2">
                <div className="text-[11px] font-mono uppercase font-bold text-emerald-800">Communication &amp; Contact</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#2D5A4E]">Phone Number:</span>
                    <a href={`tel:${selectedTeacher.phone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                      {selectedTeacher.phone || 'N/A'}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#2D5A4E]">Official Email:</span>
                    <a href={`mailto:${selectedTeacher.email}`} className="font-mono text-[#122A24] hover:underline">
                      {selectedTeacher.email || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-1">
                <div className="text-[11px] font-mono uppercase font-bold text-emerald-800">Employment &amp; Service Roll</div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2D5A4E]">Tenure Type:</span>
                  <strong className="text-[#122A24]">{selectedTeacher.employment_type || 'Permanent'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2D5A4E]">Duty Status:</span>
                  <span className="font-bold text-emerald-800">
                    {(selectedTeacher.status || '').toUpperCase() === 'ON_LEAVE' ? 'Statutory Leave' : 'Active On-Duty'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTeacher(null)}
              className="w-full py-2.5 rounded-2xl bg-[#122A24] text-white font-bold text-xs hover:bg-[#1C443A] transition cursor-pointer"
            >
              Close Profile Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
