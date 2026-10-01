import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale/server';
import { FaqContent } from '@/components/legal/FaqContent';

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Frequently asked questions about Sahakar Bharati bookings, delivery, and services.',
};

export default async function FaqPage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-6">
        {locale === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}
      </h1>
      <FaqContent locale={locale} />
    </div>
  );
}
