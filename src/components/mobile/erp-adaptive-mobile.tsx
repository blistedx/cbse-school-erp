'use client';

import React, { useState } from 'react';
import MobileShell, { UserRole } from '@/components/mobile/mobile-shell';
import RoleParentView from '@/components/mobile/role-parent-view';
import RoleTeacherView from '@/components/mobile/role-teacher-view';
import RolePrincipalView from '@/components/mobile/role-principal-view';
import RoleDriverView from '@/components/mobile/role-driver-view';
import { School, Student, Teacher, ClassRoom, Notice, FeeInvoice, AttendanceRecord } from '@/lib/types';

export interface ERPAdaptiveMobileProps {
  selectedSchool?: School | null;
  students?: Student[];
  teachers?: Teacher[];
  classes?: ClassRoom[];
  notices?: Notice[];
  attendance?: AttendanceRecord[];
  invoices?: FeeInvoice[];
}

export default function ERPAdaptiveMobile({
  selectedSchool,
  students = [],
  teachers = [],
  classes = [],
  notices = [],
  attendance = [],
  invoices = []
}: ERPAdaptiveMobileProps) {
  const [activeRole, setActiveRole] = useState<UserRole>('PARENT');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isFrameMode, setIsFrameMode] = useState<boolean>(false);

  const schoolName = selectedSchool?.school_name || 'DPS International — CBSE';
  const firstStudent = students[0];
  const studentDisplayName = firstStudent ? `${firstStudent.name} (${firstStudent.class_name || 'VI-A'})` : 'Aarav Sharma (VI-A)';

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center">
      {/* Render Mobile Shell with real school context */}
      <MobileShell
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFrameMode={isFrameMode}
        setIsFrameMode={setIsFrameMode}
        schoolName={schoolName}
        studentName={studentDisplayName}
      >
        {activeRole === 'PARENT' && (
          <RoleParentView activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {activeRole === 'TEACHER' && (
          <RoleTeacherView activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {activeRole === 'PRINCIPAL' && (
          <RolePrincipalView activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {activeRole === 'DRIVER' && (
          <RoleDriverView activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </MobileShell>
    </div>
  );
}
