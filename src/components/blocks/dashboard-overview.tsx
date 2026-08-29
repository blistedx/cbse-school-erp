'use client';

import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  CalendarCheck,
  ArrowUpRight,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  ChevronDown,
  Calendar,
  CheckCircle2,
  FileText,
  Plus,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Activity,
  Layers,
  Percent,
  Check,
  UserCheck,
  BookOpen,
  School as SchoolIcon,
  AlertCircle,
  Bell,
  CalendarDays,
  Pin,
  PartyPopper,
  Bookmark
} from 'lucide-react';
import { School, Student, Teacher, ClassRoom, FeeInvoice, AttendanceRecord, SchoolOverview, User, Notice } from '@/lib/types';

// Pre-computed deterministic coordinates for the 15-segment speedometer ray gauge
const SPEEDOMETER_RAYS = [
  { x1: '35.00', y1: '100.00', x2: '18.00', y2: '100.00', active: true, bright: false },
  { x1: '36.65', y1: '85.57', x2: '20.08', y2: '81.79', active: true, bright: false },
  { x1: '41.51', y1: '71.85', x2: '26.21', y2: '64.49', active: true, bright: false },
  { x1: '49.18', y1: '59.47', x2: '35.89', y2: '48.86', active: true, bright: false },
  { x1: '59.22', y1: '49.03', x2: '48.56', y2: '35.70', active: true, bright: false },
  { x1: '71.07', y1: '41.07', x2: '63.50', y2: '25.66', active: true, bright: false },
  { x1: '84.10', y1: '35.98', x2: '79.94', y2: '19.24', active: true, bright: false },
  { x1: '97.80', y1: '34.02', x2: '97.23', y2: '16.73', active: true, bright: false },
  { x1: '111.45', y1: '35.25', x2: '114.45', y2: '18.31', active: true, bright: false },
  { x1: '124.63', y1: '39.56', x2: '131.07', y2: '23.76', active: true, bright: false },
  { x1: '136.75', y1: '46.79', x2: '146.36', y2: '32.88', active: true, bright: false },
  { x1: '147.26', y1: '56.55', x2: '159.63', y2: '45.19', active: true, bright: true },
  { x1: '155.67', y1: '68.37', x2: '170.23', y2: '60.10', active: true, bright: true },
  { x1: '161.58', y1: '81.67', x2: '177.68', y2: '76.88', active: true, bright: true },
  { x1: '164.71', y1: '95.88', x2: '181.63', y2: '94.80', active: false, bright: false }
];

interface DashboardOverviewProps {
  selectedSchool: School | null;
  overview: SchoolOverview | null;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  invoices: FeeInvoice[];
  attendance: AttendanceRecord[];
  notices: Notice[];
  currentUser: User | null;
  openStudentModal: (student?: Student) => void;
  openTeacherModal: (teacher?: Teacher) => void;
  setShowAddNotice?: (show: boolean) => void;
  setShowAddInvoice: (show: boolean) => void;
  setViewInvoice: (invoice: FeeInvoice) => void;
  setActiveTab: (tab: any) => void;
}

