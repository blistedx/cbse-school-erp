/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  Lock,
  Save,
  Send,
  AlertTriangle,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';

function TeacherMarksContent() {
  const searchParams = useSearchParams();
  const [initLoading, setInitLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter options
  const [exams, setExams] = useState<any[]>([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState<any[]>([]);

  // Selected filters
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>(''); // formatted as: "Class 10___A___Mathematics"

  // Sheet data
  const [sheetData, setSheetData] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Initialize filters
  useEffect(() => {
    async function loadInit() {
      try {
        setInitLoading(true);
        const res = await fetch('/api/teacher/marks');
        const json = await res.json();
        if (json.success) {
          setExams(json.exams || []);
          setAllocatedSubjects(json.allocated_subjects || []);

          if (json.exams && json.exams.length > 0) {
            setSelectedExamId(json.exams[0].id);
          }

          // Check if URL search params provide pre-selection
          const qClass = searchParams.get('class_name');
          const qSec = searchParams.get('section') || 'A';
          const qSub = searchParams.get('subject_name');

          if (qClass && qSub) {
            setSelectedBatch(`${qClass}___${qSec}___${qSub}`);
          } else if (json.allocated_subjects && json.allocated_subjects.length > 0) {
            const first = json.allocated_subjects[0];
            setSelectedBatch(`${first.class_name}___${first.section || 'A'}___${first.subject_name}`);
          }
        } else {
          setError(json.error || 'Failed to load examination catalog.');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading examinations');
      } finally {
        setInitLoading(false);
      }
    }
    loadInit();
  }, [searchParams]);

  // Filter exams that are available for the currently selected class & subject batch
  const availableExams = React.useMemo(() => {
    if (!selectedBatch || exams.length === 0) return exams;
    const [className, section, subjectName] = selectedBatch.split('___');
    const cNorm = (className || '').toLowerCase().trim().replace(/^class\s*/i, '');
    const sNorm = (section || 'A').toUpperCase().trim();
    const subNorm = (subjectName || '').toLowerCase().trim();

    // Helper to deduplicate list by exam title
    const distinctByTitle = (list: typeof exams) => {
      const seen = new Set<string>();
      return list.filter(e => {
        const title = (e.name || e.title || '').trim().toLowerCase();
        if (!title || seen.has(title)) return false;
        seen.add(title);
        return true;
      });
    };

    // 1. Strict match: class, section and exact subject name
    const strictMatches = exams.filter(e => {
      const ecNorm = (e.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
      const esNorm = (e.section || 'A').toUpperCase().trim();
      const esubNorm = (e.subject_name || '').toLowerCase().trim();
      const classMatch = ecNorm === cNorm || cNorm.includes(ecNorm) || ecNorm.includes(cNorm);
      const secMatch = !e.section || esNorm === sNorm;
      const subMatch = !e.subject_name || esubNorm === 'all cbse subjects' || esubNorm === subNorm;
      return classMatch && secMatch && subMatch;
    });

    if (strictMatches.length > 0) return distinctByTitle(strictMatches);

    // 2. Fuzzy match: subject includes / prefix match
    const fuzzyMatches = exams.filter(e => {
      const ecNorm = (e.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
      const esNorm = (e.section || 'A').toUpperCase().trim();
      const esubNorm = (e.subject_name || '').toLowerCase().trim();
      const classMatch = ecNorm === cNorm || cNorm.includes(ecNorm) || ecNorm.includes(cNorm);
      const secMatch = !e.section || esNorm === sNorm;
      const subMatch = !e.subject_name || esubNorm.includes(subNorm) || subNorm.includes(esubNorm);
      return classMatch && secMatch && subMatch;
    });

    if (fuzzyMatches.length > 0) return distinctByTitle(fuzzyMatches);

    // 3. Class & section match (across subjects in this class)
    const classMatches = exams.filter(e => {
      const ecNorm = (e.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
      const esNorm = (e.section || 'A').toUpperCase().trim();
      const classMatch = ecNorm === cNorm || cNorm.includes(ecNorm) || ecNorm.includes(cNorm);
      const secMatch = !e.section || esNorm === sNorm;
      return classMatch && secMatch;
    });

    if (classMatches.length > 0) return distinctByTitle(classMatches);

    // 4. Fallback: all exams with distinct titles
    return distinctByTitle(exams);
  }, [exams, selectedBatch]);

  // Ensure selectedExamId matches an available exam for the active batch
  useEffect(() => {
    if (availableExams.length > 0) {
      const exists = availableExams.some(e => e.id === selectedExamId);
      if (!exists) {
        const currentExam = exams.find(e => e.id === selectedExamId);
        const matchTitle = currentExam 
          ? availableExams.find(e => (e.name || e.title) === (currentExam.name || currentExam.title))
          : null;
        setSelectedExamId(matchTitle ? matchTitle.id : availableExams[0].id);
      }
    }
  }, [availableExams, selectedExamId, exams]);

  // Load marks sheet when exam or batch changes
  const loadSheet = useCallback(async () => {
    if (!selectedExamId || !selectedBatch) return;
    try {
      setSheetLoading(true);
      setError(null);
      setSuccessMessage(null);

      const [className, section, subjectName] = selectedBatch.split('___');
      const url = `/api/teacher/marks?exam_id=${encodeURIComponent(selectedExamId)}&class_name=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&subject_name=${encodeURIComponent(subjectName)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSheetData(json);
        setRecords(json.students || []);
      } else {
        setError(json.error || 'Failed to load marks sheet.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setSheetLoading(false);
    }
  }, [selectedExamId, selectedBatch]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const handleMarkChange = (studentId: string, field: string, value: any) => {
    setRecords(prev => prev.map(r => {
      if (r.student_id !== studentId) return r;
      const updated = { ...r, [field]: value };
      if (field === 'theory_marks' || field === 'practical_marks') {
        const th = field === 'theory_marks' ? (Number(value) || 0) : (Number(r.theory_marks) || 0);
        const pr = field === 'practical_marks' ? (Number(value) || 0) : (Number(r.practical_marks) || 0);
        updated.total_marks = th + pr;
      }
      return updated;
    }));
  };

  const handleSaveMarks = async (isDraft: boolean) => {
    if (!sheetData) return;
    const [className, section, subjectName] = selectedBatch.split('___');

    // Client validation against max marks
    const max = sheetData.max_marks || 100;
    for (const r of records) {
      const tot = Number(r.total_marks) || 0;
      if (r.attendance_status === 'PRESENT' && tot > max) {
        setError(`Marks error: ${r.student_name} score (${tot}) exceeds maximum allowed (${max}).`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: selectedExamId,
          class_name: className,
          section,
          subject_name: subjectName,
          max_marks: max,
          records,
          is_draft: isDraft
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(json.message);
        loadSheet();
      } else {
        setError(json.error || 'Failed to submit marks.');
      }
    } catch {
      setError('Network failure recording marks.');
    } finally {
      setSubmitting(false);
    }
  };

  if (initLoading) {
    return <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">Initializing marks engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            Subject Marks Entry Workstation
          </h1>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-0.5">
            Record academic scores for your allocated subject batches • Real-time validation
          </p>
        </div>

        {/* Action Buttons */}
        {sheetData && !sheetData.is_locked && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveMarks(true)}
              disabled={submitting}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#DCE8E0] text-[#122A24] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => handleSaveMarks(false)}
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit & Seal'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Selectors Card */}
      <div className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase">
            Scheduled Exam / Term Assessment
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[#F8FAF9] border border-[#DCE8E0] text-xs font-bold text-[#122A24] focus:outline-hidden focus:border-[#10B981] cursor-pointer"
          >
            {availableExams.length === 0 ? (
              <option value="">No scheduled exams found for batch</option>
            ) : (
              availableExams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name || e.title} {e.max_marks ? `(${e.max_marks} Marks)` : ''} {e.is_locked ? '🔒 (Locked by Admin)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase">
            Allocated Class &amp; Subject Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[#F8FAF9] border border-[#DCE8E0] text-xs font-bold text-[#122A24] focus:outline-hidden focus:border-[#10B981] cursor-pointer"
          >
            {allocatedSubjects.map((alloc, idx) => (
              <option key={idx} value={`${alloc.class_name}___${alloc.section || 'A'}___${alloc.subject_name}`}>
                {alloc.class_name}-{alloc.section || 'A'} • {alloc.subject_name} ({alloc.student_count} Scholars)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Banners */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {sheetData?.is_locked && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center gap-2 font-semibold">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>This examination has been locked by administration. The marks ledger is currently in read-only audit status.</span>
        </div>
      )}

      {/* Marks Entry Sheet Table */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DCE8E0] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAF9]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-[#122A24]">
              {sheetData?.class_name}-{sheetData?.section} • {sheetData?.subject_name}
            </span>
            <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-bold">
              Max Marks: {sheetData?.max_marks || 100}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            {records.length} Scholars Listed
          </span>
        </div>

        {sheetLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
            Loading scholar marks broadsheet...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No scholars enrolled in this class-section.
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Touch-Friendly Marks Cards (< md screens) */}
            <div className="block md:hidden divide-y divide-[#E2EBE5]">
              {records.map((r) => {
                const isLocked = sheetData?.is_locked;
                const isAbsent = r.attendance_status === 'ABSENT' || r.attendance_status === 'EXEMPT';

                return (
                  <div key={r.student_id} className={`p-4 space-y-3 ${isAbsent ? 'bg-slate-50/70' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold text-xs flex items-center justify-center">
                          {r.roll_no || '--'}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-[#122A24]">{r.student_name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{r.admission_no}</span>
                        </div>
                      </div>

                      {/* Attendance Selector on Mobile */}
                      <select
                        disabled={isLocked}
                        value={r.attendance_status}
                        onChange={(e) => handleMarkChange(r.student_id, 'attendance_status', e.target.value)}
                        className={`p-1.5 rounded-lg border text-xs font-bold font-mono cursor-pointer ${
                          r.attendance_status === 'ABSENT'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : r.attendance_status === 'EXEMPT'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="EXEMPT">Exempt</option>
                        <option value="MEDICAL">Medical</option>
                      </select>
                    </div>

                    {/* Marks Inputs Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-[#F8FAF9] p-3 rounded-2xl border border-[#E2EBE5]">
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block">Theory</label>
                        <input
                          type="number"
                          disabled={isLocked || isAbsent}
                          min="0"
                          max={sheetData?.max_marks || 100}
                          value={isAbsent ? 0 : r.theory_marks}
                          onChange={(e) => handleMarkChange(r.student_id, 'theory_marks', e.target.value)}
                          className="w-full p-2 mt-1 rounded-xl border border-[#DCE8E0] text-sm font-mono font-bold text-center bg-white focus:outline-hidden focus:border-emerald-500 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block">Practical/IA</label>
                        <input
                          type="number"
                          disabled={isLocked || isAbsent}
                          min="0"
                          max={sheetData?.max_marks || 100}
                          value={isAbsent ? 0 : r.practical_marks}
                          onChange={(e) => handleMarkChange(r.student_id, 'practical_marks', e.target.value)}
                          className="w-full p-2 mt-1 rounded-xl border border-[#DCE8E0] text-sm font-mono font-bold text-center bg-white focus:outline-hidden focus:border-emerald-500 disabled:bg-slate-100"
                        />
                      </div>

                      <div className="flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-mono text-slate-500 block">Total / Grade</span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-base font-black font-mono text-[#122A24]">{isAbsent ? 0 : r.total_marks}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                            {r.grade || '--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      disabled={isLocked}
                      value={r.remarks || ''}
                      onChange={(e) => handleMarkChange(r.student_id, 'remarks', e.target.value)}
                      placeholder="Optional feedback / remark..."
                      className="w-full p-2 text-xs rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Spreadsheet-Style Table (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[#2D5A4E] font-bold font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Roll No</th>
                    <th className="py-3 px-4">Scholar Name</th>
                    <th className="py-3 px-3">Admission No</th>
                    <th className="py-3 px-3">Attendance</th>
                    <th className="py-3 px-3">Theory Marks</th>
                    <th className="py-3 px-3">Practical / IA</th>
                    <th className="py-3 px-3">Total Marks</th>
                    <th className="py-3 px-3">Grade</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EBE5]">
                  {records.map((r) => {
                    const isLocked = sheetData?.is_locked;
                    const isAbsent = r.attendance_status === 'ABSENT' || r.attendance_status === 'EXEMPT';

                    return (
                      <tr key={r.student_id} className={`hover:bg-[#F8FAF9] transition ${isAbsent ? 'bg-slate-50/70 opacity-80' : ''}`}>
                        <td className="py-3 px-3 font-mono font-bold text-[#122A24]">{r.roll_no || '--'}</td>
                        <td className="py-3 px-4 font-bold text-[#122A24]">{r.student_name}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{r.admission_no}</td>

                        {/* Attendance Status Selector */}
                        <td className="py-3 px-3">
                          <select
                            disabled={isLocked}
                            value={r.attendance_status}
                            onChange={(e) => handleMarkChange(r.student_id, 'attendance_status', e.target.value)}
                            className={`p-1.5 rounded-lg border text-[11px] font-bold font-mono cursor-pointer ${
                              r.attendance_status === 'ABSENT'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : r.attendance_status === 'EXEMPT'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-white text-emerald-800 border-emerald-300'
                            }`}
                          >
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="EXEMPT">Exempted</option>
                            <option value="MEDICAL">Medical</option>
                          </select>
                        </td>

                        {/* Theory Marks Input */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            disabled={isLocked || isAbsent}
                            min="0"
                            max={sheetData?.max_marks || 100}
                            value={isAbsent ? 0 : r.theory_marks}
                            onChange={(e) => handleMarkChange(r.student_id, 'theory_marks', e.target.value)}
                            className="w-16 p-1.5 rounded-lg border border-[#DCE8E0] text-xs font-mono font-bold text-center bg-white focus:outline-hidden focus:border-emerald-500 disabled:bg-slate-100"
                          />
                        </td>

                        {/* Practical Marks Input */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            disabled={isLocked || isAbsent}
                            min="0"
                            max={sheetData?.max_marks || 100}
                            value={isAbsent ? 0 : r.practical_marks}
                            onChange={(e) => handleMarkChange(r.student_id, 'practical_marks', e.target.value)}
                            className="w-16 p-1.5 rounded-lg border border-[#DCE8E0] text-xs font-mono font-bold text-center bg-white focus:outline-hidden focus:border-emerald-500 disabled:bg-slate-100"
                          />
                        </td>

                        {/* Total Marks */}
                        <td className="py-3 px-3 font-mono font-black text-sm text-[#122A24]">
                          {isAbsent ? 0 : r.total_marks}
                        </td>

                        {/* Grade */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[11px] bg-[#E2EBE5] px-2 py-0.5 rounded-md text-[#122A24]">
                            {r.grade || '--'}
                          </span>
                        </td>

                        {/* Remarks Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            disabled={isLocked}
                            value={r.remarks || ''}
                            onChange={(e) => handleMarkChange(r.student_id, 'remarks', e.target.value)}
                            placeholder="Feedback..."
                            className="w-full p-1.5 rounded-lg border border-[#DCE8E0] text-xs bg-white focus:outline-hidden focus:border-emerald-500 disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeacherMarksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading marks register...</div>}>
      <TeacherMarksContent />
    </Suspense>
  );
}
