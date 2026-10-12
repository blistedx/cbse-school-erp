/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Users,
  Award,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  FileBarChart2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatClassSectionDisplay } from '@/lib/utils';

export default function TeacherClassesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/teacher/classes');
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || 'Failed to load classes.');
        }
      } catch (err: any) {
        setError(err.message || 'Error connecting to server.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-[#E2EBE5] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-44 bg-[#E2EBE5] rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl text-xs font-mono">
        {error || 'Failed to load allocations.'}
      </div>
    );
  }

  const { is_class_teacher, class_teacher_section, allocated_subjects } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner (Admin Deep Green Theme) */}
      <div className="bg-gradient-to-br from-[#0F2620] via-[#14352B] to-[#1A4237] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-700/60 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-[#0F2620] shadow-xs">
              Academic Roster
            </span>
            <span className="text-emerald-300 text-xs font-mono font-bold">
              Session 2026-27
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Classes &amp; Teaching Workload
          </h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Classroom allocations, class teacher incharge desk, and allocated subject batches.
          </p>
        </div>

        {is_class_teacher && class_teacher_section && (
          <div className="relative z-10 flex items-center gap-2">
            <Link
              href="/teacher/my-class/attendance"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0F2620] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Roll Call</span>
            </Link>
            <Link
              href="/teacher/my-class/dossier"
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>Dossier</span>
            </Link>
          </div>
        )}
      </div>

      {/* Class Teacher Section Highlight */}
      {is_class_teacher && class_teacher_section && (
        <div className="p-6 bg-gradient-to-br from-[#0F2620] via-[#14352B] to-[#1A4237] text-white border border-emerald-700/60 rounded-3xl shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-radial from-amber-400/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-[#0F2620] font-black text-xs font-mono shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              ASSIGNED CLASS INCHARGE
            </span>
            <span className="text-xs font-mono font-bold text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              {class_teacher_section.student_count} Scholars Enrolled
            </span>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white font-mono">
                Class {formatClassSectionDisplay(class_teacher_section.class_name, class_teacher_section.section).code}
              </h2>
              <p className="text-xs text-emerald-200/90 font-mono mt-0.5">
                Room: {class_teacher_section.room_no || 'Room 101'} • Full Class Incharge Privileges Active
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/teacher/my-class/attendance"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0F2620] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Mark Attendance</span>
              </Link>
              <Link
                href="/teacher/my-class/dossier"
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Users className="w-3.5 h-3.5 text-emerald-300" />
                <span>Scholars Dossier</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Allocated Class-Subject-Sections Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#122A24] font-mono uppercase tracking-wider">
          Allocated Subject Batches ({allocated_subjects.length})
        </h3>

        {allocated_subjects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#DCE8E0] text-slate-400 font-mono text-xs">
            No subject allocations mapped to your faculty profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocated_subjects.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                      {item.class_name} - {item.section}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {item.student_count} Scholars
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#122A24]">{item.subject_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Code: {item.subject_code || 'CBSE-STD'} • Room: {item.room_no || '101'}
                  </p>
                </div>

                {/* Quick Action Links for this allocated class-subject */}
                <div className="pt-3 border-t border-[#E2EBE5] grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href={`/teacher/marks?class_name=${encodeURIComponent(item.class_name)}&section=${encodeURIComponent(item.section)}&subject_name=${encodeURIComponent(item.subject_name)}`}
                    className="p-2 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-800 border border-[#DCE8E0] font-semibold text-center transition flex items-center justify-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Marks</span>
                  </Link>

                  <Link
                    href={`/teacher/homework?class_name=${encodeURIComponent(item.class_name)}&section=${encodeURIComponent(item.section)}&subject_name=${encodeURIComponent(item.subject_name)}`}
                    className="p-2 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-800 border border-[#DCE8E0] font-semibold text-center transition flex items-center justify-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Homework</span>
                  </Link>

                  <Link
                    href={`/teacher/syllabus?class_name=${encodeURIComponent(item.class_name)}&section=${encodeURIComponent(item.section)}&subject_name=${encodeURIComponent(item.subject_name)}`}
                    className="p-2 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-800 border border-[#DCE8E0] font-semibold text-center transition flex items-center justify-center gap-1"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Syllabus</span>
                  </Link>

                  <Link
                    href={`/teacher/reports?class_name=${encodeURIComponent(item.class_name)}&section=${encodeURIComponent(item.section)}&subject_name=${encodeURIComponent(item.subject_name)}`}
                    className="p-2 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-800 border border-[#DCE8E0] font-semibold text-center transition flex items-center justify-center gap-1"
                  >
                    <FileBarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reports</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
