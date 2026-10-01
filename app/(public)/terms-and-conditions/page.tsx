import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale/server';
import { TermsContent } from '@/components/legal/TermsContent';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Booking and distribution terms, policies, and conditions for Sahakar Bharati sweets.',
};

export default async function TermsAndConditionsPage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-6">
        {locale === 'hi' ? 'नियम एवं शर्तें' : 'Terms & Conditions'}
      </h1>
      <TermsContent locale={locale} />
    </div>
  );
}
