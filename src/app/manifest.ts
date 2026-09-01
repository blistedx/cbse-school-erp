/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Giterp — School ERP Platform',
    short_name: 'Giterp ERP',
    description: 'Enterprise CBSE School ERP for attendance, fees, exams, transport GPS, homework and school management.',
    start_url: '/app',
    id: '/app',
    display: 'standalone',
    background_color: '#122A24',
    theme_color: '#122A24',
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['education', 'productivity', 'business'],
    icons: [
      {
        src: '/giterp-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/giterp-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/giterp-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/giterp-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'School Dashboard',
        short_name: 'Dashboard',
        description: 'Open the School Management Dashboard',
        url: '/app',
        icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
      },
      {
        name: 'Agency Hub',
        short_name: 'Agency',
        description: 'Super Admin Multi-School Hub',
        url: '/agency',
        icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
      },
      {
        name: 'Login',
        short_name: 'Login',
        description: 'Sign into school portal',
        url: '/login',
        icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
      },
    ],
  };
}
