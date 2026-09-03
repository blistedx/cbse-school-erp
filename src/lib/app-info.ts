/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */

export const APP_INFO = {
  name: 'Giterp CBSE School ERP',
  shortName: 'Giterp ERP',
  version: '1.2.0',
  buildNumber: '2026.09.03.111',
  buildTimestamp: '2026-09-03T08:42:00+05:30',
  releaseDate: '03 Sep 2026',
  releaseTag: 'v1.2.0-prod.111',
  engine: 'Next.js 16.3 (Turbopack) • MongoDB Atlas • PWA Web Push',
  status: 'LIVE_PRODUCTION'
};

export function getAppBuildString(): string {
  return `Build #${APP_INFO.buildNumber} (${APP_INFO.releaseTag})`;
}

export async function forcePurgeAppCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    sessionStorage.clear();
    window.location.reload();
  } catch (e) {
    window.location.reload();
  }
}
