/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWAProvider from '@/components/pwa-provider';

export const metadata: Metadata = {
  title: 'Giterp — School ERP Platform',
  description: 'Giterp runs attendance, fees, timetables, examinations, transport GPS and CBSE report cards for schools — all on one unified platform.',
  keywords: 'Giterp, School ERP, CBSE school software, student information system, fees management, school management',
  applicationName: 'Giterp ERP',
  authors: [{ name: 'Giterp Technologies' }],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Giterp',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#232e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* iOS Safari Home Screen Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        
        {/* Android / PWA Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="shortcut icon" href="/icons/icon-192.png" />
        
        {/* Mobile PWA Metas */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Giterp ERP" />
        <meta name="application-name" content="Giterp ERP" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#122A24" />
        <meta name="msapplication-TileColor" content="#122A24" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}

