'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Building2,
  GraduationCap
} from 'lucide-react';

interface TeacherProfile {
  id: string;
  staff_code?: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  subject_specialization?: string[];
  is_class_teacher?: boolean;
  class_teacher_section?: { class_name: string; section: string };
  allocated_subjects?: Array<{ class_name: string; section: string; subject_name: string }>;
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/me');
      const data = await res.json();
      if (data.success && data.teacher) {
        setProfile({
          ...data.teacher,
          is_class_teacher: data.is_class_teacher,
          class_teacher_section: data.class_teacher_section,
          allocated_subjects: data.allocated_subjects || []
        });
        setFullName(data.teacher.full_name || '');
        setEmail(data.teacher.email || '');
        setPhone(data.teacher.phone || '');
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passcode and confirm passcode do not match.' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'Passcode must be at least 6 characters long.' });
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, string> = {
        full_name: fullName,
        email,
        phone
      };

      if (newPassword) {
        payload.new_password = newPassword;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Your teacher profile has been updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#122A24] text-white p-6 rounded-2xl shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Teacher Credentials
            </span>
            {profile?.staff_code && (
              <span className="text-emerald-300/80 text-xs font-mono">Code: {profile.staff_code}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Faculty Profile &amp; Settings</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Review your academic appointments, contact particulars, and update account security.
          </p>
        </div>

        <button
          onClick={fetchProfile}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
          Loading faculty profile...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Academic Badges & Assignments */}
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-inner">
                {profile?.full_name?.charAt(0) || 'T'}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{profile?.full_name}</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{profile?.designation || 'Faculty Member'}</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">{profile?.department || 'Academics Department'}</p>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                {profile?.is_class_teacher && profile.class_teacher_section && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-[#122A24]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Class Teacher: {profile.class_teacher_section.class_name}-{profile.class_teacher_section.section}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {profile?.allocated_subjects?.length || 0} Subject Allocations
                </span>
              </div>
            </div>

            {/* Allocated Subjects */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Teaching Load Allocations
              </h3>

              {!profile?.allocated_subjects || profile.allocated_subjects.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No subject allocations recorded.</p>
              ) : (
                <div className="space-y-2">
                  {profile.allocated_subjects.map((alloc, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{alloc.subject_name}</p>
                        <p className="text-[11px] text-gray-500">Class {alloc.class_name} - Sec {alloc.section || 'A'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Profile Edit & Passcode Update */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Personal Particulars &amp; Passcode
              </h3>

              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                    Faculty Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      Email Address:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      Contact Mobile:
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Password / Passcode Update */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Change Security Passcode
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        New Passcode:
                      </label>
                      <input
                        type="password"
                        placeholder="Leave blank to retain current"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Confirm Passcode:
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter new passcode"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Updating...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
