/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  ClipboardList,
  Users,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  AlertCircle,
  Fingerprint,
  LogIn,
  LogOut,
  Send
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [punching, setPunching] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/teacher/dashboard');
      if (!res.ok) {
        throw new Error(`Failed to load dashboard (${res.status})`);
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to load dashboard metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with ERP server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handlePunch = async (action: 'PUNCH_IN' | 'PUNCH_OUT') => {
    try {
      setPunching(true);
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) {
        await loadDashboard();
      } else {
        alert(json.error || 'Failed to punch attendance');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setPunching(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[#E2EBE5] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#E2EBE5] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-[#E2EBE5] rounded-3xl" />
          <div className="h-64 bg-[#E2EBE5] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Faculty Workstation Error</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to load teacher dashboard.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-rose-700 transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    teacher,
    is_class_teacher,
    class_teacher_section,
    allocated_subjects,
    biometric_today,
    today_timetable,
    pending_tasks,
    class_teacher_stats,
    latest_notices
  } = data;

  return (
    <div className="space-y-6">
      {/* 1. WELCOME BANNER & CLASS TEACHER BADGE */}
      <div
        className="p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-emerald-800/40"
        style={{
          backgroundColor: '#122A24',
          backgroundImage: 'radial-gradient(ellipse at 20% -10%, #1C443A 0%, #122A24 70%)',
          color: '#FFFFFF'
        }}
      >
        {/* Signature watermark typography */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -top-4 sm:-top-8 -left-2 sm:-left-4 font-watermark font-normal text-white/[0.07] sm:text-white/[0.09] text-[75px] sm:text-[120px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
          >
            Faculty
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-6 -right-2 sm:-right-4 font-watermark font-normal text-white/[0.05] sm:text-white/[0.07] text-[65px] sm:text-[100px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
          >
            Workstation
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-300 tracking-wider uppercase">Faculty Workstation</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                CBSE 2026-27
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome, {teacher.full_name}
            </h1>
            <p className="text-xs text-emerald-100/70">
              {teacher.designation || 'Faculty'} • {teacher.department || 'Academics'} • Staff ID: {teacher.staff_code}
            </p>
          </div>

          {/* Role Status Capsule */}
          <div className="flex items-center gap-3">
            {is_class_teacher && class_teacher_section ? (
              <div className="bg-amber-400/20 border border-amber-400/40 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#122A24] flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-amber-200 uppercase tracking-wider font-bold">Assigned Class Teacher</p>
                  <p className="text-sm font-black text-white font-mono">
                    {class_teacher_section.class_name} - {class_teacher_section.section}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-800/30 border border-emerald-700/40 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-200 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Subject Teacher Allocation</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CLASS TEACHER HIGHLIGHT BANNER (If Class Teacher) */}
      {is_class_teacher && class_teacher_stats && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>My Class Today: {class_teacher_stats.class_name} - {class_teacher_stats.section}</span>
            </div>
            <Link
              href="/teacher/my-class/attendance"
              className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 font-mono transition"
            >
              Open Class Register <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-amber-200/80">
              <span className="text-[10px] font-mono text-amber-800/80 uppercase font-bold block">Today's Attendance</span>
              <p className="text-xl font-black text-[#122A24] mt-0.5">
                {class_teacher_stats.is_marked_today ? `${class_teacher_stats.attendance_percent}%` : 'Not Marked'}
              </p>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">
                {class_teacher_stats.present_count} / {class_teacher_stats.total_students} Present
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-amber-200/80">
              <span className="text-[10px] font-mono text-amber-800/80 uppercase font-bold block">Absent Today</span>
              <p className="text-xl font-black text-rose-600 mt-0.5">
                {class_teacher_stats.absent_count}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Scholars</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-amber-200/80">
              <span className="text-[10px] font-mono text-amber-800/80 uppercase font-bold block">Pending Leaves</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">
                {class_teacher_stats.pending_leaves_count}
              </p>
              <Link href="/teacher/my-class/leaves" className="text-[10px] text-amber-800 hover:underline font-mono">
                Review Petitions
              </Link>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-amber-200/80 flex flex-col justify-center">
              {!class_teacher_stats.is_marked_today ? (
                <Link
                  href="/teacher/my-class/attendance"
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl text-center text-xs font-bold hover:bg-emerald-700 shadow-sm transition block"
                >
                  Mark Attendance Now
                </Link>
              ) : (
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Marked
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Absent Students List */}
          {class_teacher_stats.absent_students && class_teacher_stats.absent_students.length > 0 && (
            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60">
              <p className="text-[11px] font-bold text-amber-900 mb-2 font-mono">Absent Scholars Today:</p>
              <div className="flex flex-wrap gap-2">
                {class_teacher_stats.absent_students.map((st: any) => (
                  <span key={st.student_id} className="text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {st.student_name} ({st.admission_no})
                    {st.parent_phone && <span className="text-[10px] text-slate-500 font-mono">📞 {st.parent_phone}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. FOUR KPI CARDS (Biometric Today + Pending Tasks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Biometric Status Today */}
        <div className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D5A4E] uppercase font-mono tracking-wider">My Biometric Today</span>
            <div className={`p-2 rounded-xl ${biometric_today.status === 'PRESENT' || biometric_today.status === 'REGULARIZED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-[#122A24] tracking-tight">
                {biometric_today.status === 'PRESENT' ? 'PUNCHED IN' : biometric_today.status === 'REGULARIZED' ? 'REGULARIZED' : 'NOT PUNCHED'}
              </p>
              {biometric_today.is_late && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md font-mono">
                  LATE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              IN: {biometric_today.in_time || '--:--'} • OUT: {biometric_today.out_time || '--:--'}
            </p>
          </div>

          {/* Quick 1-click Punch In / Out Button */}
          <div className="pt-1">
            {biometric_today.status !== 'PRESENT' ? (
              <button
                onClick={() => handlePunch('PUNCH_IN')}
                disabled={punching}
                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{punching ? 'Recording...' : 'Punch In Now'}</span>
              </button>
            ) : !biometric_today.out_time ? (
              <button
                onClick={() => handlePunch('PUNCH_OUT')}
                disabled={punching}
                className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-[#122A24] font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{punching ? 'Recording...' : 'Punch Out'}</span>
              </button>
            ) : (
              <div className="text-[11px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Shift Completed
              </div>
            )}
          </div>

          <Link
            href="/teacher/attendance"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-mono transition pt-1 border-t border-[#DCE8E0]"
          >
            Full Attendance Desk <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Overdue Syllabus Topics */}
        <div className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D5A4E] uppercase font-mono tracking-wider">Syllabus Overdue</span>
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600 tracking-tight">
              {pending_tasks.overdue_syllabus_count}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Topics pending past target date</p>
          </div>
          <Link
            href="/teacher/syllabus"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-mono transition"
          >
            Update Syllabus <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active Homework */}
        <div className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D5A4E] uppercase font-mono tracking-wider">Active Homework</span>
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#122A24] tracking-tight">
              {pending_tasks.active_homework_count}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Assignments ongoing</p>
          </div>
          <Link
            href="/teacher/homework"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-mono transition"
          >
            Manage Homework <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pending Petitions */}
        <div className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D5A4E] uppercase font-mono tracking-wider">My Petitions</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600 tracking-tight">
              {pending_tasks.pending_biometric_requests_count + pending_tasks.pending_leave_requests_count}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {pending_tasks.pending_biometric_requests_count} Missed Bio • {pending_tasks.pending_leave_requests_count} Leave
            </p>
          </div>
          <Link
            href="/teacher/requests"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-mono transition"
          >
            View Petitions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. TWO-COLUMN SPLIT: TODAY'S TIMETABLE & LATEST NOTICES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Timetable / Periods */}
        <div className="p-6 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-[#122A24]">Today's Teaching Schedule</h3>
            </div>
            <Link
              href="/teacher/timetable"
              className="text-xs font-bold text-emerald-700 hover:underline font-mono"
            >
              Full Week
            </Link>
          </div>

          {today_timetable && today_timetable.length > 0 ? (
            <div className="space-y-2.5">
              {today_timetable.map((period: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5] flex items-center justify-between hover:border-emerald-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center font-mono">
                      P{period.period_no}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#122A24]">{period.subject}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {period.class_name} - {period.section}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#2D5A4E] bg-white px-2.5 py-1 rounded-xl border border-[#DCE8E0]">
                    {period.start_time} - {period.end_time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto opacity-40 text-[#2D5A4E]" />
              <p className="text-xs font-mono">No periods scheduled for today ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})</p>
            </div>
          )}
        </div>

        {/* Latest School Circulars */}
        <div className="p-6 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-[#122A24]">School Notices &amp; Circulars</h3>
            </div>
            <Link
              href="/teacher/notices"
              className="text-xs font-bold text-emerald-700 hover:underline font-mono"
            >
              Archive
            </Link>
          </div>

          {latest_notices && latest_notices.length > 0 ? (
            <div className="space-y-3">
              {latest_notices.map((n: any) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-800 uppercase font-mono">{n.category || 'General'}</span>
                    <span className="text-slate-400 font-mono">{n.created_at?.split('T')[0]}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#122A24]">{n.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-40 text-[#2D5A4E]" />
              <p className="text-xs font-mono">No new circulars published</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
