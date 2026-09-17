/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  Paperclip,
  Send,
  Users,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Upload,
  BookOpen,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  GraduationCap,
  Download,
  AlertCircle,
  CheckSquare,
  ListFilter
} from 'lucide-react';
import { Student, ClassRoom, Teacher } from '@/lib/types';
import { getSchoolInitials } from '@/lib/utils';
import { sortClassesChronologically } from '@/lib/cbse-subjects';

export interface DashboardHomeworkProps {
  students?: Student[];
  classes?: ClassRoom[];
  teachers?: Teacher[];
  schoolName?: string;
  userRole?: string;
  currentUser?: any;
  selectedSession?: string;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  class: string;
  section: string;
  subject: string;
  teacher: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // e.g. 08:00 AM
  description: string;
  submittedCount: number;
  totalCount: number;
  status: 'ACTIVE' | 'DUE_SOON' | 'COMPLETED';
  attachment?: string;
  color?: string;
  priority?: 'NORMAL' | 'URGENT' | 'WEEKEND_PROJECT';
}

const DEFAULT_ASSIGNMENTS: HomeworkAssignment[] = [
  {
    id: 'hw-1',
    title: 'Chapter 7: Fractions & Decimal Arithmetic Exercise 7.4',
    class: 'Class 6',
    section: 'A',
    subject: 'Mathematics',
    teacher: 'Mrs. Anjali Gupta',
    assignedDate: '2026-09-17',
    dueDate: '2026-09-18',
    dueTime: '08:00 AM',
    description: 'Solve Exercise 7.4 (Questions 1 through 8) in the homework register. Show step-by-step number line solutions for fraction addition.',
    submittedCount: 28,
    totalCount: 34,
    status: 'ACTIVE',
    color: 'border-blue-300 bg-blue-50/40 text-blue-900',
    attachment: 'Worksheet_Fractions_Ex7.pdf (1.4 MB)',
    priority: 'NORMAL'
  },
  {
    id: 'hw-2',
    title: 'Lab Manual: Separation of Substances & Sedimentation Experiment',
    class: 'Class 6',
    section: 'A',
    subject: 'Science',
    teacher: 'Mr. R. K. Nair',
    assignedDate: '2026-09-17',
    dueDate: '2026-09-19',
    dueTime: '09:00 AM',
    description: 'Draw the filtration and decantation diagram in science practical file. Write observations for sedimentation test with muddy water.',
    submittedCount: 16,
    totalCount: 34,
    status: 'ACTIVE',
    color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900',
    attachment: 'Sedimentation_Flowchart.pdf (2.1 MB)',
    priority: 'NORMAL'
  },
  {
    id: 'hw-3',
    title: 'English Grammatical Voice: Active to Passive Voice Conversion',
    class: 'Class 6',
    section: 'B',
    subject: 'English',
    teacher: 'Ms. Sunita Roy',
    assignedDate: '2026-09-17',
    dueDate: '2026-09-18',
    dueTime: '08:30 AM',
    description: 'Complete 15 worksheet sentences on past perfect active to passive conversion on page 42 of BBC Compacta Workbook.',
    submittedCount: 22,
    totalCount: 36,
    status: 'ACTIVE',
    color: 'border-indigo-300 bg-indigo-50/40 text-indigo-900',
    attachment: 'BBC_Compacta_P42.pdf (850 KB)',
    priority: 'NORMAL'
  },
  {
    id: 'hw-4',
    title: 'Map Work: Major Harappan Civilisation & Indus Sites',
    class: 'Class 7',
    section: 'A',
    subject: 'Social Science',
    teacher: 'Mr. Vikram Singh',
    assignedDate: '2026-09-17',
    dueDate: '2026-09-20',
    dueTime: '08:00 AM',
    description: 'Mark Mohenjo-daro, Harappa, Lothal, Kalibangan, and Dholavira on the physical outline map of India provided in class.',
    submittedCount: 14,
    totalCount: 38,
    status: 'ACTIVE',
    color: 'border-amber-300 bg-amber-50/40 text-amber-900',
    attachment: 'India_Outline_Map.pdf (800 KB)',
    priority: 'WEEKEND_PROJECT'
  },
  {
    id: 'hw-5',
    title: 'Linear Equations in Two Variables: Graphical Method Practice',
    class: 'Class 9',
    section: 'A',
    subject: 'Mathematics',
    teacher: 'Mr. Alok Verma',
    assignedDate: '2026-09-17',
    dueDate: '2026-09-18',
    dueTime: '07:45 AM',
    description: 'Solve NCERT Exercise 4.3 Questions 1 to 5 on graph sheet and paste in homework notebook.',
    submittedCount: 31,
    totalCount: 40,
    status: 'ACTIVE',
    color: 'border-cyan-300 bg-cyan-50/40 text-cyan-900',
    attachment: 'Graph_Sheet_Template.pdf (400 KB)',
    priority: 'URGENT'
  },
  {
    id: 'hw-6',
    title: 'Chemical Reactions & Equations: Balancing 20 Redox Reactions',
    class: 'Class 10',
    section: 'A',
    subject: 'Science',
    teacher: 'Dr. Meenakshi Sundaram',
    assignedDate: '2026-09-16',
    dueDate: '2026-09-17',
    dueTime: '08:00 AM',
    description: 'Balance all 20 chemical equations from CBSE Board Question Bank Sheet. State type of reaction for each (Decomposition, Displacement, etc.).',
    submittedCount: 42,
    totalCount: 42,
    status: 'COMPLETED',
    color: 'border-purple-300 bg-purple-50/40 text-purple-900',
    attachment: 'Redox_Question_Bank_2026.pdf (1.8 MB)',
    priority: 'NORMAL'
  },
  {
    id: 'hw-7',
    title: 'Hindi Sparsh: Kabir ki Sakhi Arth Evam Prashnottar',
    class: 'Class 9',
    section: 'B',
    subject: 'Hindi',
    teacher: 'Dr. Ramesh Chandra',
    assignedDate: '2026-09-16',
    dueDate: '2026-09-18',
    dueTime: '08:00 AM',
    description: 'Write word meanings and answer Questions 1-6 in notebook. Memorize Sakhi 1 & 2 for oral recitation.',
    submittedCount: 30,
    totalCount: 35,
    status: 'ACTIVE',
    color: 'border-rose-300 bg-rose-50/40 text-rose-900',
    attachment: 'Kabir_Sakhi_Notes.pdf (1.1 MB)',
    priority: 'NORMAL'
  },
  {
    id: 'hw-8',
    title: 'Physics Electrostatics: Coulomb Law & Electric Field Vector Numericals',
    class: 'Class 12',
    section: 'A',
    subject: 'Physics',
    teacher: 'Prof. S. K. Dwivedi',
    assignedDate: '2026-09-15',
    dueDate: '2026-09-17',
    dueTime: '08:00 AM',
    description: 'Solve HC Verma Chapter 29 Questions 12 to 24. Calculate resultant electric field on dipole axis.',
    submittedCount: 29,
    totalCount: 32,
    status: 'COMPLETED',
    color: 'border-teal-300 bg-teal-50/40 text-teal-900',
    attachment: 'HCV_Numericals_Ex29.pdf (3.2 MB)',
    priority: 'NORMAL'
  },
  {
    id: 'hw-9',
    title: 'Computer Science: Python List Comprehensions & Dictionary CRUD',
    class: 'Class 11',
    section: 'A',
    subject: 'Computer Science',
    teacher: 'Mr. Tarun Saxena',
    assignedDate: '2026-09-17',
    dueDate: '2026-09-19',
    dueTime: '10:00 AM',
    description: 'Write Python scripts for student database dictionary manipulation. Submit .py script or handwritten notebook flowchart.',
    submittedCount: 19,
    totalCount: 30,
    status: 'ACTIVE',
    color: 'border-sky-300 bg-sky-50/40 text-sky-900',
    attachment: 'Python_Practical_04.py (12 KB)',
    priority: 'NORMAL'
  }
];

