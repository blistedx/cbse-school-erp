/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ERPAdaptiveMobile from '@/components/mobile/erp-adaptive-mobile';
import { School, Student, Teacher, ClassRoom, Notice, FeeInvoice, AttendanceRecord } from '@/lib/types';

function MobileAppContent() {
  const searchParams = useSearchParams();
  const schoolParam = searchParams.get('school');

  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);

  useEffect(() => {
    async function loadMobileData() {
      try {
        setLoading(true);
        const schRes = await fetch('/api/schools');
        const schData = await schRes.json();
        
        let activeSchool: School | null = null;
        if (schData.success && Array.isArray(schData.schools) && schData.schools.length > 0) {
          if (schoolParam) {
            activeSchool = schData.schools.find(
              (s: School) =>
                s.school_code?.toLowerCase() === schoolParam.toLowerCase() ||
                s.id === schoolParam
            ) || schData.schools[0];
          } else {
            const stored = localStorage.getItem('current_school');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                activeSchool = schData.schools.find((s: School) => s.id === parsed.id || s.school_code === parsed.school_code) || schData.schools[0];
              } catch (e) {
                activeSchool = schData.schools[0];
              }
            } else {
              activeSchool = schData.schools[0];
            }
          }
        }

        setSelectedSchool(activeSchool);

        if (activeSchool) {
          const [stuRes, teaRes, clsRes, notRes, attRes, invRes] = await Promise.all([
            fetch(`/api/students?school_id=${activeSchool.id}`),
            fetch(`/api/teachers?school_id=${activeSchool.id}`),
            fetch(`/api/classes?school_id=${activeSchool.id}`),
            fetch(`/api/notices?school_id=${activeSchool.id}`),
            fetch(`/api/attendance?school_id=${activeSchool.id}`),
            fetch(`/api/fees?school_id=${activeSchool.id}`)
          ]);

          const [stuData, teaData, clsData, notData, attData, invData] = await Promise.all([
            stuRes.json(),
            teaRes.json(),
            clsRes.json(),
            notRes.json(),
            attRes.json(),
            invRes.json()
          ]);

          if (stuData.success) setStudents(stuData.students || []);
          if (teaData.success) setTeachers(teaData.teachers || []);
          if (clsData.success) setClasses(clsData.classes || []);
          if (notData.success) setNotices(notData.notices || []);
          if (attData.success) setAttendance(attData.attendance || []);
          if (invData.success) setInvoices(invData.invoices || []);
        }
      } catch (e) {
        console.error('Failed to load mobile ERP workspace data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadMobileData();
  }, [schoolParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#122A24] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3 font-mono text-xs animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Loading CBSE Mobile ERP...</span>
        </div>
      </div>
    );
  }

  return (
    <ERPAdaptiveMobile
      selectedSchool={selectedSchool}
      students={students}
      teachers={teachers}
      classes={classes}
      notices={notices}
      attendance={attendance}
      invoices={invoices}
    />
  );
}

export default function MobilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#122A24] flex items-center justify-center text-white font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mr-2" />
          Loading...
        </div>
      }
    >
      <MobileAppContent />
    </Suspense>
  );
}
