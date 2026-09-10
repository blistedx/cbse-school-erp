/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  category: 'onboarding' | 'cbse' | 'fees' | 'security' | 'offline';
  question: string;
  answer: React.ReactNode;
}

export function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-4': true
  });
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FAQItem[] = useMemo(() => [
    {
      id: 'faq-1',
      category: 'onboarding',
      question: 'How quickly can our school go live on Giterp?',
      answer: (
        <p className="m-0">
          Most schools are fully operational within <strong>24 to 48 hours</strong>. Our dedicated onboarding team configures your school profile, academic terms, classes, and sections, and ingests your student and faculty rosters so your staff can start taking attendance on day one.
        </p>
      )
    },
    {
      id: 'faq-2',
      category: 'onboarding',
      question: 'Can we migrate our existing student and fee data from Excel or another ERP?',
      answer: (
        <p className="m-0">
          <strong>Yes, absolutely.</strong> We provide 100% free historical data migration. You can simply upload your existing Excel or CSV spreadsheets (or data exports from legacy software), and our ingestion engine maps scholars, APAAR numbers, parent contacts, and fee balances with zero data loss.
        </p>
      )
    },
    {
      id: 'faq-3',
      category: 'onboarding',
      question: 'Is training provided for teachers and administrative staff?',
      answer: (
        <p className="m-0">
          Yes. We provide complimentary live virtual onboarding sessions tailored to each user group: <em>School Principals</em> (oversight & analytics), <em>Teachers</em> (roll call, diary & marks entry), <em>Accountants</em> (fee collection & invoicing), and <em>Transport Coordinators</em>.
        </p>
      )
    },
    {
      id: 'faq-4',
      category: 'cbse',
      question: 'Does Giterp support the latest CBSE grading patterns, APAAR IDs, and UDISE+?',
      answer: (
        <p className="m-0">
          Yes. Giterp is built natively for CBSE schools. It includes standardized <strong>9-point scholastic grading</strong>, co-scholastic assessment rubrics, Automated Permanent Academic Account Registry (<strong>APAAR</strong>) tracking, PEN numbers, and one-click data preparation for official <strong>UDISE+</strong> and <strong>CBSE OASIS</strong> submissions.
        </p>
      )
    },
    {
      id: 'faq-5',
      category: 'cbse',
      question: 'Can we generate automated Transfer Certificates (TC) and Report Cards?',
      answer: (
        <p className="m-0">
          Yes. With one click, generate CBSE-compliant <strong>Term Report Cards</strong>, automated <strong>Transfer Certificates (TC)</strong> with chronological serial numbering, Bonafide Certificates, Character Certificates, and Merit citations—complete with your school emblem and tamper-resistant digital verification QR codes.
        </p>
      )
    },
    {
      id: 'faq-6',
      category: 'fees',
      question: 'How do fee collections work, and does Giterp charge a commission on school fees?',
      answer: (
        <p className="m-0">
          <strong>Giterp charges 0% commission on your tuition fees.</strong> We integrate with RBI-authorized payment aggregators (such as Razorpay, PayU, and Cashfree). 100% of parent payments settle directly into the school&apos;s designated bank account. The system also fully supports cash and cheque fee counter receipts with instant digital challans.
        </p>
      )
    },
    {
      id: 'faq-7',
      category: 'fees',
      question: 'Can automated fee reminders and receipts be sent via SMS or WhatsApp?',
      answer: (
        <p className="m-0">
          Yes. You can trigger automated, scheduled SMS, Email, and Web Push notifications for upcoming fee due dates, payment confirmations, and digital tax receipts, drastically cutting down administrative follow-up time and overdue balances.
        </p>
      )
    },
    {
      id: 'faq-8',
      category: 'security',
      question: 'Who owns our school’s data, and are you compliant with India’s DPDPA 2023?',
      answer: (
        <div className="space-y-2">
          <p className="m-0">
            <strong>Your school retains 100% undisputed ownership of all institutional and student data.</strong>
          </p>
          <p className="m-0 text-xs sm:text-sm text-slate-600">
            Giterp acts solely as a secure Data Processor. We comply with Section 9 of India&apos;s <em>Digital Personal Data Protection Act, 2023 (DPDPA)</em>: zero behavioral ad tracking, zero data monetization, and complete cryptographic multi-tenant isolation. Read our full{' '}
            <Link href="/privacy" className="text-[var(--board-2)] font-semibold underline">
              Privacy Policy
            </Link>.
          </p>
        </div>
      )
    },
    {
      id: 'faq-9',
      category: 'security',
      question: 'How are cloud backups and disaster recovery handled?',
      answer: (
        <p className="m-0">
          All data is encrypted with <strong>AES-256 at rest</strong> and <strong>TLS 1.3 in transit</strong>. Daily automated Point-in-Time Recovery (PITR) backups are maintained across geographically distributed enterprise cloud clusters (MongoDB Atlas), ensuring instant restore capabilities and 99.9% availability.
        </p>
      )
    },
    {
      id: 'faq-10',
      category: 'offline',
      question: 'What happens if school Wi-Fi or internet goes down during morning roll call?',
      answer: (
        <p className="m-0">
          <strong>Your morning assembly will not stop.</strong> Giterp is engineered as an offline-first Progressive Web App (PWA). Teachers can continue recording daily attendance and marks even in network dead-zones. The app securely buffers records locally in IndexedDB and automatically syncs with the cloud database the moment connection is restored.
        </p>
      )
    },
    {
      id: 'faq-11',
      category: 'offline',
      question: 'Is Giterp available on mobile phones and tablets?',
      answer: (
        <p className="m-0">
          Yes. Giterp installs directly to the home screen of Android phones, iPhones, iPads, and Windows/Mac desktops as an installable PWA. There is no need for teachers or parents to update bulky apps from app stores—updates happen automatically in the background.
        </p>
      )
    },
    {
      id: 'faq-12',
      category: 'onboarding',
      question: 'Can an educational trust or society manage multiple school campuses together?',
      answer: (
        <p className="m-0">
          Yes! Giterp was architected specifically for multi-school networks. Society management and trust directors can view aggregated overview metrics across all branch campuses through the centralized <strong>Agency Hub</strong>, while each individual school campus maintains its own isolated registers, staff, and student logins.
        </p>
      )
    }
  ], []);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'onboarding', label: 'Onboarding & Migration' },
    { id: 'cbse', label: 'CBSE & Academics' },
    { id: 'fees', label: 'Fees & Billing' },
    { id: 'security', label: 'Security & Privacy' },
    { id: 'offline', label: 'Offline & Mobile PWA' }
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    faqs.forEach((f) => (all[f.id] = true));
    setOpenItems(all);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  return (
    <section className="mb-24 scroll-mt-20" id="faq">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[2px] text-[var(--board-2)] mb-2.5">
          <span className="w-5 h-[1.5px] bg-[var(--board-2)] inline-block" />
          <span>Frequently Asked Questions</span>
          <span className="w-5 h-[1.5px] bg-[var(--board-2)] inline-block" />
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-4xl text-[var(--ink-navy)] tracking-tight mb-3">
          Everything You Need to Know About Giterp
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed m-0">
          Straight answers regarding CBSE compliance, onboarding speed, fee collection, offline reliability, and student data protections.
        </p>
      </div>

      {/* Interactive Controls Bar */}
      <div className="max-w-4xl mx-auto mb-8 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. CBSE, Fees, Offline, Migration, DPDPA)..."
            aria-label="Search questions by keyword"
            suppressHydrationWarning
            className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--board-2)] focus:border-transparent text-slate-800"
          />
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none"
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
              aria-label="Clear search query"
              className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills & Expand/Collapse Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#122A24] text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 shrink-0 self-end sm:self-auto">
            <button
              onClick={expandAll}
              type="button"
              className="hover:text-[var(--ink-navy)] cursor-pointer bg-transparent border-none p-0 underline"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={collapseAll}
              type="button"
              className="hover:text-[var(--ink-navy)] cursor-pointer bg-transparent border-none p-0 underline"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="max-w-4xl mx-auto space-y-3">
        {filteredFaqs.map((faq, index) => {
          const isOpen = !!openItems[faq.id];
          return (
            <div
              key={faq.id}
              className={`rounded-xl border transition-all duration-200 bg-white overflow-hidden ${
                isOpen
                  ? 'border-[var(--board-2)] shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                id={`faq-header-${faq.id}`}
                aria-controls={`faq-panel-${faq.id}`}
                onClick={() => toggleItem(faq.id)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--board-2)] focus-visible:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                      isOpen
                        ? 'bg-[#122A24] text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Q{index + 1}
                  </span>
                  <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--ink-navy)] m-0 leading-snug">
                    {faq.question}
                  </h3>
                </div>
                <div
                  aria-hidden="true"
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-slate-100 text-[var(--ink-navy)]' : 'text-slate-400'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div
                  id={`faq-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-header-${faq.id}`}
                  className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed animate-in fade-in duration-150"
                >
                  <div className="pt-3">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <p className="text-sm m-0 mb-2">No matching questions found for &ldquo;{searchQuery}&rdquo;.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              type="button"
              className="text-xs font-semibold text-[var(--board-2)] underline cursor-pointer"
            >
              Reset search & filter
            </button>
          </div>
        )}
      </div>

      {/* Still Have Questions Box */}
      <div className="max-w-4xl mx-auto mt-8 p-5 sm:p-6 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="font-display font-semibold text-base text-[var(--ink-navy)] m-0 mb-1">
            Have a question specific to your school branch?
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 m-0 leading-relaxed">
            Our educational systems team can review your current student strength and CBSE configuration.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/request-demo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[var(--ink-navy)] hover:bg-[var(--red-pen)] transition-colors no-underline shadow-2xs"
          >
            <span>Ask an ERP Specialist</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
