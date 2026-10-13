/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  User,
  Check,
  ChevronDown,
  Building2,
  LogOut,
  ChevronRight,
  Search,
  Palette,
  RefreshCw,
  Clock
} from 'lucide-react';
import { School } from '@/lib/types';
import { applyAntigravityTheme } from '@/lib/themes';

export interface SchoolSessionHeaderProps {
  selectedSchool?: School | null;
  availableSchools?: School[];
  selectedSession?: string;
  availableSessions?: string[];
  panelName?: string;
  activeTab?: string;
  tabTitle?: string;
  currentTheme?: string;
  isSyncingLive?: boolean;
  isLoading?: boolean;
  unreadCount?: number;
  currentUser?: any;
  profileForm?: any;
  onSwitchSession?: (session: string) => void;
  onSwitchSchool?: (schoolId: string) => void;
  onToggleSidebar?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenSearch?: () => void;
  onToggleTheme?: (theme?: string) => void;
  onRefresh?: () => void;
  onLogout?: () => void;
}

// Convert session string like "2026-27" to full display format "2026-2027"
export function formatSessionFull(sessionStr: string = '2026-27'): string {
  const clean = (sessionStr || '').trim();
  if (!clean) return '2026-2027';
  if (clean.includes('-') && clean.length <= 7) {
    const [start, end] = clean.split('-');
    if (start && end) {
      if (end.length === 2 && start.length === 4) {
        const century = start.slice(0, 2);
        return `${start}-${century}${end}`;
      }
    }
  }
  return clean;
}

// Map full format like "2026-2027" back to database session code "2026-27"
export function formatSessionDb(fullSession: string = '2026-2027'): string {
  const clean = (fullSession || '').trim();
  if (clean.includes('-') && clean.length === 9) {
    const [start, end] = clean.split('-');
    if (start.length === 4 && end.length === 4) {
      return `${start}-${end.slice(2)}`;
    }
  }
  return clean;
}

export const STANDARD_SESSIONS = [
  { code: '2026-27', display: '2026-2027', label: 'Active Session (CBSE Curricular)' },
  { code: '2025-26', display: '2025-2026', label: 'Previous Academic Session' },
  { code: '2024-25', display: '2024-2025', label: 'Historical Archive Session' },
  { code: '2027-28', display: '2027-2028', label: 'Upcoming Academic Session' }
];

