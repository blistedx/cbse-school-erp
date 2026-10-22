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
  Clock,
  Settings,
  Camera,
  Upload,
  X,
  Trash2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { School } from '@/lib/types';
import { applyAntigravityTheme } from '@/lib/themes';
import { apiFetch } from '@/lib/api-client';
import { PhotoCropModal } from '@/components/common/photo-crop-modal';

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

// Convert image file to optimized Base64 JPEG data URL (< 60 KB)
export function compressImageToBase64(file: File, maxDim: number = 480, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
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
  const [avatarError, setAvatarError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempCropSrc, setTempCropSrc] = useState('');

  // Settings Modal Edit States
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [modalToast, setModalToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-hydration state for standalone / cross-panel usage
  const [hydratedSchool, setHydratedSchool] = useState<School | null>(selectedSchool || null);
  const [hydratedSession, setHydratedSession] = useState<string>(selectedSession || '2026-27');
  const [hydratedUser, setHydratedUser] = useState<any>(currentUser || null);
  const [hydratedTheme, setHydratedTheme] = useState<string>(currentTheme || 'emerald');
  const [schoolsList, setSchoolsList] = useState<School[]>(availableSchools);

  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const schoolMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Real-time synchronization when profile picture or user details change
  useEffect(() => {
    function handleUserUpdate(e: any) {
      if (e.detail) {
        setHydratedUser(e.detail);
        setAvatarError(false);
      }
    }
    window.addEventListener('giterp_user_change', handleUserUpdate);
    function handleSchoolUpdate(e: any) {
      if (e.detail?.school) {
        setHydratedSchool(e.detail.school);
        setLogoError(false);
      }
    }
    window.addEventListener('giterp_school_change', handleSchoolUpdate);
    function handleStorage() {
      try {
        const stored = localStorage.getItem('current_user');
        if (stored) {
          setHydratedUser(JSON.parse(stored));
          setAvatarError(false);
        }
      } catch {}
      try {
        const storedSch = localStorage.getItem('current_school');
        if (storedSch) {
          setHydratedSchool(JSON.parse(storedSch));
          setLogoError(false);
        }
      } catch {}
    }
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('giterp_user_change', handleUserUpdate);
      window.removeEventListener('giterp_school_change', handleSchoolUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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

  // Reset avatar error if avatar URL changes
  useEffect(() => {
    setAvatarError(false);
  }, [activeUser?.avatar, activeUser?.photo, profileForm?.avatar]);

  // Sync settings modal fields when opened
  useEffect(() => {
    if (showSettingsModal) {
      setEditName(activeUser?.full_name || profileForm?.full_name || '');
      setEditEmail(activeUser?.email || profileForm?.email || '');
      setEditPhone(activeUser?.phone || profileForm?.phone || '');
      setEditPassword('');
      const curPic = activeUser?.photo || activeUser?.avatar || profileForm?.avatar || '';
      if (curPic && typeof curPic === 'string' && !curPic.includes('MEDIA-TCH-TCH-PRIN-DPS2026') && curPic !== 'null') {
        setPreviewAvatar(curPic);
      } else {
        setPreviewAvatar('');
      }
      setModalToast(null);
    }
  }, [showSettingsModal, activeUser, profileForm]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTempCropSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64: string) => {
    setPreviewAvatar(croppedBase64);
    setCropModalOpen(false);
    setModalToast({ type: 'success', message: 'Photo adjusted! Click "Save Changes" to apply.' });
  };

  const userDisplayName = activeUser?.full_name || profileForm?.full_name || 'Administrator';
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || userDisplayName.charAt(0).toUpperCase() || 'A';

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setModalToast(null);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          new_password: editPassword.trim() || undefined,
          avatar: previewAvatar,
          photo: previewAvatar
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to persist profile changes to database.');
      }

      const savedAvatar = data.user?.avatar || data.user?.photo || previewAvatar;
      const updatedUser = {
        ...(activeUser || {}),
        full_name: editName.trim() || userDisplayName,
        email: editEmail.trim(),
        phone: editPhone.trim(),
        avatar: savedAvatar,
        photo: savedAvatar
      };

      try {
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
      } catch (_) {}

      try {
        const storedSchool = localStorage.getItem('current_school');
        if (storedSchool) {
          const sch = JSON.parse(storedSchool);
          if (sch.principal_name && (activeUser?.role === 'PRINCIPAL' || activeUser?.role === 'ADMIN')) {
            sch.principal_name = editName.trim() || sch.principal_name;
            sch.principal_avatar = savedAvatar;
            sch.avatar = savedAvatar;
            localStorage.setItem('current_school', JSON.stringify(sch));
          }
        }
      } catch (_) {}

      setHydratedUser(updatedUser);
      setAvatarError(false);

      window.dispatchEvent(new CustomEvent('giterp_user_change', { detail: updatedUser }));
      window.dispatchEvent(new Event('storage'));

      setModalToast({ type: 'success', message: 'Profile picture & settings saved permanently!' });
      setTimeout(() => {
        setShowSettingsModal(false);
      }, 700);
    } catch (err: any) {
      setModalToast({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const userAvatarRaw = activeUser?.avatar || activeUser?.photo || profileForm?.avatar;
  const hasValidAvatar = Boolean(
    userAvatarRaw &&
    typeof userAvatarRaw === 'string' &&
    userAvatarRaw.trim().length > 0 &&
    userAvatarRaw !== 'null' &&
    userAvatarRaw !== 'undefined' &&
    !userAvatarRaw.includes('[object') &&
    !userAvatarRaw.includes('MEDIA-TCH-TCH-PRIN-DPS2026') &&
    !avatarError
  );

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

  useEffect(() => {
    setLogoError(false);
  }, [schoolLogo]);

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
              {schoolLogo && !logoError ? (
                <img
                  key={schoolLogo}
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-full h-full object-contain rounded-full"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-full bg-white">
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
              )}
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

        {/* 1. Academic Session Switcher (Unified for Mobile & Desktop) */}
        <div className="relative shrink-0" ref={sessionMenuRef}>
          <div
            onClick={() => setShowSessionMenu(!showSessionMenu)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowSessionMenu(!showSessionMenu);
              }
            }}
            className="flex flex-col items-center justify-center cursor-pointer group px-1 sm:px-2 select-none text-center active:scale-95 transition-transform"
            title="Academic Session (Click to switch)"
          >
            <span className="text-[10.5px] sm:text-xs text-white underline underline-offset-2 decoration-1 font-medium tracking-normal leading-tight whitespace-nowrap group-hover:text-gray-200 transition-colors">
              Academic Session
            </span>
            <span className="text-[17px] xs:text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-none whitespace-nowrap mt-0.5 group-hover:opacity-90 transition-opacity">
              {currentDisplaySession}
            </span>
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
          {/* Global Omni-Search Icon Trigger (Mobile & Tablet < lg) */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex lg:hidden p-1.5 text-gray-200 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors cursor-pointer border-none bg-transparent items-center justify-center shrink-0 active:scale-95"
              title="Search Scholars, Staff, Fees, Classes (Ctrl+K)"
              aria-label="Global Search"
            >
              <Search className="w-4 h-4 text-emerald-300 hover:text-white" />
            </button>
          )}

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
              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full border border-gray-400/50 bg-[#122A24] hover:border-emerald-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all ml-0.5 active:scale-95"
              title="User Account & Settings"
              aria-label="User Account"
            >
              {hasValidAvatar ? (
                <img
                  src={userAvatarRaw}
                  alt={userDisplayName}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white text-[11px] font-bold select-none">
                  {userInitials}
                </div>
              )}
            </button>

            {/* Rich User Account Popover Dropdown (Optimized for Mobile & Desktop) */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-[#25282D] rounded-2xl shadow-2xl border border-white/10 p-3 z-50 text-white animate-in fade-in zoom-in-95 space-y-3">
                {/* User Identity Header */}
                <div className="flex items-center gap-3 pb-2.5 border-b border-white/10">
                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-10 h-10 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-white/15 relative group cursor-pointer"
                    title="Click to change profile picture"
                  >
                    {hasValidAvatar ? (
                      <img
                        src={userAvatarRaw}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-full"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white text-xs font-bold">
                        {userInitials}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-full">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {userDisplayName}
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
                  {/* Universal Settings & Profile Picture (Present in EVERY module) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-white bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 hover:border-emerald-500/60 transition-all cursor-pointer text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
                      <div>
                        <div className="leading-tight">Profile Picture &amp; Settings</div>
                        <div className="text-[9.5px] text-emerald-300/80 font-normal">Upload photo, change passcode</div>
                      </div>
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      EDIT
                    </span>
                  </button>

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

                  {/* Panel-Specific Profile Navigation Links */}
                  {onNavigateTab ? (
                    <>
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
                          My Profile Studio
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      {panelName === 'Principal' && (
                        <a
                          href="/principal/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors no-underline text-left"
                        >
                          <span className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-emerald-400" />
                            Principal Office Credentials
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                        </a>
                      )}
                      {panelName === 'Teacher' && (
                        <a
                          href="/teacher/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors no-underline text-left"
                        >
                          <span className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-emerald-400" />
                            Faculty Workstation Profile
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                        </a>
                      )}
                    </>
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

      {/* ── UNIVERSAL PROFILE PICTURE & ACCOUNT SETTINGS MODAL (Accessible Across ALL Modules) ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#25282D] border border-white/15 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-white flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Settings &amp; Profile Picture</h3>
                  <p className="text-[10.5px] text-gray-400 font-mono">
                    {activeUser?.role || 'User'} • {activeUser?.username || profileForm?.username || 'admin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Profile Photo Upload Studio */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center relative">
                <div className="w-24 h-24 rounded-full border-2 border-emerald-400/60 shadow-xl overflow-hidden relative group bg-emerald-950/60 mb-3">
                  {previewAvatar ? (
                    <img
                      src={previewAvatar}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white text-3xl font-black select-none">
                      {userInitials}
                    </div>
                  )}

                  {/* Hover Camera Overlay */}
                  <label
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-semibold gap-1"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-5 h-5 text-emerald-300" />
                    <span>Change</span>
                  </label>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </button>

                  {previewAvatar && (
                    <button
                      type="button"
                      onClick={() => setPreviewAvatar('')}
                      className="px-3 py-1.5 bg-white/10 hover:bg-rose-600/30 text-rose-300 border border-white/10 hover:border-rose-500/40 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition"
                      title="Reset to Initials"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Supports JPG, PNG, WEBP (auto-compressed for instant loading)
                </p>
              </div>

              {/* Status Toast */}
              {modalToast && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    modalToast.type === 'success'
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                      : 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{modalToast.message}</span>
                </div>
              )}

              {/* Account Credentials Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 text-[11px]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Dr. Abhishek Shukla"
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1 text-[11px]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="principal@dps.edu"
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1 text-[11px]">
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1 text-[11px] flex items-center justify-between">
                    <span>New Passcode / Password</span>
                    <span className="text-[10px] text-gray-500 font-mono">Optional</span>
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-end gap-2 bg-black/20">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Crop Modal for Profile Picture */}
      <PhotoCropModal
        isOpen={cropModalOpen}
        imageSrc={tempCropSrc}
        title="Crop & Adjust Profile Picture"
        subtitle="Zoom, pan, and rotate your photograph before uploading"
        circularCrop={true}
        aspectRatio="1:1"
        onConfirm={handleCropConfirm}
        onClose={() => setCropModalOpen(false)}
      />
    </div>
  );
}
