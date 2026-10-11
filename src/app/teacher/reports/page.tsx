'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Printer, 
  RefreshCw,
  Search
} from 'lucide-react';

interface ExamItem {
  id: string;
  name: string;
}

interface Allocation {
  class_name: string;
  section: string;
  subject_name: string;
}

interface WeakStudent {
  student_id: string;
  student_name: string;
  roll_no: string;
  total_marks: number;
  max_marks: number;
  percent: number;
  grade?: string;
}

interface Topper {
  student_id: string;
  student_name: string;
  roll_no: string;
  total_marks: number;
  max_marks: number;
  grade?: string;
}

interface PerformanceStats {
  total_students: number;
  appeared: number;
  absent: number;
  average: number;
  highest: number;
  lowest: number;
  pass_percent: number;
  toppers: Topper[];
  weak_students: WeakStudent[];
  grade_distribution: Record<string, number>;
}

interface MarkRecord {
  student_id: string;
  student_name: string;
  roll_no: string;
  total_marks: number;
  max_marks: number;
  grade?: string;
  attendance_status: string;
  remarks?: string;
}

export default function SubjectReportsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [loading, setLoading] = useState(true);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [records, setRecords] = useState<MarkRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialFilters();
  }, []);

  const fetchInitialFilters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/reports');
      const data = await res.json();
      if (data.success) {
        setExams(data.exams || []);
        setAllocations(data.allocated_subjects || []);

        if (data.exams?.length > 0) {
          setSelectedExam(data.exams[0].id);
        }
        if (data.allocated_subjects?.length > 0) {
          const first = data.allocated_subjects[0];
          setSelectedClass(first.class_name);
          setSelectedSection(first.section || 'A');
          setSelectedSubject(first.subject_name);
        }
      }
    } catch (err) {
      console.error('Failed to load filters', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) return;
    try {
      setFetchingReport(true);
      const params = new URLSearchParams({
        exam_id: selectedExam,
        class_name: selectedClass,
        section: selectedSection,
        subject_name: selectedSubject,
      });
      const res = await fetch(`/api/teacher/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || null);
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to load performance report', err);
    } finally {
      setFetchingReport(false);
    }
  };

  useEffect(() => {
    if (selectedExam && selectedClass && selectedSubject) {
      loadReport();
    }
  }, [selectedExam, selectedClass, selectedSection, selectedSubject]);

  const exportExcel = () => {
    if (!records || records.length === 0) return;
    const headers = ['Roll No', 'Student Name', 'Marks Obtained', 'Max Marks', 'Percentage', 'Grade', 'Status', 'Remarks'];
    const rows = records.map(r => [
      `"${r.roll_no || ''}"`,
      `"${r.student_name}"`,
      r.attendance_status === 'ABSENT' ? 'ABS' : r.total_marks,
      r.max_marks,
      r.attendance_status === 'ABSENT' ? '0%' : `${Math.round((r.total_marks / r.max_marks) * 100)}%`,
      `"${r.grade || 'NA'}"`,
      `"${r.attendance_status}"`,
      `"${r.remarks || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Subject_Report_${selectedClass}_${selectedSection}_${selectedSubject}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  const filteredRecords = records.filter(r => 
    r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.roll_no && r.roll_no.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#122A24] text-white p-6 rounded-2xl shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Subject Teacher Analytics
            </span>
            <span className="text-emerald-300/60 text-xs">Academic Session 2026-27</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subject Performance Report</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Exam analysis, pass percentages, high achievers, and targeted intervention list for your subjects.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={exportExcel}
            disabled={!records || records.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={!records || records.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-semibold transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Examination
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Class & Section
            </label>
            <select
              value={`${selectedClass}___${selectedSection}`}
              onChange={(e) => {
                const [cName, sSec] = e.target.value.split('___');
                setSelectedClass(cName);
                setSelectedSection(sSec);
              }}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              {Array.from(new Set(allocations.map(a => `${a.class_name}___${a.section || 'A'}`))).map(item => {
                const [c, s] = item.split('___');
                return (
                  <option key={item} value={item}>
                    Class {c} - Sec {s}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              {allocations
                .filter(a => a.class_name === selectedClass && (a.section || 'A') === selectedSection)
                .map(a => (
                  <option key={a.subject_name} value={a.subject_name}>
                    {a.subject_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={fetchingReport}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#122A24] text-white hover:bg-emerald-900 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingReport ? 'animate-spin' : ''}`} />
              Refresh Analytics
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Average Score</p>
            <p className="text-2xl font-bold text-[#122A24] mt-1">{stats.average}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Mean subject score</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-emerald-700 uppercase">Pass Rate</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.pass_percent}%</p>
            <p className="text-[11px] text-gray-500 mt-0.5">&gt;= 33% passing cut-off</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-blue-700 uppercase">Highest Score</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.highest}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Top class score</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-rose-700 uppercase">Lowest Score</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{stats.lowest}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Minimum score</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Appeared</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.appeared} / {stats.total_students}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Scholars examined</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-amber-700 uppercase">Absent / Exempt</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{stats.absent}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Unexamined scholars</p>
          </div>
        </div>
      )}

      {/* Analysis Section: Toppers & Remedial/Weak Students */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 3 High Achievers */}
          <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-gray-900">Subject Toppers</h2>
            </div>

            {stats.toppers && stats.toppers.length > 0 ? (
              <div className="space-y-3">
                {stats.toppers.map((top, idx) => (
                  <div 
                    key={top.student_id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-amber-50/40 to-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-400 text-white' : 
                        idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-amber-700/60 text-white'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{top.student_name}</p>
                        <p className="text-xs text-gray-500">Roll No: {top.roll_no || 'NA'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-800">
                        {top.total_marks} / {top.max_marks}
                      </span>
                      <p className="text-[11px] font-semibold text-amber-700">
                        {Math.round((top.total_marks / top.max_marks) * 100)}% ({top.grade || 'A1'})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic py-4">No marks available to calculate toppers.</p>
            )}
          </div>

          {/* Remedial Focus / Weak Students */}
          <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-gray-900">Remedial Focus (&lt; 40%)</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {stats.weak_students?.length || 0} Scholars
              </span>
            </div>

            {stats.weak_students && stats.weak_students.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {stats.weak_students.map((w) => (
                  <div 
                    key={w.student_id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-rose-100 bg-rose-50/30"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{w.student_name}</p>
                      <p className="text-xs text-rose-600 font-medium">Roll No: {w.roll_no || 'NA'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-rose-700">
                        {w.total_marks} / {w.max_marks}
                      </span>
                      <p className="text-xs text-rose-600 font-semibold">{w.percent}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All appearing scholars scored 40% or above in this examination!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comprehensive Student Marks Broadsheet */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <h2 className="text-base font-bold text-gray-900">Student Subject Roster &amp; Scores</h2>
          </div>

          <div className="relative w-full sm:w-64 print:hidden">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {fetchingReport ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading performance ledger...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No marks entries found</p>
            <p className="text-xs text-gray-500 mt-1">Please ensure marks have been recorded for this exam and subject.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Marks Obtained</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((r) => {
                  const pct = r.attendance_status === 'ABSENT' ? 0 : Math.round((r.total_marks / r.max_marks) * 100);
                  const isWeak = pct < 40 && r.attendance_status !== 'ABSENT';
                  return (
                    <tr key={r.student_id} className={`hover:bg-gray-50/70 transition ${isWeak ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3 px-4 font-mono font-medium text-gray-600">{r.roll_no || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{r.student_name}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {r.attendance_status === 'ABSENT' ? (
                          <span className="text-rose-600">ABSENT</span>
                        ) : r.attendance_status === 'EXEMPT' ? (
                          <span className="text-gray-500">EXEMPT</span>
                        ) : (
                          r.total_marks
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{r.max_marks}</td>
                      <td className="py-3 px-4">
                        {r.attendance_status === 'ABSENT' ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <span className={`font-semibold ${pct >= 75 ? 'text-emerald-700' : isWeak ? 'text-rose-600' : 'text-gray-700'}`}>
                            {pct}%
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                          {r.grade || 'NA'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.attendance_status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          r.attendance_status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {r.attendance_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate">{r.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
