/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Dedicated Smart QR Attendance Check-In Portal */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  QrCode,
  ScanLine,
  User,
  Building2,
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
  Phone,
  Camera,
  Layers
} from 'lucide-react';

function AttendanceScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const studentId = searchParams.get('student_id') || searchParams.get('id') || '';
  const admissionNo = searchParams.get('admission_no') || searchParams.get('adm') || '';
  const schoolId = searchParams.get('school_id') || 'DPS2026';
  const session = searchParams.get('session') || '2026-27';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual input fallback for guards/teachers
  const [manualAdm, setManualAdm] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  const executeScan = async (sId: string, adm: string) => {
    if (!sId && !adm) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: sId || undefined,
          admission_no: adm || undefined,
          school_id: schoolId,
          session: session
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Could not verify student record.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred while recording attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId || admissionNo) {
      executeScan(studentId, admissionNo);
    }
  }, [studentId, admissionNo]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAdm.trim()) return;
    setIsSearchingManual(true);
    executeScan('', manualAdm.trim()).finally(() => setIsSearchingManual(false));
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-slate-800 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] shadow-2xs hover:bg-[#EBF5EF] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open ERP Dashboard</span>
          </button>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#122A24] text-emerald-300 text-[10px] font-mono font-bold tracking-wider">
            <ScanLine className="w-3 h-3 text-emerald-400" />
            <span>SMART GATE SCAN</span>
          </span>
        </div>

        {/* Institution Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#122A24] uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>{result?.school?.school_name || 'CBSE Digital School'}</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-800 font-semibold">
            Biometric & QR Identity Roll • Session {session}
          </p>
        </div>

        {/* Scan Status Display */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-[#DCE8E0] shadow-sm text-center space-y-4 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 mx-auto flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#122A24]">Verifying Scholar Identity...</h3>
              <p className="text-xs text-slate-500 mt-1">Marking attendance for today in official database</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-6 border-2 border-rose-200 shadow-sm text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center text-rose-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-rose-900">Attendance Scan Failed</h3>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => executeScan(studentId, admissionNo)}
              className="px-4 py-2 rounded-xl bg-[#122A24] text-white text-xs font-bold cursor-pointer border-none shadow-xs hover:bg-[#1C443A]"
            >
              Try Again
            </button>
          </div>
        ) : result?.student ? (
          <div className="bg-white rounded-3xl border border-[#C5E2CF] shadow-lg overflow-hidden animate-scale-in">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#122A24] text-white p-4 text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-mono font-bold mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ATTENDANCE MARKED: PRESENT</span>
              </div>
              <h2 className="font-black text-xl tracking-tight font-display">
                {result.student.full_name}
              </h2>
              <p className="text-xs font-mono text-emerald-200 mt-0.5">
                {result.student.class_name} • Section {result.student.section || 'A'} • Roll #{result.student.roll_no || '1'}
              </p>
            </div>

            {/* Scholar Details with Picture */}
            <div className="p-5 space-y-4">
              
              <div className="flex items-center gap-4">
                {/* Photo */}
                <div className="w-20 h-24 rounded-2xl bg-slate-100 border-2 border-[#122A24] shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  {result.student.photo || result.student.avatar ? (
                    <img
                      src={result.student.photo || result.student.avatar}
                      alt={result.student.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#122A24] bg-emerald-50 w-full h-full font-mono font-bold text-xs">
                      <User className="w-8 h-8 text-emerald-700" />
                      <span className="text-[10px] mt-1">
                        {result.student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div className="flex-1 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Admission No:</span>
                    <strong className="text-[#122A24]">{result.student.admission_no || result.student.id}</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Scan Time:</span>
                    <strong className="text-emerald-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.attendance_summary?.time || new Date().toLocaleTimeString()}
                    </strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Date:</span>
                    <strong className="text-slate-700">{result.attendance_summary?.date} (TODAY)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <strong className="text-rose-600">{result.student.blood_group || 'O+'}</strong>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="p-3 bg-[#EBF5EF] rounded-2xl border border-[#C5E2CF] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left text-xs">
                  <strong className="text-[#122A24] block font-sans">Official CBSE Turnout Recorded</strong>
                  <span className="text-[11px] font-mono text-emerald-800">
                    Class Total Present: {result.attendance_summary?.total_present} / {result.attendance_summary?.total_students} Scholars
                  </span>
                </div>
              </div>

              {/* Guardian Contact quick alert */}
              {result.student.guardian_phone && (
                <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Guardian ({result.student.guardian_name || 'Parent'}):</span>
                  </span>
                  <strong>{result.student.guardian_phone}</strong>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] mx-auto flex items-center justify-center text-[#122A24]">
              <QrCode className="w-7 h-7 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#122A24]">Smart QR Attendance Gate</h3>
              <p className="text-xs text-slate-500 mt-1">
                Scan scholar ID card QR code or enter admission number below to mark attendance for today.
              </p>
            </div>
          </div>
        )}

        {/* Manual Admission Number Check-in */}
        <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Search className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-xs text-[#122A24] uppercase tracking-wider">
              Scan Next / Manual Admission Search
            </h4>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualAdm}
              onChange={(e) => setManualAdm(e.target.value)}
              placeholder="e.g. ADM2026-001 or ID"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isSearchingManual || !manualAdm.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#122A24] text-white font-bold text-xs cursor-pointer border-none hover:bg-[#1C443A] disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSearchingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
              <span>Mark</span>
            </button>
          </form>
        </div>

        {/* Date Footer */}
        <div className="text-center text-[11px] font-mono text-slate-400">
          {todayFormatted} • CBSE Auto-Attendance Cloud Engine
        </div>

      </div>
    </div>
  );
}

export default function AttendanceScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F8F5] flex items-center justify-center font-mono text-xs text-slate-500">Loading Smart QR Scanner...</div>}>
      <AttendanceScanContent />
    </Suspense>
  );
}
