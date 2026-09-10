import React from 'react';
import Link from 'next/link';
import { FAQSection } from '@/components/landing/faq-section';
import CookiePreferencesButton from '@/components/ui/cookie-preferences-button';
import { faqPageSchema, createBreadcrumbSchema } from '@/lib/json-ld';

export const metadata = {
  title: 'Frequently Asked Questions (FAQs) — Knowledge Base',
  description: 'Find instant answers about Giterp 24–48h setup, free historical Excel migration, 0% fee commissions, CBSE 9-point grading, and offline PWA resilience.',
  alternates: {
    canonical: '/faq'
  }
};

const breadcrumbs = createBreadcrumbSchema([
  { name: 'Home', url: 'https://giterp.com' },
  { name: 'FAQs & Help Desk', url: 'https://giterp.com/faq' }
]);

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[var(--parchment)] text-[var(--text-dark)] font-sans antialiased">
      {/* Search Engine Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([faqPageSchema, breadcrumbs]) }}
      />

      {/* Top Bar Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--line)] shadow-2xs">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 no-underline min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/giterp-logo.png"
              alt="Giterp Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain shadow-xs bg-[#122A24] border border-[#122A24]/30 p-1 shrink-0"
            />
            <div className="min-w-0">
              <span className="font-display font-semibold text-base sm:text-xl text-[var(--ink-navy)] tracking-tight block truncate">
                Giterp
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] font-normal tracking-[1px] sm:tracking-[1.5px] uppercase text-[var(--board-2)] block -mt-0.5 opacity-85 truncate">
                Knowledge & Support Desk
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-navy)] border border-[var(--line)] bg-white hover:bg-slate-50 transition-colors no-underline shadow-2xs"
            >
              ← Back to Home
            </Link>

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-navy)] border border-[var(--line)] bg-white hover:bg-slate-50 transition-colors no-underline shadow-2xs"
            >
              School Login
            </Link>

            <Link
              href="/request-demo"
              className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--ink-navy)] hover:bg-[var(--red-pen)] transition-all shadow-2xs no-underline"
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="bg-[radial-gradient(ellipse_at_20%_-10%,var(--board-2),var(--board-1)_70%)] text-white py-12 sm:py-14 relative overflow-hidden border-b border-white/10">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-emerald-300 font-semibold px-2.5 py-0.5 rounded bg-white/10 border border-white/10">
              Institutional Help Desk
            </span>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-white/80 font-medium">
              CBSE School Knowledge Base
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight mb-3">
            Frequently Asked Questions (FAQs)
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-3xl leading-relaxed font-normal m-0">
            Find answers to common questions about onboarding, CBSE assessments, fees processing, data privacy, and offline mobile capabilities.
          </p>
        </div>
      </section>

      {/* Main FAQ Content Container */}
      <main id="main-content" tabIndex={-1} className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 focus:outline-none">
        <FAQSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-9 bg-white mt-12" id="footer">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Giterp Technologies</span>
            <span>•</span>
            <span>School ERP Suite for CBSE Institutions</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[13px]">
            <Link href="/" className="hover:text-[var(--ink-navy)] no-underline">
              Home
            </Link>
            <Link href="/login" className="hover:text-[var(--ink-navy)] no-underline">
              School Login
            </Link>
            <Link href="/request-demo" className="hover:text-[var(--ink-navy)] no-underline">
              Request a Demo
            </Link>
            <Link href="/privacy" className="hover:text-[var(--ink-navy)] no-underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink-navy)] no-underline">
              Terms of Service
            </Link>
            <CookiePreferencesButton className="hover:text-[var(--ink-navy)] text-slate-500 font-sans cursor-pointer border-none bg-transparent p-0 text-[13px]" />
            <a
              href="#top"
              className="text-slate-500 hover:text-[var(--ink-navy)] no-underline"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
