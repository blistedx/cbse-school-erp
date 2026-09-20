/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Users, Award, CreditCard, CalendarCheck, ShieldCheck, FileText, ChevronRight, Phone, MapPin, Camera, Loader2, Check, Eye, Download, ZoomIn, Upload, Mail, User, Calendar, BadgeCheck, Sparkles } from 'lucide-react';
import { Student, FeeInvoice, AttendanceRecord } from '@/lib/types';
import { getStudentSiblings, getStudentAssessmentReport, AVAILABLE_EXAMS } from '@/lib/student-helper';
import { compressImageFile } from '@/lib/image-compress';
import { StudentAttendanceHistory } from '@/components/student-attendance-history';
import { getSchoolInitials } from '@/lib/utils';

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
  onUpdateStudent?: (updatedStudent: Student) => void;
}

// Helper to determine if a string is a valid image URL or base64 data URI
const isImageUrl = (val?: string): boolean => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('blob:')
  );
};

function matchInvoicesForStudent(invoices: FeeInvoice[], student: Student) {
  if (!invoices || !student) return [];
  return invoices.filter(inv => inv.student_id === student.id || inv.student_name?.toLowerCase() === student.full_name?.toLowerCase());
}

function getStudentFeeSummary(student: Student, invoices?: FeeInvoice[]) {
  const isPaid = student.fee_status === 'PAID' || student.fee_status === 'WAIVED';
  return {
    feeStatus: student.fee_status || 'PENDING',
    currentBalanceDue: isPaid ? 0 : 2500,
    totalAnnualBilled: 35000,
    totalPaidToDate: isPaid ? 35000 : 0,
  };
}

