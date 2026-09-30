import { getCatalogData, pickActiveFestival } from '@/lib/data/catalog';
import { requireCustomerSession } from '@/lib/auth/guards';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FestivalBanner } from '@/components/FestivalBanner';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { CartProvider } from '@/components/cart/CartProvider';
import { getLocale } from '@/lib/locale/server';

/**
 * Protected home page — authenticated customer/mitra only.
 * Server Component that enforces session before rendering.
 */
export default async function HomePage() {
  const locale = await getLocale();
  
  // Ensure authenticated session (redirects to /login if not)
  const session = await requireCustomerSession();

  const [catalog] = await Promise.all([getCatalogData()]);
  const activeFestival = pickActiveFestival(catalog.festivals);

  const defaultCity =
    catalog.cities.find((c) => c.isActive) || catalog.cities[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      {/* Show authenticated user's name in header */}
      <SiteHeader customerName={session.name} />

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
            isMitra={session.role === 'mitra'}
          />
        </CartProvider>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
