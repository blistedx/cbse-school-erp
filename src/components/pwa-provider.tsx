/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
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

      // 2. Register Service Worker with 100% Automatic Zero-Touch Updates
      if ('serviceWorker' in navigator) {
        let refreshing = false;

        // Auto-reload when new service worker takes over
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
            setSwRegistration(reg);

            // Force check for updates immediately on startup
            reg.update().catch(() => {});

            // Auto-poll for new deployments every 30 seconds
            const autoUpdateTimer = setInterval(() => {
              reg.update().catch(() => {});
            }, 30000);

            // Check updates whenever user returns to tab / window focus
            const handleVisibilityChange = () => {
              if (document.visibilityState === 'visible') {
                reg.update().catch(() => {});
              }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('focus', handleVisibilityChange);

            // Detect new updates and immediately instruct SW to skip waiting
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      // New content available, automatically activate and refresh
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                  }
                });
              }
            });
            // Auto-sync Web Push subscription if permission is already granted
            if ('PushManager' in window && 'Notification' in window && Notification.permission === 'granted') {
              fetch('/api/notifications/vapid-key')
                .then(res => res.json())
                .then(async (keyData) => {
                  if (keyData?.publicKey) {
                    const clean = keyData.publicKey.trim();
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

                    if (sub) {
                      const user = localStorage.getItem('current_user');
                      let role = 'ALL';
                      let userId = 'device';
                      try {
                        if (user) {
                          const parsed = JSON.parse(user);
                          role = parsed.role || 'ALL';
                          userId = parsed.username || parsed.id || 'device';
                        }
                      } catch (e) {}

                      fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          endpoint: sub.endpoint,
                          keys: {
                            p256dh: sub.toJSON().keys?.p256dh,
                            auth: sub.toJSON().keys?.auth
                          },
                          role,
                          userId
                        })
                      }).catch(() => {});
                    }
                  }
                })
                .catch(() => {});
            }
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });

        // Listen for messages from active SW
        const handleSwMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          }
          if (event.data && event.data.type === 'NEW_BROADCAST') {
            window.dispatchEvent(new CustomEvent('giterp_broadcast', { detail: event.data.payload }));
          }
        };
        navigator.serviceWorker.addEventListener('message', handleSwMessage);
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
            <p className="text-xs text-slate-300">A new version of Giterp is ready.</p>
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
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-md bg-[#122A24] flex items-center justify-center p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/giterp-logo.png" alt="Giterp Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-display font-semibold text-white truncate">Install Giterp App</h4>
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
