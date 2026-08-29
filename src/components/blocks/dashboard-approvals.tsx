'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileText,
  Check,
  X,
  Filter,
  Users
} from 'lucide-react';

export interface DashboardApprovalsProps {
  schoolName?: string;
}

export function DashboardApprovals({ schoolName = 'DPS International — CBSE' }: DashboardApprovalsProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'LEAVE' | 'CONCESSION' | 'PURCHASE'>('ALL');

  const [approvals, setApprovals] = useState([
    {
      id: 'app1',
      type: 'LEAVE',
      category: 'Faculty Leave Application',
      title: 'Casual Leave Request (1 Day)',
      applicant: 'Mrs. Suman Verma (Senior Faculty, English)',
      reason: 'Family wedding event in Jaipur.',
      date: 'Tomorrow, 30 Aug 2026',
      substitute: 'Sub: Ms. Sarah Joseph (Room 204)',
      status: 'PENDING'
    },
    {
      id: 'app2',
      type: 'CONCESSION',
      category: 'Fee Concession / Sibling Aid',
      title: 'Sibling Fee Concession (15% Q2 Waiver)',
      applicant: 'Mr. Rajesh Mehra (Parent of Ayush & Riya)',
      reason: 'Eligible for 2nd child CBSE sibling discount policy.',
      date: 'Q2 Installment (₹4,275 Discount)',
      substitute: 'Accounts verified eligibility',
      status: 'PENDING'
    },
    {
      id: 'app3',
      type: 'PURCHASE',
      category: 'Lab Equipment Purchase Order',
      title: 'Physics Optics Lab Apparatus Order',
      applicant: 'Mr. R.K. Nair (HOD Science)',
      reason: 'Optical benches & convex lenses for Class XII practicals.',
      date: 'PO #DPS-PO-8812 • Amount: ₹14,200',
      substitute: 'Vendor: Scientific Supplies Ltd',
      status: 'PENDING'
    },
    {
      id: 'app4',
      type: 'LEAVE',
      category: 'Faculty Leave Application',
      title: 'Medical Leave Request (2 Days)',
      applicant: 'Mr. Amit Verma (Computer Science)',
      reason: 'Doctor prescribed recovery for seasonal viral fever.',
      date: '02 Sep - 03 Sep 2026',
      substitute: 'Sub: Mr. Vikram Singh',
      status: 'APPROVED'
    }
  ]);

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setApprovals(prev => prev.map(a => (a.id === id ? { ...a, status: action } : a)));
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  const filteredApprovals = approvals.filter(a => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Principal Executive Approvals Desk
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                Review staff leave requests, fee concessions, and purchase requisition orders
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs">
            {pendingCount} Pending Approvals
          </span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 bg-white p-3.5 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase">Filter:</span>
        {(['ALL', 'LEAVE', 'CONCESSION', 'PURCHASE'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === type ? 'bg-[#122A24] text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {type === 'ALL' && 'All Requests'}
            {type === 'LEAVE' && 'Staff Leaves'}
            {type === 'CONCESSION' && 'Fee Concessions'}
            {type === 'PURCHASE' && 'Purchase Orders'}
          </button>
        ))}
      </div>

      {/* Approvals Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApprovals.map((app) => (
          <div
            key={app.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
              app.status === 'APPROVED'
                ? 'bg-emerald-50/50 border-emerald-300'
                : app.status === 'REJECTED'
                ? 'bg-red-50/50 border-red-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  {app.category}
                </span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  app.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : app.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {app.status}
                </span>
              </div>

              <h3 className="font-display font-bold text-base text-[#122A24] mt-3">{app.title}</h3>
              <div className="text-xs font-semibold text-slate-800 mt-1">{app.applicant}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{app.reason}</p>

              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-emerald-900 font-mono">
                {app.date} • {app.substitute}
              </div>
            </div>

            {app.status === 'PENDING' ? (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => handleAction(app.id, 'REJECTED')}
                  className="py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleAction(app.id, 'APPROVED')}
                  className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Approve
                </button>
              </div>
            ) : (
              <div className="pt-2 text-center text-xs font-bold text-slate-500">
                Decision Logged &amp; Notified to Applicant
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
