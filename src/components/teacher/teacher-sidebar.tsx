/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Award,
  BookOpen,
  FolderOpen,
  CalendarCheck,
  FileBarChart2,
  Calendar,
  Clock,
  Send,
  Bell,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  FileCheck2,
  DollarSign,
  Settings,
  X
} from 'lucide-react';

interface TeacherSidebarProps {
  teacherName?: string;
  avatar?: string;
  staffCode?: string;
  designation?: string;
  isClassTeacher?: boolean;
  classTeacherSection?: {
    class_name: string;
    section: string;
  } | null;
  pendingLeavesCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function TeacherSidebar({
  teacherName = 'Faculty Member',
  avatar = '',
  staffCode = 'EMP-FACULTY',
  designation = 'Teacher',
  isClassTeacher = false,
  classTeacherSection = null,
  pendingLeavesCount = 0,
  isOpenMobile = false,
  onCloseMobile
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem('current_user');
      localStorage.removeItem('current_school');
      localStorage.removeItem('erp_session_token');
      document.cookie = 'erp_session_token=; path=/; max-age=0;';
    } catch {}
    router.push('/login');
  };

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 lg:top-14 bottom-0 left-0 z-50 w-72 bg-[#122A24] text-white flex flex-col justify-between border-r border-[#1B3D34] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Branding */}
        <div>
          <div className="p-5 border-b border-[#1B3D34] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#10B981] flex items-center justify-center text-[#122A24] font-black text-xl shadow-md shadow-emerald-900/50">
                G
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                  GIRERP <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded-full border border-emerald-500/30">FACULTY</span>
                </h1>
                <p className="text-[11px] text-emerald-200/60 font-mono">Teachers Workstation</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Teacher Identity & Class Teacher Badge */}
          <div className="p-4 mx-3 my-3 bg-[#18382F] rounded-2xl border border-emerald-800/30 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-sm overflow-hidden shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={teacherName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  (teacherName || 'T')[0]
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{teacherName}</p>
                <p className="text-[10px] text-emerald-300/80 font-mono truncate">{staffCode} • {designation}</p>
              </div>
            </div>

            {/* Adaptive Class Teacher Badge */}
            {isClassTeacher && classTeacherSection ? (
              <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                  Class Teacher
                </span>
                <span className="text-[11px] font-bold text-emerald-200 font-mono">
                  {classTeacherSection.class_name}-{classTeacherSection.section}
                </span>
              </div>
            ) : (
              <div className="pt-2 border-t border-emerald-800/40 text-[10px] text-emerald-300/60 font-mono flex items-center gap-1">
                <span>Subject Faculty</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 custom-scrollbar">
          {/* 1. TOP-LEVEL PRIMARY: OVERVIEW DASHBOARD */}
          <div>
            <Link
              href="/teacher"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher', true)
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Overview Dashboard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>

          {/* 2. ACADEMIC SECTION (WHITE DOTS) */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-emerald-300/60 flex items-center justify-between">
              <span>Academic</span>
            </div>

            <Link
              href="/teacher/classes"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname === '/teacher/classes'
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-xs ring-1 ring-white/50" />
                <span>Update daily classwork</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/homework"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/homework')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-xs ring-1 ring-white/50" />
                <span>Assign homework</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/syllabus"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/syllabus')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-xs ring-1 ring-white/50" />
                <span>Organize lesson plan</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/syllabus"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/syllabus')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-xs ring-1 ring-white/50" />
                <span>Syllabus scheduling</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/syllabus"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/syllabus')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-xs ring-1 ring-white/50" />
                <span>Update completed lesson</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>

          {/* 3. CLASS TEACHER SECTION (Conditionally Shown ONLY if Teacher is Class Teacher) */}
          {isClassTeacher && classTeacherSection && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-amber-300/90 flex items-center justify-between">
                <span>My Class ({classTeacherSection.class_name}-{classTeacherSection.section})</span>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">INCHARGE</span>
              </div>

              <Link
                href="/teacher/my-class/attendance"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/attendance')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-4 h-4 text-amber-300" />
                  <span>Daily Attendance</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/teacher/my-class/dossier"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/dossier')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-emerald-300" />
                  <span>Scholars &amp; Dossier</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/teacher/my-class/leaves"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/leaves')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-emerald-300" />
                  <span>Student Leaves</span>
                </div>
                {pendingLeavesCount > 0 ? (
                  <span className="text-[10px] font-bold bg-amber-400 text-[#122A24] px-1.5 py-0.5 rounded-full font-mono">
                    {pendingLeavesCount}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
              </Link>

              <Link
                href="/teacher/my-class/fees"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/fees')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  <span>Fee Status (Read-Only)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/teacher/my-class/report-card"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/report-card')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-emerald-300" />
                  <span>Consolidated Marks</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/teacher/my-class/results"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/results')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileBarChart2 className="w-4 h-4 text-emerald-300" />
                  <span>Result Analysis</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/teacher/my-class/remarks"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/remarks')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-emerald-300" />
                  <span>Student Remarks</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/teacher/my-class/certificates"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/certificates')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck2 className="w-4 h-4 text-emerald-300" />
                  <span>Certificate Requests</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/teacher/my-class/notices"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive('/teacher/my-class/notices')
                    ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                    : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-emerald-300" />
                  <span>Class Notices</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          )}

          {/* 4. FACULTY WORKSTATION & TEACHING TOOLS */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-emerald-300/50">
              Teaching Tools &amp; Roster
            </div>

            <Link
              href="/teacher/classes"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/classes')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>My Classes</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/marks"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/marks')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Marks Entry</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/homework"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/homework')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Homework</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/materials"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/materials')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Study Material</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/syllabus"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/syllabus')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <span>Syllabus Tracker</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/reports"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/reports')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileBarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Subject Reports</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/student-attendance"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/student-attendance')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                <span>Student Attendance %</span>
              </div>
              <span className="text-[9px] bg-emerald-950/60 text-emerald-300/80 px-1.5 py-0.5 rounded font-mono">READ</span>
            </Link>

            <Link
              href="/teacher/timetable"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/timetable')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Weekly Timetable</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/attendance"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/attendance')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>My Biometrics</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/requests"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/requests')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>My Requests &amp; Leaves</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>

          {/* 3. COMMON SECTION */}
          <div className="space-y-1 pt-2 border-t border-[#1B3D34]">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-emerald-300/50">
              General
            </div>

            <Link
              href="/teacher/notices"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/notices')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>School Notices</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/teacher/profile"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/teacher/profile')
                  ? 'bg-[#10B981] text-[#122A24] font-bold shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/90 hover:bg-[#1A3B32] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Settings &amp; Profile Picture</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-[#1B3D34] bg-[#0E221D]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out Faculty</span>
            </div>
            <span className="text-[10px] text-rose-300/60 font-mono">SECURE</span>
          </button>
        </div>
      </aside>
    </>
  );
}
