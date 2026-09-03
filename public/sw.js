/*! Giterp Multi-School Enterprise ERP Core v1.2.0 (Build 2026.09.03.114) */
const CACHE_NAME = 'giterp-core-v8-114';
const API_CACHE_NAME = 'giterp-api-session-v8-114';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/app',
  '/login',
  '/agency',
  '/manifest.webmanifest',
  '/offline.html',
  '/icon.png',
  '/apple-icon.png',
  '/giterp-logo.png',
  '/giterp-192.png',
  '/giterp-512.png',
  '/sounds/bell-chime.mp3'
];

// Install: Cache critical core assets and force activation immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-cache non-fatal warning:', err);
      });
    })
  );
});

// Activate: Claim clients and clean up old obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
            .map((key) => {
              console.log('[PWA SW] Purging old cache:', key);
              return caches.delete(key);
            })
        );
      })
    ])
  );
});

// Fetch: Smart network-first for pages and APIs, fast cache-first for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Next.js RSC (React Server Component) Flight Requests — Always pass directly to Network!
  // Prevents Next.js client router from receiving cached HTML and crashing with "This page couldn't load"
  if (
    request.headers.get('RSC') === '1' ||
    request.headers.has('Next-Router-State-Tree') ||
    request.headers.has('Next-Router-Prefetch') ||
    url.searchParams.has('_rsc')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Strategy A: API Routes (Strict Live Network First - Never serve stale cache when online!)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
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
      fetch(request)
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
          if (offlineFallback) return offlineFallback;
          const rootFallback = (await caches.match('/app')) || (await caches.match('/login')) || (await caches.match('/'));
          return rootFallback || new Response('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="3"><title>Loading...</title></head><body style="background:#122A24;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>Reconnecting to ERP...</h2><p>Please wait a moment.</p></div></body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
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

