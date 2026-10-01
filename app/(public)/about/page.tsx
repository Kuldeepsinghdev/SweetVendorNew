import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale/server';
import { AboutContent } from '@/components/legal/AboutContent';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Sahakar Bharati and our mission to provide pure, traditional sweets through cooperative principles.',
};

export default async function AboutPage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-6">
        {locale === 'hi' ? 'हमारे बारे में' : 'About Us'}
      </h1>
      <AboutContent locale={locale} />
    </div>
  );
}
