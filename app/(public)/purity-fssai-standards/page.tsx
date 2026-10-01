import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale/server';
import { PurityFssaiContent } from '@/components/legal/PurityFssaiContent';

export const metadata: Metadata = {
  title: 'Purity & FSSAI Standards',
  description: 'Our commitment to quality, hygiene, and food safety standards in the preparation of all sweets.',
};

export default async function PurityFssaiPage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-6">
        {locale === 'hi' ? 'शुद्धता व FSSAI मानक' : 'Purity & FSSAI Standards'}
      </h1>
      <PurityFssaiContent locale={locale} />
    </div>
  );
}
