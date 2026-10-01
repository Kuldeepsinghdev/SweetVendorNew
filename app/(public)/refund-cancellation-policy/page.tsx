import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale/server';
import { RefundCancellationContent } from '@/components/legal/RefundCancellationContent';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Our refund and cancellation policies for sweet bookings and orders.',
};

export default async function RefundCancellationPage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-6">
        {locale === 'hi' ? 'रिफंड व रद्दीकरण नीति' : 'Refund & Cancellation Policy'}
      </h1>
      <RefundCancellationContent locale={locale} />
    </div>
  );
}
