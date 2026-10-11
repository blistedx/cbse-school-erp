/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Trash2,
  Paperclip,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';
import { HomeworkItem } from '@/lib/types';

export default function TeacherHomeworkPage() {
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batch: '', // "Class 10___A___Mathematics"
    title: '',
    description: '',
    due_date: '',
    attachment_name: '',
    attachment_url: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [hwRes, meRes] = await Promise.all([
        fetch('/api/teacher/homework'),
        fetch('/api/teacher/classes')
      ]);

      const hwJson = await hwRes.json();
      const meJson = await meRes.json();

      if (hwJson.success) setHomework(hwJson.homework || []);
      if (meJson.success && meJson.allocated_subjects) {
        setAllocatedSubjects(meJson.allocated_subjects);
        if (meJson.allocated_subjects.length > 0 && !formData.batch) {
          const first = meJson.allocated_subjects[0];
          setFormData(prev => ({ ...prev, batch: `${first.class_name}___${first.section || 'A'}___${first.subject_name}` }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading homework.');
    } finally {
      setLoading(false);
    }
  }, [formData.batch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch || !formData.title || !formData.due_date) {
      setError('Please fill in all required fields.');
      return;
    }

    const [className, section, subjectName] = formData.batch.split('___');
    setFormSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/teacher/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: className,
          section,
          subject_name: subjectName,
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date,
          attachment_name: formData.attachment_name,
          attachment_url: formData.attachment_url
        })
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setFormData({
          batch: formData.batch,
          title: '',
          description: '',
          due_date: '',
          attachment_name: '',
          attachment_url: ''
        });
        loadData();
      } else {
        setError(json.error || 'Failed to save homework.');
      }
    } catch {
      setError('Network failure publishing homework.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this homework assignment?')) return;
    try {
      const res = await fetch(`/api/teacher/homework?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHomework(prev => prev.filter(h => h.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            Homework &amp; Assignments Workstation
          </h1>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-0.5">
            Create, manage and dispatch coursework tasks to your allocated classrooms
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading assigned homework tasks...
        </div>
      ) : homework.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#DCE8E0] text-slate-400 font-mono text-xs space-y-2">
          <BookOpen className="w-8 h-8 mx-auto opacity-30 text-[#122A24]" />
          <p>No active homework assignments found. Click "New Assignment" to publish coursework.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homework.map((hw) => (
            <div
              key={hw.id}
              className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px]">
                    {hw.class_name}-{hw.section} • {hw.subject_name}
                  </span>
                  <button
                    onClick={() => handleDelete(hw.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Delete homework"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-[#122A24]">{hw.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{hw.description}</p>

                {hw.attachment_url && (
                  <div className="pt-2">
                    <a
                      href={hw.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 hover:underline bg-emerald-50/60 px-2 py-1 rounded-lg border border-emerald-200/60"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{hw.attachment_name || 'Download Attachment'}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E2EBE5] flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Assigned: {hw.assigned_date}</span>
                <span className="font-bold text-amber-700">Due: {hw.due_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Homework Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE8E0] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[#122A24]">Create Coursework Assignment</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-[#122A24] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Target Class &amp; Subject</label>
                <select
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-bold text-[#122A24] cursor-pointer"
                >
                  {allocatedSubjects.map((alloc, idx) => (
                    <option key={idx} value={`${alloc.class_name}___${alloc.section || 'A'}___${alloc.subject_name}`}>
                      {alloc.class_name}-{alloc.section || 'A'} • {alloc.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Exercise 4.2 Numerical Problems"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Instructions &amp; Overview</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed instructions, question numbers, textbook references..."
                  className="w-full p-3 rounded-xl bg-white border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-mono text-[#122A24]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Attachment File URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.attachment_url}
                    onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-mono text-[#122A24]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE8E0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? 'Publishing...' : 'Publish to Scholars'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