const STANDARD_CLASSES = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12'
];

const STANDARD_SECTIONS = ['A', 'B', 'C', 'D'];

const STANDARD_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Social Science',
  'Hindi',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Accountancy',
  'Business Studies',
  'Economics',
  'Physical Education',
  'General Knowledge',
  'Environmental Studies (EVS)'
];

export function DashboardHomework({
  students = [],
  classes = [],
  teachers = [],
  schoolName = 'Delhi Public School',
  userRole = 'PRINCIPAL',
  currentUser,
  selectedSession = '2026-27'
}: DashboardHomeworkProps) {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>(DEFAULT_ASSIGNMENTS);

  // ── Filters State ──
  const todayStr = '2026-09-17';
  const yesterdayStr = '2026-09-16';
  const tomorrowStr = '2026-09-18';

  const [filterDate, setFilterDate] = useState<string>(''); // empty string = all dates
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // ── Create Modal State ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState('Class 6');
  const [newSection, setNewSection] = useState('A');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newAssignedDate, setNewAssignedDate] = useState(todayStr);
  const [newDueDate, setNewDueDate] = useState(tomorrowStr);
  const [newDueTime, setNewDueTime] = useState('08:00 AM');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTeacher, setNewTeacher] = useState(
    currentUser?.full_name || (teachers.length > 0 ? teachers[0].full_name : 'Mrs. Anjali Gupta')
  );
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newPriority, setNewPriority] = useState<'NORMAL' | 'URGENT' | 'WEEKEND_PROJECT'>('NORMAL');
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // ── Submission & Grading Modals ──
  const [viewSubmissionModal, setViewSubmissionModal] = useState<HomeworkAssignment | null>(null);
  const [studentSubmitModal, setStudentSubmitModal] = useState<HomeworkAssignment | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [studentSubmittedMap, setStudentSubmittedMap] = useState<Record<string, boolean>>({
    'hw-1': true,
    'hw-6': true
  });

  // ── Derived Class and Section Lists ──
  const availableClasses = useMemo(() => {
    if (classes && classes.length > 0) {
      const names = Array.from(new Set(classes.map((c) => c.class_name).filter(Boolean)));
      return sortClassesChronologically(names);
    }
    if (students && students.length > 0) {
      const names = Array.from(new Set(students.map((s) => s.class_name).filter(Boolean)));
      if (names.length > 0) return sortClassesChronologically(names);
    }
    return STANDARD_CLASSES;
  }, [classes, students]);

  // ── Filtered Assignments ──
  const filteredAssignments = useMemo(() => {
    return assignments.filter((hw) => {
      // 1. Date filter
      if (filterDate && hw.assignedDate !== filterDate) {
        return false;
      }

      // 2. Class filter
      if (filterClass !== 'ALL') {
        const normFilter = filterClass.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normHw = hw.class.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!normHw.includes(normFilter) && !normFilter.includes(normHw)) {
          return false;
        }
      }

      // 3. Section filter
      if (filterSection !== 'ALL' && hw.section.toUpperCase() !== filterSection.toUpperCase()) {
        return false;
      }

      // 4. Subject filter
      if (filterSubject !== 'ALL' && hw.subject.toLowerCase() !== filterSubject.toLowerCase()) {
        return false;
      }

      // 5. Status filter
      if (filterStatus !== 'ALL' && hw.status !== filterStatus) {
        return false;
      }

      // 6. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = hw.title.toLowerCase().includes(q);
        const matchDesc = hw.description.toLowerCase().includes(q);
        const matchTeacher = hw.teacher.toLowerCase().includes(q);
        const matchSubject = hw.subject.toLowerCase().includes(q);
        const matchClass = `${hw.class} ${hw.section}`.toLowerCase().includes(q);
        const matchAttachment = (hw.attachment || '').toLowerCase().includes(q);

        if (!matchTitle && !matchDesc && !matchTeacher && !matchSubject && !matchClass && !matchAttachment) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, filterDate, filterClass, filterSection, filterSubject, filterStatus, searchQuery]);

  // ── KPI Summary ──
  const stats = useMemo(() => {
    const total = filteredAssignments.length;
    const active = filteredAssignments.filter((a) => a.status === 'ACTIVE').length;
    const completed = filteredAssignments.filter((a) => a.status === 'COMPLETED').length;
    const totalSubs = filteredAssignments.reduce((acc, curr) => acc + (curr.submittedCount || 0), 0);
    const totalExpected = filteredAssignments.reduce((acc, curr) => acc + (curr.totalCount || 0), 0);
    const avgRate = totalExpected > 0 ? Math.round((totalSubs / totalExpected) * 100) : 0;

    const classesWithHw = new Set(filteredAssignments.map((a) => `${a.class}-${a.section}`)).size;

    return { total, active, completed, totalSubs, totalExpected, avgRate, classesWithHw };
  }, [filteredAssignments]);

  const hasActiveFilters = Boolean(
    filterDate || filterClass !== 'ALL' || filterSection !== 'ALL' || filterSubject !== 'ALL' || filterStatus !== 'ALL' || searchQuery
  );

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterClass('ALL');
    setFilterSection('ALL');
    setFilterSubject('ALL');
    setFilterStatus('ALL');
    setSearchQuery('');
  };

  const handlePublishHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newHw: HomeworkAssignment = {
      id: `hw-${Date.now()}`,
      title: newTitle.trim(),
      class: newClass,
      section: newSection,
      subject: newSubject,
      teacher: newTeacher || 'Assigned Faculty',
      assignedDate: newAssignedDate || todayStr,
      dueDate: newDueDate || tomorrowStr,
      dueTime: newDueTime || '08:00 AM',
      description: newDesc.trim() || 'Please complete assigned questions from textbook and submit in notebook.',
      submittedCount: 0,
      totalCount: 35,
      status: 'ACTIVE',
      color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900',
      attachment: newAttachmentName ? `${newAttachmentName} (PDF Sync)` : 'Curriculum_Worksheet.pdf (1.2 MB)',
      priority: newPriority
    };

    setAssignments([newHw, ...assignments]);
    setPublishedSuccess(true);
    setTimeout(() => {
      setPublishedSuccess(false);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewAttachmentName('');
    }, 1200);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & HERO BANNER (MATCHING DASHBOARD UI SYSTEM)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Editorial Watermark Typography */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[210px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
        >
          Homework
        </div>
        {/* School Initials Bottom-Right Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
        >
          {getSchoolInitials({ school_name: schoolName })}
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
                <FileText className="h-7 w-7 text-emerald-700 shrink-0" />
                <span>Daily Class Homework &amp; Diary Dispatcher</span>
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                CBSE Diary Roster • {selectedSession}
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
              Date-wise homework tracker, multi-class filter, worksheet PDFs &amp; student submission monitor
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <div className="flex bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0]">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-[#122A24] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Card View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-[#122A24] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Table Roster</span>
              </button>
            </div>

            {userRole !== 'STUDENT' && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 border-none cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dispatch New Homework</span>
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. DASHBOARD KPI HERO BANNER (DEEP FOREST GREEN #122A24)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-[#122A24] rounded-2xl p-5 sm:p-7 border border-[#1C443A] shadow-md relative overflow-hidden z-10">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#1C443A]/70 relative z-10">
            {/* Tile 1: Total Homework */}
            <div className="sm:pr-4 group select-none">
              <div className="flex items-center gap-2 text-emerald-300">
                <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-xs sm:text-[13px] font-medium text-emerald-200/90">
                  {filterDate ? `Homework for ${formatDateDisplay(filterDate)}` : 'Total Active Tasks'}
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight mt-2 font-sans">
                {stats.total} <span className="text-xs font-mono text-emerald-300/70 font-normal">Assignments</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-300 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Across {stats.classesWithHw} Class Section(s)</span>
              </div>
            </div>

            {/* Tile 2: Active Submissions */}
            <div className="pt-4 sm:pt-0 sm:px-4 group select-none">
              <div className="flex items-center gap-2 text-emerald-300">
                <Clock className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-xs sm:text-[13px] font-medium text-emerald-200/90">Active Deadlines</span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight mt-2 font-sans">
                {stats.active} <span className="text-xs font-mono text-emerald-300/70 font-normal">Open</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-300/80 mt-1 flex items-center gap-1.5">
                <span>{stats.completed} Completed &amp; Archived</span>
              </div>
            </div>

            {/* Tile 3: Submission Rate */}
            <div className="pt-4 sm:pt-0 sm:px-4 group select-none">
              <div className="flex items-center gap-2 text-emerald-300">
                <GraduationCap className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-xs sm:text-[13px] font-medium text-emerald-200/90">Turn-in Rate</span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight mt-2 font-sans">
                {stats.avgRate}%
              </div>
              <div className="text-[11px] font-mono text-emerald-300/70 mt-1 flex items-center gap-1.5">
                <span>{stats.totalSubs} of {stats.totalExpected} Submitted</span>
              </div>
            </div>

            {/* Tile 4: Target Filter State */}
            <div className="pt-4 sm:pt-0 sm:pl-4 group select-none">
              <div className="flex items-center gap-2 text-amber-300">
                <SlidersHorizontal className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-xs sm:text-[13px] font-medium text-amber-200/90">Filter Scope</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white tracking-tight mt-2 truncate font-sans">
                {filterClass === 'ALL' ? 'All Classes' : filterClass}
                {filterSection !== 'ALL' ? ` - Sec ${filterSection}` : ''}
              </div>
              <div className="text-[11px] font-mono text-amber-300 mt-1 flex items-center gap-1.5 truncate">
                <span>{filterDate ? formatDateDisplay(filterDate) : 'Showing All Dates'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. MULTI-DIMENSIONAL DATE, CLASS & SECTION FILTER TOOLBAR
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-[#F8FAF9] p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] space-y-3.5 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Quick Date Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#122A24] flex items-center gap-1.5 mr-1">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-700" /> Date:
              </span>
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                  !filterDate
                    ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Dates
              </button>
              <button
                type="button"
                onClick={() => setFilterDate(todayStr)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                  filterDate === todayStr
                    ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Today (17 Sep)
              </button>
              <button
                type="button"
                onClick={() => setFilterDate(yesterdayStr)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                  filterDate === yesterdayStr
                    ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Yesterday (16 Sep)
              </button>
              <button
                type="button"
                onClick={() => setFilterDate(tomorrowStr)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                  filterDate === tomorrowStr
                    ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tomorrow (18 Sep)
              </button>
            </div>

            {/* Custom Date Picker & Search */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="outline-none bg-transparent font-mono text-xs text-slate-800 cursor-pointer"
                  title="Filter by assignment date"
                />
                {filterDate && (
                  <button
                    type="button"
                    onClick={() => setFilterDate('')}
                    className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 border-none cursor-pointer"
                    title="Clear date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search homework or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs outline-none text-slate-800 placeholder-slate-400 focus:border-emerald-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Filter Dropdowns: Class, Section, Subject, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#E8F0EA]">
            {/* Class Filter */}
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">
                Filter Class:
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-[#122A24] outline-none cursor-pointer focus:border-emerald-600"
              >
                <option value="ALL">All Classes</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">
                Filter Section:
              </label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-[#122A24] outline-none cursor-pointer focus:border-emerald-600"
              >
                <option value="ALL">All Sections (A-D)</option>
                {STANDARD_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">
                Filter Subject:
              </label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-[#122A24] outline-none cursor-pointer focus:border-emerald-600"
              >
                <option value="ALL">All Subjects</option>
                {STANDARD_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">
                Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-[#122A24] outline-none cursor-pointer focus:border-emerald-600"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active / Open</option>
                <option value="COMPLETED">Completed / Archived</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-2 pt-2 text-xs flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-mono">Active Filters:</span>
                {filterDate && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                    Date: {formatDateDisplay(filterDate)}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterDate('')} />
                  </span>
                )}
                {filterClass !== 'ALL' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold flex items-center gap-1">
                    {filterClass}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterClass('ALL')} />
                  </span>
                )}
                {filterSection !== 'ALL' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold flex items-center gap-1">
                    Section {filterSection}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterSection('ALL')} />
                  </span>
                )}
                {filterSubject !== 'ALL' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-1">
                    {filterSubject}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterSubject('ALL')} />
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-semibold flex items-center gap-1">
                    "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-[#C4432B] hover:underline font-semibold flex items-center gap-1 border-none bg-transparent cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. HOMEWORK CARDS OR TABLE ROSTER VIEW
          ───────────────────────────────────────────────────────────── */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            <BookOpen className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-display font-bold text-lg text-[#122A24]">
            No Homework Found Matching Filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No assignments match the selected date{' '}
            {filterDate ? `(${formatDateDisplay(filterDate)})` : ''} and class / section criteria. Try resetting the filters or dispatching a new homework task.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
            {userRole !== 'STUDENT' && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 border-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> Dispatch Homework
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((hw) => (
            <div
              key={hw.id}
              className={`p-5 rounded-3xl border ${hw.color || 'border-slate-200'} bg-white shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              <div>
                {/* Header Chips */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-[#122A24] text-white font-mono">
                      {hw.class} - {hw.section}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {hw.subject}
                    </span>
                  </div>
                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      hw.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {hw.status}
                  </span>
                </div>

                {/* Assignment Title & Teacher */}
                <h3 className="font-display font-bold text-base text-[#122A24] mt-3 leading-snug">
                  {hw.title}
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  Assigned by: <span className="font-semibold text-slate-800">{hw.teacher}</span>
                </div>

                {/* Description Preview */}
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  {hw.description}
                </p>

                {/* Date Badges Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                    <Calendar className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span>Assigned: {formatDateDisplay(hw.assignedDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                    <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                    <span>Due: {formatDateDisplay(hw.dueDate)}</span>
                  </div>
                </div>

                {/* Attachment */}
                {hw.attachment && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 p-2 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0] text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{hw.attachment}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading worksheet: ${hw.attachment}`)}
                      className="p-1 text-emerald-700 hover:text-emerald-900 border-none bg-transparent cursor-pointer shrink-0"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submission Status & Action Buttons */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                {userRole === 'STUDENT' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">My Status:</span>
                      {studentSubmittedMap[hw.id] ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
                          <Clock className="w-3 h-3 text-amber-600" /> Due
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setStudentSubmitModal(hw)}
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none ${
                        studentSubmittedMap[hw.id]
                          ? 'bg-[#EBF5EF] hover:bg-emerald-100 text-[#122A24]'
                          : 'bg-[#122A24] hover:bg-[#1C443A] text-white shadow-xs'
                      }`}
                    >
                      {studentSubmittedMap[hw.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" /> View My Submission
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-emerald-400" /> Submit Homework
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Submissions Progress:</span>
                      <span className="font-mono text-[#122A24] font-bold">
                        {hw.submittedCount} / {hw.totalCount} ({Math.round((hw.submittedCount / hw.totalCount) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(hw.submittedCount / hw.totalCount) * 100}%` }}
                      />
                    </div>

                    <button
                      onClick={() => setViewSubmissionModal(hw)}
                      className="w-full mt-2 py-2 bg-[#F4F8F5] hover:bg-slate-200 text-[#122A24] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#DCE8E0]"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" /> Review Submissions &amp; Grade
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF9] text-[11px] font-mono font-bold uppercase text-slate-600 border-b border-[#DCE8E0]">
                <tr>
                  <th className="py-3 px-4">Assigned Date</th>
                  <th className="py-3 px-4">Class &amp; Sec</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Homework Title</th>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredAssignments.map((hw) => (
                  <tr key={hw.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#122A24] whitespace-nowrap">
                      {formatDateDisplay(hw.assignedDate)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-[#122A24] text-white font-mono font-bold text-[11px]">
                        {hw.class} - {hw.section}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {hw.subject}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-[#122A24] truncate">{hw.title}</div>
                      <div className="text-[10.5px] text-slate-500 truncate">{hw.description}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{hw.teacher}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateDisplay(hw.dueDate)} ({hw.dueTime})
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">
                        {hw.submittedCount}/{hw.totalCount} ({Math.round((hw.submittedCount / hw.totalCount) * 100)}%)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewSubmissionModal(hw)}
                        className="px-3 py-1.5 bg-[#EBF5EF] hover:bg-emerald-100 text-[#1C443A] rounded-lg font-bold text-[11px] border border-[#C5E2CF] cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL: DISPATCH NEW HOMEWORK
          ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 my-6 animate-fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-display font-bold text-lg text-[#122A24] flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-700" />
                  <span>Dispatch New Homework / Class Diary</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Assign syllabus task, set deadlines &amp; sync directly to student &amp; parent diaries
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishHomework} className="space-y-4 text-xs">
              {/* Target Class & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Class *</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none font-semibold text-slate-800"
                    required
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Section *</label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none font-semibold text-slate-800"
                    required
                  >
                    {STANDARD_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none font-semibold text-slate-800"
                    required
                  >
                    {STANDARD_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates Row: Assigned Date & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Assigned Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAssignedDate}
                    onChange={(e) => setNewAssignedDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700" /> Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Time</label>
                  <input
                    type="text"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl outline-none font-mono text-xs"
                    placeholder="08:00 AM"
                  />
                </div>
              </div>

              {/* Assignment Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none text-xs font-semibold placeholder-slate-400 focus:border-emerald-600"
                  placeholder="e.g. Chapter 8: Linear Equations in Two Variables (Exercise 8.2)"
                />
              </div>

              {/* Instructions & Problem Sets */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Instructions &amp; Problem Sets *</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none text-xs font-sans placeholder-slate-400 focus:border-emerald-600 resize-none"
                  placeholder="Provide detailed instructions, question numbers from NCERT textbook, or reference materials..."
                />
              </div>

              {/* Teacher and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Faculty</label>
                  <input
                    type="text"
                    value={newTeacher}
                    onChange={(e) => setNewTeacher(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none text-xs font-medium"
                    placeholder="Faculty Name"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Task Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none text-xs font-semibold"
                  >
                    <option value="NORMAL">Standard Daily Homework</option>
                    <option value="URGENT">Urgent / Next Day Exam Prep</option>
                    <option value="WEEKEND_PROJECT">Weekend Holiday Project</option>
                  </select>
                </div>
              </div>

              {/* Worksheet PDF Attachment */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Attach Worksheet / Questions PDF (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="e.g. NCERT_Exercise_8_Worksheet.pdf"
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl outline-none text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sampleName = `Worksheet_${newSubject.replace(/\s+/g, '_')}_Ex_${Math.floor(1 + Math.random() * 9)}.pdf`;
                      setNewAttachmentName(sampleName);
                    }}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1 border border-slate-300 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach Sample
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer border-none"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{publishedSuccess ? 'Dispatched to Students & Diary! ✓' : 'Dispatch to Class Diary'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: VIEW SUBMISSIONS & GRADING (TEACHER VIEW)
          ───────────────────────────────────────────────────────────── */}
      {viewSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#122A24] text-white text-[10px] font-mono font-bold">
                    {viewSubmissionModal.class} - {viewSubmissionModal.section}
                  </span>
                  <span className="text-xs font-bold text-slate-600">{viewSubmissionModal.subject}</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#122A24] mt-1">
                  {viewSubmissionModal.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Assigned: {formatDateDisplay(viewSubmissionModal.assignedDate)} • Due: {formatDateDisplay(viewSubmissionModal.dueDate)}
                </p>
              </div>
              <button
                onClick={() => setViewSubmissionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission Stats */}
            <div className="grid grid-cols-3 gap-2.5 text-center bg-[#F8FAF9] p-3 rounded-2xl border border-[#E8F0EA]">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-500">Total Enrolled</div>
                <div className="text-base font-bold text-[#122A24]">{viewSubmissionModal.totalCount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-emerald-700 font-bold">Submitted</div>
                <div className="text-base font-bold text-emerald-800">{viewSubmissionModal.submittedCount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-amber-700 font-bold">Pending</div>
                <div className="text-base font-bold text-amber-800">
                  {viewSubmissionModal.totalCount - viewSubmissionModal.submittedCount}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {[
                { name: 'Aarav Sharma', roll: '01', time: '17 Sep, 07:45 PM', status: 'SUBMITTED', marks: '10/10' },
                { name: 'Aaradhya Kapoor', roll: '02', time: '17 Sep, 08:20 PM', status: 'SUBMITTED', marks: '9/10' },
                { name: 'Ayush Mehra', roll: '03', time: '18 Sep, 06:30 AM', status: 'SUBMITTED', marks: 'Pending Review' },
                { name: 'Ananya Singhania', roll: '04', time: '—', status: 'PENDING', marks: '—' },
                { name: 'Bhavya Jha', roll: '05', time: '17 Sep, 09:10 PM', status: 'SUBMITTED', marks: '10/10' },
                { name: 'Devansh Tiwari', roll: '06', time: '—', status: 'PENDING', marks: '—' }
              ].map((sub, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      #{sub.roll} {sub.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{sub.time}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                    <div className="text-[10.5px] text-slate-700 font-bold mt-0.5">{sub.marks}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setViewSubmissionModal(null)}
              className="w-full py-2.5 bg-[#122A24] text-white rounded-xl font-bold text-xs cursor-pointer border-none"
            >
              Done Reviewing
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. MODAL: STUDENT SUBMIT HOMEWORK
          ───────────────────────────────────────────────────────────── */}
      {studentSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {studentSubmitModal.subject}
                </span>
                <h3 className="font-display font-bold text-base text-[#122A24] mt-1">
                  {studentSubmitModal.title}
                </h3>
              </div>
              <button onClick={() => setStudentSubmitModal(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] text-slate-500 font-mono">
                  Assigned By: <strong className="text-slate-800">{studentSubmitModal.teacher}</strong>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Due Date: <strong className="text-slate-800">{formatDateDisplay(studentSubmitModal.dueDate)} ({studentSubmitModal.dueTime})</strong>
                </div>
                {studentSubmitModal.attachment && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-mono text-[11px] truncate">
                      {studentSubmitModal.attachment}
                    </span>
                    <button
                      onClick={() => alert(`Downloading ${studentSubmitModal.attachment}...`)}
                      className="px-2.5 py-1 bg-white border border-[#C5E2CF] rounded-lg text-emerald-800 font-bold hover:bg-[#EBF5EF] cursor-pointer"
                    >
                      Download PDF
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  My Homework Solution Notes / Description
                </label>
                <textarea
                  rows={3}
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Enter your answers or step-by-step notebook notes here..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-sans text-xs resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Attach Homework Photo / PDF (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => alert('Assignment notebook photo / scan attached successfully.')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-dashed border-slate-300 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Choose Photo / Notebook Scan</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStudentSubmitModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentSubmittedMap((prev) => ({ ...prev, [studentSubmitModal.id]: true }));
                    alert(
                      `Homework for "${studentSubmitModal.title}" submitted successfully to ${studentSubmitModal.teacher}!`
                    );
                    setStudentSubmitModal(null);
                  }}
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer border-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Faculty</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
