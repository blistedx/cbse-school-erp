'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Download, X, RefreshCw } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOfflineAlert, setShowOfflineAlert] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // 1. Check initial online state
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setShowOfflineAlert(true);
      }

      const handleOnline = () => {
        setIsOnline(true);
        setShowOfflineAlert(false);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setShowOfflineAlert(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // 2. Register Service Worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
            setSwRegistration(reg);

            // Detect updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      }

      // 3. Listen for PWA Install Prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        const dismissed = sessionStorage.getItem('pwa_install_dismissed');
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response to install:', outcome);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  const handleUpdateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return (
    <>
      {children}

      {/* Floating Offline Notification Banner */}
      {showOfflineAlert && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[var(--board-1)] text-white border border-white/20 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 text-xs sm:text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-[var(--red-pen)] animate-pulse" />
          <WifiOff className="w-4 h-4 text-rose-300 shrink-0" />
          <span>You are currently offline. Running cached register version.</span>
          <button
            onClick={() => setShowOfflineAlert(false)}
            className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* App Update Available Toast */}
      {updateAvailable && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-[var(--board-1)] text-white border border-white/20 backdrop-blur-md p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-5 duration-300 text-sm max-w-sm">
          <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0 animate-spin" />
          <div className="flex-1">
            <p className="font-display font-semibold text-white">App Update Available</p>
            <p className="text-xs text-slate-300">A new version of EduGit is ready.</p>
          </div>
          <button
            onClick={handleUpdateApp}
            className="bg-[var(--red-pen)] hover:bg-[#b03a24] text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Update
          </button>
        </div>
      )}

      {/* Install PWA Prompt Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-3.5 bg-[var(--board-1)] text-white border border-white/20 backdrop-blur-xl p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-md bg-[#232e1a] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="EduGit Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-display font-semibold text-white truncate">Install EduGit App</h4>
            <p className="text-[11px] text-slate-300 line-clamp-1">Install to your home screen or desktop for fast offline access.</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-[var(--red-pen)] hover:bg-[#b03a24] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer border-none"
            >
              Install
            </button>
            <button
              onClick={handleDismissInstall}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
