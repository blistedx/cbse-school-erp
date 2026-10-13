/* ! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ClipboardList,
  BookOpen,
  Clock,
  User
} from 'lucide-react';
import { TeacherSidebar } from '@/components/teacher/teacher-sidebar';
import { TeacherHeader } from '@/components/teacher/teacher-header';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teacherData, setTeacherData] = useState<{
    teacherName: string;
    staffCode: string;
    designation: string;
    isClassTeacher: boolean;
    classTeacherSection: { class_name: string; section: string } | null;
    pendingLeavesCount: number;
    loading: boolean;
  }>({
    teacherName: 'Faculty Member',
    staffCode: 'EMP-FACULTY',
    designation: 'Teacher',
    isClassTeacher: false,
    classTeacherSection: null,
    pendingLeavesCount: 0,
    loading: true
  });

  useEffect(() => {
    async function loadTeacherProfile() {
      try {
        const res = await fetch('/api/teacher/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.assignments) {
            const { teacher, isClassTeacher, classTeacherSection } = data.assignments;
            setTeacherData({
              teacherName: teacher.full_name || 'Faculty Member',
              staffCode: teacher.staff_code || teacher.id,
              designation: teacher.designation || 'Teacher',
              isClassTeacher: !!isClassTeacher,
              classTeacherSection: classTeacherSection || null,
              pendingLeavesCount: 0,
              loading: false
            });
          }
        } else if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?error=session_expired';
        }
      } catch (err) {
        console.error('Failed to load teacher layout state:', err);
      }
    }
    loadTeacherProfile();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-[#122A24] flex flex-col font-sans antialiased selection:bg-[#10B981] selection:text-white">
      {/* Dynamic Role-Adapting Sidebar */}
      <TeacherSidebar
        teacherName={teacherData.teacherName}
        staffCode={teacherData.staffCode}
        designation={teacherData.designation}
        isClassTeacher={teacherData.isClassTeacher}
        classTeacherSection={teacherData.classTeacherSection}
        pendingLeavesCount={teacherData.pendingLeavesCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <TeacherHeader
          teacherName={teacherData.teacherName}
          isClassTeacher={teacherData.isClassTeacher}
          classTeacherSection={teacherData.classTeacherSection}
          onOpenMobile={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8 animate-fade-in">
          {children}
        </main>

        {/* Global Footer (Desktop only or low-profile) */}
        <footer className="hidden lg:block border-t border-[#DCE8E0] bg-[#EBF2ED]/60 py-4 px-6 text-center text-xs text-[#2D5A4E]/70 font-mono">
          CBSE Comprehensive School ERP • Faculty Workstation Core • Multi-Tenant Verified
        </footer>
      </div>

      {/* Mobile App Bottom Navigation Bar (iOS / Android App Shell) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE8E0] px-3 py-1.5 shadow-2xl flex items-center justify-around">
        <Link
          href="/teacher"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            pathname === '/teacher'
              ? 'text-emerald-700 font-bold'
              : 'text-[#2D5A4E]/70 hover:text-[#122A24]'
          }`}
        >
          <div className={`p-1 rounded-lg ${pathname === '/teacher' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <Home className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </Link>

        <Link
          href={teacherData.isClassTeacher ? "/teacher/my-class/attendance" : "/teacher/student-attendance"}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition relative ${
            pathname.includes('/my-class/attendance') || pathname.includes('/student-attendance')
              ? 'text-emerald-700 font-bold'
              : 'text-[#2D5A4E]/70 hover:text-[#122A24]'
          }`}
        >
          <div className={`p-1 rounded-lg ${pathname.includes('/my-class/attendance') || pathname.includes('/student-attendance') ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <ClipboardList className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Roll Call</span>
        </Link>

        <Link
          href="/teacher/classes"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            pathname.startsWith('/teacher/classes')
              ? 'text-emerald-700 font-bold'
              : 'text-[#2D5A4E]/70 hover:text-[#122A24]'
          }`}
        >
          <div className={`p-1 rounded-lg ${pathname.startsWith('/teacher/classes') ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Classes</span>
        </Link>

        <Link
          href="/teacher/attendance"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            pathname === '/teacher/attendance'
              ? 'text-emerald-700 font-bold'
              : 'text-[#2D5A4E]/70 hover:text-[#122A24]'
          }`}
        >
          <div className={`p-1 rounded-lg ${pathname === '/teacher/attendance' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">My Punch</span>
        </Link>

        <Link
          href="/teacher/profile"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            pathname.startsWith('/teacher/profile')
              ? 'text-emerald-700 font-bold'
              : 'text-[#2D5A4E]/70 hover:text-[#122A24]'
          }`}
        >
          <div className={`p-1 rounded-lg ${pathname.startsWith('/teacher/profile') ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <User className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

