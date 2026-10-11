/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  FileCheck2,
  X
} from 'lucide-react';

export default function TeacherRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'BIOMETRIC' | 'STAFF_LEAVE'>('BIOMETRIC');

  // Staff Leave Modal
  const [leaveModal, setLeaveModal] = useState<{
    isOpen: boolean;
    submitting: boolean;
    error: string | null;
    success: string | null;
    form: {
      leave_type: string;
      start_date: string;
      end_date: string;
      days: number;
      reason: string;
      substitution_required: boolean;
    };
  }>({
    isOpen: false,
    submitting: false,
    error: null,
    success: null,
    form: {
      leave_type: 'Casual Leave',
      start_date: '',
      end_date: '',
      days: 1,
      reason: '',
      substitution_required: true
    }
  });

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/teacher/requests');
      if (!res.ok) throw new Error('Failed to load petitions');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to retrieve petitions');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveModal.form.start_date || !leaveModal.form.end_date) {
      setLeaveModal(prev => ({ ...prev, error: 'Start date and end date are required.' }));
      return;
    }
    if (!leaveModal.form.reason || leaveModal.form.reason.trim().length < 10) {
      setLeaveModal(prev => ({ ...prev, error: 'A justification reason of at least 10 characters is required.' }));
      return;
    }

    setLeaveModal(prev => ({ ...prev, submitting: true, error: null }));
    try {
      const res = await fetch('/api/teacher/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveModal.form)
      });
      const json = await res.json();
      if (json.success) {
        setLeaveModal(prev => ({
          ...prev,
          submitting: false,
          success: 'Staff leave petition submitted successfully for Principal approval.'
        }));
        setTimeout(() => {
          setLeaveModal(prev => ({ ...prev, isOpen: false }));
          loadRequests();
        }, 1200);
      } else {
        setLeaveModal(prev => ({ ...prev, submitting: false, error: json.error || 'Submission failed' }));
      }
    } catch {
      setLeaveModal(prev => ({ ...prev, submitting: false, error: 'Network error submitting leave' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            Faculty Petitions &amp; Leave Desk
          </h1>
          <p className="text-xs text-[#2D5A4E]/80 font-mono mt-0.5">
            Missed punch regularizations and staff leave applications to Principal Directorate
          </p>
        </div>

        <button
          onClick={() => setLeaveModal({
            isOpen: true,
            submitting: false,
            error: null,
            success: null,
            form: {
              leave_type: 'Casual Leave',
              start_date: '',
              end_date: '',
              days: 1,
              reason: '',
              substitution_required: true
            }
          })}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DCE8E0] pb-2">
        <button
          onClick={() => setActiveTab('BIOMETRIC')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'BIOMETRIC'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'text-[#2D5A4E] hover:bg-[#E2EBE5]'
          }`}
        >
          Biometric Regularizations ({data?.biometric_requests?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('STAFF_LEAVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'STAFF_LEAVE'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'text-[#2D5A4E] hover:bg-[#E2EBE5]'
          }`}
        >
          Staff Leave Petitions ({data?.leave_requests?.length || 0})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading faculty petitions...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 font-mono text-xs">{error}</div>
      ) : activeTab === 'BIOMETRIC' ? (
        /* Biometric Regularization List */
        <div className="space-y-3">
          {!data?.biometric_requests || data.biometric_requests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#DCE8E0] text-slate-400 font-mono text-xs">
              No biometric regularization requests filed.
            </div>
          ) : (
            data.biometric_requests.map((r: any) => (
              <div
                key={r.id}
                className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#122A24]">{r.date}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-bold">
                      {r.request_type}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border font-mono ${
                    r.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : r.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-[#F8FAF9] p-3 rounded-2xl border border-[#E2EBE5] space-y-1">
                  <p><strong>Reason:</strong> {r.reason}</p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Expected: IN {r.expected_in || '--'} • OUT {r.expected_out || '--'}
                  </p>
                  {r.principal_remarks && (
                    <p className="text-emerald-800 pt-1 border-t border-[#E2EBE5]">
                      <strong>Principal Remark:</strong> {r.principal_remarks}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Ref: {r.id}</span>
                  <span>Filed: {r.created_at?.split('T')[0]}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Staff Leave List */
        <div className="space-y-3">
          {!data?.leave_requests || data.leave_requests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#DCE8E0] text-slate-400 font-mono text-xs">
              No staff leave petitions filed.
            </div>
          ) : (
            data.leave_requests.map((r: any) => (
              <div
                key={r.id}
                className="p-5 bg-white rounded-3xl border border-[#DCE8E0] shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#122A24]">{r.details?.leave_type || 'Casual Leave'}</span>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg font-bold border border-emerald-200">
                      {r.details?.days || 1} Days ({r.details?.start_date} to {r.details?.end_date})
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border font-mono ${
                    r.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : r.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-[#F8FAF9] p-3 rounded-2xl border border-[#E2EBE5] space-y-1">
                  <p><strong>Reason:</strong> {r.details?.reason || r.remarks || 'Personal'}</p>
                  {r.remarks && (
                    <p className="text-emerald-800 pt-1 border-t border-[#E2EBE5]">
                      <strong>Principal Remark:</strong> {r.remarks}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Ref: {r.id}</span>
                  <span>Requested: {r.requested_at?.split('T')[0]}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Staff Leave Application Modal */}
      {leaveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setLeaveModal(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE8E0] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[#122A24]">
                  Apply for Faculty Leave
                </h3>
              </div>
              <button
                onClick={() => setLeaveModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-xl text-slate-400 hover:text-[#122A24] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-600 font-mono mb-1 font-bold">Leave Type</label>
                <select
                  value={leaveModal.form.leave_type}
                  onChange={(e) => setLeaveModal({
                    ...leaveModal,
                    form: { ...leaveModal.form, leave_type: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24]"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Medical Leave">Medical Leave (ML)</option>
                  <option value="Earned Leave">Earned Leave (EL)</option>
                  <option value="Duty Leave">On-Duty Official Deputation (OD)</option>
                  <option value="Unpaid Leave">Leave Without Pay (LWP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">From Date</label>
                  <input
                    type="date"
                    value={leaveModal.form.start_date}
                    onChange={(e) => setLeaveModal({
                      ...leaveModal,
                      form: { ...leaveModal.form, start_date: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-mono text-[#122A24]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-mono mb-1 font-bold">To Date</label>
                  <input
                    type="date"
                    value={leaveModal.form.end_date}
                    onChange={(e) => setLeaveModal({
                      ...leaveModal,
                      form: { ...leaveModal.form, end_date: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] font-mono text-[#122A24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-mono mb-1 font-bold">Total Days Count</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={leaveModal.form.days}
                  onChange={(e) => setLeaveModal({
                    ...leaveModal,
                    form: { ...leaveModal.form, days: Number(e.target.value) || 1 }
                  })}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-mono font-bold text-[#122A24]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-mono mb-1 font-bold">
                  Reason / Justification <span className="text-rose-500">* (Min 10 characters)</span>
                </label>
                <textarea
                  rows={3}
                  value={leaveModal.form.reason}
                  onChange={(e) => setLeaveModal({
                    ...leaveModal,
                    form: { ...leaveModal.form, reason: e.target.value }
                  })}
                  placeholder="e.g. Family medical emergency / Personal unavoidable travel."
                  className="w-full p-3 rounded-xl bg-white border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-hidden focus:border-[#10B981]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sub_req"
                  checked={leaveModal.form.substitution_required}
                  onChange={(e) => setLeaveModal({
                    ...leaveModal,
                    form: { ...leaveModal.form, substitution_required: e.target.checked }
                  })}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="sub_req" className="text-xs text-slate-700 font-medium">
                  Require timetable substitution during this leave period
                </label>
              </div>

              {leaveModal.error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {leaveModal.error}
                </div>
              )}

              {leaveModal.success && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                  {leaveModal.success}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE8E0]">
                <button
                  type="button"
                  onClick={() => setLeaveModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaveModal.submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {leaveModal.submitting ? 'Submitting Leave...' : 'Submit to Principal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
