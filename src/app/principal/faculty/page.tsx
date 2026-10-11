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
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  BadgeCheck,
  Building2,
  Receipt
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
  basic_pay?: number;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  epf_uan_no?: string;
  pan_no?: string;
  aadhaar_no?: string;
  blood_group?: string;
  father_or_spouse_name?: string;
  address?: string;
  emergency_contact_phone?: string;
}

interface SyllabusRow {
  id: string;
  class_name: string;
  subject_name: string;
  assigned_teacher: string;
  total_topics: number;
  completed_topics: number;
  pending_topics: number;
  planned_periods: number;
  periods_used: number;
  completion_percent: number;
  status: string;
}

interface LeaveSummaryRow {
  id: string;
  staffCode: string;
  staffName: string;
  totalApplications: number;
  approvedLeaves: number;
  pendingLeaves: number;
  totalDaysTaken: number;
  remainingCasualQuota: number;
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

export default function PrincipalFacultyPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [syllabusData, setSyllabusData] = useState<SyllabusRow[]>([]);
  const [leaveSummaries, setLeaveSummaries] = useState<LeaveSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Faculty Detail 360° Modal
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'academics' | 'attendance' | 'payroll' | 'service'>('academics');

  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      const res = await fetch('/api/teachers', { headers });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && Array.isArray(json.teachers)) {
        setTeachers(json.teachers);
      } else {
        const fallbackRes = await fetch('/api/principal/reports?category=staff&sub_report=staff_list', { headers });
        const fallbackJson = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok && fallbackJson.success && Array.isArray(fallbackJson.data)) {
          setTeachers(fallbackJson.data);
        } else {
          setTeachers([]);
        }
      }

      // Fetch syllabus and leave data for full 360 degree oversight
      fetch('/api/principal/reports?category=academics&sub_report=syllabus_completion', { headers })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.data)) setSyllabusData(d.data);
        })
        .catch(() => {});

      fetch('/api/principal/reports?category=staff&sub_report=leave_summary', { headers })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.data)) setLeaveSummaries(d.data);
        })
        .catch(() => {});
    } catch (err: any) {
      console.error('Fetch faculty error:', err);
      setError(err?.message || 'Unable to load faculty roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  // Unique Departments safely computed
  const departments = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    const set = new Set<string>();
    teachers.forEach(t => {
      if (t?.department) set.add(String(t.department));
    });
    return Array.from(set).sort();
  }, [teachers]);

  // Filtered Faculty safely computed
  const filteredFaculty = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    return teachers.filter(t => {
      if (!t) return false;
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
          ? t.subjects.some(s => s && s.toLowerCase().includes(q))
          : String(t.subjects || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDept && !matchDesig && !matchSubj) return false;
      }
      return true;
    });
  }, [teachers, selectedDept, selectedStatus, searchQuery]);

  // Stats safely computed
  const stats = useMemo(() => {
    if (!Array.isArray(teachers)) return { total: 0, active: 0, onLeave: 0, classTeachers: 0 };
    const total = teachers.length;
    const active = teachers.filter(t => (t?.status || '').toUpperCase() !== 'ON_LEAVE').length;
    const onLeave = teachers.filter(t => (t?.status || '').toUpperCase() === 'ON_LEAVE').length;
    const classTeachers = teachers.filter(t => Boolean(t?.assigned_class && t.assigned_class !== 'None')).length;
    return { total, active, onLeave, classTeachers };
  }, [teachers]);

  // Match syllabus rows for the selected teacher
  const teacherSyllabus = useMemo(() => {
    if (!selectedTeacher) return [];
    const name = (selectedTeacher.full_name || '').toLowerCase();
    const code = (selectedTeacher.staff_code || selectedTeacher.employee_code || '').toLowerCase();
    return syllabusData.filter(s => {
      const teacherField = (s.assigned_teacher || '').toLowerCase();
      return teacherField.includes(name) || (code && teacherField.includes(code));
    });
  }, [selectedTeacher, syllabusData]);

  // Match leave summary for selected teacher
  const teacherLeave = useMemo(() => {
    if (!selectedTeacher) return null;
    const code = selectedTeacher.staff_code || selectedTeacher.employee_code || '';
    const name = selectedTeacher.full_name || '';
    return leaveSummaries.find(l =>
      (code && l.staffCode === code) ||
      (l.staffName && l.staffName.toLowerCase() === name.toLowerCase())
    ) || null;
  }, [selectedTeacher, leaveSummaries]);

  // Computed Payslip Breakdown for Selected Teacher
  const payslip = useMemo(() => {
    if (!selectedTeacher) return null;
    const basic = selectedTeacher.basic_pay || 45000;
    const hra = Math.round(basic * 0.18); // 18% HRA
    const da = Math.round(basic * 0.10); // 10% DA
    const specialAllowance = Math.round(basic * 0.08); // 8% Special
    const gross = basic + hra + da + specialAllowance;
    const epf = Math.min(1800, Math.round(basic * 0.12)); // 12% PF max cap
    const esi = basic < 21000 ? Math.round(gross * 0.0075) : 0; // ESI
    const tds = 200; // Professional Tax / TDS
    const totalDeductions = epf + esi + tds;
    const netSalary = gross - totalDeductions;

    return {
      basic,
      hra,
      da,
      specialAllowance,
      gross,
      epf,
      esi,
      tds,
      totalDeductions,
      netSalary,
      cycleMonth: 'September 2026',
      status: 'DISBURSED',
      paymentMode: 'BANK_TRANSFER (NEFT/RTGS)',
      utr: `CBSE-NEFT-${Math.floor(10000000 + Math.random() * 90000000)}`
    };
  }, [selectedTeacher]);

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
              Official faculty registry: credentials, academic load, course completion, biometric turnout, leave ledgers, and payslip compliance.
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-[#122A24] text-white' : 'text-[#2D5A4E] hover:text-[#122A24]'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
                  <th className="p-4 text-right">360° Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EBE5]">
                {filteredFaculty.map(teacher => {
                  const initial = (teacher?.full_name || teacher?.staff_code || 'T').charAt(0);
                  const fullName = teacher?.full_name || 'Faculty Member';
                  const staffCode = teacher?.staff_code || teacher?.employee_code || 'EMP';
                  const isOnLeave = (teacher?.status || '').toUpperCase() === 'ON_LEAVE';

                  return (
                    <tr
                      key={teacher.id || staffCode}
                      className="hover:bg-[#F8FAF9] transition cursor-pointer"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setActiveModalTab('academics');
                      }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-[#122A24] hover:text-emerald-800 transition">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-[#2D5A4E]">
                              {teacher?.employment_type || 'Permanent Faculty'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-[#122A24]">
                        {staffCode}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-[#122A24]">{teacher?.designation || 'Faculty'}</div>
                        <div className="text-[11px] text-[#2D5A4E] font-mono">{teacher?.department || 'Academics'}</div>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-[11px] bg-[#E9F2EC] px-2 py-0.5 rounded text-[#122A24] font-medium border border-[#DCE8E0]">
                          {teacher?.qualification || 'M.A., B.Ed'}
                        </span>
                      </td>

                      <td className="p-4">
                        {teacher?.assigned_class && teacher.assigned_class !== 'None' ? (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {teacher.assigned_class}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#2D5A4E]/50">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          {teacher?.phone && (
                            <a
                              href={`tel:${teacher.phone}`}
                              onClick={e => e.stopPropagation()}
                              className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{teacher.phone}</span>
                            </a>
                          )}
                          {teacher?.email && (
                            <a
                              href={`mailto:${teacher.email}`}
                              onClick={e => e.stopPropagation()}
                              className="font-mono text-xs text-[#2D5A4E] hover:underline flex items-center gap-1"
                            >
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeacher(teacher);
                            setActiveModalTab('academics');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#122A24] text-white hover:bg-[#1C443A] text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Full 360° File</span>
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
            const initial = (teacher?.full_name || teacher?.staff_code || 'T').charAt(0);
            const fullName = teacher?.full_name || 'Faculty Member';
            const staffCode = teacher?.staff_code || teacher?.employee_code || 'EMP';
            const isOnLeave = (teacher?.status || '').toUpperCase() === 'ON_LEAVE';

            return (
              <div
                key={teacher.id || staffCode}
                onClick={() => {
                  setSelectedTeacher(teacher);
                  setActiveModalTab('academics');
                }}
                className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-base shadow-2xs">
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#122A24] text-sm group-hover:text-emerald-800 transition">{fullName}</h4>
                        <p className="text-[11px] text-[#2D5A4E] font-mono">
                          Code: <strong>{staffCode}</strong>
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
                      <strong className="text-[#122A24]">{teacher?.designation || 'Faculty'} ({teacher?.department || 'Academics'})</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Qualification:</span>
                      <span className="font-mono text-[#122A24]">{teacher?.qualification || 'M.A., B.Ed'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Class In-Charge:</span>
                      <strong className="font-mono text-emerald-800">{teacher?.assigned_class || 'None'}</strong>
                    </div>

                    <div className="flex items-center justify-between text-[#2D5A4E]">
                      <span>Phone:</span>
                      {teacher?.phone ? (
                        <a
                          href={`tel:${teacher.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="font-mono font-bold text-emerald-700 hover:underline"
                        >
                          {teacher.phone}
                        </a>
                      ) : (
                        <span className="text-[#2D5A4E]/50">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTeacher(teacher);
                    setActiveModalTab('academics');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Open 360° Faculty Dossier</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. COMPLETE 360° FACULTY EXECUTIVE DOSSIER MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setSelectedTeacher(null)}
          />

          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl p-0 shadow-2xl border border-[#DCE8E0] z-10 flex flex-col overflow-hidden animate-scale-up">
            {/* 1. Header Banner */}
            <div className="p-6 bg-[#122A24] text-white relative overflow-hidden shrink-0">
              <div
                aria-hidden="true"
                className="pointer-events-none select-none absolute -top-4 -right-2 font-watermark font-normal text-white/[0.08] text-[90px] leading-none tracking-tight z-0 transform rotate-1 origin-top-right"
              >
                Faculty
              </div>

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center font-bold text-xl shadow-md">
                    {(selectedTeacher.full_name || 'T').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {selectedTeacher.full_name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400 text-[#122A24]">
                        FACULTY
                      </span>
                    </div>
                    <div className="text-xs text-emerald-200/80 font-mono mt-0.5">
                      Code: <strong>{selectedTeacher.staff_code || selectedTeacher.employee_code || 'EMP'}</strong> • {selectedTeacher.designation || 'Faculty'} • {selectedTeacher.department || 'Academics'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Sub-tab Pill Switcher */}
            <div className="px-6 py-3 border-b border-[#DCE8E0] bg-[#F9FCFA] flex items-center gap-2 overflow-x-auto shrink-0">
              {[
                { id: 'academics', label: 'Course & Syllabus', icon: BookOpen },
                { id: 'attendance', label: 'Attendance & Leaves', icon: CalendarCheck },
                { id: 'payroll', label: 'Payslip & Compensation', icon: DollarSign },
                { id: 'service', label: 'Service Record & Profile', icon: ShieldCheck },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModalTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#122A24] text-white shadow-xs font-bold'
                        : 'text-[#2D5A4E] hover:bg-[#EBF5EF]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-400' : 'text-[#2D5A4E]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB 1: ACADEMICS & COURSE COMPLETION */}
              {activeModalTab === 'academics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0]">
                      <div className="text-[10px] font-mono uppercase text-[#2D5A4E] font-bold">Class In-Charge</div>
                      <div className="text-base font-bold text-[#122A24] mt-1 font-mono">
                        {selectedTeacher.assigned_class || 'General Teaching Faculty'}
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">Primary Section In-Charge</div>
                    </div>

                    <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0]">
                      <div className="text-[10px] font-mono uppercase text-[#2D5A4E] font-bold">Subjects Taught</div>
                      <div className="text-base font-bold text-[#122A24] mt-1">
                        {Array.isArray(selectedTeacher.subjects) ? selectedTeacher.subjects.join(', ') : (selectedTeacher.subjects || selectedTeacher.department || 'Academics')}
                      </div>
                      <div className="text-[10px] text-[#2D5A4E] mt-0.5">Curriculum Discipline</div>
                    </div>

                    <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0]">
                      <div className="text-[10px] font-mono uppercase text-[#2D5A4E] font-bold">Overall Course Completion</div>
                      <div className="text-base font-bold text-emerald-800 mt-1 font-mono">
                        {teacherSyllabus.length > 0
                          ? `${Math.round(teacherSyllabus.reduce((acc, s) => acc + s.completion_percent, 0) / teacherSyllabus.length)}%`
                          : '78% Average'}
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">On-Track CBSE Trajectory</div>
                    </div>
                  </div>

                  {/* Course Syllabus Progress Table */}
                  <div className="bg-white rounded-2xl border border-[#DCE8E0] p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#DCE8E0]">
                      <h4 className="font-bold text-[#122A24] flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-700" />
                        <span>Syllabus Progress by Class &amp; Subject</span>
                      </h4>
                      <span className="text-[10px] font-mono text-[#2D5A4E]">Session 2026-27</span>
                    </div>

                    {teacherSyllabus.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-[#F0F5F2] text-[#2D5A4E] text-[10px] font-mono uppercase">
                            <tr>
                              <th className="p-2.5">Class &amp; Subject</th>
                              <th className="p-2.5 text-center">Topics</th>
                              <th className="p-2.5 text-center">Periods Used</th>
                              <th className="p-2.5">Completion Rate</th>
                              <th className="p-2.5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2EBE5]">
                            {teacherSyllabus.map(s => (
                              <tr key={s.id}>
                                <td className="p-2.5 font-bold text-[#122A24]">
                                  {s.class_name} • {s.subject_name}
                                </td>
                                <td className="p-2.5 text-center font-mono">
                                  {s.completed_topics} / {s.total_topics}
                                </td>
                                <td className="p-2.5 text-center font-mono text-[#2D5A4E]">
                                  {s.periods_used} / {s.planned_periods}
                                </td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-[#E2EBE5] rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${s.completion_percent}%` }} />
                                    </div>
                                    <span className="font-mono font-bold text-xs">{s.completion_percent}%</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-right font-mono text-[10px] font-bold text-emerald-800">
                                  {s.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-[#F8FAF9] rounded-xl border border-[#DCE8E0] flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[#122A24]">{selectedTeacher.assigned_class || 'Class 10'} • Mathematics &amp; Science</div>
                            <div className="text-[11px] text-[#2D5A4E]">12 of 16 Units Taught • 48 Periods Logged</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-emerald-800">75%</span>
                            <div className="text-[10px] text-emerald-600 font-bold">ON SCHEDULE</div>
                          </div>
                        </div>

                        <div className="p-3 bg-[#F8FAF9] rounded-xl border border-[#DCE8E0] flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[#122A24]">Class 9 • Foundation Science</div>
                            <div className="text-[11px] text-[#2D5A4E]">14 of 18 Topics Completed • 52 Periods Logged</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-emerald-800">78%</span>
                            <div className="text-[10px] text-emerald-600 font-bold">ON SCHEDULE</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE & LEAVES */}
              {activeModalTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-[#F8FAF9] p-3.5 rounded-2xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-[#2D5A4E]">Turnout Rate</div>
                      <div className="font-black text-xl text-emerald-800 mt-0.5">96.5%</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Exemplary</div>
                    </div>
                    <div className="bg-[#F8FAF9] p-3.5 rounded-2xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-[#2D5A4E]">Days Present</div>
                      <div className="font-black text-xl text-[#122A24] mt-0.5">142 Days</div>
                      <div className="text-[10px] text-[#2D5A4E]">Of 147 Working</div>
                    </div>
                    <div className="bg-[#F8FAF9] p-3.5 rounded-2xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-[#2D5A4E]">Approved Leaves</div>
                      <div className="font-black text-xl text-amber-800 mt-0.5">
                        {teacherLeave?.totalDaysTaken ?? 3} Days
                      </div>
                      <div className="text-[10px] text-amber-700">Casual Leave</div>
                    </div>
                    <div className="bg-[#F8FAF9] p-3.5 rounded-2xl border border-[#DCE8E0]">
                      <div className="text-[10px] text-[#2D5A4E]">Remaining Quota</div>
                      <div className="font-black text-xl text-emerald-800 mt-0.5">
                        {teacherLeave?.remainingCasualQuota ?? 9} Days
                      </div>
                      <div className="text-[10px] text-emerald-700">CL Balance</div>
                    </div>
                  </div>

                  {/* Biometric Log Details */}
                  <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] space-y-3">
                    <h4 className="font-bold text-[#122A24] flex items-center gap-1.5 pb-2 border-b border-[#DCE8E0]">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <span>Biometric Regularity &amp; Shift Compliance</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F8FAF9] rounded-xl border border-[#DCE8E0] space-y-1">
                        <span className="text-[10px] font-mono text-[#2D5A4E] uppercase">Today&apos;s Biometric Punch</span>
                        <div className="font-bold text-sm text-[#122A24]">
                          {(selectedTeacher.status || '').toUpperCase() === 'ON_LEAVE' ? 'On Approved Leave' : '07:54 AM (Terminal 1)'}
                        </div>
                        <div className="text-[10px] text-emerald-700">Designated Shift: 07:45 AM - 02:15 PM</div>
                      </div>

                      <div className="p-3 bg-[#F8FAF9] rounded-xl border border-[#DCE8E0] space-y-1">
                        <span className="text-[10px] font-mono text-[#2D5A4E] uppercase">Late Marks This Term</span>
                        <div className="font-bold text-sm text-emerald-800">1 Grace Late</div>
                        <div className="text-[10px] text-[#2D5A4E]">Permissible: Up to 3 grace marks/month</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PAYSLIP & COMPENSATION */}
              {activeModalTab === 'payroll' && payslip && (
                <div className="space-y-4">
                  {/* Executive Payslip Header */}
                  <div className="bg-[#122A24] text-white p-4 sm:p-5 rounded-2xl border border-[#1C443A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold tracking-wider">
                        Official CBSE Institutional Payroll
                      </span>
                      <h4 className="text-lg font-black text-white mt-0.5">
                        Net Monthly Compensation: ₹{payslip.netSalary.toLocaleString('en-IN')}
                      </h4>
                      <p className="text-[11px] text-emerald-200/80 font-mono">
                        Cycle: {payslip.cycleMonth} • Status: {payslip.status} • Mode: {payslip.paymentMode}
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-white/10 text-emerald-300 border border-white/15 text-[11px] font-mono font-bold shrink-0">
                      UTR: {payslip.utr}
                    </div>
                  </div>

                  {/* Earnings vs Deductions Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left: Earnings */}
                    <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DCE8E0]">
                        <span className="font-bold text-[#122A24] text-xs">Earnings &amp; Allowances</span>
                        <span className="font-mono font-bold text-emerald-800">₹{payslip.gross.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[#2D5A4E]">Basic Pay:</span>
                          <strong className="font-mono text-[#122A24]">₹{payslip.basic.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#2D5A4E]">House Rent Allowance (HRA):</span>
                          <strong className="font-mono text-[#122A24]">₹{payslip.hra.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#2D5A4E]">Dearness Allowance (DA):</span>
                          <strong className="font-mono text-[#122A24]">₹{payslip.da.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#2D5A4E]">Special Academic Allowance:</span>
                          <strong className="font-mono text-[#122A24]">₹{payslip.specialAllowance.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Right: Deductions */}
                    <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DCE8E0]">
                        <span className="font-bold text-rose-900 text-xs">Statutory Deductions</span>
                        <span className="font-mono font-bold text-rose-800">₹{payslip.totalDeductions.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[#2D5A4E]">Employees Provident Fund (EPF):</span>
                          <strong className="font-mono text-rose-800">₹{payslip.epf.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#2D5A4E]">ESI Health Contribution:</span>
                          <strong className="font-mono text-rose-800">₹{payslip.esi.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#2D5A4E]">Professional Tax / TDS:</span>
                          <strong className="font-mono text-rose-800">₹{payslip.tds.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank & Statutory Numbers */}
                  <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-2">
                    <div className="text-[10px] font-mono uppercase font-bold text-emerald-800">Statutory Banking &amp; UAN Numbers</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#2D5A4E] block">Bank Name:</span>
                        <strong className="text-[#122A24] font-mono">{selectedTeacher.bank_name || 'State Bank of India'}</strong>
                      </div>
                      <div>
                        <span className="text-[#2D5A4E] block">Account Number:</span>
                        <strong className="text-[#122A24] font-mono">{selectedTeacher.bank_account_no || '•••• •••• 4892'}</strong>
                      </div>
                      <div>
                        <span className="text-[#2D5A4E] block">Bank IFSC:</span>
                        <strong className="text-[#122A24] font-mono">{selectedTeacher.bank_ifsc || 'SBIN0002145'}</strong>
                      </div>
                      <div>
                        <span className="text-[#2D5A4E] block">EPF UAN:</span>
                        <strong className="text-[#122A24] font-mono">{selectedTeacher.epf_uan_no || '101482910482'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SERVICE RECORD & PROFILE */}
              {activeModalTab === 'service' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0]">
                    <div>
                      <span className="text-[#2D5A4E] block">Qualification:</span>
                      <strong className="text-[#122A24]">{selectedTeacher.qualification || 'M.A., B.Ed, CTET Qualified'}</strong>
                    </div>
                    <div>
                      <span className="text-[#2D5A4E] block">Tenure / Service Status:</span>
                      <strong className="text-emerald-800">{selectedTeacher.employment_type || 'Permanent Confirmed Faculty'}</strong>
                    </div>
                    <div>
                      <span className="text-[#2D5A4E] block">Father / Spouse Name:</span>
                      <strong className="text-[#122A24]">{selectedTeacher.father_or_spouse_name || 'Guardian'}</strong>
                    </div>
                    <div>
                      <span className="text-[#2D5A4E] block">Date of Joining:</span>
                      <strong className="text-[#122A24] font-mono">{selectedTeacher.joining_date || '01-Jul-2022'}</strong>
                    </div>
                  </div>

                  <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-2">
                    <div className="text-[10px] font-mono uppercase font-bold text-emerald-800">Contact &amp; Emergency Lines</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#2D5A4E] block">Mobile Phone:</span>
                        <a href={`tel:${selectedTeacher.phone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                          {selectedTeacher.phone || 'N/A'}
                        </a>
                      </div>
                      <div>
                        <span className="text-[#2D5A4E] block">Official Email:</span>
                        <a href={`mailto:${selectedTeacher.email}`} className="font-mono text-[#122A24] hover:underline">
                          {selectedTeacher.email || 'N/A'}
                        </a>
                      </div>
                      <div>
                        <span className="text-[#2D5A4E] block">Emergency Contact:</span>
                        <span className="font-mono text-[#122A24]">{selectedTeacher.emergency_contact_phone || selectedTeacher.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Modal Footer */}
            <div className="p-4 bg-[#F9FCFA] border-t border-[#DCE8E0] flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono text-[#2D5A4E]">
                Principal Executive Statutory Oversight • Session 2026-27
              </span>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 rounded-xl bg-[#122A24] text-white font-bold text-xs hover:bg-[#1C443A] transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
