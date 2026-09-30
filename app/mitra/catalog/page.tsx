import { redirect } from 'next/navigation';
import { requireMitraOrThrow } from '@/lib/auth/mitraGuards';
import { getActiveSweetsForCatalog } from '@/lib/data/sweets';
import { getLocale } from '@/lib/locale/server';
import { CatalogBrowser } from '@/components/mitra/CatalogBrowser';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

/**
 * Mitra Catalog Page (Server Component)
 *
 * - Requires authenticated Mitra session
 * - Displays active sweets for the Mitra's sale center
 * - Allows adding items to cart (client-side via CartProvider)
 */
export default async function MitraCatalogPage() {
  const locale = await getLocale();
  const hi = locale === 'hi';

  // Verify Mitra is authenticated
  let session;
  try {
    session = await requireMitraOrThrow();
  } catch {
    redirect('/login');
  }

  // For now, use the Mitra's assigned sale center from their session
  // In a real app, this might be a query parameter or from their profile
  const saleCenterId = session.centerId || 'sc_default';

  // Fetch active sweets
  const sweetsResult = await getActiveSweetsForCatalog(saleCenterId);

  if (!sweetsResult.ok || sweetsResult.data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-slate-900">
              {hi ? 'कोई मिठाई उपलब्ध नहीं' : 'No Sweets Available'}
            </h1>
            <p className="text-slate-600">
              {hi
                ? 'इस समय इस दुकान में कोई मिठाई उपलब्ध नहीं है।'
                : 'No sweets are currently available at this shop.'}
            </p>
          </div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader />

      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-amber-900 mb-2">
              {hi ? 'मिठाइयाँ चुनें' : 'Select Sweets'}
            </h1>
            <p className="text-amber-800/70">
              {hi
                ? `${sweetsResult.data.length} प्रकार की मिठाइयाँ उपलब्ध`
                : `${sweetsResult.data.length} sweets available`}
            </p>
          </div>

          {/* Catalog Browser */}
          <CatalogBrowser
            sweets={sweetsResult.data}
            saleCenterId={saleCenterId}
            locale={locale}
          />
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