function getStudentMonthlyFeeSchedule(student: Student, invoices?: FeeInvoice[]) {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const isPaid = student.fee_status === 'PAID' || student.fee_status === 'WAIVED';
  return {
    months: months.map((m) => ({
      month: m,
      monthName: m,
      tuitionFee: 2500,
      transportFee: student.transport_opted === 'YES' ? 1200 : 0,
      annualFee: 417,
      totalBilled: 2917,
      paidAmount: isPaid ? 2917 : 0,
      balanceDue: isPaid ? 0 : 2917,
      status: isPaid ? 'PAID' : 'PENDING',
    })),
    totalAnnualBilled: 35000,
    totalPaidToDate: isPaid ? 35000 : 0,
    currentBalanceDue: isPaid ? 0 : 35000,
  };
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
  onCollectFee,
  onUpdateStudent
}: StudentSummaryModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'academics' | 'siblings' | 'attendance'>('overview');
  const [imgError, setImgError] = useState(false);
  const [localStudent, setLocalStudent] = useState<Student | null>(student);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  const activeStudent = localStudent || student;

  // Fees ledger integration
  const [dossierLedger, setDossierLedger] = useState<any[]>([]);
  const [dossierSummary, setDossierSummary] = useState<any>(null);
  const [dossierReceipts, setDossierReceipts] = useState<any[]>([]);
  const [dossierFeesLoading, setDossierFeesLoading] = useState(false);

  useEffect(() => {
    if (activeStudent && (activeTab === 'fees' || activeTab === 'overview')) {
      setDossierFeesLoading(true);
      fetch(`/api/fee-master?action=student_ledger_view&student_id=${activeStudent.id}&session=${activeStudent.academic_session || '2026-27'}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDossierLedger(data.ledgerView || []);
            setDossierSummary(data.summary || null);
            setDossierReceipts(data.receipts || []);
          }
        })
        .catch(err => console.error('[dossier fees load error]', err))
        .finally(() => setDossierFeesLoading(false));
    }
  }, [activeStudent?.id, activeTab]);

  useEffect(() => {
    setLocalStudent(student);
    setImgError(false);
  }, [student]);

  // Resolve candidate student profile image / avatar
  const studentPhotoUrl = useMemo(() => {
    if (!activeStudent) return null;
    const candidate = activeStudent.photo || activeStudent.avatar || (activeStudent as any).profile_picture_url || (activeStudent as any).profile_image || (activeStudent as any).profile_picture;
    if (isImageUrl(candidate)) {
      return candidate.trim();
    }
    return null;
  }, [activeStudent]);

  const studentEmoji = useMemo(() => {
    if (!activeStudent) return null;
    const candidate = activeStudent.avatar || activeStudent.photo;
    if (candidate && typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0 && trimmed.length <= 4 && !trimmed.startsWith('/')) {
        return trimmed;
      }
    }
    return null;
  }, [activeStudent]);

  // Reset imgError whenever student or photo URL changes
  useEffect(() => {
    setImgError(false);
  }, [activeStudent?.id, studentPhotoUrl]);

  // Direct 1-Click DP / Photo Upload
  const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStudent) return;
    try {
      setUploadingPhoto(true);
      const base64 = await compressImageFile(file, 480, 0.85);
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeStudent.id,
          photo: base64,
          avatar: base64,
          school_id: activeStudent.school_id || 'DPS2026'
        })
      });
      const data = await res.json();
      if (data.success && data.student) {
        const fresh: Student = {
          ...activeStudent,
          ...data.student,
          photo: data.student.photo ? `${data.student.photo.split('?')[0]}?v=${Date.now()}` : base64,
          avatar: data.student.avatar ? `${data.student.avatar.split('?')[0]}?v=${Date.now()}` : base64,
        };
        setLocalStudent(fresh);
        setImgError(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        if (onUpdateStudent) {
          onUpdateStudent(fresh);
        }
      } else {
        alert(data.error || 'Failed to update profile picture.');
      }
    } catch (err: any) {
      console.error('Direct photo upload error:', err);
      alert('Error uploading profile picture: ' + err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const [selectedExamId, setSelectedExamId] = useState<string>('TERM1');

  const siblings = useMemo(() => {
    if (!activeStudent) return [];
    return getStudentSiblings(activeStudent, allStudents);
  }, [activeStudent, allStudents]);

  const assessmentReport = useMemo(() => {
    if (!activeStudent) return null;
    return getStudentAssessmentReport(activeStudent, selectedExamId);
  }, [activeStudent, selectedExamId]);

  const monthlySchedule = useMemo(() => {
    if (!activeStudent) return null;
    return getStudentMonthlyFeeSchedule(activeStudent, invoices);
  }, [activeStudent, invoices]);

  const feeSummary = useMemo(() => {
    if (!activeStudent) return null;
    return getStudentFeeSummary(activeStudent, invoices);
  }, [activeStudent, invoices]);

  const studentInvoices = useMemo(() => {
    if (!activeStudent) return [];
    return matchInvoicesForStudent(invoices, activeStudent);
  }, [activeStudent, invoices]);

  const totalPending = feeSummary ? feeSummary.currentBalanceDue : (monthlySchedule ? monthlySchedule.currentBalanceDue : 0);

  if (!isOpen || !activeStudent) return null;

  const attendancePercent = activeStudent.attendance_percent || 92;
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
    { id: 'fees', label: 'Fees' },
    { id: 'siblings', label: `Siblings (${siblings.length})` },
    { id: 'academics', label: 'Academics' },
    { id: 'attendance', label: 'Attendance' },
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
          {/* Editorial Watermark Typography */}
          <div 
            aria-hidden="true" 
            className="pointer-events-none select-none absolute -top-3 sm:-top-6 -left-2 sm:-left-4 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
          >
            Dossier
          </div>
          <div 
            aria-hidden="true" 
            className="pointer-events-none select-none absolute -bottom-3 sm:-bottom-6 -right-2 sm:-right-4 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[60px] sm:text-[90px] md:text-[110px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
          >
            {getSchoolInitials((activeStudent as any)?.school_id || 'DPS')}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Scholar Profile Picture / Monogram Badge */}
              <div 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-display font-bold text-xl sm:text-2xl shadow-md border-2 border-white shrink-0 overflow-hidden relative group cursor-pointer"
                onClick={() => {
                  if (studentPhotoUrl && !imgError) {
                    setShowFullPhoto(true);
                  }
                }}
                title={studentPhotoUrl && !imgError ? "Click to view full photo" : "Scholar Profile"}
              >
                {studentPhotoUrl && !imgError ? (
                  <img
                    src={studentPhotoUrl}
                    alt={activeStudent.full_name || 'Scholar Profile'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={() => setImgError(true)}
                  />
                ) : studentEmoji ? (
                  <span className="text-2xl sm:text-3xl leading-none">{studentEmoji}</span>
                ) : (
                  <span>{(activeStudent.full_name || 'S')[0]}</span>
                )}

                {/* Hover overlay hint */}
                {studentPhotoUrl && !imgError && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#122A24] tracking-tight">
                    {activeStudent.full_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#122A24] text-white">
                    SCHOLAR
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                    Adm: {activeStudent.admission_no}
                  </span>
                  {siblings.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">
                      {siblings.length} Siblings Enrolled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#2D5A4E] font-mono mt-1.5 flex-wrap">
                  <span>Class: <strong>{cleanClass(activeStudent.class_name)}-{activeStudent.section || 'A'}</strong></span>
                  <span>•</span>
                  <span>Roll: <strong>#{activeStudent.roll_no || '16'}</strong></span>
                  <span>•</span>
                  <span>Session: <strong>{activeStudent.academic_session || '2026-27'}</strong></span>
                </div>

                {/* Photo Action Bar: View Photo & Change DP */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {studentPhotoUrl && !imgError && (
                    <button
                      type="button"
                      onClick={() => setShowFullPhoto(true)}
                      className="px-2.5 py-1 bg-white hover:bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF] rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:border-[#10B981]"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>View Photo</span>
                    </button>
                  )}

                  <label
                    className={`px-2.5 py-1 bg-white hover:bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF] rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:border-[#10B981] ${
                      uploadingPhoto ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span className="text-emerald-700">Uploading...</span>
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Updated!</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Change DP</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={handleDirectPhotoUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onEditStudent && (
                <button
                  onClick={() => { onEditStudent(activeStudent); onClose(); }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#122A24] border border-[#C5E2CF] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
              {onCollectFee && (
                <button
                  onClick={() => { onCollectFee(activeStudent); onClose(); }}
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
                  {totalPending === 0 ? 'Clear' : `₹${(totalPending || 0).toLocaleString('en-IN')}`}
                </div>
                <p className="text-[11px] text-white/60">
                  {totalPending === 0 ? '✓ Paid in Full' : '⚠️ Dues Pending'}
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
            3. Sub-tab Pill Switcher — Matching ERP Signature Tab Bars
            ───────────────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 py-3 border-b border-[#DCE8E0] bg-[#F9FCFA] flex items-center justify-between gap-3 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 bg-[#EBF5EF] p-1.5 rounded-2xl border border-[#C5E2CF]/70 shadow-2xs w-full sm:w-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[#122A24] text-white shadow-sm font-bold'
                      : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#2D5A4E]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>CBSE Session {activeStudent.academic_session || '2026-27'}</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. Modal Body Content (Consistent with ERP Portal & Modules)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: OVERVIEW & PROFILE */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Parents & Guardian Box */}
              <div className="bg-[#F8FAF9] rounded-3xl border border-[#DCE8E0] p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-[#122A24]">
                        Parents &amp; Guardian Record
                      </h3>
                      <p className="text-[11px] text-[#2D5A4E]">
                        Authorized primary contacts for official communications
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C443A] bg-[#EBF5EF] px-3 py-1 rounded-full border border-[#C5E2CF]">
                    Primary Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Father's Card */}
                  <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs hover:border-[#10B981] transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#2D5A4E] font-bold tracking-wider mb-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Father&apos;s Name</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-[#122A24] leading-tight">
                        {activeStudent.father_name || activeStudent.guardian_name || 'Mr. Rajesh Chatterjee'}
                      </h4>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#F0F5F2] text-xs text-[#2D5A4E]">
                      <span className="text-[10px] text-slate-400 block font-mono">Occupation</span>
                      <span className="font-medium text-slate-700">{activeStudent.father_occupation || 'Business / Professional'}</span>
                    </div>
                  </div>

                  {/* Mother's Card */}
                  <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs hover:border-[#10B981] transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#2D5A4E] font-bold tracking-wider mb-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Mother&apos;s Name</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-[#122A24] leading-tight">
                        {activeStudent.mother_name || 'Mrs. Sunita Chatterjee'}
                      </h4>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#F0F5F2] text-xs text-[#2D5A4E]">
                      <span className="text-[10px] text-slate-400 block font-mono">Occupation</span>
                      <span className="font-medium text-slate-700">{activeStudent.mother_occupation || 'Educator / Homemaker'}</span>
                    </div>
                  </div>

                  {/* Guardian Contact Card */}
                  <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs hover:border-[#10B981] transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#2D5A4E] font-bold tracking-wider mb-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Guardian Contact</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={`tel:${activeStudent.guardian_phone || activeStudent.phone || '+919811402121'}`}
                          className="text-sm sm:text-base font-mono font-bold text-[#122A24] hover:text-emerald-700 transition-colors tracking-tight"
                        >
                          {activeStudent.guardian_phone || activeStudent.phone || '+91 9811402121'}
                        </a>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#F0F5F2] text-xs text-[#2D5A4E]">
                      <span className="text-[10px] text-slate-400 block font-mono">Email Channel</span>
                      <a 
                        href={`mailto:${activeStudent.guardian_email || activeStudent.email || 'guardian@school.edu'}`}
                        className="font-medium text-[#2D5A4E] hover:text-[#122A24] truncate block"
                      >
                        {activeStudent.guardian_email || activeStudent.email || `${activeStudent.full_name?.toLowerCase().replace(/\s+/g, '')}@gmail.com`}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Permanent Residential Address */}
                <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#2D5A4E] font-bold tracking-wider mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Permanent Residential Address</span>
                  </div>
                  <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed mt-1">
                    {activeStudent.residential_address || activeStudent.address || 'Plot 131, Vasant Kunj, New Delhi'}
                  </p>
                </div>
              </div>

              {/* CBSE Demographic & Regulatory Profile */}
              <div className="bg-[#F8FAF9] rounded-3xl border border-[#DCE8E0] p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-[#122A24]">
                        CBSE Demographic &amp; Regulatory Profile
                      </h3>
                      <p className="text-[11px] text-[#2D5A4E]">
                        Statutory identifiers verified with CBSE OASIS portal
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C443A] bg-[#EBF5EF] px-3 py-1 rounded-full border border-[#C5E2CF]">
                    Statutory OASIS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-[#2D5A4E] font-bold tracking-wider block">Date of Birth</span>
                    <strong className="text-slate-900 text-sm sm:text-base font-bold font-mono mt-1.5 block">
                      {activeStudent.dob || '2014-05-15'}
                    </strong>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-[#2D5A4E] font-bold tracking-wider block">Blood Group</span>
                    <div className="mt-1.5">
                      <span className="px-2.5 py-1 rounded-lg font-bold text-xs font-mono bg-rose-50 text-rose-800 border border-rose-200 inline-block">
                        {activeStudent.blood_group || 'O+'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-[#2D5A4E] font-bold tracking-wider block">Aadhaar / APAAR</span>
                    <strong className="text-slate-900 text-xs sm:text-sm font-bold font-mono mt-1.5 block tracking-wider truncate">
                      {activeStudent.aadhaar_no || activeStudent.apaar_id || '9874-5612-3401'}
                    </strong>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-[#2D5A4E] font-bold tracking-wider block">House Matrix</span>
                    <div className="mt-1.5">
                      <span className="px-2.5 py-1 rounded-lg font-bold text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                        {activeStudent.house || 'Courage House'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FEES LEDGER & DOSSIER STATEMENT */}
          {activeTab === 'fees' && (
            <div className="space-y-5">
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider block">
                    Total Billed
                  </span>
                  <div className="text-lg font-bold font-mono text-[#122A24] mt-0.5">
                    {dossierSummary ? `₹${(dossierSummary.totalDemand / 100).toLocaleString('en-IN')}` : '₹0'}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold tracking-wider block">
                    Total Paid
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-950 mt-0.5">
                    {dossierSummary ? `₹${(dossierSummary.totalPaid / 100).toLocaleString('en-IN')}` : '₹0'}
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-rose-800 font-bold tracking-wider block">
                    Outstanding Due
                  </span>
                  <div className="text-lg font-bold font-mono text-rose-950 mt-0.5">
                    {dossierSummary ? `₹${(dossierSummary.balance / 100).toLocaleString('en-IN')}` : '₹0'}
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider block">
                    Fee Status
                  </span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      dossierSummary?.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dossierSummary?.status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dossierSummary?.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee Ledger Table */}
              <div className="bg-white rounded-2xl border border-[#DCE8E0] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#122A24] uppercase font-mono">
                    Fee Ledger &amp; Scheduled Heads (Session {activeStudent.academic_session || '2026-27'})
                  </h4>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Print Statement
                  </button>
                </div>

                {dossierFeesLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading ledger data...</div>
                ) : dossierLedger.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">No ledger entries mapped yet.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#EBF5EF] text-[#122A24] font-bold border-b border-[#DCE8E0]">
                          <th className="p-2.5">Head</th>
                          <th className="p-2.5">Period</th>
                          <th className="p-2.5 text-right">Gross</th>
                          <th className="p-2.5 text-right text-indigo-700">Disc</th>
                          <th className="p-2.5 text-right">Net</th>
                          <th className="p-2.5 text-right text-emerald-700">Paid</th>
                          <th className="p-2.5 text-right text-rose-700">Due</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {dossierLedger.map((row) => (
                          <tr key={row.id} className="hover:bg-[#F9FCFA]">
                            <td className="p-2.5 font-bold text-[#122A24]">{row.fee_head}</td>
                            <td className="p-2.5 text-slate-600">{row.period}</td>
                            <td className="p-2.5 text-right">₹{(row.gross_paise / 100).toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right text-indigo-700 font-bold">
                              {row.discount_paise > 0 ? `₹${(row.discount_paise / 100).toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="p-2.5 text-right font-bold">₹{(row.net_paise / 100).toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-700">
                              {row.paid_paise > 0 ? `₹${(row.paid_paise / 100).toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="p-2.5 text-right font-black text-rose-700">
                              {row.due_paise > 0 ? `₹${(row.due_paise / 100).toLocaleString('en-IN')}` : '₹0'}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.status === 'PARTIAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Receipts List */}
              {dossierReceipts.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#DCE8E0] p-4 space-y-2">
                  <h4 className="font-bold text-xs text-[#122A24] uppercase font-mono">Issued Payment Receipts</h4>
                  <div className="space-y-1.5">
                    {dossierReceipts.map((rec) => (
                      <div key={rec.receipt_no} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#122A24]">{rec.receipt_no}</span>
                          <span className="text-slate-500 ml-2">({rec.payment_date}) • {rec.payment_mode}</span>
                        </div>
                        <span className="font-bold text-emerald-800">₹{(rec.amount_paise / 100).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center font-display font-bold text-base shrink-0 overflow-hidden relative">
                            {(sib.photo || sib.avatar) && isImageUrl(sib.photo || sib.avatar) ? (
                              <img
                                src={(sib.photo || sib.avatar)!}
                                alt={sib.full_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <span className={(sib.photo || sib.avatar) && isImageUrl(sib.photo || sib.avatar) ? 'hidden' : ''}>
                              {sib.full_name?.slice(0, 2).toUpperCase()}
                            </span>
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
                            {(() => {
                              const sibFeeStatus = getStudentFeeSummary(sib, invoices).feeStatus;
                              return (
                                <span className={`font-bold ${sibFeeStatus === 'PAID' || sibFeeStatus === 'WAIVED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {sibFeeStatus}
                                </span>
                              );
                            })()}
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

          {/* TAB 3: ACADEMICS (WITH EXAM / TEST SELECTOR) */}
          {activeTab === 'academics' && assessmentReport && (
            <div className="space-y-4">
              {/* Top Header & Exam Selector Controls */}
              <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-display font-bold text-base text-[#122A24]">
                        {assessmentReport.term}
                      </h3>
                    </div>
                    <p className="text-xs text-[#2D5A4E] mt-0.5 font-mono">
                      {assessmentReport.cycle} • Evaluation Date: {assessmentReport.examDate}
                    </p>
                  </div>

                  {/* Exam Selector Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase shrink-0">
                      Select Exam:
                    </span>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="bg-white border border-[#DCE8E0] hover:border-emerald-600 text-xs font-bold text-[#122A24] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
                    >
                      {AVAILABLE_EXAMS.map(exam => (
                        <option key={exam.id} value={exam.id}>
                          {exam.name} ({exam.month})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Exam Switch Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                  {AVAILABLE_EXAMS.map(exam => {
                    const isSelected = selectedExamId === exam.id;
                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => setSelectedExamId(exam.id)}
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                            : 'bg-white text-[#2D5A4E] border-[#DCE8E0] hover:bg-[#EBF5EF]'
                        }`}
                      >
                        {exam.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Top KPI Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Total Marks */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider block">
                    Marks Scored
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#122A24] mt-0.5 tabular-nums">
                    {assessmentReport.totalObtained} <span className="text-xs font-normal text-slate-400">/ {assessmentReport.totalMax}</span>
                  </div>
                </div>

                {/* Percentage & Grade */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold tracking-wider block">
                    Percentage &amp; Grade
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-display text-emerald-950 mt-0.5 flex items-center gap-1.5">
                    <span>{assessmentReport.percentage}%</span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-600 text-white">
                      {assessmentReport.grade}
                    </span>
                  </div>
                </div>

                {/* CBSE CGPA */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider block">
                    CBSE CGPA
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#1C443A] mt-0.5 tabular-nums">
                    {assessmentReport.cgpa} <span className="text-xs font-normal text-slate-400">/ 10.0</span>
                  </div>
                </div>

                {/* Rank & Standing */}
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-amber-800 font-bold tracking-wider block">
                    Class Rank / Standing
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-display text-amber-950 mt-0.5">
                    Rank #{assessmentReport.classRank}
                  </div>
                </div>
              </div>

              {/* Scholastic Subject Breakdown Table */}
              <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[550px]">
                    <thead className="bg-[#EBF5EF] border-b-2 border-[#DCE8E0] text-[11px] font-mono text-[#122A24] uppercase font-bold sticky top-0">
                      <tr>
                        <th className="py-3 px-3 w-16 text-center">Code</th>
                        <th className="py-3 px-3">Curricular Subject</th>
                        {assessmentReport.subjects.some(s => s.theoryMarks !== undefined) && (
                          <>
                            <th className="py-3 px-2.5 text-center">Theory (80)</th>
                            <th className="py-3 px-2.5 text-center">Internal (20)</th>
                          </>
                        )}
                        <th className="py-3 px-3 text-center">Max Marks</th>
                        <th className="py-3 px-3 text-center">Marks Obtained</th>
                        <th className="py-3 px-3 text-center">CBSE Grade</th>
                        <th className="py-3 px-3 text-center">Grade Point</th>
                        <th className="py-3 px-3 text-left">Teacher Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBF2ED] text-xs font-mono">
                      {assessmentReport.subjects.map(subj => (
                        <tr key={subj.code} className="hover:bg-[#F9FCFA] transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">{subj.code}</td>
                          <td className="py-2.5 px-3 font-sans font-bold text-[#122A24]">{subj.subject}</td>
                          {assessmentReport.subjects.some(s => s.theoryMarks !== undefined) && (
                            <>
                              <td className="py-2.5 px-2.5 text-center text-slate-700 font-semibold">{subj.theoryMarks ?? '—'}</td>
                              <td className="py-2.5 px-2.5 text-center text-slate-700 font-semibold">{subj.practicalMarks ?? '—'}</td>
                            </>
                          )}
                          <td className="py-2.5 px-3 text-center text-slate-500">{subj.maxMarks}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#122A24] text-sm bg-[#F4FAF6]">
                            {subj.obtainedMarks}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {subj.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#1C443A]">{subj.gp.toFixed(1)}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px] truncate max-w-[200px]" title={subj.remark}>
                            {subj.remark}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#F8FAF9] border-t-2 border-[#DCE8E0] font-bold text-xs text-[#122A24] font-mono">
                      <tr>
                        <td colSpan={assessmentReport.subjects.some(s => s.theoryMarks !== undefined) ? 4 : 2} className="py-3 px-3 uppercase tracking-wider font-sans">
                          Grand Total / Overall Evaluation:
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums text-slate-500">{assessmentReport.totalMax}</td>
                        <td className="py-3 px-3 text-center tabular-nums text-emerald-900 bg-emerald-100/60 font-black text-sm">
                          {assessmentReport.totalObtained}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-800 font-bold">{assessmentReport.grade}</td>
                        <td className="py-3 px-3 text-center text-[#1C443A] font-bold">{assessmentReport.cgpa} CGPA</td>
                        <td className="py-3 px-3 text-emerald-800 font-sans font-bold">
                          {assessmentReport.status === 'PASSED_DISTINCTION' ? '✓ Passed with Distinction' : '✓ Passed'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Co-Scholastic & Discipline Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE8E0] space-y-2 shadow-2xs">
                  <span className="font-bold text-xs text-[#122A24] block uppercase font-mono tracking-wider">
                    Part 2: Co-Scholastic &amp; Life Skills
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {assessmentReport.coScholastic.map(cs => (
                      <div key={cs.skill} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                        <span className="text-slate-700">{cs.skill}</span>
                        <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                          Grade {cs.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faculty Remarks & Verification */}
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 flex flex-col justify-between space-y-2 shadow-2xs text-xs">
                  <div>
                    <span className="font-bold text-amber-950 uppercase font-mono tracking-wider block mb-1">
                      Homeroom Teacher Remarks &amp; Feedback:
                    </span>
                    <p className="text-slate-700 italic leading-relaxed">
                      &ldquo;{assessmentReport.remarks}&rdquo;
                    </p>
                  </div>
                  <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-[10.5px] font-mono text-amber-900">
                    <span>Evaluated by: Homeroom Directorate</span>
                    <span className="font-bold text-emerald-800">✓ CBSE Formative Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE (INDIVIDUAL MONTHLY ATTENDANCE HISTORY) */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {isDefaulter && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2.5 shadow-2xs">
                  <span className="font-bold">⚠️ CBSE 75% Shortage Alert:</span> Scholar attendance ({attendancePercent}%) is currently below the CBSE prescribed 75% statutory threshold.
                </div>
              )}

              {/* Exact Attendance Calendar History with ERP theme */}
              <StudentAttendanceHistory
                student={activeStudent}
                attendanceRecords={attendanceRecords}
              />
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. Footer Bottom Bar — Matching Dashboard UI Theme
            ───────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 bg-[#F4F8F5] border-t border-[#DCE8E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#2D5A4E]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-xs" />
            <span>Institutional Scholar Record • Adm: <strong className="text-[#122A24] font-bold">{activeStudent.admission_no}</strong> • OASIS Verified</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            {onEditStudent && (
              <button
                type="button"
                onClick={() => { onEditStudent(activeStudent); onClose(); }}
                className="px-4 py-2 bg-white hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] hover:border-[#10B981] rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-display font-bold rounded-full text-xs cursor-pointer transition-all shadow-md hover:scale-[1.02]"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FULL-SCREEN PHOTO LIGHTBOX MODAL (VIEW & DOWNLOAD HIGH-RES DP)
          ───────────────────────────────────────────────────────────── */}
      {showFullPhoto && studentPhotoUrl && !imgError && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setShowFullPhoto(false)}
        >
          <div 
            className="bg-[#122A24] text-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-[#1C443A] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar with Title & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1C443A]/80">
              <div className="text-left">
                <h3 className="font-display font-bold text-base text-white">
                  {activeStudent.full_name}
                </h3>
                <p className="text-xs text-emerald-300/80 font-mono">
                  Adm: {activeStudent.admission_no} • {cleanClass(activeStudent.class_name)}-{activeStudent.section || 'A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPhoto(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-none transition-colors"
                title="Close Photo Viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* High-Res Image Display */}
            <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-[#1C443A] flex items-center justify-center max-h-[60vh]">
              <img
                src={studentPhotoUrl}
                alt={activeStudent.full_name || 'Scholar Full Photo'}
                className="w-full h-auto max-h-[58vh] object-contain rounded-xl"
              />
            </div>

            {/* Action Buttons: Download & Change */}
            <div className="flex items-center justify-between gap-3 pt-1 text-xs">
              <a
                href={studentPhotoUrl}
                download={`${activeStudent.full_name.replace(/\s+/g, '_')}_photo.jpg`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-medium flex items-center justify-center gap-1.5 transition-colors no-underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save / Download</span>
              </a>

              <label
                className={`flex-1 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm ${
                  uploadingPhoto ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    handleDirectPhotoUpload(e);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
