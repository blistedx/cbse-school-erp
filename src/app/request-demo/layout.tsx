import type { Metadata } from 'next';
import { createBreadcrumbSchema } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: 'Request a Free 15-Minute Live School Demo',
  description: 'Book a personalized walkthrough of Giterp CBSE School ERP. Discover automated roll call, fee collections, report card generation, and 48-hour onboarding.',
  alternates: {
    canonical: '/request-demo'
  }
};

const breadcrumbs = createBreadcrumbSchema([
  { name: 'Home', url: 'https://giterp.com' },
  { name: 'Request Demo', url: 'https://giterp.com/request-demo' }
]);

export default function RequestDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
