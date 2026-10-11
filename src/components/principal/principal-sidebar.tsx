/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  FileBarChart2,
  Megaphone,
  UserCheck,
  LogOut,
  ShieldCheck,
  ChevronRight,
  School,
  X
} from 'lucide-react';

interface PrincipalSidebarProps {
  schoolName?: string;
  principalName?: string;
  pendingApprovalsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function PrincipalSidebar({
  schoolName = 'Delhi Public School',
  principalName = 'Abhishek Shukla',
  pendingApprovalsCount = 0,
  isOpenMobile = false,
  onCloseMobile
}: PrincipalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Overview',
      href: '/principal',
      icon: LayoutDashboard,
      exact: true
    },
    {
      label: 'Approvals',
      href: '/principal/approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-400 text-[#122A24]'
    },
    {
      label: 'Reports & Audits',
      href: '/principal/reports',
      icon: FileBarChart2
    },
    {
      label: 'Official Notices',
      href: '/principal/notices',
      icon: Megaphone
    },
    {
      label: 'Principal Profile',
      href: '/principal/profile',
      icon: UserCheck
    }
  ];

  const handleLogout = () => {
    try {
      localStorage.removeItem('erp_session_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('current_school');
      document.cookie = 'erp_session_token=; path=/; max-age=0; SameSite=Lax';
    } catch (_) {}
    router.push('/login');
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#122A24] text-white select-none border-r border-[#1C443A]">
      {/* 1. Header / School Branding */}
      <div className="p-6 border-b border-[#1C443A]/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/40">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-emerald-400 font-mono">
                Principal Executive
              </div>
              <h1 className="text-sm font-bold text-white tracking-tight truncate max-w-[160px]" title={schoolName}>
                {schoolName}
              </h1>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-[#1C443A] transition"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Security Badge */}
        <div className="mt-4 px-3 py-1.5 rounded-lg bg-[#0D1F1A] border border-[#1C443A] flex items-center justify-between text-[11px] text-emerald-300/90 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ROLE: PRINCIPAL</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded">
            OVERSIGHT
          </span>
        </div>
      </div>

      {/* 2. Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] uppercase font-bold tracking-wider text-emerald-300/60 font-mono">
          Administration
        </div>
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                active
                  ? 'bg-[#1C443A] text-white shadow-xs font-semibold border border-emerald-500/30'
                  : 'text-emerald-100/80 hover:bg-[#16352E] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    active ? 'text-emerald-400' : 'text-emerald-300/70 group-hover:text-emerald-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-xs ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 opacity-80" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer / User Profile & Logout */}
      <div className="p-4 border-t border-[#1C443A]/80 bg-[#0E221D]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {principalName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate" title={principalName}>
                {principalName}
              </div>
              <div className="text-[10px] text-emerald-300/80 truncate font-mono">
                Head of School
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of Principal Portal"
            className="p-2 rounded-lg text-emerald-300/80 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Modal Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