export function SchoolSessionHeader({
  selectedSchool,
  availableSchools = [],
  selectedSession = '2026-27',
  availableSessions,
  panelName = 'Dashboard',
  activeTab = 'overview',
  tabTitle = 'OVERVIEW',
  currentTheme = 'emerald',
  isSyncingLive = false,
  isLoading = false,
  unreadCount = 0,
  currentUser,
  profileForm,
  onSwitchSession,
  onSwitchSchool,
  onToggleSidebar,
  onOpenNotifications,
  onOpenProfile,
  onNavigateTab,
  onOpenSearch,
  onToggleTheme,
  onRefresh,
  onLogout
}: SchoolSessionHeaderProps) {
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [showSchoolMenu, setShowSchoolMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Auto-hydration state for standalone / cross-panel usage
  const [hydratedSchool, setHydratedSchool] = useState<School | null>(selectedSchool || null);
  const [hydratedSession, setHydratedSession] = useState<string>(selectedSession || '2026-27');
  const [hydratedUser, setHydratedUser] = useState<any>(currentUser || null);
  const [hydratedTheme, setHydratedTheme] = useState<string>(currentTheme || 'emerald');
  const [schoolsList, setSchoolsList] = useState<School[]>(availableSchools);

  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const schoolMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sync props to internal state
  useEffect(() => {
    if (selectedSchool) setHydratedSchool(selectedSchool);
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedSession) setHydratedSession(selectedSession);
  }, [selectedSession]);

  useEffect(() => {
    if (currentUser) setHydratedUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (currentTheme) setHydratedTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (availableSchools && availableSchools.length > 0) {
      setSchoolsList(availableSchools);
    }
  }, [availableSchools]);

  // Client-side fallback hydration from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!selectedSchool) {
      try {
        const stored = localStorage.getItem('current_school');
        if (stored) setHydratedSchool(JSON.parse(stored));
      } catch {}
    }

    if (!selectedSession) {
      const stored = localStorage.getItem('giterp_active_session');
      if (stored) setHydratedSession(stored);
    }

    if (!currentUser) {
      try {
        const stored = localStorage.getItem('current_user');
        if (stored) setHydratedUser(JSON.parse(stored));
      } catch {}
    }

    if (!currentTheme) {
      const storedTheme = localStorage.getItem('giterp_active_theme');
      if (storedTheme) setHydratedTheme(storedTheme);
    }

    if (!availableSchools || availableSchools.length === 0) {
      try {
        const stored = localStorage.getItem('available_schools');
        if (stored) setSchoolsList(JSON.parse(stored));
      } catch {}
    }
  }, [selectedSchool, selectedSession, currentUser, currentTheme, availableSchools]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (sessionMenuRef.current && !sessionMenuRef.current.contains(target)) {
        setShowSessionMenu(false);
      }
      if (schoolMenuRef.current && !schoolMenuRef.current.contains(target)) {
        setShowSchoolMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSchool = hydratedSchool || selectedSchool;
  const activeSessionVal = hydratedSession || selectedSession || '2026-27';
  const activeUser = hydratedUser || currentUser;
  const activeThemeVal = hydratedTheme || currentTheme || 'emerald';

  const currentDisplaySession = formatSessionFull(activeSessionVal);

  const sessionList = (availableSessions && availableSessions.length > 0)
    ? availableSessions.map(sess => {
        const full = formatSessionFull(sess);
        const match = STANDARD_SESSIONS.find(std => std.code === sess || std.display === full);
        return {
          code: sess,
          display: full,
          label: match?.label || `Academic Session ${full}`
        };
      })
    : STANDARD_SESSIONS;

  const schoolName = activeSchool?.school_name || activeSchool?.name || 'Delhi Public School';
  const schoolAddress = activeSchool?.address 
    ? `${activeSchool.address}, ${activeSchool.city || 'Lucknow'}`
    : (activeSchool?.city ? `${activeSchool.city}, Uttar Pradesh` : 'Amrapali Yojna, Dubagga Lucknow');

  const schoolLogo = activeSchool?.logo || activeSchool?.logo_url;

  const handleSessionSelect = (sessionCode: string) => {
    setShowSessionMenu(false);
    setHydratedSession(sessionCode);
    if (onSwitchSession) {
      onSwitchSession(sessionCode);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('giterp_active_session', sessionCode);
      window.dispatchEvent(new CustomEvent('giterp_session_change', { detail: { session: sessionCode } }));
      window.location.reload();
    }
  };

  const handleSchoolSelect = (schoolId: string) => {
    setShowSchoolMenu(false);
    if (onSwitchSchool) {
      onSwitchSchool(schoolId);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('last_active_school_id', schoolId);
      window.dispatchEvent(new CustomEvent('giterp_school_change', { detail: { schoolId } }));
      window.location.reload();
    }
  };

  const handleDefaultThemeToggle = (theme?: string) => {
    const nextTheme = theme || (activeThemeVal === 'monochrome' ? 'emerald' : 'monochrome');
    setHydratedTheme(nextTheme);
    if (onToggleTheme) {
      onToggleTheme(nextTheme);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('giterp_active_theme', nextTheme);
      applyAntigravityTheme(nextTheme);
    }
  };

  const handleDefaultRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleDefaultLogout = () => {
    if (onLogout) {
      onLogout();
    } else if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_school');
        localStorage.removeItem('erp_session_token');
        document.cookie = 'erp_session_token=; path=/; max-age=0; SameSite=Lax;';
      } catch {}
      window.location.href = '/login';
    }
  };

  const effectiveSchools = schoolsList.length > 0
    ? schoolsList
    : (activeSchool ? [activeSchool] : [{ id: 'DPS2026', school_code: 'DPS2026', school_name: 'Delhi Public School', city: 'Lucknow' } as School]);

  return (
    <div className="w-full bg-[#34373C] text-white border-b border-[#26282B] px-2.5 sm:px-4 py-1.5 flex items-center justify-between shadow-md z-40 select-none shrink-0 relative h-14 gap-1.5 sm:gap-3">
      {/* ── LEFT SECTION: Sidebar Toggle + School Identity + Breadcrumbs ── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial">
        {/* Sidebar Toggle Button (Mobile & Desktop) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation"
          >
            <div className="w-4 h-4 border border-gray-300 rounded-[3px] flex flex-col justify-center items-center gap-[2.5px] p-[2px]">
              <span className="w-full h-[1.5px] bg-gray-300 rounded-full" />
              <span className="w-full h-[1.5px] bg-gray-300 rounded-full" />
              <span className="w-full h-[1.5px] bg-gray-300 rounded-full" />
            </div>
          </button>
        )}

        {/* School Logo + Name Badge (Interactive on click for school switch) */}
        <div className="relative" ref={schoolMenuRef}>
          <div
            onClick={() => {
              if (effectiveSchools.length > 1 || onSwitchSchool) {
                setShowSchoolMenu(!showSchoolMenu);
              }
            }}
            className={`flex items-center gap-2 min-w-0 ${
              effectiveSchools.length > 1 ? 'cursor-pointer group' : ''
            }`}
            title={effectiveSchools.length > 1 ? "Click to switch campus" : schoolName}
          >
            {/* Circular School Logo */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#166534] flex items-center justify-center p-0.5 overflow-hidden shadow-xs shrink-0 relative">
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    const fb = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fb) fb.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-full h-full items-center justify-center rounded-full bg-white"
                style={{ display: schoolLogo ? 'none' : 'flex' }}
              >
                {/* Authentic Emerald DPS Circular Crest Vector */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#15803d]" fill="currentColor">
                  <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="3.5" />
                  <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M50 20 C46 28 44 32 47 38 C49 34 52 32 50 20 Z" fill="#eab308" />
                  <path d="M48 24 C45 30 46 34 48 38 C50 34 52 30 48 24 Z" fill="#ef4444" />
                  <rect x="45" y="38" width="10" height="24" rx="2" fill="currentColor" />
                  <path d="M30 45 C30 65 50 78 50 78 C50 78 70 65 70 45" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M22 40 C24 60 38 74 50 82 C62 74 76 60 78 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
                  <path d="M25 82 Q50 90 75 82" fill="none" stroke="currentColor" strokeWidth="2.5" />
                </svg>
              </div>
            </div>

            {/* School Name & Campus Subtitle */}
            <div className="flex flex-col justify-center min-w-0 pr-0.5">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-[13px] font-bold text-white uppercase tracking-wider truncate max-w-[110px] sm:max-w-[150px] md:max-w-[200px] leading-tight">
                  {schoolName}
                </span>
                {effectiveSchools.length > 1 && (
                  <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-emerald-300 transition-transform shrink-0" />
                )}
              </div>
              <span className="hidden sm:inline text-[9.5px] text-gray-300/80 font-normal truncate max-w-[130px] md:max-w-[180px] leading-tight">
                {schoolAddress}
              </span>
              <span className="sm:hidden text-[8.5px] text-emerald-400 font-mono leading-none truncate max-w-[110px]">
                {panelName || 'ERP'}
              </span>
            </div>
          </div>

          {/* School Switcher Popover Menu */}
          {showSchoolMenu && (
            <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-[#25282D] rounded-2xl shadow-2xl border border-white/10 p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 mb-1.5 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Available Campuses
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {effectiveSchools.length} Branch{effectiveSchools.length > 1 ? 'es' : ''}
                </span>
              </div>
              <div className="space-y-1">
                {effectiveSchools.map(sch => {
                  const isCurrent = (sch.id === activeSchool?.id) || (sch.school_code === activeSchool?.school_code);
                  return (
                    <button
                      key={sch.id}
                      type="button"
                      onClick={() => handleSchoolSelect(sch.id || sch.school_code)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-white/5 hover:bg-white/10 border-transparent text-gray-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                        <img
                          src={sch.logo || sch.logo_url || '/giterp-logo.png'}
                          alt="Logo"
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{sch.school_name || sch.name || 'Delhi Public School'}</div>
                        <div className="text-[10px] text-gray-400 truncate">{sch.city || 'Lucknow'} • {sch.school_code || sch.id}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumbs (Desktop & Tablet only) */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-300 border-l border-white/15 pl-2.5 ml-1 truncate">
          <span className="font-semibold text-gray-300 uppercase tracking-wide">
            {panelName}
          </span>
          <span className="text-gray-500 font-mono select-none">/</span>
          <span className="text-white font-bold tracking-tight uppercase truncate max-w-[130px] lg:max-w-[190px]">
            {tabTitle || activeTab || 'OVERVIEW'}
          </span>
        </div>
      </div>

      {/* ── CENTER SECTION: Omni-Search Bar (Desktop & Tablet) ── */}
      {onOpenSearch && (
        <div className="hidden lg:flex items-center flex-1 max-w-xs xl:max-w-sm mx-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-black/25 hover:bg-black/35 border border-white/15 hover:border-white/25 rounded-xl text-xs text-gray-300 transition-all cursor-pointer group shadow-2xs text-left"
            title="Search Scholars, Staff, Fees, Classes (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors shrink-0" />
            <span className="truncate flex-1 text-gray-400 group-hover:text-gray-200 text-xs select-none">
              Search scholars, staff, fees...
            </span>
            <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[9.5px] font-mono bg-white/10 border border-white/10 rounded text-gray-300 shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* ── RIGHT SECTION: Academic Session Pill + Action Icons ── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Live Master DB Sync Pill (Desktop only) */}
        {isSyncingLive && (
          <div className="hidden 2xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Syncing Master DB</span>
          </div>
        )}

        {/* 1. Academic Session Switcher */}
        <div className="relative" ref={sessionMenuRef}>
          {/* Mobile Session Pill (< sm): Ultra-compact & touch friendly */}
          <button
            type="button"
            onClick={() => setShowSessionMenu(!showSessionMenu)}
            className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-emerald-300 font-bold text-xs cursor-pointer select-none active:scale-95 transition-transform"
            title="Switch Academic Session"
          >
            <span className="font-mono text-[11px]">{activeSessionVal}</span>
            <ChevronDown className={`w-3 h-3 text-gray-300 transition-transform ${showSessionMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop & Tablet Session Display (>= sm) */}
          <div
            onClick={() => setShowSessionMenu(!showSessionMenu)}
            className="hidden sm:flex flex-col items-end justify-center cursor-pointer group pr-1 select-none"
            title="Click to change academic session"
          >
            <span className="text-[9.5px] text-gray-300 font-medium tracking-wide block uppercase leading-none mb-0.5 group-hover:text-emerald-300 transition-colors">
              Academic Session
            </span>
            <div className="flex items-center gap-1 text-sm md:text-base font-bold text-white tracking-tight leading-tight group-hover:text-emerald-300 transition-colors">
              <span>{currentDisplaySession}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-300 transition-transform ${showSessionMenu ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Session Switcher Popover Menu */}
          {showSessionMenu && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-[#25282D] rounded-2xl shadow-2xl border border-white/10 p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 mb-1 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
                <span>Select Academic Session</span>
                <span className="text-[10px] text-emerald-400 font-mono">CBSE</span>
              </div>
              <div className="space-y-1">
                {sessionList.map(sess => {
                  const isCurrent = formatSessionFull(activeSessionVal) === sess.display || activeSessionVal === sess.code;
                  return (
                    <button
                      key={sess.code}
                      type="button"
                      onClick={() => handleSessionSelect(sess.code)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-white/5 hover:bg-white/10 border-transparent text-gray-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{sess.display}</span>
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        </div>
                        <div className="text-[10px] text-gray-400">{sess.label}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Action Icons: Theme, Refresh, Notifications, Profile, Logout */}
        <div className="flex items-center gap-1 sm:gap-1.5 border-l border-white/15 pl-1.5 sm:pl-2">
          {/* Theme Mode Toggle Button (Desktop & Tablet) */}
          <button
            type="button"
            onClick={() => handleDefaultThemeToggle()}
            className="hidden sm:flex p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent items-center justify-center gap-1 shrink-0"
            title={`Active Theme: ${activeThemeVal === 'monochrome' ? 'Black & White' : 'Default Emerald'}. Click to toggle.`}
            aria-label="Toggle Theme"
          >
            <Palette className="w-4 h-4" />
            <span className={`w-2 h-2 rounded-full ${activeThemeVal === 'monochrome' ? 'bg-zinc-300 ring-1 ring-zinc-500' : 'bg-emerald-400 ring-1 ring-emerald-300'}`} />
          </button>

          {/* Refresh Data Button (Desktop & Tablet) */}
          <button
            type="button"
            onClick={handleDefaultRefresh}
            className="hidden sm:flex p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent items-center justify-center shrink-0"
            title="Refresh Live School Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Notifications Bell with Badge (Tablet & Desktop) */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="hidden md:flex p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent items-center justify-center relative shrink-0"
              title="School Notifications & Circulars"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1 min-w-[15px] h-[15px] bg-[#E05638] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Account Profile Avatar & Dropdown (Always visible on mobile & desktop) */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full border border-gray-400/50 bg-gray-700 hover:border-emerald-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all ml-0.5 active:scale-95"
              title="User Account & Office Credentials"
              aria-label="User Account"
            >
              {activeUser?.avatar || activeUser?.photo || profileForm?.avatar ? (
                <img
                  src={activeUser?.avatar || activeUser?.photo || profileForm?.avatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold">
                  {(activeUser?.full_name || profileForm?.full_name || 'U')[0]?.toUpperCase()}
                </span>
              )}
            </button>

            {/* Rich User Account Popover Dropdown (Optimized for Mobile & Desktop) */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-[#25282D] rounded-2xl shadow-2xl border border-white/10 p-3 z-50 text-white animate-in fade-in zoom-in-95 space-y-3">
                {/* User Identity Header */}
                <div className="flex items-center gap-3 pb-2.5 border-b border-white/10">
                  <div className="w-9 h-9 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-white/15">
                    {activeUser?.avatar || activeUser?.photo || profileForm?.avatar ? (
                      <img
                        src={activeUser?.avatar || activeUser?.photo || profileForm?.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      (activeUser?.full_name || profileForm?.full_name || 'Admin')[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {activeUser?.full_name || profileForm?.full_name || 'Administrator'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">
                      {activeUser?.role || 'Staff'} • {activeUser?.username || profileForm?.username || 'admin'}
                    </div>
                  </div>
                </div>

                {/* Theme Mode Selector (Accessible on Mobile and Desktop) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-gray-300 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-emerald-400" />
                      Theme Mode
                    </span>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-gray-200 font-semibold">
                      {activeThemeVal === 'monochrome' ? 'B & W' : 'Default'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleDefaultThemeToggle('emerald')}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                        activeThemeVal === 'emerald'
                          ? 'bg-emerald-600/25 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-white/5 hover:bg-white/10 border-transparent text-gray-300 font-medium'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-[#122A24] border border-[#10B981] shrink-0 flex items-center justify-center">
                        {activeThemeVal === 'emerald' && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] leading-tight truncate">Default</div>
                        <div className="text-[9px] text-gray-400 truncate">Emerald</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDefaultThemeToggle('monochrome')}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                        activeThemeVal === 'monochrome'
                          ? 'bg-white/15 border-white/30 text-white font-bold'
                          : 'bg-white/5 hover:bg-white/10 border-transparent text-gray-300 font-medium'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-500 shrink-0 flex items-center justify-center">
                        {activeThemeVal === 'monochrome' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] leading-tight truncate">Black &amp; White</div>
                        <div className="text-[9px] text-gray-400 truncate">Monochrome</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Quick Profile Actions */}
                <div className="pt-2 border-t border-white/10 space-y-1">
                  {/* Mobile Refresh shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleDefaultRefresh();
                    }}
                    className="sm:hidden w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent text-left"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                      Refresh School Data
                    </span>
                  </button>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigateTab('attendance');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        My Attendance &amp; Regularization
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigateTab('profile');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent text-left"
                    >
                      <span className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-emerald-400" />
                        My Profile &amp; Passcode
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleDefaultLogout();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer border-none bg-transparent text-left"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct 1-Click Sign Out Button (Desktop only) */}
          <button
            type="button"
            onClick={handleDefaultLogout}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-rose-600/30 text-gray-200 hover:text-rose-200 border border-white/10 hover:border-rose-500/40 text-xs font-semibold transition cursor-pointer shrink-0 ml-1"
            title="Sign Out of School ERP"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
