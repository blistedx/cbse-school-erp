/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - ThinkingOrb Component */
'use client';

import React, { useEffect, useRef } from 'react';

export interface ThinkingOrbProps {
  state?: 'composing' | 'idle' | 'listening' | 'thinking' | string;
  size?: number;
  theme?: 'dark' | 'light';
  className?: string;
}

export function ThinkingOrb({
  state = 'composing',
  size = 64,
  theme = 'dark',
  className = ''
}: ThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    // Retina display scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const render = () => {
      t += 0.035;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = (width / 2) * 0.72;

      ctx.clearRect(0, 0, width, height);

      // Multi-layer glowing fluid orb gradients
      // Layer 1: Ambient Outer Glow
      const ambientGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.3);
      ambientGrad.addColorStop(0, 'rgba(0, 229, 153, 0.45)'); // Mint glow
      ambientGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)'); // Cyan
      ambientGrad.addColorStop(0.8, 'rgba(139, 92, 246, 0.2)'); // Violet
      ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = ambientGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Revolving Inner Chromatic Orbs
      const numRings = 4;
      for (let i = 0; i < numRings; i++) {
        const angle = t * (i % 2 === 0 ? 1 : -1.2) + (i * Math.PI) / 2;
        const wobble = Math.sin(t * 1.5 + i) * (radius * 0.18);
        const ox = cx + Math.cos(angle) * (radius * 0.35 + wobble);
        const oy = cy + Math.sin(angle) * (radius * 0.35 + wobble);
        const rSize = radius * (0.45 + Math.sin(t * 2 + i) * 0.08);

        const orbGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, rSize);
        if (i === 0) {
          orbGrad.addColorStop(0, 'rgba(0, 229, 153, 0.85)'); // Mint
          orbGrad.addColorStop(1, 'rgba(0, 229, 153, 0)');
        } else if (i === 1) {
          orbGrad.addColorStop(0, 'rgba(56, 189, 248, 0.8)'); // Sky blue
          orbGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        } else if (i === 2) {
          orbGrad.addColorStop(0, 'rgba(168, 85, 247, 0.8)'); // Purple
          orbGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        } else {
          orbGrad.addColorStop(0, 'rgba(245, 158, 11, 0.75)'); // Amber / Gold
          orbGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        }

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, rSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Layer 3: Central High-Intensity Plasma Core
      const corePulse = Math.sin(t * 3) * (radius * 0.05);
      const coreGrad = ctx.createRadialGradient(
        cx + Math.cos(t) * 4,
        cy + Math.sin(t) * 4,
        0,
        cx,
        cy,
        radius * 0.55 + corePulse
      );
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.3, 'rgba(0, 229, 153, 0.8)');
      coreGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.5)');
      coreGrad.addColorStop(1, 'rgba(18, 42, 36, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.55 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Layer 4: Glass Rim Specular Highlight
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, state, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`inline-block shrink-0 select-none pointer-events-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    />
  );
}

// Thinking (composing) — a single status pill, exactly as requested
export function ThinkingOrbThinkingDemo({
  text = 'Thinking….'
}: {
  text?: string;
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
        <span className="[&_canvas]:!size-14">
          <ThinkingOrb state="composing" size={64} theme="dark" />
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
  compact = false
}: {
  text?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className="inline-flex h-[36px] items-center gap-2 rounded-full pl-1.5 pr-3.5 backdrop-blur-md transition-all animate-fade-in"
        style={{
          background: 'rgba(18, 42, 36, 0.85)',
          boxShadow: 'inset 0 0 0 1px rgba(0, 229, 153, 0.25), 0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <ThinkingOrb state="composing" size={24} theme="dark" />
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
      <span className="[&_canvas]:!size-11 sm:[&_canvas]:!size-12 flex items-center justify-center">
        <ThinkingOrb state="composing" size={48} theme="dark" />
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
