/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  Layers,
  Send,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
  Building,
  Bus,
  Clock
} from 'lucide-react';

export interface RolePrincipalViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RolePrincipalView({ activeTab, setActiveTab }: RolePrincipalViewProps) {
  // Approvals State
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 'app1',
      type: 'LEAVE',
      title: 'Casual Leave Request (1 Day)',
      applicant: 'Mrs. Suman Verma (Senior English)',
      reason: 'Family wedding event in Jaipur.',
      date: 'Tomorrow, 30 Aug 2026',
      substitute: 'Sub: Ms. Sarah Joseph',
      status: 'PENDING'
    },
    {
      id: 'app2',
      type: 'CONCESSION',
      title: 'Sibling Fee Concession (15%)',
      applicant: 'Mr. Rajesh Mehra (Parent of Ayush & Riya)',
      reason: 'Eligible for 2nd child CBSE concession policy.',
      date: 'Q2 Installment (₹4,275 Discount)',
      substitute: 'Accounts verified eligibility',
      status: 'PENDING'
    },
    {
      id: 'app3',
      type: 'PURCHASE',
      title: 'Physics Optics Lab Apparatus Order',
      applicant: 'Mr. R.K. Nair (HOD Science)',
      reason: 'Optical benches & convex lenses for Class XII practicals.',
      date: 'PO #DPS-PO-8812 • Amount: ₹14,200',
      substitute: 'Vendor: Scientific Supplies Ltd',
      status: 'PENDING'
    }
  ]);

  // Broadcast State
  const [broadcastAudience, setBroadcastAudience] = useState<'ALL' | 'PARENTS' | 'TEACHERS' | 'TRANSPORT'>('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('Heavy Rain Alert: School Timings Adjusted');
  const [broadcastBody, setBroadcastBody] = useState('Due to city meteorological forecast of torrential rain, school will disperse at 01:00 PM today. School buses will depart accordingly.');
  const [isUrgent, setIsUrgent] = useState(true);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);

  const handleSendMobileBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      alert('Please fill title and message body.');
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastSuccessMsg(null);

    try {
      const res = await fetch('/api/notifications/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: isUrgent ? `🚨 ${broadcastTitle.trim()}` : broadcastTitle.trim(),
          body: broadcastBody.trim(),
          url: '/mobile',
          audience: broadcastAudience,
          urgent: isUrgent,
          senderName: 'Dr. K. S. Mukherjee (Principal)',
          senderRole: 'PRINCIPAL'
        })
      });

      const data = await res.json();
      if (data.success) {
        setBroadcastSuccessMsg(data.message || `Dispatched to ${data.results?.sent || 1} active device(s) successfully!`);
        // Trigger local notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(isUrgent ? `🚨 ${broadcastTitle}` : broadcastTitle, {
              body: broadcastBody,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png'
            });
          } catch (e) {}
        }
      } else {
        alert(data.error || 'Failed to dispatch broadcast');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSendingBroadcast(false);
      setTimeout(() => setBroadcastSuccessMsg(null), 6000);
    }
  };

  const handleApprovalAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setPendingApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  const pendingCount = pendingApprovals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="p-4 space-y-4">
      {/* Principal Profile Header */}
      <div className="p-4 bg-gradient-to-br from-[#122A24] via-[#163830] to-[#122A24] text-white rounded-3xl shadow-lg border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-bold flex items-center justify-center text-xl shadow-md">
            👔
          </div>
          <div>
            <div className="font-extrabold text-base text-white">Dr. K. S. Mukherjee</div>
            <div className="text-xs text-amber-300 font-semibold">Principal & Director of Academics</div>
            <div className="text-[11px] text-emerald-200 mt-0.5">DPS International • CBSE Affil. 2130091</div>
          </div>
        </div>

        <div className="text-right">
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-[10px] font-bold">
            Campus Live
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: COMMAND PULSE / OVERVIEW
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div className="space-y-4 animate-fade-in">
          {/* Key Executive Counters */}
          <div className="grid grid-cols-2 gap-3">
            {/* Today's Fee Collections */}
            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Collections Today</span>
                <DollarSign className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-emerald-950 font-mono tracking-tight">₹4,85,000</div>
                <div className="text-[10px] text-emerald-700 font-medium">17 Transactions today</div>
              </div>
              <div className="text-[10px] text-neutral-500 flex items-center justify-between border-t pt-1.5 border-neutral-100">
                <span>Month Target:</span>
                <span className="font-bold text-neutral-800">₹18.2 L (78%)</span>
              </div>
            </div>

            {/* School-Wide Attendance */}
            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Student Attendance</span>
                <UserCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-neutral-900 tracking-tight">94.2%</div>
                <div className="text-[10px] text-neutral-500">1,130 of 1,200 Present</div>
              </div>
              <div className="text-[10px] text-neutral-500 flex items-center justify-between border-t pt-1.5 border-neutral-100">
                <span>Staff Present:</span>
                <span className="font-bold text-emerald-700">48 / 49 (98%)</span>
              </div>
            </div>
          </div>

          {/* Pending Approvals Callout Banner */}
          <div
            onClick={() => setActiveTab('approvals')}
            className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl shadow-md flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                📋
              </div>
              <div>
                <div className="text-xs text-amber-200 font-medium">Action Required</div>
                <div className="text-sm font-extrabold">{pendingCount} Items Pending Your Approval</div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white text-amber-900 text-xs font-bold rounded-lg shadow-sm">
              Review →
            </span>
          </div>

          {/* Real-time Campus Fleet & Safety Radar */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-700" />
                Transport & Safety Telemetry
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All 12 Buses Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="font-black text-neutral-900 font-mono text-base">12/12</div>
                <div className="text-[10px] text-neutral-500">Buses on Route</div>
              </div>
              <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="font-black text-emerald-700 font-mono text-base">418</div>
                <div className="text-[10px] text-neutral-500">Students Boarded</div>
              </div>
              <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="font-black text-neutral-900 font-mono text-base">0</div>
                <div className="text-[10px] text-neutral-500">SOS Delays</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: EXECUTIVE APPROVALS STACK
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-neutral-900">Principal Approvals Desk</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {pendingCount} Pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map((app) => (
              <div
                key={app.id}
                className={`p-4 rounded-2xl border transition-all ${
                  app.status === 'APPROVED'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : app.status === 'REJECTED'
                    ? 'bg-red-50/70 border-red-300'
                    : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-neutral-100 text-neutral-700">
                    {app.type}
                  </span>
                  <span className={`text-xs font-extrabold ${
                    app.status === 'APPROVED' ? 'text-emerald-700' : app.status === 'REJECTED' ? 'text-red-700' : 'text-amber-600'
                  }`}>
                    {app.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-neutral-900 mt-2">{app.title}</h4>
                <div className="text-xs text-neutral-700 font-medium mt-1">{app.applicant}</div>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{app.reason}</p>
                <div className="text-[11px] text-emerald-800 font-mono font-medium mt-2 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  {app.date} • {app.substitute}
                </div>

                {app.status === 'PENDING' && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => handleApprovalAction(app.id, 'REJECTED')}
                      className="py-2 bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction(app.id, 'APPROVED')}
                      className="py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: LIVE PULSE / ANALYTICS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <h3 className="font-extrabold text-base text-neutral-900">Class-Wise Attendance Health</h3>
            
            <div className="space-y-2.5">
              {[
                { class: 'Class VI', pct: 98, students: '118/120' },
                { class: 'Class VII', pct: 95, students: '114/120' },
                { class: 'Class VIII', pct: 92, students: '110/120' },
                { class: 'Class IX', pct: 96, students: '115/120' },
                { class: 'Class X (Board)', pct: 99, students: '119/120' },
                { class: 'Class XI', pct: 89, students: '107/120' },
                { class: 'Class XII (Board)', pct: 97, students: '116/120' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-800">{item.class}</span>
                    <span className="font-mono text-neutral-600">{item.students} ({item.pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.pct >= 95 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: EMERGENCY BROADCAST
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-neutral-900">School-Wide Broadcast</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                SMS + Push Alert
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBroadcastAudience('ALL')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      broadcastAudience === 'ALL' ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    All 1,200 Families
                  </button>
                  <button
                    onClick={() => setBroadcastAudience('TEACHERS')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      broadcastAudience === 'TEACHERS' ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    All 49 Faculty Staff
                  </button>
                  <button
                    onClick={() => setBroadcastAudience('PARENTS')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      broadcastAudience === 'PARENTS' ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    Parents Only (1,150)
                  </button>
                  <button
                    onClick={() => setBroadcastAudience('TRANSPORT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      broadcastAudience === 'TRANSPORT' ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    Bus Route Parents (418)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Announcement Headline</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <span className="text-xs font-bold text-red-700">Flag as High Priority / Emergency Alert (Audible Siren + Web Push)</span>
              </label>

              {broadcastSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{broadcastSuccessMsg}</span>
                </div>
              )}

              <button
                onClick={handleSendMobileBroadcast}
                disabled={isSendingBroadcast}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {isSendingBroadcast ? 'Dispatching Web Push & SMS Alert...' : 'Dispatch Instant Emergency Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
