/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  X,
  Fingerprint,
  LogIn,
  LogOut,
  Palmtree,
  Sparkles,
  RefreshCw,
  FileCheck2,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Info,
  CalendarCheck
} from 'lucide-react';
import { School } from '@/lib/types';

interface DashboardAdminMyAttendanceProps {
  selectedSchool: School | null;
  currentUser?: any;
  userRole?: string;
  selectedSession?: string;
  setActiveTab?: (tab: string) => void;
  showAdminToast?: (msg: string) => void;
}

export function DashboardAdminMyAttendance({
  selectedSchool,
  currentUser,
  userRole = 'ADMIN',
  selectedSession = '2026-27',
  setActiveTab,
  showAdminToast
}: DashboardAdminMyAttendanceProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Month selector - defaults to current month
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08'); // Seeded sample month or default

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [punching, setPunching] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Missed Punch Regularization Petition Modal State
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    date: string;
    submitting: boolean;
    error: string | null;
    success: string | null;
    form: {
      request_type: 'MISSED_IN' | 'MISSED_OUT' | 'MISSED_BOTH' | 'ON_DUTY_OFFSITE';
      expected_in: string;
      expected_out: string;
      reason: string;
      attachment_url?: string;
    };
  }>({
    isOpen: false,
    date: '',
    submitting: false,
    error: null,
    success: null,
    form: {
      request_type: 'MISSED_IN',
      expected_in: '08:30 AM',
      expected_out: '03:30 PM',
      reason: '',
      attachment_url: ''
    }
  });

  // View existing petition details modal
  const [viewPetition, setViewPetition] = useState<any | null>(null);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const schoolParam = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const res = await fetch(`/api/admin/my-attendance?month=${selectedMonth}&school_id=${encodeURIComponent(schoolParam)}&session=${selectedSession}`);
      if (!res.ok) throw new Error('Failed to load administrator biometric records');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to retrieve attendance');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedSchool, selectedSession]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handlePunchAction = async (action: 'PUNCH_IN' | 'PUNCH_OUT') => {
    try {
      setPunching(true);
      setPunchFeedback(null);
      const schoolParam = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const res = await fetch('/api/admin/my-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          school_id: schoolParam,
          academic_session: selectedSession
        })
      });
      const json = await res.json();
      if (json.success) {
        const msg = json.message || (action === 'PUNCH_IN' ? 'Successfully Clocked In!' : 'Successfully Clocked Out!');
        setPunchFeedback({ type: 'success', message: msg });
        if (showAdminToast) showAdminToast(msg);
        await loadAttendance();
      } else {
        setPunchFeedback({ type: 'error', message: json.error || 'Failed to record punch' });
      }
    } catch (err: any) {
      setPunchFeedback({ type: 'error', message: err.message || 'Network error punching attendance.' });
    } finally {
      setPunching(false);
    }
  };

  const handleOpenRequestModal = (date: string) => {
    setRequestModal({
      isOpen: true,
      date,
      submitting: false,
      error: null,
      success: null,
      form: {
        request_type: 'MISSED_IN',
        expected_in: '08:30 AM',
        expected_out: '03:30 PM',
        reason: '',
        attachment_url: ''
      }
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModal.form.reason || requestModal.form.reason.trim().length < 15) {
      setRequestModal(prev => ({
        ...prev,
        error: 'Mandatory justification must be at least 15 characters long.'
      }));
      return;
    }

    setRequestModal(prev => ({ ...prev, submitting: true, error: null }));
    try {
      const schoolParam = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const res = await fetch('/api/admin/my-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolParam,
          academic_session: selectedSession,
          date: requestModal.date,
          request_type: requestModal.form.request_type,
          expected_in: requestModal.form.expected_in,
          expected_out: requestModal.form.expected_out,
          reason: requestModal.form.reason,
          attachment_url: requestModal.form.attachment_url
        })
      });

      const json = await res.json();
      if (json.success) {
        setRequestModal(prev => ({
          ...prev,
          submitting: false,
          success: 'Regularization request submitted to Principal.'
        }));
        if (showAdminToast) {
          showAdminToast(`Regularization petition submitted to Principal for ${requestModal.date}`);
        }
        setTimeout(() => {
          setRequestModal(prev => ({ ...prev, isOpen: false }));
          loadAttendance();
        }, 1200);
      } else {
        setRequestModal(prev => ({
          ...prev,
          submitting: false,
          error: json.error || 'Submission failed.'
        }));
      }
    } catch (err: any) {
      setRequestModal(prev => ({
        ...prev,
        submitting: false,
        error: 'Network error submitting request.'
      }));
    }
  };

  const todayPunch = data?.today_punch;
  const adminInfo = data?.admin || currentUser;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
              My Attendance &amp; Biometric Desk
            </h1>
          </div>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-1">
            Official daily biometric presence log for <strong>{adminInfo?.full_name || 'Administrator'}</strong> (Code: {adminInfo?.staff_code || 'ADM01'}) • Regularization petitions route directly to Principal Desk
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold text-[#122A24] focus:outline-hidden focus:border-[#10B981] shadow-2xs cursor-pointer"
            title="Select Month"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
          </select>

          <button
            type="button"
            onClick={loadAttendance}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            title="Refresh Attendance Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className="hidden md:flex px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#122A24] border border-emerald-200 rounded-xl text-xs font-bold transition items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Campus Attendance Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* TODAY'S LIVE ATTENDANCE PUNCH & LEAVE QUOTA DESK */}
      <div className="bg-[#122A24] text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border border-emerald-800/50">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Col 1: Live Clock & Shift Info (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                Live Campus Time (IST)
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {currentTime || '08:00:00 AM'}
              </span>
              <span className="text-xs text-emerald-200/80 font-mono">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-emerald-300 block uppercase">Admin Duty Shift</span>
                <span className="font-bold text-white">08:00 AM – 03:30 PM</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-300 block uppercase">Grace Threshold</span>
                <span className="font-bold text-amber-200">Up to 08:05 AM</span>
              </div>
            </div>
          </div>

          {/* Col 2: Punch Status & Actions (4 Cols) */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-200 uppercase font-bold flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>Today&apos;s Presence</span>
              </span>

              {todayPunch?.is_punched_in ? (
                todayPunch.is_late ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold">
                    LATE (+{todayPunch.late_minutes}m)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ON TIME
                  </span>
                )
              ) : todayPunch?.status === 'ON_LEAVE' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[10px] font-bold">
                  ON LEAVE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] font-bold">
                  NOT CLOCKED IN
                </span>
              )}
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between text-white/80">
                <span>Clock IN:</span>
                <span className="font-bold text-white">{todayPunch?.in_time || '--:--'}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Clock OUT:</span>
                <span className="font-bold text-white">{todayPunch?.out_time || '--:--'}</span>
              </div>
              {todayPunch?.working_hours && (
                <div className="flex justify-between text-emerald-300 font-bold pt-1 border-t border-white/10">
                  <span>Logged Duration:</span>
                  <span>{todayPunch.working_hours}</span>
                </div>
              )}
            </div>

            {/* Interactive Punch Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {!todayPunch?.is_punched_in ? (
                <button
                  type="button"
                  onClick={() => handlePunchAction('PUNCH_IN')}
                  disabled={punching}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#122A24] font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{punching ? 'Recording Punch...' : 'Clock In / Punch Attendance'}</span>
                </button>
              ) : !todayPunch?.is_punched_out ? (
                <button
                  type="button"
                  onClick={() => handlePunchAction('PUNCH_OUT')}
                  disabled={punching}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-[#122A24] font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{punching ? 'Recording Departure...' : 'Clock Out / Departure Punch'}</span>
                </button>
              ) : (
                <div className="w-full py-2 bg-white/10 text-emerald-200 text-center rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Shift Completed for Today</span>
                </div>
              )}
            </div>

            {punchFeedback && (
              <div
                className={`p-2 rounded-xl text-[11px] font-mono text-center font-bold ${
                  punchFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {punchFeedback.message}
              </div>
            )}
          </div>

          {/* Col 3: Leave Quota & Balance (3 Cols) */}
          <div className="lg:col-span-3 bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-300 uppercase font-bold flex items-center gap-1.5">
                <Palmtree className="w-4 h-4 text-emerald-400" />
                <span>Annual Leave Quota</span>
              </span>
              <span className="text-[10px] text-emerald-200/70 font-mono">Session {selectedSession}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-white/70 block uppercase">Leaves Taken</span>
                <span className="text-xl font-black font-mono text-amber-300">
                  {todayPunch?.leaves_taken ?? 0} <span className="text-xs text-white/60">Days</span>
                </span>
              </div>

              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] font-mono text-emerald-300 block uppercase">CL Balance</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {todayPunch?.leave_balance ?? 12} <span className="text-xs text-emerald-200/60">CL</span>
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-white/70">
                <span>Annual CBSE Allocation</span>
                <span className="font-bold text-white">{todayPunch?.total_quota ?? 12} Total CL</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (((todayPunch?.leave_balance ?? 12) / (todayPunch?.total_quota ?? 12)) * 100)
                      )
                    )}%`
                  }}
                />
              </div>
            </div>

            <div className="pt-1 text-[10px] font-mono text-emerald-300/70 text-center">
              Statutory casual &amp; administrative leave pool
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Recorded Days
            </span>
            <p className="text-xl font-black text-[#122A24] mt-1">{data.summary.total_working_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Present Days
            </span>
            <p className="text-xl font-black text-emerald-700 mt-1">{data.summary.present_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Absent / Missed
            </span>
            <p className="text-xl font-black text-rose-600 mt-1">{data.summary.absent_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Regularized by Principal
            </span>
            <p className="text-xl font-black text-amber-700 mt-1">{data.summary.regularized_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Punctuality Rate
            </span>
            <p className="text-xl font-black text-[#10B981] mt-1">{data.summary.punctuality_percent}%</p>
          </div>
        </div>
      )}

      {/* Main Ledger Table */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#DCE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#122A24]">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Biometric Clock In / Clock Out Journal — {selectedMonth}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Regularized
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Missed / Absent
            </span>
            <span>{data?.ledger ? `(${data.ledger.length} Days)` : ''}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
            Loading biometric attendance journal...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 font-mono text-xs">{error}</div>
        ) : !data?.ledger || data.ledger.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No biometric records logged for {selectedMonth}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[#2D5A4E] font-bold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Biometric IN</th>
                  <th className="py-3 px-4">Biometric OUT</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Regularization Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EBE5]">
                {data.ledger.map((row: any) => (
                  <tr key={row.date} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#122A24]">{row.date}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{row.day_of_week}</td>
                    <td className="py-3.5 px-4 font-mono">{row.in_time}</td>
                    <td className="py-3.5 px-4 font-mono">{row.out_time}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{row.working_hours}</td>
                    <td className="py-3.5 px-4">
                      {row.is_regularized ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg"
                          title={row.regularization_remark || 'Approved by Principal'}
                        >
                          <CheckCircle2 className="w-3 h-3 text-amber-600" />
                          Regularized by Principal
                        </span>
                      ) : row.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Present
                        </span>
                      ) : row.status === 'WEEKLY_OFF' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                          Sunday Off
                        </span>
                      ) : row.status === 'HOLIDAY' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                          Holiday ({row.holiday_name || 'Gazetted'})
                        </span>
                      ) : row.status === 'UPCOMING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg">
                          Upcoming
                        </span>
                      ) : row.status === 'ABSENT' || row.status === 'NOT_PUNCHED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          {row.status === 'NOT_PUNCHED' ? 'Not Punched' : 'Absent / Missed'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {row.existing_request ? (
                        <button
                          type="button"
                          onClick={() => setViewPetition(row.existing_request)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                            row.existing_request.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : row.existing_request.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          <Info className="w-3 h-3" />
                          Petition: {row.existing_request.status}
                        </button>
                      ) : row.can_raise_request ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRequestModal(row.date)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg font-bold text-[11px] shadow-xs transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Request Regularization
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missed Punch Regularization Petition Modal */}
      {requestModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !requestModal.submitting && setRequestModal(prev => ({ ...prev, isOpen: false }))}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#DCE8E0] p-6 sm:p-7 z-10 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2EBE5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#122A24]">
                    Missed Punch Regularization Petition
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Routes directly to Principal Dr. Abhishek Shukla
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-amber-800/80 uppercase font-mono block">Petition Date</span>
                  <span className="font-black text-amber-950 font-mono text-sm">{requestModal.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800/80 uppercase font-mono block">Applicant</span>
                  <span className="font-bold text-amber-950 text-xs">{adminInfo?.full_name || 'Administrator'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase mb-1">
                  Regularization Reason Type *
                </label>
                <select
                  value={requestModal.form.request_type}
                  onChange={(e) =>
                    setRequestModal(prev => ({
                      ...prev,
                      form: { ...prev.form, request_type: e.target.value as any }
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-[#DCE8E0] text-xs font-semibold bg-white text-[#122A24] focus:outline-hidden focus:border-[#10B981] shadow-2xs"
                >
                  <option value="MISSED_IN">Missed Clock-In Punch (Device / Connectivity Glitch)</option>
                  <option value="MISSED_OUT">Missed Clock-Out Punch (Premature Departure / Gate Busy)</option>
                  <option value="MISSED_BOTH">Missed Both Clock-In &amp; Clock-Out (Present On Campus)</option>
                  <option value="ON_DUTY_OFFSITE">Official Duty / External CBSE Assignment (OD)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase mb-1">
                    Expected In Time *
                  </label>
                  <input
                    type="text"
                    value={requestModal.form.expected_in}
                    onChange={(e) =>
                      setRequestModal(prev => ({
                        ...prev,
                        form: { ...prev.form, expected_in: e.target.value }
                      }))
                    }
                    placeholder="08:30 AM"
                    className="w-full p-2.5 rounded-xl border border-[#DCE8E0] text-xs font-mono font-bold bg-white text-[#122A24] focus:outline-hidden focus:border-[#10B981] shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase mb-1">
                    Expected Out Time *
                  </label>
                  <input
                    type="text"
                    value={requestModal.form.expected_out}
                    onChange={(e) =>
                      setRequestModal(prev => ({
                        ...prev,
                        form: { ...prev.form, expected_out: e.target.value }
                      }))
                    }
                    placeholder="03:30 PM"
                    className="w-full p-2.5 rounded-xl border border-[#DCE8E0] text-xs font-mono font-bold bg-white text-[#122A24] focus:outline-hidden focus:border-[#10B981] shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase">
                    Mandatory Justification for Principal *
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      requestModal.form.reason.trim().length >= 15 ? 'text-emerald-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {requestModal.form.reason.trim().length} / min 15 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={requestModal.form.reason}
                  onChange={(e) =>
                    setRequestModal(prev => ({
                      ...prev,
                      form: { ...prev.form, reason: e.target.value }
                    }))
                  }
                  placeholder="State clear operational reason (e.g. Conducted morning admission counseling; biometric terminal was offline due to power fluctuation)..."
                  className="w-full p-3 rounded-xl border border-[#DCE8E0] text-xs bg-white text-[#122A24] focus:outline-hidden focus:border-[#10B981] shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase mb-1">
                  Attachment / Proof URL (Optional)
                </label>
                <input
                  type="url"
                  value={requestModal.form.attachment_url}
                  onChange={(e) =>
                    setRequestModal(prev => ({
                      ...prev,
                      form: { ...prev.form, attachment_url: e.target.value }
                    }))
                  }
                  placeholder="https://... (duty slip, memo or photo link)"
                  className="w-full p-2.5 rounded-xl border border-[#DCE8E0] text-xs font-mono bg-white text-[#122A24] focus:outline-hidden focus:border-[#10B981] shadow-2xs"
                />
              </div>

              {requestModal.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-mono">
                  {requestModal.error}
                </div>
              )}

              {requestModal.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono font-bold">
                  {requestModal.success}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2EBE5]">
                <button
                  type="button"
                  disabled={requestModal.submitting}
                  onClick={() => setRequestModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestModal.submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{requestModal.submitting ? 'Submitting to Principal...' : 'Submit Petition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Existing Petition Modal */}
      {viewPetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setViewPetition(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DCE8E0] p-6 z-10 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2EBE5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#122A24]">
                    Petition Details
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Ref ID: {viewPetition.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewPetition(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-mono text-slate-500 text-[11px] uppercase">Executive Status:</span>
                <span
                  className={`font-mono font-bold px-2.5 py-0.5 rounded-lg border text-[11px] ${
                    viewPetition.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : viewPetition.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {viewPetition.status}
                </span>
              </div>

              <div>
                <span className="text-[10.5px] font-mono text-slate-500 uppercase block font-bold mb-0.5">
                  Type of Regularization:
                </span>
                <p className="font-semibold text-slate-800 font-mono">
                  {viewPetition.request_type || 'MISSED_IN'}
                </p>
              </div>

              <div>
                <span className="text-[10.5px] font-mono text-slate-500 uppercase block font-bold mb-0.5">
                  Your Reason / Justification:
                </span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  {viewPetition.reason || 'No statement provided.'}
                </p>
              </div>

              {viewPetition.principal_remarks && (
                <div>
                  <span className="text-[10.5px] font-mono text-amber-800 uppercase block font-bold mb-0.5">
                    Principal&apos;s Remarks:
                  </span>
                  <p className="text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs font-medium">
                    {viewPetition.principal_remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right border-t border-[#E2EBE5]">
              <button
                type="button"
                onClick={() => setViewPetition(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
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
