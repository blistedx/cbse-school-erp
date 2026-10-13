/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  LayoutGrid,
  Calendar,
  Copy,
  Bell,
  User,
  Check,
  ChevronDown,
  Building2,
  ExternalLink,
  BookOpen,
  Award,
  CreditCard,
  Users,
  Clock,
  Sparkles,
  LogOut,
  ShieldCheck,
  Layers,
  ChevronRight
} from 'lucide-react';
import { School } from '@/lib/types';

export interface SchoolSessionHeaderProps {
  selectedSchool?: School | null;
  availableSchools?: School[];
  selectedSession?: string;
  availableSessions?: string[];
  onSwitchSession?: (session: string) => void;
  onSwitchSchool?: (schoolId: string) => void;
  onToggleSidebar?: () => void;
  onOpenCalendar?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onNavigateTab?: (tab: string) => void;
  unreadCount?: number;
  currentUser?: any;
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
  onSwitchSession,
  onSwitchSchool,
  onToggleSidebar,
  onOpenCalendar,
  onOpenNotifications,
  onOpenProfile,
  onNavigateTab,
  unreadCount = 2,
  currentUser
}: SchoolSessionHeaderProps) {
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [showSchoolMenu, setShowSchoolMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const schoolMenuRef = useRef<HTMLDivElement>(null);
  const appsMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
      if (appsMenuRef.current && !appsMenuRef.current.contains(target)) {
        setShowAppsMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDisplaySession = formatSessionFull(selectedSession);

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

  const schoolName = selectedSchool?.school_name || selectedSchool?.name || 'DELHI PUBLIC SCHOOL';
  const schoolAddress = selectedSchool?.address 
    ? `${selectedSchool.address}, ${selectedSchool.city || 'Lucknow'}`
    : (selectedSchool?.city ? `${selectedSchool.city}, Uttar Pradesh` : 'Amrapali Yojna, Dubagga Lucknow');

  const schoolLogo = selectedSchool?.logo || selectedSchool?.logo_url;

  const handleSessionSelect = (sessionCode: string) => {
    setShowSessionMenu(false);
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

  return (
    <div className="w-full bg-[#34373C] text-white border-b border-[#26282B] px-3 sm:px-5 py-1.5 flex items-center justify-between shadow-md z-40 select-none shrink-0 relative h-14">
      {/* ── LEFT SECTION: Sidebar Toggle & Apps/Modules Grid ── */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation"
        >
          {/* Custom Sleek Sidebar Icon matching screenshot */}
          <div className="w-4 h-4 border border-gray-300 rounded-[3px] flex flex-col justify-center items-center gap-[2.5px] p-[2px]">
            <span className="w-full h-[1.5px] bg-gray-300 rounded-full" />
            <span className="w-full h-[1.5px] bg-gray-300 rounded-full" />
            <span className="w-full h-[1.5px] bg-gray-300 rounded-full" />
          </div>
        </button>

        {/* Modules Grid Button */}
        <div className="relative" ref={appsMenuRef}>
          <button
            type="button"
            onClick={() => setShowAppsMenu(!showAppsMenu)}
            className={`p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center ${
              showAppsMenu ? 'bg-white/15 text-white' : ''
            }`}
            title="ERP System Modules & Shortcuts"
            aria-label="Modules Launcher"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Quick Modules Launcher Dropdown */}
          {showAppsMenu && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#25282D] rounded-2xl shadow-2xl border border-white/10 p-3 z-50 text-white animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-bold text-gray-300">
                <span>Quick Modules Launcher</span>
                <span className="text-[10px] text-emerald-400 font-mono">Enterprise ERP</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { tab: 'overview', label: 'Overview', icon: LayoutGrid, color: 'text-emerald-400' },
                  { tab: 'students', label: 'Scholars', icon: Users, color: 'text-blue-400' },
                  { tab: 'fees', label: 'Fee Ledger', icon: CreditCard, color: 'text-amber-400' },
                  { tab: 'exams', label: 'Exams & Marks', icon: Award, color: 'text-purple-400' },
                  { tab: 'attendance', label: 'Attendance', icon: Clock, color: 'text-rose-400' },
                  { tab: 'classes', label: 'Classes', icon: BookOpen, color: 'text-cyan-400' },
                  { tab: 'timetable', label: 'Timetable', icon: Calendar, color: 'text-teal-400' },
                  { tab: 'notices', label: 'Notices', icon: Bell, color: 'text-yellow-400' },
                  { tab: 'certificates', label: 'Certificates', icon: Sparkles, color: 'text-indigo-400' }
                ].map(item => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => {
                      setShowAppsMenu(false);
                      if (onNavigateTab) onNavigateTab(item.tab);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-center cursor-pointer group"
                  >
                    <item.icon className={`w-5 h-5 mb-1.5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[11px] font-medium text-gray-200 truncate w-full">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SECTION: Academic Session Switcher + School Details + Action Icons ── */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* 1. Academic Session Interactive Switcher */}
        <div className="relative" ref={sessionMenuRef}>
          <div
            onClick={() => setShowSessionMenu(!showSessionMenu)}
            className="flex flex-col items-end justify-center cursor-pointer group pr-1 sm:pr-2 select-none"
            title="Click to change school academic session"
          >
            <span className="text-[9.5px] sm:text-[10px] text-gray-300 font-medium tracking-wide block uppercase leading-none mb-0.5 group-hover:text-emerald-300 transition-colors">
              Academic Session
            </span>
            <div className="flex items-center gap-1 text-base sm:text-lg font-bold text-white tracking-tight leading-tight group-hover:text-emerald-300 transition-colors">
              <span>{currentDisplaySession}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-300 transition-transform ${showSessionMenu ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Session Switcher Popover Menu */}
          {showSessionMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#25282D] rounded-2xl shadow-2xl border border-white/10 p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 mb-1 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
                <span>Select Academic Session</span>
                <span className="text-[10px] text-emerald-400 font-mono">CBSE</span>
              </div>
              <div className="space-y-1">
                {sessionList.map(sess => {
                  const isCurrent = formatSessionFull(selectedSession) === sess.display || selectedSession === sess.code;
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

        {/* 2. School Brand Badge (Logo + Name + Address) */}
        <div className="flex items-center gap-2 sm:gap-2.5 border-l border-white/15 pl-2 sm:pl-3 min-w-0">
          {/* Circular School Logo Badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#166534] flex items-center justify-center p-0.5 overflow-hidden shadow-xs shrink-0 relative">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt={schoolName}
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  // Fallback to SVG badge if image fails to load
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
                {/* Torch / Flame Emblem */}
                <path d="M50 20 C46 28 44 32 47 38 C49 34 52 32 50 20 Z" fill="#eab308" />
                <path d="M48 24 C45 30 46 34 48 38 C50 34 52 30 48 24 Z" fill="#ef4444" />
                <rect x="45" y="38" width="10" height="24" rx="2" fill="currentColor" />
                {/* Wreath / Shield base */}
                <path d="M30 45 C30 65 50 78 50 78 C50 78 70 65 70 45" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M22 40 C24 60 38 74 50 82 C62 74 76 60 78 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
                {/* Motto ribbon */}
                <path d="M25 82 Q50 90 75 82" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
          </div>

          {/* School Name & Subtitle/Address */}
          <div className="hidden sm:flex flex-col justify-center min-w-0 pr-1">
            <span className="text-xs sm:text-[13px] font-bold text-white uppercase tracking-wider truncate max-w-[170px] md:max-w-[240px] leading-tight">
              {schoolName}
            </span>
            <span className="text-[10px] text-gray-300/80 font-normal truncate max-w-[160px] md:max-w-[220px] leading-tight">
              {schoolAddress}
            </span>
          </div>
        </div>

        {/* 3. Right Action Icons: Calendar, Switch School, Notifications, Profile */}
        <div className="flex items-center gap-1 sm:gap-2 border-l border-white/15 pl-2">
          {/* Calendar / Date Sheet Icon */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
            title="School Date Sheet & Academic Calendar"
            aria-label="Academic Calendar"
          >
            {/* Calendar with Star Icon matching screenshot */}
            <div className="relative">
              <Calendar className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 text-[8px] text-amber-300 font-bold">★</span>
            </div>
          </button>

          {/* Switch School / Branch Icon */}
          <div className="relative" ref={schoolMenuRef}>
            <button
              type="button"
              onClick={() => setShowSchoolMenu(!showSchoolMenu)}
              className={`p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center ${
                showSchoolMenu ? 'bg-white/15 text-white' : ''
              }`}
              title="Switch School Tenant / Branch"
              aria-label="Switch School"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* School Switcher Popover Menu */}
            {showSchoolMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#25282D] rounded-2xl shadow-2xl border border-white/10 p-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 mb-1.5 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Available Schools
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {availableSchools.length > 0 ? `${availableSchools.length} Campuses` : 'Main Campus'}
                  </span>
                </div>
                <div className="space-y-1">
                  {(availableSchools.length > 0 ? availableSchools : [selectedSchool || { id: 'DPS2026', school_code: 'DPS2026', school_name: 'Delhi Public School', city: 'Lucknow' } as any]).map(sch => {
                    const isCurrent = (sch.id === selectedSchool?.id) || (sch.school_code === selectedSchool?.school_code);
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

          {/* Notifications Bell with Badge */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center relative"
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

          {/* User Account Profile Avatar */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={onOpenProfile || (() => setShowProfileMenu(!showProfileMenu))}
              className="w-7 h-7 rounded-full border border-gray-400/50 bg-gray-700 hover:border-emerald-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all ml-0.5"
              title="User Account & Office Credentials"
              aria-label="User Account"
            >
              {currentUser?.avatar || currentUser?.photo ? (
                <img src={currentUser.avatar || currentUser.photo} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
