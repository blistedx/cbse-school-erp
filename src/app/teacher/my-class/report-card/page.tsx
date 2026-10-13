'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Download, 
  Printer, 
  RefreshCw, 
  Save, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  X,
  BookOpen
} from 'lucide-react';

interface ExamItem {
  id: string;
  name: string;
  title?: string;
  date?: string;
}

interface SubjectCol {
  name: string;
  code?: string;
  max_marks: number;
}

interface BroadsheetRow {
  student_id: string;
  admission_no: string;
  student_name: string;
  roll_no: string;
  subjects: Record<string, { total_marks: number; max_marks: number; grade: string; is_absent: boolean }>;
  total_obtained: number;
  total_max: number;
  percentage: number;
  conduct: string;
  attendance_remark: string;
  class_teacher_remark: string;
}

export default function ConsolidatedReportCardPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [activeExamId, setActiveExamId] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [subjects, setSubjects] = useState<SubjectCol[]>([]);
  const [rows, setRows] = useState<BroadsheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Remarks Modal
  const [editingStudent, setEditingStudent] = useState<BroadsheetRow | null>(null);
  const [conduct, setConduct] = useState('Good');
  const [attendanceRemark, setAttendanceRemark] = useState('Regular & Punctual');
  const [teacherRemark, setTeacherRemark] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  // Preview Report Card Modal
  const [previewStudent, setPreviewStudent] = useState<BroadsheetRow | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchBroadsheet();
  }, [activeExamId]);

  const fetchBroadsheet = async () => {
    try {
      setLoading(true);
      const url = activeExamId 
        ? `/api/teacher/class/report-card?exam_id=${activeExamId}` 
        : '/api/teacher/class/report-card';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setClassName(data.class_name);
        setSection(data.section);
        setExams(data.exams || []);
        if (!activeExamId && data.active_exam) {
          setActiveExamId(data.active_exam.id);
        }
        setSubjects(data.subjects || []);
        setRows(data.consolidated_sheet || []);
      }
    } catch (err) {
      console.error('Failed to load broadsheet', err);
    } finally {
      setLoading(false);
    }
  };

  const openRemarksModal = (row: BroadsheetRow) => {
    setEditingStudent(row);
    setConduct(row.conduct || 'Good');
    setAttendanceRemark(row.attendance_remark || 'Regular & Punctual');
    setTeacherRemark(row.class_teacher_remark || '');
  };

  const saveRemarks = async () => {
    if (!editingStudent) return;
    try {
      setSavingRemark(true);
      setFeedback(null);
      const res = await fetch('/api/teacher/class/report-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: editingStudent.student_id,
          exam_id: activeExamId,
          conduct,
          attendance_remark: attendanceRemark,
          class_teacher_remark: teacherRemark
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Report remarks updated for ${editingStudent.student_name}.`
        });
        setEditingStudent(null);
        fetchBroadsheet();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save remarks' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setSavingRemark(false);
    }
  };

  const exportCSV = () => {
    if (rows.length === 0) return;
    const subjHeaders = subjects.map(s => s.name);
    const headers = ['Roll No', 'Adm No', 'Student Name', ...subjHeaders, 'Total Obtained', 'Max Marks', 'Percentage', 'Conduct', 'Class Teacher Remark'];
    
    const csvRows = rows.map(r => {
      const subjVals = subjects.map(s => {
        const sm = r.subjects[s.name];
        if (!sm) return '--';
        return sm.is_absent ? 'ABS' : sm.total_marks;
      });

      return [
        `"${r.roll_no || ''}"`,
        `"${r.admission_no}"`,
        `"${r.student_name}"`,
        ...subjVals,
        r.total_obtained,
        r.total_max,
        `${r.percentage}%`,
        `"${r.conduct}"`,
        `"${r.class_teacher_remark || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Consolidated_Broadsheet_${className}_${section}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows = rows.filter(r => 
    r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.roll_no && r.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.admission_no && r.admission_no.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeExamName = exams.find(e => e.id === activeExamId)?.name || 'Term Examination';

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Consolidated Marks Broadsheet &amp; Report Card</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Class-wide broadsheet of all subjects, report card conduct remarks, and official preview.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={exportCSV}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-semibold transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Exam Selector and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
            Examination:
          </label>
          <select
            value={activeExamId}
            onChange={(e) => setActiveExamId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name || ex.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search scholar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Consolidated Broadsheet Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>Master Broadsheet: {activeExamName}</span>
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            {rows.length} Enrolled Scholars
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading class marks broadsheet...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No marks recorded yet for this examination</p>
          </div>
        ) : (
          <div>
            {/* Mobile Scholar Broadsheet Cards (< md) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredRows.map((r) => (
                <div key={r.student_id} className="p-4 space-y-3 hover:bg-gray-50/70 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500">
                        {r.roll_no && <span className="font-bold text-gray-700">Roll: {r.roll_no}</span>}
                        <span>Adm: {r.admission_no}</span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 mt-0.5">{r.student_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 font-mono">
                          Total: <strong className="text-gray-900">{r.total_obtained}/{r.total_max}</strong>
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                          Conduct: {r.conduct}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-gray-400 block uppercase">Score</span>
                      <span className={`text-lg font-black font-mono ${
                        r.percentage >= 75 ? 'text-emerald-700' : r.percentage < 40 ? 'text-rose-600' : 'text-gray-800'
                      }`}>
                        {r.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Subject Breakdown Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {subjects.map(s => {
                      const sm = r.subjects[s.name];
                      if (!sm) return null;
                      return (
                        <div
                          key={s.name}
                          className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200/80 text-[11px] flex items-center gap-1.5 font-mono"
                        >
                          <span className="text-gray-600 font-semibold">{s.name}:</span>
                          {sm.is_absent ? (
                            <span className="text-rose-600 font-bold">ABS</span>
                          ) : (
                            <span className="text-gray-900 font-bold">
                              {sm.total_marks} <span className="text-gray-400 font-normal">({sm.grade})</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Teacher Remark snippet */}
                  {r.class_teacher_remark && (
                    <p className="text-[11px] text-emerald-800 italic bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      Remark: {r.class_teacher_remark}
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openRemarksModal(r)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit Remarks</span>
                    </button>
                    <button
                      onClick={() => setPreviewStudent(r)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-[#122A24] text-white hover:bg-emerald-900 active:scale-95 transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Card</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Broadsheet Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3 w-12">Roll</th>
                    <th className="py-3 px-4 min-w-[140px]">Student Name</th>
                    {subjects.map(s => (
                      <th key={s.name} className="py-3 px-3 text-center">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-gray-400 font-normal">Max {s.max_marks}</div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center font-bold text-gray-900">Total</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-800">%</th>
                    <th className="py-3 px-3">Conduct</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((r) => (
                    <tr key={r.student_id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-3 font-mono font-medium text-gray-700">{r.roll_no || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{r.student_name}</td>
                      {subjects.map(s => {
                        const sm = r.subjects[s.name];
                        if (!sm) {
                          return <td key={s.name} className="py-3 px-3 text-center text-gray-300">--</td>;
                        }
                        return (
                          <td key={s.name} className="py-3 px-3 text-center">
                            {sm.is_absent ? (
                              <span className="text-rose-600 font-bold text-[10px]">ABS</span>
                            ) : (
                              <div>
                                <span className="font-semibold text-gray-800">{sm.total_marks}</span>
                                <span className="text-[10px] text-gray-400 block">{sm.grade}</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-center font-bold text-gray-900">
                        {r.total_obtained} / {r.total_max}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${r.percentage >= 75 ? 'text-emerald-700' : r.percentage < 40 ? 'text-rose-600' : 'text-gray-800'}`}>
                          {r.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {r.conduct}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openRemarksModal(r)}
                            title="Edit Teacher Remarks"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewStudent(r)}
                            title="Preview Report Card"
                            className="p-1.5 rounded-lg bg-[#122A24] text-white hover:bg-emerald-900 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Remarks Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Report Card Remarks</h3>
                <p className="text-xs text-gray-500">
                  {editingStudent.student_name} (Roll: {editingStudent.roll_no || 'NA'})
                </p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  General Conduct:
                </label>
                <select
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                >
                  <option value="Outstanding">Outstanding</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Attendance Remark:
                </label>
                <select
                  value={attendanceRemark}
                  onChange={(e) => setAttendanceRemark(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                >
                  <option value="Regular & Punctual">Regular &amp; Punctual</option>
                  <option value="Good Attendance">Good Attendance</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Irregular">Irregular</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Class Teacher Academic Remark:
                </label>
                <textarea
                  rows={3}
                  value={teacherRemark}
                  onChange={(e) => setTeacherRemark(e.target.value)}
                  placeholder="e.g., Consistent performer, actively participates in classroom discussions..."
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRemarks}
                disabled={savingRemark || !teacherRemark.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingRemark ? 'Saving...' : 'Save Remarks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Report Card Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Report Card Header */}
            <div className="text-center pb-6 border-b-2 border-[#122A24] mb-6">
              <h2 className="text-xl font-bold uppercase tracking-wider text-[#122A24]">
                Delhi Public School
              </h2>
              <p className="text-xs text-gray-500">Affiliated to Central Board of Secondary Education (CBSE)</p>
              <h3 className="text-sm font-semibold text-emerald-800 mt-2">
                Official Scholar Academic Report Card - {activeExamName}
              </h3>
            </div>

            {/* Scholar Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <div>
                <span className="text-gray-500">Student Name:</span>
                <p className="font-bold text-gray-900 text-sm">{previewStudent.student_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Class &amp; Section:</span>
                <p className="font-bold text-gray-900 text-sm">Class {className} - Section {section}</p>
              </div>
              <div>
                <span className="text-gray-500">Roll Number:</span>
                <p className="font-mono font-semibold text-gray-800">{previewStudent.roll_no || 'NA'}</p>
              </div>
              <div>
                <span className="text-gray-500">Admission Number:</span>
                <p className="font-mono font-semibold text-gray-800">{previewStudent.admission_no}</p>
              </div>
            </div>

            {/* Scholastic Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#122A24] text-white">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Max Marks</th>
                    <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjects.map(s => {
                    const sm = previewStudent.subjects[s.name];
                    return (
                      <tr key={s.name}>
                        <td className="py-2 px-3 font-semibold text-gray-800">{s.name}</td>
                        <td className="py-2 px-3 text-center text-gray-500">{s.max_marks}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-900">
                          {sm ? (sm.is_absent ? 'ABS' : sm.total_marks) : '--'}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-emerald-800">
                          {sm?.grade || '--'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-100/80 font-bold border-t border-gray-300">
                    <td className="py-2.5 px-3 text-gray-900">Grand Total</td>
                    <td className="py-2.5 px-3 text-center text-gray-900">{previewStudent.total_max}</td>
                    <td className="py-2.5 px-3 text-center text-gray-900">{previewStudent.total_obtained}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-800">{previewStudent.percentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Qualitative Assessment */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs mb-8">
              <p>
                <span className="font-semibold text-gray-700">General Conduct: </span>
                <span className="text-gray-900">{previewStudent.conduct}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-700">Attendance Standing: </span>
                <span className="text-gray-900">{previewStudent.attendance_remark}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-700">Class Teacher Remarks: </span>
                <span className="text-gray-900 italic">{previewStudent.class_teacher_remark || 'Satisfactory academic progress.'}</span>
              </p>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <div>
                <div className="h-10 border-b border-gray-300 mb-1" />
                <p className="font-medium text-gray-700">Class Teacher</p>
              </div>
              <div>
                <div className="h-10 border-b border-gray-300 mb-1" />
                <p className="font-medium text-gray-700">Exam Controller</p>
              </div>
              <div>
                <div className="h-10 border-b border-gray-300 mb-1" />
                <p className="font-medium text-gray-700">Principal</p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 print:hidden">
              <button
                onClick={() => setPreviewStudent(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
