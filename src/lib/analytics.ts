/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { track } from '@vercel/analytics';

export type AnalyticsEvent =
  | 'demo_request_click'
  | 'demo_fast_track_submit'
  | 'demo_form_submitted'
  | 'faq_searched'
  | 'faq_item_opened'
  | 'print_policy_pdf'
  | 'school_login_click'
  | 'dpa_request_click';

/**
 * Privacy-preserving event tracker using Vercel Web Analytics.
 * Stores zero cookies and zero student/minor personal information.
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>) {
  try {
    if (typeof window !== 'undefined') {
      // Check user consent preference
      const consentStr = localStorage.getItem('giterp_cookie_consent_v1');
      if (consentStr) {
        try {
          const consent = JSON.parse(consentStr);
          if (consent.analytics === false) {
            // User opted out of non-essential performance telemetry
            return;
          }
        } catch (_) {}
      }
      track(event, properties);
    }
  } catch (_) {
    // Graceful fallback when running offline or in non-production environments
  }
}
