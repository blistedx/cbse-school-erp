/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, Settings, Check, X, ChevronRight, Lock } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'giterp_cookie_consent_v1';

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check existing stored preferences
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CookiePreferences = JSON.parse(stored);
        setAnalyticsConsent(Boolean(parsed.analytics));
      } else {
        // First-time visitor: reveal banner smoothly
        const timer = setTimeout(() => {
          setVisible(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch (_) {
      // LocalStorage unavailable/incognito mode fallback
      setVisible(true);
    }

    // Custom event listener allowing any page or footer link to trigger preferences
    const handleOpenPreferences = () => {
      setVisible(true);
      setShowDetails(true);
    };

    // Keyboard Escape key handler for accessibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
        setShowDetails(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-cookie-preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-cookie-preferences', handleOpenPreferences);
    };
  }, []);

  const saveConsent = (analytics: boolean) => {
    try {
      const payload: CookiePreferences = {
        necessary: true,
        analytics,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setAnalyticsConsent(analytics);
      setVisible(false);
      setShowDetails(false);

      // Notify any active analytics listeners
      window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: payload }));
    } catch (_) {
      setVisible(false);
      setShowDetails(false);
    }
  };

  if (!mounted || !visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent Banner"
      role="dialog"
      aria-modal="true"
      className="fixed bottom-3 right-3 left-3 sm:left-auto sm:max-w-[480px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-2xl p-5 text-[var(--ink-navy)] overflow-hidden">
        {/* Top Decorative Header Accent */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--board-1)] text-emerald-300 flex items-center justify-center shrink-0 shadow-sm">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--ink-navy)] m-0 leading-tight">
                Institutional Privacy & Cookies
              </h3>
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                DPDPA 2023 · Zero Ad Trackers
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-md transition-colors bg-transparent border-none cursor-pointer"
            aria-label="Dismiss cookie notice temporarily"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Detailed Preferences View */}
        {showDetails ? (
          <div className="space-y-3.5 pt-1">
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Customize client-side storage preferences for this browser. Strictly essential security tokens cannot be disabled.
            </p>

            <div className="space-y-2.5">
              {/* Essential Tier (Locked) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--ink-navy)]">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Strictly Necessary Storage</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Always Active
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] m-0 leading-normal">
                  Encrypted tenant authentication sessions, CSRF safety tokens, and offline IndexedDB registers for roll-call entry during internet loss.
                </p>
              </div>

              {/* Analytics Tier (Toggleable) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--ink-navy)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Anonymous Performance Telemetry</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsConsent}
                      onChange={(e) => setAnalyticsConsent(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle anonymous performance telemetry"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--board-1)]"></div>
                  </label>
                </div>
                <p className="text-slate-500 text-[11px] m-0 leading-normal">
                  Privacy-preserving Vercel Web Analytics to track page performance and CBSE module load speed. Never contains student or minor identifiable data.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => saveConsent(analyticsConsent)}
                className="w-full sm:w-auto flex-1 py-2 px-3.5 rounded-lg bg-[var(--board-1)] text-white text-xs font-semibold hover:bg-[var(--board-2)] transition-all cursor-pointer border-none shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Save Preferences
              </button>
              <button
                type="button"
                onClick={() => saveConsent(true)}
                className="w-full sm:w-auto py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer bg-white"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          /* High-Level Overview View */
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              We use strictly necessary cookies for school authentication and offline roll-call sync. With your consent, we also gather anonymous speed telemetry. We <strong>never</strong> use advertising trackers or sell student records.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-1">
              <Link
                href="/privacy"
                className="text-[var(--board-2)] font-semibold underline hover:text-[var(--ink-navy)]"
              >
                Read Privacy Policy
              </Link>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-[var(--ink-navy)] bg-transparent border-none cursor-pointer p-0 font-medium"
              >
                <Settings className="w-3 h-3" />
                Customize
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => saveConsent(false)}
                className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 hover:text-[var(--ink-navy)] transition-all cursor-pointer bg-white text-center"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => saveConsent(true)}
                className="py-2 px-3 rounded-lg bg-[var(--board-1)] text-white text-xs font-semibold hover:bg-[var(--board-2)] transition-all cursor-pointer border-none shadow-sm text-center"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
