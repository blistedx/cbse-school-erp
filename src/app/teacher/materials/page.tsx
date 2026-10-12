/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Plus,
  FileText,
  Trash2,
  Download,
  ExternalLink,
  X
} from 'lucide-react';
import { StudyMaterialItem } from '@/lib/types';

export default function TeacherMaterialsPage() {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batch: '',
    chapter_title: '',
    title: '',
    description: '',
    file_url: '',
    file_type: 'PDF'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [matRes, meRes] = await Promise.all([
        fetch('/api/teacher/materials'),
        fetch('/api/teacher/classes')
      ]);

      const matJson = await matRes.json();
      const meJson = await meRes.json();

      if (matJson.success) setMaterials(matJson.materials || []);
      if (meJson.success && meJson.allocated_subjects) {
        setAllocatedSubjects(meJson.allocated_subjects);
        if (meJson.allocated_subjects.length > 0 && !formData.batch) {
          const first = meJson.allocated_subjects[0];
          setFormData(prev => ({ ...prev, batch: `${first.class_name}___${first.section || 'A'}___${first.subject_name}` }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading study materials');
    } finally {
      setLoading(false);
    }
  }, [formData.batch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch || !formData.chapter_title || !formData.title) {
      setError('Please provide class, chapter, and material title.');
      return;
    }

    const [className, section, subjectName] = formData.batch.split('___');
    setFormSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/teacher/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: className,
          section,
          subject_name: subjectName,
          chapter_title: formData.chapter_title,
          title: formData.title,
          description: formData.description,
          file_url: formData.file_url,
          file_type: formData.file_type
        })
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setFormData({
          batch: formData.batch,
          chapter_title: '',
          title: '',
          description: '',
          file_url: '',
          file_type: 'PDF'
        });
        loadData();
      } else {
        setError(json.error || 'Failed to save material.');
      }
    } catch {
      setError('Network failure uploading study material.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this study material?')) return;
    try {
      const res = await fetch(`/api/teacher/materials?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMaterials(prev => prev.filter(m => m.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            Study Material &amp; Pedagogical Repository
          </h1>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-0.5">
            Upload revision notes, chapter presentations, and worksheets visible to scholars and parents
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Notes / Files</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading learning materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#DCE8E0] text-slate-400 font-mono text-xs space-y-2">
          <FolderOpen className="w-8 h-8 mx-auto opacity-30 text-[#122A24]" />
          <p>No study materials uploaded yet. Click "Upload Notes / Files" to publish digital resources.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px]">
                    {mat.class_name} • {mat.subject_name}
                  </span>
                  <button
                    onClick={() => handleDelete(mat.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Delete material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">{mat.chapter_title}</span>
                  <h3 className="text-sm font-bold text-[#122A24]">{mat.title}</h3>
                </div>

                {mat.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{mat.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-[#E2EBE5] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">{mat.file_type || 'PDF'}</span>
                {mat.file_url ? (
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Reference Notes</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Material Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#DCE8E0] z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[#122A24]">Upload Learning Material</h3>
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
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Chapter / Unit Title</label>
                <input
                  type="text"
                  required
                  value={formData.chapter_title}
                  onChange={(e) => setFormData({ ...formData, chapter_title: e.target.value })}
                  placeholder="e.g. Unit 3: Linear Equations in Two Variables"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Document / Material Name</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. NCERT Exemplar Solved Practice Notes"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Pedagogical Notes / Summary</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe learning objectives and study advice..."
                  className="w-full p-3 rounded-xl bg-white border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1">File Format</label>
                  <select
                    value={formData.file_type}
                    onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-mono"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PPTX">PowerPoint (PPTX)</option>
                    <option value="DOCX">Word Document</option>
                    <option value="VIDEO">Video Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1">Cloud Storage URL</label>
                  <input
                    type="text"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-mono"
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
                  {formSubmitting ? 'Uploading...' : 'Publish to Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
