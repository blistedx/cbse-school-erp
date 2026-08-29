'use client';

import React, { useState } from 'react';
import {
  Send,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Users,
  MessageSquare,
  Bell,
  Smartphone,
  ShieldAlert,
  Clock
} from 'lucide-react';

export interface DashboardBroadcastProps {
  schoolName?: string;
}

export function DashboardBroadcast({ schoolName = 'DPS International — CBSE' }: DashboardBroadcastProps) {
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'PARENTS' | 'FACULTY' | 'BUS_PARENTS'>('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('Heavy Rain Alert: School Dispersal Schedule Adjusted');
  const [broadcastBody, setBroadcastBody] = useState('Due to city meteorological forecast of torrential rain, school will disperse at 01:00 PM today. School buses will depart accordingly.');
  const [isUrgent, setIsUrgent] = useState(true);
  const [broadcastDispatched, setBroadcastDispatched] = useState(false);

  const [broadcastHistory, setBroadcastHistory] = useState([
    {
      id: 'bc1',
      title: 'CBSE Mid-Term Exam Schedule Announced',
      audience: 'All Parents & Students (1,200 Families)',
      channel: 'SMS Gateway + Push Notification',
      time: 'Yesterday, 04:30 PM',
      delivered: '1,194 / 1,200 (99.5%)',
      urgent: false
    },
    {
      id: 'bc2',
      title: 'Emergency: Heavy Rainfall Advisory & Early Dispersal',
      audience: 'Whole School Community',
      channel: 'High-Priority SMS + Instant App Alert',
      time: '24 Aug 2026, 11:15 AM',
      delivered: '1,200 / 1,200 (100%)',
      urgent: true
    },
  ]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const newBc = {
      id: `bc-${Date.now()}`,
      title: broadcastTitle,
      audience: targetAudience === 'ALL' ? 'All 1,200 Families' : targetAudience === 'FACULTY' ? 'All 49 Faculty Staff' : targetAudience === 'BUS_PARENTS' ? 'Bus Route Parents (418)' : 'Parents Only',
      channel: isUrgent ? 'High-Priority SMS + App Push Alert' : 'SMS Gateway + Noticeboard',
      time: 'Just now',
      delivered: '1,200 / 1,200 (100%)',
      urgent: isUrgent
    };
    setBroadcastHistory([newBc, ...broadcastHistory]);
    setBroadcastDispatched(true);
    setTimeout(() => setBroadcastDispatched(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                School-Wide Emergency Broadcast &amp; SMS Gateway
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                Dispatch instant high-priority emergency notifications, SMS alerts and app pushes to families and staff
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Composer */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-[#122A24]">Compose Announcement / Alert</h3>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Select Target Audience</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ALL', label: 'All 1,200 Families' },
                  { id: 'PARENTS', label: 'Parents Only' },
                  { id: 'FACULTY', label: 'All 49 Faculty' },
                  { id: 'BUS_PARENTS', label: 'Transport Bus Users' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id as any)}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center ${
                      targetAudience === aud.id
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Announcement Headline</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Broadcast Message Content</label>
              <textarea
                rows={4}
                required
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-600 resize-none leading-relaxed"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-red-50 rounded-xl border border-red-200">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded"
              />
              <span className="text-xs font-bold text-red-900">
                Flag as High Priority / Siren Alert (Bypasses DND &amp; sends priority SMS)
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {broadcastDispatched ? 'Emergency Broadcast Dispatched Successfully! ✓' : 'Dispatch School-Wide Broadcast Now'}
            </button>
          </form>
        </div>

        {/* Right: Broadcast Delivery Log History */}
        <div className="bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" /> Past Broadcast Logs
          </h3>

          <div className="space-y-3">
            {broadcastHistory.map((bc) => (
              <div
                key={bc.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900">{bc.title}</h4>
                  {bc.urgent && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800 shrink-0">
                      URGENT
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-medium">Audience: {bc.audience}</div>
                <div className="flex items-center justify-between text-[10.5px] text-slate-600 pt-1 border-t border-slate-200 font-mono">
                  <span>{bc.time}</span>
                  <span className="font-bold text-emerald-800">{bc.delivered}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
