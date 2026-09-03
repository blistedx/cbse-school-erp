/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */

export const APP_INFO = {
  name: 'Giterp CBSE School ERP',
  shortName: 'Giterp ERP',
  version: '1.2.0',
  buildNumber: '2026.09.03.112',
  buildTimestamp: '2026-09-03T08:48:00+05:30',
  releaseDate: '03 Sep 2026',
  releaseTag: 'v1.2.0-prod.112',
  engine: 'Next.js 16.3 (Turbopack) • MongoDB Atlas • PWA Web Push',
  status: 'LIVE_PRODUCTION'
};

export function getAppBuildString(): string {
  return `Build #${APP_INFO.buildNumber} (${APP_INFO.releaseTag})`;
}

export async function forcePurgeAppCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }
    window.location.reload();
  } catch (e) {
    window.location.reload();
  }
}
