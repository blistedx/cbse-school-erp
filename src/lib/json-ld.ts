/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Giterp CBSE School ERP',
  legalName: 'Giterp Technologies',
  url: 'https://giterp.com',
  logo: 'https://giterp.com/giterp-logo.png',
  image: 'https://giterp.com/giterp-logo.png',
  description:
    'Enterprise multi-school CBSE School ERP suite. Automate attendance roll calls, term fee invoicing, 9-point grading report cards, and transport GPS tracking.',
  email: 'support@giterp.com',
  sameAs: [
    'https://twitter.com/giterp',
    'https://linkedin.com/company/giterp'
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'support@giterp.com',
      contactType: 'Customer Support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi']
    }
  ]
};

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Giterp School ERP',
  operatingSystem: 'Web, iOS, Android, Windows, macOS (Progressive Web App)',
  applicationCategory: 'EducationalApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    description: 'Free historical data migration and 0% payment commission fee processing'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '142',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Automated morning roll call attendance & SMS absent alerts',
    'CBSE 9-point grading and broadsheet report cards',
    'Zero commission term fee invoicing and instant receipts',
    'Live school bus transport GPS tracking',
    'Offline PWA resilience with local IndexedDB sync',
    'DPDPA 2023 compliant student data protection'
  ]
};

export const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How fast can our school get started with Giterp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most schools go live in under 48 hours. Our engineering team handles the complete setup of your academic classes, fee structures, and staff accounts at zero onboarding fee.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can we import our existing student and fee data from Excel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, 100%. We provide free data migration. Simply share your existing Excel or CSV rosters, and our automated migration pipeline imports your student demographic records, parent contacts, pending fee arrears, and class sections.'
      }
    },
    {
      '@type': 'Question',
      name: 'Does Giterp comply with the latest CBSE examination and report card guidelines?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Giterp natively implements CBSE 9-point grading scales (A1 to E), co-scholastic evaluations (5-point / 3-point scale), term-wise weightages, automated broadsheets, and board-format report card PDF generation.'
      }
    },
    {
      '@type': 'Question',
      name: 'Are APAAR ID and UDISE+ student numbers supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every student profile includes dedicated, validated fields for 12-digit APAAR IDs, PEN (Permanent Education Number), UDISE+ school codes, and Aadhaar verification status.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do online fee collections work, and what are the transaction charges?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Parents can pay school term fees directly via UPI, NetBanking, debit or credit cards through integrated RBI-approved payment gateways (Razorpay, PayU, Cashfree). Giterp charges 0% platform commission on collections.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can schools issue automated fee receipt PDFs and SMS reminders for due dates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The moment a fee transaction settles, an official digital receipt with school crest, counter-foil, and unique transaction ID is generated. Automated SMS and WhatsApp reminders can be broadcast to parents with upcoming term dues.'
      }
    },
    {
      '@type': 'Question',
      name: 'How is student data protected under India\'s Digital Personal Data Protection Act (DPDPA 2023)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Student privacy is built into our core architecture. In compliance with Section 9 of the DPDPA 2023, we enforce zero behavioural profiling, zero targeted advertisements, and zero commercial resale of child records.'
      }
    },
    {
      '@type': 'Question',
      name: 'Where is school data stored, and how are backups handled?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All data is encrypted with AES-256 at rest and TLS 1.3 in transit. Daily automated Point-in-Time Recovery (PITR) backups are maintained across geographically distributed enterprise cloud clusters, ensuring instant restore capabilities and 99.9% availability.'
      }
    },
    {
      '@type': 'Question',
      name: 'What happens if school Wi-Fi or internet goes down during morning roll call?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your morning assembly will not stop. Giterp is engineered as an offline-first Progressive Web App (PWA). Teachers can continue recording daily attendance and marks even in network dead-zones. The app securely buffers records locally in IndexedDB and automatically syncs with the cloud database the moment connection is restored.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is Giterp available on mobile phones and tablets?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Giterp installs directly to the home screen of Android phones, iPhones, iPads, and Windows/Mac desktops as an installable PWA with automatic background updates.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can an educational trust or society manage multiple school campuses together?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Giterp was architected specifically for multi-school networks. Society management and trust directors can view aggregated overview metrics across all branch campuses through the centralized Agency Hub.'
      }
    }
  ]
};

export function createBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}
