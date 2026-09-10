/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export function ClearCTABanner() {
  const [inputVal, setInputVal] = useState('');
  const [showStickyMobile, setShowStickyMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA bar on mobile/tablet after scrolling past 350px
      if (window.scrollY > 350) {
        setShowStickyMobile(true);
      } else {
        setShowStickyMobile(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFastTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('demo_fast_track_submit', { has_value: !!inputVal.trim() });
    if (!inputVal.trim()) {
      router.push('/request-demo');
      return;
    }
    const isEmail = inputVal.includes('@');
    const param = isEmail ? `email=${encodeURIComponent(inputVal.trim())}` : `school=${encodeURIComponent(inputVal.trim())}`;
    router.push(`/request-demo?${param}`);
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          HIGH-CONVERTING BOTTOM CTA SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_20%_-10%,var(--board-2),var(--board-1)_70%)] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 mb-12 sm:mb-20 shadow-xl border border-white/15">
        {/* Subtle Background Elements */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] sm:text-xs font-mono text-emerald-300 mb-4 backdrop-blur-xs max-w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Onboarding Open for Academic Session 2026–2027</span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight mb-3 text-balance">
            Ready to Modernize Your School Campus?
          </h2>

          <p className="text-slate-200 text-xs sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto font-normal text-balance">
            Automate attendance roll calls, CBSE report cards, term fee invoicing, and live bus GPS tracking in one unified register.
          </p>

          {/* Interactive Fast-Track Input Form */}
          <form
            onSubmit={handleFastTrackSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2 max-w-xl mx-auto mb-6 p-2 sm:p-1.5 sm:pl-4 bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-full border border-white/20 shadow-lg"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter school name or official email..."
                aria-label="Enter school name or official email for fast-track demo"
                className="w-full px-4 py-3 text-xs sm:text-sm text-white placeholder-white/60 bg-white/5 sm:bg-transparent rounded-xl sm:rounded-none border border-white/15 sm:border-none focus:outline-none focus:ring-2 sm:focus:ring-0 focus:ring-emerald-400"
              />
            </div>
            <button
              type="submit"
              aria-label="Schedule Live School Demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold text-white bg-[var(--red-pen)] hover:bg-[#b03a24] transition-all shadow-md shrink-0 whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span>Schedule Live Demo</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          {/* Direct Action Alternatives */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-300 mb-8">
            <span>Already registered?</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-white hover:text-emerald-300 underline underline-offset-4 transition-colors"
            >
              <span>Access School Sign In</span>
              <span>🔐</span>
            </Link>
            <span className="text-white/40 hidden sm:inline">•</span>
            <Link
              href="/request-demo"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <span>View Onboarding Details →</span>
            </Link>
          </div>

          {/* Risk Reducers / Confidence Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/10 text-left">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-sm shrink-0">⚡</span>
              <span className="text-[11px] sm:text-xs text-slate-200 whitespace-nowrap">48-Hr Rapid Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-sm shrink-0">📥</span>
              <span className="text-[11px] sm:text-xs text-slate-200 whitespace-nowrap">Free Excel Migration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-sm shrink-0">🛡️</span>
              <span className="text-[11px] sm:text-xs text-slate-200 whitespace-nowrap">CBSE & APAAR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-sm shrink-0">🔒</span>
              <span className="text-[11px] sm:text-xs text-slate-200 whitespace-nowrap">DPDPA 2023 Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          STICKY MOBILE / TABLET QUICK-ACTION CONVERSION BAR
          Appears on scroll so users always have a clear action available
          ───────────────────────────────────────────────────────────── */}
      {showStickyMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-[var(--line)] p-2.5 sm:p-3 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom">
          <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <span className="font-display font-bold text-xs text-[var(--ink-navy)] block truncate">
                Giterp CBSE Suite
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                One platform for attendance, fees & marks
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[var(--ink-navy)] border border-slate-300 bg-white hover:bg-slate-50 no-underline shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                href="/request-demo"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--red-pen)] hover:bg-[#b03a24] no-underline shadow-2xs"
              >
                Request Demo →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