export function DashboardOverview({
  selectedSchool,
  overview,
  students,
  teachers,
  classes,
  invoices,
  attendance,
  notices,
  currentUser,
  openStudentModal,
  openTeacherModal,
  setShowAddNotice,
  setShowAddInvoice,
  setViewInvoice,
  setActiveTab
}: DashboardOverviewProps) {
  const [chartMode, setChartMode] = useState<'both' | 'students' | 'faculty'>('both');
  const [calendarFilter, setCalendarFilter] = useState<'all' | 'events' | 'holidays'>('all');

  // 1. Student Statistics
  const totalStudentsCount = overview?.kpis.totalStudents || (students.length > 0 ? students.length : 1642);
  const studentPresentCount = Math.round(totalStudentsCount * 0.964);
  const studentAbsentCount = totalStudentsCount - studentPresentCount;
  const studentAttendanceRate = overview?.kpis.attendanceToday || 96.4;

  // 2. Faculty & Staff Statistics
  const totalTeachersCount = teachers.length > 0 ? teachers.length : 48;
  const activeTeachersPresent = Math.max(1, Math.round(totalTeachersCount * 0.958));
  const facultyOnLeave = totalTeachersCount - activeTeachersPresent;
  const facultyAttendanceRate = 95.8;

  // 3. Fee & Revenue Statistics
  const totalBilled = invoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const collectionRate = invoices.length > 0 ? Math.round((totalPaid / (totalBilled || 1)) * 100) : 92;

  // Academic Calendar Events & Holidays
  const calendarEvents = [
    { id: 1, date: '29 Aug', day: 'Sat', title: 'National Sports Day Meet', type: 'event', tag: 'Campus Event', color: '#10B981', desc: 'Inter-house athletic & relay tournament' },
    { id: 2, date: '05 Sep', day: 'Sat', title: "Teachers' Day Felicitation", type: 'event', tag: 'Special Assembly', color: '#34D399', desc: 'Special assembly by Student Council' },
    { id: 3, date: '14 Sep', day: 'Mon', title: 'Mid-Term Examinations Begin', type: 'event', tag: 'Academic', color: '#122A24', desc: 'Classes 9th to 12th written evaluations' },
    { id: 4, date: '02 Oct', day: 'Fri', title: 'Mahatma Gandhi Jayanti', type: 'holiday', tag: 'Gazetted Holiday', color: '#C4432B', desc: 'Campus closed for public holiday' },
    { id: 5, date: '18 Oct', day: 'Sun', title: 'Autumn Break Commences', type: 'holiday', tag: 'Vacation', color: '#F59E0B', desc: 'Term 1 vacation for all students' },
  ];

  const filteredEvents = calendarEvents.filter(e => {
    if (calendarFilter === 'events') return e.type === 'event';
    if (calendarFilter === 'holidays') return e.type === 'holiday';
    return true;
  });

  // Display Notices
  const displayNotices = (notices && notices.length > 0) ? notices.slice(0, 4) : [
    {
      id: 'NOT-101',
      school_id: 'DPS2026',
      title: 'Mid-Term Examination Timetable Released',
      content: 'Detailed schedule for Classes 9 to 12 is available on student registers.',
      target_audience: 'ALL' as const,
      posted_by: 'Principal Office',
      created_at: 'Today, 08:30 AM'
    },
    {
      id: 'NOT-102',
      school_id: 'DPS2026',
      title: 'Fee Installment Due Date Reminder',
      content: 'Term 2 quarterly tuition fee payment due date is 15th September 2026.',
      target_audience: 'PARENTS' as const,
      posted_by: 'Accounts Office',
      created_at: 'Yesterday'
    },
    {
      id: 'NOT-103',
      school_id: 'DPS2026',
      title: 'Faculty Workshop on CBSE NEP Guidelines',
      content: 'Mandatory pedagogical workshop for PRT & TGT faculty on Saturday.',
      target_audience: 'TEACHERS' as const,
      posted_by: 'Academic Coordinator',
      created_at: '27 Aug 2026'
    }
  ];

  // Faculty On-Duty Roster
  const activeFacultyRoster = [
    { name: 'Pooja Iyer', code: 'DPS2026T01', dept: 'Mathematics', role: 'Senior Faculty', status: 'Present', checkIn: '07:45 AM', room: 'Room 204' },
    { name: 'Dr. V. Raman', code: 'DPS2026T02', dept: 'Physics', role: 'PGT Lead', status: 'Present', checkIn: '07:50 AM', room: 'Physics Lab' },
    { name: 'Ananya Roy', code: 'DPS2026T03', dept: 'English', role: 'TGT Faculty', status: 'Present', checkIn: '08:00 AM', room: 'Room 102' },
    { name: 'K. S. Verma', code: 'DPS2026T04', dept: 'Social Science', role: 'TGT Faculty', status: 'Present', checkIn: '08:05 AM', room: 'Room 305' },
    { name: 'Meenakshi D.', code: 'DPS2026T05', dept: 'Commerce', role: 'Senior Faculty', status: 'On Leave', checkIn: 'Sanctioned', room: 'Staff Room' },
  ];

  // Class Attendance Leaders
  const topClasses = [
    { name: 'Class 10 - A', teacher: 'Pooja Iyer', students: 38, capacity: 40, rate: 98.6, rank: 1, avatar: 'P' },
    { name: 'Class 12 - Sci', teacher: 'Dr. V. Raman', students: 35, capacity: 35, rate: 97.4, rank: 2, avatar: 'V' },
    { name: 'Class 8 - B', teacher: 'Ananya Roy', students: 39, capacity: 40, rate: 96.8, rank: 3, avatar: 'A' },
    { name: 'Class 9 - A', teacher: 'K. S. Verma', students: 36, capacity: 40, rate: 95.2, rank: 4, avatar: 'K' },
    { name: 'Class 11 - Com', teacher: 'Meenakshi D.', students: 32, capacity: 35, rate: 94.8, rank: 5, avatar: 'M' }
  ];

  const monthLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Recent Campus Activity Log
  const recentActivities = [
    { id: 1, title: 'Faculty Biometric Punch Verified', desc: '46/48 teachers on campus by 08:15 AM', time: '08:15 AM', type: 'staff' },
    { id: 2, title: 'Morning Assembly Attendance Locked', desc: 'Class 10-A verified by Pooja Iyer (38/40 present)', time: '08:45 AM', type: 'attendance' },
    { id: 3, title: 'Fee Payment Receipt Generated', desc: '₹15,000 received for Aarav Sharma (DPS2026001) via UPI', time: '10:20 AM', type: 'fee' },
    { id: 4, title: 'Medical Leave Approved', desc: 'Meenakshi D. (Commerce) leave sanctioned for 1 day', time: '11:00 AM', type: 'leave' }
  ];

  const adminGreeting = currentUser?.full_name || selectedSchool?.principal_name || selectedSchool?.admin_name || 'Administrator';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-slate-800 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          ROW 1: WELCOME HERO BANNER (FULL WIDTH & SPACIOUS)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#EBF5EF] via-[#E2F1E8] to-[#D5EBDC] border border-[#C5E2CF] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 font-mono text-[11px] font-semibold text-[#1C443A] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>{selectedSchool?.school_name || 'Delhi Public International School'}</span>
            <span className="text-slate-400">•</span>
            <span className="bg-[#122A24]/10 px-2 py-0.5 rounded-md text-[#122A24] font-bold">
              {selectedSchool?.school_code || 'DPS2026'}
            </span>
          </div>
          
          <h2 className="font-display font-bold text-2xl sm:text-[28px] leading-tight text-[#122A24] tracking-tight">
            Welcome back, {adminGreeting}!
          </h2>
          
          <p className="text-xs sm:text-[13px] leading-relaxed text-[#2D5A4E] mt-1.5 font-normal max-w-xl">
            Today's campus turnout is <strong className="font-bold text-[#122A24]">{studentAttendanceRate}%</strong> with <strong className="font-bold text-[#122A24]">{activeTeachersPresent}/{totalTeachersCount}</strong> faculty on active duty.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('attendance')}
            className="px-4 py-2.5 rounded-full bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border-none"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => openStudentModal()}
            className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#122A24] border border-[#C5E2CF] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Enroll Student
          </button>
          {setShowAddNotice && (
            <button
              onClick={() => setShowAddNotice(true)}
              className="px-3.5 py-2.5 rounded-full bg-white/80 hover:bg-white text-[#122A24] border border-[#C5E2CF] text-xs font-semibold shadow-2xs transition-colors cursor-pointer hidden sm:flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Post Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: 4 SPACIOUS CORE KPI STAT CARDS (GRID-COLS-4)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        
        {/* 1. Stat Card 1: Active Faculty & Staff */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider">Active Faculty</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4.5 h-4.5 text-emerald-700" />
            </div>
          </div>
          
          <div className="my-3">
            <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight flex items-baseline gap-1.5">
              <span>{activeTeachersPresent}</span>
              <span className="text-sm font-mono font-medium text-slate-400">/ {totalTeachersCount}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{facultyAttendanceRate}% present</span>
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>On Leave</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 text-[11px]">
              {facultyOnLeave} sanctioned
            </span>
          </div>
        </div>

        {/* 2. Stat Card 2: Active Students Enrolled & Present */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider">Active Students</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-xs">
              <Users className="w-4.5 h-4.5 text-emerald-700" />
            </div>
          </div>

          <div className="my-3">
            <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight flex items-baseline gap-1.5">
              <span>{studentPresentCount.toLocaleString()}</span>
              <span className="text-sm font-mono font-medium text-slate-400">/ {totalStudentsCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 whitespace-nowrap">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>+{studentAttendanceRate}% turnout</span>
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Absent Today</span>
            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 text-[11px]">
              {studentAbsentCount} students
            </span>
          </div>
        </div>

        {/* 3. Stat Card 3: Total Fee Revenue & Recovery */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider">Fee Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-xs">
              <CreditCard className="w-4.5 h-4.5 text-emerald-700" />
            </div>
          </div>

          <div className="my-3">
            <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight">
              {totalPaid > 0 ? (totalPaid >= 100000 ? `₹${(totalPaid / 100000).toFixed(2)}L` : `₹${totalPaid.toLocaleString()}`) : '₹47.78L'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                {collectionRate}% Collected • Term 1
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Pending Due</span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
              {totalPending > 0 ? `₹${(totalPending / 100000).toFixed(2)}L` : '₹16.41L'}
            </span>
          </div>
        </div>

        {/* 4. Stat Card 4: Campus Demographics Breakdown */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider">Campus Ratio</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 whitespace-nowrap">2026-27</span>
          </div>

          <div className="relative flex flex-col items-center justify-center my-1">
            <svg viewBox="0 0 100 60" className="w-28 h-18 overflow-visible">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E2ECE5" strokeWidth="9" strokeLinecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 48 14" fill="none" stroke="#34D399" strokeWidth="9" strokeDasharray="60 100" strokeLinecap="round" />
              <path d="M 48 14 A 40 40 0 0 1 82 36" fill="none" stroke="#10B981" strokeWidth="9" strokeDasharray="30 100" strokeLinecap="round" />
              <path d="M 82 36 A 40 40 0 0 1 90 50" fill="none" stroke="#122A24" strokeWidth="9" strokeDasharray="10 100" strokeLinecap="round" />
            </svg>
            <div className="text-center -mt-6">
              <div className="font-display font-bold text-lg text-[#122A24]">{totalStudentsCount + totalTeachersCount}</div>
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Total Campus</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-2 text-slate-600 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34D399] shrink-0" />
              <span>Boys: 52%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
              <span>Girls: 45%</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#122A24] shrink-0" />
              <span>Faculty: 3% ({totalTeachersCount} Staff)</span>
            </div>
          </div>
        </div>

      </div>


      {/* ─────────────────────────────────────────────────────────────
          ROW 3: SPACIOUS NOTICE BOARD (6 COLS) & ACADEMIC CALENDAR (6 COLS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* TILE 1: Official Notice Board (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/80 shadow-2xs">
                  <Bell className="w-4.5 h-4.5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">Official Notice Board</h3>
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">Campus Circulars &amp; Directives</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {setShowAddNotice && (
                  <button
                    onClick={() => setShowAddNotice(true)}
                    className="px-3.5 py-1.5 rounded-full bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-none shadow-2xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Post Circular</span>
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {displayNotices.map((n, idx) => (
                <div key={idx} className="py-3 group cursor-pointer hover:bg-[#F9FCFA] px-2.5 rounded-xl transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {n.target_audience}
                      </span>
                      <span className="text-xs font-semibold text-[#122A24] group-hover:text-emerald-700 transition-colors truncate">
                        {n.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 whitespace-nowrap">{n.created_at ? n.created_at.slice(0, 10) : 'Recent'}</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-1 mt-1 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono pl-1 mt-1.5 flex items-center gap-1">
                    <span>Issued by:</span>
                    <span className="font-semibold text-slate-600">{n.posted_by || 'Principal Office'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{notices.length || 3} Active Circulars Published</span>
            <button onClick={() => setActiveTab('notices')} className="text-emerald-800 hover:underline font-semibold border-none bg-transparent cursor-pointer">
              Open Notice Board Register →
            </button>
          </div>
        </div>

        {/* TILE 2: Academic Calendar for Events & Holidays (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/80 shadow-2xs">
                  <CalendarDays className="w-4.5 h-4.5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">Events &amp; Holidays Calendar</h3>
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">Academic Schedule 2026-27</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#F3F7F5] p-1 rounded-full border border-[#DDE7E1]">
                <button
                  onClick={() => setCalendarFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-none cursor-pointer transition-all ${
                    calendarFilter === 'all' ? 'bg-[#122A24] text-white shadow-2xs font-semibold' : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCalendarFilter('events')}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-none cursor-pointer transition-all ${
                    calendarFilter === 'events' ? 'bg-[#122A24] text-white shadow-2xs font-semibold' : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => setCalendarFilter('holidays')}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-none cursor-pointer transition-all ${
                    calendarFilter === 'holidays' ? 'bg-[#122A24] text-white shadow-2xs font-semibold' : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                  }`}
                >
                  Holidays
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredEvents.slice(0, 4).map((evt) => (
                <div key={evt.id} className="p-3 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] flex items-center gap-3.5 hover:bg-white hover:shadow-2xs transition-all">
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-[#C5E2CF] text-center shrink-0 min-w-[55px] shadow-2xs">
                    <span className="block font-mono text-[10px] text-slate-400 uppercase leading-none font-semibold">{evt.day}</span>
                    <span className="block font-display font-bold text-xs text-[#122A24] mt-1 leading-none">{evt.date}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#122A24]">
                        {evt.title}
                      </h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold shrink-0 whitespace-nowrap ${
                        evt.type === 'holiday' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {evt.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {evt.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="truncate mr-2">Upcoming: National Sports Meet (29 Aug)</span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0 whitespace-nowrap">Term 1 Active</span>
          </div>
        </div>

      </div>


      {/* ─────────────────────────────────────────────────────────────
          ROW 3: WEEKLY CAMPUS ATTENDANCE WAVE CHART (7 COLS)
          + COMBINED TURNOUT SPEEDOMETER (5 COLS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Attendance Wave Chart (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Weekly Turnout Curve</span>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#122A24]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Student: 96.4%
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#122A24]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#122A24]" /> Faculty: 95.8%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#F3F7F5] p-1 rounded-full border border-[#DDE7E1]">
                <button
                  onClick={() => setChartMode('both')}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-none cursor-pointer transition-all ${
                    chartMode === 'both' ? 'bg-[#122A24] text-white shadow-2xs' : 'bg-transparent text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setChartMode('students')}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-none cursor-pointer transition-all ${
                    chartMode === 'students' ? 'bg-[#122A24] text-white shadow-2xs' : 'bg-transparent text-slate-600'
                  }`}
                >
                  Students
                </button>
                <button
                  onClick={() => setChartMode('faculty')}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-none cursor-pointer transition-all ${
                    chartMode === 'faculty' ? 'bg-[#122A24] text-white shadow-2xs' : 'bg-transparent text-slate-600'
                  }`}
                >
                  Faculty
                </button>
              </div>
            </div>

            {/* Smooth Bézier SVG Wave Curve */}
            <div className="relative pt-2 pb-1">
              <svg viewBox="0 0 600 170" className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="studentWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="30" x2="600" y2="30" stroke="#F1F5F3" strokeWidth="1" />
                <line x1="0" y1="75" x2="600" y2="75" stroke="#F1F5F3" strokeWidth="1" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="#F1F5F3" strokeWidth="1" />
                <line x1="0" y1="160" x2="600" y2="160" stroke="#F1F5F3" strokeWidth="1" />

                {(chartMode === 'both' || chartMode === 'students') && (
                  <>
                    <path
                      d="M 30 110 Q 120 90, 220 100 T 400 45 T 520 30 L 570 20 L 570 165 L 30 165 Z"
                      fill="url(#studentWaveGradient)"
                    />
                    <path
                      d="M 30 110 Q 120 90, 220 100 T 400 45 T 520 30 L 570 20"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {(chartMode === 'both' || chartMode === 'faculty') && (
                  <path
                    d="M 30 70 Q 120 60, 220 65 T 400 35 T 520 25 L 570 20"
                    fill="none"
                    stroke="#122A24"
                    strokeWidth="3"
                    strokeDasharray={chartMode === 'both' ? '6 4' : 'none'}
                    strokeLinecap="round"
                  />
                )}

                <g transform="translate(520, 28)">
                  <circle r="7" fill="#FFFFFF" stroke="#10B981" strokeWidth="3" className="animate-ping opacity-75" />
                  <circle r="6" fill="#122A24" stroke="#FFFFFF" strokeWidth="2" />
                  <g transform="translate(-45, -34)">
                    <rect width="90" height="24" rx="12" fill="#122A24" />
                    <text x="45" y="16" fill="#FFFFFF" fontSize="10.5" fontWeight="600" textAnchor="middle" fontFamily="IBM Plex Mono">
                      96.4% Today
                    </text>
                  </g>
                </g>
              </svg>

              <div className="flex justify-between text-xs font-mono text-slate-400 px-2 pt-1 border-t border-slate-100">
                {monthLabels.map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Synchronized Biometric &amp; Attendance Records</span>
            <button onClick={() => setActiveTab('attendance')} className="text-emerald-800 hover:underline font-semibold border-none bg-transparent cursor-pointer">
              Mark Attendance Register →
            </button>
          </div>
        </div>

        {/* Turnout Speedometer (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Combined Campus Turnout</span>
              <span className="text-xs font-mono font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Status
              </span>
            </div>

            {/* Sunburst 15-Segment Ray Speedometer (Deterministic Pre-computed Rays) */}
            <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
              <svg viewBox="0 0 200 110" className="w-52 h-32 overflow-visible">
                {SPEEDOMETER_RAYS.map((ray, i) => (
                  <line
                    key={i}
                    x1={ray.x1}
                    y1={ray.y1}
                    x2={ray.x2}
                    y2={ray.y2}
                    stroke={ray.active ? (ray.bright ? '#34D399' : '#122A24') : '#E2ECE5'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                ))}
              </svg>

              <div className="text-center -mt-8">
                <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight">
                  96.2%
                </div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                  Campus Presence
                </div>
              </div>
            </div>

            {/* Turnout Details */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono mt-4 pt-3 border-t border-slate-100">
              <div className="bg-[#F3F7F5] p-2.5 rounded-xl border border-[#E2ECE5]">
                <div className="text-[11px] text-slate-500">Students</div>
                <div className="font-bold text-[#122A24] text-sm mt-0.5">96.4%</div>
              </div>
              <div className="bg-[#F3F7F5] p-2.5 rounded-xl border border-[#E2ECE5]">
                <div className="text-[11px] text-slate-500">Faculty</div>
                <div className="font-bold text-emerald-700 text-sm mt-0.5">95.8%</div>
              </div>
              <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
                <div className="text-[11px] text-rose-500">Absent</div>
                <div className="font-bold text-rose-700 text-sm mt-0.5">3.8%</div>
              </div>
            </div>
          </div>

          <div className="pt-3 text-center">
            <span className="text-xs font-mono text-slate-400">Verified via Biometric &amp; Attendance Registers</span>
          </div>
        </div>

      </div>


      {/* ─────────────────────────────────────────────────────────────
          ROW 4: FACULTY ON-DUTY ROSTER (6 COLS) + TOP CLASSES (6 COLS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Widget 1: Live Faculty On-Duty Roster (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Faculty On-Duty Status</span>
              <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                {activeTeachersPresent}/{totalTeachersCount} Active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activeFacultyRoster.map((fac, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-[#F9FCFA] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EBF5EF] text-[#122A24] font-display font-bold text-xs flex items-center justify-center border border-[#C5E2CF]">
                      {fac.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-[#122A24] flex items-center gap-1.5">
                        <span>{fac.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">({fac.code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{fac.dept} • {fac.room}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      fac.status === 'Present'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {fac.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {fac.checkIn}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Biometric ID Integrated</span>
            <button onClick={() => setActiveTab('teachers')} className="text-emerald-800 font-semibold border-none bg-transparent cursor-pointer hover:underline">
              All Teachers →
            </button>
          </div>
        </div>

        {/* Widget 2: Class Attendance Leaders (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Class Attendance Leaders</span>
              <span className="text-xs font-mono px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-600">Today</span>
            </div>

            <div className="divide-y divide-slate-100">
              {topClasses.map((cls, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-[#F9FCFA] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EBF5EF] text-[#122A24] font-display font-bold text-xs flex items-center justify-center border border-[#C5E2CF]">
                      {cls.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-[#122A24]">{cls.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Tr. {cls.teacher}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-700 text-xs">
                      {cls.rate}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {cls.students}/{cls.capacity} Present
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>5 Active Grade Divisions</span>
            <button onClick={() => setActiveTab('classes')} className="text-emerald-800 font-semibold border-none bg-transparent cursor-pointer hover:underline">
              All Classes →
            </button>
          </div>
        </div>

      </div>


      {/* ─────────────────────────────────────────────────────────────
          ROW 5: RECENT FEE LEDGER TABLE (8 COLS) + LIVE ACTIVITY FEED (4 COLS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Recent Invoices & Ledgers Table (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Institutional Fee Ledgers</span>
                <div className="font-display font-semibold text-lg text-[#122A24]">
                  Recent Student Invoices &amp; Receipts
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddInvoice(true)}
                  className="px-3 py-1.5 rounded-full bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer border-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Issue Receipt
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F9FCFA] transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-[#122A24]">
                        {inv.invoice_no}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {inv.student_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {inv.class_name}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {inv.due_date}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                        ₹{Number(inv.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setViewInvoice(inv)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[#122A24] font-mono text-[10px] font-semibold border-none cursor-pointer"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                        No invoices found. Click "Issue Receipt" to create fee records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Showing recent 5 fee ledger entries</span>
            <button onClick={() => setActiveTab('fees')} className="text-emerald-800 font-semibold border-none bg-transparent cursor-pointer hover:underline">
              View All Invoices →
            </button>
          </div>
        </div>

        {/* Right Widget: Recent Campus Activity Timeline Feed (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl p-6 bg-white border border-[#E2ECE5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Live Activity Timeline</span>
              <span className="text-[10px] font-mono text-slate-400">Real-time</span>
            </div>

            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-[#EBF5EF] border border-[#C5E2CF] flex items-center justify-center text-[#122A24] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {act.type === 'staff' && <GraduationCap className="w-4 h-4 text-[#122A24]" />}
                    {act.type === 'attendance' && <CalendarCheck className="w-4 h-4 text-emerald-600" />}
                    {act.type === 'fee' && <CreditCard className="w-4 h-4 text-emerald-700" />}
                    {act.type === 'leave' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-[#122A24] truncate">
                        {act.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {act.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Audit Trail Secure</span>
            <button onClick={() => setActiveTab('notices')} className="text-emerald-800 font-semibold border-none bg-transparent cursor-pointer hover:underline">
              Notice Board →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
