import React from 'react';
import Link from 'next/link';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Load real registered schools dynamically
  const schools = await Database.getSchools();

  return (
    <div className="min-h-screen bg-[var(--parchment)] text-[var(--text-dark)] font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--line)] shadow-2xs">
        <div className="max-w-[1160px] mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 no-underline min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/giterp-logo.png" alt="Giterp Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain shadow-xs bg-[#122A24] border border-[#122A24]/30 p-1 shrink-0" />
            <div className="min-w-0">
              <span className="font-display font-semibold text-base sm:text-xl text-[var(--ink-navy)] tracking-tight block truncate">
                Giterp
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] font-normal tracking-[1px] sm:tracking-[1.5px] uppercase text-[var(--board-2)] block -mt-0.5 opacity-85 truncate">
                Manage • Integrate • Grow
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-[14.5px] font-medium text-[var(--ink-navy)]">
            <a href="#how" className="opacity-75 hover:opacity-100 transition-opacity no-underline">
              How it works
            </a>
            <a href="#modules" className="opacity-75 hover:opacity-100 transition-opacity no-underline">
              Modules
            </a>
            <Link href="/mobile" className="opacity-90 hover:opacity-100 text-emerald-800 font-bold transition-opacity no-underline flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              📱 Mobile App
            </Link>
            <Link href="/agency" className="opacity-75 hover:opacity-100 transition-opacity no-underline">
              Agency Hub
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/mobile"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-900 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors no-underline shadow-xs whitespace-nowrap"
            >
              📱 Mobile App
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[var(--ink-navy)] border border-[var(--line)] bg-white hover:bg-slate-50 transition-colors no-underline shadow-xs whitespace-nowrap"
            >
              School Login
            </Link>
            <Link
              href="/request-demo"
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[var(--ink-navy)] hover:bg-[var(--red-pen)] transition-all shadow-xs no-underline whitespace-nowrap"
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_20%_-10%,var(--board-2),var(--board-1)_60%)] text-white pt-20 sm:pt-24 pb-0" id="top">
          {/* Decorative Stamp Seal */}
          <div className="hidden md:block absolute top-16 right-[8%] z-10 rotate-[-10deg] pointer-events-none">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[150px] h-[150px]">
              <circle cx="80" cy="80" r="70" stroke="#C4432B" strokeWidth="3" strokeDasharray="4 6" />
              <circle cx="80" cy="80" r="58" stroke="#C4432B" strokeWidth="2" />
              <text x="80" y="93" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="46" fill="#C4432B">
                A+
              </text>
            </svg>
          </div>

          <div className="max-w-[1160px] mx-auto px-6 sm:px-8 relative z-10 pb-16">
            <div className="font-mono text-[12.5px] tracking-[2px] uppercase text-white/90 flex items-center gap-2.5 mb-5 font-semibold">
              <span className="w-[26px] h-[1.5px] bg-white inline-block" />
              School ERP · Built for many schools
            </div>

            <h1 className="font-display font-semibold text-3xl sm:text-5xl lg:text-[64px] leading-[1.15] sm:leading-[1.08] tracking-tight text-white max-w-3xl mb-4">
              One ERP.<br className="hidden sm:inline" />{' '}
              <span className="relative inline-block">
                Every school, its own register.
                <svg viewBox="0 0 460 16" preserveAspectRatio="none" className="absolute left-0 -bottom-1.5 w-full h-3 sm:h-4">
                  <path d="M2 10 Q60 2 120 9 T240 8 T360 11 T458 6" stroke="#C4432B" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-slate-200 max-w-xl my-7 font-normal">
              Giterp runs attendance, fees, timetables, examinations, transport GPS and CBSE report cards for any number of schools — each with its own data, its own staff, and its own login, on one shared platform.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/request-demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-[14px] font-semibold text-white bg-[var(--red-pen)] hover:bg-[#b03a24] transition-all shadow-md hover:-translate-y-0.5 no-underline"
              >
                Request a Demo
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-[14px] font-semibold text-white border border-white/40 hover:bg-white/10 hover:border-white transition-all no-underline hover:-translate-y-0.5"
              >
                See how onboarding works →
              </a>
            </div>
          </div>

          {/* Continuous Ticker */}
          <div className="bg-[var(--board-2)] border-t border-white/15 overflow-hidden relative z-10 py-3">
            <div className="ticker-track">
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Attendance
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Fee Ledger
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Timetable
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Report Cards
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Admissions
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Staff Directory
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Transport
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Library
              </span>

              {/* Repeat for seamless loop */}
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Attendance
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Fee Ledger
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Timetable
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Report Cards
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Admissions
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Staff Directory
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Transport
              </span>
              <span className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-white opacity-90 flex items-center gap-3">
                <span className="text-white">✦</span> Library
              </span>
            </div>
          </div>
        </section>

        {/* Getting your school on board (Steps) */}
        <section className="max-w-[1160px] mx-auto px-6 sm:px-8 py-20" id="how">
          <div className="mb-11">
            <h2 className="font-display font-semibold text-3xl sm:text-[34px] text-[var(--ink-navy)] mb-2">
              Getting your school on board
            </h2>
            <p className="text-slate-600 text-[15.5px] max-w-lg">
              No self-serve signup — every school is set up by our team, so your data starts clean and your staff start with the right roles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="bg-white border border-[var(--line)] rounded-[10px] p-7 relative shadow-sm">
              <span className="font-display font-bold text-3xl text-[var(--board-2)] block">01</span>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mt-2.5 mb-2">Request a demo</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Tell us about your school — size, current process, what you want digitised first.
              </p>
              <span className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-slate-300 text-xl font-bold">
                →
              </span>
            </div>

            <div className="bg-white border border-[var(--line)] rounded-[10px] p-7 relative shadow-sm">
              <span className="font-display font-bold text-3xl text-[var(--board-2)] block">02</span>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mt-2.5 mb-2">We set you up</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Our team creates your school's workspace, issues a school code, and configures roles.
              </p>
              <span className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-slate-300 text-xl font-bold">
                →
              </span>
            </div>

            <div className="bg-white border border-[var(--line)] rounded-[10px] p-7 relative shadow-sm">
              <span className="font-display font-bold text-3xl text-[var(--board-2)] block">03</span>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mt-2.5 mb-2">Your staff log in</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Admins, teachers, students and parents sign in with your school code and their own ID.
              </p>
            </div>
          </div>

          {/* Platform Register Table */}
          <div className="my-2 mb-20 bg-white border border-[var(--line)] rounded-[10px] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--line)] font-mono text-xs tracking-wider uppercase text-[var(--ink-navy)] bg-slate-50/70">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--board-2)] inline-block" />
                Platform Register · Active Schools
              </span>
              <span className="text-[var(--board-2)] font-semibold">Live</span>
            </div>

            <div className="px-6 py-5 bg-white">
              <div className="grid grid-cols-[1fr_120px_100px] gap-3 items-center h-10 text-xs font-mono tracking-wider uppercase text-slate-500 font-semibold border-b border-[var(--line)]">
                <span>School</span>
                <span>Code</span>
                <span className="text-right">Status</span>
              </div>

              {schools.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_120px_100px] gap-3 items-center h-[46px] text-[14.5px] border-b border-slate-100 last:border-b-0">
                  <span className="font-medium text-[var(--ink-navy)] truncate">{s.school_name}</span>
                  <span className="font-mono text-xs text-slate-500">{s.school_code}</span>
                  <span className="text-right font-display font-semibold text-xs text-[var(--board-2)]">
                    {s.status}
                  </span>
                </div>
              ))}

              {schools.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No institutions registered yet. Be the first school onboarded!
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-[var(--line)] flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2 bg-slate-50/50">
              <span>{schools.length} schools on the platform</span>
              <span>New requests reviewed within 2 business days</span>
            </div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="max-w-[1160px] mx-auto px-6 sm:px-8 pb-20" id="modules">
          <div className="mb-11">
            <h2 className="font-display font-semibold text-3xl sm:text-[34px] text-[var(--ink-navy)] mb-2">
              What every school gets
            </h2>
            <p className="text-slate-600 text-[15.5px]">
              The same eight modules, kept separate school by school.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {/* Module 1 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Attendance</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Mark daily attendance by class or period; parents see it the same morning.
              </p>
            </div>

            {/* Module 2 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v10M9 10h4.5a1.5 1.5 0 0 1 0 3H9" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Fee Ledger</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Track dues, receipts and reminders per student, term by term.
              </p>
            </div>

            {/* Module 3 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="9" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Timetable</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Build and publish schedules, with substitutions handled automatically.
              </p>
            </div>

            {/* Module 4 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 3h14v18l-7-4-7 4V3z" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Report Cards</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Compile marks across terms into a printable, board-format report card.
              </p>
            </div>

            {/* Module 5 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 20V10l8-6 8 6v10" />
                <path d="M9 20v-6h6v6" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Admissions</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Take enquiries through to enrolment, with document checklists built in.
              </p>
            </div>

            {/* Module 6 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Staff Directory</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Roles, subjects taught, and contact details for every staff member.
              </p>
            </div>

            {/* Module 7 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 13h18M5 13V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5m-14 0v6m14-6v6" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Transport</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Assign routes and stops; notify parents when a bus is running late.
              </p>
            </div>

            {/* Module 8 */}
            <div className="bg-white p-7 rounded-lg border border-[var(--line)] hover:border-slate-400 hover:shadow-md transition-all">
              <svg className="w-7 h-7 text-[var(--board-2)] mb-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0V5z" />
                <path d="M20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0V5z" />
              </svg>
              <h3 className="font-display font-semibold text-lg text-[var(--ink-navy)] mb-2">Library</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 m-0">
                Catalogue, issue and return tracking, with overdue reminders sent automatically.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="bg-[var(--board-1)] text-white rounded-[10px] p-10 sm:p-14 mb-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-white/10">
            <div>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl text-white mb-2">
                Ready to bring your school on board?
              </h2>
              <p className="text-slate-200 text-[14.5px] max-w-md m-0">
                Tell us about your school and our team will reach out to set things up.
              </p>
            </div>
            <Link
              href="/request-demo"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-[14px] font-semibold text-[var(--board-1)] bg-white hover:bg-slate-100 transition-all no-underline shadow hover:-translate-y-0.5 shrink-0"
            >
              Request a Demo
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-9 bg-white" id="contact">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p className="m-0">Giterp · School ERP for multiple schools, one platform</p>
          <div className="flex gap-6 text-[13.5px]">
            <Link href="/login" className="hover:text-[var(--ink-navy)] no-underline">
              School Login
            </Link>
            <Link href="/request-demo" className="hover:text-[var(--ink-navy)] no-underline">
              Request a Demo
            </Link>
            <a href="#top" className="hover:text-[var(--ink-navy)] no-underline">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
