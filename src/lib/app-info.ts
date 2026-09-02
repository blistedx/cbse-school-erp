/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */

export const APP_INFO = {
  name: 'Giterp CBSE School ERP',
  shortName: 'Giterp ERP',
  version: '1.2.0',
  buildNumber: '2026.09.02.105',
  buildTimestamp: '2026-09-02T16:32:00+05:30',
  releaseDate: '02 Sep 2026',
  releaseTag: 'v1.2.0-prod.105',
  engine: 'Next.js 16.3 (Turbopack) • MongoDB Atlas • PWA Web Push',
  status: 'LIVE_PRODUCTION'
};

export function getAppBuildString(): string {
  return `Build #${APP_INFO.buildNumber} (${APP_INFO.releaseTag})`;
}
