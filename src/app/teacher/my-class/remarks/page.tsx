'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Star, 
  ShieldAlert, 
  RefreshCw,
  Eye,
  EyeOff,
  User,
  X
} from 'lucide-react';

interface StudentOption {
  id: string;
  full_name: string;
  admission_no: string;
  roll_no: string;
}

interface StudentRemarkItem {
  id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  category: 'BEHAVIOR' | 'DISCIPLINE' | 'ACHIEVEMENT' | 'ATTENDANCE' | 'ACADEMIC';
  severity: 'POSITIVE' | 'NEUTRAL' | 'CONCERN' | 'CRITICAL';
  remark: string;
  created_by_teacher_name: string;
  visible_to_parents: boolean;
  created_at: string;
}

export default function ClassStudentRemarksPage() {
  const [remarks, setRemarks] = useState<StudentRemarkItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // New Remark Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<'BEHAVIOR' | 'DISCIPLINE' | 'ACHIEVEMENT' | 'ATTENDANCE' | 'ACADEMIC'>('BEHAVIOR');
  const [severity, setSeverity] = useState<'POSITIVE' | 'NEUTRAL' | 'CONCERN' | 'CRITICAL'>('POSITIVE');
  const [remarkText, setRemarkText] = useState('');
  const [visibleToParents, setVisibleToParents] = useState(true);
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [resRemarks, resStudents] = await Promise.all([
        fetch('/api/teacher/class/remarks'),
        fetch('/api/teacher/class/students')
      ]);

      const dataRemarks = await resRemarks.json();
      const dataStudents = await resStudents.json();

      if (dataRemarks.success) {
        setClassName(dataRemarks.class_name);
        setSection(dataRemarks.section);
        setRemarks(dataRemarks.remarks || []);
      }
      if (dataStudents.success) {
        setStudents(dataStudents.students || []);
        if (dataStudents.students?.length > 0) {
          setSelectedStudentId(dataStudents.students[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !remarkText.trim()) return;

    const studentObj = students.find(s => s.id === selectedStudentId);

    try {
      setSaving(true);
      setFeedback(null);
      const res = await fetch('/api/teacher/class/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          student_name: studentObj?.full_name || '',
          admission_no: studentObj?.admission_no || '',
          category,
          severity,
          remark: remarkText,
          visible_to_parents: visibleToParents
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Student conduct remark recorded successfully.' });
        setIsModalOpen(false);
        setRemarkText('');
        // Refresh remarks
        const refresh = await fetch('/api/teacher/class/remarks');
        const refreshedData = await refresh.json();
        if (refreshedData.success) {
          setRemarks(refreshedData.remarks || []);
        }
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to record remark' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRemark = async (id: string) => {
    if (!confirm('Are you sure you want to remove this observation remark?')) return;
    try {
      const res = await fetch(`/api/teacher/class/remarks?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRemarks(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRemarks = remarks.filter(r => {
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesSearch = r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.remark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.admission_no.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Discipline &amp; Conduct Remarks</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Maintain behavioral, achievement, and discipline observations for scholars in your class.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Record New Observation
        </button>
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

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'BEHAVIOR', 'DISCIPLINE', 'ACHIEVEMENT', 'ATTENDANCE', 'ACADEMIC'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#122A24] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'All Observations' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search remark or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Remarks Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading observations ledger...
          </div>
        ) : filteredRemarks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No remarks found</p>
            <p className="text-xs text-gray-500 mt-1">Use &apos;Record New Observation&apos; above to log positive or remedial notes.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRemarks.map((r) => {
              const isPositive = r.severity === 'POSITIVE';
              const isCritical = r.severity === 'CRITICAL' || r.severity === 'CONCERN';
              return (
                <div key={r.id} className="p-5 hover:bg-gray-50/70 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">{r.student_name}</h3>
                      <span className="text-xs font-mono text-gray-400">Adm: {r.admission_no}</span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPositive ? 'bg-emerald-100 text-emerald-800' :
                        isCritical ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {r.severity}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                        {r.category}
                      </span>

                      {r.visible_to_parents ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                          <Eye className="w-3 h-3" />
                          Visible to Parent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                          <EyeOff className="w-3 h-3" />
                          Internal Only
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                      {r.remark}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>Logged by {r.created_by_teacher_name || 'Class Teacher'}</span>
                      <span>•</span>
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRemark(r.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                    title="Remove observation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Observation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Record Scholar Observation</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRemark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Select Scholar:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} (Roll: {s.roll_no || 'NA'} | Adm: {s.admission_no})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                  >
                    <option value="BEHAVIOR">Behavior</option>
                    <option value="DISCIPLINE">Discipline</option>
                    <option value="ACHIEVEMENT">Achievement</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="ACADEMIC">Academic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Tone / Severity:
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                  >
                    <option value="POSITIVE">Positive / Praise</option>
                    <option value="NEUTRAL">Neutral Note</option>
                    <option value="CONCERN">Area of Concern</option>
                    <option value="CRITICAL">Critical Incident</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Observation / Remark:
                </label>
                <textarea
                  rows={4}
                  required
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Detail the specific behaviour, achievement or issue observed..."
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="visParents"
                  checked={visibleToParents}
                  onChange={(e) => setVisibleToParents(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="visParents" className="text-xs text-gray-700 cursor-pointer">
                  Publish observation to Parent Portal &amp; Dossier
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !remarkText.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {saving ? 'Recording...' : 'Record Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
