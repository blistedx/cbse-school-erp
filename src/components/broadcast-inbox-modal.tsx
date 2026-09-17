/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  RefreshCw,
  Search,
  Volume2,
  Clock,
  ShieldAlert,
  Smartphone,
  Copy,
  Filter,
  Inbox,
  CreditCard,
  GraduationCap,
  Bus,
  Sparkles,
  Layers,
  Send
} from 'lucide-react';
import { playNotificationChime, getNotificationPermissionStatus, requestNotificationPermission } from '@/lib/push-notifications';

export interface BroadcastItem {
  id: string;
  title: string;
  body: string;
  url?: string;
  audience: string;
  urgent?: boolean;
  category?: 'EXAM' | 'FEES' | 'ACAD' | 'TRANSPORT' | 'HOLIDAY' | 'ALL' | string;
  senderName?: string;
  senderRole?: string;
  deliveredCount?: number;
  timestamp?: string;
  createdAt?: string;
}

interface BroadcastInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
}

const STORAGE_KEY = 'giterp_read_broadcast_ids_v1';

export function getReadBroadcastIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    return new Set();
  }
}

export function saveReadBroadcastIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {}
}

export default function BroadcastInboxModal({
  isOpen,
  onClose,
  userRole = 'ALL',
  userName = 'User'
}: BroadcastInboxModalProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'URGENT' | 'FEES' | 'ACAD' | 'TRANSPORT'>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [testPushMsg, setTestPushMsg] = useState<string | null>(null);

  const normalizedRole = (userRole || 'ALL').toUpperCase();
  const isAdminOrPrincipal = ['SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN', 'PRINCIPAL'].includes(normalizedRole);

  // Initialize read IDs and push permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReadIds(getReadBroadcastIds());
      setPushStatus(getNotificationPermissionStatus());
    }
  }, [isOpen]);

  // Fetch broadcasts from API
  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/broadcasts');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.broadcasts)) {
          setBroadcasts(data.broadcasts);
        }
      }
    } catch (err) {
      console.warn('[BroadcastInbox] Notice during fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBroadcasts();
    }
  }, [isOpen, fetchBroadcasts]);

  // Real-time listener for Service Worker push events
  useEffect(() => {
    const handleLiveBroadcast = (event: any) => {
      const payload = event?.detail;
      if (payload) {
        setBroadcasts((prev) => {
          const newItem: BroadcastItem = {
            id: payload.tag || `bc_${Date.now()}`,
            title: payload.title || 'New Announcement',
            body: payload.body || '',
            url: payload.url || '/app',
            audience: payload.audience || 'ALL',
            urgent: !!payload.urgent,
            category: payload.category || (payload.urgent ? 'URGENT' : 'ALL'),
            senderName: payload.senderName || 'School Administration',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString()
          };
          if (prev.some((b) => b.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('giterp_broadcast', handleLiveBroadcast);
      return () => window.removeEventListener('giterp_broadcast', handleLiveBroadcast);
    }
  }, []);

  // Filter broadcasts according to audience, category, and search query
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((item) => {
      const aud = (item.audience || 'ALL').toUpperCase();
      const cat = (item.category || '').toUpperCase();
      const isUrgent = !!item.urgent;

      // Role check for non-admins
      if (!isAdminOrPrincipal) {
        if (normalizedRole === 'TEACHER' || normalizedRole === 'FACULTY') {
          if (aud !== 'ALL' && aud !== 'FACULTY' && aud !== 'TEACHERS') return false;
        } else if (normalizedRole === 'PARENT') {
          if (aud !== 'ALL' && aud !== 'PARENTS' && aud !== 'BUS_PARENTS') return false;
        } else if (normalizedRole === 'STUDENT') {
          if (aud !== 'ALL' && aud !== 'STUDENTS') return false;
        } else if (normalizedRole === 'DRIVER') {
          if (aud !== 'ALL' && aud !== 'TRANSPORT' && aud !== 'BUS_PARENTS') return false;
        }
      }

      // Category filter
      if (activeCategory === 'URGENT' && !isUrgent && cat !== 'URGENT' && cat !== 'EXAM') return false;
      if (activeCategory === 'FEES' && cat !== 'FEES' && !/fee|dues|payment|clearance/i.test(item.title + ' ' + item.body)) return false;
      if (activeCategory === 'ACAD' && cat !== 'ACAD' && cat !== 'EXAM' && !/exam|ptm|sports|academic|syllabus/i.test(item.title + ' ' + item.body)) return false;
      if (activeCategory === 'TRANSPORT' && cat !== 'TRANSPORT' && !/bus|route|transport|driver|gps/i.test(item.title + ' ' + item.body)) return false;

      // Unread filter
      const isRead = readIds.has(item.id);
      if (showUnreadOnly && isRead) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchBody = item.body?.toLowerCase().includes(q);
        const matchSender = item.senderName?.toLowerCase().includes(q);
        if (!matchTitle && !matchBody && !matchSender) return false;
      }

      return true;
    });
  }, [broadcasts, activeCategory, normalizedRole, isAdminOrPrincipal, showUnreadOnly, readIds, searchQuery]);

  // Unread count specifically for this user
  const unreadCount = useMemo(() => {
    return broadcasts.filter((item) => {
      if (readIds.has(item.id)) return false;
      const aud = (item.audience || 'ALL').toUpperCase();
      if (isAdminOrPrincipal) return true;
      if (normalizedRole === 'TEACHER' || normalizedRole === 'FACULTY') {
        return aud === 'ALL' || aud === 'FACULTY' || aud === 'TEACHERS';
      }
      if (normalizedRole === 'PARENT') {
        return aud === 'ALL' || aud === 'PARENTS' || aud === 'BUS_PARENTS';
      }
      if (normalizedRole === 'STUDENT') {
        return aud === 'ALL' || aud === 'STUDENTS';
      }
      return true;
    }).length;
  }, [broadcasts, readIds, normalizedRole, isAdminOrPrincipal]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    return {
      ALL: broadcasts.length,
      URGENT: broadcasts.filter(b => b.urgent || (b.category || '').toUpperCase() === 'URGENT' || (b.category || '').toUpperCase() === 'EXAM').length,
      FEES: broadcasts.filter(b => (b.category || '').toUpperCase() === 'FEES' || /fee|dues|payment/i.test(b.title + ' ' + b.body)).length,
      ACAD: broadcasts.filter(b => ['ACAD', 'EXAM'].includes((b.category || '').toUpperCase()) || /exam|ptm|sports/i.test(b.title + ' ' + b.body)).length,
      TRANSPORT: broadcasts.filter(b => (b.category || '').toUpperCase() === 'TRANSPORT' || /bus|route|transport/i.test(b.title + ' ' + b.body)).length
    };
  }, [broadcasts]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadBroadcastIds(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      filteredBroadcasts.forEach((b) => next.add(b.id));
      saveReadBroadcastIds(next);
      return next;
    });
  };

  const copyNotice = (item: BroadcastItem) => {
    const text = `📢 ${item.title}\n\n${item.body}\n\n— Dispatched by ${item.senderName || 'School Administration'} (${item.timestamp || 'Recent'})`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    try {
      const perm = await requestNotificationPermission();
      setPushStatus(perm);
      if (perm === 'granted') {
        setTestPushMsg('Push notifications activated on this device!');
        playNotificationChime();
      } else {
        setTestPushMsg('Permission not granted in browser.');
      }
    } catch (e) {
      setTestPushMsg('Failed to enable alerts.');
    } finally {
      setIsEnablingPush(false);
      setTimeout(() => setTestPushMsg(null), 4000);
    }
  };

  const handleTestChime = () => {
    playNotificationChime();
    setTestPushMsg('Audio notification chime played!');
    setTimeout(() => setTestPushMsg(null), 2500);
  };

  // Helper for Category Icon & Colors
  const getCategoryTheme = (item: BroadcastItem) => {
    const isUrgent = !!item.urgent;
    const cat = (item.category || '').toUpperCase();

    if (isUrgent || cat === 'URGENT' || cat === 'EXAM') {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
        bgIcon: 'bg-rose-50 text-rose-600 border border-rose-200',
        badgeBg: 'bg-rose-600 text-white',
        badgeLabel: 'URGENT ALERT',
        cardBorder: 'border-rose-300 ring-1 ring-rose-400/20 bg-gradient-to-r from-rose-50/40 via-white to-amber-50/20'
      };
    }
    if (cat === 'FEES' || /fee|dues|payment/i.test(item.title + ' ' + item.body)) {
      return {
        icon: <CreditCard className="w-5 h-5 text-emerald-700" />,
        bgIcon: 'bg-[#EBF5EF] text-emerald-700 border border-[#C5E2CF]',
        badgeBg: 'bg-[#122A24] text-emerald-300',
        badgeLabel: 'FEE CLEARANCE',
        cardBorder: 'border-emerald-300/80 bg-white hover:border-emerald-400'
      };
    }
    if (cat === 'TRANSPORT' || /bus|route|transport/i.test(item.title + ' ' + item.body)) {
      return {
        icon: <Bus className="w-5 h-5 text-amber-700" />,
        bgIcon: 'bg-amber-50 text-amber-700 border border-amber-200',
        badgeBg: 'bg-amber-600 text-white',
        badgeLabel: 'TRANSPORT FLEET',
        cardBorder: 'border-amber-200 bg-white hover:border-amber-300'
      };
    }
    if (cat === 'ACAD' || /sports|ptm|academic/i.test(item.title + ' ' + item.body)) {
      return {
        icon: <GraduationCap className="w-5 h-5 text-blue-700" />,
        bgIcon: 'bg-blue-50 text-blue-700 border border-blue-200',
        badgeBg: 'bg-blue-700 text-white',
        badgeLabel: 'ACADEMIC CIRCULAR',
        cardBorder: 'border-blue-200 bg-white hover:border-blue-300'
      };
    }
    return {
      icon: <Radio className="w-5 h-5 text-[#1C443A]" />,
      bgIcon: 'bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0]',
      badgeBg: 'bg-[#122A24] text-emerald-300',
      badgeLabel: 'ANNOUNCEMENT',
      cardBorder: 'border-[#DCE8E0] bg-white hover:border-[#1C443A]/40'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white text-slate-900 w-full max-w-2xl max-h-[92vh] rounded-3xl border border-[#DCE8E0] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* ─────────────────────────────────────────────────────────────
            1. REFINED HERITAGE THEME MODAL HEADER
            ───────────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 bg-[#122A24] text-white flex items-center justify-between shrink-0 shadow-md border-b border-[#1C443A] relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 m-0 font-sans">
                  Notifications &amp; Alerts
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/75 mt-0.5 mb-0">
                Official circulars, fee reminders &amp; broadcast notices for <strong className="text-emerald-300 uppercase">{normalizedRole === 'ALL' ? 'Whole School' : normalizedRole}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 relative z-10">
            <button
              type="button"
              onClick={fetchBroadcasts}
              disabled={loading}
              title="Refresh Announcements"
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Notifications"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. DEVICE PUSH STATUS & CHIME BAR
            ───────────────────────────────────────────────────────────── */}
        <div className="px-5 py-2.5 bg-[#F4F8F5] border-b border-[#DCE8E0] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {pushStatus === 'granted' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pushStatus === 'granted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-slate-700 text-xs font-medium">
              Push Alert Status:{' '}
              <strong className={pushStatus === 'granted' ? 'text-emerald-800 font-bold' : 'text-amber-800 font-bold'}>
                {pushStatus === 'granted' ? 'Active on this Device ✓' : 'Permission Not Enabled'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pushStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={isEnablingPush}
                className="px-3 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs rounded-xl shadow-2xs transition-colors border-none cursor-pointer flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isEnablingPush ? 'Activating...' : 'Turn On Push'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleTestChime}
              title="Test Notification Sound Chime"
              className="px-3 py-1 rounded-xl bg-white hover:bg-emerald-50/80 border border-[#DCE8E0] text-[#122A24] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Chime</span>
            </button>
          </div>
        </div>

        {testPushMsg && (
          <div className="px-5 py-2 bg-emerald-50 text-emerald-900 border-b border-emerald-200 text-xs font-semibold flex items-center justify-between shrink-0 animate-in fade-in duration-150">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {testPushMsg}
            </span>
            <button type="button" onClick={() => setTestPushMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold border-none bg-transparent cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. SEARCH BAR & SEGMENTED CATEGORY PILLS (THEME-ALIGNED)
            ───────────────────────────────────────────────────────────── */}
        <div className="p-3.5 sm:px-5 sm:py-3.5 bg-white border-b border-[#DCE8E0] space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, fee dues, exam dates, transport alerts..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-[#F8FAF9] hover:bg-white focus:bg-white border border-[#DCE8E0] rounded-xl text-[#122A24] placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all box-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 border-none bg-transparent cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Category Filter Pills */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All Notices', count: categoryCounts.ALL },
                { id: 'URGENT', label: '🚨 Alerts', count: categoryCounts.URGENT },
                { id: 'FEES', label: '💳 Fees', count: categoryCounts.FEES },
                { id: 'ACAD', label: '📜 Academic', count: categoryCounts.ACAD },
                { id: 'TRANSPORT', label: '🚌 Transport', count: categoryCounts.TRANSPORT }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    activeCategory === tab.id
                      ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                      : 'bg-[#F8FAF9] text-slate-700 border-[#DCE8E0] hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold ${
                      activeCategory === tab.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}

              {/* Unread Toggle */}
              <button
                type="button"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  showUnreadOnly
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'bg-[#F8FAF9] text-slate-700 border-[#DCE8E0] hover:bg-white hover:border-slate-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#122A24] bg-[#EBF5EF] hover:bg-[#D9EFE2] border border-[#C5E2CF] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ml-auto"
                title="Mark all displayed notices as read"
              >
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. REARRANGED NOTICES FEED (PERFECT ALIGNMENT & THEME)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FAFDFB]">
          {loading && broadcasts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading school broadcast repository...</span>
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] flex items-center justify-center text-emerald-700 mb-1 shadow-2xs">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 m-0">No Announcements Found</p>
              <p className="text-xs text-slate-500 max-w-sm m-0">
                {showUnreadOnly
                  ? 'You are all caught up! All notices delivered to your role have been read.'
                  : 'No broadcast circulars matching this category filter.'}
              </p>
              {(showUnreadOnly || activeCategory !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUnreadOnly(false);
                    setActiveCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline border-none bg-transparent cursor-pointer"
                >
                  Show all announcements
                </button>
              )}
            </div>
          ) : (
            filteredBroadcasts.map((item) => {
              const isRead = readIds.has(item.id);
              const theme = getCategoryTheme(item);

              return (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`relative p-4 sm:p-4.5 rounded-2xl border transition-all duration-150 cursor-pointer shadow-xs ${
                    !isRead
                      ? `${theme.cardBorder} shadow-sm`
                      : 'bg-white hover:bg-[#F8FAF9] border-[#DCE8E0]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Left Category Icon Squircle */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${theme.bgIcon}`}>
                      {theme.icon}
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 min-w-0">
                      {/* Top Badges & Timestamp Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-mono text-[10px] font-bold tracking-wide uppercase shadow-2xs ${theme.badgeBg}`}>
                            {theme.badgeLabel}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-lg bg-[#EBF5EF] border border-[#C5E2CF] text-[#1C443A] font-mono text-[10px] font-bold uppercase tracking-wider">
                            TARGET: {item.audience === 'ALL'
                              ? 'WHOLE SCHOOL'
                              : item.audience === 'FACULTY' || item.audience === 'TEACHERS'
                              ? 'FACULTY'
                              : item.audience === 'PARENTS'
                              ? 'PARENTS'
                              : item.audience === 'STUDENTS'
                              ? 'STUDENTS'
                              : item.audience}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.timestamp || 'Recent'}
                          </span>
                          {!isRead && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="mt-2 text-sm sm:text-[15px] font-bold text-[#122A24] leading-snug font-sans">
                        {item.title}
                      </h3>

                      {/* Body Message */}
                      <p className="mt-1 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                        {item.body}
                      </p>

                      {/* Footer Meta & Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 truncate text-slate-600 font-medium text-xs font-sans">
                          <ShieldAlert className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{item.senderName || 'School Administration'}</span>
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyNotice(item);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-[#DCE8E0] bg-white cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                            title="Copy notice text"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {!isRead ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(item.id);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 hover:bg-[#EBF5EF] border border-[#C5E2CF] bg-[#F4F8F5] cursor-pointer transition-colors"
                            >
                              Mark read
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. MODAL FOOTER
            ───────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 bg-[#F8FAF9] border-t border-[#DCE8E0] flex items-center justify-between text-xs shrink-0">
          <span className="text-xs text-[#2D5A4E] font-medium">
            Showing {filteredBroadcasts.length} active notice(s) • Academic Session 2026-27
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs rounded-xl shadow-xs transition-colors border-none cursor-pointer"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
}
