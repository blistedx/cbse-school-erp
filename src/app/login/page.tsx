/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_INFO } from '@/lib/app-info';

// DYNAMIC MATRIX CODE RAIN / FALLING ALPHABETS CANVAS COMPONENT
function MatrixRain({ theme = 'chalkboard' }: { theme?: 'chalkboard' | 'light' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = Math.max(canvas.parentElement?.offsetWidth || 0, window.innerWidth));
    let height = (canvas.height = Math.max(canvas.parentElement?.offsetHeight || 0, window.innerHeight));

    // Rich alphabet + numbers + educational/mathematical symbols
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789π∑√Ωαβγλθ∞∫≈≠≤≥%&*#@!?$+-=';
    const charArray = characters.split('');
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = [];

    const initDrops = () => {
      if (!canvas) return;
      width = canvas.width = Math.max(canvas.parentElement?.offsetWidth || 0, window.innerWidth);
      height = canvas.height = Math.max(canvas.parentElement?.offsetHeight || 0, window.innerHeight);
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -60);
      }
    };
    initDrops();

    const handleResize = () => {
      initDrops();
    };
    window.addEventListener('resize', handleResize);

    let lastTime = 0;
    const fps = 32;
    const interval = 1000 / fps;

    const isLight = theme === 'light';

    const draw = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(draw);
      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      if (isLight) {
        // Translucent fading trail for light white background
        ctx.fillStyle = 'rgba(250, 248, 245, 0.16)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Translucent fading trail for dark chalkboard
        ctx.fillStyle = 'rgba(18, 42, 36, 0.12)';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.font = 'bold 13px "Courier New", Courier, monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0) {
          if (isLight) {
            // Light background: Crisp dark emerald head
            ctx.fillStyle = '#047857';
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 6;
            ctx.fillText(text, x, y);

            // Trail in soft light green
            ctx.fillStyle = '#059669';
            ctx.shadowBlur = 2;
            if (drops[i] > 1) {
              const trailChar = charArray[Math.floor(Math.random() * charArray.length)];
              ctx.fillText(trailChar, x, y - fontSize);
            }
          } else {
            // Dark Chalkboard: Bright Mint White Glow
            ctx.fillStyle = '#F0FDF4';
            ctx.shadowColor = '#34D399';
            ctx.shadowBlur = 10;
            ctx.fillText(text, x, y);

            // Body of the stream: Glowing Emerald Green
            ctx.fillStyle = '#10B981';
            ctx.shadowBlur = 4;
            if (drops[i] > 1) {
              const trailChar = charArray[Math.floor(Math.random() * charArray.length)];
              ctx.fillText(trailChar, x, y - fontSize);
            }
          }

          ctx.shadowBlur = 0;
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none z-0 ${
        theme === 'light'
          ? 'fixed inset-0 w-full h-full opacity-35'
          : 'absolute inset-0 w-full h-full opacity-45'
      }`}
      style={{ mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [schoolCode, setSchoolCode] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [buildInfo, setBuildInfo] = useState({
    buildNumber: APP_INFO.buildNumber,
    releaseTag: APP_INFO.releaseTag
  });

  // Forgot Passcode State
  const [viewMode, setViewMode] = useState<'LOGIN' | 'FORGOT_PASSCODE'>('LOGIN');
  const [forgotAccountType, setForgotAccountType] = useState<'SCHOOL' | 'AGENCY'>('SCHOOL');
  const [forgotSchoolCode, setForgotSchoolCode] = useState('');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotAgencyUsername, setForgotAgencyUsername] = useState('BLISTEDX');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<{ message: string; target_email: string; account_name?: string; is_agency?: boolean } | null>(null);

  useEffect(() => {
    // Dynamically fetch live server build info to bypass any local service-worker or browser cache
    fetch(`/api/app-info?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.buildNumber) {
          setBuildInfo({
            buildNumber: data.buildNumber,
            releaseTag: data.releaseTag || APP_INFO.releaseTag
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const cleanSchoolCode = schoolCode.trim().toUpperCase();
    const cleanUserId = userId.trim();
    const cleanPassword = password.trim();

    const isGod = cleanUserId.toLowerCase() === 'blistedx';
    const effectiveSchoolCode = cleanSchoolCode || 'DPS2026';

    if (!cleanUserId) {
      setError('User ID / Staff Code / Admission No is required.');
      setLoading(false);
      return;
    }
    if (!cleanPassword) {
      setError('Passcode / Password is required.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_code: effectiveSchoolCode,
          username: cleanUserId,
          password: cleanPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.user?.is_god_admin || data.user?.role === 'AGENCY_SUPERADMIN' || isGod) {
          setSuccess('⚡ GOD ACCESS GRANTED! Welcome Master BlistedX — Unlocking all schools on platform...');
        } else {
          setSuccess(`Authentication successful! Welcome ${data.user?.full_name || data.user?.username}...`);
        }
        localStorage.setItem('current_user', JSON.stringify({
          ...data.user,
          login_role: data.user.role
        }));
        localStorage.setItem('current_school', JSON.stringify(data.school));
        // Store signed session token for secure API calls
        if (data.session_token) {
          localStorage.setItem('erp_session_token', data.session_token);
        }
        setTimeout(() => {
          window.location.href = `/app?school=${encodeURIComponent(data.school?.school_code || effectiveSchoolCode || 'DPS2026')}`;
        }, 300);
      } else {
        setError(data.error || 'Authentication failed. Please verify your school code and credentials.');
      }
    } catch (err: any) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess(null);

    if (forgotAccountType === 'AGENCY') {
      const cleanAgencyUser = (forgotAgencyUsername || 'BLISTEDX').trim().toUpperCase();
      try {
        const res = await fetch('/api/auth/forgot-passcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_type: 'AGENCY_ADMIN',
            username: cleanAgencyUser
          })
        });

        const data = await res.json();
        if (data.success) {
          setForgotSuccess({
            message: data.message || `Master passcode generated and sent to ${data.target_email || 'b******x@gmail.com'}`,
            target_email: data.target_email || 'b******x@gmail.com',
            account_name: data.account_name || 'BlistedX (Agency Superadmin)',
            is_agency: true
          });
          setUserId('BLISTEDX');
          setSchoolCode('');
        } else {
          setForgotError(data.error || 'Failed to reset Agency Superadmin passcode.');
        }
      } catch (err: any) {
        setForgotError('Connection error: ' + err.message);
      } finally {
        setForgotLoading(false);
      }
      return;
    }

    // SCHOOL USER RECOVERY
    const cleanSchoolCode = forgotSchoolCode.trim().toUpperCase();
    const cleanUserId = forgotUserId.trim();

    if (!cleanSchoolCode) {
      setForgotError('School Code is required.');
      setForgotLoading(false);
      return;
    }
    if (!cleanUserId) {
      setForgotError('User ID / Admission No / Staff Code is required.');
      setForgotLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_type: 'SCHOOL',
          school_code: cleanSchoolCode,
          username: cleanUserId
        })
      });

      const data = await res.json();
      if (data.success) {
        setForgotSuccess({
          message: data.message || `New passcode generated and sent to ${data.target_email || 'b******x@gmail.com'}`,
          target_email: data.target_email || 'b******x@gmail.com',
          account_name: data.account_name,
          is_agency: false
        });
        setSchoolCode(cleanSchoolCode);
        setUserId(cleanUserId);
      } else {
        setForgotError(data.error || 'Failed to reset passcode. Please check your credentials.');
      }
    } catch (err: any) {
      setForgotError('Connection error: ' + err.message);
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <div className="auth-split-layout relative overflow-hidden min-h-screen">
      {/* Light Green Matrix Rain ONLY on Mobile Screen (< md) */}
      <div className="md:hidden">
        <MatrixRain theme="light" />
      </div>

      {/* Left chalkboard panel with live Falling Matrix Alphabets (Desktop Only) */}
      <div className="panel relative overflow-hidden z-10">
        <MatrixRain theme="chalkboard" />

        <svg className="doodle p1 relative z-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="22" r="12" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M18 10c1-4 4-6 7-6" stroke="#C4432B" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="doodle p2 relative z-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="17" width="28" height="6" rx="2" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M10 17v6M16 17v6M22 17v6M28 17v6" stroke="#FFFFFF" strokeWidth="1.4" />
        </svg>

        <Link className="brand relative z-10" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/giterp-logo.png" alt="Giterp Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm bg-[#122A24] border border-white/20 p-1" />
          <span className="brand-text">
            Giterp
            <span>Manage • Integrate • Grow</span>
          </span>
        </Link>

        <div className="panel-mid relative z-10">
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
            Enter your school code first, then sign in with your User ID / Employee Code and password. Your role and workspace will be assigned automatically.
          </p>
        </div>

        <div className="stamp-mini relative z-10">
          <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="80" r="70" stroke="#C4432B" strokeWidth="3" strokeDasharray="4 6" />
            <circle cx="80" cy="80" r="58" stroke="#C4432B" strokeWidth="2" />
            <text x="80" y="93" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="40" fill="#C4432B">
              A+
            </text>
          </svg>
        </div>
      </div>

      {/* Right form panel (Clean on Desktop & Mobile with classic boxes) */}
      <div className="formside relative z-10">
        <div className="card">
          {/* Mobile Brand Header with Official Giterp Logo & Name */}
          <div className="flex sm:hidden items-center justify-center gap-3 mb-5 pb-3.5 border-b border-[#E8F0EA]">
            <Link href="/" className="flex items-center gap-3 no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/giterp-logo.png"
                alt="Giterp Logo"
                className="w-11 h-11 rounded-xl object-contain shadow-xs bg-[#122A24] border border-[#1C443A] p-1"
              />
              <div className="text-left">
                <span className="font-display font-bold text-xl text-[#122A24] block leading-tight tracking-tight">
                  Giterp
                </span>
                <span className="text-[10px] font-mono text-[#2D5A4E] font-medium block uppercase tracking-wider">
                  Manage • Integrate • Grow
                </span>
              </div>
            </Link>
          </div>

          {viewMode === 'LOGIN' ? (
            <>
              <p className="kicker">Hall pass required</p>
              <h2>Sign in</h2>
              <p className="sub">Enter your school code, user ID and password to proceed.</p>

              <form onSubmit={handleLogin}>
                <div className="field">
                  <label htmlFor="schoolCode">School Code</label>
                  <input
                    type="text"
                    id="schoolCode"
                    name="schoolCode"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    autoComplete="organization"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <p className="hint">Enter the official School Code provided by your institution</p>
                </div>

                <div className="field">
                  <label htmlFor="userId" id="idLabel">User ID / Staff Code / Admission No</label>
                  <input
                    type="text"
                    id="userId"
                    name="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoComplete="username"
                    required
                  />
                  <p className="hint" id="idHint">Your official login ID, Employee Code, or Admission Number</p>
                </div>

                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Passcode / Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', color: '#1B4D3E', fontSize: '11px', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyGod = (userId || '').trim().toLowerCase() === 'blistedx';
                      setForgotAccountType(isCurrentlyGod ? 'AGENCY' : 'SCHOOL');
                      setForgotSchoolCode(schoolCode || 'DPS2026');
                      setForgotUserId(userId || '');
                      setForgotAgencyUsername('BLISTEDX');
                      setForgotError('');
                      setForgotSuccess(null);
                      setViewMode('FORGOT_PASSCODE');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C4432B',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot passcode?
                  </button>
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
                  {loading ? 'Authenticating...' : 'Sign in to ERP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="kicker" style={{ color: '#C4432B' }}>Passcode Recovery</p>
              <h2>Forgot Passcode</h2>
              <p className="sub">
                {forgotAccountType === 'AGENCY'
                  ? 'Agency Superadmin Master Recovery. New passcode will be dispatched to your hidden email.'
                  : 'Enter your School Code and User ID. A new security password will be sent to your hidden email.'}
              </p>

              {/* Seamless Tab Switcher: School User vs Agency Admin */}
              <div style={{
                display: 'flex',
                background: '#EAEFEA',
                borderRadius: '10px',
                padding: '4px',
                margin: '16px 0 20px 0',
                gap: '6px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotAccountType('SCHOOL');
                    setForgotError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: forgotAccountType === 'SCHOOL' ? '700' : '600',
                    background: forgotAccountType === 'SCHOOL' ? '#FFFFFF' : 'transparent',
                    color: forgotAccountType === 'SCHOOL' ? '#122A24' : '#52796F',
                    boxShadow: forgotAccountType === 'SCHOOL' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🏫 School User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotAccountType('AGENCY');
                    setForgotError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: forgotAccountType === 'AGENCY' ? '700' : '600',
                    background: forgotAccountType === 'AGENCY' ? '#122A24' : 'transparent',
                    color: forgotAccountType === 'AGENCY' ? '#FFFFFF' : '#52796F',
                    boxShadow: forgotAccountType === 'AGENCY' ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ⚡ Agency Admin
                </button>
              </div>

              {forgotSuccess ? (
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '10px',
                  padding: '20px',
                  margin: '20px 0',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#10B981',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    margin: '0 auto 12px auto'
                  }}>
                    ✓
                  </div>
                  <h4 style={{ color: '#065F46', margin: '0 0 6px', fontSize: '16px', fontWeight: 'bold' }}>
                    Passcode Reset Successful!
                  </h4>
                  <p style={{ color: '#047857', fontSize: '13px', margin: '0 0 14px', lineHeight: 1.5 }}>
                    A new security password has been sent to hidden email: <strong>{forgotSuccess.target_email || 'b******x@gmail.com'}</strong>. Please check your inbox and sign in.
                  </p>
                  {forgotSuccess.account_name && (
                    <div style={{ margin: '0 0 16px' }}>
                      <span style={{ color: '#065F46', fontSize: '12px', background: '#D1FAE5', padding: '6px 12px', borderRadius: '6px', fontWeight: '600' }}>
                        Account: {forgotSuccess.account_name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('LOGIN');
                      setPassword('');
                      setError('');
                      setSuccess(`Enter the new passcode sent to ${forgotSuccess.target_email || 'b******x@gmail.com'} to sign in.`);
                    }}
                    className="submit"
                    style={{ width: '100%' }}
                  >
                    Sign in with New Passcode →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasscode}>
                  {forgotAccountType === 'AGENCY' ? (
                    <>
                      <div className="field">
                        <label htmlFor="forgotAgencyUsername">Agency Master Username / ID</label>
                        <input
                          type="text"
                          id="forgotAgencyUsername"
                          name="forgotAgencyUsername"
                          value={forgotAgencyUsername}
                          onChange={(e) => setForgotAgencyUsername(e.target.value)}
                          autoComplete="username"
                          style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
                          required
                        />
                        <p className="hint">Master Agency Superadmin ID (e.g. BLISTEDX)</p>
                      </div>

                      <div style={{
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '18px',
                        fontSize: '12px',
                        color: '#78350F',
                        lineHeight: '1.4'
                      }}>
                        ⚡ <strong>Agency Master Recovery:</strong> A new security passcode will be securely dispatched to the confidential registered email: <strong>b******x@gmail.com</strong>.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="field">
                        <label htmlFor="forgotSchoolCode">School Code</label>
                        <input
                          type="text"
                          id="forgotSchoolCode"
                          name="forgotSchoolCode"
                          value={forgotSchoolCode}
                          onChange={(e) => setForgotSchoolCode(e.target.value)}
                          autoComplete="organization"
                          style={{ textTransform: 'uppercase' }}
                          required
                        />
                        <p className="hint">The official code of your school (e.g. DPS2026)</p>
                      </div>

                      <div className="field">
                        <label htmlFor="forgotUserId">User ID / Staff Code / Admission No</label>
                        <input
                          type="text"
                          id="forgotUserId"
                          name="forgotUserId"
                          value={forgotUserId}
                          onChange={(e) => setForgotUserId(e.target.value)}
                          autoComplete="username"
                          required
                        />
                        <p className="hint">Your login ID, employee code, or admission number</p>
                      </div>

                      <div style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '18px',
                        fontSize: '12px',
                        color: '#92400E',
                        lineHeight: '1.4'
                      }}>
                        📧 <strong>Notice:</strong> For security verification, the new password will be dispatched to your registered hidden email (e.g. <strong>b******x@gmail.com</strong>).
                      </div>
                    </>
                  )}

                  {forgotError && (
                    <p className="status-msg" style={{ color: '#C4432B', marginBottom: '16px' }}>
                      {forgotError}
                    </p>
                  )}

                  <button type="submit" className="submit" disabled={forgotLoading} style={{ background: '#C4432B' }}>
                    <span className="stamp-icon">{forgotAccountType === 'AGENCY' ? '⚡' : '🔐'}</span>
                    {forgotLoading ? 'Generating & Sending Passcode...' : forgotAccountType === 'AGENCY' ? 'Send Master Passcode' : 'Send New Passcode'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('LOGIN');
                        setForgotError('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1C443A',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        textDecoration: 'underline'
                      }}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <Link className="back" href="/">← Back to Giterp</Link>
          <Link className="back" href="/request-demo" style={{ marginTop: '8px' }}>
            New school? Request a demo →
          </Link>

          <div
            style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #E2ECE5', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#52796F' }}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', marginRight: '6px' }} />
            Build #{buildInfo.buildNumber} • {buildInfo.releaseTag}
          </div>
        </div>
      </div>
    </div>
  );
}
