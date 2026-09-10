import type { Metadata } from 'next';
import { createBreadcrumbSchema } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: 'Terms of Service & Institutional Licensing Agreement',
  description: 'Master SaaS subscription agreement and licensing terms for CBSE schools, educational trusts, teachers, and parents. Covers 100% data ownership and 99.9% uptime SLA.',
  alternates: {
    canonical: '/terms'
  }
};

const breadcrumbs = createBreadcrumbSchema([
  { name: 'Home', url: 'https://giterp.com' },
  { name: 'Terms of Service', url: 'https://giterp.com/terms' }
]);

export default function TermsLayout({ children }: { children: React.ReactNode }) {
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
