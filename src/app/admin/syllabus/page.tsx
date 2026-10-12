'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Download, 
  Upload, 
  Save, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Layers, 
  Clock,
  ArrowUpDown,
  X
} from 'lucide-react';
import { SyllabusTopic, SyllabusPlan } from '@/lib/types';

const MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

export default function AdminSyllabusPage() {
  const [plans, setPlans] = useState<SyllabusPlan[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedMonth, setSelectedMonth] = useState('April');

  const [currentPlan, setCurrentPlan] = useState<SyllabusPlan | null>(null);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Topic Modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [chapterNo, setChapterNo] = useState(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedPeriods, setPlannedPeriods] = useState(4);
  const [targetDate, setTargetDate] = useState('');

  // Copy Modal
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [targetCopyClasses, setTargetCopyClasses] = useState<string[]>([]);
  const [copying, setCopying] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success && data.classes?.length > 0) {
        setClasses(data.classes);
        setSelectedClass(data.classes[0].class_name);
        if (data.classes[0].subjects?.length > 0) {
          setSelectedSubject(data.classes[0].subjects[0].name);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [selectedClass, selectedSubject, selectedMonth]);

  const fetchPlan = async () => {
    if (!selectedClass || !selectedSubject || !selectedMonth) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        class_name: selectedClass,
        subject_name: selectedSubject,
        month: selectedMonth
      });
      const res = await fetch(`/api/admin/syllabus?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.plans?.length > 0) {
        setCurrentPlan(data.plans[0]);
        setTopics(data.plans[0].topics || []);
      } else {
        setCurrentPlan(null);
        setTopics([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddTopic = () => {
    setEditingTopicId(null);
    setChapterNo(topics.length + 1);
    setChapterTitle(`Chapter ${topics.length + 1}`);
    setTopicTitle('');
    setDescription('');
    setPlannedPeriods(4);
    setTargetDate('');
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (t: SyllabusTopic) => {
    setEditingTopicId(t.id);
    setChapterNo(Number(t.chapter_no) || 1);
    setChapterTitle(t.chapter_title);
    setTopicTitle(t.topic_title);
    setDescription(t.description || '');
    setPlannedPeriods(t.planned_periods || 4);
    setTargetDate(t.target_date || '');
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;

    if (editingTopicId) {
      setTopics(prev => prev.map(t => t.id === editingTopicId ? {
        ...t,
        chapter_no: Number(chapterNo),
        chapter_title: chapterTitle,
        topic_title: topicTitle,
        description,
        planned_periods: Number(plannedPeriods),
        target_date: targetDate
      } : t));
    } else {
      const newTopic: SyllabusTopic = {
        id: `TOPIC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        chapter_no: Number(chapterNo),
        chapter_title: chapterTitle,
        topic_title: topicTitle,
        description,
        planned_periods: Number(plannedPeriods),
        target_date: targetDate,
        order: topics.length + 1
      };
      setTopics(prev => [...prev, newTopic]);
    }
    setIsTopicModalOpen(false);
  };

  const handleDeleteTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const monthIdx = MONTHS.indexOf(selectedMonth) + 1;
      const payload = {
        class_name: selectedClass,
        subject_name: selectedSubject,
        month: selectedMonth,
        month_order: monthIdx,
        topics
      };

      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `Syllabus saved for Class ${selectedClass} ${selectedSubject} (${selectedMonth})!` });
        setCurrentPlan(data.plan);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save syllabus' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPlan = async () => {
    if (targetCopyClasses.length === 0 || !currentPlan) return;
    try {
      setCopying(true);
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy_to_classes',
          copy_to_classes: targetCopyClasses,
          plan: {
            ...currentPlan,
            topics
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `Syllabus copied successfully to: ${targetCopyClasses.join(', ')}` });
        setIsCopyModalOpen(false);
        setTargetCopyClasses([]);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to replicate syllabus' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCopying(false);
    }
  };

  const exportTopicsCSV = () => {
    if (topics.length === 0) return;
    const headers = ['Chapter No', 'Chapter Title', 'Topic Title', 'Planned Periods', 'Target Date', 'Description'];
    const rows = topics.map(t => [
      t.chapter_no,
      `"${t.chapter_title}"`,
      `"${t.topic_title}"`,
      t.planned_periods,
      `"${t.target_date || ''}"`,
      `"${t.description || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Syllabus_${selectedClass}_${selectedSubject}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return;

      const importedTopics: SyllabusTopic[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          importedTopics.push({
            id: `TOPIC-${Date.now()}-${i}`,
            chapter_no: Number(parts[0]) || i,
            chapter_title: parts[1] || `Chapter ${i}`,
            topic_title: parts[2] || `Topic ${i}`,
            planned_periods: Number(parts[3]) || 4,
            target_date: parts[4] || '',
            description: parts[5] || '',
            order: i
          });
        }
      }

      if (importedTopics.length > 0) {
        setTopics(prev => [...prev, ...importedTopics]);
        setFeedback({ type: 'success', text: `Imported ${importedTopics.length} topics from CSV successfully!` });
      }
    };
    reader.readAsText(file);
  };

  const currentClassObj = classes.find(c => c.class_name === selectedClass);
  const subjectsList = currentClassObj?.subjects?.map((s: any) => s.name) || [
    'Mathematics', 'Science', 'English', 'Social Science', 'Hindi'
  ];

  const totalPeriods = topics.reduce((acc, t) => acc + (t.planned_periods || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-[#122A24] text-white p-6 rounded-2xl shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Curriculum Administration
            </span>
            <span className="text-emerald-300/60 text-xs">Session 2026-27</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Month-Wise Syllabus Management</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Author curriculum coverage benchmarks, chapters, planned periods, and copy across grades.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCopyModalOpen(true)}
            disabled={topics.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy to Classes
          </button>
          <button
            onClick={handleSavePlan}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Syllabus'}
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
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

      {/* Selector Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Class / Grade:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
          >
            {classes.length > 0 ? (
              classes.map(c => (
                <option key={c.class_name} value={c.class_name}>Class {c.class_name}</option>
              ))
            ) : (
              ['9', '10', '11', '12'].map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
          >
            {subjectsList.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Academic Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
          >
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics Workstation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Class {selectedClass} • {selectedSubject} • {selectedMonth} Plan
              </h2>
              <p className="text-xs text-gray-500">
                {topics.length} Topics Planned • {totalPeriods} Teaching Periods
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-700">
              <Upload className="w-3.5 h-3.5" />
              Import CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>

            <button
              onClick={exportTopicsCSV}
              disabled={topics.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              onClick={handleOpenAddTopic}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Topic
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading curriculum plan...
          </div>
        ) : topics.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-900 text-sm">No topics defined for {selectedMonth}</p>
            <p className="text-xs text-gray-500 mt-1">Click &apos;Add Topic&apos; above or import via CSV to setup chapters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                  <th className="py-3 px-4 w-16">Ch #</th>
                  <th className="py-3 px-4">Chapter Title</th>
                  <th className="py-3 px-4">Topic / Sub-Topic</th>
                  <th className="py-3 px-4 text-center">Periods</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topics.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">{t.chapter_no}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{t.chapter_title}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{t.topic_title}</p>
                      {t.description && <p className="text-[11px] text-gray-500 mt-0.5">{t.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800">
                        {t.planned_periods || 4}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">{t.target_date || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditTopic(t)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(t.id)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Topic Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingTopicId ? 'Edit Syllabus Topic' : 'Add New Syllabus Topic'}
              </h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Ch #:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={chapterNo}
                    onChange={(e) => setChapterNo(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter Title:</label>
                  <input
                    type="text"
                    required
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="e.g., Quadratic Equations"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Topic Title:</label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g., Nature of Roots and Applications"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description / Notes:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key concepts to cover..."
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Planned Periods:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={plannedPeriods}
                    onChange={(e) => setPlannedPeriods(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Target Date:</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition"
                >
                  Confirm Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Plan Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Copy Syllabus to Other Classes</h3>
              <button onClick={() => setIsCopyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Replicate the {topics.length} planned topics for <strong>{selectedSubject} ({selectedMonth})</strong> to other sections or classes:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-4">
              {classes
                .filter(c => c.class_name !== selectedClass)
                .map(c => {
                  const isChecked = targetCopyClasses.includes(c.class_name);
                  return (
                    <label key={c.class_name} className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetCopyClasses(prev => [...prev, c.class_name]);
                          } else {
                            setTargetCopyClasses(prev => prev.filter(x => x !== c.class_name));
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      <span>Class {c.class_name}</span>
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopyPlan}
                disabled={copying || targetCopyClasses.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5" />
                {copying ? 'Copying...' : `Copy to ${targetCopyClasses.length} Classes`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
