/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileBarChart2,
  CalendarCheck,
  DollarSign,
  GraduationCap,
  Users,
  Briefcase,
  Download,
  Printer,
  Filter,
  Search,
  Eye,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  X,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { PrincipalStudentDossier } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type ReportCategory = 'attendance' | 'fees' | 'academics' | 'students' | 'staff';

export default function PrincipalReportsPage() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('attendance');
  const [activeSubReport, setActiveSubReport] = useState<string>('class_wise');

  // Filter States
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('SEP');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Report Data State
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Student Dossier Modal State
  const [dossierModal, setDossierModal] = useState<{
    isOpen: boolean;
    dossier: PrincipalStudentDossier | null;
    loading: boolean;
  }>({
    isOpen: false,
    dossier: null,
    loading: false
  });

  // Report Card Preview Modal State
  const [reportCardModal, setReportCardModal] = useState<{
    isOpen: boolean;
    template: any | null;
    student: any | null;
  }>({
    isOpen: false,
    template: null,
    student: null
  });

  const categories: Array<{ id: ReportCategory; label: string; icon: any; count: number }> = [
    { id: 'attendance', label: 'Attendance Registers', icon: CalendarCheck, count: 4 },
    { id: 'fees', label: 'Fee Master & Collections', icon: DollarSign, count: 4 },
    { id: 'academics', label: 'Academics & Examination', icon: GraduationCap, count: 4 },
    { id: 'students', label: 'Student Enrolment & Dossier', icon: Users, count: 2 },
    { id: 'staff', label: 'Staff & Faculty Registers', icon: Briefcase, count: 3 },
  ];

  const subReportsMap: Record<ReportCategory, Array<{ id: string; label: string; desc: string }>> = {
    attendance: [
      { id: 'class_wise', label: 'Class-wise Attendance', desc: 'Daily attendance rates across all classes' },
      { id: 'date_wise', label: 'Date-wise Trajectory', desc: 'Chronological roll call percentage trend' },
      { id: 'student_absent_list', label: 'Student Absent List', desc: 'Scholars marked absent with parent contacts' },
      { id: 'staff_attendance', label: 'Staff Attendance', desc: 'Daily biometrics and faculty leave roll' },
    ],
    fees: [
      { id: 'month_class_collection', label: 'Month & Class Collection', desc: 'Month-wise collection register by class' },
      { id: 'pending_defaulters', label: 'Pending / Defaulters List', desc: 'Scholars with pending balances and phone contacts' },
      { id: 'discount_sibling_summary', label: 'Sibling & Discount Concessions', desc: 'Sibling rules & fee concessions summary' },
      { id: 'annual_fee_pending', label: 'Annual Fee Pending Report', desc: 'Scholars with outstanding Annual Composite Fees' },
    ],
    academics: [
      { id: 'exam_class_result', label: 'Exam-wise Class Result', desc: 'Full broadsheet of marks, grades and pass/fail' },
      { id: 'subject_performance', label: 'Subject Performance', desc: 'Class averages, highest scores and pass %' },
      { id: 'toppers', label: 'School & Class Toppers', desc: 'Top academic rank holders' },
      { id: 'syllabus_completion', label: 'Syllabus Completion', desc: 'Class, subject & month-wise planned vs completed %' },
      { id: 'published_report_cards', label: 'Published Report Cards', desc: 'View official CBSE Term Report Card previews' },
    ],
    students: [
      { id: 'class_strength', label: 'Class-wise Strength', desc: 'Boys, girls, total strength & RTE enrolment' },
      { id: 'student_dossier', label: '360° Student Dossier', desc: 'Comprehensive scholar card: attendance, fees & marks' },
    ],
    staff: [
      { id: 'staff_list', label: 'Staff & Faculty Directory', desc: 'Employee codes, designations and qualifications' },
      { id: 'class_subject_allocation', label: 'Class-Subject Allocation', desc: 'Assigned classroom & teaching workload' },
      { id: 'leave_summary', label: 'Faculty Leave Register', desc: 'Leaves applied, approved and remaining quotas' },
    ]
  };

  // Sync default subReport when category changes
  const handleCategoryChange = (cat: ReportCategory) => {
    setActiveCategory(cat);
    const firstSub = subReportsMap[cat][0]?.id || 'class_wise';
    setActiveSubReport(firstSub);
  };

  // Fetch report data from API
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        category: activeCategory,
        sub_report: activeSubReport
      });

      if (selectedClass) params.set('class_name', selectedClass);
      if (selectedSection) params.set('section', selectedSection);
      if (selectedMonth) params.set('month', selectedMonth);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (searchQuery) params.set('search', searchQuery);
      if (selectedExamId) params.set('exam_id', selectedExamId);

      const res = await fetch(`/api/principal/reports?${params.toString()}`);
      if (!res.ok) throw new Error(`Report load failed (${res.status})`);
      const json = await res.json();
      if (json.success) {
        setReportData(json);
      } else {
        throw new Error(json.error || 'Failed to generate report.');
      }
    } catch (err: any) {
      console.error('Report fetch error:', err);
      setError(err.message || 'Unable to generate requested report.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeSubReport, selectedClass, selectedSection, selectedMonth, dateFrom, dateTo, searchQuery, selectedExamId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Open Student Dossier
  const handleOpenDossier = async (sId: string) => {
    try {
      setDossierModal({ isOpen: true, dossier: null, loading: true });
      const res = await fetch(`/api/principal/reports?category=students&sub_report=student_dossier&student_id=${sId}`);
      const json = await res.json();
      if (res.ok && json.success && json.dossier) {
        setDossierModal({ isOpen: true, dossier: json.dossier, loading: false });
      } else {
        alert(json.error || 'Failed to load dossier');
        setDossierModal({ isOpen: false, dossier: null, loading: false });
      }
    } catch (e: any) {
      alert(e.message || 'Error loading student dossier');
      setDossierModal({ isOpen: false, dossier: null, loading: false });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // EXCEL / CSV EXPORT ENGINE
  // ─────────────────────────────────────────────────────────────
  const handleDownloadExcel = () => {
    if (!reportData?.data || !Array.isArray(reportData.data) || reportData.data.length === 0) {
      alert('No data rows to export.');
      return;
    }

    const rows = reportData.data;
    const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object');

    let csvContent = '\uFEFF'; // UTF-8 BOM
    // Header row
    csvContent += keys.map(k => `"${k.toUpperCase().replace(/_/g, ' ')}"`).join(',') + '\r\n';

    // Data rows
    for (const row of rows) {
      const line = keys.map(k => {
        let val = row[k];
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += line + '\r\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DPS_Report_${activeCategory}_${activeSubReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────
  // HIGH-FIDELITY INSTITUTIONAL PDF PRINT ENGINE
  // ─────────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & EXPORT ACTIONS WITH SIGNATURE WATERMARK TYPOGRAPHY
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 sm:p-8 relative overflow-hidden">
        {/* Signature watermark typography */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[210px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
          >
            Reports
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
          >
            Registers
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F2EC] text-[#122A24] text-xs font-semibold mb-2 border border-[#DCE8E0]">
              <FileBarChart2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Statutory CBSE Broadsheets &amp; Dossiers</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#122A24] tracking-tight">
              Institutional Reports &amp; Broad-Sheets
            </h1>
            <p className="text-xs sm:text-sm text-[#2D5A4E] mt-1 max-w-2xl leading-relaxed">
              Verified read-only registers across daily roll-call attendance, fee master collections, CBSE assessments, and faculty files.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-semibold text-[#122A24] transition shadow-2xs cursor-pointer active:scale-95"
              title="Download formatted spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Download Excel</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Print or Save PDF document"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CATEGORY SELECTOR (5 TABS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-[#E9F2EC] p-1.5 rounded-2xl border border-[#DCE8E0]">
        {categories.map(cat => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs transition cursor-pointer ${
                active
                  ? 'bg-[#122A24] text-white shadow-sm font-bold'
                  : 'text-[#2D5A4E] hover:bg-white/60 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-[#2D5A4E]'}`} />
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SUB-REPORT BUTTONS & DESCRIPTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {subReportsMap[activeCategory].map(sub => {
          const active = activeSubReport === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubReport(sub.id)}
              className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
                active
                  ? 'bg-white border-[#10B981] shadow-xs'
                  : 'bg-white/70 border-[#DCE8E0] hover:bg-white hover:border-[#10B981]/50'
              }`}
            >
              <div>
                <div className={`text-xs font-bold ${active ? 'text-[#122A24]' : 'text-[#2D5A4E]'}`}>
                  {sub.label}
                </div>
                <div className="text-[11px] text-[#2D5A4E]/80 mt-1 line-clamp-1">
                  {sub.desc}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold ${active ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {active ? '● ACTIVE REGISTER' : 'CLICK TO VIEW'}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. UNIFIED FILTERS BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#122A24] shrink-0 font-mono">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>FILTERS:</span>
        </div>

        {/* Class Filter */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-medium text-[#122A24] focus:outline-hidden"
        >
          <option value="">All CBSE Classes</option>
          {['Playgroup', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Section Filter */}
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-medium text-[#122A24] focus:outline-hidden"
        >
          <option value="">All Sections</option>
          {['A', 'B', 'C', 'D'].map(sec => (
            <option key={sec} value={sec}>Section {sec}</option>
          ))}
        </select>

        {/* Month Filter (for fee & attendance trends) */}
        {['fees', 'attendance'].includes(activeCategory) && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-medium text-[#122A24] focus:outline-hidden"
          >
            {['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'].map(m => (
              <option key={m} value={m}>Academic Month: {m}</option>
            ))}
          </select>
        )}

        {/* Date Filter */}
        {activeCategory === 'attendance' && (
          <div className="flex items-center gap-1.5 text-xs text-[#2D5A4E]">
            <span>Date:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono text-[#122A24]"
            />
          </div>
        )}

        {/* Search Filter */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#2D5A4E]/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records, names, admission numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs focus:outline-hidden text-[#122A24]"
          />
        </div>

        {/* Clear Filters */}
        {(selectedClass || selectedSection || searchQuery || dateFrom) && (
          <button
            onClick={() => {
              setSelectedClass('');
              setSelectedSection('');
              setSearchQuery('');
              setDateFrom('');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. REPORT DATA DISPLAY
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-64 bg-white rounded-3xl border border-[#DCE8E0] animate-pulse" />
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center max-w-md mx-auto my-6">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#122A24]">Error Generating Report</h3>
          <p className="text-xs text-[#2D5A4E] mt-1 mb-3">{error}</p>
          <button
            onClick={fetchReport}
            className="px-4 py-1.5 rounded-xl bg-[#122A24] text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
          {/* Top Report Info Bar */}
          <div className="p-4 sm:p-5 border-b border-[#DCE8E0] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAF9]">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-emerald-800 font-mono">
                {activeCategory} &gt; {activeSubReport.replace(/_/g, ' ')}
              </div>
              <div className="text-sm font-bold text-[#122A24] mt-0.5">
                Official Broad-Sheet Register ({reportData.count || (reportData.data?.length) || 0} Total Records)
              </div>
            </div>

            {reportData.summaryKpis && Array.isArray(reportData.summaryKpis) && (
              <div className="flex flex-wrap items-center gap-2">
                {reportData.summaryKpis.slice(0, 3).map((kpi: any, idx: number) => (
                  <div key={idx} className="px-3 py-1 bg-white rounded-xl border border-[#DCE8E0] text-[11px] font-mono">
                    <span className="text-[#2D5A4E]">{kpi.label}: </span>
                    <strong className="text-[#122A24] font-bold">{kpi.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {activeSubReport === 'student_dossier' && reportData.students ? (
              /* Student Dossier Selector Table */
              <table className="w-full text-left text-xs text-[#122A24]">
                <thead className="bg-[#F0F5F2] text-[#2D5A4E] font-mono uppercase text-[10px] tracking-wider border-b border-[#DCE8E0]">
                  <tr>
                    <th className="p-3.5">Admission No</th>
                    <th className="p-3.5">Scholar Name</th>
                    <th className="p-3.5">Class - Section</th>
                    <th className="p-3.5">Guardian / Father</th>
                    <th className="p-3.5">Mobile Contact</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EBE5]">
                  {reportData.students.map((st: any) => (
                    <tr key={st.id} className="hover:bg-[#F8FAF9] transition">
                      <td className="p-3.5 font-mono font-bold text-emerald-800">{st.admission_no}</td>
                      <td className="p-3.5 font-bold text-[#122A24]">{st.full_name}</td>
                      <td className="p-3.5 font-mono">{st.class_name} - {st.section}</td>
                      <td className="p-3.5">{st.father_name || 'Guardian'}</td>
                      <td className="p-3.5 font-mono">{st.phone || 'N/A'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenDossier(st.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View 360° Dossier</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeSubReport === 'published_report_cards' && reportData.templates ? (
              /* Published Report Card Builder View */
              <div className="p-6 space-y-6">
                <div className="text-xs text-[#2D5A4E] bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                  <strong>Published Official Templates:</strong> Only templates with finalized assessment weightages authorized by School Administration appear below.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportData.templates.map((tpl: any) => (
                    <div key={tpl.id} className="p-5 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {tpl.class_name}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {tpl.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#122A24]">{tpl.template_name}</h4>
                      <div className="text-xs text-[#2D5A4E]">
                        Evaluation Scheme: <strong>{tpl.term_name || 'CBSE Term 1 & 2'}</strong>
                      </div>
                      <div className="text-[11px] text-[#2D5A4E]/80">
                        Assessments: {tpl.selected_exams?.map((e: any) => `${e.exam_name} (${e.weightage_percent}%)`).join(', ')}
                      </div>
                      <div className="pt-2 border-t border-[#DCE8E0] flex items-center justify-between">
                        <span className="text-[11px] text-[#2D5A4E]">
                          Scholars enrolled: {reportData.students?.length || 0}
                        </span>
                        <button
                          onClick={() => setReportCardModal({ isOpen: true, template: tpl, student: reportData.students?.[0] || null })}
                          className="px-3 py-1.5 rounded-xl bg-[#122A24] text-white text-xs font-semibold hover:bg-[#1C443A] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Preview Sample Card</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : Array.isArray(reportData.data) && reportData.data.length > 0 ? (
              /* Dynamic Standard Table */
              <table className="w-full text-left text-xs text-[#122A24]">
                <thead className="bg-[#F0F5F2] text-[#2D5A4E] font-mono uppercase text-[10px] tracking-wider border-b border-[#DCE8E0]">
                  <tr>
                    {Object.keys(reportData.data[0])
                      .filter(k => typeof reportData.data[0][k] !== 'object')
                      .map(header => (
                        <th key={header} className="p-3.5">
                          {header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </th>
                      ))}
                    {activeCategory === 'students' && <th className="p-3.5 text-right">Dossier</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EBE5]">
                  {reportData.data.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-[#F8FAF9] transition">
                      {Object.keys(row)
                        .filter(k => typeof row[k] !== 'object')
                        .map(key => {
                          const val = row[key];
                          const isCurrency = String(key).toLowerCase().includes('paise') || String(key).toLowerCase().includes('amount') || String(key).toLowerCase().includes('due') || String(key).toLowerCase().includes('fee');
                          const isPercent = String(key).toLowerCase().includes('percent') || String(key).toLowerCase().includes('rate');

                          let displayVal = val;
                          if (isCurrency && typeof val === 'number') {
                            displayVal = `₹${(String(key).toLowerCase().includes('paise') ? Math.round(val / 100) : val).toLocaleString('en-IN')}`;
                          } else if (isPercent && typeof val === 'number') {
                            displayVal = `${val}%`;
                          }

                          return (
                            <td key={key} className="p-3.5">
                              {key === 'status' ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  String(val).toUpperCase().includes('PAID') || String(val).toUpperCase().includes('PRESENT') || String(val).toUpperCase().includes('PASSED')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : String(val).toUpperCase().includes('ABSENT') || String(val).toUpperCase().includes('DUE') || String(val).toUpperCase().includes('OVERDUE') || String(val).toUpperCase().includes('FAILED')
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {val}
                                </span>
                              ) : (
                                <span className={isCurrency ? 'font-mono font-bold text-[#122A24]' : ''}>
                                  {String(displayVal ?? '—')}
                                </span>
                              )}
                            </td>
                          );
                        })}

                      {activeCategory === 'students' && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenDossier(row.studentId || row.id)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 justify-end ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Dossier</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-[#2D5A4E]">
                <FileText className="w-10 h-10 text-[#2D5A4E]/40 mx-auto mb-2" />
                <p className="text-xs">No records found matching the active criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. 360° STUDENT DOSSIER MODAL
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
                <div className="w-10 h-10 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-bold text-sm">
                  {dossierModal.dossier?.student.full_name.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#122A24]">
                    {dossierModal.dossier?.student.full_name}
                  </h3>
                  <div className="text-xs text-[#2D5A4E] font-mono">
                    Adm No: {dossierModal.dossier?.student.admission_no} • {dossierModal.dossier?.student.class_name} - {dossierModal.dossier?.student.section}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDossierModal({ isOpen: false, dossier: null, loading: false })}
                className="p-1 rounded-lg text-[#2D5A4E] hover:bg-[#F4F8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dossierModal.loading || !dossierModal.dossier ? (
              <div className="p-8 text-center text-xs text-[#2D5A4E]">Loading dossier records...</div>
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
                      <strong className="text-[#122A24]">{dossierModal.dossier.student.father_name || dossierModal.dossier.student.guardian_name || 'Parent'}</strong>
                    </div>
                    <div>
                      <span className="text-[#2D5A4E] block">Mobile Contact:</span>
                      <strong className="text-[#122A24] font-mono">{dossierModal.dossier.student.guardian_phone || dossierModal.dossier.student.phone || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[#2D5A4E] block">Transport / Route:</span>
                      <strong className="text-[#122A24]">{dossierModal.dossier.student.transport_opted === 'YES' ? 'School Bus' : 'Self Conveynance'}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Unified Attendance History */}
                <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-emerald-800 font-mono">
                      Attendance History (Unified Record)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {dossierModal.dossier.attendance.attendancePercent}% Cumulative
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0]">
                      <div className="text-lg font-bold text-emerald-700 font-mono">{dossierModal.dossier.attendance.presentDays}</div>
                      <div className="text-[10px] text-[#2D5A4E]">Days Present</div>
                    </div>
                    <div className="p-2 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0]">
                      <div className="text-lg font-bold text-rose-700 font-mono">{dossierModal.dossier.attendance.absentDays}</div>
                      <div className="text-[10px] text-[#2D5A4E]">Days Absent</div>
                    </div>
                    <div className="p-2 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0]">
                      <div className="text-lg font-bold text-[#122A24] font-mono">{dossierModal.dossier.attendance.totalWorkingDays}</div>
                      <div className="text-[10px] text-[#2D5A4E]">Working Days</div>
                    </div>
                  </div>
                </div>

                {/* 3. Unified Fee Ledger & Vouchers */}
                <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-emerald-800 font-mono">
                      Fee Master Status (Double-Entry Ledger)
                    </span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      dossierModal.dossier.fees.totalPending === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {dossierModal.dossier.fees.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0]">
                      <div className="text-sm font-bold text-[#122A24] font-mono">₹{dossierModal.dossier.fees.totalBilled.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-[#2D5A4E]">Total Billed</div>
                    </div>
                    <div className="p-2 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0]">
                      <div className="text-sm font-bold text-emerald-700 font-mono">₹{dossierModal.dossier.fees.totalPaid.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-[#2D5A4E]">Total Paid</div>
                    </div>
                    <div className="p-2 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0]">
                      <div className="text-sm font-bold text-amber-700 font-mono">₹{dossierModal.dossier.fees.totalPending.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-[#2D5A4E]">Net Outstanding</div>
                    </div>
                  </div>
                </div>

                {/* 4. Examination Marks */}
                <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] space-y-2">
                  <div className="text-xs uppercase font-bold text-emerald-800 font-mono">
                    Subject Assessment Performance
                  </div>

                  {dossierModal.dossier.marks.length === 0 ? (
                    <div className="text-xs text-[#2D5A4E] italic">No exam marks entered for this scholar.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {dossierModal.dossier.marks.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#F8FAF9] border border-[#DCE8E0] text-xs">
                          <div className="font-bold text-[#122A24] truncate">{m.subject}</div>
                          <div className="text-emerald-700 font-mono font-bold mt-0.5">
                            {m.marks_obtained} / {m.max_marks}
                          </div>
                          {m.grade && (
                            <div className="text-[10px] text-[#2D5A4E] font-mono">Grade: {m.grade}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. SAMPLE REPORT CARD PREVIEW MODAL
          ───────────────────────────────────────────────────────────── */}
      {reportCardModal.isOpen && reportCardModal.template && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setReportCardModal({ isOpen: false, template: null, student: null })}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#DCE8E0] z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#122A24]">
                  {reportCardModal.template.template_name}
                </h3>
                <div className="text-xs text-[#2D5A4E] font-mono">
                  CBSE Assessment Standard • {reportCardModal.template.class_name}
                </div>
              </div>

              <button
                onClick={() => setReportCardModal({ isOpen: false, template: null, student: null })}
                className="p-1 rounded-lg text-[#2D5A4E] hover:bg-[#F4F8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official CBSE Card Sample Header */}
            <div className="p-6 rounded-2xl bg-[#F8FAF9] border-2 border-[#122A24] space-y-4 text-center">
              <div className="text-base font-black uppercase tracking-wider text-[#122A24]">
                DELHI PUBLIC SCHOOL
              </div>
              <div className="text-xs font-serif italic text-[#2D5A4E]">
                Affiliated to Central Board of Secondary Education (CBSE)
              </div>
              <div className="text-xs font-bold uppercase tracking-wider bg-[#122A24] text-white py-1 rounded">
                CONTINUOUS &amp; COMPREHENSIVE PROGRESS REPORT — 2026-27
              </div>

              <div className="grid grid-cols-2 text-left text-xs gap-2 pt-2 border-t border-[#DCE8E0]">
                <div>Scholar: <strong>{reportCardModal.student?.full_name || 'Aarav Sharma'}</strong></div>
                <div>Admission No: <strong>{reportCardModal.student?.admission_no || 'DPS-2026-001'}</strong></div>
                <div>Class: <strong>{reportCardModal.template.class_name}</strong></div>
                <div>Roll No: <strong>{reportCardModal.student?.roll_no || '01'}</strong></div>
              </div>

              <div className="pt-4 border-t border-[#DCE8E0] text-left">
                <div className="text-xs font-bold text-[#122A24] mb-2 font-mono">Weighted Assessment Structure:</div>
                <div className="space-y-1 text-xs">
                  {reportCardModal.template.selected_exams?.map((ex: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-1.5 bg-white rounded border border-[#DCE8E0]">
                      <span>{ex.exam_name}</span>
                      <strong className="font-mono">{ex.weightage_percent}% Weightage</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE8E0]">
              <button
                onClick={() => setReportCardModal({ isOpen: false, template: null, student: null })}
                className="px-4 py-2 rounded-xl bg-[#122A24] text-white text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
