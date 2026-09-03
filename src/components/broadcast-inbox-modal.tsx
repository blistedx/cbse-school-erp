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
  Users,
  Smartphone,
  Copy,
  Filter,
  Inbox,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { playNotificationChime, getNotificationPermissionStatus, requestNotificationPermission, sendTestNotification } from '@/lib/push-notifications';

export interface BroadcastItem {
  id: string;
  title: string;
  body: string;
  url?: string;
  audience: string;
  urgent?: boolean;
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
  const [filterAudience, setFilterAudience] = useState<string>('MATCH_MY_ROLE');
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
      const data = await res.json();
      if (data.success && Array.isArray(data.broadcasts)) {
        setBroadcasts(data.broadcasts);
      }
    } catch (err) {
      console.warn('[BroadcastInbox] Failed to fetch broadcasts:', err);
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
            senderName: payload.senderName || 'School Administration',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString()
          };
          // Prepend if not exists
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

  // Filter broadcasts according to audience and search query
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((item) => {
      const aud = (item.audience || 'ALL').toUpperCase();

      // Audience relevance check
      if (filterAudience === 'MATCH_MY_ROLE') {
        if (!isAdminOrPrincipal) {
          if (normalizedRole === 'TEACHER' || normalizedRole === 'FACULTY') {
            const matches = aud === 'ALL' || aud === 'FACULTY' || aud === 'TEACHERS';
            if (!matches) return false;
          } else if (normalizedRole === 'PARENT') {
            const matches = aud === 'ALL' || aud === 'PARENTS' || aud === 'BUS_PARENTS';
            if (!matches) return false;
          } else if (normalizedRole === 'STUDENT') {
            const matches = aud === 'ALL' || aud === 'STUDENTS';
            if (!matches) return false;
          } else if (normalizedRole === 'DRIVER') {
            const matches = aud === 'ALL' || aud === 'TRANSPORT' || aud === 'BUS_PARENTS';
            if (!matches) return false;
          }
        }
      } else if (filterAudience !== 'ALL') {
        if (aud !== filterAudience) return false;
      }

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
  }, [broadcasts, filterAudience, normalizedRole, isAdminOrPrincipal, showUnreadOnly, readIds, searchQuery]);

  // Unread count specifically for this user's role
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
      if (normalizedRole === 'DRIVER') {
        return aud === 'ALL' || aud === 'TRANSPORT' || aud === 'BUS_PARENTS';
      }
      return true;
    }).length;
  }, [broadcasts, readIds, normalizedRole, isAdminOrPrincipal]);

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
    const text = `${item.title}\n\n${item.body}\n\n— Dispatched by ${item.senderName || 'School Admin'} (${item.timestamp || 'Recent'})`;
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
        setTestPushMsg('✅ Push notifications activated on this device!');
        playNotificationChime();
      } else {
        setTestPushMsg('Permission denied in browser settings.');
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
    setTestPushMsg('🔔 Audio chime played!');
    setTimeout(() => setTestPushMsg(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white text-slate-900 w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#122A24] via-[#1A3D34] to-[#122A24] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-display font-bold tracking-tight text-white flex items-center gap-1.5">
                  Notifications &amp; Alerts
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10.5px] font-bold shadow-xs animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/80 font-mono">
                Recent updates, notices &amp; missed push alerts for {normalizedRole === 'ALL' ? 'All Roles' : normalizedRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchBroadcasts}
              disabled={loading}
              title="Refresh Broadcasts"
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Device Push Status Banner */}
        <div className="px-4 py-2.5 bg-[#F4F8F5] border-b border-[#DCE8E0] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {pushStatus === 'granted' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${pushStatus === 'granted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="font-semibold text-slate-700">
              Push Alerts:{' '}
              <strong className={pushStatus === 'granted' ? 'text-emerald-700' : 'text-amber-700'}>
                {pushStatus === 'granted' ? 'Active on this Device ✓' : 'Permission Not Enabled'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pushStatus !== 'granted' && (
              <button
                onClick={handleEnablePush}
                disabled={isEnablingPush}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors border-none cursor-pointer flex items-center gap-1"
              >
                <Smartphone className="w-3 h-3" />
                {isEnablingPush ? 'Activating...' : 'Turn On Mobile Push'}
              </button>
            )}
            <button
              onClick={handleTestChime}
              title="Test Bell Chime Sound"
              className="p-1 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3 h-3 text-emerald-700" />
              <span>Chime</span>
            </button>
          </div>
        </div>

        {testPushMsg && (
          <div className="px-4 py-1.5 bg-emerald-100/80 text-emerald-900 border-b border-emerald-200 text-xs font-semibold flex items-center justify-between animate-fade-in">
            <span>{testPushMsg}</span>
            <button onClick={() => setTestPushMsg(null)} className="text-emerald-700 hover:text-emerald-900 border-none bg-transparent cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-3 sm:px-4 sm:py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices by keyword, title, body..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Audience selector for Admin/Principal */}
            {isAdminOrPrincipal && (
              <select
                value={filterAudience}
                onChange={(e) => setFilterAudience(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
                title="Filter by target audience"
              >
                <option value="MATCH_MY_ROLE">My Role Scope</option>
                <option value="ALL">All Audiences</option>
                <option value="FACULTY">Faculty / Teachers Only</option>
                <option value="PARENTS">Parents Only</option>
                <option value="STUDENTS">Students Only</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors border flex items-center gap-1 cursor-pointer ${
                showUnreadOnly
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Unread</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Mark all notices as read"
              >
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notices Feed List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#FAFDFB]">
          {loading && broadcasts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              <span className="text-xs font-mono">Loading school broadcast repository...</span>
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 mb-1">
                <Inbox className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">No Broadcast Notices Found</p>
              <p className="text-xs text-slate-500 max-w-sm">
                {showUnreadOnly
                  ? 'You are all caught up! You have read all notices delivered to your role.'
                  : 'No broadcast circulars have been dispatched for your account scope.'}
              </p>
              {showUnreadOnly && (
                <button
                  onClick={() => setShowUnreadOnly(false)}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline border-none bg-transparent cursor-pointer"
                >
                  Show all notices
                </button>
              )}
            </div>
          ) : (
            filteredBroadcasts.map((item) => {
              const isRead = readIds.has(item.id);
              const isUrgent = !!item.urgent;

              return (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isUrgent
                      ? 'bg-rose-50/70 hover:bg-rose-50 border-rose-200/90 shadow-xs'
                      : !isRead
                      ? 'bg-amber-50/60 hover:bg-amber-50 border-amber-200/90 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!isRead && (
                    <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                  )}

                  {/* Notice Meta Header */}
                  <div className="flex flex-wrap items-center gap-2 pr-6">
                    {isUrgent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[9.5px] font-bold tracking-wider uppercase shadow-2xs">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        🚨 Urgent Alert
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-700 text-white font-mono text-[9.5px] font-bold tracking-wider uppercase shadow-2xs">
                        <Radio className="w-2.5 h-2.5" />
                        Broadcast
                      </span>
                    )}

                    {/* Target Audience Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[9.5px] font-semibold uppercase">
                      Target:{' '}
                      {item.audience === 'ALL'
                        ? 'Whole School'
                        : item.audience === 'FACULTY' || item.audience === 'TEACHERS'
                        ? 'Faculty Staff'
                        : item.audience === 'PARENTS'
                        ? 'Parents'
                        : item.audience === 'STUDENTS'
                        ? 'Students'
                        : item.audience}
                    </span>

                    {/* Timestamp */}
                    <span className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {item.timestamp || 'Recent'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-2 text-sm font-display font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  {/* Body Message */}
                  <p className="mt-1 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                    {item.body}
                  </p>

                  {/* Footer Meta & Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate text-slate-500">
                      <ShieldAlert className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>{item.senderName || 'School Administration'}</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyNotice(item);
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-none bg-transparent cursor-pointer flex items-center gap-1 transition-colors"
                        title="Copy notice text"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
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
                          className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                        >
                          Mark as read
                        </button>
                      ) : (
                        <span className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Total {filteredBroadcasts.length} notice(s) • Showing archives
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#122A24] hover:bg-[#1A3D34] text-white font-bold text-xs rounded-xl shadow-xs transition-colors border-none cursor-pointer"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
}
