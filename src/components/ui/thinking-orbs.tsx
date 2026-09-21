/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - ThinkingOrb Component */
'use client';

import React from 'react';
import { ThinkingOrb, type ThinkingOrbProps, type OrbState, type OrbSize, type OrbTheme } from 'thinking-orbs';

export { ThinkingOrb };
export type { ThinkingOrbProps, OrbState, OrbSize, OrbTheme };

// Thinking (composing) — a single status pill
export function ThinkingOrbThinkingDemo({
  text = 'Thinking….',
  state = 'composing',
  speed = 1.6,
}: {
  text?: string;
  state?: OrbState;
  speed?: number;
}) {
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center bg-[#070707] p-8">
      <div
        className="inline-flex h-[74px] items-center gap-3 rounded-full pl-[9px] pr-8"
        style={{
          background: 'rgba(29,29,29,0.42)',
          boxShadow:
            'inset 0 0 0 1px rgba(44,47,54,0.31), inset 0 0 50px 0 rgba(255,255,255,0.012)',
        }}
      >
        <span className="flex items-center justify-center">
          <ThinkingOrb state={state} size={64} speed={speed} theme="dark" />
        </span>
        <span
          className="whitespace-nowrap text-lg leading-6"
          style={{ color: 'rgba(251,251,251,0.5)' }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

// Compact Sync Pill for Header / Floating Status
export function ThinkingOrbSyncPill({
  text = 'Syncing ERP Master Database…',
  compact = false,
  state = 'working',
  speed = 1.6,
}: {
  text?: string;
  compact?: boolean;
  state?: OrbState;
  speed?: number;
}) {
  if (compact) {
    return (
      <div
        className="inline-flex h-[36px] items-center gap-2 rounded-full pl-2 pr-3.5 backdrop-blur-md transition-all animate-fade-in"
        style={{
          background: 'rgba(18, 42, 36, 0.85)',
          boxShadow: 'inset 0 0 0 1px rgba(0, 229, 153, 0.25), 0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <ThinkingOrb state={state} size={20} speed={speed} theme="dark" />
        <span className="whitespace-nowrap text-[11px] font-mono font-medium text-emerald-300">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex h-[56px] sm:h-[64px] items-center gap-3 rounded-full pl-2 pr-6 backdrop-blur-md transition-all animate-scale-in"
      style={{
        background: 'rgba(18, 42, 36, 0.92)',
        boxShadow:
          'inset 0 0 0 1px rgba(0, 229, 153, 0.35), 0 10px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      <span className="flex items-center justify-center">
        <ThinkingOrb state={state} size={64} speed={speed} theme="dark" />
      </span>
      <div className="flex flex-col">
        <span className="whitespace-nowrap text-xs sm:text-sm font-semibold text-white">
          {text}
        </span>
        <span className="text-[10px] font-mono text-emerald-300/75">
          CBSE Real-Time Telemetry Active
        </span>
      </div>
    </div>
  );
}

