/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckSquare,
  FileCheck,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  Filter,
  Search,
  Check,
  X,
  MessageSquare,
  User,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { PrincipalApprovalRequest, PrincipalApprovalType, PrincipalApprovalStatus } from '@/lib/types';

export default function PrincipalApprovalsPage() {
  const [requests, setRequests] = useState<PrincipalApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab: 4 Categories
  const [activeTab, setActiveTab] = useState<PrincipalApprovalType>('CERTIFICATE_TC');
  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modal State (Approve / Reject)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    request: PrincipalApprovalRequest | null;
    action: 'APPROVE' | 'REJECT';
  }>({
    isOpen: false,
    request: null,
    action: 'APPROVE'
  });
  const [mandatoryRemark, setMandatoryRemark] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Audit History Modal State
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    request: PrincipalApprovalRequest | null;
  }>({
    isOpen: false,
    request: null
  });

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/principal/approvals');
      if (!res.ok) throw new Error('Failed to load approvals');
      const json = await res.json();
      if (json.success && Array.isArray(json.requests)) {
        setRequests(json.requests);
      }
    } catch (err: any) {
      console.error('Fetch approvals error:', err);
      setError(err.message || 'Unable to load approvals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Tab definitions (4 statutory categories)
  const tabs: Array<{ id: PrincipalApprovalType; label: string; icon: any }> = [
    { id: 'CERTIFICATE_TC', label: 'TC / Character Certificate', icon: FileCheck },
    { id: 'BIOMETRIC_REGULARIZATION', label: 'Biometric Regularization', icon: Clock },
    { id: 'STAFF_LEAVE', label: 'Staff Leave Applications', icon: Calendar },
    { id: 'FEE_CONCESSION', label: 'Fee Concession / Waiver', icon: DollarSign }
  ];

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      CERTIFICATE_TC: requests.filter(r => r.type === 'CERTIFICATE_TC' && r.status === 'PENDING').length,
      BIOMETRIC_REGULARIZATION: requests.filter(r => r.type === 'BIOMETRIC_REGULARIZATION' && r.status === 'PENDING').length,
      STAFF_LEAVE: requests.filter(r => r.type === 'STAFF_LEAVE' && r.status === 'PENDING').length,
      FEE_CONCESSION: requests.filter(r => r.type === 'FEE_CONCESSION' && r.status === 'PENDING').length,
    };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (r.type !== activeTab) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (r.title || '').toLowerCase().includes(q);
        const matchReqBy = (r.requested_by?.name || '').toLowerCase().includes(q);
        const matchStudent = (r.details?.student_name || '').toLowerCase().includes(q);
        const matchStaff = (r.details?.staff_name || '').toLowerCase().includes(q);
        const matchAdm = (r.details?.admission_no || '').toLowerCase().includes(q);
        if (!matchTitle && !matchReqBy && !matchStudent && !matchStaff && !matchAdm) return false;
      }
      return true;
    });
  }, [requests, activeTab, statusFilter, searchQuery]);

  // Handle Action Submit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.request) return;

    if (!mandatoryRemark.trim()) {
      setActionError('Decision remark is strictly mandatory under CBSE audit compliance.');
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError('');

      const res = await fetch('/api/principal/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: actionModal.request.id,
          action: actionModal.action,
          remarks: mandatoryRemark.trim(),
          school_id: actionModal.request.school_id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update local list
        setRequests(prev => prev.map(r => r.id === actionModal.request!.id ? data.request : r));
        setActionModal({ isOpen: false, request: null, action: 'APPROVE' });
        setMandatoryRemark('');
        // Refresh sidebar badge
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('principal:refresh'));
        }
      } else {
        setActionError(data.error || 'Failed to action approval.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error while actioning approval.');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & SUMMARY WITH SIGNATURE WATERMARK TYPOGRAPHY
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 sm:p-8 relative overflow-hidden">
        {/* Signature watermark typography */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[210px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
          >
            Approvals
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
          >
            Statutory
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F2EC] text-[#122A24] text-xs font-semibold mb-2 border border-[#DCE8E0]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mandatory CBSE Oversight &amp; Authorizations</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#122A24] tracking-tight">
              Principal Authorizations &amp; Petitions
            </h1>
            <p className="text-xs sm:text-sm text-[#2D5A4E] mt-1 max-w-2xl leading-relaxed">
              Single authority oversight: approve or reject statutory petitions with mandatory CBSE audit remarks and digital signature verification.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3.5 py-2 rounded-2xl border border-amber-300 shadow-2xs">
              Pending Action: {Object.values(tabCounts).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TAB NAVIGATION
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#E9F2EC] p-1.5 rounded-2xl border border-[#DCE8E0]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const pending = tabCounts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setStatusFilter('ALL');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs transition-all cursor-pointer ${
                active
                  ? 'bg-[#122A24] text-white shadow-sm font-bold'
                  : 'text-[#2D5A4E] hover:bg-white/60 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-[#2D5A4E]'}`} />
              <span className="truncate">{tab.label}</span>
              {pending > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  active ? 'bg-amber-400 text-[#122A24]' : 'bg-amber-200 text-amber-900'
                }`}>
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FILTERS & SEARCH BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DCE8E0]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#122A24] text-white'
                  : 'bg-[#F4F8F5] text-[#2D5A4E] hover:bg-[#EBF5EF]'
              }`}
            >
              {st === 'ALL' ? 'All Petitions' : st}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#2D5A4E]/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, staff, adm no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs focus:outline-hidden focus:border-[#10B981] text-[#122A24]"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. PETITIONS LIST
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-[#DCE8E0] animate-pulse" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#DCE8E0] text-center max-w-md mx-auto my-6">
          <CheckSquare className="w-12 h-12 text-[#2D5A4E]/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#122A24]">No petitions found in this queue</h3>
          <p className="text-xs text-[#2D5A4E] mt-1">
            {statusFilter === 'PENDING'
              ? 'All requests of this type have been reviewed and actioned.'
              : 'Try clearing the search query or changing the filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isRejected = req.status === 'REJECTED';

            return (
              <div
                key={req.id}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] hover:border-[#10B981] transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Request Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#2D5A4E] bg-[#F4F8F5] px-2 py-0.5 rounded border border-[#DCE8E0]">
                      {req.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-[11px] text-[#2D5A4E]/80 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2D5A4E]/60" />
                      <span>{new Date(req.requested_at).toLocaleDateString('en-GB')}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#122A24] tracking-tight">
                    {req.title}
                  </h3>

                  {/* Detailed Spec by Tab Type */}
                  <div className="text-xs text-[#2D5A4E] bg-[#F8FAF9] p-3 rounded-2xl border border-[#E2EBE5] space-y-1">
                    {req.type === 'CERTIFICATE_TC' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong>Scholar:</strong> {req.details.student_name} ({req.details.admission_no})
                        </div>
                        <div>
                          <strong>Class:</strong> {req.details.class_name} - {req.details.section}
                        </div>
                        <div>
                          <strong>Type:</strong> {req.details.certificate_type || 'Transfer Certificate'}
                        </div>
                        <div>
                          <strong>Reason:</strong> {req.details.reason || 'Relocation / Family Transfer'}
                        </div>
                        {req.details.serial_no && (
                          <div className="sm:col-span-2 text-emerald-700 font-mono font-bold">
                            Official Serial Counter: {req.details.serial_no}
                          </div>
                        )}
                      </div>
                    )}

                    {req.type === 'BIOMETRIC_REGULARIZATION' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong>Faculty:</strong> {req.details.teacher_name || req.requested_by.name} ({req.details.teacher_code || req.requested_by.id})
                        </div>
                        <div>
                          <strong>Missed Punch Date:</strong> {req.details.date || req.details.punch_date}
                        </div>
                        <div>
                          <strong>Regularization Type:</strong> {req.details.regularization_type || 'MISSED_IN'}
                        </div>
                        <div>
                          <strong>Expected Times:</strong> IN: {req.details.expected_in || '08:30 AM'} | OUT: {req.details.expected_out || '03:30 PM'}
                        </div>
                        <div className="sm:col-span-2">
                          <strong>Reason:</strong> {req.details.reason}
                        </div>
                        {req.details.attachment_url && (
                          <div className="sm:col-span-2">
                            <strong>Attachment:</strong>{' '}
                            <a href={req.details.attachment_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-mono">
                              View Supporting Document
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {req.type === 'FEE_CONCESSION' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong>Scholar:</strong> {req.details.student_name} ({req.details.admission_no})
                        </div>
                        <div>
                          <strong>Class:</strong> {req.details.class_name} - {req.details.section}
                        </div>
                        <div>
                          <strong>Concession:</strong> {req.details.concession_type}
                        </div>
                        <div className="text-emerald-700 font-bold">
                          <strong>Amount Requested:</strong> ₹{((Number(req.details.amount_paise) || 0) / 100).toLocaleString('en-IN')}
                        </div>
                        <div className="sm:col-span-2">
                          <strong>Grounds / Reason:</strong> {req.details.reason || 'Family Economic Hardship / Sibling Rule'}
                        </div>
                      </div>
                    )}

                    {req.type === 'STAFF_LEAVE' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong>Faculty:</strong> {req.details.staff_name} ({req.details.staff_code})
                        </div>
                        <div>
                          <strong>Department:</strong> {req.details.department} ({req.details.designation})
                        </div>
                        <div>
                          <strong>Leave Category:</strong> {req.details.leave_type}
                        </div>
                        <div>
                          <strong>Duration:</strong> {req.details.days} Days ({req.details.start_date} to {req.details.end_date})
                        </div>
                        <div className="sm:col-span-2">
                          <strong>Reason:</strong> {req.details.reason}
                        </div>
                      </div>
                    )}

                    {req.type === 'ADMISSION' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong>Applicant:</strong> {req.details.applicant_name}
                        </div>
                        <div>
                          <strong>Applied Class:</strong> {req.details.applied_class}
                        </div>
                        <div>
                          <strong>Guardian:</strong> {req.details.father_name || req.details.mother_name} ({req.details.mobile})
                        </div>
                        <div>
                          <strong>Previous School:</strong> {req.details.previous_school || 'N/A'}
                        </div>
                        <div className="sm:col-span-2">
                          <strong>Status / Notes:</strong> {req.details.admission_fee_status || 'Documentation verified by Front Office'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Requester & Remark Summary */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#2D5A4E]">
                    <span className="flex items-center gap-1 font-mono">
                      <User className="w-3.5 h-3.5 text-[#2D5A4E]/60" />
                      <span>Requested by: <strong>{req.requested_by.name}</strong> ({req.requested_by.role})</span>
                    </span>

                    {req.remarks && (
                      <span className="text-[#122A24] font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-amber-600" />
                        <span>Principal Remark: "{req.remarks}"</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions & History Trigger */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#DCE8E0]">
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActionModal({ isOpen: true, request: req, action: 'APPROVE' });
                          setMandatoryRemark('');
                          setActionError('');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setActionModal({ isOpen: true, request: req, action: 'REJECT' });
                          setMandatoryRemark('');
                          setActionError('');
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-[11px] font-mono text-[#2D5A4E]">
                        Actioned by {req.actioned_by?.name || 'Principal'}
                      </div>
                      <div className="text-[10px] text-[#2D5A4E]/70 font-mono">
                        {req.actioned_at ? new Date(req.actioned_at).toLocaleString('en-GB') : ''}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setHistoryModal({ isOpen: true, request: req })}
                    className="text-xs font-semibold text-[#2D5A4E] hover:text-[#122A24] flex items-center gap-1 underline underline-offset-4 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Trail</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MANDATORY DECISION MODAL (APPROVE / REJECT)
          ───────────────────────────────────────────────────────────── */}
      {actionModal.isOpen && actionModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setActionModal({ isOpen: false, request: null, action: 'APPROVE' })}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE8E0] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                {actionModal.action === 'APPROVE' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-[#122A24]">
                    {actionModal.action === 'APPROVE' ? 'Approve Statutory Petition' : 'Reject Petition'}
                  </h3>
                  <div className="text-[11px] font-mono text-[#2D5A4E]">
                    Ref: {actionModal.request.id}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActionModal({ isOpen: false, request: null, action: 'APPROVE' })}
                className="p-1 rounded-lg text-[#2D5A4E] hover:bg-[#F4F8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#2D5A4E] bg-[#F4F8F5] p-3.5 rounded-2xl border border-[#DCE8E0]">
              <div className="font-bold text-[#122A24] mb-1">
                {actionModal.request.title}
              </div>
              <div>Applicant: {actionModal.request.requested_by.name} ({actionModal.request.requested_by.role})</div>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#122A24] mb-1">
                  Mandatory Decision Remark / Audit Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={mandatoryRemark}
                  onChange={(e) => setMandatoryRemark(e.target.value)}
                  placeholder={
                    actionModal.action === 'APPROVE'
                      ? 'e.g. Approved per CBSE examination guidelines / academic performance.'
                      : 'e.g. Ineligible: Attendance requirement below statutory 75% threshold.'
                  }
                  className="w-full p-3 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-hidden focus:border-[#10B981]"
                />
                <span className="text-[11px] text-[#2D5A4E]/80 font-mono block mt-1">
                  This justification will be permanently sealed in the institutional security audit log.
                </span>
              </div>

              {actionError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE8E0]">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, request: null, action: 'APPROVE' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2D5A4E] hover:bg-[#F4F8F5] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-50 ${
                    actionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionSubmitting ? 'Recording Decision...' : `Confirm ${actionModal.action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. AUDIT TRAIL / HISTORY DRAWER
          ───────────────────────────────────────────────────────────── */}
      {historyModal.isOpen && historyModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setHistoryModal({ isOpen: false, request: null })}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE8E0] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[#122A24]">
                  Statutory Audit Log &amp; Lifecycle History
                </h3>
              </div>
              <button
                onClick={() => setHistoryModal({ isOpen: false, request: null })}
                className="p-1 rounded-lg text-[#2D5A4E] hover:bg-[#F4F8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#2D5A4E]">
              <strong>Petition:</strong> {historyModal.request.title} ({historyModal.request.id})
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {historyModal.request.history && historyModal.request.history.length > 0 ? (
                historyModal.request.history.map((h, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5] text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-[#122A24]">
                        {h.action} by {h.by} ({h.role})
                      </span>
                      <span className="text-[#2D5A4E]/80 text-[11px]">
                        {new Date(h.date).toLocaleString('en-GB')}
                      </span>
                    </div>
                    {h.remarks && (
                      <div className="text-[#2D5A4E] italic bg-white p-2 rounded-xl border border-[#DCE8E0] mt-1">
                        "{h.remarks}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#2D5A4E] text-center p-4">
                  No chronological history entries recorded.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#DCE8E0] text-right">
              <button
                onClick={() => setHistoryModal({ isOpen: false, request: null })}
                className="px-4 py-2 rounded-xl bg-[#122A24] text-white text-xs font-semibold hover:bg-[#1C443A] cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
