import { redirect } from 'next/navigation';
import { requireMitraOrThrow } from '@/lib/auth/mitraGuards';
import { getCatalogData } from '@/lib/data/catalog';
import { getLocale } from '@/lib/locale/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { CartProvider } from '@/components/cart/CartProvider';

/**
 * Mitra Catalog Page (Server Component)
 *
 * - Requires authenticated Mitra session
 * - Lets Mitras choose a city and sale center before browsing sweets
 * - Hides public-only center directory and portal links
 */
export default async function MitraCatalogPage() {
  const locale = await getLocale();

  // Verify Mitra is authenticated.
  let session;
  try {
    session = await requireMitraOrThrow();
  } catch {
    redirect('/login?next=/mitra/catalog');
  }

  const catalog = await getCatalogData();

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader customerName={session.name} isMitra />

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
            isMitra
            showCenterDirectory={false}
            showRolePortals={false}
          />
        </CartProvider>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
