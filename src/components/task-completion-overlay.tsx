/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React from 'react';
import {
  Check,
  CheckCircle2,
  GraduationCap,
  Users,
  UserCheck,
  Receipt,
  Wallet,
  ShieldCheck,
  LogOut,
  Award,
  BookCheck,
  Megaphone,
  Sparkles,
  Bus,
  Layers,
  Building2,
  KeyRound
} from 'lucide-react';

export type TaskCelebrationType =
  | 'STUDENT'
  | 'FACULTY'
  | 'FEES'
  | 'VISITOR'
  | 'SIGNOUT'
  | 'EXAMS'
  | 'HOMEWORK'
  | 'BROADCAST'
  | 'CERTIFICATE'
  | 'TRANSPORT'
  | 'ATTENDANCE'
  | 'CLASS'
  | 'SECURITY'
  | 'GENERAL';

export interface TaskCelebrationData {
  type: TaskCelebrationType;
  title: string;
  subtitle?: string;
}

interface TaskCompletionOverlayProps {
  data: TaskCelebrationData | null;
}

export function TaskCompletionOverlay({ data }: TaskCompletionOverlayProps) {
  if (!data) return null;

  const getThemedContent = () => {
    switch (data.type) {
      case 'SIGNOUT':
        return {
          icon: <LogOut className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-exit-slide" />,
          outerRing: 'bg-rose-500/20 border-rose-400/60 shadow-rose-950/50',
          innerCircle: 'bg-rose-600',
          badgeText: 'Session Terminated Securely',
          badgeStyle: 'bg-rose-950/70 border-rose-500/40 text-rose-200',
          pulseColor: 'bg-rose-400'
        };

      case 'FEES':
        return {
          icon: <Receipt className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-coin-pop" />,
          outerRing: 'bg-amber-500/25 border-amber-400/70 shadow-amber-950/50',
          innerCircle: 'bg-amber-600',
          badgeText: 'Finance & Ledger Reconciled',
          badgeStyle: 'bg-amber-950/70 border-amber-500/40 text-amber-200',
          pulseColor: 'bg-amber-400'
        };

      case 'STUDENT':
        return {
          icon: <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-cap-float" />,
          outerRing: 'bg-indigo-500/25 border-indigo-400/70 shadow-indigo-950/50',
          innerCircle: 'bg-indigo-600',
          badgeText: 'CBSE Scholar Registry Updated',
          badgeStyle: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-200',
          pulseColor: 'bg-indigo-400'
        };

      case 'FACULTY':
        return {
          icon: <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-cap-float" />,
          outerRing: 'bg-teal-500/25 border-teal-400/70 shadow-teal-950/50',
          innerCircle: 'bg-teal-600',
          badgeText: 'Faculty Directorate Roster',
          badgeStyle: 'bg-teal-950/70 border-teal-500/40 text-teal-200',
          pulseColor: 'bg-teal-400'
        };

      case 'VISITOR':
        return {
          icon: <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-badge-stamp" />,
          outerRing: 'bg-emerald-500/25 border-emerald-400/70 shadow-emerald-950/50',
          innerCircle: 'bg-emerald-600',
          badgeText: 'Campus Gate Security Protocol',
          badgeStyle: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200',
          pulseColor: 'bg-emerald-400'
        };

      case 'EXAMS':
        return {
          icon: <Award className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-badge-stamp" />,
          outerRing: 'bg-cyan-500/25 border-cyan-400/70 shadow-cyan-950/50',
          innerCircle: 'bg-cyan-600',
          badgeText: 'Academic Assessment Ledger',
          badgeStyle: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-200',
          pulseColor: 'bg-cyan-400'
        };

      case 'HOMEWORK':
        return {
          icon: <BookCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-cap-float" />,
          outerRing: 'bg-sky-500/25 border-sky-400/70 shadow-sky-950/50',
          innerCircle: 'bg-sky-600',
          badgeText: 'Curriculum & Homework Studio',
          badgeStyle: 'bg-sky-950/70 border-sky-500/40 text-sky-200',
          pulseColor: 'bg-sky-400'
        };

      case 'BROADCAST':
        return {
          icon: <Megaphone className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-bell-ring" />,
          outerRing: 'bg-purple-500/25 border-purple-400/70 shadow-purple-950/50',
          innerCircle: 'bg-purple-600',
          badgeText: 'Institutional Circular Dispatched',
          badgeStyle: 'bg-purple-950/70 border-purple-500/40 text-purple-200',
          pulseColor: 'bg-purple-400'
        };

      case 'CERTIFICATE':
        return {
          icon: <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-badge-stamp" />,
          outerRing: 'bg-yellow-500/25 border-yellow-400/70 shadow-yellow-950/50',
          innerCircle: 'bg-yellow-600',
          badgeText: 'Verified Official Certificate',
          badgeStyle: 'bg-yellow-950/70 border-yellow-500/40 text-yellow-200',
          pulseColor: 'bg-yellow-400'
        };

      case 'TRANSPORT':
        return {
          icon: <Bus className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-cap-float" />,
          outerRing: 'bg-emerald-500/25 border-emerald-400/70 shadow-emerald-950/50',
          innerCircle: 'bg-emerald-600',
          badgeText: 'Fleet & Transit Tracking',
          badgeStyle: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200',
          pulseColor: 'bg-emerald-400'
        };

      case 'CLASS':
        return {
          icon: <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-cap-float" />,
          outerRing: 'bg-emerald-500/25 border-emerald-400/70 shadow-emerald-950/50',
          innerCircle: 'bg-emerald-700',
          badgeText: 'Academic Section & Roster',
          badgeStyle: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200',
          pulseColor: 'bg-emerald-400'
        };

      case 'SECURITY':
        return {
          icon: <KeyRound className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-badge-stamp" />,
          outerRing: 'bg-amber-500/25 border-amber-400/70 shadow-amber-950/50',
          innerCircle: 'bg-amber-700',
          badgeText: 'Credentials & Access Security',
          badgeStyle: 'bg-amber-950/70 border-amber-500/40 text-amber-200',
          pulseColor: 'bg-amber-400'
        };

      case 'ATTENDANCE':
      case 'GENERAL':
      default:
        return {
          icon: (
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline className="animate-tick-draw" points="20 6 9 17 4 12" />
            </svg>
          ),
          outerRing: 'bg-emerald-500/20 border-emerald-400/70 shadow-emerald-950/50',
          innerCircle: 'bg-emerald-500',
          badgeText: 'Academic Ledger Updated',
          badgeStyle: 'bg-emerald-900/70 border-emerald-500/40 text-emerald-200',
          pulseColor: 'bg-emerald-400'
        };
    }
  };

  const theme = getThemedContent();

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-md p-4 select-none pointer-events-none animate-in fade-in duration-150"
    >
      <div className="bg-[#122A24] text-white px-7 py-6 sm:px-8 sm:py-7 rounded-3xl shadow-2xl border border-emerald-500/40 flex flex-col items-center text-center max-w-xs sm:max-w-sm w-full mx-auto transform transition-all animate-[tickPop_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        {/* Animated Themed Icon Circle */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center mb-3.5 shadow-xl animate-tick-pop ${theme.outerRing}`}
        >
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center shadow-md ${theme.innerCircle}`}>
            {theme.icon}
          </div>
        </div>

        {/* Heading */}
        <h3 className="font-display font-bold text-lg sm:text-xl text-white tracking-tight leading-tight">
          {data.title}
        </h3>

        {/* Subtitle */}
        {data.subtitle && (
          <p className="text-xs sm:text-[13px] font-mono text-emerald-200/90 mt-1 font-medium leading-normal max-w-[280px]">
            {data.subtitle}
          </p>
        )}

        {/* Live Pulse Badge */}
        <div
          className={`mt-3.5 px-3 py-1 rounded-full border text-[10.5px] font-mono flex items-center gap-1.5 ${theme.badgeStyle}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.pulseColor}`} />
          <span>{theme.badgeText}</span>
        </div>
      </div>
    </div>
  );
}
