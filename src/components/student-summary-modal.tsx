'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  Edit,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { Student, FeeInvoice, AttendanceRecord } from '@/lib/types';
import { getStudentSiblings, getStudentAssessmentReport } from '@/lib/student-helper';

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

  const studentInvoices = useMemo(() => {
    if (!student) return [];
    return invoices.filter(
      inv => inv.student_id === student.id || inv.admission_no === student.admission_no
    );
  }, [student, invoices]);

  const totalBilled = studentInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPaid = studentInvoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPending = studentInvoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  if (!isOpen || !student) return null;

  const attendancePercent = student.attendance_percent || 92;
  const isDefaulter = attendancePercent < 75;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#DCE8E0] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header & Identity Banner */}
        <div className="bg-[#122A24] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
            title="Close summary"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-700/40 border-2 border-emerald-400/50 flex items-center justify-center font-display font-bold text-2xl text-emerald-200 shadow-md shrink-0">
                {student.full_name?.slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight">
                    {student.full_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Adm: {student.admission_no}
                  </span>
                  {siblings.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30 flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      {siblings.length} Sibling{siblings.length > 1 ? 's' : ''} Enrolled
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-mono mt-1">
                  Class {student.class_name} • Section {student.section || 'A'} • Roll No: {student.roll_no || '1'} • Session {student.academic_session || '2026-27'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onEditStudent && (
                <button
                  onClick={() => { onEditStudent(student); onClose(); }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
              {onCollectFee && student.fee_status !== 'PAID' && (
                <button
                  onClick={() => { onCollectFee(student); onClose(); }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#122A24] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect Fee</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10 font-mono text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-300 block">Attendance Rate</span>
              <span className={`font-bold text-sm sm:text-base ${isDefaulter ? 'text-rose-300' : 'text-emerald-200'}`}>
                {attendancePercent}% {isDefaulter ? '(Defaulter)' : '(Regular)'}
              </span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-300 block">Summative Marks</span>
              <span className="font-bold text-sm sm:text-base text-amber-300">
                {assessmentReport?.percentage || 88.5}% (Grade {assessmentReport?.grade || 'A1'})
              </span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-300 block">Fee Account</span>
              <span className={`font-bold text-sm sm:text-base ${student.fee_status === 'PAID' ? 'text-emerald-300' : 'text-amber-300'}`}>
                {student.fee_status === 'PAID' ? 'PAID IN FULL' : `DUE: ₹${totalPending || 12000}`}
              </span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-300 block">Family & Siblings</span>
              <span className="font-bold text-sm sm:text-base text-purple-200">
                {siblings.length > 0 ? `${siblings.length} Active Sibling${siblings.length > 1 ? 's' : ''}` : 'Single Child'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#F4F8F5] border-b border-[#E2ECE5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: '📌 Profile & Parents', icon: GraduationCap },
            { id: 'siblings', label: `👨‍👩‍👧‍👦 Sibling Matrix (${siblings.length})`, icon: HeartHandshake },
            { id: 'academics', label: '🏆 Marks & Exams', icon: Award },
            { id: 'attendance', label: '📊 Attendance Ledger', icon: CalendarCheck },
            { id: 'fees', label: '💳 Fee Invoices', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#122A24] text-white border-[#122A24]'
                  : 'bg-white text-slate-600 border-[#DCE8E0] hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & PARENTS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Parent & Family Bio */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-4">
                <h3 className="font-display font-bold text-sm sm:text-base text-[#122A24] flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-800" />
                  <span>Parents & Guardian Record</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#E2ECE5] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Father's Name</span>
                    <span className="font-semibold text-slate-900 block text-sm">
                      {student.father_name || student.guardian_name || 'Mr. Rajesh ' + student.full_name?.split(' ').pop()}
                    </span>
                    <span className="text-slate-500">{student.father_occupation || 'Business / Professional'}</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E2ECE5] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Mother's Name</span>
                    <span className="font-semibold text-slate-900 block text-sm">
                      {student.mother_name || 'Mrs. Priya ' + student.full_name?.split(' ').pop()}
                    </span>
                    <span className="text-slate-500">{student.mother_occupation || 'Educator / Homemaker'}</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E2ECE5] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Guardian Contact</span>
                    <span className="font-mono font-bold text-emerald-800 block text-sm">
                      {student.guardian_phone || student.phone || '+91 9811300001'}
                    </span>
                    <span className="text-slate-500 truncate block">{student.guardian_email || `${student.full_name?.toLowerCase().replace(/\s+/g, '')}@gmail.com`}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-[#E2ECE5] text-xs">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Permanent Residential Address:</span>
                    <p className="text-slate-600 mt-0.5">
                      {student.residential_address || student.address || 'Sector 12, Phase II, Dwarka, New Delhi - 110075'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CBSE Statutory & Demographics */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-4">
                <h3 className="font-display font-bold text-sm sm:text-base text-[#122A24] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span>CBSE Demographic & Regulatory Profile</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase">Date of Birth</span>
                    <span className="font-bold text-slate-900">{student.dob || '15 May 2014'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase">Blood Group</span>
                    <span className="font-bold text-slate-900">{student.blood_group || 'O+'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase">Aadhaar / APAAR</span>
                    <span className="font-bold text-slate-900">{student.aadhaar_no || '9874-5612-3401'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2ECE5]">
                    <span className="text-[10px] text-slate-500 block uppercase">House Matrix</span>
                    <span className="font-bold text-slate-900">{student.house || 'Green House'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIBLING MATRIX */}
          {activeTab === 'siblings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-purple-700" />
                    <span>Family Siblings Network</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Automatically matched via parent name, address &amp; family phone ledger.
                  </p>
                </div>
                <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full font-mono text-xs font-bold">
                  {siblings.length} Verified Sibling{siblings.length > 1 ? 's' : ''}
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
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center font-display font-bold text-base shrink-0">
                            {sib.full_name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-900 truncate">
                                {sib.full_name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                                Sibling
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-mono mt-0.5">
                              Class {sib.class_name} • Sec {sib.section || 'A'} • Roll {sib.roll_no || '1'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Adm No: {sib.admission_no}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#E8F0EA] text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Attendance</span>
                            <span className="font-bold text-emerald-700">{sibAttendance}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Fee Status</span>
                            <span className={`font-bold ${sib.fee_status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {sib.fee_status || 'PAID'}
                            </span>
                          </div>
                          {onSelectSibling && (
                            <button
                              onClick={() => onSelectSibling(sib)}
                              className="px-3 py-1 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>View Dossier</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] text-center font-mono text-xs text-slate-500 space-y-2">
                  <HeartHandshake className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-700 text-sm">No Enrolled Siblings Detected</p>
                  <p>This scholar is currently enrolled as a single child in this institutional session.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACADEMIC MARKS & SUMMATIVE REPORTS */}
          {activeTab === 'academics' && assessmentReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span>{assessmentReport.term}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    CBSE Formative &amp; Summative Academic Ledger.
                  </p>
                </div>
                <div className="px-3.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-right">
                  <span className="text-[10px] font-mono text-amber-800 block">Overall Score</span>
                  <span className="font-display font-bold text-base text-amber-900">{assessmentReport.percentage}% (Grade {assessmentReport.grade})</span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="rounded-2xl border border-[#E2ECE5] overflow-hidden bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#F8FAF9] border-b border-[#E2ECE5] font-mono text-[11px] text-slate-600 uppercase font-bold">
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
                        <td className="p-3 text-center font-mono text-slate-500">{subj.maxMarks}</td>
                        <td className="p-3 text-center font-mono font-bold text-[#122A24]">{subj.obtainedMarks}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {subj.grade}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700">
                          {subj.obtainedMarks >= 85 ? 'Distinction' : subj.obtainedMarks >= 70 ? 'Proficient' : 'Standard'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Faculty Evaluator Remarks:</span> {assessmentReport.remarks}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE LEDGER */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-emerald-800" />
                    <span>Annual Biometric &amp; Classroom Turnout</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    CBSE 75% Mandatory Attendance Rule Compliance
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${isDefaulter ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                  {attendancePercent}% Total Turnout
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5]">
                  <span className="text-[10px] text-slate-500 block uppercase">Working Sessions</span>
                  <span className="font-bold text-lg text-slate-900">184 Days</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block uppercase">Attended Sessions</span>
                  <span className="font-bold text-lg text-emerald-900">{Math.round(184 * (attendancePercent / 100))} Days</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] text-rose-800 block uppercase">Leaves &amp; Absences</span>
                  <span className="font-bold text-lg text-rose-900">{184 - Math.round(184 * (attendancePercent / 100))} Days</span>
                </div>
              </div>

              {isDefaulter && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">CBSE 75% Shortage Alert:</span> Scholar is currently below the CBSE prescribed 75% attendance threshold. Guardian notification advised.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FEES & INVOICES */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-800" />
                    <span>Fee Invoices &amp; Payment Ledger</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Tuition, Transport, Examination &amp; Laboratory charges.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${student.fee_status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                  Status: {student.fee_status}
                </span>
              </div>

              {studentInvoices.length > 0 ? (
                <div className="rounded-2xl border border-[#E2ECE5] overflow-hidden bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#F8FAF9] border-b border-[#E2ECE5] font-mono text-[11px] text-slate-600 uppercase font-bold">
                      <tr>
                        <th className="p-3">Invoice No</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment Mode</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {studentInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">#{inv.invoice_no || inv.id}</td>
                          <td className="p-3 text-slate-600">{inv.due_date || '10 Oct 2026'}</td>
                          <td className="p-3 font-bold text-[#122A24]">₹{Number(inv.amount).toLocaleString()}</td>
                          <td className="p-3 text-slate-600">{inv.payment_mode || 'Online / UPI'}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] text-center font-mono text-xs text-slate-500">
                  <CreditCard className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                  <p className="font-bold text-slate-700">No Outstanding Invoices</p>
                  <p>All institutional dues for the academic session are clear.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#F8FAF9] border-t border-[#E2ECE5] flex items-center justify-between text-xs">
          <div className="font-mono text-slate-500 text-[11px]">
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
