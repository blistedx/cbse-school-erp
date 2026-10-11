/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  UserCheck,
  DollarSign,
  AlertCircle,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  Megaphone,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FileText,
  Briefcase
} from 'lucide-react';
import { PrincipalOverviewData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function PrincipalOverviewPage() {
  const [data, setData] = useState<PrincipalOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/principal/overview');
      if (!res.ok) {
        throw new Error(`Failed to load overview (${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to parse overview data');
      }
    } catch (err: any) {
      console.error('Overview fetch error:', err);
      setError(err.message || 'Unable to connect to live school statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();

    const handleRefresh = () => fetchOverview();
    window.addEventListener('principal:refresh', handleRefresh);
    return () => window.removeEventListener('principal:refresh', handleRefresh);
  }, [fetchOverview]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-32 bg-white rounded-3xl border border-[#DCE8E0]" />
        {/* 7 KPI Tiles Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-white rounded-2xl border border-[#DCE8E0]" />
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white rounded-3xl border border-[#DCE8E0]" />
          <div className="h-72 bg-white rounded-3xl border border-[#DCE8E0]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-sm text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#122A24]">Failed to Load Overview Data</h3>
        <p className="text-xs text-[#2D5A4E] mt-1 mb-4">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 rounded-xl bg-[#122A24] text-white text-xs font-semibold hover:bg-[#1C443A] transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { kpis, charts, recent_notices, approval_breakdown } = data;

  // Maximum collection for bar scaling
  const maxMonthlyCollection = Math.max(
    ...charts.month_wise_fee_collection.map(m => Math.max(m.collected, m.billed, 10000)),
    100000
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. EXECUTIVE GREETING & INSTITUTIONAL HEALTH BANNER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 sm:p-8 relative overflow-hidden">
        {/* Editorial Watermark Typography - Signature Heritage Aesthetic */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[210px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
          >
            Principal
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
          >
            Executive
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Office of the Principal • Official Oversight</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-[#122A24]">
              Welcome, Dr. Abhishek Shukla
            </h1>
            <p className="text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed font-sans text-[#2D5A4E]">
              Real-time daily attendance verification, fee collection metrics, and pending statutory authorizations for{' '}
              <strong className="text-[#122A24] font-semibold underline decoration-emerald-600/40 underline-offset-2">
                {data.school_name}
              </strong>{' '}
              (Academic Session {data.academic_session}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/principal/approvals"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-sm bg-[#C4432B] hover:bg-[#b03a24] text-white transition transform active:scale-95 no-underline"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Review Approvals ({kpis.pending_approvals_count})</span>
            </Link>

            <Link
              href="/principal/students"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-semibold text-xs border border-[#DCE8E0] bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] shadow-2xs transition no-underline"
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Scholars Directory</span>
            </Link>

            <Link
              href="/principal/faculty"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-semibold text-xs border border-[#DCE8E0] bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] shadow-2xs transition no-underline"
            >
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>Faculty Roster</span>
            </Link>

            <Link
              href="/principal/reports"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-semibold text-xs border border-[#DCE8E0] bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] shadow-2xs transition no-underline"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. KPI TILES (7 PRIMARY INDICATORS)
          ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D5A4E] font-mono">
            Institution Key Performance Indicators
          </h2>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Live Database Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* Tile 1: Today's Student Attendance % */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs hover:border-[#10B981] transition flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#2D5A4E]">
              <span className="text-[11px] font-semibold">Student Att.</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
                {kpis.student_attendance_percent}%
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Today Roll Call</span>
              </div>
            </div>
          </div>

          {/* Tile 2: Today's Staff Attendance % */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs hover:border-[#10B981] transition flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#2D5A4E]">
              <span className="text-[11px] font-semibold">Staff Att.</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
                {kpis.staff_attendance_percent}%
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Faculty Biometrics</span>
              </div>
            </div>
          </div>

          {/* Tile 3: Total Students */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs hover:border-[#10B981] transition flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#2D5A4E]">
              <span className="text-[11px] font-semibold">Scholars</span>
              <GraduationCap className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
                {kpis.total_students.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-[#2D5A4E]/80 mt-0.5 font-mono">
                Enrolled (Active)
              </div>
            </div>
          </div>

          {/* Tile 4: Total Staff */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs hover:border-[#10B981] transition flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#2D5A4E]">
              <span className="text-[11px] font-semibold">Total Staff</span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
                {kpis.total_staff.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-[#2D5A4E]/80 mt-0.5 font-mono">
                Faculty &amp; Admin
              </div>
            </div>
          </div>

          {/* Tile 5: Fees Collected (This Month) */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs hover:border-emerald-500 transition flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#2D5A4E]">
              <span className="text-[11px] font-semibold">Collected (Mo)</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight truncate" title={`₹${kpis.fees_collected_this_month.toLocaleString('en-IN')}`}>
                ₹{kpis.fees_collected_this_month.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-mono">
                Current Cycle
              </div>
            </div>
          </div>

          {/* Tile 6: Fees Pending */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs hover:border-amber-400 transition flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#2D5A4E]">
              <span className="text-[11px] font-semibold">Fees Pending</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <div className="text-lg sm:text-xl font-black text-amber-700 tracking-tight truncate" title={`₹${kpis.fees_pending.toLocaleString('en-IN')}`}>
                ₹{kpis.fees_pending.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5 font-mono">
                Outstanding Balance
              </div>
            </div>
          </div>

          {/* Tile 7: Pending Approvals */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs hover:border-amber-400 transition flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[#2D5A4E]">
              <span className="text-[11px] font-semibold">Petitions</span>
              <CheckSquare className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">
                {kpis.pending_approvals_count}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5 font-mono">
                Awaiting Principal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SMALL CHARTS (7-DAY ATTENDANCE & MONTH-WISE FEE COLLECTION)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: 7-Day Attendance Trend (7 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#122A24] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>7-Day Attendance Trajectory</span>
                </h3>
                <p className="text-[11px] text-[#2D5A4E] mt-0.5 font-mono">
                  Daily Roll Call vs Faculty Attendance (%)
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#122A24]" />
                  <span>Students</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                  <span>Staff</span>
                </span>
              </div>
            </div>

            {/* Attendance Chart Bars */}
            <div className="pt-4 pb-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-44 border-b border-[#DCE8E0] pb-2">
                {charts.attendance_trend_7_days.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-mono font-bold text-[#122A24] opacity-0 group-hover:opacity-100 transition">
                      {item.studentPercent}%
                    </div>
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      {/* Student bar */}
                      <div
                        className="w-1/2 max-w-[16px] bg-[#122A24] rounded-t-md transition-all group-hover:bg-[#1C443A]"
                        style={{ height: `${Math.max(item.studentPercent, 8)}%` }}
                        title={`Students: ${item.studentPercent}%`}
                      />
                      {/* Staff bar */}
                      <div
                        className="w-1/2 max-w-[16px] bg-[#10B981] rounded-t-md transition-all group-hover:bg-[#059669]"
                        style={{ height: `${Math.max(item.staffPercent, 8)}%` }}
                        title={`Staff: ${item.staffPercent}%`}
                      />
                    </div>
                    <div className="text-[10px] font-bold text-[#2D5A4E] font-mono mt-1 text-center">
                      {item.day}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] text-[#2D5A4E]">
            <span>Average 7-Day Student Attendance:</span>
            <span className="font-bold text-[#122A24] font-mono">
              {(
                charts.attendance_trend_7_days.reduce((acc, c) => acc + c.studentPercent, 0) /
                Math.max(charts.attendance_trend_7_days.length, 1)
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>

        {/* Right Chart: Month-Wise Fee Collection (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#122A24] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Academic Fee Inflows</span>
                </h3>
                <p className="text-[11px] text-[#2D5A4E] mt-0.5 font-mono">
                  Month-Wise Realized vs Billed Fee Master Demands
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                  <span>Collected</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                  <span>Billed</span>
                </span>
              </div>
            </div>

            {/* Collection Bars */}
            <div className="pt-4 pb-2">
              <div className="grid grid-cols-6 sm:grid-cols-6 gap-2 sm:gap-3 items-end h-44 border-b border-[#DCE8E0] pb-2">
                {charts.month_wise_fee_collection.slice(-6).map((item, idx) => {
                  const collectedPct = Math.min(100, Math.round((item.collected / maxMonthlyCollection) * 100));
                  const billedPct = Math.min(100, Math.round((item.billed / maxMonthlyCollection) * 100));

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="text-[9px] font-mono font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition">
                        ₹{(item.collected / 1000).toFixed(0)}k
                      </div>
                      <div className="w-full flex items-end justify-center gap-1.5 h-32">
                        {/* Billed bar */}
                        <div
                          className="w-1/2 max-w-[16px] bg-amber-200 rounded-t-md transition-all group-hover:bg-amber-300"
                          style={{ height: `${Math.max(billedPct, 6)}%` }}
                          title={`Billed: ₹${item.billed.toLocaleString('en-IN')}`}
                        />
                        {/* Collected bar */}
                        <div
                          className="w-1/2 max-w-[16px] bg-[#10B981] rounded-t-md transition-all group-hover:bg-[#059669]"
                          style={{ height: `${Math.max(collectedPct, 6)}%` }}
                          title={`Collected: ₹${item.collected.toLocaleString('en-IN')}`}
                        />
                      </div>
                      <div className="text-[10px] font-bold text-[#2D5A4E] font-mono mt-1 text-center truncate w-full">
                        {item.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] text-[#2D5A4E]">
            <span>Total Realized This Session:</span>
            <span className="font-bold text-emerald-700 font-mono">
              ₹{charts.month_wise_fee_collection.reduce((a, b) => a + b.collected, 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. ACTION TILES & RECENT NOTICES
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Pending Approvals Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs relative overflow-hidden">
          {/* Background Watermark Typography */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute -top-3 -right-2 font-watermark font-normal text-[#122A24]/[0.045] text-[60px] sm:text-[90px] leading-none tracking-tight z-0 transform rotate-1 origin-top-right"
            >
              Petitions
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#122A24]">
                Authorizations Pending Review
              </h3>
              <p className="text-[11px] text-[#2D5A4E] font-mono mt-0.5">
                Statutory requests requiring Principal signature
              </p>
            </div>
            <Link
              href="/principal/approvals"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative z-10 space-y-3">
            <Link
              href="/principal/approvals?type=CERTIFICATE_TC"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] border border-[#DCE8E0] transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#122A24] text-white flex items-center justify-center font-bold text-xs">
                  TC
                </div>
                <div>
                  <div className="text-xs font-bold text-[#122A24] group-hover:text-emerald-800">
                    Transfer &amp; Character Certificates
                  </div>
                  <div className="text-[11px] text-[#2D5A4E] font-mono">
                    Statutory student clearance
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {approval_breakdown.certificate_tc} Pending
              </span>
            </Link>

            <Link
              href="/principal/approvals?type=FEE_CONCESSION"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] border border-[#DCE8E0] transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <div>
                  <div className="text-xs font-bold text-[#122A24] group-hover:text-emerald-800">
                    Fee Concession &amp; Waivers
                  </div>
                  <div className="text-[11px] text-[#2D5A4E] font-mono">
                    Sibling, Merit, Need-based
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {approval_breakdown.fee_concession} Pending
              </span>
            </Link>

            <Link
              href="/principal/approvals?type=STAFF_LEAVE"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] border border-[#DCE8E0] transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                  LV
                </div>
                <div>
                  <div className="text-xs font-bold text-[#122A24] group-hover:text-emerald-800">
                    Faculty Leave Applications
                  </div>
                  <div className="text-[11px] text-[#2D5A4E] font-mono">
                    Casual, Medical, Duty Leave
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {approval_breakdown.staff_leave} Pending
              </span>
            </Link>
          </div>
        </div>

        {/* Right: Recent Circulars & Broadcast Notices (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs relative overflow-hidden">
          {/* Background Watermark Typography */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute -top-3 -right-2 font-watermark font-normal text-[#122A24]/[0.045] text-[65px] sm:text-[100px] leading-none tracking-tight z-0 transform rotate-1 origin-top-right"
            >
              Gazette
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#122A24] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600" />
                <span>Recent Official Circulars</span>
              </h3>
              <p className="text-[11px] text-[#2D5A4E] font-mono mt-0.5">
                Issued notices to faculty, students and parents
              </p>
            </div>
            <Link
              href="/principal/notices"
              className="px-3 py-1.5 rounded-xl bg-[#122A24] text-white hover:bg-[#1C443A] text-xs font-semibold flex items-center gap-1 transition"
            >
              <span>Broadcast Notice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent_notices.length === 0 ? (
            <div className="p-8 text-center bg-[#F4F8F5] rounded-2xl border border-dashed border-[#DCE8E0]">
              <Megaphone className="w-8 h-8 text-[#2D5A4E]/40 mx-auto mb-2" />
              <p className="text-xs text-[#2D5A4E]">No circulars issued yet this session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent_notices.map((n) => {
                const isUrgent = (n as any).is_pinned || n.category === 'EMERGENCY';
                return (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E0EBE4] hover:border-[#10B981] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
                          {n.target_audience || 'ALL'}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 text-rose-800">
                            URGENT
                          </span>
                        )}
                        <span className="text-[11px] text-[#2D5A4E]/80 font-mono">
                          {n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB') : 'Recent'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#122A24] truncate" title={n.title}>
                        {n.title}
                      </h4>
                      <p className="text-[11px] text-[#2D5A4E] mt-0.5 line-clamp-1">
                        {n.content}
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-[#2D5A4E] shrink-0 sm:text-right">
                      <span>By: {n.posted_by || 'Principal Office'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
