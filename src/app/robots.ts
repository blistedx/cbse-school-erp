import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://giterp.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/faq',
          '/privacy',
          '/terms',
          '/request-demo'
        ],
        disallow: [
          '/api/',
          '/app/',
          '/agency/',
          '/mobile/',
          '/login'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
