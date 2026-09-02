/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Role = 'Admin' | 'Teacher' | 'Student' | 'Parent';

const roleCopy: Record<Role, { label: string; hint: string; placeholder: string }> = {
  Admin: { label: 'Staff ID', hint: "psst — it's on your staff card", placeholder: 'e.g. APS-0142' },
  Teacher: { label: 'Staff ID', hint: "psst — it's on your staff card", placeholder: 'e.g. APS-T-118' },
  Student: { label: 'Admission Number', hint: 'check your fee card, top right', placeholder: 'e.g. APS-24-0876' },
  Parent: { label: "Ward's Admission Number", hint: 'same number as the fee card', placeholder: 'e.g. APS-24-0876' }
};

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

    const isGod = userId.trim().toLowerCase() === 'blistedx';
    const effectiveSchoolCode = schoolCode.trim().toUpperCase() || (isGod ? 'DPS2026' : '');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_code: effectiveSchoolCode,
          username: userId.trim(),
          password: password.trim(),
          role: selectedRole.toUpperCase()
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.user?.is_god_admin || data.user?.role === 'AGENCY_SUPERADMIN' || isGod) {
          setSuccess('⚡ GOD ACCESS GRANTED! Welcome Master BlistedX — Unlocking all schools on platform...');
        } else {
          setSuccess('Authentication successful! Loading ERP workspace...');
        }
        localStorage.setItem('current_user', JSON.stringify({
          ...data.user,
          // Persist the authenticated login role separately so push subscriptions
          // always register with the correct role even if the display role changes
          // (e.g. admin previewing as student/teacher).
          login_role: data.user.role
        }));
        localStorage.setItem('current_school', JSON.stringify(data.school));
        // Store signed session token for secure API calls
        if (data.session_token) {
          localStorage.setItem('erp_session_token', data.session_token);
        }
        setTimeout(() => {
          router.push(`/app?school=${data.school?.school_code || effectiveSchoolCode || 'DPS2026'}`);
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
            Enter your school code first — it's on the letter your school received when it was set up — then sign in with your own ID.
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
              required={userId.trim().toLowerCase() !== 'blistedx'}
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

          <Link className="back" href="/">← Back to Giterp</Link>
          <Link className="back" href="/request-demo" style={{ marginTop: '8px' }}>
            New school? Request a demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
