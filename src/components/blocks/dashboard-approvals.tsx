'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileText,
  Check,
  X,
  Filter,
  Users,
  AlertCircle,
  Upload,
  UserCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Teacher, School } from '@/lib/types';

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name: string;
  designation: string;
  department: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  attachment_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  applied_at: string;
}

export interface SubstitutionItem {
  id: string;
  absent_teacher: string;
  class_subject: string;
  period_time: string;
  substitute_teacher: string;
}

export interface DashboardApprovalsProps {
  selectedSchool?: School | null;
  teachers?: Teacher[];
  selectedSession?: string;
  isSuperAdmin?: boolean;
}

export function DashboardApprovals({
  selectedSchool,
  teachers = [],
  selectedSession = '2026-27'
}: DashboardApprovalsProps) {
  // Leave Applications State
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([
    {
      id: 'LV-2026-001',
      employee_id: teachers[0]?.id || 'EMP-01',
      employee_name: teachers[0]?.full_name || 'Dr. Rajesh Sharma',
      designation: teachers[0]?.designation || 'Senior Faculty',
      department: teachers[0]?.department || 'Mathematics',
      leave_type: 'Casual Leave (CL)',
      start_date: '2026-09-02',
      end_date: '2026-09-03',
      days: 2,
      reason: 'Attending National CBSE Pedagogy Conference in New Delhi.',
      status: 'PENDING',
      applied_at: '2026-08-30'
    }
  ]);

  // Form State
  const [applicantId, setApplicantId] = useState<string>(teachers[0]?.id || '');
  const [leaveType, setLeaveType] = useState<string>('Casual Leave (CL) — Paid');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Auto-set first teacher if empty
  React.useEffect(() => {
    if (teachers.length > 0 && !applicantId) {
      setApplicantId(teachers[0].id);
    }
  }, [teachers, applicantId]);

  // Derived Stats
  const pendingCount = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'PENDING').length;
  }, [leaveApplications]);

  const approvedLeaves = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'APPROVED');
  }, [leaveApplications]);

  const casualDaysUsed = useMemo(() => {
    return approvedLeaves
      .filter(l => l.leave_type.includes('Casual'))
      .reduce((acc, l) => acc + l.days, 0);
  }, [approvedLeaves]);

  const medicalDaysUsed = useMemo(() => {
    return approvedLeaves
      .filter(l => l.leave_type.includes('Medical'))
      .reduce((acc, l) => acc + l.days, 0);
  }, [approvedLeaves]);

  const halfDaysCount = useMemo(() => {
    return approvedLeaves
      .filter(l => l.leave_type.includes('Half'))
      .reduce((acc, l) => acc + l.days, 0);
  }, [approvedLeaves]);

  // Today's On-Leave Faculty
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOnLeaveFaculty = useMemo(() => {
    return approvedLeaves.filter(l => todayStr >= l.start_date && todayStr <= l.end_date);
  }, [approvedLeaves, todayStr]);

  // Form Submit Handler
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a brief reason for the leave application.');
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === applicantId) || teachers[0];
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const diffTime = Math.max(0, eDate.getTime() - sDate.getTime());
    const computedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newApp: LeaveApplication = {
      id: `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
      employee_id: selectedTeacher?.id || 'EMP-101',
      employee_name: selectedTeacher?.full_name || 'Staff Member',
      designation: selectedTeacher?.designation || 'Faculty',
      department: selectedTeacher?.department || 'Academics',
      leave_type: leaveType.split('—')[0].trim(),
      start_date: startDate,
      end_date: endDate,
      days: leaveType.includes('Half') ? 0.5 : computedDays,
      reason: reason.trim(),
      attachment_name: fileName || undefined,
      status: 'PENDING',
      applied_at: new Date().toISOString().split('T')[0]
    };

    setLeaveApplications(prev => [newApp, ...prev]);
    setReason('');
    setFileName('');
    setSuccessMsg('Leave application submitted successfully for management approval!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setLeaveApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          TOP BANNER: EMPLOYEE LEAVE & APPROVALS STUDIO
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-8 bg-[#122A24] text-white border border-[#1C443A] shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-48 h-48 rounded-full bg-[#34D399]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 font-mono text-xs font-semibold border border-white/10">
              <span>Staff Self-Service Leave Portal • Auto-Attendance Sync</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
              Employee Leave &amp; Approvals Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Apply for Casual Leave (CL), Medical Leave (ML) or Half Days. Approved leaves automatically update employee attendance records and compute Loss of Pay (LOP) deductions for monthly payroll.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shrink-0">
            <span className="text-xs font-mono font-bold text-emerald-300">Session {selectedSession}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: 4 SUMMARY KPI STAT CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 min-w-0">
        
        {/* Card 1: Casual Leave */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            01
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              CASUAL LEAVE (CL)
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#122A24] mt-1.5 flex items-baseline gap-1.5">
              <span>{casualDaysUsed} / 12</span>
              <span className="text-xs font-mono font-normal text-slate-400">Days Used</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-emerald-700">
            ✓ 100% Paid Leave Quota
          </div>
        </div>

        {/* Card 2: Medical Leave */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            02
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              MEDICAL LEAVE (ML)
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#122A24] mt-1.5 flex items-baseline gap-1.5">
              <span>{medicalDaysUsed} / 10</span>
              <span className="text-xs font-mono font-normal text-slate-400">Days Used</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Requires Medical Certificate
          </div>
        </div>

        {/* Card 3: Half Days */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            03
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              HALF DAYS
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#122A24] mt-1.5 flex items-baseline gap-1.5">
              <span>{halfDaysCount}</span>
              <span className="text-xs font-mono font-normal text-slate-400">Taken</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            0.5 Day deduction per application
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            04
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              PENDING APPROVALS
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-amber-700 mt-1.5 flex items-baseline gap-1.5">
              <span>{pendingCount}</span>
              <span className="text-xs font-mono font-normal text-slate-400">Applications</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-amber-700 font-semibold">
            Requires Management Review
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: FACULTY MEMBERS ON LEAVE TODAY & AUTOMATIC SUBSTITUTION ROSTER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8F0EA]">
          <div>
            <h2 className="font-display font-bold text-base text-[#122A24]">
              Faculty Members On Leave Today &amp; Automatic Substitution Roster
            </h2>
            <p className="text-xs text-[#2D5A4E]">
              Live roster of teachers on leave/half-day today and auto-arranged substitution classes for affected periods.
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-semibold self-start sm:self-auto shrink-0">
            Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Today's On-Leave Faculty (4 Cols) */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              TODAY'S ON-LEAVE FACULTY
            </span>

            {todayOnLeaveFaculty.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All Faculty Members Present Today!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {todayOnLeaveFaculty.map(l => (
                  <div key={l.id} className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-mono">
                    <div className="font-bold text-[#122A24]">{l.employee_name}</div>
                    <div className="text-amber-800 text-[11px]">{l.leave_type} • {l.days} Day(s)</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Automatic Class Substitution Arrangements (8 Cols) */}
          <div className="lg:col-span-8 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              AUTOMATIC CLASS SUBSTITUTION ARRANGEMENTS
            </span>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0] bg-[#F8FAF9]">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-white">
                    <th className="py-2.5 px-3">ABSENT FACULTY</th>
                    <th className="py-2.5 px-3">CLASS &amp; SUBJECT</th>
                    <th className="py-2.5 px-3">PERIOD TIME</th>
                    <th className="py-2.5 px-3">AUTO-ASSIGNED SUBSTITUTE TEACHER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] text-slate-700">
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-xs text-slate-400 font-mono">
                      No timetable class substitutions required today. All scheduled classes are running smoothly.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 4: APPLY FOR LEAVE (4 COLS) + LEAVE HISTORY TABLE (8 COLS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Apply For Leave Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5 relative">
          <span className="absolute right-6 top-5 text-4xl font-display font-black text-slate-100 select-none pointer-events-none">
            01
          </span>

          <div className="pb-3 border-b border-[#E8F0EA]">
            <h2 className="font-display font-bold text-base text-[#122A24]">
              Apply For Leave
            </h2>
            <p className="text-xs text-[#2D5A4E]">
              Submit request for management approval
            </p>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-4">
            {/* Applicant Employee */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#122A24]">Applicant Employee</label>
              <select
                value={applicantId}
                onChange={(e) => setApplicantId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#C5E2CF] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer shadow-2xs"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.staff_code || t.id}) — {t.department || 'Faculty'}
                  </option>
                ))}
                {teachers.length === 0 && (
                  <option value="">No registered teachers found</option>
                )}
              </select>
            </div>

            {/* Leave Type */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#122A24]">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] focus:outline-none cursor-pointer"
              >
                <option value="Casual Leave (CL) — Paid">Casual Leave (CL) — Paid</option>
                <option value="Medical Leave (ML) — Paid">Medical Leave (ML) — Paid</option>
                <option value="Half Day (HD) — 0.5 Day">Half Day (HD) — 0.5 Day</option>
                <option value="Maternity / Paternity Leave">Maternity / Paternity Leave</option>
                <option value="Loss of Pay (LOP) Leave">Loss of Pay (LOP) Leave</option>
              </select>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#122A24]">Reason for Leave</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the reason for leave..."
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:bg-white resize-none"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#122A24]">Medical Certificate / Attachment (Optional)</label>
              <input
                type="file"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-[#DCE8E0] file:bg-white file:text-xs file:font-semibold file:text-[#122A24] hover:file:bg-slate-50 cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white font-display font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
            >
              <span>Submit Leave Application →</span>
            </button>
          </form>
        </div>


        {/* Right Column: Leave Application History Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5 relative">
          <span className="absolute right-6 top-5 text-4xl font-display font-black text-slate-100 select-none pointer-events-none">
            02
          </span>

          <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
            <div>
              <h2 className="font-display font-bold text-base text-[#122A24]">
                Leave Application History
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                All submitted faculty &amp; employee leave requests
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              Total {leaveApplications.length}
            </span>
          </div>

          <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
            <table className="w-full text-left text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-[#F8FAF9]">
                  <th className="py-2.5 px-3.5">EMPLOYEE</th>
                  <th className="py-2.5 px-3">LEAVE TYPE</th>
                  <th className="py-2.5 px-3">DATE RANGE</th>
                  <th className="py-2.5 px-3">DAYS</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F0EA] text-slate-700">
                {leaveApplications.map(app => (
                  <tr key={app.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-[#122A24]">{app.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{app.designation} • {app.department}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {app.leave_type}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {app.start_date} → {app.end_date}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#122A24]">
                      {app.days}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {app.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(app.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] border-none cursor-pointer transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10.5px] border border-rose-200 cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaveApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-mono">
                      No leave applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
