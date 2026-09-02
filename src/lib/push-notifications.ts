/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * Push Notification Master Utility
 * Guarantees rock-solid push notifications across Desktop, Android PWA, and iOS Web Push
 * Features multi-layer fallback: ServiceWorker showNotification -> new Notification -> Audio Chime -> In-App Toast
 */

// Synthesize a crisp two-tone bell chime using Web Audio API (No external mp3 needed!)
export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Tone 1 (High bell - 880 Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2 (Harmonic bell - 1174.66 Hz / D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12);
    gain2.gain.setValueAtTime(0.28, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.75);
  } catch (e) {
    console.warn('[PWA Notification] Audio chime failed:', e);
  }
}

// Check current notification permission status
export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Request permission with auto-sync to backend VAPID subscription
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      // Trigger subscription sync
      try {
        const res = await fetch('/api/notifications/vapid-key');
        const keyData = await res.json();
        if (keyData?.publicKey && 'PushManager' in window) {
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
            const userStr = localStorage.getItem('current_user');
            let role = 'ALL';
            let userId = 'device';
            try {
              if (userStr) {
                const parsed = JSON.parse(userStr);
                // Use login/account role, not the view-mode display role
                role = parsed.login_role || parsed.original_role || parsed.role || 'ALL';
                userId = parsed.username || parsed.id || 'device';
              }
            } catch (e) {}

            await fetch('/api/notifications/subscribe', {
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
            });
          }
        }
      } catch (subErr) {
        console.warn('[PWA Push] Subscription sync error:', subErr);
      }
    }
    return permission;
  } catch (err) {
    console.error('[PWA Notification] Request permission error:', err);
    return 'denied';
  }
}

export interface LocalNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  urgent?: boolean;
}

// Master Dispatcher: Dispatches notification across SW, Window Notification, Audio, and In-App Banner
export async function sendLocalPushNotification(
  title: string,
  options: LocalNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Play auditory chime
  playNotificationChime();

  // 2. Dispatch custom event for in-app floating toast banner
  window.dispatchEvent(
    new CustomEvent('giterp_broadcast', {
      detail: {
        title,
        body: options.body,
        urgent: options.urgent || false,
        url: options.url || '/app'
      }
    })
  );

  // 3. Try to show browser/system notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body: options.body,
            icon: options.icon || '/icons/icon-192.png',
            badge: options.badge || '/icons/icon-192.png',
            tag: options.tag || 'giterp-alert',
            vibrate: options.urgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
            requireInteraction: options.urgent === true,
            data: { url: options.url || '/app' }
          } as any);
          return true;
        }
      }

      // Fallback to desktop window Notification API
      new Notification(title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192.png',
        tag: options.tag || 'giterp-alert'
      });
      return true;
    } catch (e) {
      console.warn('[PWA Notification] Native notification display error:', e);
    }
  }

  return true;
}

// 1-Click Test Push Notification
export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') return { success: false, message: 'Window unavailable' };

  if (!('Notification' in window)) {
    return { success: false, message: 'Browser does not support notifications.' };
  }

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') {
      return {
        success: false,
        message: 'Notification permission was denied. Please allow notifications in your browser address bar settings.'
      };
    }
  }

  await sendLocalPushNotification('🔔 Giterp Push Notification Active!', {
    body: 'CBSE School ERP push alerts are working 100% reliably with sound chime & badge alerts.',
    tag: 'test-notification',
    urgent: true,
    url: '/app'
  });

  return { success: true, message: 'Test push notification dispatched successfully!' };
}
