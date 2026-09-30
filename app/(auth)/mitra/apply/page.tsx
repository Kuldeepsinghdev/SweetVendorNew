import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { getCatalogData } from '@/lib/data/catalog';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MitraApplyForm } from './MitraApplyForm';
import { getLocale } from '@/lib/locale/server';

/**
 * Public Mitra registration page (Server Component).
 *
 * Loads the city list and active distribution centers from the DB and renders
 * the client-side application form.
 * Already-signed-in users are redirected to their portal.
 */
export default async function MitraApplyPage() {
  const locale = await getLocale();
  const hi = locale === 'hi';

  const session = await getCustomerSession();
  if (session) {
    redirect('/mitra/portal');
  }

  const { cities, distributionCenters } = await getCatalogData();
  const activeDistributionCenters = distributionCenters.filter((dc) => dc.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl space-y-6">
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

          <MitraApplyForm
            locale={locale}
            cities={cities}
            distributionCenters={activeDistributionCenters}
          />
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
