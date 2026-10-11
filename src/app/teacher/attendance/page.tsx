/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  Send,
  X,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  Fingerprint,
  LogIn,
  LogOut,
  Palmtree,
  Sparkles
} from 'lucide-react';
import { BiometricMissedType } from '@/lib/types';

export default function TeacherAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [punching, setPunching] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Missed Punch Regularization Modal State
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    date: string;
    submitting: boolean;
    error: string | null;
    success: string | null;
    form: {
      request_type: BiometricMissedType;
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

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/teacher/attendance?month=${selectedMonth}`);
      if (!res.ok) throw new Error('Failed to load biometric records');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to load attendance');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handlePunchAction = async (action: 'PUNCH_IN' | 'PUNCH_OUT') => {
    try {
      setPunching(true);
      setPunchFeedback(null);
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) {
        setPunchFeedback({
          type: 'success',
          message: json.message || (action === 'PUNCH_IN' ? 'Successfully Clocked In!' : 'Successfully Clocked Out!')
        });
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
      setRequestModal(prev => ({ ...prev, error: 'Mandatory justification must be at least 15 characters long.' }));
      return;
    }

    setRequestModal(prev => ({ ...prev, submitting: true, error: null }));
    try {
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        setTimeout(() => {
          setRequestModal(prev => ({ ...prev, isOpen: false }));
          loadAttendance();
        }, 1200);
      } else {
        setRequestModal(prev => ({ ...prev, submitting: false, error: json.error || 'Submission failed.' }));
      }
    } catch (err: any) {
      setRequestModal(prev => ({ ...prev, submitting: false, error: 'Network error submitting request.' }));
    }
  };

  const todayPunch = data?.today_punch;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            My Biometric Attendance &amp; Self-Punch Desk
          </h1>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-0.5">
            Instant synchronization with Principal Desk • Normal reporting 08:00 AM (Grace till 08:05 AM)
          </p>
        </div>

        {/* Month Selector & Requests Link */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-mono font-bold text-[#122A24] focus:outline-hidden focus:border-[#10B981] shadow-xs cursor-pointer"
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
          </select>

          <Link
            href="/teacher/requests"
            className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-xs"
          >
            <span>My Petitions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
                <span className="text-[10px] text-emerald-300 block uppercase">Reporting Shift</span>
                <span className="font-bold text-white">08:00 AM – 02:30 PM</span>
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
                <span>Today&apos;s Biometric Status</span>
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
                  NOT PUNCHED YET
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
                  onClick={() => handlePunchAction('PUNCH_IN')}
                  disabled={punching}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#122A24] font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{punching ? 'Recording Punch...' : 'Clock In / Punch Attendance'}</span>
                </button>
              ) : !todayPunch?.is_punched_out ? (
                <button
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
              <div className={`p-2 rounded-xl text-[11px] font-mono text-center font-bold ${
                punchFeedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {punchFeedback.message}
              </div>
            )}
          </div>

          {/* Col 3: Leave Quota & Balance (3 Cols - "kiski kitni leave hai") */}
          <div className="lg:col-span-3 bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-300 uppercase font-bold flex items-center gap-1.5">
                <Palmtree className="w-4 h-4 text-emerald-400" />
                <span>My Leave Ledger</span>
              </span>
              <span className="text-[10px] text-emerald-200/70 font-mono">Session 2026-27</span>
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
                <span>Annual CBSE Quota</span>
                <span className="font-bold text-white">{todayPunch?.total_quota ?? 12} Total CL</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (((todayPunch?.leave_balance ?? 12) / (todayPunch?.total_quota ?? 12)) * 100)))}%`
                  }}
                />
              </div>
            </div>

            <Link
              href="/teacher/requests"
              className="text-[11px] text-emerald-300 hover:text-emerald-100 font-mono font-bold flex items-center justify-center gap-1 pt-1"
            >
              <span>Apply for Leave</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Recorded Days</span>
            <p className="text-xl font-black text-[#122A24] mt-1">{data.summary.total_working_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Present Days</span>
            <p className="text-xl font-black text-emerald-700 mt-1">{data.summary.present_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Absent Days</span>
            <p className="text-xl font-black text-rose-600 mt-1">{data.summary.absent_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Regularized</span>
            <p className="text-xl font-black text-amber-700 mt-1">{data.summary.regularized_days}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Punctuality Rate</span>
            <p className="text-xl font-black text-[#10B981] mt-1">{data.summary.punctuality_percent}%</p>
          </div>
        </div>
      )}

      {/* Main Ledger Table */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#DCE8E0] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#122A24]">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Biometric Clock In / Clock Out Journal</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {data?.ledger ? `${data.ledger.length} Daily Records` : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
            Loading unified staff attendance records...
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
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3 h-3 text-amber-600" />
                          Regularized by Principal
                        </span>
                      ) : row.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Present
                        </span>
                      ) : row.status === 'ABSENT' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Absent / Missed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {row.existing_request ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border ${
                          row.existing_request.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : row.existing_request.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          Petition: {row.existing_request.status}
                        </span>
                      ) : row.can_raise_request ? (
                        <button
                          onClick={() => handleOpenRequestModal(row.date)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition cursor-pointer"
                        >
                          Raise Request
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

      {/* Missed Punch Regularization Modal */}
      {requestModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setRequestModal(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE8E0] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#122A24]">
                  Missed Biometric Regularization Petition
                </h3>
              </div>
              <button
                onClick={() => setRequestModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-xl text-slate-400 hover:text-[#122A24] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">Target Date</label>
                  <input
                    type="text"
                    readOnly
                    value={requestModal.date}
                    className="w-full p-2.5 rounded-xl bg-[#F8FAF9] border border-[#DCE8E0] font-mono font-bold text-[#122A24]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">Regularization Type</label>
                  <select
                    value={requestModal.form.request_type}
                    onChange={(e) => setRequestModal({
                      ...requestModal,
                      form: { ...requestModal.form, request_type: e.target.value as BiometricMissedType }
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-semibold text-[#122A24] cursor-pointer"
                  >
                    <option value="MISSED_IN">Missed Clock IN</option>
                    <option value="MISSED_OUT">Missed Clock OUT</option>
                    <option value="MISSED_BOTH">Missed Both IN &amp; OUT</option>
                    <option value="MACHINE_ERROR">Biometric Machine Not Working</option>
                    <option value="OTHER">Other Administrative Reason</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">Expected IN Time</label>
                  <input
                    type="text"
                    value={requestModal.form.expected_in}
                    onChange={(e) => setRequestModal({
                      ...requestModal,
                      form: { ...requestModal.form, expected_in: e.target.value }
                    })}
                    placeholder="e.g. 08:20 AM"
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-mono text-[#122A24]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">Expected OUT Time</label>
                  <input
                    type="text"
                    value={requestModal.form.expected_out}
                    onChange={(e) => setRequestModal({
                      ...requestModal,
                      form: { ...requestModal.form, expected_out: e.target.value }
                    })}
                    placeholder="e.g. 03:30 PM"
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-mono text-[#122A24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-mono mb-1 font-bold">
                  Justification Reason <span className="text-rose-500">* (Min 15 characters)</span>
                </label>
                <textarea
                  rows={3}
                  value={requestModal.form.reason}
                  onChange={(e) => setRequestModal({
                    ...requestModal,
                    form: { ...requestModal.form, reason: e.target.value }
                  })}
                  placeholder="e.g. Device sensor was unresponsive during morning assembly duty."
                  className="w-full p-3 rounded-xl bg-white border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-hidden focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-mono mb-1">
                  Optional Attachment URL / Verification Link
                </label>
                <input
                  type="text"
                  value={requestModal.form.attachment_url || ''}
                  onChange={(e) => setRequestModal({
                    ...requestModal,
                    form: { ...requestModal.form, attachment_url: e.target.value }
                  })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-mono"
                />
              </div>

              {requestModal.error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {requestModal.error}
                </div>
              )}

              {requestModal.success && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                  {requestModal.success}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE8E0]">
                <button
                  type="button"
                  onClick={() => setRequestModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestModal.submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {requestModal.submitting ? 'Submitting Petition...' : 'Submit to Principal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
