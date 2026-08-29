import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EduGit — Multi-School ERP Platform',
    short_name: 'EduGit ERP',
    description: 'Enterprise School ERP for attendance, fees, exams, timetables, and multi-school management.',
    start_url: '/app',
    id: '/app',
    display: 'standalone',
    background_color: '#232e1a',
    theme_color: '#232e1a',
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['education', 'productivity', 'business'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
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
