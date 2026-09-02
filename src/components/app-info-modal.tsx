/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, ShieldCheck, Database, Radio, Sparkles, Terminal, Cpu } from 'lucide-react';
import { APP_INFO, forcePurgeAppCache } from '@/lib/app-info';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppInfoModal({ isOpen, onClose }: AppInfoModalProps) {
  const [checking, setChecking] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [purging, setPurging] = useState(false);

  if (!isOpen) return null;

  const handleCheckServerBuild = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/app-info?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setServerInfo(data);
    } catch (e: any) {
      setServerInfo({ error: e?.message || 'Failed to reach server' });
    } finally {
      setChecking(false);
    }
  };

  const handleForceUpdate = async () => {
    setPurging(true);
    await forcePurgeAppCache();
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#122A24] text-white p-5 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 font-bold shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white">{APP_INFO.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                System Diagnostics &amp; Build Verification Center
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border-none z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-700 font-sans">
          {/* Primary Build Highlight Card */}
          <div className="p-4 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2D5A4E]">
                CURRENT LOADED BUILD
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-mono font-bold text-xs shadow-2xs">
                #{APP_INFO.buildNumber}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-2xl text-[#122A24]">
                v{APP_INFO.version}
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-800">
                ({APP_INFO.releaseTag})
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">
              Released: <strong>{APP_INFO.releaseDate}</strong> • Engine: {APP_INFO.engine}
            </p>
          </div>

          {/* Detailed Diagnostic Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Release Channel</div>
              <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Production Live</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Cloud Database</div>
              <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-700" />
                <span>MongoDB Atlas</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">PWA Service Worker</div>
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" />
                <span>v8-106 (Active)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Deployment Host</div>
              <div className="font-bold text-[#122A24]">giterp.vercel.app</div>
            </div>
          </div>

          {/* Live Server Check Box */}
          {serverInfo && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-mono space-y-1">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Live Server Response from /api/app-info:</span>
              </div>
              <div className="text-[11px] text-emerald-900">
                Server Build: <strong>#{serverInfo.buildNumber}</strong> ({serverInfo.releaseTag})
              </div>
              <div className="text-[10px] text-emerald-700">
                Server Timestamp: {new Date(serverInfo.serverTime || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleCheckServerBuild}
              disabled={checking}
              className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#122A24] font-bold text-xs font-mono flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Querying...' : 'Verify Cloud Build'}</span>
            </button>

            <button
              onClick={handleForceUpdate}
              disabled={purging}
              className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 border-none cursor-pointer transition-colors shadow-xs"
              title="Clears Service Worker & Cache, then reloads fresh from Vercel"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${purging ? 'animate-spin' : ''}`} />
              <span>{purging ? 'Purging Cache...' : '⚡ Force Cache Purge'}</span>
            </button>
          </div>

          <p className="text-[10.5px] text-slate-400 text-center font-mono">
            Clicking &quot;Force Cache Purge&quot; immediately wipes old PWA caches and downloads the latest release from Vercel.
          </p>
        </div>
      </div>
    </div>
  );
}
