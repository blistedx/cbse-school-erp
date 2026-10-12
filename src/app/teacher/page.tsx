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
  Save,
  CreditCard,
  ChevronDown,
  Filter,
  DollarSign,
  TrendingUp,
  Percent
} from 'lucide-react';
import { getTodayDateStr, formatClassSectionDisplay } from '@/lib/utils';

const ACADEMIC_MONTHS = [
  { key: 'APR', label: 'April' },
  { key: 'MAY', label: 'May' },
  { key: 'JUN', label: 'June' },
  { key: 'JUL', label: 'July' },
  { key: 'AUG', label: 'August' },
  { key: 'SEP', label: 'September' },
  { key: 'OCT', label: 'October' },
  { key: 'NOV', label: 'November' },
  { key: 'DEC', label: 'December' },
  { key: 'JAN', label: 'January' },
  { key: 'FEB', label: 'February' },
  { key: 'MAR', label: 'March' },
];

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [punching, setPunching] = useState(false);

  // Selected Month for Monthwise Fees KPI
  const [selectedMonth, setSelectedMonth] = useState<string>('OCT');
  const [showFeeStudentsModal, setShowFeeStudentsModal] = useState(false);
  const [feeStudentFilter, setFeeStudentFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');

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
    status: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  }>>([]);
  const [loadingSheetStudents, setLoadingSheetStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [sheetFeedback, setSheetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sheetMode, setSheetMode] = useState<'quick' | 'roster'>('quick');

  const loadDashboard = useCallback(async (monthToFetch?: string) => {
    try {
      setLoading(true);
      setError(null);
      const queryMonth = monthToFetch || selectedMonth;
      const res = await fetch(`/api/teacher/dashboard?month=${queryMonth}`);
      if (!res.ok) {
        throw new Error(`Failed to load dashboard (${res.status})`);
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.month_fees?.selected_month) {
          setSelectedMonth(json.month_fees.selected_month);
        }

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
  }, [sheetDismissed, selectedMonth]);

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
            json.students.map((s: any) => {
              let status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' = 'PRESENT';
              const raw = String(s.status || 'PRESENT').toUpperCase();
              if (raw === 'HOLIDAY') status = 'HOLIDAY';
              else if (raw === 'ABSENT' || raw === 'LEAVE') status = 'ABSENT';
              else status = 'PRESENT';
              return {
                student_id: s.student_id,
                admission_no: s.admission_no,
                full_name: s.full_name,
                roll_no: s.roll_no || '',
                status
              };
            })
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
  const handleSaveAttendance = async (markAction?: 'ALL_PRESENT' | 'ALL_HOLIDAY') => {
    if (!data?.class_teacher_section) return;
    try {
      setSavingAttendance(true);
      setSheetFeedback(null);

      const targetRecords = markAction === 'ALL_PRESENT'
        ? sheetStudents.map(s => ({ ...s, status: 'PRESENT' as const }))
        : markAction === 'ALL_HOLIDAY'
        ? sheetStudents.map(s => ({ ...s, status: 'HOLIDAY' as const }))
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
        const holidayCount = targetRecords.filter(s => s.status === 'HOLIDAY').length;
        const absentCount = targetRecords.filter(s => s.status === 'ABSENT').length;
        setSheetFeedback({
          type: 'success',
          text: `🎉 Attendance saved! (${presentCount} Present • ${absentCount} Absent • ${holidayCount} Holiday)`
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

  // Tap-to-cycle status: PRESENT -> ABSENT -> HOLIDAY -> PRESENT (Strictly No LEAVE)
  const toggleStudentStatus = (studentId: string) => {
    setSheetStudents(prev =>
      prev.map(s => {
        if (s.student_id !== studentId) return s;
        const nextStatus: 'PRESENT' | 'ABSENT' | 'HOLIDAY' = 
          s.status === 'PRESENT' ? 'ABSENT' : 
          s.status === 'ABSENT' ? 'HOLIDAY' : 
          'PRESENT';
        return { ...s, status: nextStatus };
      })
    );
  };

  const handleMonthChange = (monthKey: string) => {
    setSelectedMonth(monthKey);
    loadDashboard(monthKey);
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
    month_fees,
    latest_notices
  } = data;

  const presentCountSheet = sheetStudents.filter(s => s.status === 'PRESENT').length;
  const absentCountSheet = sheetStudents.filter(s => s.status === 'ABSENT').length;
  const holidayCountSheet = sheetStudents.filter(s => s.status === 'HOLIDAY').length;

  const classDisplay = formatClassSectionDisplay(
    class_teacher_section?.class_name,
    class_teacher_section?.section
  );
  const statsClassDisplay = formatClassSectionDisplay(
    class_teacher_stats?.class_name,
    class_teacher_stats?.section
  );
  const displayClassCode = classDisplay.code || statsClassDisplay.code || 'X-A';

  const cleanDesignation = (teacher.designation || 'Faculty Member')
    .replace(/\s*&\s*class\s*incharge/i, '')
    .replace(/,\s*class\s*incharge/i, '')
    .trim();

  // Active month fees data
  const activeMonthData = month_fees || class_teacher_stats?.month_fees;
  const activeMonthLabel = ACADEMIC_MONTHS.find(m => m.key === selectedMonth)?.label || 'October';

  // Filtered fee scholars for modal
  const feeStudentsList: Array<any> = activeMonthData?.students_breakdown || [];
  const filteredFeeStudents = feeStudentsList.filter((s: any) => {
    const matchesFilter = feeStudentFilter === 'ALL' 
      ? true 
      : feeStudentFilter === 'PAID' 
      ? s.status === 'PAID' 
      : s.status !== 'PAID';
    const matchesSearch = s.student_name.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
      (s.roll_no && String(s.roll_no).includes(feeSearchQuery));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in relative pb-12 sm:pb-6">
      {/* ── PERSISTENT ATTENDANCE ALERT PILL ── */}
      {is_class_teacher && class_teacher_stats && !class_teacher_stats.is_marked_today && (
        <div
          onClick={() => setShowAttendanceSheet(true)}
          className="bg-amber-500/15 border-2 border-amber-500/50 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/20 transition shadow-xs group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-amber-950 block truncate">
                🚨 Class {displayClassCode} Roll Call Pending Today!
              </span>
              <span className="text-[11px] text-amber-900/80 font-mono hidden sm:inline">
                Tap here to open fast mobile attendance roll call
              </span>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1 bg-amber-600 group-hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>Mark Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 1. HERO TEACHER APP CARD ── */}
      <div className="p-4 sm:p-6 rounded-3xl text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#0F2620] via-[#14352B] to-[#1A4237] border border-emerald-700/50 space-y-4 sm:space-y-5">
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/10 text-[10px] sm:text-[11px] font-mono font-medium">
              <CalendarCheck className="w-3 h-3 text-emerald-300" />
              <span>Session 2026-27</span>
            </span>
          </div>
        </div>

        {/* Teacher Identity & Class Incharge Badge */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-200 text-[#0F2620] font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shrink-0 ring-2 ring-emerald-300/40 ring-offset-2 ring-offset-[#14352B]">
              {(teacher.full_name || 'T')[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-black text-white tracking-tight truncate leading-tight">
                {teacher.full_name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 font-medium truncate mt-0.5">
                {cleanDesignation}
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

          {/* Class Incharge Badge Showcase */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400/40 via-amber-300/30 to-emerald-400/30 rounded-2xl blur-xs group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-gradient-to-b from-[#183d32] to-[#0e251f] border-2 border-amber-400/60 rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-md min-w-[95px] sm:min-w-[125px]">
              <div className="flex items-center gap-1 text-[8.5px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-amber-300/90">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 animate-pulse shrink-0" />
                <span>Class Incharge</span>
              </div>
              <div className="text-2xl sm:text-4xl font-black font-mono tracking-wider text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.35)] leading-none my-1">
                {displayClassCode}
              </div>
              <div className="text-[8.5px] sm:text-[10px] font-mono text-emerald-200/90 font-medium">
                {class_teacher_stats?.total_students 
                  ? `${class_teacher_stats.total_students} Scholars` 
                  : 'Assigned'}
              </div>
            </div>
          </div>
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
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-[#0F2620] font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{punching ? 'Recording...' : 'Clock In Now'}</span>
              </button>
            ) : !biometric_today.out_time ? (
              <button
                type="button"
                onClick={() => handlePunch('PUNCH_OUT')}
                disabled={punching}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-[#0F2620] font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
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

      {/* ── 2. EXECUTIVE KPI DASHBOARD (STRENGTH, ATTENDANCE & MONTHWISE FEES) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs sm:text-sm font-black text-[#122A24] uppercase tracking-wider">
              Class {displayClassCode} Core KPIs
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Real-Time Class Ledger
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* ── KPI CARD 1: STUDENTS STRENGTH ── */}
          <div className="p-4 sm:p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-400 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
                Class {displayClassCode}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#122A24] font-mono">
                  {class_teacher_stats?.total_students || 38}
                </span>
                <span className="text-xs font-bold text-slate-500">Scholars Enrolled</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Active strength assigned to your class section
              </p>
            </div>

            <div className="pt-2 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Section Directory:</span>
              <Link 
                href="/teacher/my-class/dossier" 
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                <span>View Dossier</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* ── KPI CARD 2: TODAY'S ATTENDANCE (PRESENT / ABSENT / HOLIDAY) ── */}
          <div className="p-4 sm:p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-400 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                <CalendarCheck className="w-5 h-5 text-blue-700" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                class_teacher_stats?.is_marked_today
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}>
                {class_teacher_stats?.is_marked_today ? '✓ ROLL CALL MARKED' : '⚠️ PENDING ROLL CALL'}
              </span>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-1.5 text-center my-1">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200/60">
                  <span className="text-[9.5px] font-mono text-emerald-800 font-bold uppercase block">Present</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    {class_teacher_stats?.present_count ?? 0}
                  </span>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-200/60">
                  <span className="text-[9.5px] font-mono text-rose-800 font-bold uppercase block">Absent</span>
                  <span className="text-xl font-black text-rose-600 font-mono">
                    {class_teacher_stats?.absent_count ?? 0}
                  </span>
                </div>
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/60">
                  <span className="text-[9.5px] font-mono text-amber-800 font-bold uppercase block">Holiday</span>
                  <span className="text-xl font-black text-amber-700 font-mono">
                    {class_teacher_stats?.holiday_count ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono mt-2">
                <span className="text-slate-500">Today&apos;s Turnout:</span>
                <span className="font-bold text-[#122A24]">
                  {class_teacher_stats?.attendance_percent || 0}% Present
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setShowAttendanceSheet(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{class_teacher_stats?.is_marked_today ? 'Review / Edit Roster' : 'Mark Roll Call Now'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <Link 
                href="/teacher/my-class/attendance" 
                className="text-slate-400 hover:text-slate-600 font-mono"
              >
                Full Ledger →
              </Link>
            </div>
          </div>

          {/* ── KPI CARD 3: MONTHWISE FEES CLEARANCE & FILTER ── */}
          <div className="p-4 sm:p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-400 transition sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#122A24]">Class Fee Ledger</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Monthwise Status</p>
                </div>
              </div>

              {/* Month Change Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="text-xs font-bold font-mono bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:bg-emerald-100 transition"
              >
                {ACADEMIC_MONTHS.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Quick Horizontal Month Pills (Touch-Friendly for Mobile) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-mono font-bold">
              {ACADEMIC_MONTHS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleMonthChange(m.key)}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    selectedMonth === m.key
                      ? 'bg-[#122A24] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.key}
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Submitted ({activeMonthLabel})</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                    ₹{Number(activeMonthData?.total_collected || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Pending Due</span>
                  <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">
                    ₹{Number(activeMonthData?.total_pending || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Progress Bar for Fee Collection */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, activeMonthData?.collection_percentage || 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px] font-mono mt-2">
                <span className="text-slate-500 font-bold">
                  {activeMonthData?.collection_percentage || 0}% Remitted
                </span>
                <span className="text-[#122A24] font-bold">
                  {activeMonthData?.paid_students_count || 0} Paid • {activeMonthData?.pending_students_count || 0} Due
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setShowFeeStudentsModal(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Scholars List</span>
                <ChevronRight className="w-3 h-3" />
              </button>
              <Link 
                href="/teacher/my-class/fees" 
                className="text-slate-400 hover:text-slate-600 font-mono"
              >
                Defaulters Desk →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. TODAY'S ABSENT SCHOLARS ALERT (WITH 1-TAP CONTACT) ── */}
      {class_teacher_stats?.absent_students && class_teacher_stats.absent_students.length > 0 && (
        <div className="p-4 sm:p-5 bg-rose-50/60 rounded-3xl border border-rose-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs sm:text-sm font-bold text-rose-950">
                Absent Scholars Today ({class_teacher_stats.absent_students.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-rose-800">
              Immediate Parent Advisory
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {class_teacher_stats.absent_students.map((st: any) => (
              <div
                key={st.student_id}
                className="p-2.5 bg-white rounded-2xl border border-rose-200 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-[#122A24] block truncate">
                    {st.roll_no ? `#${st.roll_no} • ` : ''}{st.student_name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Adm: {st.admission_no}
                  </span>
                </div>
                {st.parent_phone && (
                  <a
                    href={`tel:${st.parent_phone}`}
                    className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono font-bold flex items-center gap-1 shrink-0"
                    title="Call Guardian"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">Call</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. QUICK TOUCH ACTION GRID (APP-LIKE TILES) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {/* Tile 1: Mark Attendance */}
        <div
          onClick={() => {
            if (is_class_teacher) {
              setShowAttendanceSheet(true);
            }
          }}
          className="relative cursor-pointer"
        >
          <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-emerald-500 shadow-xs flex flex-col justify-between h-24 sm:h-28 transition hover-lift group">
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
              <span className="text-xs font-bold text-[#122A24] block truncate">Roll Call Desk</span>
              <span className="text-[10px] text-slate-500 font-mono truncate block">
                Class {displayClassCode}
              </span>
            </div>
          </div>
        </div>

        {/* Tile 2: Class Fees */}
        <Link
          href="/teacher/my-class/fees"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-amber-500 shadow-xs flex flex-col justify-between h-24 sm:h-28 transition hover-lift group block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-slate-400 group-hover:text-amber-700">→</span>
          </div>
          <div>
            <span className="text-xs font-bold text-[#122A24] block truncate">Class Fees</span>
            <span className="text-[10px] text-slate-500 font-mono truncate block">Reminders &amp; Dues</span>
          </div>
        </Link>

        {/* Tile 3: Students Dossier */}
        <Link
          href="/teacher/my-class/dossier"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE8E0] hover:border-teal-500 shadow-xs flex flex-col justify-between h-24 sm:h-28 transition hover-lift group block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-slate-400 group-hover:text-teal-700">→</span>
          </div>
          <div>
            <span className="text-xs font-bold text-[#122A24] block truncate">Class Dossier</span>
            <span className="text-[10px] text-slate-500 font-mono truncate block">Student Profiles</span>
          </div>
        </Link>

        {/* Tile 4: Homework Desk */}
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
            <span className="text-[10px] text-slate-500 font-mono truncate block">Daily Diary</span>
          </div>
        </Link>

        {/* Tile 5: Exam Marks Entry */}
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
            <span className="text-[10px] text-slate-500 font-mono truncate block">Assessments</span>
          </div>
        </Link>

        {/* Tile 6: Timetable */}
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
            <span className="text-[10px] text-slate-500 font-mono truncate block">Timetable</span>
          </div>
        </Link>
      </div>

      {/* ── 5. TODAY'S CLASS SCHEDULE (TIMETABLE TIMELINE) ── */}
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

      {/* ══════════════════════════════════════════════════════════════
          ⚡ MOBILE BOTTOM SHEET: AUTO POP-UP FOR STUDENT ATTENDANCE
          (STRICTLY PRESENT, ABSENT, HOLIDAY - TAP TO CYCLE STATUS)
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

          {/* Bottom Sheet Drawer */}
          <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-b-3xl shadow-2xl border-t border-[#DCE8E0] p-5 sm:p-6 z-10 max-h-[88vh] flex flex-col animate-slide-up-bottom-sheet space-y-4">
            {/* Draggable Top Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 cursor-grab" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <CalendarCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#122A24] tracking-tight">
                    Class {displayClassCode} Roll Call Desk
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • Tap to change status
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

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F4F8F5] rounded-xl border border-[#DCE8E0] text-xs font-bold">
              <button
                type="button"
                onClick={() => setSheetMode('quick')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  sheetMode === 'quick' ? 'bg-[#122A24] text-white shadow-xs' : 'text-[#2D5A4E]'
                }`}
              >
                ⚡ Fast 1-Tap Submit
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
                  Quick Attendance Actions
                </div>
                <p className="text-xs text-emerald-800/80 font-mono">
                  All {sheetStudents.length || class_teacher_stats?.total_students || 38} students in Class {displayClassCode}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={savingAttendance}
                    onClick={() => handleSaveAttendance('ALL_PRESENT')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Mark All Present</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingAttendance}
                    onClick={() => handleSaveAttendance('ALL_HOLIDAY')}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>🌴 Mark Holiday</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Interactive Quick Roster (Tap student to cycle: Present -> Absent -> Holiday) */}
            {sheetMode === 'roster' && (
              <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                  <span className="font-semibold text-emerald-800">💡 Tap student to cycle (P → A → H)</span>
                  <span className="font-bold text-[#122A24]">
                    {presentCountSheet} P • {absentCountSheet} A • {holidayCountSheet} H
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-60 divide-y divide-[#E8F0EA] border border-[#E2EBE5] rounded-2xl custom-scrollbar">
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
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border transition ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20'
                              : student.status === 'ABSENT'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-500/20'
                              : 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/20'
                          }`}
                        >
                          {student.status === 'PRESENT' ? '✓ Present' : student.status === 'ABSENT' ? '✕ Absent' : '🌴 Holiday'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  disabled={savingAttendance}
                  onClick={() => handleSaveAttendance()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAttendance ? 'Saving...' : `Save Attendance (${presentCountSheet} P / ${absentCountSheet} A / ${holidayCountSheet} H)`}</span>
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

      {/* ══════════════════════════════════════════════════════════════
          📊 MODAL: SCHOLAR FEES BREAKDOWN FOR SELECTED MONTH
          ══════════════════════════════════════════════════════════════ */}
      {showFeeStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowFeeStudentsModal(false)}
          />

          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200 p-5 sm:p-6 z-10 max-h-[85vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#122A24]">
                    Class {displayClassCode} Fees: {activeMonthLabel}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Total: ₹{Number(activeMonthData?.total_collected || 0).toLocaleString('en-IN')} Paid • ₹{Number(activeMonthData?.total_pending || 0).toLocaleString('en-IN')} Due
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFeeStudentsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl text-xs font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFeeStudentFilter('ALL')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    feeStudentFilter === 'ALL' ? 'bg-white text-[#122A24] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  All ({feeStudentsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeeStudentFilter('PENDING')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    feeStudentFilter === 'PENDING' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Due / Pending ({activeMonthData?.pending_students_count || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setFeeStudentFilter('PAID')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    feeStudentFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Paid ({activeMonthData?.paid_students_count || 0})
                </button>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={feeSearchQuery}
                  onChange={(e) => setFeeSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-2xl custom-scrollbar max-h-80">
              {filteredFeeStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No scholars match the selected filter.
                </div>
              ) : (
                filteredFeeStudents.map((s: any) => (
                  <div key={s.student_id} className="p-3 flex items-center justify-between hover:bg-gray-50/80 transition">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-400">{s.roll_no ? `#${s.roll_no}` : '--'}</span>
                        <h4 className="font-bold text-xs text-gray-900 truncate">{s.student_name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Adm: {s.admission_no} • Guardian: {s.father_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right font-mono">
                        <span className={`text-xs font-bold block ${
                          s.status === 'PAID' ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {s.status === 'PAID' ? 'PAID' : `₹${Number(s.pending_amount).toLocaleString('en-IN')} DUE`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ₹{Number(s.amount_paid).toLocaleString('en-IN')} paid
                        </span>
                      </div>

                      {s.parent_phone && (
                        <a
                          href={`tel:${s.parent_phone}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 text-xs flex items-center justify-center transition"
                          title="Call Parent"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
              <Link
                href="/teacher/my-class/fees"
                onClick={() => setShowFeeStudentsModal(false)}
                className="text-emerald-700 hover:underline font-bold"
              >
                Open Full Fees Desk →
              </Link>
              <button
                type="button"
                onClick={() => setShowFeeStudentsModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
