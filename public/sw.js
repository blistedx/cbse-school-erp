/*! Giterp Multi-School Enterprise ERP Core v1.2.0 (Build 2026.09.02.106) */
const CACHE_NAME = 'giterp-core-v8-108';
const API_CACHE_NAME = 'giterp-api-session-v8-108';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/app',
  '/login',
  '/agency',
  '/offline.html',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/manifest.json',
  '/manifest.webmanifest',
];

// Install Event: Precache essential assets and immediately take over
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Precache warning:', err);
      });
    })
  );
});

// Activate Event: Clear outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => {
            console.log('[PWA SW] Removing old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim()).then(() => {
      // Notify all open tabs/windows to reload or use fresh cache
      return self.clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
        });
      });
    })
  );
});

// Fetch Event: Strictly Network-First for API/DB data
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Strategy A: API Routes (Strict Live Network First - Never serve stale cache when online!)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async (error) => {
          console.warn('[PWA SW] Network failed for API, falling back to last session cache:', url.pathname);
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          return new Response(
            JSON.stringify({ success: false, error: 'Offline Mode: No network connection and no previous session cached', offline: true }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json', 'X-Offline': 'true' }
            }
          );
        })
    );
    return;
  }

  // Strategy B: HTML Page Navigations (Strict Live Network First - always fresh from server when online)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineFallback = await caches.match(OFFLINE_URL);
          return offlineFallback || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // Strategy C: Static assets (_next/static, fonts, icons, images, css)
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Listen for message events (e.g. skipWaiting or triggerNotification from client)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'Giterp School ERP', {
      body: options?.body || 'New institutional update.',
      icon: options?.icon || '/icons/icon-192.png',
      badge: options?.badge || '/icons/icon-192.png',
      tag: options?.tag || 'school-alert',
      vibrate: options?.urgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
      requireInteraction: options?.urgent === true,
      data: options?.data || { url: '/app' }
    });
  }
});

// ═════════════════════════════════════════════════════════════════════
// WEB PUSH NOTIFICATION LISTENERS (PWA & BROWSERS)
// ═════════════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  // Default payload — always show something even if the push data is missing/malformed
  let data = {
    title: 'School ERP Notification',
    body: 'You have a new update from School Administration.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    urgent: false,
    tag: 'school-alert',
    data: { url: '/app' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      // Fallback: treat push payload as plain text body
      try { data.body = event.data.text() || data.body; } catch (_) {}
    }
  }

  const notificationOptions = {
    body: data.body || 'New announcement received.',
    icon: data.icon || '/icons/icon-192.png',
    // PNG badge for Android notification tray — SVG not supported on mobile
    badge: '/icons/icon-192.png',
    vibrate: data.urgent ? [300, 100, 300, 100, 300, 100, 300] : [200, 100, 200],
    data: data.data || { url: '/app' },
    tag: data.tag || 'school-alert',
    renotify: true,
    requireInteraction: data.urgent === true,
    silent: false
    // NOTE: 'actions' intentionally omitted — iOS Safari (WebKit) does not support
    // notification actions and silently drops the notification on some versions.
    // The notificationclick handler still handles open/dismiss via data.url.
  };

  event.waitUntil(
    Promise.all([
      // Show the OS-level notification
      self.registration.showNotification(data.title || 'Giterp School ERP', notificationOptions),
      // Forward payload to all open app tabs in real time (in-app toast)
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NEW_BROADCAST',
            payload: data
          });
        });
      })
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/app') && 'focus' in client) {
          if (client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

