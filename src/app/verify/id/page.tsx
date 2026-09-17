/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Public Digital Identity Verification Portal */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Phone,
  Droplet,
  User,
  GraduationCap,
  MapPin,
  RefreshCw,
  QrCode,
  ScanLine,
  Lock,
  ArrowRight,
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';

function VerifyIdContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id') || searchParams.get('id') || '';
  const admissionNo = searchParams.get('admission_no') || searchParams.get('adm') || '';
  const schoolId = searchParams.get('school_id') || 'DPS2026';
  const type = searchParams.get('type') || 'STUDENT';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerification() {
      if (!studentId && !admissionNo) {
        setError('Missing Student ID or Admission Number in scan payload.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/verify/id?student_id=${encodeURIComponent(studentId)}&admission_no=${encodeURIComponent(admissionNo)}&school_id=${encodeURIComponent(schoolId)}&type=${encodeURIComponent(type)}`
        );
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || 'Student credential could not be verified.');
        }
      } catch (err: any) {
        setError(err.message || 'Network error while contacting school registry.');
      } finally {
        setLoading(false);
      }
    }

    fetchVerification();
  }, [studentId, admissionNo, schoolId, type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1F1A] text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <ShieldCheck className="w-7 h-7 text-emerald-400 absolute inset-0 m-auto" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-emerald-300">Verifying Digital Credential</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">Connecting to CBSE School Registry Vault...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="min-h-screen bg-[#0E1F1A] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#162D26] border border-rose-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-black text-xl text-rose-300">Verification Unsuccessful</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {error || 'The requested student or employee ID record does not exist in the institutional registry.'}
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs no-underline transition-colors shadow-sm"
            >
              <span>Back to School Portal</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { school, profile, verified_at } = data;
  const isStudent = data.type === 'STUDENT';
  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ID';

  const formattedVerifyDate = new Date(verified_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E1F1A] via-[#122A24] to-[#0A1612] text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans">
      
      {/* Top Branding Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-4 border-b border-emerald-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-white tracking-tight leading-tight">
              {school.name}
            </h1>
            <p className="text-[10px] font-mono text-emerald-400">
              CBSE Affil No: {school.affiliation_no}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>VERIFIED</span>
        </div>
      </header>

      {/* Main Verification ID Card */}
      <main className="max-w-md w-full mx-auto my-6 space-y-4 animate-scale-in">
        
        {/* Verification Success Pill */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-emerald-200">Official Student Identity</div>
            <div className="text-[10px] font-mono text-emerald-400/80">Verified on {formattedVerifyDate}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-mono text-[9px] font-bold">
            ACTIVE
          </span>
        </div>

        {/* Digital Identity Pass Box */}
        <div className="bg-white text-slate-800 rounded-3xl p-6 shadow-2xl border-2 border-[#122A24] space-y-5 relative overflow-hidden">
          
          {/* Watermark Crest */}
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <Award className="w-52 h-52 text-[#122A24]" />
          </div>

          {/* School Header */}
          <div className="text-center border-b border-slate-200 pb-3">
            <div className="font-display font-black text-base text-[#122A24] uppercase tracking-tight">
              {school.name}
            </div>
            <div className="text-[10px] font-mono text-emerald-800 font-bold">
              Affiliation: {school.affiliation_no} • Session {profile.academic_session || '2026-27'}
            </div>
            <div className="text-[9px] text-slate-500">{school.address}</div>
          </div>

          {/* Photo & Identity Core */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-22 h-26 rounded-2xl bg-slate-100 border-2 border-[#122A24] flex items-center justify-center text-[#122A24] overflow-hidden shadow-sm">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-emerald-100 to-emerald-200 flex flex-col items-center justify-center">
                    <span className="font-display font-black text-2xl text-emerald-900">{initials}</span>
                    <span className="text-[8px] font-mono font-bold text-emerald-800">{isStudent ? 'STUDENT' : 'FACULTY'}</span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 bg-emerald-700 text-white text-[9px] font-mono font-bold rounded-full shadow-xs">
                {profile.blood_group || 'O+'}
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="font-display font-black text-lg text-[#122A24] leading-snug truncate">
                {profile.full_name}
              </h2>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#122A24] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                {isStudent
                  ? `${profile.class_name} - ${profile.section} • Roll #${profile.roll_no}`
                  : `${profile.designation} • ${profile.department}`}
              </div>
              <div className="text-xs font-mono text-slate-600">
                <span className="text-slate-400">Adm No:</span> <strong className="text-[#122A24]">{profile.admission_no || profile.employee_code}</strong>
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs font-mono">
            {isStudent ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date of Birth:</span>
                  <strong className="text-[#122A24]">{profile.dob}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Guardian Name:</span>
                  <strong className="text-[#122A24] truncate max-w-[170px]">{profile.guardian_name}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Emergency Contact:</span>
                  <strong className="text-emerald-800 font-bold">{profile.guardian_phone}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Blood Group:</span>
                  <strong className="text-[#122A24]">{profile.blood_group}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">House / Area:</span>
                  <strong className="text-[#122A24] truncate max-w-[170px]">{profile.house ? `${profile.house} • ` : ''}{profile.address}</strong>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Employee Code:</span>
                  <strong className="text-[#122A24]">{profile.employee_code}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Department:</span>
                  <strong className="text-[#122A24]">{profile.department}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phone:</span>
                  <strong className="text-emerald-800 font-bold">{profile.phone}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date of Joining:</span>
                  <strong className="text-[#122A24]">{profile.date_of_joining}</strong>
                </div>
              </>
            )}
          </div>

          {/* Security & Verification Notice */}
          <div className="p-3 bg-[#EBF5EF] rounded-xl border border-[#C5E2CF] flex items-start gap-2.5 text-[11px] text-emerald-950 leading-relaxed font-sans">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong>Certified Digital Identity Record.</strong> Normal QR scan displays verified scholar details only. To record campus attendance, use the official School Gatekeeper Terminal.
            </div>
          </div>

          {/* School Contact Hotline */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Helpline: {school.phone}</span>
            <span>{school.email}</span>
          </div>

        </div>

        {/* Staff Gate Scanner Access Button */}
        <div className="pt-2 flex flex-col gap-2">
          <a
            href="/attendance/scan"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md border-none flex items-center justify-center gap-2 no-underline transition-colors"
          >
            <ScanLine className="w-4 h-4 text-emerald-200" />
            <span>Open Staff ERP Attendance Gate Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <a
            href="/app"
            className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs border border-white/10 flex items-center justify-center gap-2 no-underline transition-colors"
          >
            <span>Return to ERP Dashboard</span>
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[10px] font-mono text-emerald-600/70 pt-4 border-t border-emerald-900/40">
        © {new Date().getFullYear()} {school.name} • Certified CBSE Enterprise Core
      </footer>

    </div>
  );
}

export default function VerifyIdPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0E1F1A] text-white flex items-center justify-center p-4">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyIdContent />
    </Suspense>
  );
}
