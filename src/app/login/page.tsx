'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Role = 'Admin' | 'Teacher' | 'Student' | 'Parent';

const roleCopy: Record<Role, { label: string; hint: string; placeholder: string }> = {
  Admin: { label: 'Staff ID', hint: "psst — it's on your staff card", placeholder: 'e.g. APS-0142' },
  Teacher: { label: 'Staff ID', hint: "psst — it's on your staff card", placeholder: 'e.g. APS-T-118' },
  Student: { label: 'Admission Number', hint: 'check your fee card, top right', placeholder: 'e.g. APS-24-0876' },
  Parent: { label: "Ward's Admission Number", hint: 'same number as the fee card', placeholder: 'e.g. APS-24-0876' }
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('Admin');
  const [schoolCode, setSchoolCode] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentRoleMeta = roleCopy[selectedRole];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_code: schoolCode.trim().toUpperCase(),
          username: userId.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Authentication successful! Loading ERP workspace...');
        localStorage.setItem('current_user', JSON.stringify(data.user));
        localStorage.setItem('current_school', JSON.stringify(data.school));
        setTimeout(() => {
          router.push(`/app?school=${data.school?.school_code || schoolCode}`);
        }, 600);
      } else {
        setError(data.error || 'Authentication failed. Please verify your school code and credentials.');
      }
    } catch (err: any) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left chalkboard panel */}
      <div className="panel">
        <svg className="doodle p1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="22" r="12" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M18 10c1-4 4-6 7-6" stroke="#C4432B" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="doodle p2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="17" width="28" height="6" rx="2" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M10 17v6M16 17v6M22 17v6M28 17v6" stroke="#FFFFFF" strokeWidth="1.4" />
        </svg>

        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="EduGit Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm border border-white/20" />
          <span className="brand-text">
            EduGit
            <span>School ERP, one register per school</span>
          </span>
        </Link>

        <div className="panel-mid">
          <p className="eyebrow">Restricted Access</p>
          <h1>
            One login,{' '}
            <span className="underline">
              any school
              <svg viewBox="0 0 160 12" preserveAspectRatio="none">
                <path d="M2 8 Q40 2 80 7 T158 5" stroke="#C4432B" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>{' '}
            on the platform.
          </h1>
          <p>
            Enter your school code first — it's on the letter your school received when it was set up — then sign in with your own ID.
          </p>
        </div>

        <div className="stamp-mini">
          <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="80" r="70" stroke="#C4432B" strokeWidth="3" strokeDasharray="4 6" />
            <circle cx="80" cy="80" r="58" stroke="#C4432B" strokeWidth="2" />
            <text x="80" y="93" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="40" fill="#C4432B">
              A+
            </text>
          </svg>
        </div>
      </div>

      {/* Right form panel */}
      <div className="formside">
        <div className="card">
          <p className="kicker">Hall pass required</p>
          <h2>Sign in</h2>
          <p className="sub">Enter your school code, then choose your role.</p>

          <div className="field">
            <label htmlFor="schoolCode">School code</label>
            <input
              type="text"
              id="schoolCode"
              name="schoolCode"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="e.g. VDY-APS-014"
              autoComplete="organization"
              required
              style={{ textTransform: 'uppercase' }}
            />
            <p className="hint">issued when your school was set up</p>
          </div>

          <div className="roles" role="tablist" aria-label="Login role">
            {(['Admin', 'Teacher', 'Student', 'Parent'] as const).map((role) => (
              <button
                key={role}
                type="button"
                className={selectedRole === role ? 'active' : ''}
                onClick={() => setSelectedRole(role)}
                aria-pressed={selectedRole === role}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="userId" id="idLabel">{currentRoleMeta.label}</label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={currentRoleMeta.placeholder}
                autoComplete="username"
                required
              />
              <p className="hint" id="idHint">{currentRoleMeta.hint}</p>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="row-between">
              <label>
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{' '}
                Keep me signed in
              </label>
              <a href="#">Forgot password?</a>
            </div>

            {error && (
              <p className="status-msg" style={{ color: '#C4432B', marginBottom: '16px' }}>
                {error}
              </p>
            )}

            {success && (
              <p className="status-msg" style={{ color: '#1C443A', marginBottom: '16px' }}>
                {success}
              </p>
            )}

            <button type="submit" className="submit" disabled={loading}>
              <span className="stamp-icon">✓</span>
              {loading ? 'Authenticating...' : `Sign in as ${selectedRole}`}
            </button>
          </form>

          <Link className="back" href="/">← Back to EduGit</Link>
          <Link className="back" href="/request-demo" style={{ marginTop: '8px' }}>
            New school? Request a demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
