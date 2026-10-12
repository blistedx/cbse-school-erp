/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Award,
  BookOpen,
  Calendar
} from 'lucide-react';
import { formatClassSectionDisplay } from '@/lib/utils';

interface TeacherHeaderProps {
  teacherName?: string;
  isClassTeacher?: boolean;
  classTeacherSection?: {
    class_name: string;
    section: string;
  } | null;
  onOpenMobile?: () => void;
}

export function TeacherHeader({
  teacherName = 'Faculty Member',
  isClassTeacher = false,
  classTeacherSection = null,
  onOpenMobile
}: TeacherHeaderProps) {
  const pathname = usePathname();

  // Resolve dynamic breadcrumb title
  const getPageTitle = () => {
    if (pathname === '/teacher') return 'Faculty Overview Dashboard';
    if (pathname.startsWith('/teacher/my-class/attendance')) return 'Daily Classroom Attendance Roll';
    if (pathname.startsWith('/teacher/my-class/dossier')) return 'Scholars Directory & 360° Dossier';
    if (pathname.startsWith('/teacher/my-class/leaves')) return 'Scholar Leave Petitions';
    if (pathname.startsWith('/teacher/my-class/fees')) return 'Class Fee Status (Read-Only)';
    if (pathname.startsWith('/teacher/my-class/report-card')) return 'Consolidated Broadsheet & Remarks';
    if (pathname.startsWith('/teacher/my-class/results')) return 'Class Academic Result Analytics';
    if (pathname.startsWith('/teacher/my-class/remarks')) return 'Scholar Behaviour & Discipline Remarks';
    if (pathname.startsWith('/teacher/my-class/certificates')) return 'Statutory Certificate Petitions (TC/Bonafide)';
    if (pathname.startsWith('/teacher/my-class/notices')) return 'Class Notices & Broadcasts';
    if (pathname.startsWith('/teacher/classes')) return 'Allocated Classes & Workload';
    if (pathname.startsWith('/teacher/marks')) return 'Examination Marks Entry';
    if (pathname.startsWith('/teacher/homework')) return 'Homework & Coursework Assignments';
    if (pathname.startsWith('/teacher/materials')) return 'Digital Study Material Repository';
    if (pathname.startsWith('/teacher/syllabus')) return 'Month-wise Syllabus Tracker';
    if (pathname.startsWith('/teacher/reports')) return 'Subject Performance Analytics';
    if (pathname.startsWith('/teacher/student-attendance')) return 'Scholar Attendance Register (Read-Only)';
    if (pathname.startsWith('/teacher/timetable')) return 'Faculty Weekly Timetable';
    if (pathname.startsWith('/teacher/attendance')) return 'Faculty Biometric Attendance Ledger';
    if (pathname.startsWith('/teacher/requests')) return 'Missed Biometrics & Leave Petitions';
    if (pathname.startsWith('/teacher/notices')) return 'Official School Circulars';
    if (pathname.startsWith('/teacher/profile')) return 'Faculty Profile & Passcode Credentials';
    return 'Faculty Workstation';
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F4F8F5]/90 backdrop-blur-md border-b border-[#DCE8E0] px-4 sm:px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Toggle + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 text-[#2D5A4E] hover:text-[#122A24] rounded-xl hover:bg-[#E2EBE5] transition cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-[#2D5A4E] font-medium font-mono">
              <Link href="/teacher" className="hover:text-[#122A24] transition">
                TEACHER
              </Link>
              <span>/</span>
              <span className="text-[#122A24] font-semibold truncate">
                {pathname.replace('/teacher/', '').replace('/teacher', 'OVERVIEW')}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#122A24] tracking-tight truncate">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Right: Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Class Teacher Badge */}
          {isClassTeacher && classTeacherSection && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Class Incharge:</span>
              <span className="font-mono text-emerald-800 font-black">{formatClassSectionDisplay(classTeacherSection.class_name, classTeacherSection.section).code}</span>
            </div>
          )}

          {/* Academic Session */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#E2EBE5] rounded-xl text-xs font-mono font-bold text-[#2D5A4E]">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>2026-27</span>
          </div>

          {/* Biometric Verification Chip */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline font-mono text-[11px]">BIO-SYNC</span>
          </div>

          {/* Notifications Quick Link */}
          <Link
            href="/teacher/notices"
            className="relative p-2 rounded-xl text-[#2D5A4E] hover:text-[#122A24] hover:bg-[#E2EBE5] transition"
            title="School Circulars"
          >
            <Bell className="w-4 h-4" />
          </Link>

          {/* Profile Avatar */}
          <Link
            href="/teacher/profile"
            className="flex items-center gap-2 pl-2 border-l border-[#DCE8E0] hover:opacity-85 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-[#10B981] flex items-center justify-center text-[#122A24] font-bold text-xs shadow-xs">
              {(teacherName || 'T')[0]}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
