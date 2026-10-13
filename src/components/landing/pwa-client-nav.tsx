/*! Giterp Multi-School Enterprise ERP Core v1.2.1 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PwaClientNav() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running inside installed standalone PWA app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    try {
      const rawUser = localStorage.getItem('current_user');
      const token = localStorage.getItem('erp_session_token');

      if (rawUser && token) {
        const parsed = JSON.parse(rawUser);
        const schoolCode = parsed.school_code || parsed.school_id || 'DPS2026';
        const userRole = (parsed.role || parsed.login_role || '').toUpperCase();

        if (userRole === 'TEACHER') {
          router.replace(`/teacher?school=${encodeURIComponent(schoolCode)}`);
        } else if (userRole === 'PRINCIPAL') {
          router.replace(`/principal?school=${encodeURIComponent(schoolCode)}`);
        } else {
          router.replace(`/app?school=${encodeURIComponent(schoolCode)}`);
        }
      } else if (isStandalone) {
        // In standalone PWA without existing session, take user directly to Login
        router.replace('/login');
      }
    } catch (_) {}
  }, [router]);

  return null;
}
