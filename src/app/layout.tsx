/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWAProvider from '@/components/pwa-provider';
import { Analytics } from '@vercel/analytics/react';
import CookieConsent from '@/components/ui/cookie-consent';
import { organizationSchema, softwareApplicationSchema } from '@/lib/json-ld';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://giterp.com'),
  title: {
    default: 'Giterp — Multi-School Enterprise CBSE ERP Platform',
    template: '%s | Giterp ERP'
  },
  description: 'Giterp runs attendance, fees, timetables, examinations, transport GPS and CBSE report cards for schools — all on one unified multi-tenant platform.',
  keywords: 'Giterp, School ERP, CBSE school software, student information system, fees management, school management, APAAR ID, UDISE+',
  applicationName: 'Giterp ERP',
  authors: [{ name: 'Giterp Technologies' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://giterp.com',
    siteName: 'Giterp CBSE School ERP',
    title: 'Giterp — Multi-School Enterprise CBSE ERP Platform',
    description: 'High-performance multi-tenant CBSE School ERP suite. Automate attendance roll calls, term fee invoicing, 9-point grading report cards, and transport GPS tracking in one unified register.',
    images: [
      {
        url: '/giterp-logo.png',
        width: 800,
        height: 800,
        alt: 'Giterp CBSE School ERP Official Emblem'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giterp — Multi-School Enterprise CBSE ERP Platform',
    description: 'Automate attendance roll calls, term fees, 9-point grading report cards, and transport GPS tracking for CBSE schools.',
    images: ['/giterp-logo.png']
  },
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
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

        {/* Structured Schema (Schema.org JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, softwareApplicationSchema])
          }}
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-[#122A24] focus:text-white focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-semibold text-xs transition-all no-underline"
        >
          Skip to main content
        </a>
        <PWAProvider>
          {children}
        </PWAProvider>
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  );
}

