import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale/server';
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Sahakar Bharati collects, uses, and protects your personal information.',
};

export default async function PrivacyPolicyPage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-6">
        {locale === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy'}
      </h1>
      <PrivacyPolicyContent locale={locale} />
    </div>
  );
}
