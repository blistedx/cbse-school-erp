/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Giterp Application Error Caught]:', error);
  }, [error]);

  const handleClearAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.location.reload();
      }
    } catch (_) {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-[#122A24] text-white flex items-center justify-center p-4 font-sans antialiased">
      <div className="max-w-md w-full bg-white/5 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 text-2xl mx-auto shadow-xs">
          ⚠️
        </div>

        <div>
          <h2 className="font-display font-bold text-xl text-white">Application Refresh Required</h2>
          <p className="text-xs text-emerald-200/80 font-mono mt-1">
            An update was deployed or your session needed refreshing.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-[11px] font-mono text-slate-300 text-left overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleClearAndReload}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs cursor-pointer border-none shadow-md transition-colors"
          >
            ↻ Reload Application
          </button>
          <Link
            href="/login"
            className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs text-center border border-white/20 transition-colors"
          >
            ← Return to Login
          </Link>
        </div>

        <p className="text-[10px] text-slate-400 font-mono">
          Giterp Multi-School ERP • Auto-Recovery Active
        </p>
      </div>
    </div>
  );
}
