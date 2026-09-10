/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: '404 — Page Not Found | Giterp School ERP',
  description: 'The school register, classroom, or document you are looking for does not exist or has been relocated.'
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--parchment)] text-[var(--text-dark)] font-sans antialiased flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-white/90 backdrop-blur-md py-3.5 px-4 sm:px-8">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/giterp-logo.png"
              alt="Giterp Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-xs bg-[#122A24] border border-[#122A24]/30 p-1 shrink-0"
            />
            <div>
              <span className="font-display font-semibold text-base text-[var(--ink-navy)] tracking-tight block">
                Giterp
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[1px] text-[var(--board-2)] block -mt-0.5 opacity-85">
                School ERP Suite
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-navy)] border border-slate-300 bg-white hover:bg-slate-50 transition-colors no-underline shadow-2xs"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main 404 Presentation */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Subtle Chalkboard Top Strip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--board-1)]" />

          {/* 404 Stamp Graphic */}
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-2xl bg-[var(--parchment)] border-2 border-dashed border-[var(--red-pen)] flex items-center justify-center mx-auto shadow-xs">
              <span className="font-mono font-bold text-3xl text-[var(--red-pen)]">404</span>
            </div>
            <span className="absolute -bottom-1 -right-2 bg-[var(--red-pen)] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              Absence
            </span>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--ink-navy)] tracking-tight mb-2">
            Classroom or Page Not Found
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
            The school register, timetable, or portal URL you requested does not exist or has been relocated to another academic wing.
          </p>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 text-left">
            <Link
              href="/"
              className="p-3 rounded-xl border border-slate-200 bg-[var(--parchment)] hover:border-[var(--board-2)] hover:bg-white transition-all group no-underline"
            >
              <span className="text-xs font-semibold text-[var(--ink-navy)] block group-hover:text-[var(--board-2)]">
                🏠 Main Campus
              </span>
              <span className="text-[11px] text-slate-500 block">
                Return to the ERP overview
              </span>
            </Link>

            <Link
              href="/login"
              className="p-3 rounded-xl border border-slate-200 bg-[var(--parchment)] hover:border-[var(--board-2)] hover:bg-white transition-all group no-underline"
            >
              <span className="text-xs font-semibold text-[var(--ink-navy)] block group-hover:text-[var(--board-2)]">
                🔐 School Login
              </span>
              <span className="text-[11px] text-slate-500 block">
                Access your teacher or admin desk
              </span>
            </Link>

            <Link
              href="/faq"
              className="p-3 rounded-xl border border-slate-200 bg-[var(--parchment)] hover:border-[var(--board-2)] hover:bg-white transition-all group no-underline"
            >
              <span className="text-xs font-semibold text-[var(--ink-navy)] block group-hover:text-[var(--board-2)]">
                ❓ Help Desk & FAQs
              </span>
              <span className="text-[11px] text-slate-500 block">
                Common questions & setup guide
              </span>
            </Link>

            <Link
              href="/request-demo"
              className="p-3 rounded-xl border border-slate-200 bg-[var(--parchment)] hover:border-[var(--board-2)] hover:bg-white transition-all group no-underline"
            >
              <span className="text-xs font-semibold text-[var(--ink-navy)] block group-hover:text-[var(--board-2)]">
                ⚡ Request a Demo
              </span>
              <span className="text-[11px] text-slate-500 block">
                Book a live walkthrough
              </span>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <Link href="/privacy" className="hover:text-[var(--ink-navy)] no-underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[var(--ink-navy)] no-underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[var(--line)] py-5 px-4 sm:px-8 bg-white text-center text-xs text-slate-500">
        <p className="m-0">
          © {new Date().getFullYear()} Giterp Technologies · Multi-Tenant CBSE School ERP
        </p>
      </footer>
    </div>
  );
}
