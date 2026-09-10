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

export default function PrivacyPolicyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');

  const sections: Section[] = useMemo(() => [
    {
      id: 'section-1',
      number: '01',
      title: 'Introduction & Institutional Roles',
      summary: 'Distinction between Affiliated Schools as Data Fiduciaries and Giterp as a Data Processor.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Welcome to <strong>Giterp</strong> (the &ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a multi-tenant cloud-native Enterprise Resource Planning (ERP) suite engineered specifically for Central Board of Secondary Education (CBSE) schools, educational societies, school administrators, faculty, parents, and students.
          </p>
          <p>
            This Privacy Policy articulates how personal, academic, demographic, biometric, and financial data is collected, processed, stored, and protected when interacting with the Giterp website (<code>https://giterp.com</code>), the School ERP Management Portal, the Mobile Progressive Web App (PWA), and associated micro-services.
          </p>
          <div className="p-4 rounded-lg bg-[#122A24]/5 border border-[#122A24]/15">
            <h4 className="font-semibold text-[var(--ink-navy)] text-sm mb-1 uppercase tracking-wider font-mono">
              Key Role Distinction under Data Protection Laws:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>
                <strong>The Affiliated School / Educational Institution (Data Fiduciary / Data Controller):</strong> The respective school management that licenses Giterp is the primary Data Fiduciary. The school determines the purpose and lawful basis for collecting student, guardian, and faculty data during admissions, employment, and academic operations.
              </li>
              <li>
                <strong>Giterp Technologies (Data Processor):</strong> Giterp acts solely as a technological intermediary and Data Processor executing services under the contract and explicit instructions of the subscribing institution. We do not own, sell, commercialise, or rent school community data.
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'section-2',
      number: '02',
      title: 'Statutory & Regulatory Framework',
      summary: 'Compliance with India’s DPDPA 2023, IT Act 2000, CBSE Bye-laws, and global standards.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Our data protection practices are architected in strict compliance with applicable statutory mandates:
          </p>
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
              <span className="font-mono text-xs font-semibold text-[var(--red-pen)] block mb-1">
                INDIA · STATUTORY
              </span>
              <h5 className="font-display font-semibold text-[var(--ink-navy)] text-sm mb-1">
                Digital Personal Data Protection Act, 2023 (DPDPA)
              </h5>
              <p className="text-xs text-slate-600 m-0">
                Full adherence to lawful grounds for processing, data minimisation, purpose limitation, notice mandates, and enhanced safeguards for minors (Section 9).
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
              <span className="font-mono text-xs font-semibold text-[var(--board-2)] block mb-1">
                INDIA · IT LAWS
              </span>
              <h5 className="font-display font-semibold text-[var(--ink-navy)] text-sm mb-1">
                Information Technology Act, 2000 & SPDI Rules
              </h5>
              <p className="text-xs text-slate-600 m-0">
                Compliance with reasonable security practices and procedures for Sensitive Personal Data or Information (SPDI) under Section 43A and Section 79.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
              <span className="font-mono text-xs font-semibold text-[var(--ink-navy)] block mb-1">
                ACADEMIC & EDUCATION
              </span>
              <h5 className="font-display font-semibold text-[var(--ink-navy)] text-sm mb-1">
                CBSE Bye-laws, NEP 2020 & APAAR / UDISE+
              </h5>
              <p className="text-xs text-slate-600 m-0">
                Data structures aligned with standard Ministry of Education schemes including Automated Permanent Academic Account Registry (APAAR) and UDISE+ mandates.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
              <span className="font-mono text-xs font-semibold text-emerald-700 block mb-1">
                INTERNATIONAL STANDARDS
              </span>
              <h5 className="font-display font-semibold text-[var(--ink-navy)] text-sm mb-1">
                ISO/IEC 27001, FERPA & COPPA Principles
              </h5>
              <p className="text-xs text-slate-600 m-0">
                Architecture benchmarked against Family Educational Rights and Privacy Act (FERPA) concepts and strict child privacy guidelines.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-3',
      number: '03',
      title: 'Categories of Information Collected',
      summary: 'Granular disclosure of student SIS records, parent contacts, faculty payroll, and telemetry.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            The information processed through Giterp depends on the module licensed by the school and the user&apos;s role (School Administrator, Principal, Teacher, Accountant, Parent, or Student):
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white rounded-lg border border-slate-200">
              <thead>
                <tr className="bg-[var(--parchment)] border-b border-slate-200 text-[var(--ink-navy)] font-semibold">
                  <th className="p-3">Category</th>
                  <th className="p-3">Data Elements Processed</th>
                  <th className="p-3">Primary Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Student SIS & Demographics</td>
                  <td className="p-3 text-slate-600">
                    Full legal name, Date of Birth, Gender, Blood group, APAAR ID, PEN number, CBSE Roll No, Class/Section, Admission Number, Category/Caste (if required for scholarship reports), Profile Avatar.
                  </td>
                  <td className="p-3 text-slate-600">
                    Class enrolment, roll call, CBSE exam registrations, generation of report cards, bonafide & transfer certificates.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Parent & Guardian Records</td>
                  <td className="p-3 text-slate-600">
                    Father/Mother/Guardian names, mobile phone numbers, email addresses, residential address, occupation, emergency contact details.
                  </td>
                  <td className="p-3 text-slate-600">
                    Fee invoicing, payment receipts, emergency dispatches, student absence SMS/email alerts, report card sharing.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Academic & Examination Data</td>
                  <td className="p-3 text-slate-600">
                    Internal assessments, formative & summative marks, scholastic grades, teacher remarks, digital homework diary submissions.
                  </td>
                  <td className="p-3 text-slate-600">
                    CBSE 9-point grading, broadsheets, continuous evaluation, student academic progress tracking.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Daily Attendance & Biometrics</td>
                  <td className="p-3 text-slate-600">
                    Roll call timestamps, late arrival logs, RFID smart-card tap logs, biometric machine sync hashes, faculty leave petitions.
                  </td>
                  <td className="p-3 text-slate-600">
                    Campus safety, automated parent notifications for absenteeism, faculty payroll calculation.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Fee Management & Financials</td>
                  <td className="p-3 text-slate-600">
                    Tuition fee structures, payment transaction receipt IDs, dues ledger, payment gateway status. <em>(Note: We NEVER store raw credit/debit card numbers or netbanking CVV/passwords).</em>
                  </td>
                  <td className="p-3 text-slate-600">
                    School accounting, fee challan generation, automated due reminders, digital tax receipts.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Faculty & Staff Information</td>
                  <td className="p-3 text-slate-600">
                    Teacher qualifications, CTET/TET certificates, payroll salary structures, bank IFSC/account details (for salary credits), timetable assignments.
                  </td>
                  <td className="p-3 text-slate-600">
                    Institutional payroll, periods allocation, CBSE OASIS faculty compliance returns.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Transport & GPS Telemetry</td>
                  <td className="p-3 text-slate-600">
                    School bus vehicle ID, driver contact, real-time GPS coordinates during active bus routes, assigned pickup/drop stops.
                  </td>
                  <td className="p-3 text-slate-600">
                    Real-time parent bus tracking, route safety monitoring, arrival delay broadcasts.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--ink-navy)]">Marketing & Demo Inquiries</td>
                  <td className="p-3 text-slate-600">
                    School representative name, official email, phone number, school location, estimated student capacity.
                  </td>
                  <td className="p-3 text-slate-600">
                    Organising product demonstrations, onboarding institutional tenants, customer support.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'section-4',
      number: '04',
      title: 'Protection of Children’s & Minors’ Data',
      summary: 'Strict compliance with Section 9 of the DPDPA 2023 — zero profiling, zero advertising.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-2">
              <span className="text-base">🛡️</span> Mandatory Minor Protection Clause (DPDPA 2023, Section 9)
            </h4>
            <p className="text-xs sm:text-sm m-0 leading-relaxed">
              Because Giterp processes educational records of school children (minors below the age of 18), our platform adheres to the highest statutory standard of care under Section 9 of the Digital Personal Data Protection Act, 2023.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-slate-700 text-sm">
            <li>
              <strong>Verifiable Parental Consent:</strong> Subscribing schools are required to secure explicit, verifiable parental or legal guardian consent at the time of student admission or ERP onboarding. Giterp provides schools with the digital consent logging infrastructure to record this consent.
            </li>
            <li>
              <strong>Strict Prohibition of Behavioural Tracking:</strong> We do <em>not</em> track, monitor, or profile child behaviour across the internet, nor do we run algorithms to infer student psychological traits for non-educational or commercial purposes.
            </li>
            <li>
              <strong>Zero Targeted Advertising:</strong> Giterp is 100% ad-free. No student data is ever utilized for programmatic advertisements, commercial marketing, brand sponsorships, or data broker sales.
            </li>
            <li>
              <strong>No Detrimental Processing:</strong> Giterp guarantees that no data processing is undertaken that causes harm, psychological distress, or detrimental effects to any child’s physical or mental well-being.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-5',
      number: '05',
      title: 'Lawful Grounds & Purposes of Processing',
      summary: 'Legitimate academic interests, contractual obligations, and statutory reporting.',
      content: (
        <div className="space-y-3 text-slate-700 leading-relaxed text-[15px]">
          <p>
            We process data exclusively on the following legal bases:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              <strong>Performance of Contract:</strong> To deliver the ERP software services, generate digital report cards, maintain attendance registers, issue transfer certificates, and process fee collections as agreed with the educational institution.
            </li>
            <li>
              <strong>Legitimate Educational & Safety Uses:</strong> To ensure student physical safety on school premises and during transport transit, automate emergency notifications (e.g. school closures, weather alerts), and manage faculty schedules.
            </li>
            <li>
              <strong>Compliance with Legal & Regulatory Obligations:</strong> Submitting mandatory aggregated or individual student records to the Central Board of Secondary Education (CBSE), state education departments, UDISE+ portal, and APAAR registrations as required by law.
            </li>
            <li>
              <strong>Explicit Consent:</strong> Where required (such as for non-essential communications or marketing demo requests), data is processed on the basis of informed consent which may be withdrawn at any time.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'section-6',
      number: '06',
      title: 'Multi-Tenant Architecture & Data Segregation',
      summary: 'Cryptographic schema isolation ensuring no cross-school data co-mingling.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Giterp operates a hardened multi-tenant architecture designed from the ground up to guarantee strict logical and cryptographic data segregation between different schools:
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-lg bg-[var(--parchment)] border border-slate-200">
              <span className="font-mono text-2xl font-bold text-[var(--board-2)] block mb-1">01</span>
              <h5 className="font-semibold text-sm text-[var(--ink-navy)] mb-1">Tenant Isolation</h5>
              <p className="text-xs text-slate-600 m-0">
                Every query is cryptographically scoped to the authenticated school tenant ID. Cross-school access is strictly prevented.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--parchment)] border border-slate-200">
              <span className="font-mono text-2xl font-bold text-[var(--board-2)] block mb-1">02</span>
              <h5 className="font-semibold text-sm text-[var(--ink-navy)] mb-1">Role-Based Access (RBAC)</h5>
              <p className="text-xs text-slate-600 m-0">
                Granular permission gates restrict staff access. Teachers only view their assigned classes; accountants only see fee registers.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--parchment)] border border-slate-200">
              <span className="font-mono text-2xl font-bold text-[var(--board-2)] block mb-1">03</span>
              <h5 className="font-semibold text-sm text-[var(--ink-navy)] mb-1">Tamper-Evident Audit Trails</h5>
              <p className="text-xs text-slate-600 m-0">
                Critical actions (mark revisions, fee receipts, student promotions) are immutably logged with actor timestamps and IP records.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-7',
      number: '07',
      title: 'Sub-Processors & Infrastructure Providers',
      summary: 'Audited tier-1 cloud hosting, SMS gateways, and PCI-DSS certified payment aggregators.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            To deliver resilient, enterprise-grade cloud uptime, Giterp engages trusted, SOC-2 / ISO-27001 compliant sub-processors:
          </p>
          <div className="space-y-2.5 text-sm">
            <div className="p-3 bg-white rounded border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
              <div>
                <strong>MongoDB Atlas / CockroachDB:</strong>
                <span className="text-slate-600 block text-xs">Primary encrypted cloud databases with multi-region redundancy and automatic failover.</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 shrink-0">Data at rest & transit encryption</span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
              <div>
                <strong>Vercel & Netlify Edge Networks:</strong>
                <span className="text-slate-600 block text-xs">Serverless API execution and PWA static asset distribution via global edge CDN.</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 shrink-0">ISO 27001 / SOC-2 Type II</span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
              <div>
                <strong>Transaction SMS & SMTP Gateways:</strong>
                <span className="text-slate-600 block text-xs">Delivery of time-critical OTPs, attendance notices, fee receipts, and digital circulars.</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 shrink-0">TRAI DLT Registered (India)</span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
              <div>
                <strong>Payment Aggregators (Razorpay / PayU / Cashfree):</strong>
                <span className="text-slate-600 block text-xs">Direct fee payment processing. Cardholder data is tokenized directly via RBI-authorized gateways.</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 shrink-0">PCI-DSS Level 1 Compliant</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-8',
      number: '08',
      title: 'Data Security, Encryption & Storage',
      summary: 'AES-256 at rest, TLS 1.3 in transit, salted password hashes, and automated backups.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            We implement comprehensive technical and organizational measures (TOMs) to protect institutional data against accidental loss, unauthorized access, destruction, or alteration:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>
              <strong>Encryption in Transit:</strong> All HTTP network traffic is enforced over HTTPS with TLS 1.3 encryption, ensuring confidentiality between client browsers/mobile apps and Giterp servers.
            </li>
            <li>
              <strong>Encryption at Rest:</strong> Cloud databases, media vaults, and backup snapshots are encrypted using industry-standard AES-256 encryption.
            </li>
            <li>
              <strong>Credential Security:</strong> User passwords and administrative passcodes are hashed using bcrypt/Argon2 with high work factors and cryptographic salt. Plaintext passwords are never stored or logged.
            </li>
            <li>
              <strong>Local Media Vault:</strong> Student and faculty avatars are served via high-speed, authenticated media proxies with instant cache validation.
            </li>
            <li>
              <strong>Disaster Recovery:</strong> Daily automated point-in-time recovery (PITR) backups are maintained in secure, geographically distributed cloud zones.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-9',
      number: '09',
      title: 'Data Retention & Archival Policies',
      summary: 'Academic lifecycle retention, Transfer Certificate records, and secure purge workflows.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Data retention periods are governed by the educational requirements of the subscribing school and applicable statutory mandates:
          </p>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-[var(--ink-navy)]">Active Students & Faculty:</span>
              <p className="text-slate-600 text-xs mt-0.5 mb-0">
                Data is actively retained for the duration of the student&apos;s enrolment or staff employment at the institution.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-[var(--ink-navy)]">Alumni & Transfer Certificate (TC) Records:</span>
              <p className="text-slate-600 text-xs mt-0.5 mb-0">
                Under CBSE Examination Bye-Laws, matriculation registers, Transfer Certificates, and final broadsheets must be preserved permanently or for statutory archival periods by the school. Giterp archives these records securely.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-[var(--ink-navy)]">School Subscription Termination:</span>
              <p className="text-slate-600 text-xs mt-0.5 mb-0">
                Upon cancellation of a school’s ERP license, an institutional data export package (JSON/CSV) is provided to the school administration. After a 60-day safety grace period, tenant data is permanently purged from active databases.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-10',
      number: '10',
      title: 'Rights of Data Principals (Students, Parents & Staff)',
      summary: 'How parents and users exercise rights to review, correct, or request deletion under DPDPA.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Under the Digital Personal Data Protection Act, 2023, data principals (or parents/guardians representing minor scholars) hold specific statutory rights:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <strong className="text-[var(--ink-navy)] block mb-1">Right to Access & Summary</strong>
              <p className="text-xs text-slate-600 m-0">
                Request a summary of personal and academic data being processed, including identities of any data processors involved.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <strong className="text-[var(--ink-navy)] block mb-1">Right to Correction & Completion</strong>
              <p className="text-xs text-slate-600 m-0">
                Parents or students can request correction of misspelled names, addresses, or inaccurate marks through their school portal.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <strong className="text-[var(--ink-navy)] block mb-1">Right to Erasure</strong>
              <p className="text-xs text-slate-600 m-0">
                Request deletion of data no longer required for academic purposes, subject to mandatory statutory educational archival laws.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <strong className="text-[var(--ink-navy)] block mb-1">Right of Grievance Redressal</strong>
              <p className="text-xs text-slate-600 m-0">
                Lodge formal grievances with our designated Grievance Officer, with escalation paths to the Data Protection Board of India.
              </p>
            </div>
          </div>
          <div className="p-3 rounded bg-[var(--parchment)] border border-slate-200 text-xs text-slate-700">
            <strong>How to Exercise:</strong> Because Giterp acts as a Data Processor on behalf of the school, student and parent requests should first be submitted directly to the <em>School Principal or Administrative Office</em>. Giterp assists schools in fulfilling all verified data principal requests within statutory deadlines.
          </div>
        </div>
      )
    },
    {
      id: 'section-11',
      number: '11',
      title: 'Cookies, Consent Management & Offline PWA Storage',
      summary: 'Information on local session tokens, anonymous telemetry, consent preferences, and sw.js caching.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            Giterp operates an ethical, transparent client storage framework benchmarked against the Digital Personal Data Protection Act (DPDPA 2023) and global ePrivacy standards:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>
              <strong>Strictly Necessary Session Tokens:</strong> Secure HTTP-only cookies and cryptographic auth tokens utilized exclusively to maintain your authenticated school portal session, tenant scoping, and CSRF protection.
            </li>
            <li>
              <strong>Service Worker Cache (<code>sw.js</code>):</strong> Stores application shells, fonts, and stylesheets locally on your device to enable instant load times and offline operation during school network instability.
            </li>
            <li>
              <strong>IndexedDB & LocalStorage:</strong> Used to temporarily stage attendance roll-calls or draft report card marks when connectivity is severed, automatically syncing back to the cloud once online.
            </li>
            <li>
              <strong>Anonymous Performance Telemetry:</strong> With user consent, privacy-preserving Vercel Web Analytics measures page responsiveness and module latency. It collects <em>zero</em> student records, personal identifiers, or cross-site tracking cookies.
            </li>
            <li>
              <strong>Zero Advertising or Broker Trackers:</strong> We <strong>never</strong> load third-party advertising trackers, social tracking pixels, or data broker scripts.
            </li>
          </ul>

          <div className="p-4 rounded-xl bg-[var(--parchment)] border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <strong className="text-[var(--ink-navy)] block text-sm mb-0.5">Manage Your Cookie Preferences</strong>
              <span className="text-slate-600">You can adjust or revoke your optional performance analytics consent at any time.</span>
            </div>
            <CookiePreferencesButton
              label="Open Cookie Settings"
              className="px-3.5 py-2 rounded-lg bg-[var(--board-1)] text-white font-medium hover:bg-[var(--board-2)] cursor-pointer border-none shadow-xs text-xs shrink-0"
            />
          </div>
        </div>
      )
    },
    {
      id: 'section-12',
      number: '12',
      title: 'Grievance Redressal Officer & Contact Disclosures',
      summary: 'Official contact coordinates under Section 5(9) of the IT Act and Section 8(10) of DPDPA.',
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
          <p>
            In compliance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the details of our designated Grievance Redressal Officer are published below:
          </p>
          <div className="p-5 rounded-lg bg-[var(--board-1)] text-white shadow-sm border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3 mb-3">
              <div>
                <span className="font-mono text-xs text-[var(--red-pen)] uppercase tracking-wider block">
                  Designated Grievance Redressal Officer
                </span>
                <h4 className="font-display font-semibold text-lg text-white m-0">
                  Data Protection & Grievance Cell
                </h4>
              </div>
              <span className="inline-block px-2.5 py-1 rounded bg-white/10 text-white font-mono text-xs">
                Turnaround: 48-72 hrs
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
              <div>
                <strong className="text-white block">Platform Entity:</strong>
                Giterp Technologies / CBSE School ERP
              </div>
              <div>
                <strong className="text-white block">Official Grievance Email:</strong>
                <a href="mailto:grievance@giterp.com" className="text-emerald-300 underline hover:text-white">
                  grievance@giterp.com
                </a>
              </div>
              <div>
                <strong className="text-white block">Privacy Inquiries:</strong>
                <a href="mailto:privacy@giterp.com" className="text-emerald-300 underline hover:text-white">
                  privacy@giterp.com
                </a>
              </div>
              <div>
                <strong className="text-white block">Compliance Head:</strong>
                Office of Legal Affairs & Data Security
              </div>
            </div>

            <p className="text-[12px] text-slate-300 mt-4 pt-3 border-t border-white/10 m-0">
              If an inquiry or grievance is not resolved satisfactorily within thirty (30) business days, data principals may approach the <strong>Data Protection Board of India (DPBI)</strong> in accordance with the provisions of the Digital Personal Data Protection Act, 2023.
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
              Institutional Compliance
            </span>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-white/80 font-medium">
              DPDPA 2023 · CBSE Guidelines
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight mb-3">
            Privacy Policy & Data Protection Charter
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-3xl leading-relaxed mb-6 font-normal">
            This charter outlines how Giterp safeguards student information systems, academic marks, parent communications, staff credentials, and transport data across our multi-school cloud ERP platform.
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
              <span className="text-white/60">Status:</span>{' '}
              <strong className="text-emerald-400">Statutory Compliant</strong>
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
                <label htmlFor="search-policy" className="block text-xs font-mono font-semibold uppercase text-slate-600 mb-1.5">
                  Search Policy Topics
                </label>
                <div className="relative">
                  <input
                    id="search-policy"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Minors, Biometric, Fees, GPS..."
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
                      No policy sections match &ldquo;{searchQuery}&rdquo;.
                    </p>
                  )}
                </nav>
              </div>

              {/* Need Assistance Callout */}
              <div className="p-4 rounded-xl bg-[#122A24]/5 border border-[#122A24]/10 text-xs text-slate-700">
                <p className="font-semibold text-[var(--ink-navy)] mb-1">
                  School Compliance Officer?
                </p>
                <p className="mb-2.5 leading-relaxed text-slate-600">
                  Require a signed Data Processing Addendum (DPA) or CBSE compliance audit certificate?
                </p>
                <a
                  href="mailto:privacy@giterp.com?subject=Giterp%20DPA%20Request"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--red-pen)] hover:underline"
                >
                  Request School DPA →
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <article className="lg:col-span-8 space-y-8 print:col-span-12">
            {/* Quick Executive Summary Banner */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[var(--board-2)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--ink-navy)] m-0">
                  Giterp Privacy Commitments at a Glance
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0 mb-4">
                We know that educational data is deeply personal. Here are our four core operational principles:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">Your School Owns Your Data:</strong> We never monetize, sell, or license student or faculty information.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">Zero Behavioral Ad Tracking:</strong> No student profiling, targeted advertisements, or ad-tech scripts.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">Complete Tenant Isolation:</strong> Every school&apos;s data is logically segregated with strict RBAC.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--parchment)]">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong className="text-[var(--ink-navy)]">India DPDPA 2023 Ready:</strong> Dedicated Grievance Redressal Officer and parent rights support.
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

            {/* Bottom Disclaimer */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 leading-relaxed space-y-2">
              <p className="m-0">
                <strong>Policy Amendments:</strong> Giterp reserves the right to amend this Privacy Policy periodically to reflect technological advancements, updates to the Digital Personal Data Protection Act rules, or institutional modifications. When material updates occur, institutional tenants will be notified via administrative dashboard gazettes and emails at least 15 days in advance.
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
            <Link href="/privacy" className="font-semibold text-[var(--ink-navy)] no-underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink-navy)] no-underline">
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
