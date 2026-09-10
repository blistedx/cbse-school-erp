import type { Metadata } from 'next';
import { createBreadcrumbSchema } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: 'Privacy Policy & DPDPA 2023 Compliance Charter',
  description: 'Official student data protection charter for Giterp CBSE School ERP. Compliant with India’s Digital Personal Data Protection Act (DPDPA 2023) and Section 9 minor protections.',
  alternates: {
    canonical: '/privacy'
  }
};

const breadcrumbs = createBreadcrumbSchema([
  { name: 'Home', url: 'https://giterp.com' },
  { name: 'Privacy Policy', url: 'https://giterp.com/privacy' }
]);

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
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
