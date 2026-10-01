'use client';

/**
 * Footer policy links + navigation.
 *
 * The footer itself is a Server Component; only the policy section needs interactivity.
 * Links now navigate to public pages instead of opening modals.
 */

import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import type { Locale } from '@/src/lib/locale';

type InfoModalType = 'about' | 'contact' | 'privacy' | 'terms' | 'refund' | 'purity' | 'faqs' | null;

interface PolicyLink {
  key: Exclude<InfoModalType, null>;
  label: string;
  href: string;
}

export function FooterPolicyModals({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  const links: PolicyLink[] = [
    { key: 'about', label: hi ? 'हमारे बारे में (About Us)' : 'About Us', href: '/about' },
    { key: 'purity', label: hi ? 'शुद्धता व FSSAI मानक' : 'Purity & FSSAI Standards', href: '/purity-fssai-standards' },
    { key: 'privacy', label: hi ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy', href: '/privacy-policy' },
    { key: 'terms', label: hi ? 'नियम एवं शर्तें (Terms of Service)' : 'Terms & Conditions', href: '/terms-and-conditions' },
    { key: 'refund', label: hi ? 'रिफंड व रद्दीकरण नीति' : 'Refund & Cancellation Policy', href: '/refund-cancellation-policy' },
    { key: 'faqs', label: hi ? 'अक्सर पूछे जाने वाले सवाल (FAQs)' : 'FAQs', href: '/faq' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/60 pb-2">
        <FileText className="w-4 h-4 text-amber-400" />
        <span>{hi ? 'महत्वपूर्ण पृष्ठ व नीतियां' : 'Policies & Pages'}</span>
      </h4>
      <ul className="space-y-2 text-xs">
        {links.map((l) => (
          <li key={l.key}>
            <Link
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="justify-start hover:text-amber-300 transition-colors flex items-center gap-1.5 h-auto p-0 text-white no-underline"
            >
              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
              <span>{l.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
