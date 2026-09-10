/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { APP_INFO } from '@/lib/app-info';
import CookiePreferencesButton from '@/components/ui/cookie-preferences-button';

interface Section {
  id: string;
  number: string;
  title: string;
  summary: string;
  content: React.ReactNode;
}

export default function TermsOfServicePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');

  const sections: Section[] = useMemo(() => [
    {
      id: 'section-1',
      number: '01',
      title: 'Preamble & Master Subscription Agreement',
      summary: 'Binding legal contract governing educational institutions, school administrators, staff, parents, and students.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;, &ldquo;Agreement&rdquo;) constitute a legally binding agreement between <strong>Giterp Technologies</strong> (&ldquo;Giterp&rdquo;, &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) and the educational institution, school society, trust, or school management board (&ldquo;Institution&rdquo;, &ldquo;Licensee&rdquo;, or &ldquo;School&rdquo;), as well as any individual user accessing our platform—including school principals, teachers, administrative staff, parents, guardians, and students (&ldquo;Users&rdquo;).
          </p>
          <p>
            By accessing or using the Giterp website (<code>https://giterp.com</code>), the School ERP Management Portal, our serverless APIs, or installing the Giterp Progressive Web App (PWA), you acknowledge that you have read, understood, and agree to be bound by these Terms and our accompanying <Link href="/privacy" className="text-[var(--board-2)] font-semibold underline">Privacy Policy</Link>.
          </p>
          <div className="p-4 rounded-lg bg-[#122A24]/5 border border-[#122A24]/15 text-sm">
            <strong className="text-[var(--ink-navy)] block mb-1 font-mono uppercase text-xs">
              Representative Capacity:
            </strong>
            If you are executing this Agreement on behalf of a school, educational trust, or corporate entity, you warrant that you possess the requisite statutory and organizational authority to bind that institution to these Terms.
          </div>
        </div>
      )
    },
    {
      id: 'section-2',
      number: '02',
      title: 'Institutional Licensing & Tenant Provisioning',
      summary: 'Scope of multi-tenant cloud subscription, onboarding credentials, and authorized usage tiers.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Subject to timely payment of applicable subscription fees and continuous compliance with these Terms, Giterp grants the Institution a limited, non-exclusive, non-transferable, revocable license to access and use the ERP platform:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>
              <strong>Tenant Isolation:</strong> Each licensed school is provisioned with a logically segregated tenant environment. The school’s data, student rosters, fee records, and staff portals operate within isolated schemas.
            </li>
            <li>
              <strong>Authorized User Allocation:</strong> Institutional subscriptions are provisioned based on authorized metrics (such as active student strength, campus count, or licensed modules). Exceeding allocated student thresholds may require subscription tier adjustments.
            </li>
            <li>
              <strong>School Administrator Duties:</strong> The subscribing school designates Master Administrative accounts with full authority to provision, modify, and revoke staff, teacher, and parent portal access.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-3',
      number: '03',
      title: 'User Accounts, Authentication & Security',
      summary: 'Responsibility for safeguarding passwords, OTPs, passcodes, and reporting unauthorized access.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Access to Giterp requires authenticated credentials issued by the school or authenticated via school-registered mobile numbers and email addresses:
          </p>
          <div className="grid sm:grid-cols-2 gap-3.5 text-sm">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
              <h5 className="font-semibold text-[var(--ink-navy)] mb-1">Credential Confidentiality</h5>
              <p className="text-xs text-slate-600 m-0">
                Users are strictly prohibited from sharing login passcodes, OTPs, or administrative credentials. Any action performed through an authenticated account is deemed to be authorized by the account holder.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
              <h5 className="font-semibold text-[var(--ink-navy)] mb-1">Breach Notification</h5>
              <p className="text-xs text-slate-600 m-0">
                Schools and users must immediately notify Giterp at <code>security@giterp.com</code> upon identifying any suspected credential compromise, unauthorized session access, or security vulnerability.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-4',
      number: '04',
      title: 'Acceptable Use Policy (AUP)',
      summary: 'Prohibited activities, anti-scraping mandates, and zero-tolerance for platform abuse.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Users agree to utilize Giterp exclusively for lawful academic and institutional management purposes. You shall NOT:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>
              <strong>Reverse Engineer or Decompile:</strong> Attempt to decipher, decompile, disassemble, or reverse engineer any software, algorithms, or API endpoints comprising the Giterp platform.
            </li>
            <li>
              <strong>Automated Extraction:</strong> Deploy scrapers, crawlers, automated bots, or data mining tools against Giterp infrastructure without explicit prior written consent.
            </li>
            <li>
              <strong>Circumvent Security Controls:</strong> Probe, scan, or test the vulnerability of our system, or breach authentication, role-based access control (RBAC), or tenant isolation barriers.
            </li>
            <li>
              <strong>Transmit Harmful Content:</strong> Upload, post, or transmit viruses, malware, trojans, or content that is defamatory, obscene, harassing, or in violation of any applicable Indian or international law.
            </li>
            <li>
              <strong>Impersonation & Fraud:</strong> Misrepresent identity, academic affiliations, or fabricate student assessment marks, attendance logs, or fee receipts.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-5',
      number: '05',
      title: 'Academic Records, Marks & CBSE Certification Accuracy',
      summary: 'School’s sole responsibility for data input integrity, assessment grading, and statutory compliance.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            While Giterp provides standardized calculation engines aligned with CBSE 9-point grading, APAAR schema, and CCE assessment rubrics:
          </p>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm space-y-2">
            <p className="m-0">
              <strong>Institutional Data Integrity:</strong> The school administration and designated teachers maintain sole responsibility for the factual accuracy, completeness, and legality of all student marks, attendance records, disciplinary remarks, and demographic details entered into the system.
            </p>
            <p className="m-0">
              <strong>Statutory Certificates:</strong> Transfer Certificates (TC), Bonafide Certificates, Character Certificates, and Report Cards generated via Giterp reflect data supplied directly by the institution. Giterp does not authenticate or endorse student academic credentials.
            </p>
            <p className="m-0">
              <strong>CBSE / Board Submissions:</strong> Schools are independently responsible for validating and transmitting their official OASIS, LOC (List of Candidates), and UDISE+ returns to the relevant educational authorities.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'section-6',
      number: '06',
      title: 'Fee Payment Processing & Financial Disclaimers',
      summary: 'Role of third-party payment aggregators, transaction handling, and refund disputes.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Where schools enable digital fee collections, Giterp integrates with RBI-authorized payment aggregators (e.g. Razorpay, PayU, Cashfree) to facilitate fee remittances directly from parents to the school’s registered bank account:
          </p>
          <div className="space-y-2.5 text-sm">
            <div className="p-3 bg-white rounded border border-slate-200">
              <strong className="text-[var(--ink-navy)] block mb-0.5">Technological Facilitator Role:</strong>
              <span className="text-slate-600 text-xs">
                Giterp acts solely as a technological integration layer. Giterp is neither a bank, nor a payment gateway, nor does it hold student fee funds in escrow or custody. All funds settle directly into the School’s merchant account.
              </span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <strong className="text-[var(--ink-navy)] block mb-0.5">Fee Refunds & Fee Disputes:</strong>
              <span className="text-slate-600 text-xs">
                Any claims regarding tuition fee refunds, admission cancellations, transport fee waivers, or billing adjustments are strictly bilateral matters between the parent/guardian and the school administration. Giterp cannot process refunds directly.
              </span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <strong className="text-[var(--ink-navy)] block mb-0.5">Gateway Convenience Fees:</strong>
              <span className="text-slate-600 text-xs">
                Transaction convenience fees, GST, and banking charges charged by payment aggregators or card networks are governed by their respective merchant agreements.
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-7',
      number: '07',
      title: 'Intellectual Property Rights & Data Ownership',
      summary: 'Giterp owns the platform software; the School retains 100% proprietary ownership of its institutional data.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--parchment)] border border-slate-200">
              <span className="font-mono text-xs font-bold text-[var(--red-pen)] block mb-1">GITERP PROPERTY</span>
              <h5 className="font-semibold text-sm text-[var(--ink-navy)] mb-1">Platform IP & Codebase</h5>
              <p className="text-xs text-slate-600 m-0">
                All software code, user interface designs, logos, documentation, proprietary algorithms, and system enhancements remain the exclusive intellectual property of Giterp Technologies.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--parchment)] border border-slate-200">
              <span className="font-mono text-xs font-bold text-emerald-700 block mb-1">SCHOOL PROPERTY</span>
              <h5 className="font-semibold text-sm text-[var(--ink-navy)] mb-1">Institutional & Student Data</h5>
              <p className="text-xs text-slate-600 m-0">
                The school retains complete, undisputed ownership of all student records, academic marks, faculty data, school emblems, circulars, and institutional files uploaded to the platform.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-8',
      number: '08',
      title: 'Service Availability, SLA & Offline PWA Continuity',
      summary: 'Target 99.9% uptime, scheduled maintenance windows, and offline browser resilience.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Giterp is engineered on resilient, serverless cloud architecture with high-availability MongoDB Atlas and global edge distribution:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>
              <strong>Service Level Target:</strong> We strive to maintain 99.9% application availability during standard operational hours, excluding scheduled maintenance windows.
            </li>
            <li>
              <strong>Scheduled Maintenance:</strong> Routine updates and database optimisations are scheduled during low-traffic hours (typically between 12:00 AM and 4:00 AM IST) with advance notice to school admins.
            </li>
            <li>
              <strong>Offline Resilience:</strong> Our Progressive Web App (PWA) client utilizes local caching (<code>sw.js</code> and IndexedDB) so that teachers can mark attendance and take notes during internet blackouts, auto-syncing when connectivity resumes.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-9',
      number: '09',
      title: 'Confidentiality & Data Protection (DPDPA 2023)',
      summary: 'Mutual non-disclosure obligations, minor protection protocols, and audit safeguards.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Both parties acknowledge that the platform processes sensitive personal, financial, and educational data:
          </p>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm space-y-2">
            <p className="m-0 font-semibold">
              Data Protection & Compliance Commitment:
            </p>
            <p className="text-xs sm:text-sm m-0 leading-relaxed">
              Giterp agrees to maintain strict technical and organisational safeguards as detailed in our <Link href="/privacy" className="font-semibold underline">Privacy Policy</Link>. We shall not disclose school confidential records to any third party except as strictly necessary to deliver the SaaS service, comply with a valid court order, or pursuant to applicable law.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'section-10',
      number: '10',
      title: 'Warranties, Disclaimers & Limitation of Liability',
      summary: 'Standard SaaS liability caps, telecom delivery latency disclaimers, and GPS telemetry accuracy.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Except as expressly provided herein, the Giterp platform is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>
              <strong>Third-Party Telecommunications Disclaimers:</strong> Giterp cannot guarantee instantaneous SMS or WhatsApp delivery, as transmission times depend on telecom operator networks and national DLT gateway queues.
            </li>
            <li>
              <strong>Vehicle GPS Telemetry:</strong> School bus live location tracking relies on vehicular hardware, mobile carrier SIM coverage, and satellite accuracy. Minor deviations or temporary telemetry dead-zones may occur.
            </li>
            <li>
              <strong>Limitation of Liability:</strong> To the maximum extent permitted by applicable law, in no event shall Giterp Technologies, its directors, or affiliates be liable for indirect, punitive, incidental, or consequential damages. Giterp’s aggregate liability arising out of this Agreement shall be limited to the total subscription fees actually paid by the school in the twelve (12) months preceding the claim.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-11',
      number: '11',
      title: 'Term, Suspension & Data Export on Offboarding',
      summary: 'Conditions for account termination, non-payment suspension, and 60-day data retrieval grace period.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            This Agreement remains effective throughout the subscription period specified in the school’s Service Order:
          </p>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-white rounded border border-slate-200">
              <strong className="text-[var(--ink-navy)] block">Suspension for Cause:</strong>
              <span className="text-slate-600 text-xs">
                Giterp reserves the right to suspend institutional access in the event of persistent non-payment of subscription dues (after 15 days written reminder) or severe breach of the Acceptable Use Policy.
              </span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <strong className="text-[var(--ink-navy)] block">Orderly Offboarding & Data Export:</strong>
              <span className="text-slate-600 text-xs">
                Upon expiration or termination of a school’s subscription, Giterp provides administrative data export tools allowing the school to download all student registers, marks broadsheets, and fee reports. We retain school data for a 60-day safety grace period before permanent, unrecoverable cryptographic deletion.
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-12',
      number: '12',
      title: 'Governing Law, Arbitration & Dispute Redressal',
      summary: 'Governed by the laws of India, arbitration under the Arbitration and Conciliation Act, 1996.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            This Agreement shall be governed by and construed in accordance with the substantive laws of the Republic of India:
          </p>
          <div className="p-5 rounded-lg bg-[var(--board-1)] text-white shadow-sm border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3 mb-3">
              <div>
                <span className="font-mono text-xs text-[var(--red-pen)] uppercase tracking-wider block">
                  Dispute Resolution & Jurisdiction
                </span>
                <h4 className="font-display font-semibold text-lg text-white m-0">
                  Amicable Resolution & Legal Governance
                </h4>
              </div>
              <span className="inline-block px-2.5 py-1 rounded bg-white/10 text-white font-mono text-xs">
                Seat: New Delhi, India
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
              <div>
                <strong className="text-white block">Governing Laws:</strong>
                Republic of India (IT Act 2000 & DPDPA 2023)
              </div>
              <div>
                <strong className="text-white block">Arbitration Act:</strong>
                Arbitration and Conciliation Act, 1996
              </div>
              <div>
                <strong className="text-white block">Legal Contact:</strong>
                <a href="mailto:legal@giterp.com" className="text-emerald-300 underline hover:text-white">
                  legal@giterp.com
                </a>
              </div>
              <div>
                <strong className="text-white block">Support Desk:</strong>
                <a href="mailto:support@giterp.com" className="text-emerald-300 underline hover:text-white">
                  support@giterp.com
                </a>
              </div>
            </div>

            <p className="text-[12px] text-slate-300 mt-4 pt-3 border-t border-white/10 m-0">
              Any dispute, controversy, or claim arising out of or relating to this Agreement shall first be submitted to mutual amicable discussions for thirty (30) days. If unresolved, it shall be referred to and finally resolved by sole arbitration in New Delhi, India in the English language.
            </p>
          </div>
        </div>
      )
    }
  ], []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--parchment)] text-[var(--text-dark)] font-sans antialiased">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--line)] shadow-2xs print:hidden">
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
                School ERP Suite
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              title="Print clean PDF copy"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / PDF</span>
            </button>

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
      <section className="bg-[radial-gradient(ellipse_at_20%_-10%,var(--board-2),var(--board-1)_70%)] text-white py-12 sm:py-16 relative overflow-hidden border-b border-white/10 print:bg-white print:text-black print:border-b-2 print:border-black print:py-4">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-emerald-300 font-semibold px-2.5 py-0.5 rounded bg-white/10 border border-white/10">
              Institutional Master Agreement
            </span>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-white/80 font-medium">
              Enterprise SaaS Terms · CBSE Framework
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight mb-3">
            Terms of Service & Licensing Agreement
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-3xl leading-relaxed mb-6 font-normal">
            These terms define the contractual and operational obligations governing the subscription, use, security, and administrative management of the Giterp multi-school cloud platform.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
            <div>
              <span className="text-white/60">Effective Date:</span>{' '}
              <strong className="text-white">September 07, 2026</strong>
            </div>
            <span className="hidden sm:inline text-white/30">•</span>
            <div>
              <span className="text-white/60">Version:</span>{' '}
              <strong className="text-white">{APP_INFO.version} (Build #{APP_INFO.buildNumber})</strong>
            </div>
            <span className="hidden sm:inline text-white/30">•</span>
            <div>
              <span className="text-white/60">Jurisdiction:</span>{' '}
              <strong className="text-emerald-400">Republic of India</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Container */}
      <main id="main-content" tabIndex={-1} className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 focus:outline-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sticky Sidebar Navigation (Desktop) */}
          <aside className="lg:col-span-4 print:hidden">
            <div className="sticky top-24 space-y-4">
              {/* Search Filter Box */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <label htmlFor="search-terms" className="block text-xs font-mono font-semibold uppercase text-slate-600 mb-1.5">
                  Search Terms Topics
                </label>
                <div className="relative">
                  <input
                    id="search-terms"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Licensing, Fees, SLA, Liability..."
                    className="w-full text-xs sm:text-sm pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--board-2)] focus:border-transparent bg-slate-50"
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      type="button"
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Table of Contents Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs max-h-[calc(100vh-230px)] overflow-y-auto">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Table of Contents ({sections.length})
                  </span>
                  {searchQuery && (
                    <span className="text-[11px] font-mono text-[var(--red-pen)]">
                      {filteredSections.length} match(es)
                    </span>
                  )}
                </div>

                <nav className="space-y-1">
                  {filteredSections.map((sec) => {
                    const isSelected = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#122A24] text-white shadow-2xs font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] shrink-0 pt-0.5 ${
                            isSelected ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          {sec.number}
                        </span>
                        <span className="truncate">{sec.title}</span>
                      </button>
                    );
                  })}
                  {filteredSections.length === 0 && (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      No terms sections match &ldquo;{searchQuery}&rdquo;.
                    </p>
                  )}
                </nav>
              </div>

              {/* Related Policies */}
              <div className="p-4 rounded-xl bg-[#122A24]/5 border border-[#122A24]/10 text-xs text-slate-700">
                <p className="font-semibold text-[var(--ink-navy)] mb-1">
                  Looking for Data Protection?
                </p>
                <p className="mb-2.5 leading-relaxed text-slate-600">
                  Review our DPDPA 2023 compliant student and school data charter.
                </p>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--red-pen)] hover:underline"
                >
                  View Privacy Policy →
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <article className="lg:col-span-8 space-y-8 print:col-span-12">
            {/* Quick Summary Box */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[var(--board-2)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--ink-navy)] m-0">
                  Key Principles for Educational Institutions
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0 mb-4">
                Our institutional service terms ensure equitable, predictable, and secure platform operations:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">100% Institutional Data Ownership:</strong> The school retains exclusive ownership of all student and academic data.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">Enterprise 99.9% Uptime:</strong> High-availability architecture with offline PWA sync for zero gate disruption.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">Zero-Vendor Lock-in:</strong> Seamless bulk export tools (JSON/CSV) available for all school registers.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">Direct Payment Settlements:</strong> Parent fee payments settle directly into the school’s designated bank account.
                  </div>
                </div>
              </div>
            </div>

            {/* Render Sections */}
            {filteredSections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs scroll-mt-24 print:shadow-none print:border-none print:p-0 print:mb-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[var(--red-pen)] bg-red-50 px-2 py-0.5 rounded">
                        Section {section.number}
                      </span>
                    </div>
                    <h2 className="font-display font-semibold text-xl sm:text-2xl text-[var(--ink-navy)] tracking-tight m-0">
                      {section.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    type="button"
                    className="text-slate-300 hover:text-slate-500 text-xs font-mono hidden sm:inline-block print:hidden cursor-pointer"
                    title="Direct anchor link"
                  >
                    #{section.id}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 italic mb-5">
                  {section.summary}
                </p>

                {section.content}
              </section>
            ))}

            {/* Bottom Notice */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 leading-relaxed space-y-2">
              <p className="m-0">
                <strong>Modifications to Terms:</strong> Giterp may update these Terms periodically to incorporate new module capabilities, regulatory changes, or institutional features. Material changes will be communicated via administrative notifications and email bulletins at least 15 days prior to taking effect. Continued use of Giterp following such notice constitutes acceptance.
              </p>
              <p className="m-0">
                Last reviewed and legally certified on <strong>September 07, 2026</strong>.
              </p>
            </div>
          </article>
        </div>
      </main>

      {/* Global Clean Footer */}
      <footer className="border-t border-[var(--line)] py-9 bg-white mt-12 print:hidden" id="footer">
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
            <Link href="/terms" className="font-semibold text-[var(--ink-navy)] no-underline">
              Terms of Service
            </Link>
            <CookiePreferencesButton className="hover:text-[var(--ink-navy)] text-slate-500 font-sans cursor-pointer border-none bg-transparent p-0 text-[13px]" />
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              type="button"
              className="text-slate-500 hover:text-[var(--ink-navy)] border-none bg-transparent cursor-pointer p-0"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
