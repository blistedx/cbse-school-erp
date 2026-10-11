/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import { TeacherSidebar } from '@/components/teacher/teacher-sidebar';
import { TeacherHeader } from '@/components/teacher/teacher-header';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-[#DCE8E0] bg-[#EBF2ED]/60 py-4 px-6 text-center text-xs text-[#2D5A4E]/70 font-mono">
          CBSE Comprehensive School ERP • Faculty Workstation Core • Multi-Tenant Verified
        </footer>
      </div>
    </div>
  );
}
