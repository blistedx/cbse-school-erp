'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  ShieldCheck,
  Search,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Database,
  BarChart3,
  Layers,
  GraduationCap,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Key,
  XCircle
} from 'lucide-react';
import { School, DemoRequest } from '@/lib/types';

export function DashboardAgency() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'schools'>('requests');
  const [loading, setLoading] = useState(true);

  // Approval Modal State
  const [selectedReq, setSelectedReq] = useState<DemoRequest | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [adminId, setAdminId] = useState('admin');
  const [adminPin, setAdminPin] = useState('123456');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schRes, reqRes] = await Promise.all([
        fetch('/api/schools'),
        fetch('/api/request-demo')
      ]);
      const schData = await schRes.json();
      const reqData = await reqRes.json();

      if (schData.success && Array.isArray(schData.schools)) {
        setSchools(schData.schools);
      }
      if (reqData.success && Array.isArray(reqData.requests)) {
        setDemoRequests(reqData.requests);
      }
    } catch (e) {
      console.error('Failed to load agency data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproval = (req: DemoRequest) => {
    setSelectedReq(req);
    const words = req.school_name.trim().split(/\s+/).filter(w => w.length > 0);
    const initials = words.map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'SCH';
    const year = new Date().getFullYear();
    setCustomCode(`${initials}-${year}`);
    setAdminId(`${initials}-1001`);
    setAdminPin('123456');
    setActionMessage('');
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setActionLoading(true);
    setActionMessage('');

    try {
      const res = await fetch('/api/agency/approve-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedReq.id,
          schoolCode: customCode,
          adminId,
          adminPin,
          action: 'APPROVE'
        })
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ Success! School approved. Code: [${customCode}] & Credentials issued.`);
        setTimeout(() => {
          setSelectedReq(null);
          loadData();
        }, 1500);
      } else {
        setActionMessage(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      await fetch('/api/agency/approve-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'REJECT' })
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const pendingRequests = demoRequests.filter(r => r.status === 'PENDING');
  const filteredSchools = schools.filter(
    (s) =>
      s.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[var(--parchment)] text-[var(--text-dark)] font-sans antialiased flex flex-col">
      {/* Clean Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--line)] px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <span className="seal-dark seal shadow-sm">E</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-lg text-[var(--ink-navy)] tracking-tight">
                  EduGit AgencyOS
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--board-1)] text-white font-semibold">
                  Admin Console
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-[var(--board-2)] block -mt-0.5 opacity-85">
                Onboarding Approvals & Tenant Management
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-medium text-[var(--ink-navy)] ml-4">
            <Link href="/" className="opacity-75 hover:opacity-100 transition-opacity no-underline">
              Public Portal
            </Link>
            <Link href="/request-demo" className="opacity-75 hover:opacity-100 transition-opacity no-underline">
              Submit Request
            </Link>
            <Link href="/login" className="opacity-75 hover:opacity-100 transition-opacity no-underline">
              School Sign In
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/request-demo"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--ink-navy)] hover:bg-[var(--red-pen)] text-white rounded-lg text-xs font-semibold shadow-sm transition-all no-underline hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> New Demo Lead
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1160px] w-full mx-auto px-6 sm:px-10 py-10 space-y-8">
        {/* Banner & Navigation Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[1.5px] uppercase text-[var(--red-pen)] font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-[var(--red-pen)] inline-block" /> Central Admin Desk
            </div>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink-navy)] tracking-tight">
              Onboarding & Tenant Approvals
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review incoming school applications, approve credentials, and manage active MongoDB institutional databases.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 p-1 rounded-lg self-start sm:self-auto font-mono text-xs shadow-sm">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded font-semibold transition-colors border-none cursor-pointer flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-[var(--ink-navy)] text-white'
                  : 'bg-transparent text-[var(--ink-navy)] hover:bg-slate-50'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Demo Requests ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('schools')}
              className={`px-3 py-1.5 rounded font-semibold transition-colors border-none cursor-pointer flex items-center gap-2 ${
                activeTab === 'schools'
                  ? 'bg-[var(--ink-navy)] text-white'
                  : 'bg-transparent text-[var(--ink-navy)] hover:bg-slate-50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Active Tenants ({schools.length})
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-[10px] border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider uppercase text-slate-500 font-semibold">
                Pending Requests
              </span>
              <Clock className="h-4 w-4 text-[var(--red-pen)]" />
            </div>
            <div className="font-display font-bold text-3xl text-[var(--red-pen)] mt-3">
              {pendingRequests.length}
            </div>
            <div className="font-mono text-[11px] text-[#7d7a6c] mt-1 font-medium">
              Awaiting Approval
            </div>
          </div>

          <div className="bg-white p-6 rounded-[10px] border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider uppercase text-slate-500 font-semibold">
                Active Campuses
              </span>
              <Building2 className="h-4 w-4 text-[var(--board-2)]" />
            </div>
            <div className="font-display font-bold text-3xl text-[var(--ink-navy)] mt-3">
              {schools.length}
            </div>
            <div className="font-mono text-[11px] text-[var(--board-2)] mt-1 font-medium">
              Approved & Provisioned
            </div>
          </div>

          <div className="bg-white p-6 rounded-[10px] border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider uppercase text-slate-500 font-semibold">
                Email Dispatch
              </span>
              <Mail className="h-4 w-4 text-[var(--board-2)]" />
            </div>
            <div className="font-display font-bold text-3xl text-[var(--ink-navy)] mt-3">
              Gmail SMTP
            </div>
            <div className="font-mono text-[11px] text-emerald-600 mt-1 font-medium">
              ✦ blistedx@gmail.com
            </div>
          </div>

          <div className="bg-white p-6 rounded-[10px] border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider uppercase text-slate-500 font-semibold">
                Security & Isolation
              </span>
              <ShieldCheck className="h-4 w-4 text-[var(--ink-navy)]" />
            </div>
            <div className="font-display font-bold text-3xl text-[var(--ink-navy)] mt-3">
              Protected
            </div>
            <div className="font-mono text-[11px] text-slate-500 mt-1 font-medium">
              No Unapproved Access
            </div>
          </div>
        </div>

        {/* SECTION 1: INCOMING DEMO REQUESTS TABLE */}
        {activeTab === 'requests' && (
          <div className="bg-white border border-[var(--line)] rounded-[10px] shadow-[0_12px_30px_-15px_rgba(15,23,42,0.15)] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--line)] font-mono text-xs tracking-wider uppercase text-[var(--ink-navy)] bg-slate-50/70">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--red-pen)] inline-block" />
                Pending Demo Requests & Applications
              </span>
              <span>{pendingRequests.length} pending review</span>
            </div>

            <div className="divide-y divide-slate-200">
              {demoRequests.map((req) => (
                <div key={req.id} className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-semibold text-base text-[var(--ink-navy)]">
                        {req.school_name}
                      </span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        req.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>📍 <strong>Location:</strong> {req.city || 'N/A'}</span>
                      <span>🎓 <strong>Board:</strong> {req.board || 'CBSE'}</span>
                      <span>👥 <strong>Strength:</strong> {req.strength || 'N/A'} students</span>
                      <span>👤 <strong>Contact:</strong> {req.contact_name}</span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span>📧 <a href={`mailto:${req.email}`} className="text-[var(--red-pen)] font-medium underline">{req.email}</a></span>
                      <span>📞 <span className="font-medium text-[var(--ink-navy)]">{req.phone || 'N/A'}</span></span>
                      {req.notes && <span className="italic">📝 "{req.notes}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {req.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleOpenApproval(req)}
                          className="px-4 py-2 bg-[var(--ink-navy)] hover:bg-[var(--board-2)] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Key className="h-3.5 w-3.5" /> Approve & Issue Credentials
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-2 border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-slate-500 rounded-lg text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : req.status === 'APPROVED' ? (
                      <span className="font-mono text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        ✓ Active Code: {req.assigned_school_code}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {demoRequests.length === 0 && !loading && (
                <div className="p-12 text-center space-y-2 text-slate-500 text-xs font-mono">
                  No demo requests received yet. Share the request link with schools to start onboarding.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: ACTIVE INSTITUTIONAL TENANTS TABLE */}
        {activeTab === 'schools' && (
          <div className="bg-white border border-[var(--line)] rounded-[10px] shadow-[0_12px_30px_-15px_rgba(15,23,42,0.15)] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--line)] font-mono text-xs tracking-wider uppercase text-[var(--ink-navy)] bg-slate-50/70">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--board-2)] inline-block" />
                Active Institutional Tenants
              </span>
              <span>{schools.length} active databases</span>
            </div>

            <div className="sheet-ruled px-6 py-4">
              <div className="grid grid-cols-[1fr_120px_120px_100px_90px] gap-3 items-center h-10 text-xs font-mono tracking-wider uppercase text-slate-500 font-semibold border-b border-[var(--line)]">
                <span>Institution Name</span>
                <span>School Code</span>
                <span>Admin Username</span>
                <span>Board</span>
                <span className="text-right">Action</span>
              </div>

              {filteredSchools.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_120px_120px_100px_90px] gap-3 items-center h-[46px] text-[14px]"
                >
                  <div className="truncate font-semibold text-[var(--ink-navy)]">
                    {s.school_name}
                    {s.city && <span className="text-xs text-slate-500 font-normal ml-2">({s.city})</span>}
                  </div>
                  <div className="font-mono text-xs font-semibold text-[var(--red-pen)]">{s.school_code}</div>
                  <div className="font-mono text-xs text-slate-600">{s.admin_id || 'admin'}</div>
                  <div className="font-mono text-xs text-slate-600">{s.board || 'CBSE'}</div>
                  <div className="text-right">
                    <Link
                      href={`/app?school=${s.school_code}`}
                      className="inline-flex items-center gap-1 font-mono text-xs text-[var(--board-1)] hover:text-[var(--red-pen)] font-semibold no-underline"
                    >
                      Launch →
                    </Link>
                  </div>
                </div>
              ))}

              {filteredSchools.length === 0 && !loading && (
                <div className="py-12 text-center space-y-2 text-slate-500 text-xs">
                  No active schools yet. Approve incoming requests from the Requests tab above.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* APPROVAL & CREDENTIALS ISSUANCE MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[var(--line)] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-fade-up">
            <div className="border-b border-slate-200 pb-4">
              <span className="font-mono text-xs text-[var(--red-pen)] font-semibold uppercase tracking-wider">
                Institutional Approval
              </span>
              <h2 className="font-display font-semibold text-2xl text-[var(--ink-navy)] mt-1">
                Approve & Provision School
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Grant access to <strong>{selectedReq.school_name}</strong> and issue login credentials.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--ink-navy)] mb-1">
                  Assigned School Code (Unique Identifier)
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APS-2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm text-[var(--ink-navy)] uppercase bg-slate-50"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The school code will be required by teachers, admins, and students to log in.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--ink-navy)] mb-1">
                    Admin Username / ID
                  </label>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="e.g. APS-1001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--ink-navy)] mb-1">
                    Temporary Password / PIN
                  </label>
                  <input
                    type="text"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 space-y-1">
                <div>👤 <strong>Principal / Contact:</strong> {selectedReq.contact_name}</div>
                <div>📧 <strong>Credentials Email:</strong> Will be sent automatically to <span className="font-semibold text-[var(--red-pen)]">{selectedReq.email}</span></div>
              </div>

              {actionMessage && (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold">
                  {actionMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-5 py-2 bg-[var(--ink-navy)] hover:bg-[var(--red-pen)] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Provisioning...' : 'Approve & Send Credentials →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-7 bg-white">
        <div className="max-w-[1160px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p className="m-0">EduGit AgencyOS · Multi-Tenant School ERP Cloud</p>
          <div className="flex gap-6 text-[13px]">
            <Link href="/" className="hover:text-[var(--ink-navy)] no-underline">
              Public Home
            </Link>
            <Link href="/login" className="hover:text-[var(--ink-navy)] no-underline">
              School Login
            </Link>
            <Link href="/request-demo" className="hover:text-[var(--ink-navy)] no-underline">
              Request Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
