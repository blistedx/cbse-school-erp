/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  ShieldCheck,
  School,
  Lock,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Building2,
  CheckCircle2,
  Key
} from 'lucide-react';

export default function PrincipalProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem('current_user');
      const s = localStorage.getItem('current_school');
      if (u) setUser(JSON.parse(u));
      if (s) setSchool(JSON.parse(s));
    } catch (_) {}
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('erp_session_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('current_school');
      document.cookie = 'erp_session_token=; path=/; max-age=0; SameSite=Lax';
    } catch (_) {}
    router.push('/login');
  };

  const principalName = user?.full_name || school?.principal_name || 'Dr. Abhishek Shukla';
  const schoolName = school?.school_name || school?.name || 'Delhi Public School';
  const schoolCode = school?.school_code || school?.id || 'DPS2026';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER
          ───────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
          Principal Profile &amp; Governance Credentials
        </h1>
        <p className="text-xs sm:text-sm text-[#2D5A4E] mt-0.5">
          Statutory executive credentials and institution oversight status.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. IDENTITY CARD
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-linear-to-r from-[#122A24] via-[#1C443A] to-[#122A24] p-6 flex items-end">
          <div className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
            CBSE Statutory Institutional Head
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-3xl bg-[#122A24] text-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-black">
                {principalName.charAt(0)}
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#122A24]">
                    {principalName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    VERIFIED
                  </span>
                </div>
                <div className="text-xs text-[#2D5A4E] font-medium font-mono">
                  Principal &amp; Head of Institution
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-end"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Portal</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#DCE8E0]">
            <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5] space-y-2 text-xs">
              <div className="font-bold text-[#122A24] flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-700" />
                <span>Affiliated Institution</span>
              </div>
              <div>School: <strong>{schoolName}</strong></div>
              <div className="font-mono">School Code: <strong>{schoolCode}</strong></div>
              <div>Affiliation Board: <strong>Central Board of Secondary Education (CBSE)</strong></div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5] space-y-2 text-xs">
              <div className="font-bold text-[#122A24] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Executive Scope &amp; Access Role</span>
              </div>
              <div>System Role: <strong className="font-mono text-emerald-800">PRINCIPAL</strong></div>
              <div>Authorities: <strong>Reports View, Petitions Approval, Broadcast Notices</strong></div>
              <div>Data Integrity: <strong>Zero Data Entry / Zero Fee Collection</strong></div>
            </div>
          </div>

          {/* Security & Multi-Tenant Boundary Sealed */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong>Multi-Tenant Boundary Active:</strong> All queries and report calculations are cryptographically restricted to school tenant <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">{schoolCode}</code>. Cross-school inspection is prohibited under CBSE ERP security protocols.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
