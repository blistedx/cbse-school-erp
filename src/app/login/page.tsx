/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          setSuccess('⚡ Access granted! Unlocking platform...');
        } else {
          setSuccess(`Welcome ${data.user?.full_name || data.user?.username}! Signing in...`);
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

  return (
    <div className="auth-split-layout relative overflow-hidden min-h-screen">
      {/* Left chalkboard panel (Desktop Only) */}
      <div className="panel relative overflow-hidden z-10">
        <MatrixRain theme="chalkboard" />

        <Link className="brand relative z-10 no-underline" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/giterp-logo.png" alt="Giterp Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm bg-[#122A24] border border-white/20 p-1" />
          <span className="brand-text text-white">
            Giterp
            <span className="text-emerald-300/80">Manage • Integrate • Grow</span>
          </span>
        </Link>

        <div className="panel-mid relative z-10 my-auto">
          <p className="eyebrow text-emerald-300/90 font-mono text-xs uppercase tracking-widest mb-3">
            Enterprise CBSE Platform
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
            Unified Portal for School Operations.
          </h1>
          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-md">
            Sign in to access student management, faculty workflows, live GPS fleet tracking, and real-time CBSE attendance registers.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/50 font-mono">
          &copy; {new Date().getFullYear()} Giterp ERP &bull; All rights reserved.
        </div>
      </div>

      {/* Right form panel: Clean, Modern, Minimal */}
      <div className="formside relative z-10 flex items-center justify-center p-6 sm:p-12 bg-[#FAF8F5]">
        <div className="card w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-[#E2ECE5] shadow-xl">
          {/* Mobile Brand Header with Official Giterp Logo & Name */}
          <div className="flex sm:hidden items-center justify-center gap-3 mb-6 pb-4 border-b border-[#E8F0EA]">
            <Link href="/" className="flex items-center gap-3 no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/giterp-logo.png"
                alt="Giterp Logo"
                className="w-10 h-10 rounded-xl object-contain shadow-xs bg-[#122A24] border border-[#1C443A] p-1"
              />
              <div className="text-left">
                <span className="font-display font-bold text-lg text-[#122A24] block leading-tight">
                  Giterp
                </span>
                <span className="text-[10px] font-mono text-[#2D5A4E] font-medium block uppercase tracking-wider">
                  School ERP Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#122A24] tracking-tight">Sign In</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your credentials to access your portal.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="field">
              <label htmlFor="schoolCode" className="block text-xs font-bold text-[#122A24] mb-1">School Code</label>
              <input
                type="text"
                id="schoolCode"
                name="schoolCode"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                placeholder="e.g. DPS2026 (Optional)"
                autoComplete="organization"
                style={{ textTransform: 'uppercase' }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5E2CF] focus:outline-none focus:ring-2 focus:ring-[#1C443A] text-sm"
              />
            </div>

            <div className="field">
              <label htmlFor="userId" id="idLabel" className="block text-xs font-bold text-[#122A24] mb-1">User ID / Staff ID / Admission No</label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. admin, teacher, student, driver"
                autoComplete="username"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5E2CF] focus:outline-none focus:ring-2 focus:ring-[#1C443A] text-sm"
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="block text-xs font-bold text-[#122A24] mb-1">Password / Passcode</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5E2CF] focus:outline-none focus:ring-2 focus:ring-[#1C443A] text-sm"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-[#C5E2CF] text-[#1C443A] focus:ring-[#1C443A]"
                />
                <span>Keep me signed in</span>
              </label>
              <a href="#" className="text-[#1C443A] hover:underline font-medium">Forgot password?</a>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none disabled:opacity-60 active:scale-[0.99] mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </form>

          {/* Clean Footer Links */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-5 mt-6 border-t border-[#E8F0EA]">
            <Link href="/" className="hover:text-[#122A24] font-medium transition-colors no-underline">
              &larr; Back to Home
            </Link>
            <Link href="/request-demo" className="hover:text-[#122A24] font-medium transition-colors no-underline">
              Request Demo &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
