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
  ArrowRight
} from 'lucide-react';
import { BiometricMissedType } from '@/lib/types';

export default function TeacherAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            My Biometric Attendance Ledger
          </h1>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-0.5">
            Synchronized directly with central institutional biometric machines • Read-Only
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
