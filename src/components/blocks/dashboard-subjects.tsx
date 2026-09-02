/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import { apiFetch } from '@/lib/api-client';
import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  RotateCcw,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Layers,
  Award,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronDown,
  X,
  FileText,
  UserCheck,
  Code,
  Check,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { School, ClassRoom, Teacher, SubjectItem } from '@/lib/types';
import { getDefaultCbseSubjectsForClass, sortClassesChronologically } from '@/lib/cbse-subjects';

interface DashboardSubjectsProps {
  selectedSchool: School | null;
  classes: ClassRoom[];
  teachers: Teacher[];
  selectedSession: string;
  onRefresh: () => void;
  showAdminToast: (msg: string) => void;
}

export function DashboardSubjects({
  selectedSchool,
  classes,
  teachers,
  selectedSession,
  onRefresh,
  showAdminToast
}: DashboardSubjectsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'class_grouped' | 'table'>('class_grouped');

  // Modal State for Add / Edit Subject
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  const initialSubjectForm = {
    name: '',
    code: '',
    type: 'COMPULSORY' as 'COMPULSORY' | 'LANGUAGE' | 'SKILL' | 'ELECTIVE' | 'INTERNAL_ASSESSMENT',
    weekly_periods: 6,
    assigned_teacher: '',
    max_marks: 100
  };
  const [subjectForm, setSubjectForm] = useState(initialSubjectForm);
  const [saving, setSaving] = useState(false);
  const [resettingClassId, setResettingClassId] = useState<string | null>(null);

  // Helper to categorize class into Tier (supports Roman numerals and digits)
  const getClassTier = (className: string) => {
    const norm = (className || '').toLowerCase().trim();
    if (norm.includes('nursery') || norm.includes('lkg') || norm.includes('ukg') || norm.includes('kg') || norm.includes('pre-primary') || norm.includes('prep')) {
      return 'PRE_PRIMARY';
    }
    
    // Senior Secondary: 11, 12, XI, XII
    if (/\b(class\s*11|class\s*12|class\s*xi|class\s*xii|xi|xii|11|12)\b/i.test(norm)) {
      return 'SENIOR_SECONDARY';
    }
    
    // Secondary: 9, 10, IX, X
    if (/\b(class\s*9|class\s*10|class\s*ix|class\s*x|ix|x|9|10)\b/i.test(norm)) {
      return 'SECONDARY';
    }
    
    // Middle: 6, 7, 8, VI, VII, VIII
    if (/\b(class\s*6|class\s*7|class\s*8|class\s*vi|class\s*vii|class\s*viii|vi|vii|viii|6|7|8)\b/i.test(norm)) {
      return 'MIDDLE';
    }
    
    // Primary: 1, 2, 3, 4, 5, I, II, III, IV, V
    if (/\b(class\s*1|class\s*2|class\s*3|class\s*4|class\s*5|class\s*i|class\s*ii|class\s*iii|class\s*iv|class\s*v|i|ii|iii|iv|v|1|2|3|4|5)\b/i.test(norm)) {
      return 'PRIMARY';
    }
    
    return 'OTHER';
  };

  // Filter Classes
  const filteredClasses = useMemo(() => {
    const list = classes.filter(cls => {
      // Tier filter
      if (selectedTier !== 'ALL') {
        if (getClassTier(cls.class_name) !== selectedTier) return false;
      }
      // Specific class filter
      if (selectedClassId !== 'ALL') {
        if (cls.id !== selectedClassId) return false;
      }
      return true;
    });
    return sortClassesChronologically(list);
  }, [classes, selectedTier, selectedClassId]);

  // Compute Total Metrics across school
  const metrics = useMemo(() => {
    let totalAllocations = 0;
    let languageCount = 0;
    let stemCoreCount = 0;
    let skillAssessmentCount = 0;
    const uniqueSubjectCodes = new Set<string>();

    classes.forEach(c => {
      const subs = c.subjects || getDefaultCbseSubjectsForClass(c.class_name, c.section);
      subs.forEach(s => {
        totalAllocations++;
        if (s.code) uniqueSubjectCodes.add(s.code);
        if (s.type === 'LANGUAGE') languageCount++;
        else if (s.type === 'COMPULSORY' || s.type === 'ELECTIVE') stemCoreCount++;
        else if (s.type === 'SKILL' || s.type === 'INTERNAL_ASSESSMENT') skillAssessmentCount++;
      });
    });

    return {
      totalAllocations,
      uniqueSubjects: uniqueSubjectCodes.size,
      languageCount,
      stemCoreCount,
      skillAssessmentCount
    };
  }, [classes]);

  // Open Modal to Add Subject
  const handleOpenAddSubject = (classId?: string) => {
    const target = classId || (filteredClasses[0]?.id || classes[0]?.id || '');
    setTargetClassId(target);
    setEditingSubjectId(null);
    setSubjectForm(initialSubjectForm);
    setModalMode('ADD');
    setShowSubjectModal(true);
  };

  // Open Modal to Edit Subject
  const handleOpenEditSubject = (cls: ClassRoom, sub: SubjectItem) => {
    setTargetClassId(cls.id);
    setEditingSubjectId(sub.id);
    setSubjectForm({
      name: sub.name,
      code: sub.code || '',
      type: sub.type || 'COMPULSORY',
      weekly_periods: sub.weekly_periods || 6,
      assigned_teacher: sub.assigned_teacher || '',
      max_marks: sub.max_marks || 100
    });
    setModalMode('EDIT');
    setShowSubjectModal(true);
  };

  // Save / Update Subject API Handler
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassId || !subjectForm.name.trim()) return;

    setSaving(true);
    try {
      if (modalMode === 'ADD') {
        const res = await apiFetch('/api/classes/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            class_id: targetClassId,
            subject: {
              ...subjectForm,
              code: subjectForm.code.trim().toUpperCase()
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`Added "${subjectForm.name}" with CBSE Code "${subjectForm.code || 'N/A'}"!`);
          setShowSubjectModal(false);
          onRefresh();
        } else {
          alert(data.error || 'Failed to add subject');
        }
      } else if (modalMode === 'EDIT' && editingSubjectId) {
        const res = await apiFetch('/api/classes/subjects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            class_id: targetClassId,
            subject_id: editingSubjectId,
            updates: {
              ...subjectForm,
              code: subjectForm.code.trim().toUpperCase()
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`Updated subject "${subjectForm.name}"!`);
          setShowSubjectModal(false);
          onRefresh();
        } else {
          alert(data.error || 'Failed to update subject');
        }
      }
    } catch (e: any) {
      console.error(e);
      alert('Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Subject Handler
  const handleDeleteSubject = async (classId: string, subjectId: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to remove "${subjectName}" from this class curriculum?`)) return;

    try {
      const res = await apiFetch(`/api/classes/subjects?class_id=${classId}&subject_id=${subjectId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast(`Removed "${subjectName}" from curriculum.`);
        onRefresh();
      } else {
        alert(data.error || 'Failed to delete subject');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1-Click Reset Class to Official CBSE Defaults
  const handleResetClassSubjects = async (cls: ClassRoom) => {
    if (!confirm(`Reset ${cls.class_name} - ${cls.section} to official CBSE Curriculum subjects with prescribed codes?`)) return;

    setResettingClassId(cls.id);
    try {
      const res = await apiFetch('/api/classes/subjects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: cls.id })
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast(`Reset ${cls.class_name}-${cls.section} to CBSE prescribed subjects!`);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResettingClassId(null);
    }
  };

  // 1-Click Reset ALL Classes to Official CBSE Defaults
  const handleResetAllToCbse = async () => {
    if (!confirm('Are you sure you want to reset ALL classes across the school to official CBSE Curriculum subjects with standard codes?')) return;

    setSaving(true);
    try {
      for (const cls of classes) {
        await apiFetch('/api/classes/subjects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_id: cls.id })
        });
      }
      showAdminToast('All classes have been reset to official CBSE Curriculum standards!');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getSubjectTypeBadge = (type?: string) => {
    switch (type) {
      case 'LANGUAGE':
        return <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">Language</span>;
      case 'SKILL':
        return <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">Skill / AI</span>;
      case 'ELECTIVE':
        return <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">Elective</span>;
      case 'INTERNAL_ASSESSMENT':
        return <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">Assessment / PE</span>;
      case 'COMPULSORY':
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Compulsory Core</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ACTION TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Background Watermark Behind Header Text */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          SUBJECTS
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E8F0EA] relative z-10">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
                <BookOpen className="h-7 w-7 text-emerald-700" />
                <span>CBSE Curriculum &amp; Subjects Studio</span>
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                Session {selectedSession} • CBSE Prescribed
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E] mt-1.5 font-mono">
              Official CBSE subject codes, weekly period quotas, examination max marks, and faculty allocations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={handleResetAllToCbse}
              disabled={saving}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#122A24] border border-[#C5E2CF] text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset all classes to CBSE defaults"
            >
              <RotateCcw className={`h-3.5 w-3.5 text-amber-700 ${saving ? 'animate-spin' : ''}`} />
              <span>Reset All to CBSE Defaults</span>
            </button>

            <button
              onClick={() => handleOpenAddSubject()}
              className="px-4 py-2 rounded-full bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Add Custom Subject</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. FOUR CORE METRIC CARDS
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5]">
            <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">Total Subject Allocations</div>
            <div className="font-display font-bold text-2xl text-[#122A24] mt-1">
              {metrics.totalAllocations} <span className="text-xs font-mono text-slate-400 font-normal">across {classes.length} classes</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{metrics.uniqueSubjects} unique CBSE subject codes</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60">
            <div className="text-[11px] font-mono uppercase text-blue-800 font-bold">Language Curriculum</div>
            <div className="font-display font-bold text-2xl text-blue-950 mt-1">
              {metrics.languageCount} <span className="text-xs font-mono text-blue-700 font-normal">allocations</span>
            </div>
            <div className="text-[11px] font-mono text-blue-700 mt-1">
              English (101/184/301), Hindi (102/002), Sanskrit (122)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
            <div className="text-[11px] font-mono uppercase text-emerald-800 font-bold">STEM &amp; Core Subjects</div>
            <div className="font-display font-bold text-2xl text-emerald-950 mt-1">
              {metrics.stemCoreCount} <span className="text-xs font-mono text-emerald-700 font-normal">allocations</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 mt-1">
              Math (041), Science (086), Physics (042), Accounts (055)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
            <div className="text-[11px] font-mono uppercase text-amber-900 font-bold">Skill &amp; Internal Assessments</div>
            <div className="font-display font-bold text-2xl text-amber-950 mt-1">
              {metrics.skillAssessmentCount} <span className="text-xs font-mono text-amber-800 font-normal">allocations</span>
            </div>
            <div className="text-[11px] font-mono text-amber-800 mt-1">
              IT (402), AI (417), Health &amp; PE (506), Art (502)
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. INTERACTIVE FILTERS & SEARCH
            ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject name, CBSE code (e.g. 184, 041, 086), or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-medium text-[#122A24] focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tier Selector */}
            <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0] text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => {
                  setSelectedTier(e.target.value);
                  setSelectedClassId('ALL');
                }}
                className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Tiers</option>
                <option value="PRE_PRIMARY">Pre-Primary (Nur - UKG)</option>
                <option value="PRIMARY">Primary (Classes 1 - 5)</option>
                <option value="MIDDLE">Middle (Classes 6 - 8)</option>
                <option value="SECONDARY">Secondary (Classes 9 - 10)</option>
                <option value="SENIOR_SECONDARY">Senior Secondary (11 - 12)</option>
              </select>
            </div>

            {/* Specific Class Selector */}
            <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0] text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2">Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1 max-w-[150px] truncate"
              >
                <option value="ALL">All Classes ({filteredClasses.length})</option>
                {sortClassesChronologically(classes).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.class_name} - {c.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Type Selector */}
            <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0] text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2">Type:</span>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Types</option>
                <option value="COMPULSORY">Compulsory</option>
                <option value="LANGUAGE">Language</option>
                <option value="SKILL">Skill / Vocational</option>
                <option value="ELECTIVE">Elective</option>
                <option value="INTERNAL_ASSESSMENT">Internal Assessment</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0] text-xs">
              <button
                onClick={() => setViewMode('class_grouped')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
                  viewMode === 'class_grouped' ? 'bg-[#122A24] text-white shadow-2xs' : 'bg-transparent text-slate-600'
                }`}
              >
                Class Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
                  viewMode === 'table' ? 'bg-[#122A24] text-white shadow-2xs' : 'bg-transparent text-slate-600'
                }`}
              >
                Master Table
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. CLASS-GROUPED STUDIO VIEW
            ───────────────────────────────────────────────────────────── */}
        {viewMode === 'class_grouped' && (
          <div className="space-y-6 pt-2">
            {filteredClasses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-mono text-xs">
                No classes found matching the selected filters.
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const rawSubjects = cls.subjects && cls.subjects.length > 0
                  ? cls.subjects
                  : getDefaultCbseSubjectsForClass(cls.class_name, cls.section);

                // Filter subjects within class by search and type
                const classSubjects = rawSubjects.filter(sub => {
                  if (selectedTypeFilter !== 'ALL' && sub.type !== selectedTypeFilter) return false;
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    const nameMatch = (sub.name || '').toLowerCase().includes(q);
                    const codeMatch = (sub.code || '').toLowerCase().includes(q);
                    const teacherMatch = (sub.assigned_teacher || '').toLowerCase().includes(q);
                    const classMatch = cls.class_name.toLowerCase().includes(q);
                    if (!nameMatch && !codeMatch && !teacherMatch && !classMatch) return false;
                  }
                  return true;
                });

                if (searchQuery.trim() && classSubjects.length === 0) {
                  return null;
                }

                return (
                  <div
                    key={cls.id}
                    className="rounded-2xl border border-[#DCE8E0] bg-white overflow-hidden shadow-2xs transition-shadow hover:shadow-xs"
                  >
                    {/* Class Header Banner */}
                    <div className="bg-[#F8FAF9] px-5 py-3.5 border-b border-[#E2ECE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#122A24] text-white font-display font-bold text-xs flex items-center justify-center shadow-2xs">
                          {cls.class_name.replace(/class/i, '').trim()[0] || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-sm sm:text-base text-[#122A24]">
                              {cls.class_name} - Section {cls.section}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                              {classSubjects.length} Subjects Prescribed
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            Class Teacher: <strong className="text-[#122A24]">{cls.class_teacher || 'Unassigned'}</strong> • Room: {cls.room_no || 'Room 101'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleResetClassSubjects(cls)}
                          disabled={resettingClassId === cls.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                          title="Restore official CBSE subject list for this class"
                        >
                          <RotateCcw className={`h-3 w-3 ${resettingClassId === cls.id ? 'animate-spin' : ''}`} />
                          <span>Reset to CBSE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAddSubject(cls.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#122A24] hover:bg-[#1C443A] text-white border-none cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Plus className="h-3 w-3 text-emerald-400" />
                          <span>Add Subject</span>
                        </button>
                      </div>
                    </div>

                    {/* Subjects Roster Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono font-bold text-[#2D5A4E] uppercase bg-white">
                            <th className="py-2.5 px-4 w-12 text-center">#</th>
                            <th className="py-2.5 px-4 w-28">CBSE Code</th>
                            <th className="py-2.5 px-4">Subject Name</th>
                            <th className="py-2.5 px-4 w-36">Category</th>
                            <th className="py-2.5 px-4 w-28 text-center">Periods/Wk</th>
                            <th className="py-2.5 px-4 w-28 text-center">Max Marks</th>
                            <th className="py-2.5 px-4">Assigned Faculty</th>
                            <th className="py-2.5 px-4 w-24 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F4F2]">
                          {classSubjects.map((sub, sIdx) => (
                            <tr key={sub.id || sIdx} className="hover:bg-[#F9FCFA] transition-colors group">
                              {/* Serial Number */}
                              <td className="py-2.5 px-4 text-center font-mono text-slate-400 font-semibold">
                                {sIdx + 1}
                              </td>

                              {/* CBSE Code */}
                              <td className="py-2.5 px-4 font-mono font-bold text-[#122A24]">
                                {sub.code ? (
                                  <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] text-[11px]">
                                    {sub.code}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>

                              {/* Subject Name */}
                              <td className="py-2.5 px-4 font-semibold text-[#122A24]">
                                {sub.name}
                              </td>

                              {/* Category Badge */}
                              <td className="py-2.5 px-4">
                                {getSubjectTypeBadge(sub.type)}
                              </td>

                              {/* Weekly Periods */}
                              <td className="py-2.5 px-4 text-center font-mono font-bold text-[#122A24]">
                                {sub.weekly_periods || 6} / wk
                              </td>

                              {/* Max Marks */}
                              <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-700">
                                {sub.max_marks || 100} M
                              </td>

                              {/* Assigned Faculty */}
                              <td className="py-2.5 px-4 font-mono text-xs">
                                {sub.assigned_teacher ? (
                                  <div className="flex items-center gap-1.5 text-[#122A24] font-medium">
                                    <div className="w-5 h-5 rounded-full bg-[#EBF5EF] border border-[#C5E2CF] flex items-center justify-center text-[9px] font-bold text-emerald-800">
                                      {sub.assigned_teacher[0]}
                                    </div>
                                    <span className="truncate">{sub.assigned_teacher}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSubject(cls, sub)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-[#122A24] hover:bg-[#EBF5EF] border-none bg-transparent cursor-pointer transition-colors"
                                    title="Edit Subject Name, Code, Periods or Teacher"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubject(cls.id, sub.id, sub.name)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                                    title="Delete this subject from class"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. MASTER FLAT TABLE VIEW
            ───────────────────────────────────────────────────────────── */}
        {viewMode === 'table' && (
          <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs pt-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono font-bold text-[#2D5A4E] uppercase bg-[#F8FAF9]">
                    <th className="py-3 px-4">Class &amp; Section</th>
                    <th className="py-3 px-4 w-28">CBSE Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4 w-36">Category</th>
                    <th className="py-3 px-4 w-28 text-center">Periods/Wk</th>
                    <th className="py-3 px-4 w-28 text-center">Max Marks</th>
                    <th className="py-3 px-4">Assigned Faculty</th>
                    <th className="py-3 px-4 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F2]">
                  {filteredClasses.flatMap(cls => {
                    const subs = cls.subjects && cls.subjects.length > 0
                      ? cls.subjects
                      : getDefaultCbseSubjectsForClass(cls.class_name, cls.section);
                    return subs.map(s => ({ ...s, parentClass: cls }));
                  }).filter(item => {
                    if (selectedTypeFilter !== 'ALL' && item.type !== selectedTypeFilter) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase().trim();
                      const nameMatch = (item.name || '').toLowerCase().includes(q);
                      const codeMatch = (item.code || '').toLowerCase().includes(q);
                      const teacherMatch = (item.assigned_teacher || '').toLowerCase().includes(q);
                      const classMatch = item.parentClass.class_name.toLowerCase().includes(q);
                      if (!nameMatch && !codeMatch && !teacherMatch && !classMatch) return false;
                    }
                    return true;
                  }).map((item, idx) => (
                    <tr key={`${item.parentClass.id}-${item.id || idx}`} className="hover:bg-[#F9FCFA] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#122A24]">
                        {item.parentClass.class_name} - {item.parentClass.section}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#122A24]">
                        {item.code ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] text-[11px]">
                            {item.code}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#122A24]">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        {getSubjectTypeBadge(item.type)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#122A24]">
                        {item.weekly_periods || 6}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {item.max_marks || 100} M
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {item.assigned_teacher || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubject(item.parentClass, item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-[#122A24] hover:bg-[#EBF5EF] border-none bg-transparent cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(item.parentClass.id, item.id, item.name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* ─────────────────────────────────────────────────────────────
          6. ADD / EDIT SUBJECT MODAL (STUDIO)
          ───────────────────────────────────────────────────────────── */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EBF5EF] border border-[#C5E2CF] flex items-center justify-center text-emerald-800">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    {modalMode === 'ADD' ? 'Add Subject to Curriculum' : 'Edit Curriculum Subject'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    Configure CBSE code, period quota, and assigned faculty
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubjectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              {/* Target Class Selection */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#122A24] mb-1">
                  Target Classroom <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  disabled={modalMode === 'EDIT'}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600"
                >
                  {sortClassesChronologically(classes).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} - Section {c.section} ({c.room_no || 'Room 101'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Name & CBSE Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-[#122A24] mb-1">
                    Subject Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics Standard"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-medium text-[#122A24] focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#122A24] mb-1">
                    CBSE Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 041"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-mono font-bold text-[#122A24] focus:outline-none focus:border-emerald-600 uppercase"
                  />
                </div>
              </div>

              {/* Category / Type & Max Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#122A24] mb-1">
                    Subject Category
                  </label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600"
                  >
                    <option value="COMPULSORY">Compulsory Core</option>
                    <option value="LANGUAGE">Language</option>
                    <option value="SKILL">Skill / Vocational</option>
                    <option value="ELECTIVE">Elective</option>
                    <option value="INTERNAL_ASSESSMENT">Internal Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#122A24] mb-1">
                    Max Marks (Evaluation)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={subjectForm.max_marks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, max_marks: Number(e.target.value) || 100 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-mono font-bold text-[#122A24] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Weekly Periods & Assigned Faculty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#122A24] mb-1">
                    Weekly Periods (Quota)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={subjectForm.weekly_periods}
                    onChange={(e) => setSubjectForm({ ...subjectForm, weekly_periods: Number(e.target.value) || 6 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-mono font-bold text-[#122A24] focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#122A24] mb-1">
                    Assigned Faculty Teacher
                  </label>
                  <select
                    value={subjectForm.assigned_teacher}
                    onChange={(e) => setSubjectForm({ ...subjectForm, assigned_teacher: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs font-medium text-[#122A24] focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Assign Teacher --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.full_name}>
                        {t.full_name} ({t.department || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8F0EA]">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 rounded-full border border-[#DCE8E0] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-full bg-[#122A24] hover:bg-[#1C443A] text-xs font-semibold text-white cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{saving ? 'Saving...' : modalMode === 'ADD' ? 'Add to Curriculum' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
