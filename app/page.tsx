import { getCatalogData, pickActiveFestival } from '@/lib/data/catalog';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FestivalBanner } from '@/components/FestivalBanner';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { CartProvider } from '@/components/cart/CartProvider';
import { getLocale } from '@/lib/locale/server';

/**
 * Public landing + catalog — Server Component.
 *
 * The locale is no longer in the URL; it comes from the `lang` cookie via
 * the middleware x-locale header. The URL is always just `/`.
 */
export default async function HomePage() {
  const locale = await getLocale();

  const [catalog, customer] = await Promise.all([getCatalogData(), getCustomerSession()]);
  const activeFestival = pickActiveFestival(catalog.festivals);

  const defaultCity =
    catalog.cities.find((c) => c.isActive) || catalog.cities[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader customerName={customer?.name ?? null} />

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
            mitraHref="/mitra"
            adminHref="/admin"
            checkoutHref="/checkout"
            loginHref="/login"
            isSignedIn={!!customer}
            isMitra={customer?.role === 'mitra'}
          />
        </CartProvider>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
