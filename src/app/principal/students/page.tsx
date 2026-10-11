/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CalendarCheck,
  Award,
  Clock,
  Sparkles,
  X,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ShieldCheck,
  Bus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PrincipalStudentDossier } from '@/lib/types';

interface StudentItem {
  id: string;
  admission_no: string;
  full_name: string;
  class_name: string;
  section: string;
  roll_no?: string;
  gender?: string;
  father_name?: string;
  mother_name?: string;
  guardian_name?: string;
  guardian_phone?: string;
  phone?: string;
  is_rte?: string | boolean;
  transport_opted?: string | boolean;
  status?: string;
  dob?: string;
  address?: string;
  category?: string;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('erp_session_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-session-token'] = token;
    }
  }
  return headers;
}

export default function PrincipalStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // 360° Student Dossier Modal
  const [dossierModal, setDossierModal] = useState<{
    isOpen: boolean;
    dossier: PrincipalStudentDossier | null;
    loading: boolean;
    error?: string;
  }>({
    isOpen: false,
    dossier: null,
    loading: false
  });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      const res = await fetch('/api/students', { headers });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && Array.isArray(json.students)) {
        setStudents(json.students);
      } else {
        // Fallback to reports api if /api/students returns 401 or unexpected format
        const fallbackRes = await fetch('/api/principal/reports?category=students&sub_report=student_dossier', { headers });
        const fallbackJson = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok && fallbackJson.success && Array.isArray(fallbackJson.students)) {
          setStudents(fallbackJson.students);
        } else {
          setStudents([]);
        }
      }
    } catch (err: any) {
      console.error('Fetch students error:', err);
      setError(err?.message || 'Unable to load student directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Unique Classes & Sections safely computed
  const availableClasses = useMemo(() => {
    if (!Array.isArray(students)) return [];
    const set = new Set<string>();
    students.forEach(s => {
      if (s?.class_name) set.add(String(s.class_name));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  // Filtered Students safely computed
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter(s => {
      if (!s) return false;
      if (selectedClass !== 'ALL' && s.class_name !== selectedClass) return false;
      if (selectedSection !== 'ALL' && (s.section || 'A').toUpperCase() !== selectedSection.toUpperCase()) return false;
      if (selectedGender !== 'ALL' && (s.gender || '').toUpperCase() !== selectedGender.toUpperCase()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (s.full_name || '').toLowerCase().includes(q);
        const matchAdm = (s.admission_no || '').toLowerCase().includes(q);
        const matchFather = (s.father_name || s.guardian_name || s.mother_name || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || s.guardian_phone || '').includes(q);
        if (!matchName && !matchAdm && !matchFather && !matchPhone) return false;
      }
      return true;
    });
  }, [students, selectedClass, selectedSection, selectedGender, searchQuery]);

  // Overall Statistics safely computed
  const stats = useMemo(() => {
    if (!Array.isArray(students)) return { total: 0, boys: 0, girls: 0, rte: 0, transport: 0 };
    const total = students.length;
    const boys = students.filter(s => (s?.gender || '').toUpperCase() === 'MALE').length;
    const girls = students.filter(s => (s?.gender || '').toUpperCase() === 'FEMALE').length;
    const rte = students.filter(s => String(s?.is_rte || '').toUpperCase() === 'YES' || s?.is_rte === true).length;
    const transport = students.filter(s => String(s?.transport_opted || '').toUpperCase() === 'YES' || s?.transport_opted === true).length;
    return { total, boys, girls, rte, transport };
  }, [students]);

  // Open 360° Dossier
  const handleOpenDossier = async (studentId: string) => {
    if (!studentId) return;
    setDossierModal({ isOpen: true, dossier: null, loading: true });
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/principal/reports?category=students&sub_report=student_dossier&student_id=${encodeURIComponent(studentId)}`, { headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.dossier) {
        setDossierModal({ isOpen: true, dossier: data.dossier, loading: false });
      } else {
        setDossierModal({ isOpen: true, dossier: null, loading: false, error: data.error || 'Failed to fetch student dossier.' });
      }
    } catch (err: any) {
      setDossierModal({ isOpen: true, dossier: null, loading: false, error: err?.message || 'Network error fetching dossier.' });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Admission No', 'Full Name', 'Class', 'Section', 'Roll No', 'Gender', 'Father/Guardian', 'Phone', 'RTE', 'Transport'];
    let csv = '\uFEFF' + headers.join(',') + '\r\n';
    filteredStudents.forEach(s => {
      const row = [
        `"${s.admission_no || ''}"`,
        `"${s.full_name || ''}"`,
        `"${s.class_name || ''}"`,
        `"${s.section || 'A'}"`,
        `"${s.roll_no || ''}"`,
        `"${s.gender || ''}"`,
        `"${s.father_name || s.guardian_name || ''}"`,
        `"${s.phone || s.guardian_phone || ''}"`,
        `"${String(s.is_rte || '').toUpperCase() === 'YES' ? 'YES' : 'NO'}"`,
        `"${String(s.transport_opted || '').toUpperCase() === 'YES' ? 'YES' : 'NO'}"`
      ];
      csv += row.join(',') + '\r\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Scholars_Directory_${new Date().toISOString().split('T')[0]}.csv`);
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
            Scholars
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
          >
            Directory
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F2EC] text-[#122A24] text-xs font-semibold mb-2 border border-[#DCE8E0]">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Complete Institutional Enrolment Master</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#122A24] tracking-tight">
              Scholars &amp; Students Master Directory
            </h1>
            <p className="text-xs sm:text-sm text-[#2D5A4E] mt-1 max-w-2xl leading-relaxed">
              Executive access to student records, parent contacts, academic trajectories, fee clearance, and comprehensive 360° dossiers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-semibold text-[#122A24] transition shadow-2xs cursor-pointer active:scale-95"
              title="Download formatted CSV roll"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Print Scholars Register"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY KPI METRIC TILES
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">Total Scholars</div>
          <div className="text-2xl font-black text-[#122A24] mt-1">{stats.total}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Enrolled Session 2026-27</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">Boys</div>
          <div className="text-2xl font-black text-sky-900 mt-1">{stats.boys}</div>
          <div className="text-[10px] text-[#2D5A4E] mt-0.5">{stats.total > 0 ? `${Math.round((stats.boys / stats.total) * 100)}% of total` : '0%'}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">Girls</div>
          <div className="text-2xl font-black text-rose-900 mt-1">{stats.girls}</div>
          <div className="text-[10px] text-[#2D5A4E] mt-0.5">{stats.total > 0 ? `${Math.round((stats.girls / stats.total) * 100)}% of total` : '0%'}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">RTE Scholars</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{stats.rte}</div>
          <div className="text-[10px] text-amber-700 font-medium mt-0.5">Statutory 25% quota</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#2D5A4E] font-semibold">Transport Opted</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{stats.transport}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">School Bus &amp; Van Fleet</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH & DYNAMIC FILTERS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#2D5A4E]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, admission no, parent name, or mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE8E0] bg-[#F4F8F5] text-xs text-[#122A24] focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-medium"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DCE8E0] bg-white text-xs font-semibold text-[#122A24] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Classes ({availableClasses.length})</option>
            {availableClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DCE8E0] bg-white text-xs font-semibold text-[#122A24] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={e => setSelectedGender(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DCE8E0] bg-white text-xs font-semibold text-[#122A24] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Genders</option>
            <option value="MALE">Boys Only</option>
            <option value="FEMALE">Girls Only</option>
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
            Showing <strong>{filteredStudents.length}</strong> of {students.length} scholars
          </span>
          {(searchQuery || selectedClass !== 'ALL' || selectedSection !== 'ALL' || selectedGender !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('ALL');
                setSelectedSection('ALL');
                setSelectedGender('ALL');
              }}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. STUDENTS ROSTER VIEW (TABLE / CARDS)
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] p-12 text-center text-xs text-[#2D5A4E] animate-pulse">
          Loading scholars directory...
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Unable to load students</h3>
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] p-12 text-center space-y-2 text-[#2D5A4E]">
          <Users className="w-10 h-10 text-[#2D5A4E]/30 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#122A24]">No scholars found</h3>
          <p className="text-xs">No records matched your search query or filter selection.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#122A24]">
              <thead className="bg-[#F0F5F2] text-[#2D5A4E] font-mono uppercase text-[10px] tracking-wider border-b border-[#DCE8E0]">
                <tr>
                  <th className="p-4">Scholar</th>
                  <th className="p-4">Class &amp; Section</th>
                  <th className="p-4">Admission No</th>
                  <th className="p-4">Parent / Guardian</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Flags</th>
                  <th className="p-4 text-right">360° Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EBE5]">
                {filteredStudents.map(student => {
                  const initial = (student?.full_name || student?.admission_no || 'S').charAt(0);
                  const fullName = student?.full_name || 'Scholar';
                  const admNo = student?.admission_no || '—';
                  const classSec = `${student?.class_name || 'Class'} - ${student?.section || 'A'}`;
                  const parentName = student?.father_name || student?.guardian_name || student?.mother_name || 'Guardian';
                  const contactPhone = student?.phone || student?.guardian_phone || '';

                  return (
                    <tr key={student.id || admNo} className="hover:bg-[#F8FAF9] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-[#122A24] hover:text-emerald-800 transition">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-[#2D5A4E] font-mono">
                              Roll No: {student?.roll_no || '—'} • {student?.gender || 'Scholar'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {classSec}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-[#122A24]">
                        {admNo}
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-[#122A24]">
                          {parentName}
                        </div>
                      </td>

                      <td className="p-4">
                        {contactPhone ? (
                          <a
                            href={`tel:${contactPhone}`}
                            className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{contactPhone}</span>
                          </a>
                        ) : (
                          <span className="text-[#2D5A4E]/50 font-mono">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {String(student?.is_rte || '').toUpperCase() === 'YES' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              RTE
                            </span>
                          )}
                          {String(student?.transport_opted || '').toUpperCase() === 'YES' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
                              <Bus className="w-2.5 h-2.5" /> Bus
                            </span>
                          )}
                          {!student?.is_rte && !student?.transport_opted && (
                            <span className="text-[11px] text-[#2D5A4E]/60">Standard</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenDossier(student.id || student.admission_no)}
                          className="px-3 py-1.5 rounded-xl bg-[#122A24] text-white hover:bg-[#1C443A] text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Dossier</span>
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
          {filteredStudents.map(student => {
            const initial = (student?.full_name || student?.admission_no || 'S').charAt(0);
            const fullName = student?.full_name || 'Scholar';
            const admNo = student?.admission_no || '—';
            const classSec = `${student?.class_name || 'Class'} - ${student?.section || 'A'}`;
            const parentName = student?.father_name || student?.guardian_name || student?.mother_name || 'Guardian';
            const contactPhone = student?.phone || student?.guardian_phone || '';

            return (
              <div
                key={student.id || admNo}
                className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-sm">
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#122A24] text-sm">{fullName}</h4>
                        <p className="text-[11px] text-[#2D5A4E] font-mono">
                          Adm: <strong>{admNo}</strong> • Roll: {student?.roll_no || '1'}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {classSec}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DCE8E0] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Parent:</span>
                      <strong className="text-[#122A24]">{parentName}</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Contact:</span>
                      {contactPhone ? (
                        <a href={`tel:${contactPhone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                          {contactPhone}
                        </a>
                      ) : (
                        <span className="text-[#2D5A4E]/50">—</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Quota &amp; Fleet:</span>
                      <div className="flex items-center gap-1">
                        {String(student?.is_rte || '').toUpperCase() === 'YES' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">RTE</span>
                        )}
                        {String(student?.transport_opted || '').toUpperCase() === 'YES' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-900">BUS</span>
                        )}
                        {!student?.is_rte && !student?.transport_opted && <span>Standard</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDossier(student.id || student.admission_no)}
                  className="w-full py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Open 360° Academic Dossier</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. COMPLETE 360° STUDENT DOSSIER MODAL
          ───────────────────────────────────────────────────────────── */}
      {dossierModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setDossierModal({ isOpen: false, dossier: null, loading: false })}
          />

          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#DCE8E0] z-10 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-base">
                  {(dossierModal.dossier?.student?.full_name || 'S').charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#122A24]">
                    {dossierModal.dossier?.student?.full_name || 'Scholar Dossier'}
                  </h3>
                  <div className="text-xs text-[#2D5A4E] font-mono">
                    Adm No: {dossierModal.dossier?.student?.admission_no || '—'} • {dossierModal.dossier?.student?.class_name || 'Class'} - {dossierModal.dossier?.student?.section || 'A'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDossierModal({ isOpen: false, dossier: null, loading: false })}
                className="p-1.5 rounded-xl text-[#2D5A4E] hover:bg-[#F4F8F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dossierModal.loading || !dossierModal.dossier ? (
              <div className="p-8 text-center text-xs text-[#2D5A4E]">
                {dossierModal.error || 'Loading complete scholar dossier records...'}
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Profile & Guardian Contact */}
                <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-2">
                  <div className="text-xs uppercase font-bold text-emerald-800 font-mono">
                    Student Information &amp; Parent Contact
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#2D5A4E] block">Father / Guardian:</span>
                      <strong className="text-[#122A24]">{dossierModal.dossier.student?.father_name || dossierModal.dossier.student?.guardian_name || 'Parent'}</strong>
                    </div>
                    <div>
                      <span className="text-[#2D5A4E] block">Contact Phone:</span>
                      <a href={`tel:${dossierModal.dossier.student?.guardian_phone || dossierModal.dossier.student?.phone}`} className="font-mono text-emerald-700 font-bold hover:underline">
                        {dossierModal.dossier.student?.guardian_phone || dossierModal.dossier.student?.phone || 'N/A'}
                      </a>
                    </div>
                    <div>
                      <span className="text-[#2D5A4E] block">DOB / Admission Date:</span>
                      <span className="text-[#122A24] font-mono">{dossierModal.dossier.student?.dob || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Attendance Stats */}
                <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase font-bold text-emerald-800 font-mono flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      <span>Biometric Roll-Call &amp; Attendance Rate</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {dossierModal.dossier.attendance?.attendancePercent ?? 0}% Cumulative
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-[#2D5A4E]">Working Days</div>
                      <div className="font-black text-[#122A24]">{dossierModal.dossier.attendance?.totalWorkingDays ?? 0}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-emerald-700">Present</div>
                      <div className="font-black text-emerald-800">{dossierModal.dossier.attendance?.presentDays ?? 0}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-rose-700">Absent</div>
                      <div className="font-black text-rose-800">{dossierModal.dossier.attendance?.absentDays ?? 0}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-amber-700">Leaves</div>
                      <div className="font-black text-amber-800">{dossierModal.dossier.attendance?.leaveDays ?? 0}</div>
                    </div>
                  </div>
                </div>

                {/* 3. Fee Master Clearance */}
                <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase font-bold text-emerald-800 font-mono flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Fee Master &amp; Clearance Overview</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      dossierModal.dossier.fees?.status === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {dossierModal.dossier.fees?.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-[#2D5A4E]">Billed</div>
                      <div className="font-black font-mono text-[#122A24]">₹{(dossierModal.dossier.fees?.totalBilled ?? 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-emerald-700">Paid</div>
                      <div className="font-black font-mono text-emerald-800">₹{(dossierModal.dossier.fees?.totalPaid ?? 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-rose-700">Pending Dues</div>
                      <div className="font-black font-mono text-rose-800">₹{(dossierModal.dossier.fees?.totalPending ?? 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* 4. Academic Marks & Broadsheet */}
                <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-3">
                  <div className="text-xs uppercase font-bold text-emerald-800 font-mono flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Assessments &amp; CBSE Examination Broadsheet</span>
                  </div>
                  {dossierModal.dossier.marks && dossierModal.dossier.marks.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white rounded-xl border border-[#DCE8E0] overflow-hidden">
                        <thead className="bg-[#E9F2EC] text-[#2D5A4E] text-[10px] font-mono uppercase">
                          <tr>
                            <th className="p-2.5">Assessment</th>
                            <th className="p-2.5">Subject</th>
                            <th className="p-2.5 text-center">Marks Obtained</th>
                            <th className="p-2.5 text-center">Max Marks</th>
                            <th className="p-2.5 text-right">CBSE Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2EBE5]">
                          {dossierModal.dossier.marks.map((m, mIdx) => (
                            <tr key={mIdx}>
                              <td className="p-2.5 font-bold text-[#122A24]">{m.exam_name}</td>
                              <td className="p-2.5">{m.subject}</td>
                              <td className="p-2.5 text-center font-mono font-bold">{m.marks_obtained}</td>
                              <td className="p-2.5 text-center font-mono text-[#2D5A4E]">{m.max_marks}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-800">{m.grade || 'A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[#2D5A4E] bg-white rounded-xl border border-[#DCE8E0]">
                      No published assessment records found for current term.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
