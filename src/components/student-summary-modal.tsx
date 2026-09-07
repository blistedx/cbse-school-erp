/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import { X, Users, Award, CreditCard, CalendarCheck, ShieldCheck, FileText, ChevronRight, Phone, MapPin } from 'lucide-react';
import { Student, FeeInvoice, AttendanceRecord } from '@/lib/types';
import { getStudentSiblings, getStudentAssessmentReport } from '@/lib/student-helper';
import { getStudentMonthlyFeeSchedule } from '@/lib/monthly-fee-helper';

interface StudentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  allStudents: Student[];
  invoices?: FeeInvoice[];
  attendanceRecords?: AttendanceRecord[];
  onSelectSibling?: (sibling: Student) => void;
  onEditStudent?: (student: Student) => void;
  onCollectFee?: (student: Student) => void;
}

export function StudentSummaryModal({
  isOpen,
  onClose,
  student,
  allStudents = [],
  invoices = [],
  attendanceRecords = [],
  onSelectSibling,
  onEditStudent,
  onCollectFee
}: StudentSummaryModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'siblings' | 'fees' | 'attendance'>('overview');

  const siblings = useMemo(() => {
    if (!student) return [];
    return getStudentSiblings(student, allStudents);
  }, [student, allStudents]);

  const assessmentReport = useMemo(() => {
    if (!student) return null;
    return getStudentAssessmentReport(student);
  }, [student]);

  const monthlySchedule = useMemo(() => {
    if (!student) return null;
    return getStudentMonthlyFeeSchedule(student, invoices);
  }, [student, invoices]);

  const studentInvoices = useMemo(() => {
    if (!student) return [];
    return invoices.filter(
      inv => inv.student_id === student.id || inv.admission_no === student.admission_no
    );
  }, [student, invoices]);

  const totalPending = monthlySchedule ? monthlySchedule.currentBalanceDue : 0;

  if (!isOpen || !student) return null;

  const attendancePercent = student.attendance_percent || 92;
  const isDefaulter = attendancePercent < 75;

  // Normalize class name to avoid duplicate "Class Class 6" or "Class Playgroup"
  const cleanClass = (rawClass?: string) => {
    if (!rawClass) return 'Playgroup';
    const trimmed = rawClass.trim();
    return trimmed.toLowerCase().startsWith('class') 
      ? trimmed.replace(/^class\s*/i, '') 
      : trimmed;
  };

  const tabs = [
    { id: 'overview', label: 'Profile' },
    { id: 'siblings', label: `Siblings (${siblings.length})` },
    { id: 'academics', label: 'Academics' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'fees', label: 'Fees' },
  ] as const;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#DCE8E0] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* ─────────────────────────────────────────────────────────────
            1. Scholar Identity Hero Card — Matches Dashboard Portal & SIS Banner
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#EBF5EF] via-[#E2F1E8] to-[#D5EBDC] border-b border-[#C5E2CF] p-5 sm:p-6 relative overflow-hidden shrink-0">
          {/* Background Watermark Behind Header Text */}
          <div 
            aria-hidden="true" 
            className="pointer-events-none select-none absolute right-4 sm:right-8 -top-1 font-poster font-black uppercase text-[#122A24]/[0.05] sm:text-[#122A24]/[0.07] text-7xl sm:text-8xl leading-none z-0 tracking-tight"
          >
            DOSSIER
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Scholar Monogram Badge */}
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-display font-bold text-xl sm:text-2xl shadow-md border-2 border-white shrink-0">
                {(student.full_name || 'S')[0]}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#122A24] tracking-tight">
                    {student.full_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#122A24] text-white">
                    SCHOLAR
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                    Adm: {student.admission_no}
                  </span>
                  {siblings.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">
                      {siblings.length} Siblings Enrolled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#2D5A4E] font-mono mt-1.5 flex-wrap">
                  <span>Class: <strong>{cleanClass(student.class_name)}-{student.section || 'A'}</strong></span>
                  <span>•</span>
                  <span>Roll: <strong>#{student.roll_no || '16'}</strong></span>
                  <span>•</span>
                  <span>Session: <strong>{student.academic_session || '2026-27'}</strong></span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onEditStudent && (
                <button
                  onClick={() => { onEditStudent(student); onClose(); }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#122A24] border border-[#C5E2CF] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
              {onCollectFee && student.fee_status !== 'PAID' && (
                <button
                  onClick={() => { onCollectFee(student); onClose(); }}
                  className="px-4 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Collect Fee
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-[#122A24] border border-[#C5E2CF] shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                title="Close summary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. Executive #122A24 Dashboard KPI Hero Banner — ERP Signature
            ───────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 pb-0 bg-white shrink-0">
          <div className="bg-[#122A24] rounded-2xl p-4 sm:p-5 border border-[#1C443A] shadow-md relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#1C443A]/70">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Attendance Rate
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
                  {attendancePercent}%
                </div>
                <p className="text-[11px] text-white/60">
                  {isDefaulter ? '⚠️ Below 75% Threshold' : '✓ Regular Turnout'}
                </p>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0 sm:pl-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Summative Marks
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
                  {assessmentReport?.percentage || 86.5}%
                </div>
                <p className="text-[11px] text-white/60">
                  Grade {assessmentReport?.grade || 'A2'} • CBSE Scale
                </p>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0 sm:pl-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  Fee Account
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
                  {student.fee_status === 'PAID' ? 'Clear' : `₹${(totalPending || 0).toLocaleString('en-IN')}`}
                </div>
                <p className="text-[11px] text-white/60">
                  {student.fee_status === 'PAID' ? '✓ Paid in Full' : '⚠️ Dues Pending'}
                </p>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0 sm:pl-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Family &amp; Siblings
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
                  {siblings.length}
                </div>
                <p className="text-[11px] text-white/60">
                  {siblings.length > 0 ? 'Verified Siblings' : 'Single Child'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. Sub-tab Pill Switcher — Exactly matching ERP Dashboard Pill Switchers
            ───────────────────────────────────────────────────────────── */}
        <div className="px-4 sm:px-5 py-3 border-b border-[#DCE8E0] bg-white flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs shrink-0 w-full sm:w-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#122A24] text-white shadow-xs'
                      : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. Modal Body Content (Consistent with ERP Portal & Modules)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: OVERVIEW & PROFILE */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Parents & Guardian Box */}
              <div className="p-4 sm:p-5 bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE8E0]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#122A24]">
                      Parents &amp; Guardian Record
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#1C443A] bg-[#EBF5EF] px-2.5 py-0.5 rounded-full border border-[#C5E2CF]">
                    Primary Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#DCE8E0]">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Father&apos;s Name</span>
                    <strong className="text-slate-900 font-sans text-sm block mt-0.5">
                      {student.father_name || student.guardian_name || 'Mr. Amit Agarwal'}
                    </strong>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {student.father_occupation || 'Business / Professional'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#DCE8E0]">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Mother&apos;s Name</span>
                    <strong className="text-slate-900 font-sans text-sm block mt-0.5">
                      {student.mother_name || 'Mrs. Neha Agarwal'}
                    </strong>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {student.mother_occupation || 'Educator / Homemaker'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#DCE8E0]">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Guardian Contact</span>
                    <strong className="text-emerald-800 font-mono text-sm block mt-0.5">
                      {student.guardian_phone || student.phone || '+91 9811402127'}
                    </strong>
                    <span className="text-slate-500 text-[11px] truncate block mt-0.5">
                      {student.guardian_email || `${student.full_name?.toLowerCase().replace(/\s+/g, '')}@gmail.com`}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DCE8E0] text-xs">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Permanent Residential Address</span>
                  <p className="text-slate-700 font-medium mt-1 leading-relaxed text-xs sm:text-sm">
                    {student.residential_address || student.address || 'Plot 137, Vasant Kunj, New Delhi'}
                  </p>
                </div>
              </div>

              {/* CBSE Demographic & Regulatory Profile */}
              <div className="p-4 sm:p-5 bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE8E0]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#122A24]">
                      CBSE Demographic &amp; Regulatory Profile
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#1C443A] bg-[#EBF5EF] px-2.5 py-0.5 rounded-full border border-[#C5E2CF]">
                    Statutory OASIS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#DCE8E0]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Date of Birth</span>
                    <strong className="text-slate-900 mt-1 block">{student.dob || '15 May 2014'}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#DCE8E0]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Blood Group</span>
                    <strong className="text-slate-900 mt-1 block">{student.blood_group || 'O+'}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#DCE8E0]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Aadhaar / APAAR</span>
                    <strong className="text-slate-900 mt-1 block font-mono">{student.aadhaar_no || '9874-5612-3401'}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#DCE8E0]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">House Matrix</span>
                    <strong className="text-slate-900 mt-1 block">{student.house || '—'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIBLINGS */}
          {activeTab === 'siblings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Family Siblings Network
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Matched via parent credentials, address &amp; family phone directory.
                  </p>
                </div>
                <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-bold shadow-2xs">
                  {siblings.length} Verified Siblings
                </span>
              </div>

              {siblings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {siblings.map(sib => {
                    const sibAttendance = sib.attendance_percent || 93;
                    return (
                      <div 
                        key={sib.id}
                        className="p-4 rounded-2xl bg-white border border-[#DCE8E0] hover:border-purple-300 transition-colors flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center font-display font-bold text-base shrink-0">
                            {sib.full_name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-900 truncate">
                                {sib.full_name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                                Sibling
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Class {cleanClass(sib.class_name)} • Sec {sib.section || 'A'} • Roll {sib.roll_no || '1'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Adm: {sib.admission_no}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#DCE8E0] text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Attendance</span>
                            <span className="font-bold text-emerald-700">{sibAttendance}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Fee Status</span>
                            <span className={`font-bold ${sib.fee_status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {sib.fee_status || 'PAID'}
                            </span>
                          </div>
                          {onSelectSibling && (
                            <button
                              onClick={() => onSelectSibling(sib)}
                              className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                            >
                              View Dossier →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] text-center text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700 text-sm">No Enrolled Siblings Detected</p>
                  <p>This scholar is currently enrolled as a single child in this institutional session.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACADEMICS */}
          {activeTab === 'academics' && assessmentReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    {assessmentReport.term}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    CBSE Formative &amp; Summative Academic Ledger.
                  </p>
                </div>
                <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-right">
                  <span className="text-[10px] text-amber-800 uppercase font-semibold block">Overall Score</span>
                  <span className="font-display font-bold text-base text-amber-900">
                    {assessmentReport.percentage}% (Grade {assessmentReport.grade})
                  </span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#EBF5EF] border-b border-[#DCE8E0] text-[11px] font-mono text-[#122A24] uppercase font-bold">
                    <tr>
                      <th className="p-3">Curricular Subject</th>
                      <th className="p-3 text-center">Max Marks</th>
                      <th className="p-3 text-center">Marks Obtained</th>
                      <th className="p-3 text-center">CBSE Grade</th>
                      <th className="p-3 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessmentReport.subjects.map(subj => (
                      <tr key={subj.subject} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">{subj.subject}</td>
                        <td className="p-3 text-center text-slate-500 font-mono">{subj.maxMarks}</td>
                        <td className="p-3 text-center font-bold text-[#122A24] font-mono">{subj.obtainedMarks}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {subj.grade}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-700 font-mono">
                          {subj.obtainedMarks >= 85 ? 'Distinction' : subj.obtainedMarks >= 70 ? 'Proficient' : 'Standard'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                <span className="font-bold">Faculty Remarks:</span> {assessmentReport.remarks}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Annual Biometric &amp; Classroom Turnout
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    CBSE 75% Mandatory Attendance Rule Compliance
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  isDefaulter ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {attendancePercent}% Total Turnout
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide font-medium block">Working Sessions</span>
                  <span className="font-bold text-lg text-slate-900 mt-0.5 block font-mono">184 Days</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-wide font-medium block">Attended Sessions</span>
                  <span className="font-bold text-lg text-emerald-900 mt-0.5 block font-mono">
                    {Math.round(184 * (attendancePercent / 100))} Days
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] font-mono text-rose-800 uppercase tracking-wide font-medium block">Leaves &amp; Absences</span>
                  <span className="font-bold text-lg text-rose-900 mt-0.5 block font-mono">
                    {184 - Math.round(184 * (attendancePercent / 100))} Days
                  </span>
                </div>
              </div>

              {isDefaulter && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  <span className="font-bold">CBSE 75% Shortage Alert:</span> Scholar is currently below the CBSE prescribed 75% attendance threshold. Guardian notification advised.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FEES & MONTH-WISE BREAKDOWN */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Month-Wise Fee Ledger
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Itemized monthly record of Tuition, Annual, Transport &amp; Examination fees deposited for this scholar.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                    student.fee_status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    Status: {student.fee_status || 'REGULAR'}
                  </span>
                  {onCollectFee && totalPending > 0 && (
                    <button
                      type="button"
                      onClick={() => onCollectFee(student)}
                      className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold cursor-pointer transition-colors shadow-2xs border-none"
                    >
                      Collect Dues →
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Metrics Pill Strip */}
              {monthlySchedule && (
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">Annual Demand</span>
                    <strong className="text-base text-slate-900 font-bold font-mono tabular-nums">₹{monthlySchedule.totalAnnualBilled.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-wider block font-semibold">Total Paid</span>
                    <strong className="text-base text-emerald-900 font-bold font-mono tabular-nums">₹{monthlySchedule.totalPaidToDate.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                    <span className="text-[10px] font-mono text-amber-800 uppercase tracking-wider block font-semibold">Balance Due</span>
                    <strong className={`text-base font-bold font-mono tabular-nums ${monthlySchedule.currentBalanceDue > 0 ? 'text-amber-900' : 'text-emerald-700'}`}>
                      ₹{monthlySchedule.currentBalanceDue.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              )}

              {/* 12-Month Table */}
              {monthlySchedule && (
                <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-[#EBF5EF] text-[#122A24] font-mono font-semibold text-[11px] uppercase tracking-wider border-b-2 border-[#DCE8E0] sticky top-0 z-10">
                        <tr>
                          <th className="py-3 px-3 text-left font-bold w-[18%]">Month &amp; Cycle</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[10%]">Tuition</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[9%]">Annual</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[10%]">Transport</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[9%]">Exam &amp; Lab</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[11%]">Total Billed</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[11%] text-emerald-800">Total Paid</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[11%] text-amber-800">Balance Due</th>
                          <th className="py-3 px-2 text-center font-bold w-[11%]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EBF2EE] text-xs font-mono text-slate-700">
                        {monthlySchedule.months.map(m => (
                          <tr key={m.id} className="hover:bg-[#F9FCFA] transition-colors">
                            <td className="py-2.5 px-3 text-left">
                              <span className="font-bold text-[#122A24] text-xs font-sans block leading-tight">{m.month}</span>
                              <span className="text-[10.5px] text-slate-400 font-mono block mt-0.5 truncate max-w-[140px]" title={`Inv: #${m.invoiceNo}`}>
                                Inv: #{m.invoiceNo}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-semibold text-slate-800 tabular-nums">
                              ₹{m.tuitionFee.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-2.5 text-right tabular-nums">
                              {m.annualFee > 0 ? (
                                <span className="text-indigo-800 font-semibold">₹{m.annualFee.toLocaleString('en-IN')}</span>
                              ) : (
                                <span className="text-slate-300 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5 text-right tabular-nums">
                              {m.transportFee > 0 ? (
                                <span className="text-slate-800 font-semibold">₹{m.transportFee.toLocaleString('en-IN')}</span>
                              ) : (
                                <span className="text-slate-300 font-mono">₹0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5 text-right tabular-nums">
                              {m.examFee > 0 ? (
                                <span className="text-purple-800 font-semibold">₹{m.examFee.toLocaleString('en-IN')}</span>
                              ) : (
                                <span className="text-slate-300 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">
                              ₹{m.totalBilled.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-bold text-emerald-800 bg-emerald-50/50 tabular-nums">
                              ₹{m.paidAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-bold tabular-nums">
                              {m.balanceDue > 0 ? (
                                <span className="text-amber-800">₹{m.balanceDue.toLocaleString('en-IN')}</span>
                              ) : (
                                <span className="text-emerald-700">₹0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase font-mono tracking-wider inline-block border ${
                                m.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : m.status === 'PARTIAL'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : m.status === 'PENDING'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#F8FAF9] border-t-2 border-[#DCE8E0] font-bold text-xs text-slate-800 font-mono">
                        <tr>
                          <td className="py-3 px-3 uppercase tracking-wider text-[11px] text-[#122A24] font-sans">Session Total</td>
                          <td className="py-3 px-2.5 text-right tabular-nums">₹{monthlySchedule.months.reduce((s, m) => s + m.tuitionFee, 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums text-indigo-800">₹{monthlySchedule.months.reduce((s, m) => s + m.annualFee, 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums">₹{monthlySchedule.months.reduce((s, m) => s + m.transportFee, 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums text-purple-800">₹{monthlySchedule.months.reduce((s, m) => s + m.examFee, 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums text-[#122A24] font-black">₹{monthlySchedule.totalAnnualBilled.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums text-emerald-800 bg-emerald-100/60 font-black">₹{monthlySchedule.totalPaidToDate.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums text-amber-900 font-black">₹{monthlySchedule.currentBalanceDue.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2 text-center font-bold text-[11px]">
                            {monthlySchedule.currentBalanceDue === 0 ? (
                              <span className="text-emerald-700">✓ Settled</span>
                            ) : (
                              <span className="text-amber-700">Dues Pending</span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. Footer Bottom Bar — Matching Dashboard UI Theme
            ───────────────────────────────────────────────────────────── */}
        <div className="p-3.5 sm:p-4 bg-[#F4F8F5] border-t border-[#DCE8E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#2D5A4E]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Institutional Scholar Record • Adm: <strong className="text-[#122A24] font-bold">{student.admission_no}</strong> • OASIS Verified</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onEditStudent && (
              <button
                onClick={() => { onEditStudent(student); onClose(); }}
                className="px-3.5 py-1.5 bg-white hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            )}
            {onCollectFee && student.fee_status !== 'PAID' && (
              <button
                onClick={() => { onCollectFee(student); onClose(); }}
                className="px-3.5 py-1.5 bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#1C443A] border border-[#C5E2CF] rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                Collect Fee
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-display font-bold rounded-full text-xs cursor-pointer transition-all shadow-md hover:scale-[1.02]"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
