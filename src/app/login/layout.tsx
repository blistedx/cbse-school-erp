import type { Metadata } from 'next';
import { createBreadcrumbSchema } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: 'School Sign In & Academic Portal Login',
  description: 'Secure, encrypted sign-in desk for CBSE school administrators, teachers, accountants, parents, and students.',
  alternates: {
    canonical: '/login'
  }
};

const breadcrumbs = createBreadcrumbSchema([
  { name: 'Home', url: 'https://giterp.com' },
  { name: 'School Login', url: 'https://giterp.com/login' }
]);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
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
