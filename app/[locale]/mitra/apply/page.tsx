import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/src/lib/locale';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { getCatalogData } from '@/lib/data/catalog';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MitraApplyForm } from './MitraApplyForm';

/**
 * Public Mitra registration page (Server Component).
 *
 * Loads the city list from the DB and renders the client-side application form.
 * Already-signed-in users are redirected to their portal.
 */
export default async function MitraApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getCustomerSession();
  if (session) {
    redirect(`/${locale}/mitra/portal`);
  }

  const { cities } = await getCatalogData();

  const hi = locale === 'hi';

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader locale={locale} />

      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl space-y-6">
          {/* Page heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-amber-900">
              {hi ? 'सहकार मित्र आवेदन' : 'Sahakar Mitra Application'}
            </h1>
            <p className="text-sm text-amber-800/70">
              {hi
                ? 'नीचे दिया गया फ़ॉर्म भरें और सहकार मित्र नेटवर्क का हिस्सा बनें।'
                : 'Fill out the form below to apply and join the Sahakar Mitra network.'}
            </p>
          </div>

          {/* Application Form */}
          <MitraApplyForm locale={locale} cities={cities} />
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
