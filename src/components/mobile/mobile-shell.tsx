/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Home,
  Calendar,
  CreditCard,
  BookOpen,
  UserCheck,
  MapPin,
  ShieldAlert,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  ChevronDown,
  X,
  Plus,
  Send,
  Bus,
  FileText,
  DollarSign,
  Smartphone,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

export type UserRole = 'PARENT' | 'TEACHER' | 'PRINCIPAL' | 'DRIVER';

export interface MobileShellProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFrameMode: boolean;
  setIsFrameMode: (val: boolean) => void;
  children: React.ReactNode;
  schoolName?: string;
  studentName?: string;
}

export interface MobileNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'fee' | 'attendance' | 'bus' | 'homework' | 'broadcast' | 'urgent';
  roleTag: UserRole;
}

export default function MobileShell({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  isFrameMode,
  setIsFrameMode,
  children,
  schoolName = 'DPS International — CBSE',
  studentName = 'Aarav Sharma (VI-A)'
}: MobileShellProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showQuickActionSheet, setShowQuickActionSheet] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:41');
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  // Realistic time
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check push permission on client
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const [notifications, setNotifications] = useState<MobileNotification[]>([
    {
      id: 'n1',
      title: '🚌 Bus #04 Arriving Soon',
      description: 'Route #4 is 4 mins away from Green Park Main Gate stop.',
      time: '2m ago',
      read: false,
      type: 'bus',
      roleTag: 'PARENT'
    },
    {
      id: 'n2',
      title: '💳 Q2 Fee Receipt Generated',
      description: 'Payment of ₹28,500 acknowledged. Receipt #DPS-2026-8812 ready for download.',
      time: '1h ago',
      read: false,
      type: 'fee',
      roleTag: 'PARENT'
    },
    {
      id: 'n3',
      title: '📝 Math Assignment Submitted',
      description: '28 out of 34 students in VI-A have submitted Quadratic Equations homework.',
      time: '2h ago',
      read: true,
      type: 'homework',
      roleTag: 'TEACHER'
    },
    {
      id: 'n4',
      title: '🚨 Teacher Leave Request',
      description: 'Suman Verma requested casual leave for tomorrow. Swipe to review & approve.',
      time: '3h ago',
      read: false,
      type: 'urgent',
      roleTag: 'PRINCIPAL'
    },
    {
      id: 'n5',
      title: '📍 Route Deviation Advisory',
      description: 'Traffic congestion on Ring Road. Suggested alternate via Flyover Sector 9.',
      time: '15m ago',
      read: false,
      type: 'bus',
      roleTag: 'DRIVER'
    }
  ]);

  // Fetch live broadcasts from API
  const fetchLiveBroadcasts = async () => {
    try {
      const res = await fetch('/api/notifications/broadcasts');
      const data = await res.json();
      if (data.success && Array.isArray(data.broadcasts)) {
        const mappedBroadcasts: MobileNotification[] = data.broadcasts.map((bc: any) => ({
          id: bc.id,
          title: bc.urgent ? `🚨 ${bc.title}` : `📢 ${bc.title}`,
          description: bc.body,
          time: bc.timestamp || 'Recent',
          read: false,
          type: 'broadcast',
          roleTag: (bc.audience === 'TEACHERS' ? 'TEACHER' : bc.audience === 'TRANSPORT' ? 'DRIVER' : 'PARENT') as UserRole
        }));

        setNotifications((prev) => {
          // Merge unique by ID
          const existingIds = new Set(prev.map((n) => n.id));
          const newOnes = mappedBroadcasts.filter((n) => !existingIds.has(n.id));
          return [...newOnes, ...prev];
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveBroadcasts();
    const timer = setInterval(fetchLiveBroadcasts, 15000);

    // Listen for instant Service Worker push event messages
    const handleBroadcastEvent = (e: any) => {
      const bcData = e.detail;
      if (bcData) {
        const incoming: MobileNotification = {
          id: `bc_${Date.now()}`,
          title: bcData.urgent ? `🚨 ${bcData.title}` : `📢 ${bcData.title}`,
          description: bcData.body || 'New announcement received.',
          time: 'Just now',
          read: false,
          type: 'broadcast',
          roleTag: (bcData.audience === 'TEACHERS' ? 'TEACHER' : 'PARENT') as UserRole
        };
        setNotifications((prev) => [incoming, ...prev]);
      }
    };

    window.addEventListener('giterp_broadcast', handleBroadcastEvent);

    return () => {
      clearInterval(timer);
      window.removeEventListener('giterp_broadcast', handleBroadcastEvent);
    };
  }, []);

  // One-tap Enable Push Notifications on Mobile
  const handleEnableWebPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushMessage('Push notifications not supported on this device/browser.');
      return;
    }

    setIsEnablingPush(true);
    setPushMessage(null);

    try {
      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await Notification.requestPermission();
      }
      setPushPermission(perm);

      if (perm !== 'granted') {
        setPushMessage('Permission not granted. Please allow notifications in site settings.');
        setIsEnablingPush(false);
        return;
      }

      const keyRes = await fetch('/api/notifications/vapid-key');
      const keyData = await keyRes.json();
      const publicKey = keyData?.publicKey;

      if (!publicKey) {
        throw new Error('VAPID key unavailable');
      }

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        const clean = publicKey.trim();
        const padding = '='.repeat((4 - (clean.length % 4)) % 4);
        const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: outputArray
          });
        }

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.toJSON().keys?.p256dh,
              auth: sub.toJSON().keys?.auth
            },
            role: activeRole,
            userId: `${activeRole.toLowerCase()}_mobile`
          })
        });

        setPushMessage('🎉 Web Push active! You will receive all school broadcasts instantly.');
      } else {
        setPushMessage('✅ Notifications active on this device!');
      }
    } catch (e: any) {
      setPushMessage('Notice: ' + (e.message || e));
    } finally {
      setIsEnablingPush(false);
      setTimeout(() => setPushMessage(null), 5000);
    }
  };

  const unreadCount = notifications.filter(n => !n.read && (n.roleTag === activeRole || n.type === 'broadcast')).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Role Configs
  const roleLabels: Record<UserRole, { title: string; subtitle: string; icon: any; color: string; bg: string }> = {
    PARENT: {
      title: 'Parent & Student',
      subtitle: studentName,
      icon: GraduationCap,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200'
    },
    TEACHER: {
      title: 'Faculty / Teacher',
      subtitle: 'Class VI-A Class Teacher',
      icon: Users,
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200'
    },
    PRINCIPAL: {
      title: 'Principal / Admin',
      subtitle: 'Executive Command Desk',
      icon: ShieldAlert,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50 border-indigo-200'
    },
    DRIVER: {
      title: 'Transport / Bus',
      subtitle: 'Bus #04 • Route South 2',
      icon: Bus,
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200'
    }
  };

  // Tabs for each role
  const getTabsForRole = (role: UserRole) => {
    switch (role) {
      case 'PARENT':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'academics', label: 'Academics', icon: BookOpen },
          { id: 'fees', label: 'Fees & Pay', icon: DollarSign, badge: 'Due' },
          { id: 'bus', label: 'Live Bus', icon: Bus, pulse: true },
          { id: 'profile', label: 'ID Card', icon: GraduationCap }
        ];
      case 'TEACHER':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'attendance', label: 'Roll Call', icon: UserCheck, badge: 'Today' },
          { id: 'homework', label: 'Homework', icon: FileText },
          { id: 'marks', label: 'Marks Entry', icon: BookOpen },
          { id: 'timetable', label: 'Schedule', icon: Calendar }
        ];
      case 'PRINCIPAL':
        return [
          { id: 'home', label: 'Command', icon: Home },
          { id: 'approvals', label: 'Approvals', icon: CheckCircle2, badge: '3' },
          { id: 'analytics', label: 'Live Pulse', icon: Layers },
          { id: 'broadcast', label: 'Broadcast', icon: Send },
          { id: 'staff', label: 'Staff Hub', icon: Users }
        ];
      case 'DRIVER':
        return [
          { id: 'home', label: 'Route Radar', icon: MapPin, pulse: true },
          { id: 'students', label: 'Boarding', icon: UserCheck, badge: '14/22' },
          { id: 'stops', label: 'Stop Times', icon: Clock },
          { id: 'sos', label: 'Emergency', icon: AlertTriangle }
        ];
      default:
        return [];
    }
  };

  const currentTabs = getTabsForRole(activeRole);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-900 flex flex-col items-center justify-start antialiased selection:bg-emerald-500 selection:text-white pb-12 sm:py-6">
      
      {/* Top Preview Control Bar (Visible on desktop/tablet for easy role and frame switching) */}
      <header className="w-full max-w-5xl px-4 py-3 mb-2 hidden md:flex items-center justify-between bg-neutral-800/80 backdrop-blur border border-neutral-700/60 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/giterp-logo.png" alt="Giterp Logo" className="w-9 h-9 rounded-xl object-contain bg-[#122A24] border border-white/20 p-1 shadow-md" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Giterp Mobile Native ERP
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                PWA / Native Shell
              </span>
            </h1>
            <p className="text-xs text-neutral-400">CBSE Multi-Role Interactive Mobile Interface</p>
          </div>
        </div>

        {/* Role Switcher Pill in Top Bar */}
        <div className="flex items-center gap-2 bg-neutral-900/90 p-1 rounded-xl border border-neutral-700/60">
          {(['PARENT', 'TEACHER', 'PRINCIPAL', 'DRIVER'] as UserRole[]).map((r) => {
            const isSel = activeRole === r;
            return (
              <button
                key={r}
                onClick={() => {
                  setActiveRole(r);
                  setActiveTab('home');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {r === 'PARENT' && '👨‍👩‍👧 Parent'}
                {r === 'TEACHER' && '👨‍🏫 Teacher'}
                {r === 'PRINCIPAL' && '👔 Principal'}
                {r === 'DRIVER' && '🚌 Driver'}
              </button>
            );
          })}
        </div>

        {/* Simulator Frame Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFrameMode(!isFrameMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isFrameMode
                ? 'bg-neutral-700 text-white border-neutral-600'
                : 'bg-neutral-900/60 text-neutral-300 border-neutral-700 hover:text-white'
            }`}
            title="Toggle iPhone 16 Pro Frame Mockup"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {isFrameMode ? 'Frame: iPhone 16 Pro' : 'Frame: Full Viewport'}
          </button>
          <a
            href="/app"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/30 transition-colors"
          >
            Back to Web ERP →
          </a>
        </div>
      </header>

      {/* Main Container — Frame Simulator or Responsive Full Screen */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col ${
          isFrameMode
            ? 'max-w-[420px] h-[890px] max-h-[92vh] rounded-[48px] border-[10px] border-neutral-800 shadow-[0_25px_70px_rgba(0,0,0,0.7)] ring-1 ring-neutral-700/60 overflow-hidden bg-neutral-50'
            : 'max-w-md min-h-screen bg-neutral-50 shadow-2xl overflow-hidden'
        }`}
      >
        {/* Dynamic Island / Native Top Status Bar */}
        <div className="w-full bg-[#122A24] text-white pt-2.5 pb-1 px-5 flex items-center justify-between text-[11px] font-medium tracking-tight select-none relative z-30">
          <span className="font-semibold">{currentTime}</span>

          {/* Dynamic Island Pill (Simulated) */}
          <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-1 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[8px] tracking-wider font-mono text-neutral-300">CBSE GPS</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px]">5G</span>
            <div className="w-4 h-2 border border-white/80 rounded-[2px] p-[1px] flex items-center">
              <div className="h-full w-3/4 bg-white rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Native Mobile App Header */}
        <header className="w-full bg-[#122A24] text-white px-4 py-3 flex items-center justify-between border-b border-emerald-950/50 shadow-md relative z-20">
          <div className="flex items-center gap-2.5">
            {/* School Crest / Monogram */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-400/30 flex items-center justify-center font-bold text-white shadow-inner">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-emerald-300 tracking-wide flex items-center gap-1">
                {schoolName}
              </div>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1 text-sm font-bold text-white hover:text-amber-200 transition-colors"
              >
                <span>{roleLabels[activeRole].title}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationCenter(true)}
              className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-[#122A24] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Role Switcher Drawer Button */}
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="w-9 h-9 rounded-full bg-emerald-700/70 border border-emerald-400/30 text-white text-xs font-bold flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
              title="Switch Persona"
            >
              {activeRole === 'PARENT' ? 'P' : activeRole === 'TEACHER' ? 'T' : activeRole === 'PRINCIPAL' ? 'A' : 'D'}
            </button>
          </div>
        </header>

        {/* Role Selector Dropdown Sheet */}
        {showRoleMenu && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-neutral-200 animate-spring-up pb-8">
              <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-neutral-900 text-base">Select Mobile User Persona</h3>
                <button
                  onClick={() => setShowRoleMenu(false)}
                  className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                Experience Giterp ERP through the customized views tailored for each school stakeholder.
              </p>

              <div className="space-y-2.5">
                {(['PARENT', 'TEACHER', 'PRINCIPAL', 'DRIVER'] as UserRole[]).map((r) => {
                  const info = roleLabels[r];
                  const Icon = info.icon;
                  const isSelected = activeRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                        setActiveTab('home');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all text-left ${
                        isSelected
                          ? `${info.bg} ring-2 ring-emerald-600 shadow-sm`
                          : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-700 shadow-sm'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                            {info.title}
                            {isSelected && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500">{info.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Notification Center Drawer */}
        {showNotificationCenter && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-neutral-200 max-h-[85%] flex flex-col animate-spring-up pb-8">
              <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-neutral-900 text-base">Notification Center</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Mark read
                  </button>
                  <button
                    onClick={() => setShowNotificationCenter(false)}
                    className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Push Permission Prompt inside Drawer */}
              {pushPermission !== 'granted' && (
                <div className="mb-3 p-3.5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-sm border border-emerald-500/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
                    <div className="text-xs font-bold">Enable Push Notifications</div>
                  </div>
                  <p className="text-[11px] text-emerald-200 leading-snug">
                    Receive instant CBSE broadcasts, fee receipts, and emergency alerts on this device.
                  </p>
                  <button
                    onClick={handleEnableWebPush}
                    disabled={isEnablingPush}
                    className="mt-1 py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1 cursor-pointer border-none"
                  >
                    {isEnablingPush ? 'Activating Web Push...' : '🔔 Turn On Push Alerts'}
                  </button>
                </div>
              )}

              {pushMessage && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold animate-fade-in">
                  {pushMessage}
                </div>
              )}

              <div className="overflow-y-auto space-y-2.5 pr-1 mt-1 flex-1 hide-scrollbar">
                {notifications.map((n) => {
                  const isBroadcast = n.type === 'broadcast' || n.title.includes('📢') || n.title.includes('🚨');
                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isBroadcast
                          ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-400/30'
                          : n.read
                          ? 'bg-neutral-50/70 border-neutral-200'
                          : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 whitespace-nowrap">{n.time}</span>
                      </div>
                      <p className="text-xs text-neutral-700 mt-1 leading-relaxed">{n.description}</p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isBroadcast
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-neutral-200/70 text-neutral-700'
                        }`}>
                          {isBroadcast ? 'CBSE BROADCAST' : n.roleTag}
                        </span>
                        <button
                          onClick={() => {
                            if (n.type === 'fee') {
                              setActiveRole('PARENT');
                              setActiveTab('fees');
                            } else if (n.type === 'bus') {
                              setActiveRole('PARENT');
                              setActiveTab('bus');
                            } else if (n.type === 'homework') {
                              setActiveRole('TEACHER');
                              setActiveTab('homework');
                            } else if (n.type === 'urgent') {
                              setActiveRole('PRINCIPAL');
                              setActiveTab('approvals');
                            } else if (n.type === 'broadcast') {
                              setActiveTab('home');
                            }
                            setShowNotificationCenter(false);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 hover:underline"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Global Quick Action Sheet Modal */}
        {showQuickActionSheet && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-neutral-200 animate-spring-up pb-8">
              <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-neutral-900 text-base">Quick Actions</h3>
                <button
                  onClick={() => setShowQuickActionSheet(false)}
                  className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {activeRole === 'PARENT' && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab('fees');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-left hover:bg-emerald-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-emerald-950">Pay Term Fee</div>
                      <div className="text-[10px] text-emerald-700">UPI / QR instant receipt</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('bus');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-left hover:bg-blue-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2">
                        <Bus className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-blue-950">Track School Bus</div>
                      <div className="text-[10px] text-blue-700">Live GPS & ETA alert</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('academics');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-amber-950">Apply Leave</div>
                      <div className="text-[10px] text-amber-700">Send note to teacher</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-left hover:bg-purple-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-purple-950">Digital ID Card</div>
                      <div className="text-[10px] text-purple-700">Show gate pass QR</div>
                    </button>
                  </>
                )}

                {activeRole === 'TEACHER' && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab('attendance');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-left hover:bg-emerald-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-emerald-950">Take Attendance</div>
                      <div className="text-[10px] text-emerald-700">1-Tap roll call with SMS</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('homework');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-left hover:bg-blue-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-blue-950">Assign Homework</div>
                      <div className="text-[10px] text-blue-700">Add PDF / photo diary</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('marks');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-amber-950">Enter Exam Marks</div>
                      <div className="text-[10px] text-amber-700">Periodic test ledger</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('timetable');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-left hover:bg-indigo-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-indigo-950">Apply Staff Leave</div>
                      <div className="text-[10px] text-indigo-700">Submit casual/medical note</div>
                    </button>
                  </>
                )}

                {activeRole === 'PRINCIPAL' && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab('broadcast');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-left hover:bg-red-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center mb-2">
                        <Send className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-red-950">Emergency Broadcast</div>
                      <div className="text-[10px] text-red-700">SMS + App notification to all</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('approvals');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-left hover:bg-indigo-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-indigo-950">Pending Approvals</div>
                      <div className="text-[10px] text-indigo-700">Staff leaves & discounts</div>
                    </button>
                  </>
                )}

                {activeRole === 'DRIVER' && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab('home');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-left hover:bg-emerald-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-emerald-950">Start Route GPS</div>
                      <div className="text-[10px] text-emerald-700">Broadcast live telemetry</div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('sos');
                        setShowQuickActionSheet(false);
                      }}
                      className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-left hover:bg-red-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center mb-2">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-red-950">SOS Breakdown</div>
                      <div className="text-[10px] text-red-700">Immediate transport alert</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Viewport Body — Dynamic Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-24 bg-neutral-50 hide-scrollbar relative">
          {children}
        </main>

        {/* Floating Quick Action Button */}
        <div className="absolute bottom-[72px] right-4 z-40">
          <button
            onClick={() => setShowQuickActionSheet(true)}
            className="w-12 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-[0_8px_20px_rgba(18,42,36,0.35)] flex items-center justify-center active:scale-95 transition-all border-2 border-white"
            aria-label="Quick Action"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Native Mobile Bottom Navigation Tab Bar */}
        <nav className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-neutral-200/90 px-2 py-2 flex items-center justify-around z-30 shadow-lg safe-bottom">
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all touch-tap-none ${
                  isActive ? 'text-emerald-800 font-bold scale-105' : 'text-neutral-400 hover:text-neutral-600 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.pulse && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  )}
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-3 px-1 py-[1px] rounded-full bg-emerald-600 text-white text-[8px] font-bold">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-700 mt-0.5 animate-fade-in" />
                )}
              </button>
            );
          })}
        </nav>

        {/* iOS Home Indicator Bar (In frame mode) */}
        {isFrameMode && (
          <div className="w-full bg-white pb-1 pt-0.5 flex justify-center z-40 select-none">
            <div className="w-32 h-1 bg-neutral-300 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
