'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Users,
  BookOpen
} from 'lucide-react';

interface ExamItem {
  id: string;
  name: string;
}

interface TopperItem {
  student_id: string;
  admission_no: string;
  student_name: string;
  roll_no: string;
  percentage: number;
  total_obtained: number;
  total_max: number;
}

interface FailingItem {
  student_id: string;
  admission_no: string;
  student_name: string;
  roll_no: string;
  percentage: number;
  is_failing: boolean;
}

interface SubjectStat {
  subject_name: string;
  students_evaluated: number;
  subject_average: number;
  pass_percent: number;
}

interface StudentResult {
  student_id: string;
  admission_no: string;
  student_name: string;
  roll_no: string;
  total_obtained: number;
  total_max: number;
  percentage: number;
  is_failing: boolean;
  subjects_appeared: number;
}

export default function ClassResultAnalysisPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [activeExamId, setActiveExamId] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [classAverage, setClassAverage] = useState(0);
  const [toppers, setToppers] = useState<TopperItem[]>([]);
  const [failingStudents, setFailingStudents] = useState<FailingItem[]>([]);
  const [subjectComparison, setSubjectComparison] = useState<SubjectStat[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResults();
  }, [activeExamId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const url = activeExamId 
        ? `/api/teacher/class/results?exam_id=${activeExamId}` 
        : '/api/teacher/class/results';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setClassName(data.class_name);
        setSection(data.section);
        setExams(data.exams || []);
        if (!activeExamId && data.exam_id) {
          setActiveExamId(data.exam_id);
        }
        setClassAverage(data.class_average || 0);
        setToppers(data.toppers || []);
        setFailingStudents(data.failing_students || []);
        setSubjectComparison(data.subject_comparison || []);
        setStudentResults(data.student_results || []);
      }
    } catch (err) {
      console.error('Failed to load result analysis', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (studentResults.length === 0) return;
    const headers = ['Roll No', 'Adm No', 'Student Name', 'Total Obtained', 'Total Max', 'Percentage', 'Standing'];
    const rows = studentResults.map(s => [
      `"${s.roll_no || ''}"`,
      `"${s.admission_no}"`,
      `"${s.student_name}"`,
      s.total_obtained,
      s.total_max,
      `${s.percentage}%`,
      s.is_failing ? 'Needs Remedial' : 'Passed'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Result_Analysis_${className}_${section}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = studentResults.filter(s => 
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.admission_no && s.admission_no.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const passingCount = studentResults.filter(s => !s.is_failing && s.subjects_appeared > 0).length;
  const passRate = studentResults.length > 0 
    ? Math.round((passingCount / studentResults.length) * 100) 
    : 0;

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
                Class {className}-{section}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Class Result Analysis &amp; Analytics</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Comprehensive scholastic evaluation, toppers podium, subject benchmarks, and remedial tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={exportCSV}
            disabled={studentResults.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={studentResults.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-semibold transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Analysis
          </button>
        </div>
      </div>

      {/* Exam Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
            Selected Exam:
          </label>
          <select
            value={activeExamId}
            onChange={(e) => setActiveExamId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64"
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>{studentResults.length} Evaluated Scholars</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Class Average</p>
          <p className="text-3xl font-bold text-emerald-800 mt-1">{classAverage}%</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Mean overall scholastic performance</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
          <p className="text-xs font-semibold text-blue-700 uppercase">Class Pass Rate</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">{passRate}%</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{passingCount} scholars meeting pass standard</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase">Class Topper</p>
          <p className="text-xl font-bold text-gray-900 mt-1 truncate">
            {toppers[0]?.student_name || 'N/A'}
          </p>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
            {toppers[0] ? `${toppers[0].percentage}% score` : 'Pending evaluation'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
          <p className="text-xs font-semibold text-rose-700 uppercase">Remedial Focus</p>
          <p className="text-3xl font-bold text-rose-700 mt-1">{failingStudents.length}</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Scholars requiring academic support</p>
        </div>
      </div>

      {/* Toppers and Remedial Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Toppers */}
        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">Class Academic Toppers</h2>
          </div>

          {toppers.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">No scores recorded to determine toppers.</p>
          ) : (
            <div className="space-y-3">
              {toppers.map((t, idx) => (
                <div key={t.student_id} className="flex items-center justify-between p-3.5 rounded-xl border border-amber-100 bg-amber-50/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-amber-700/60 text-white'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.student_name}</p>
                      <p className="text-xs text-gray-500">Roll: {t.roll_no || 'NA'} | Adm: {t.admission_no}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-800">{t.percentage}%</span>
                    <p className="text-[10px] text-gray-500">{t.total_obtained} / {t.total_max}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remedial Focus Scholars */}
        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold text-gray-900">Remedial Focus Scholars (&lt;33%)</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {failingStudents.length} Scholars
            </span>
          </div>

          {failingStudents.length === 0 ? (
            <div className="p-6 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All scholars have achieved 33% or above in all evaluated subjects!</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {failingStudents.map(f => (
                <div key={f.student_id} className="flex items-center justify-between p-3 rounded-lg border border-rose-100 bg-rose-50/40 text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{f.student_name}</p>
                    <p className="text-rose-600">Roll No: {f.roll_no || 'NA'}</p>
                  </div>
                  <span className="font-bold text-rose-700 text-sm">{f.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject-Wise Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Subject-Wise Performance Comparison</span>
        </h2>

        {subjectComparison.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-4">No subject comparisons available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjectComparison.map(sub => (
              <div key={sub.subject_name} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-xs">
                <p className="font-bold text-gray-900 text-sm truncate">{sub.subject_name}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subject Mean:</span>
                    <strong className="text-emerald-800">{sub.subject_average}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pass Rate:</span>
                    <strong className={sub.pass_percent >= 75 ? 'text-emerald-700' : 'text-rose-600'}>
                      {sub.pass_percent}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Evaluated:</span>
                    <span className="text-gray-700">{sub.students_evaluated} scholars</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Student Roster Performance List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-gray-900">Student Ranking &amp; Performance Ledger</h2>

          <div className="relative w-full sm:w-64 print:hidden">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search scholar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Compiling results ledger...
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No evaluation records found</p>
          </div>
        ) : (
          <div>
            {/* Mobile Student Results Cards (< md) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredResults.map(s => (
                <div key={s.student_id} className={`p-4 space-y-2.5 hover:bg-gray-50/70 transition ${s.is_failing ? 'bg-rose-50/20' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500">
                        {s.roll_no && <span className="font-bold text-gray-700">Roll: {s.roll_no}</span>}
                        <span>Adm: {s.admission_no}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 mt-0.5">{s.student_name}</h4>
                    </div>

                    <div className="shrink-0">
                      {s.is_failing ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Remedial
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Satisfactory
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase block">Marks</span>
                      <span className="font-bold text-gray-900 font-mono">
                        {s.total_obtained} / {s.total_max}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-mono uppercase block">Percentage</span>
                      <span className={`font-black font-mono text-sm ${s.percentage >= 75 ? 'text-emerald-700' : s.is_failing ? 'text-rose-600' : 'text-gray-800'}`}>
                        {s.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Broadsheet Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Adm No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Max Marks</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Academic Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.map(s => (
                    <tr key={s.student_id} className={`hover:bg-gray-50/70 transition ${s.is_failing ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-3 px-4 font-mono font-medium text-gray-700">{s.roll_no || '-'}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{s.admission_no}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{s.student_name}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{s.total_obtained}</td>
                      <td className="py-3 px-4 text-gray-500">{s.total_max}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${s.percentage >= 75 ? 'text-emerald-700' : s.is_failing ? 'text-rose-600' : 'text-gray-800'}`}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {s.is_failing ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Remedial Recommended
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Satisfactory
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
