import { notFound } from 'next/navigation';
import { isLocale } from '@/src/lib/locale';
import { getCatalogData, pickActiveFestival } from '@/lib/data/catalog';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FestivalBanner } from '@/components/FestivalBanner';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { CartProvider } from '@/components/cart/CartProvider';

/**
 * Public landing + catalog — a Server Component.
 *
 * This replaces the client-only SPA mount (AppClient → src/App.tsx) for the
 * public home page. All catalog data is read directly from the DB via Drizzle
 * here on the server (see lib/data/catalog.ts), then handed to client islands
 * as plain props — no client `fetch('/api/*')` bootstrap. The interactive
 * catalog UI (pickers, search, product grid) lives in the CatalogBrowser
 * client island; the shell, footer, and festival banner render on the server.
 */
export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [catalog, customer] = await Promise.all([getCatalogData(), getCustomerSession()]);
  const activeFestival = pickActiveFestival(catalog.festivals);

  // Resolve a default city (first active, else first) to label the banner.
  const defaultCity =
    catalog.cities.find((c) => c.isActive) || catalog.cities[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader locale={locale} customerName={customer?.name ?? null} />

      <FestivalBanner
        locale={locale}
        festival={activeFestival}
        cityNameHi={defaultCity?.nameHi}
        cityNameEn={defaultCity?.nameEn}
        isBookingWindowOpen={catalog.isBookingWindowOpen}
      />

      <main className="flex-1 pt-4 sm:pt-6">
        <CartProvider>
          <CatalogBrowser
            locale={locale}
            sweets={catalog.sweets}
            cities={catalog.cities}
            saleCenters={catalog.saleCenters}
            distributionCenters={catalog.distributionCenters}
            saleCenterSweets={catalog.saleCenterSweets}
            isBookingWindowOpen={catalog.isBookingWindowOpen}
            mitraHref={`/${locale}/mitra`}
            adminHref={`/${locale}/admin`}
            checkoutHref={`/${locale}/checkout`}
            loginHref={`/${locale}/login`}
            isSignedIn={!!customer}
          />
        </CartProvider>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
