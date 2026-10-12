/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Send,
  X,
  Check,
  Flame,
  ChevronRight,
  Phone,
  FileText,
  Search,
  MessageSquare,
  Save
} from 'lucide-react';
import { getTodayDateStr, formatClassSectionDisplay } from '@/lib/utils';

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [punching, setPunching] = useState(false);

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── AUTOMATIC BOTTOM SHEET ATTENDANCE POPUP STATE ──
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [sheetDismissed, setSheetDismissed] = useState(false);
  const [sheetStudents, setSheetStudents] = useState<Array<{
    student_id: string;
    admission_no: string;
    full_name: string;
    roll_no: string;
    status: 'PRESENT' | 'ABSENT' | 'LEAVE';
  }>>([]);
  const [loadingSheetStudents, setLoadingSheetStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [sheetFeedback, setSheetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sheetMode, setSheetMode] = useState<'quick' | 'roster'>('quick');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/teacher/dashboard');
      if (!res.ok) {
        throw new Error(`Failed to load dashboard (${res.status})`);
      }
      const json = await res.json();
      if (json.success) {
        setData(json);

        // TRIGGER AUTOMATIC BOTTOM SHEET POPUP IF CLASS ATTENDANCE IS NOT MARKED
        if (
          json.is_class_teacher &&
          json.class_teacher_stats &&
          !json.class_teacher_stats.is_marked_today &&
          !sheetDismissed
        ) {
          // Slight 350ms delay for smooth mobile entrance
          setTimeout(() => {
            setShowAttendanceSheet(true);
          }, 350);
        }
      } else {
        setError(json.error || 'Failed to load dashboard metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with ERP server.');
    } finally {
      setLoading(false);
    }
  }, [sheetDismissed]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Load students for bottom sheet when it opens
  useEffect(() => {
    if (showAttendanceSheet && data?.is_class_teacher && sheetStudents.length === 0) {
      fetchSheetStudents();
    }
  }, [showAttendanceSheet, data]);

  const fetchSheetStudents = async () => {
    try {
      setLoadingSheetStudents(true);
      const res = await fetch(`/api/teacher/class/attendance?date=${getTodayDateStr()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.students)) {
          setSheetStudents(
            json.students.map((s: any) => ({
              student_id: s.student_id,
              admission_no: s.admission_no,
              full_name: s.full_name,
              roll_no: s.roll_no || '',
              status: s.status || 'PRESENT'
            }))
          );
        }
      }
    } catch (e) {
      console.warn('Failed to fetch bottom sheet students:', e);
    } finally {
      setLoadingSheetStudents(false);
    }
  };

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

  // Submit attendance from bottom sheet
  const handleSaveAttendance = async (markAllPresent: boolean = false) => {
    if (!data?.class_teacher_section) return;
    try {
      setSavingAttendance(true);
      setSheetFeedback(null);

      const targetRecords = markAllPresent
        ? sheetStudents.map(s => ({ ...s, status: 'PRESENT' }))
        : sheetStudents;

      const payload = {
        date: getTodayDateStr(),
        class_name: data.class_teacher_section.class_name,
        section: data.class_teacher_section.section,
        records: targetRecords.map(r => ({
          student_id: r.student_id,
          admission_no: r.admission_no,
          full_name: r.full_name,
          roll_no: r.roll_no,
          status: r.status
        }))
      };

      const res = await fetch('/api/teacher/class/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        const presentCount = targetRecords.filter(s => s.status === 'PRESENT').length;
        setSheetFeedback({
          type: 'success',
          text: `🎉 Attendance successfully recorded! (${presentCount}/${targetRecords.length} Present)`
        });
        setTimeout(() => {
          setShowAttendanceSheet(false);
          loadDashboard();
        }, 1100);
      } else {
        setSheetFeedback({
          type: 'error',
          text: json.error || 'Failed to submit attendance.'
        });
      }
    } catch (err: any) {
      setSheetFeedback({
        type: 'error',
        text: 'Network error saving attendance.'
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  const toggleStudentStatus = (studentId: string) => {
    setSheetStudents(prev =>
      prev.map(s => {
        if (s.student_id !== studentId) return s;
        const nextStatus = s.status === 'PRESENT' ? 'ABSENT' : s.status === 'ABSENT' ? 'LEAVE' : 'PRESENT';
        return { ...s, status: nextStatus };
      })
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-32 sm:h-36 bg-[#E2EBE5] rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 sm:h-32 bg-[#E2EBE5] rounded-2xl" />
          ))}
        </div>
        <div className="h-48 sm:h-64 bg-[#E2EBE5] rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 sm:p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Faculty Workstation Error</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to load teacher dashboard.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700 transition cursor-pointer"
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
    biometric_today,
    today_timetable,
    pending_tasks,
    class_teacher_stats,
    latest_notices
  } = data;

  const presentCountSheet = sheetStudents.filter(s => s.status === 'PRESENT').length;
  const absentCountSheet = sheetStudents.filter(s => s.status === 'ABSENT').length;

  const classDisplay = formatClassSectionDisplay(
    class_teacher_section?.class_name,
    class_teacher_section?.section
  );
  const statsClassDisplay = formatClassSectionDisplay(
    class_teacher_stats?.class_name,
    class_teacher_stats?.section
  );
  const displayClassCode = classDisplay.code || statsClassDisplay.code || 'X-A';

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in relative">
      {/* ── PERSISTENT ATTENDANCE ALERT PILL (If Attendance is pending today) ── */}
      {is_class_teacher && class_teacher_stats && !class_teacher_stats.is_marked_today && (
        <div
          onClick={() => setShowAttendanceSheet(true)}
          className="bg-amber-500/15 border-2 border-amber-500/50 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/20 transition shadow-xs group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-950 block truncate">
                🚨 Class {displayClassCode} Roll Call Pending!
              </span>
              <span className="text-[11px] text-amber-900/80 font-mono hidden sm:inline">
                Tap here to open fast mobile attendance pop-up
              </span>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1 bg-amber-600 group-hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 shadow-2xs"
          >
            <span>Mark Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 1. HERO TEACHER APP CARD (EXECUTIVE WORKSTATION) ── */}
      <div className="p-4.5 sm:p-6 rounded-3xl text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#0F2620] via-[#14352B] to-[#1A4237] border border-emerald-700/50 space-y-4 sm:space-y-5">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-radial from-emerald-400/20 via-teal-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />
        <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-radial from-amber-400/10 to-transparent pointer-events-none rounded-full blur-xl" />

        {/* Top Header Row with Live Clock & Session Badges */}
        <div className="flex items-center justify-between relative z-10 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-emerald-200">
              {currentTime || '08:00:00 AM'}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase">
              IST
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/10 text-[11px] font-mono font-medium">
              <CalendarCheck className="w-3 h-3 text-emerald-300" />
              Session 2026-27
            </span>
            {is_class_teacher ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-[11px] font-bold font-mono">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                Class Incharge
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-[11px] font-bold font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Subject Faculty
              </span>
            )}
          </div>
        </div>

        {/* Teacher Identity & BADA BADA Class Incharge Showcase */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Avatar & Identity */}
          <div className="flex items-center gap-3 sm:gap-4.5 min-w-0 flex-1">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-200 text-[#0F2620] font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shrink-0 ring-2 ring-emerald-300/40 ring-offset-2 ring-offset-[#14352B]">
              {(teacher.full_name || 'T')[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-black text-white tracking-tight truncate leading-tight">
                {teacher.full_name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 font-medium truncate mt-0.5">
                {teacher.designation || 'Faculty Member'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-emerald-200 text-[10px] sm:text-[11px] font-mono font-bold tracking-wide border border-white/10">
                  ID: {teacher.staff_code}
                </span>
                {teacher.department && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-200 text-[10px] font-mono border border-emerald-500/20 truncate max-w-[140px]">
                    {teacher.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: X-A BADA BADA SHOWCASE */}
          {is_class_teacher && (
            <div className="relative shrink-0 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/40 via-amber-300/30 to-emerald-400/30 rounded-2xl blur-xs group-hover:opacity-100 transition duration-300" />
              <div className="relative bg-gradient-to-b from-[#183d32] to-[#0e251f] border-2 border-amber-400/60 rounded-2xl px-3 py-2 sm:px-5 sm:py-2.5 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-md min-w-[92px] sm:min-w-[125px]">
                <div className="flex items-center gap-1 text-[8.5px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-amber-300/90">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 animate-pulse shrink-0" />
                  <span>Class Incharge</span>
                </div>
                <div className="text-2xl sm:text-4xl font-black font-mono tracking-wider text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.35)] leading-none my-1">
                  {displayClassCode}
                </div>
                <div className="text-[8.5px] sm:text-[10px] font-mono text-emerald-200/90 font-medium">
                  {class_teacher_section?.student_count
                    ? `${class_teacher_section.student_count} Scholars`
                    : (class_teacher_section?.room_no ? `Room ${class_teacher_section.room_no}` : 'Assigned')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Biometrics Quick Action Bar inside Hero Card */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 bg-black/20 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-300/70 block uppercase leading-none font-bold">Biometric Attendance</span>
              <span className="text-xs font-bold text-emerald-100 leading-tight">
                {biometric_today.status === 'PRESENT'
                  ? `Clocked In at ${biometric_today.in_time || '08:15 AM'}`
                  : biometric_today.status === 'REGULARIZED'
                  ? 'Regularized by Principal'
                  : 'Not Clocked In Yet'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {biometric_today.status !== 'PRESENT' ? (
              <button
                type="button"
                onClick={() => handlePunch('PUNCH_IN')}
                disabled={punching}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-[#0F2620] font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{punching ? 'Recording...' : 'Clock In Now'}</span>
              </button>
            ) : !biometric_today.out_time ? (
              <button
                type="button"
                onClick={() => handlePunch('PUNCH_OUT')}
                disabled={punching}
                className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-[#0F2620] font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{punching ? 'Recording...' : 'Clock Out Departure'}</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Shift Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. QUICK TOUCH ACTION GRID (APP-LIKE TILES) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Tile 1: Mark Attendance (triggers bottom sheet directly or navigates) */}
        <div
          onClick={() => {
            if (is_class_teacher && class_teacher_stats && !class_teacher_stats.is_marked_today) {
              setShowAttendanceSheet(true);
            }
          }}
          className="relative"
        >
          <Link
            href={is_class_teacher ? "/teacher/my-class/attendance" : "/teacher/student-attendance"}
            onClick={(e) => {
              if (is_class_teacher && class_teacher_stats && !class_teacher_stats.is_marked_today) {
                e.preventDefault();
                setShowAttendanceSheet(true);
              }
            }}
            className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-emerald-500 shadow-xs flex flex-col justify-between h-24 sm:h-28 transition hover-lift group block"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <CalendarCheck className="w-4 h-4" />
              </div>
              {is_class_teacher && class_teacher_stats && !class_teacher_stats.is_marked_today ? (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-mono text-[9px] font-bold rounded-md animate-pulse">
                  PENDING
                </span>
              ) : (
                <span className="text-slate-400 group-hover:text-emerald-700">→</span>
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-[#122A24] block truncate">Student Roll Call</span>
              <span className="text-[10px] text-slate-500 font-mono truncate block">
                {is_class_teacher ? `Class ${displayClassCode}` : 'Classes'}
              </span>
            </div>
          </Link>
        </div>

        {/* Tile 2: Homework Desk */}
        <Link
          href="/teacher/homework"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-blue-500 shadow-xs flex flex-col justify-between h-24 sm:h-28 transition hover-lift group block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            {pending_tasks.active_homework_count > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-mono text-[9px] font-bold rounded-md">
                {pending_tasks.active_homework_count} ACTIVE
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-[#122A24] block truncate">Homework Desk</span>
            <span className="text-[10px] text-slate-500 font-mono truncate block">Post &amp; Track Diary</span>
          </div>
        </Link>

        {/* Tile 3: Exam Marks Entry */}
        <Link
          href="/teacher/marks"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-purple-500 shadow-xs flex flex-col justify-between h-24 sm:h-28 transition hover-lift group block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-slate-400 group-hover:text-purple-700">→</span>
          </div>
          <div>
            <span className="text-xs font-bold text-[#122A24] block truncate">Exam Marks Entry</span>
            <span className="text-[10px] text-slate-500 font-mono truncate block">CBSE Assessments</span>
          </div>
        </Link>

        {/* Tile 4: Timetable */}
        <Link
          href="/teacher/timetable"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-amber-500 shadow-xs flex flex-col justify-between h-24 sm:h-28 transition hover-lift group block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[9.5px] font-mono text-slate-500 font-bold">
              {today_timetable?.length || 0} Periods
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-[#122A24] block truncate">My Schedule</span>
            <span className="text-[10px] text-slate-500 font-mono truncate block">Weekly Timetable</span>
          </div>
        </Link>
      </div>

      {/* ── 3. CLASS TEACHER 360° TODAY STATUS (If Assigned Class Teacher) ── */}
      {is_class_teacher && class_teacher_stats && (
        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#E8F0EA] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs sm:text-sm font-bold text-[#122A24]">
                Class {displayClassCode} Overview Today
              </h2>
            </div>
            <Link
              href="/teacher/my-class/attendance"
              className="text-[11px] font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Full Register</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Present</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {class_teacher_stats.present_count}
              </span>
              <span className="text-[9.5px] text-slate-400 block font-mono">
                / {class_teacher_stats.total_students}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Absent</span>
              <span className="text-lg font-black text-rose-600 font-mono">
                {class_teacher_stats.absent_count}
              </span>
              <span className="text-[9.5px] text-slate-400 block font-mono">Scholars</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Pending Leaves</span>
              <span className="text-lg font-black text-amber-700 font-mono">
                {class_teacher_stats.pending_leaves_count}
              </span>
              <Link href="/teacher/my-class/leaves" className="text-[9.5px] text-amber-800 underline block font-mono">
                Review
              </Link>
            </div>
          </div>

          {/* Absent Students with Quick Call / Contact Chips */}
          {class_teacher_stats.absent_students && class_teacher_stats.absent_students.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-[#E8F0EA]">
              <span className="text-[10.5px] font-mono font-bold text-slate-600 uppercase block">
                Absent Scholars Today:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {class_teacher_stats.absent_students.map((st: any) => (
                  <span
                    key={st.student_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{st.student_name}</span>
                    {st.parent_phone && (
                      <a
                        href={`tel:${st.parent_phone}`}
                        className="text-[10px] text-slate-600 hover:text-[#122A24] font-mono"
                        title="Call Guardian"
                      >
                        📞
                      </a>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. TODAY'S CLASS SCHEDULE (TIMETABLE TIMELINE) ── */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8F0EA] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs sm:text-sm font-bold text-[#122A24]">
              Today&apos;s Class Schedule ({new Date().toLocaleDateString('en-US', { weekday: 'short' })})
            </h3>
          </div>
          <Link href="/teacher/timetable" className="text-[11px] font-mono font-bold text-emerald-700 hover:underline">
            Weekly View →
          </Link>
        </div>

        {today_timetable && today_timetable.length > 0 ? (
          <div className="space-y-2">
            {today_timetable.map((period: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5] flex items-center justify-between hover:border-emerald-300 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center font-mono">
                    P{period.period_no}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#122A24]">{period.subject}</p>
                    <p className="text-[10.5px] text-slate-500 font-mono">
                      {period.class_name} - {period.section}
                    </p>
                  </div>
                </div>
                <span className="text-[10.5px] font-mono text-[#2D5A4E] bg-white px-2 py-0.5 rounded-lg border border-[#DCE8E0]">
                  {period.start_time} - {period.end_time}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 font-mono text-xs">
            No teaching periods scheduled for today.
          </div>
        )}
      </div>

      {/* ── 5. SECONDARY QUICK ACTIONS & CIRCULARS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Link
          href="/teacher/requests"
          className="p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-amber-400 shadow-xs flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#122A24] block">My Petitions &amp; Regularization</span>
              <span className="text-[10px] text-slate-500 font-mono block">
                {pending_tasks.pending_biometric_requests_count} Missed Bio • {pending_tasks.pending_leave_requests_count} Leaves Pending
              </span>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-amber-700">→</span>
        </Link>

        <Link
          href="/teacher/syllabus"
          className="p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-rose-400 shadow-xs flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#122A24] block">Syllabus Progress Tracker</span>
              <span className="text-[10px] text-slate-500 font-mono block">
                {pending_tasks.overdue_syllabus_count} Topics Overdue Target Date
              </span>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-rose-700">→</span>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ⚡ MOBILE BOTTOM SHEET: AUTO POP-UP FOR STUDENT ATTENDANCE
          ══════════════════════════════════════════════════════════════ */}
      {showAttendanceSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Dark Backdrop with Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => {
              setShowAttendanceSheet(false);
              setSheetDismissed(true);
            }}
          />

          {/* Bottom Sheet Drawer Sliding up from the bottom */}
          <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-b-3xl shadow-2xl border-t border-[#DCE8E0] p-5 sm:p-6 z-10 max-h-[88vh] flex flex-col animate-slide-up-bottom-sheet space-y-4">
            {/* Draggable Top Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 cursor-grab" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <CalendarCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#122A24] tracking-tight">
                    Today&apos;s Student Attendance Pending
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Class {data?.class_teacher_section?.class_name}-{data?.class_teacher_section?.section} • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAttendanceSheet(false);
                  setSheetDismissed(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notice Banner */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-bold text-[11.5px]">Daily CBSE roll call is not recorded yet.</p>
                <p className="text-[10.5px] text-amber-800 font-mono mt-0.5">
                  Statutory morning attendance is required before 10:00 AM for automated parent notifications.
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0] text-xs font-bold">
              <button
                type="button"
                onClick={() => setSheetMode('quick')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  sheetMode === 'quick' ? 'bg-[#122A24] text-white shadow-xs' : 'text-[#2D5A4E]'
                }`}
              >
                ⚡ 1-Tap Fast Submit
              </button>
              <button
                type="button"
                onClick={() => setSheetMode('roster')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  sheetMode === 'roster' ? 'bg-[#122A24] text-white shadow-xs' : 'text-[#2D5A4E]'
                }`}
              >
                📋 Check Student Roster
              </button>
            </div>

            {/* Mode 1: 1-Tap Fast Submit */}
            {sheetMode === 'quick' && (
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3 text-center">
                <div className="text-emerald-950 font-bold text-sm">
                  Mark All Scholars Present
                </div>
                <p className="text-xs text-emerald-800/80 font-mono">
                  All {sheetStudents.length || data?.class_teacher_stats?.total_students || 38} students in Class {data?.class_teacher_section?.class_name}-{data?.class_teacher_section?.section} will be logged as PRESENT.
                </p>

                <button
                  type="button"
                  disabled={savingAttendance}
                  onClick={() => handleSaveAttendance(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{savingAttendance ? 'Submitting Attendance...' : '✅ Mark All Present & Submit Now'}</span>
                </button>
              </div>
            )}

            {/* Mode 2: Interactive Quick Roster (Tap student to mark Absent/Leave) */}
            {sheetMode === 'roster' && (
              <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                  <span>Tap student to toggle status</span>
                  <span className="font-bold text-[#122A24]">
                    {presentCountSheet} Present • {absentCountSheet} Absent
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-[#E8F0EA] border border-[#E2EBE5] rounded-2xl custom-scrollbar">
                  {loadingSheetStudents ? (
                    <div className="p-8 text-center text-slate-400 font-mono text-xs">
                      Loading class scholars...
                    </div>
                  ) : sheetStudents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-mono text-xs">
                      No scholars found in section.
                    </div>
                  ) : (
                    sheetStudents.map(student => (
                      <div
                        key={student.student_id}
                        onClick={() => toggleStudentStatus(student.student_id)}
                        className="p-2.5 flex items-center justify-between hover:bg-[#F8FAF9] transition cursor-pointer select-none"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-xs text-[#122A24] block truncate">
                            {student.roll_no ? `#${student.roll_no} • ` : ''}{student.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Adm: {student.admission_no}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : student.status === 'ABSENT'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {student.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  disabled={savingAttendance}
                  onClick={() => handleSaveAttendance(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAttendance ? 'Saving...' : `Save Attendance (${presentCountSheet} P / ${absentCountSheet} A)`}</span>
                </button>
              </div>
            )}

            {sheetFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs font-mono font-bold text-center ${
                  sheetFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {sheetFeedback.text}
              </div>
            )}

            {/* Footer Links */}
            <div className="pt-2 border-t border-[#E8F0EA] flex items-center justify-between text-xs font-mono">
              <Link
                href="/teacher/my-class/attendance"
                onClick={() => setShowAttendanceSheet(false)}
                className="text-emerald-700 hover:underline font-bold"
              >
                Open Full Screen Register →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowAttendanceSheet(false);
                  setSheetDismissed(true);
                }}
                className="text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
