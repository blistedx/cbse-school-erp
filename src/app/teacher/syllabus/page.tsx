/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  Calendar,
  Sparkles,
  X,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

function TeacherSyllabusContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('April');
  const [selectedBatch, setSelectedBatch] = useState<string>(''); // "Class 10___A___Mathematics"

  // Topic Edit Modal State
  const [topicModal, setTopicModal] = useState<{
    isOpen: boolean;
    topic: any | null;
    plan: any | null;
    submitting: boolean;
    error: string | null;
    form: {
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      periods_used: number;
      completion_date: string;
      teacher_remarks: string;
      reopen_reason?: string;
    };
  }>({
    isOpen: false,
    topic: null,
    plan: null,
    submitting: false,
    error: null,
    form: {
      status: 'NOT_STARTED',
      periods_used: 0,
      completion_date: '',
      teacher_remarks: '',
      reopen_reason: ''
    }
  });

  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/teacher/syllabus?month=${encodeURIComponent(selectedMonth)}`;
      if (selectedBatch) {
        const [c, s, sub] = selectedBatch.split('___');
        url += `&class_name=${encodeURIComponent(c)}&section=${encodeURIComponent(s)}&subject_name=${encodeURIComponent(sub)}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setPlans(json.plans || []);
        setAllocatedSubjects(json.allocated_subjects || []);
        setSummary(json.progress_summary);

        if (!selectedBatch && json.allocated_subjects && json.allocated_subjects.length > 0) {
          const first = json.allocated_subjects[0];
          setSelectedBatch(`${first.class_name}___${first.section || 'A'}___${first.subject_name}`);
        }
      } else {
        setError(json.error || 'Failed to load syllabus plans.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedBatch]);

  useEffect(() => {
    // Check URL params for initial preselection
    const qClass = searchParams.get('class_name');
    const qSec = searchParams.get('section') || 'A';
    const qSub = searchParams.get('subject_name');
    if (qClass && qSub) {
      setSelectedBatch(`${qClass}___${qSec}___${qSub}`);
    }
  }, [searchParams]);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  const handleOpenEditTopic = (topic: any, plan: any) => {
    setTopicModal({
      isOpen: true,
      topic,
      plan,
      submitting: false,
      error: null,
      form: {
        status: topic.status || 'NOT_STARTED',
        periods_used: topic.periods_used || topic.planned_periods || 4,
        completion_date: topic.completion_date || new Date().toISOString().split('T')[0],
        teacher_remarks: topic.teacher_remarks || '',
        reopen_reason: ''
      }
    });
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicModal.topic || !topicModal.plan) return;

    // Reopen reason validation if was COMPLETED and changing to NOT_STARTED or IN_PROGRESS
    if (topicModal.topic.status === 'COMPLETED' && topicModal.form.status !== 'COMPLETED') {
      if (!topicModal.form.reopen_reason || topicModal.form.reopen_reason.trim().length < 5) {
        setTopicModal(prev => ({ ...prev, error: 'A mandatory justification reason is required to re-open a completed topic.' }));
        return;
      }
    }

    setTopicModal(prev => ({ ...prev, submitting: true, error: null }));
    const [c, s, sub] = selectedBatch.split('___');

    try {
      const res = await fetch('/api/teacher/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: topicModal.plan.class_name,
          section: s || 'A',
          subject_name: topicModal.plan.subject_name,
          topic_id: topicModal.topic.id,
          status: topicModal.form.status,
          periods_used: topicModal.form.periods_used,
          completion_date: topicModal.form.completion_date,
          teacher_remarks: topicModal.form.teacher_remarks,
          reopen_reason: topicModal.form.reopen_reason
        })
      });

      const json = await res.json();
      if (json.success) {
        setTopicModal(prev => ({ ...prev, isOpen: false }));
        setSuccessMessage(`Topic updated to ${topicModal.form.status}.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadSyllabus();
      } else {
        setTopicModal(prev => ({ ...prev, submitting: false, error: json.error || 'Failed to update topic.' }));
      }
    } catch {
      setTopicModal(prev => ({ ...prev, submitting: false, error: 'Network failure updating topic.' }));
    }
  };

  const handleMarkMonthCompleted = async (plan: any) => {
    const pendingTopics = (plan.topics || []).filter((t: any) => t.status !== 'COMPLETED');
    if (pendingTopics.length > 0) {
      const ok = confirm(`Warning: ${pendingTopics.length} topic(s) in ${plan.month} are still pending. Do you wish to batch mark all topics in ${plan.month} as Completed?`);
      if (!ok) return;
    }

    const [c, s, sub] = selectedBatch.split('___');
    try {
      const res = await fetch('/api/teacher/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_month',
          plan_id: plan.id,
          class_name: plan.class_name,
          section: s || 'A',
          subject_name: plan.subject_name
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`All topics for ${plan.month} marked completed!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadSyllabus();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            Month-wise Syllabus Coverage Tracker
          </h1>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-0.5">
            Admin curated CBSE curriculum plans • Teacher topic execution and period audits
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#DCE8E0] rounded-2xl shadow-xs">
            <span className="text-xs font-mono text-slate-500 font-bold uppercase">Overall:</span>
            <span className="text-xs font-black text-emerald-700 font-mono">{summary.percent}% Completed</span>
            <span className="text-[11px] text-slate-400 font-mono">({summary.completed_topics}/{summary.total_topics} Topics)</span>
          </div>
        )}
      </div>

      {/* Selectors */}
      <div className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase">
            Curriculum Month
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['April', 'May', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-[#122A24] text-white shadow-xs'
                    : 'bg-[#F8FAF9] text-[#2D5A4E] hover:bg-[#E2EBE5]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
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
                {alloc.class_name}-{alloc.section || 'A'} • {alloc.subject_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-mono">
          {error}
        </div>
      )}

      {/* Main Syllabus Plans List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading curriculum plans and coverage progress...
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#DCE8E0] text-slate-400 font-mono text-xs space-y-2">
          <ClipboardList className="w-8 h-8 mx-auto opacity-30 text-[#122A24]" />
          <p>No syllabus topics configured by Admin for {selectedMonth} under this subject.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-[#DCE8E0] shadow-sm overflow-hidden"
            >
              {/* Plan Header with Progress Bar */}
              <div className="p-5 border-b border-[#DCE8E0] bg-[#F8FAF9] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        {plan.class_name} • {plan.subject_name}
                      </span>
                      <span className="font-bold text-[#122A24] font-mono">{plan.month} Plan</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#122A24]">
                      {plan.completion_percent}% Completed ({plan.completed_topics}/{plan.total_topics} Topics)
                    </span>
                    <button
                      onClick={() => handleMarkMonthCompleted(plan)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Month Completed</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#E2EBE5] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${plan.completion_percent}%` }}
                  />
                </div>
              </div>

              {/* Topics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[#2D5A4E] font-bold font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-4">Chapter &amp; Topic Title</th>
                      <th className="py-3 px-3">Planned Periods</th>
                      <th className="py-3 px-3">Periods Used</th>
                      <th className="py-3 px-3">Target Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EBE5]">
                    {(plan.topics || []).map((t: any, idx: number) => {
                      const isCompleted = t.status === 'COMPLETED';
                      const isInProgress = t.status === 'IN_PROGRESS';

                      return (
                        <tr key={t.id} className="hover:bg-[#F8FAF9] transition">
                          <td className="py-3 px-3 font-mono text-slate-500">{t.chapter_no || idx + 1}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-slate-500 block">{t.chapter_title}</span>
                            <span className="font-bold text-[#122A24]">{t.topic_title}</span>
                            {t.teacher_remarks && (
                              <span className="text-[11px] text-emerald-800 block mt-0.5 font-mono">
                                Note: {t.teacher_remarks}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono">{t.planned_periods} periods</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#122A24]">{t.periods_used || 0}</td>
                          <td className="py-3 px-3 font-mono">
                            {t.target_date || '--'}
                            {t.is_overdue && (
                              <span className="block text-[10px] text-rose-600 font-bold uppercase">
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Completed
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                <Clock className="w-3 h-3 text-amber-600" />
                                In Progress
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                                Not Started
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenEditTopic(t, plan)}
                              className="px-3 py-1 bg-[#122A24] hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic Status Edit Modal */}
      {topicModal.isOpen && topicModal.topic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setTopicModal(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE8E0] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[#122A24]">Update Topic Coverage</h3>
              </div>
              <button
                onClick={() => setTopicModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-xl text-slate-400 hover:text-[#122A24] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F8FAF9] rounded-2xl border border-[#E2EBE5] space-y-1">
                <p className="font-mono text-slate-500 font-bold">{topicModal.topic.chapter_title}</p>
                <p className="text-sm font-bold text-[#122A24]">{topicModal.topic.topic_title}</p>
                <p className="font-mono text-[11px] text-slate-500">Planned periods: {topicModal.topic.planned_periods}</p>
              </div>

              <div>
                <label className="block text-slate-600 font-mono mb-1 font-bold">Coverage Status</label>
                <select
                  value={topicModal.form.status}
                  onChange={(e) => setTopicModal({
                    ...topicModal,
                    form: { ...topicModal.form, status: e.target.value as any }
                  })}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-bold text-[#122A24] cursor-pointer"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">Periods Actually Used</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={topicModal.form.periods_used}
                    onChange={(e) => setTopicModal({
                      ...topicModal,
                      form: { ...topicModal.form, periods_used: Number(e.target.value) || 0 }
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-mono font-bold text-[#122A24]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">Completion Date</label>
                  <input
                    type="date"
                    value={topicModal.form.completion_date}
                    onChange={(e) => setTopicModal({
                      ...topicModal,
                      form: { ...topicModal.form, completion_date: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-mono text-[#122A24]"
                  />
                </div>
              </div>

              {/* If topic was previously COMPLETED and now being reopened */}
              {topicModal.topic.status === 'COMPLETED' && topicModal.form.status !== 'COMPLETED' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                  <label className="block text-amber-900 font-mono font-bold">
                    Re-open Justification Reason <span className="text-rose-500">* (Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={topicModal.form.reopen_reason || ''}
                    onChange={(e) => setTopicModal({
                      ...topicModal,
                      form: { ...topicModal.form, reopen_reason: e.target.value }
                    })}
                    placeholder="e.g. Remedial revision required based on class test results."
                    className="w-full p-2 rounded-xl bg-white border border-amber-300 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-mono mb-1 font-bold">Faculty Teaching Remarks</label>
                <textarea
                  rows={3}
                  value={topicModal.form.teacher_remarks}
                  onChange={(e) => setTopicModal({
                    ...topicModal,
                    form: { ...topicModal.form, teacher_remarks: e.target.value }
                  })}
                  placeholder="Notes on student understanding, numerical drills completed, homework given..."
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs text-[#122A24]"
                />
              </div>

              {topicModal.error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {topicModal.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE8E0]">
                <button
                  type="button"
                  onClick={() => setTopicModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topicModal.submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {topicModal.submitting ? 'Saving...' : 'Save Coverage Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherSyllabusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading syllabus tracker...</div>}>
      <TeacherSyllabusContent />
    </Suspense>
  );
}
