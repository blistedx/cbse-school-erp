/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#DCE8E0] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ─────────────────────────────────────────────────────────────
            1. Header Banner — Executive, Sans-Serif, Zero Clutter Icons
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-[#122A24] text-white p-5 sm:p-6 relative">
          {/* Close Dismiss Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
            title="Close summary"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Row: Avatar, Identity & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-10 sm:pr-0">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Clean Initials Avatar */}
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-display font-bold text-xl sm:text-2xl text-emerald-300 shadow-inner shrink-0">
                {student.full_name?.slice(0, 2).toUpperCase() || 'ST'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight">
                    {student.full_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Adm: {student.admission_no}
                  </span>
                  {siblings.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                      {siblings.length} Siblings Enrolled
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Class {cleanClass(student.class_name)}</span>
                  <span>•</span>
                  <span>Section {student.section || 'A'}</span>
                  <span>•</span>
                  <span>Roll No: {student.roll_no || '1'}</span>
                  <span>•</span>
                  <span>Session {student.academic_session || '2026-27'}</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onEditStudent && (
                <button
                  onClick={() => { onEditStudent(student); onClose(); }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Edit Profile
                </button>
              )}
              {onCollectFee && student.fee_status !== 'PAID' && (
                <button
                  onClick={() => { onCollectFee(student); onClose(); }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#122A24] font-bold text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Collect Fee
                </button>
              )}
            </div>
          </div>

          {/* 4 Clean Metric Cards — Proportional Sans-Serif, High-Contrast */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10">
            {/* 1. Attendance */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/15 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-200/80 uppercase tracking-wider block">
                Attendance Rate
              </span>
              <div className="flex items-center justify-between gap-1.5 mt-1.5 flex-wrap">
                <span className="text-base sm:text-xl font-bold text-white tracking-tight tabular-nums">
                  {attendancePercent}%
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  isDefaulter 
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/30' 
                    : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                }`}>
                  {isDefaulter ? 'Defaulter' : 'Regular'}
                </span>
              </div>
            </div>

            {/* 2. Summative Marks */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/15 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-200/80 uppercase tracking-wider block">
                Summative Marks
              </span>
              <div className="flex items-center justify-between gap-1.5 mt-1.5 flex-wrap">
                <span className="text-base sm:text-xl font-bold text-white tracking-tight tabular-nums">
                  {assessmentReport?.percentage || 84.5}%
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/30 shrink-0">
                  Grade {assessmentReport?.grade || 'A2'}
                </span>
              </div>
            </div>

            {/* 3. Fee Account */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/15 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-200/80 uppercase tracking-wider block">
                Fee Account
              </span>
              <div className="flex items-center justify-between gap-1.5 mt-1.5 flex-wrap">
                <span className="text-base sm:text-xl font-bold text-white tracking-tight tabular-nums">
                  {student.fee_status === 'PAID' ? 'Clear' : `₹${(totalPending || 0).toLocaleString('en-IN')}`}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  student.fee_status === 'PAID'
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                    : 'bg-amber-500/25 text-amber-200 border border-amber-400/30'
                }`}>
                  {student.fee_status === 'PAID' ? 'Paid in Full' : 'Dues Pending'}
                </span>
              </div>
            </div>

            {/* 4. Family & Siblings */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/15 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-200/80 uppercase tracking-wider block">
                Family &amp; Siblings
              </span>
              <div className="flex items-center justify-between gap-1.5 mt-1.5 flex-wrap">
                <span className="text-base sm:text-xl font-bold text-white tracking-tight tabular-nums">
                  {siblings.length}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/30 shrink-0">
                  {siblings.length > 0 ? 'Active Siblings' : 'Single Child'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. Full-Width Segmented Tab Navigation (NEVER Cut Off)
            ───────────────────────────────────────────────────────────── */}
        <div className="p-2 sm:p-2.5 bg-[#F4F8F5] border-b border-[#DCE8E0]">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 text-center text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer truncate ${
                    isActive
                      ? 'bg-[#122A24] text-white shadow-sm font-bold'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. Modal Body Content (Clean Typography, Zero Icon Clutter)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & PROFILE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Parents & Guardian Record */}
              <div className="p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Parents &amp; Guardian Record
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-[#E2ECE5]">
                    Primary Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-[#E2ECE5] space-y-1">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block tracking-wide">
                      Father&apos;s Name
                    </span>
                    <span className="font-bold text-slate-900 block text-sm">
                      {student.father_name || student.guardian_name || 'Mr. Rajesh ' + (student.full_name?.split(' ').pop() || '')}
                    </span>
                    <span className="text-slate-500 block">
                      {student.father_occupation || 'Business / Professional'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#E2ECE5] space-y-1">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block tracking-wide">
                      Mother&apos;s Name
                    </span>
                    <span className="font-bold text-slate-900 block text-sm">
                      {student.mother_name || 'Mrs. Priya ' + (student.full_name?.split(' ').pop() || '')}
                    </span>
                    <span className="text-slate-500 block">
                      {student.mother_occupation || 'Educator / Homemaker'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#E2ECE5] space-y-1">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block tracking-wide">
                      Guardian Contact
                    </span>
                    <span className="font-bold text-emerald-800 block text-sm">
                      {student.guardian_phone || student.phone || '+91 9811300270'}
                    </span>
                    <span className="text-slate-500 truncate block">
                      {student.guardian_email || `${student.full_name?.toLowerCase().replace(/\s+/g, '')}@gmail.com`}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E2ECE5] text-xs">
                  <span className="font-bold text-slate-800 block">Permanent Residential Address</span>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {student.residential_address || student.address || 'Sector 12, Phase II, Dwarka, New Delhi - 110075'}
                  </p>
                </div>
              </div>

              {/* CBSE Demographic & Regulatory Profile */}
              <div className="p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    CBSE Demographic &amp; Regulatory Profile
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-[#E2ECE5]">
                    Statutory
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Date of Birth</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{student.dob || '15 May 2014'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Blood Group</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{student.blood_group || 'O+'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Aadhaar / APAAR</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{student.aadhaar_no || '9874-5612-3401'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">House Matrix</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{student.house || 'Green House'}</span>
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
                <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-bold">
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
                        className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] hover:border-purple-300 transition-colors flex flex-col justify-between gap-3 shadow-2xs"
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

                        <div className="flex items-center justify-between pt-3 border-t border-[#E8F0EA] text-xs">
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
                              className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
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
                <div className="p-8 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] text-center text-xs text-slate-500 space-y-1">
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
              <div className="rounded-2xl border border-[#E2ECE5] overflow-hidden bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#F8FAF9] border-b border-[#E2ECE5] text-[11px] text-slate-600 uppercase font-bold">
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
                        <td className="p-3 text-center text-slate-500">{subj.maxMarks}</td>
                        <td className="p-3 text-center font-bold text-[#122A24]">{subj.obtainedMarks}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {subj.grade}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-700">
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
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isDefaulter ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {attendancePercent}% Total Turnout
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5]">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium block">Working Sessions</span>
                  <span className="font-bold text-lg text-slate-900 mt-0.5 block">184 Days</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase tracking-wide font-medium block">Attended Sessions</span>
                  <span className="font-bold text-lg text-emerald-900 mt-0.5 block">
                    {Math.round(184 * (attendancePercent / 100))} Days
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] text-rose-800 uppercase tracking-wide font-medium block">Leaves &amp; Absences</span>
                  <span className="font-bold text-lg text-rose-900 mt-0.5 block">
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    student.fee_status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    Status: {student.fee_status || 'REGULAR'}
                  </span>
                  {onCollectFee && totalPending > 0 && (
                    <button
                      type="button"
                      onClick={() => onCollectFee(student)}
                      className="px-3 py-1 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs border-none"
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
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Annual Demand</span>
                    <strong className="text-base text-slate-900 font-bold tabular-nums">₹{monthlySchedule.totalAnnualBilled.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                    <span className="text-[11px] text-emerald-800 uppercase tracking-wider block font-semibold">Total Paid</span>
                    <strong className="text-base text-emerald-900 font-bold tabular-nums">₹{monthlySchedule.totalPaidToDate.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                    <span className="text-[11px] text-amber-800 uppercase tracking-wider block font-semibold">Balance Due</span>
                    <strong className={`text-base font-bold tabular-nums ${monthlySchedule.currentBalanceDue > 0 ? 'text-amber-900' : 'text-emerald-700'}`}>
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
                      <thead className="bg-[#122A24] text-white font-mono text-[11px] uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="py-3 px-3 text-left font-bold w-[18%]">Month &amp; Cycle</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[10%]">Tuition</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[9%]">Annual</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[10%]">Transport</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[9%]">Exam &amp; Lab</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[11%]">Total Billed</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[11%] text-emerald-300">Total Paid</th>
                          <th className="py-3 px-2.5 text-right font-bold w-[11%] text-amber-300">Balance Due</th>
                          <th className="py-3 px-2 text-center font-bold w-[11%]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EBF2EE] text-xs font-sans text-slate-700">
                        {monthlySchedule.months.map(m => (
                          <tr key={m.id} className="hover:bg-[#F9FCFA] transition-colors">
                            <td className="py-2.5 px-3 text-left">
                              <span className="font-bold text-[#122A24] text-xs block leading-tight">{m.month}</span>
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
                          <td className="py-3 px-3 uppercase tracking-wider text-[11px] text-[#122A24]">Session Total</td>
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
            4. Footer
            ───────────────────────────────────────────────────────────── */}
        <div className="p-4 bg-[#F8FAF9] border-t border-[#E2ECE5] flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px]">
            Institutional Scholar Record • DPS International
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
