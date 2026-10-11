/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Calendar, Shield, RefreshCw } from 'lucide-react';

interface PrincipalHeaderProps {
  schoolName?: string;
  onOpenMobile?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PrincipalHeader({
  schoolName = 'Delhi Public School',
  onOpenMobile,
  onRefresh,
  isRefreshing = false
}: PrincipalHeaderProps) {
  const pathname = usePathname();

  const getBreadcrumbTitle = () => {
    if (pathname === '/principal') return 'Executive Dashboard Overview';
    if (pathname.startsWith('/principal/approvals')) return 'Approvals & Statutory Petitions';
    if (pathname.startsWith('/principal/students')) return 'Scholars & Students Master';
    if (pathname.startsWith('/principal/faculty')) return 'Faculty & Staff Roster';
    if (pathname.startsWith('/principal/reports')) return 'Institutional Reports & Analytics';
    if (pathname.startsWith('/principal/notices')) return 'Circulars & Official Broadcasts';
    if (pathname.startsWith('/principal/profile')) return 'Principal Credentials & Office';
    return 'Principal Panel';
  };

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#DCE8E0] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-[#2D5A4E] hover:text-[#122A24] hover:bg-[#F4F8F5] transition"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#2D5A4E]/80">
            <Link href="/principal" className="hover:text-[#122A24] transition">
              Principal Office
            </Link>
            <span>/</span>
            <span className="text-[#122A24] font-medium truncate max-w-[150px] sm:max-w-none">
              {getBreadcrumbTitle()}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#122A24] tracking-tight flex items-center gap-2">
            <span>{getBreadcrumbTitle()}</span>
          </h2>
        </div>
      </div>

      {/* Right: Academic Session, Date & Refresh */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Academic Session Chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5EF] border border-[#DCE8E0] text-[11px] font-mono text-[#122A24]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-semibold">SESSION: 2026-27</span>
        </div>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F8F5] border border-[#DCE8E0] text-[11px] text-[#2D5A4E] font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
          <span>{todayStr}</span>
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-[#2D5A4E] hover:text-[#122A24] hover:bg-[#F4F8F5] border border-[#DCE8E0] transition cursor-pointer disabled:opacity-50"
            title="Refresh Live School Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#10B981]' : ''}`} />
          </button>
        )}

        {/* Oversight Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#122A24] text-white text-[11px] font-semibold tracking-tight shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">READ &amp; APPROVE ONLY</span>
          <span className="sm:hidden font-mono">EXEC</span>
        </div>
      </div>
    </header>
  );
}
