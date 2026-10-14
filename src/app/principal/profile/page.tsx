/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Key,
  Camera,
  Upload,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { compressImageToBase64 } from '@/components/common/school-session-header';

export default function PrincipalProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const rawPrincipalAvatar = user?.photo || user?.avatar || school?.principal_avatar;
  const principalAvatar = (rawPrincipalAvatar && typeof rawPrincipalAvatar === 'string' && !rawPrincipalAvatar.includes('MEDIA-TCH-TCH-PRIN-DPS2026'))
    ? rawPrincipalAvatar
    : '';
  const schoolName = school?.school_name || school?.name || 'Delhi Public School';
  const schoolCode = school?.school_code || school?.id || 'DPS2026';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setFeedback(null);
      const base64 = await compressImageToBase64(file);

      const updatedUser = { ...(user || {}), avatar: base64, photo: base64 };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));

      if (school) {
        const updatedSchool = { ...school, principal_avatar: base64, avatar: base64 };
        setSchool(updatedSchool);
        localStorage.setItem('current_school', JSON.stringify(updatedSchool));
      }

      window.dispatchEvent(new CustomEvent('giterp_user_change', { detail: updatedUser }));
      window.dispatchEvent(new Event('storage'));

      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64, photo: base64, full_name: principalName })
        });
      } catch (_) {}

      setFeedback({ type: 'success', text: 'Principal profile picture updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to process picture. Please try another image.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      const updatedUser = { ...(user || {}), avatar: '', photo: '' };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));

      if (school) {
        const updatedSchool = { ...school, principal_avatar: '', avatar: '' };
        setSchool(updatedSchool);
        localStorage.setItem('current_school', JSON.stringify(updatedSchool));
      }

      window.dispatchEvent(new CustomEvent('giterp_user_change', { detail: updatedUser }));
      window.dispatchEvent(new Event('storage'));

      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: '', photo: '', full_name: principalName })
        });
      } catch (_) {}

      setFeedback({ type: 'success', text: 'Profile picture removed successfully.' });
    } finally {
      setIsUploading(false);
    }
  };

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
          Statutory executive credentials, institutional oversight status, and account settings.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. IDENTITY CARD
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
        {/* Banner */}
        <div
          className="h-36 p-6 flex items-end relative overflow-hidden"
          style={{
            backgroundColor: '#122A24',
            backgroundImage: 'radial-gradient(ellipse at 20% -10%, #1C443A 0%, #122A24 70%)',
            color: '#FFFFFF'
          }}
        >
          {/* Watermark typography in banner */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute -top-4 -left-2 font-watermark font-normal text-white/[0.08] text-[80px] sm:text-[110px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
            >
              Principal
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute -bottom-3 right-4 font-watermark font-normal text-white/[0.06] text-[70px] sm:text-[95px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
            >
              Governance
            </div>
          </div>

          <div className="relative z-10 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            CBSE Statutory Institutional Head
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              {/* Interactive Avatar with Camera Upload Badge */}
              <div className="w-24 h-24 rounded-3xl bg-[#122A24] text-white border-4 border-white shadow-md overflow-hidden relative shrink-0 group">
                {principalAvatar ? (
                  <img
                    src={principalAvatar}
                    alt={principalName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  style={{ display: principalAvatar ? 'none' : 'flex' }}
                  className="w-full h-full items-center justify-center text-3xl font-black bg-gradient-to-tr from-[#122A24] to-[#1C443A] text-white"
                >
                  {principalName.charAt(0)}
                </div>

                {/* Upload Trigger Badge */}
                <label
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-semibold gap-1"
                  title="Upload New Profile Picture"
                >
                  <Camera className="w-5 h-5 text-emerald-300" />
                  <span>Upload</span>
                </label>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />

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
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
                  </button>
                  {principalAvatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Reset to Initials"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
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
