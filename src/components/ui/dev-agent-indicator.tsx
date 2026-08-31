/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, AlertTriangle, CheckCircle, Database, X, ChevronUp, Bug, Activity, Trash2 } from 'lucide-react';

interface ErrorLog {
  id: string;
  time: string;
  message: string;
  type: 'error' | 'warn' | 'info';
}

export default function DevAgentIndicator() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'ready' | 'rendering' | 'error'>('ready');
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [lastRenderTime, setLastRenderTime] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    setLastRenderTime(new Date().toLocaleTimeString());

    // Intercept console errors and warnings for live rendering inspector
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      originalConsoleError(...args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      setErrorLogs(prev => [
        { id: `err-${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString(), message: msg, type: 'error' },
        ...prev.slice(0, 49)
      ]);
      setStatus('error');
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      setErrorLogs(prev => [
        { id: `warn-${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString(), message: msg, type: 'warn' },
        ...prev.slice(0, 49)
      ]);
    };

    // Global uncaught error listener
    const handleGlobalError = (event: ErrorEvent) => {
      setErrorLogs(prev => [
        { id: `uncaught-${Date.now()}`, time: new Date().toLocaleTimeString(), message: `${event.message} at ${event.filename}:${event.lineno}`, type: 'error' },
        ...prev.slice(0, 49)
      ]);
      setStatus('error');
    };

    window.addEventListener('error', handleGlobalError);

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  if (!isClient) return null;

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('giterp_') || k === 'current_school' || k === 'current_user') {
          localStorage.removeItem(k);
        }
      });
      alert('Offline cache cleared successfully! Page will now reload.');
      window.location.reload();
    }
  };

  const handleManualFastRefresh = () => {
    setStatus('rendering');
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const errorCount = errorLogs.filter(e => e.type === 'error').length;

  return (
    <div className="fixed bottom-4 left-4 z-[999999] font-sans antialiased select-none">
      {/* ─── FLOATING 'N' DEV AGENT BUTTON ─── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Next.js Dev Agent & Error Inspector"
          className={`relative group flex items-center justify-center w-10 h-10 rounded-full shadow-2xl transition-all duration-300 border ${
            errorCount > 0
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-950/50 hover:scale-110'
              : 'bg-zinc-950/90 border-zinc-700/80 text-white shadow-black/60 hover:scale-110 hover:border-emerald-500'
          } backdrop-blur-md cursor-pointer`}
        >
          {/* Pulsing Status Dot */}
          <span
            className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${
              errorCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
            }`}
          />
          <span
            className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${
              errorCount > 0 ? 'bg-rose-500' : 'bg-emerald-400'
            }`}
          />

          {/* Next.js 'N' Logo Style */}
          <span className="font-extrabold text-sm tracking-tighter text-zinc-100 font-mono">
            ▲N
          </span>
        </button>

        {/* Live Status Pill when closed */}
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-[11px] font-medium text-zinc-300 shadow-lg hover:border-zinc-700 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Fast Refresh Live</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── EXPANDED DEV AGENT INSPECTOR PANEL ─── */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-[420px] max-w-[92vw] max-h-[520px] bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center font-mono font-black text-xs text-emerald-400 border border-zinc-700">
                N
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  Next.js Live Agent
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">Offline Rendering & Error Inspector</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleManualFastRefresh}
                title="Trigger Fast Refresh"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-900/30 border-b border-zinc-800/50 text-[11px]">
            <div className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex flex-col">
              <span className="text-[10px] text-zinc-500">Live Status</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Hot Reload On
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex flex-col">
              <span className="text-[10px] text-zinc-500">Errors / Warnings</span>
              <span className={`font-semibold ${errorCount > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {errorCount} Errors
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex flex-col">
              <span className="text-[10px] text-zinc-500">Last Render</span>
              <span className="font-semibold text-zinc-300 font-mono text-[10px]">
                {lastRenderTime || 'Just now'}
              </span>
            </div>
          </div>

          {/* Error & Event Log Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[260px] text-xs font-mono">
            {errorLogs.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 flex flex-col items-center justify-center gap-1.5">
                <CheckCircle className="w-6 h-6 text-emerald-500/60" />
                <span className="text-[11px] font-sans font-medium text-zinc-400">Zero Runtime Errors</span>
                <span className="text-[10px] text-zinc-500 font-sans">
                  Components rendering cleanly in real time.
                </span>
              </div>
            ) : (
              errorLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-lg border text-[11px] leading-relaxed break-words ${
                    log.type === 'error'
                      ? 'bg-rose-950/40 border-rose-900/50 text-rose-200'
                      : 'bg-amber-950/40 border-amber-900/50 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                    <span className="font-bold uppercase tracking-wider">{log.type}</span>
                    <span>{log.time}</span>
                  </div>
                  <div>{log.message}</div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-2">
            <button
              onClick={() => setErrorLogs([])}
              disabled={errorLogs.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" />
              Clear Logs
            </button>

            <button
              onClick={handleClearCache}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition"
            >
              <Database className="w-3 h-3" />
              Clear Local Cache & Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
