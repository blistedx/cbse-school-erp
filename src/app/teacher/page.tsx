/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Settings,
  Bell,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  TrendingUp,
  CreditCard,
  ChevronRight,
  X,
  Check,
  Save,
  Search,
  Phone,
  Mail,
  Award,
  Sparkles,
  Filter,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  BarChart2,
  CalendarCheck,
  ArrowRight,
  ShieldCheck,
  LogIn,
  LogOut,
  ClipboardList,
  UserCheck,
  CheckCheck
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

function parseClockInSeconds(timeStr?: string): number | null {
  if (!timeStr) return null;
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    }
  }
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const meridiem = match[4]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 3600 + minutes * 60 + seconds;
}

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

  // Settings & Notices Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNoticesModal, setShowNoticesModal] = useState(false);

  // 8-Hour Reverse Duty Shift Countdown Timer
  const [dutyCountdownStr, setDutyCountdownStr] = useState<string>('08h 00m 00s');
  const [isDutyCompleted, setIsDutyCompleted] = useState<boolean>(false);

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

  // Live 8-Hour Countdown Effect
  useEffect(() => {
    const updateCountdown = () => {
      const bioIn = data?.biometric_today;
      if (!bioIn || bioIn.status !== 'PRESENT' || !bioIn.in_time) {
        setDutyCountdownStr('08h 00m 00s');
        setIsDutyCompleted(false);
        return;
      }

      const inSec = parseClockInSeconds(bioIn.in_time);
      if (inSec === null) {
        setDutyCountdownStr('08h 00m 00s');
        setIsDutyCompleted(false);
        return;
      }

      const now = new Date();
      const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const elapsed = Math.max(0, nowSec - inSec);
      const shiftTotal = 8 * 3600; // 8 Hours = 28,800 seconds
      const remaining = Math.max(0, shiftTotal - elapsed);

      const remH = Math.floor(remaining / 3600);
      const remM = Math.floor((remaining % 3600) / 60);
      const remS = remaining % 60;

      setDutyCountdownStr(
        `${String(remH).padStart(2, '0')}h ${String(remM).padStart(2, '0')}m ${String(remS).padStart(2, '0')}s`
      );
      setIsDutyCompleted(elapsed >= shiftTotal);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.biometric_today]);

  // ── AUTOMATIC / INTERACTIVE ROLL CALL ATTENDANCE SHEET STATE ──
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
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const [sheetStatusFilter, setSheetStatusFilter] = useState<'ALL' | 'ABSENT' | 'PRESENT'>('ALL');

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

        // TRIGGER AUTOMATIC ROLL CALL POPUP ONLY IF CLASS ATTENDANCE HAS NOT BEEN MARKED AT ALL
        if (
          json.is_class_teacher &&
          json.class_teacher_stats &&
          !json.class_teacher_stats.is_marked_today &&
          !sheetDismissed
        ) {
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

  // Refetch students for roll call whenever the sheet opens
  useEffect(() => {
    if (showAttendanceSheet && data?.is_class_teacher) {
      fetchSheetStudents();
    }
  }, [showAttendanceSheet, data?.is_class_teacher]);

  const fetchSheetStudents = async () => {
    try {
      setLoadingSheetStudents(true);
      const res = await fetch(`/api/teacher/class/attendance?date=${getTodayDateStr()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.students)) {
          const sortedStudents = [...json.students].sort((a: any, b: any) =>
            (a.full_name || a.name || '').localeCompare(b.full_name || b.name || '')
          );
          setSheetStudents(
            sortedStudents.map((s: any) => {
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

  // Submit attendance from roll call sheet
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

        // Refetch dashboard immediately to update all metrics
        await loadDashboard();

        setTimeout(() => {
          setShowAttendanceSheet(false);
        }, 1200);
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

  // Set explicit status for student
  const setStudentStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'HOLIDAY') => {
    setSheetStudents(prev =>
      prev.map(s => (s.student_id === studentId ? { ...s, status } : s))
    );
  };

  // Tap-to-cycle status: PRESENT -> ABSENT -> HOLIDAY -> PRESENT
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
      <div className="max-w-md mx-auto space-y-4 animate-pulse pt-2">
        <div className="h-10 bg-slate-200/70 rounded-2xl" />
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
        <div className="h-32 bg-slate-200/70 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto p-6 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3">
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

  const cleanDesignation = (teacher.designation || 'Head of English')
    .replace(/\s*&\s*class\s*incharge/i, '')
    .replace(/,\s*class\s*incharge/i, '')
    .trim();

  // Active month fees data
  const activeMonthData = month_fees || class_teacher_stats?.month_fees;
  const activeMonthLabel = ACADEMIC_MONTHS.find(m => m.key === selectedMonth)?.label || 'October';

  // Fee students for modal
  const feeStudentsList: Array<any> = ((activeMonthData?.students_breakdown || []) as any[])
    .slice()
    .sort((a: any, b: any) => (a.student_name || '').localeCompare(b.student_name || ''));
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

  // Filtered sheet students for roll call
  const filteredSheetStudents = sheetStudents.filter(s => {
    const matchesSearch = !sheetSearchQuery || 
      s.full_name.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
      (s.roll_no && String(s.roll_no).includes(sheetSearchQuery));
    const matchesStatus = sheetStatusFilter === 'ALL' 
      ? true 
      : sheetStatusFilter === 'ABSENT' 
      ? s.status === 'ABSENT' 
      : s.status === 'PRESENT';
    return matchesSearch && matchesStatus;
  });

  // Insights calculation
  const totalEnrolled = class_teacher_stats?.total_students || 28;
  const currentPresentCount = class_teacher_stats?.present_count ?? (totalEnrolled - 4);
  const currentAbsentCount = class_teacher_stats?.absent_count ?? 4;
  const currentHolidayCount = class_teacher_stats?.holiday_count ?? 0;
  const currentAttPercent = class_teacher_stats?.is_marked_today
    ? class_teacher_stats.attendance_percent
    : Number(((currentPresentCount / totalEnrolled) * 100).toFixed(1));

  const isHoliday = currentHolidayCount === totalEnrolled && totalEnrolled > 0;

  return (
    <div className="max-w-md mx-auto space-y-4 sm:space-y-5 animate-fade-in pb-16 font-sans">

      {/* ══════════════════════════════════════════════════════════════
          1. HEADER: SETTINGS GEAR • "Faculty Dashboard" • NOTIFICATION BELL
          ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pt-1 pb-1 px-1">
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition cursor-pointer"
          title="Settings"
        >
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-center">
          Faculty Dashboard
        </h1>

        <button
          type="button"
          onClick={() => setShowNoticesModal(true)}
          className="p-2 rounded-xl text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 active:scale-95 transition cursor-pointer relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2.2]" />
          {(latest_notices?.length > 0 || (pending_tasks && pending_tasks.pending_leave_requests_count > 0)) && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. FACULTY PROFILE CARD (ADMIN-STYLE DEEP GREEN THEME)
          ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-[28px] p-4.5 sm:p-6 shadow-xl border border-emerald-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden bg-gradient-to-br from-[#0F2620] via-[#14352B] to-[#1A4237] text-white">
        <div className="absolute -right-8 -top-8 w-52 h-52 bg-radial from-emerald-400/20 via-teal-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />
        <div className="absolute right-0 bottom-0 w-36 h-36 bg-radial from-amber-400/10 to-transparent pointer-events-none rounded-full blur-xl" />

        {/* Left: Avatar + Details */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 relative z-10 min-w-0 flex-1">
          {/* Profile Avatar with Circular Badge 'A' */}
          <div className="relative shrink-0 pt-0.5">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-emerald-950 ring-2 ring-emerald-300/40 shadow-lg flex items-center justify-center">
              <img
                src="/teacher-ananya.jpg"
                alt={teacher.full_name || 'Ananya Sen'}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="w-full h-full bg-emerald-700 text-white font-black text-2xl flex items-center justify-center -mt-0.5">
                {(teacher.full_name || 'A')[0]}
              </div>
            </div>
            {/* Badge 'A' at bottom-right of avatar */}
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-400 text-[#0F2620] font-black text-xs flex items-center justify-center border-2 border-[#14352B] shadow-xs">
              {(teacher.full_name || 'A')[0]}
            </span>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight truncate">
                {teacher.full_name || 'Ananya Sen'}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-emerald-300 leading-tight mt-0.5 truncate">
                {cleanDesignation || 'Head of English'}
              </p>
            </div>

            <div className="space-y-0.5 pt-1 text-[11px] sm:text-xs text-emerald-100/90 font-medium font-mono">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/10 text-emerald-200 border border-white/10 text-[10px] font-bold">
                  ID • {teacher.staff_code || 'EMP-CLAS01'}
                </span>
                <span className="text-emerald-400/50">•</span>
                <span className="text-emerald-200/90">Joined • 12 Jun 2021</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-emerald-200/80">
                <span>Department • {teacher.department || 'English'}</span>
                <span className="text-emerald-400/50">•</span>
                <span>Experience • 4+ Years</span>
              </div>

              <div className="text-emerald-200/90 truncate">
                Qualification • {teacher.qualification || 'MA English'}
              </div>

              <div className="flex items-center gap-1.5 text-emerald-200/90 truncate pt-0.5">
                <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{teacher.email || 'ananya.sen@school.edu'}</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-200/90 truncate">
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-mono">{teacher.phone || '+91 98765 43210'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Incharge Badge Highlight */}
        {is_class_teacher && (
          <div className="relative z-10 shrink-0 w-full sm:w-auto flex sm:flex-col items-center justify-between sm:justify-center p-3 sm:px-4 sm:py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
            <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Class Incharge</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 my-0.5 sm:my-1">
              {displayClassCode}
            </div>
            <span className="text-[10px] font-mono text-emerald-200">
              {totalEnrolled} Scholars
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. "MY DUTIES" (2x2 GRID WITH GREEN ICONS)
          ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-2.5">
        <div className="px-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            My Duties
          </h2>
          <div className="w-7 h-1 bg-emerald-700 rounded-full mt-0.5" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Duty 1: Class Incharge */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight truncate">
                Class Incharge
              </span>
              <span className="text-xs font-semibold text-slate-600 block mt-0.5">
                {displayClassCode}
              </span>
            </div>
          </div>

          {/* Duty 2: 28 Scholars */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight truncate">
                {totalEnrolled} Scholars
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Students
              </span>
            </div>
          </div>

          {/* Duty 3: Subjects Taught */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight truncate">
                Subjects Taught
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 block leading-snug mt-0.5 line-clamp-2">
                English Literature & Grammar
              </span>
            </div>
          </div>

          {/* Duty 4: Total Periods Today */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-500 block leading-tight">
                Total Periods Today
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 block leading-tight mt-0.5">
                {today_timetable?.length || 5}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. "TODAY'S SNAPSHOT"
          ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-base sm:text-lg font-black text-slate-900 px-1">
          <Calendar className="w-4 h-4 text-slate-800" />
          <span>Today's Snapshot</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {/* Row 1: Biometric Clocked In */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    Biometric • Clocked In
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                  {biometric_today.in_time || '08:15 AM'} • {isDutyCompleted ? 'Shift Completed' : 'Shift Active'}
                </p>
              </div>
            </div>

            {/* Shift Timer or Punch button */}
            {biometric_today.status !== 'PRESENT' ? (
              <button
                type="button"
                onClick={() => handlePunch('PUNCH_IN')}
                disabled={punching}
                className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 active:scale-95 transition cursor-pointer"
              >
                {punching ? '...' : 'Punch In'}
              </button>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {dutyCountdownStr}
              </span>
            )}
          </div>

          {/* Row 2: Next Class & Pending Tasks */}
          <div className="p-3.5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Next Class • {displayClassCode} Period 3 at 10:30 AM • English Literature
                </p>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  <span className="font-semibold text-slate-700">Pending Tasks</span> • 2 copies to check
                </div>
              </div>
            </div>

            {/* Badges: Upcoming & 2 Pending */}
            <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-[#143d32] text-emerald-100 text-[10px] font-bold tracking-tight">
                Upcoming
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-bold tracking-tight">
                2 Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          5. "CLASS X-A INSIGHTS" & INTERACTIVE MONTH FEE FILTER
          ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-base sm:text-lg font-black text-slate-900">
            <BarChart2 className="w-4 h-4 text-slate-800" />
            <span>Class {displayClassCode} Insights</span>
          </div>

          {/* Quick Mark button */}
          <button
            type="button"
            onClick={() => setShowAttendanceSheet(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Roll Call</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── ACADEMIC MONTH FILTER FOR FEES & ANALYTICS ── */}
        <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-slate-800 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              <span>Select Academic Fee Month:</span>
            </span>
            <span className="text-emerald-900 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {activeMonthLabel} 2026
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
            {ACADEMIC_MONTHS.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => handleMonthChange(m.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                  selectedMonth === m.key
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Tile 1: Enrolled */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <GraduationCap className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.8} />
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight truncate">
                {totalEnrolled} Enrolled
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Total Enrolled
              </span>
            </div>
          </div>

          {/* Tile 2: Today's Attendance (INTERACTIVE CLICKABLE TILE) */}
          <div
            onClick={() => setShowAttendanceSheet(true)}
            className="bg-white hover:bg-emerald-50/50 rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3 cursor-pointer transition group"
            title="Click to view/mark class attendance"
          >
            <CalendarCheck className="w-7 h-7 text-emerald-700 group-hover:scale-110 transition shrink-0" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight truncate">
                {isHoliday ? '0% Attendance (holiday)' : `${currentAttPercent}% Attendance`}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 truncate font-medium">
                {isHoliday
                  ? 'Today • Holiday'
                  : currentAbsentCount > 0
                  ? `Today • ${currentAbsentCount} Absent`
                  : 'Today • All Present'}
              </span>
            </div>
          </div>

          {/* Tile 3: Avg Monthly Attendance */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3">
            <TrendingUp className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.8} />
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight">
                92%
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 block leading-snug mt-0.5">
                Avg Monthly Attendance<br className="hidden sm:inline" /> Last 30 days
              </span>
            </div>
          </div>

          {/* Tile 4: Fee Clearance (CLICKABLE TO OPEN MONTHLY FEES MODAL) */}
          <div
            onClick={() => setShowFeeStudentsModal(true)}
            className="bg-white hover:bg-slate-50/80 rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 sm:gap-3 cursor-pointer transition group"
            title="Click to view scholar fees"
          >
            <CreditCard className="w-7 h-7 text-slate-800 group-hover:text-emerald-700 transition shrink-0" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight truncate">
                {activeMonthData?.collection_percentage ? `${activeMonthData.collection_percentage}% Fee Clearance` : '100% Fee Clearance'}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 truncate font-medium">
                {activeMonthLabel} 2026 • {activeMonthData?.total_pending === 0 ? 'Cleared' : `₹${Number(activeMonthData?.total_pending || 0).toLocaleString('en-IN')} Due`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          6. INTERACTIVE ROLL CALL ATTENDANCE SHEET / MODAL
          ══════════════════════════════════════════════════════════════ */}
      {showAttendanceSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowAttendanceSheet(false);
              setSheetDismissed(true);
            }}
          />

          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col space-y-3.5 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    Class {displayClassCode} Roll Call
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {sheetStudents.length || totalEnrolled} Scholars
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
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Counter Summary */}
            <div className="flex items-center justify-between px-1 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono">
              <span className="font-bold text-slate-700">Live Count:</span>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-emerald-700">{presentCountSheet} Present</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-600">{absentCountSheet} Absent</span>
                {holidayCountSheet > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-600">{holidayCountSheet} Holiday</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Bulk Actions & Search Filter */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAttendance('ALL_PRESENT')}
                  disabled={savingAttendance}
                  className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAttendance('ALL_HOLIDAY')}
                  disabled={savingAttendance}
                  className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <span>🌴 Mark Holiday</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search scholar by name or roll..."
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      sheetStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter('ABSENT')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      sheetStatusFilter === 'ABSENT' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Absent ({absentCountSheet})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter('PRESENT')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      sheetStatusFilter === 'PRESENT' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Present ({presentCountSheet})
                  </button>
                </div>
              </div>
            </div>

            {/* Student Roster List */}
            <div className="flex-1 overflow-y-auto max-h-64 sm:max-h-72 divide-y divide-slate-100 border border-slate-200 rounded-2xl custom-scrollbar">
              {loadingSheetStudents ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  Loading class scholars...
                </div>
              ) : filteredSheetStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No scholars match the search filter.
                </div>
              ) : (
                filteredSheetStudents.map(student => (
                  <div
                    key={student.student_id}
                    className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50/80 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {student.roll_no ? `#${student.roll_no}` : '--'}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {student.full_name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Adm: {student.admission_no}
                      </p>
                    </div>

                    {/* Direct Toggle Buttons: Present | Absent */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.student_id, 'PRESENT')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                          student.status === 'PRESENT'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        ✓ Present
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.student_id, 'ABSENT')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                          student.status === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        ✕ Absent
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Feedback Message */}
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

            {/* Save Attendance Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={savingAttendance}
                onClick={() => handleSaveAttendance()}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingAttendance
                    ? 'Saving Record...'
                    : `Save Attendance (${presentCountSheet} Present • ${absentCountSheet} Absent)`}
                </span>
              </button>

              <div className="flex items-center justify-between text-xs font-mono px-1">
                <Link
                  href="/teacher/my-class/attendance"
                  onClick={() => setShowAttendanceSheet(false)}
                  className="text-emerald-700 hover:underline font-bold"
                >
                  Open Full Screen Register →
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAttendanceSheet(false)}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          7. MODAL: SCHOLAR FEES BREAKDOWN FOR SELECTED MONTH
          ══════════════════════════════════════════════════════════════ */}
      {showFeeStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowFeeStudentsModal(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-10 max-h-[85vh] flex flex-col space-y-3.5 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0F2620] text-white flex items-center justify-center font-bold shadow-xs">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
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

            {/* Academic Month Selector Bar inside Modal */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 px-1 mb-1.5">
                <span className="flex items-center gap-1 text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Select Academic Month
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {activeMonthLabel} • {activeMonthData?.collection_percentage || 0}% Cleared
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {ACADEMIC_MONTHS.map((m) => {
                  const isCurrent = (activeMonthData?.selected_month || selectedMonth) === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => handleMonthChange(m.key)}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0F2620] text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                      }`}
                    >
                      {m.label.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFeeStudentFilter('ALL')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg transition cursor-pointer ${
                    feeStudentFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  All ({feeStudentsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeeStudentFilter('PENDING')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg transition cursor-pointer ${
                    feeStudentFilter === 'PENDING' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Pending ({activeMonthData?.pending_students_count || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setFeeStudentFilter('PAID')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg transition cursor-pointer ${
                    feeStudentFilter === 'PAID' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Paid ({activeMonthData?.paid_students_count || 0})
                </button>
              </div>

              <div className="relative w-full sm:w-44">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search scholar..."
                  value={feeSearchQuery}
                  onChange={(e) => setFeeSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl custom-scrollbar max-h-72">
              {filteredFeeStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No scholars match the selected filter.
                </div>
              ) : (
                filteredFeeStudents.map((s: any) => (
                  <div key={s.student_id} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-400">{s.roll_no ? `#${s.roll_no}` : '--'}</span>
                        <h4 className="font-bold text-xs text-slate-900 truncate">{s.student_name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Adm: {s.admission_no} • Guardian: {s.father_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition"
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
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
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
                className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          8. MODAL: NOTIFICATIONS & SCHOOL NOTICES
          ══════════════════════════════════════════════════════════════ */}
      {showNoticesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowNoticesModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-10 max-h-[80vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-slate-900">Faculty Notices & Alerts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNoticesModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-72">
              {(!latest_notices || latest_notices.length === 0) ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No new circulars or notices published today.
                </div>
              ) : (
                latest_notices.map((n: any, idx: number) => (
                  <div key={n.id || idx} className="py-2.5 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                      {n.date || 'Notice'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {n.content || n.description}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowNoticesModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          9. MODAL: FACULTY QUICK SETTINGS
          ══════════════════════════════════════════════════════════════ */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-10 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-base text-slate-900">Faculty Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <Link
                href="/teacher/profile"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl flex items-center justify-between font-bold text-slate-800 transition"
              >
                <span>👤 My Profile & Qualifications</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/teacher/my-class/dossier"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl flex items-center justify-between font-bold text-slate-800 transition"
              >
                <span>📂 Class Student Dossier (X-A)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/teacher/attendance"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl flex items-center justify-between font-bold text-slate-800 transition"
              >
                <span>⏱️ My Biometric Punch Log</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/teacher/reports"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl flex items-center justify-between font-bold text-slate-800 transition"
              >
                <span>📊 CBSE Academic Reports</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
