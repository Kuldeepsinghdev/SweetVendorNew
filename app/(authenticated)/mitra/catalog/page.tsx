import { redirect } from 'next/navigation';
import { requireMitraOrThrow } from '@/lib/auth/mitraGuards';
import { getActiveSweetsForCatalog } from '@/lib/data/sweets';
import { getLocale } from '@/lib/locale/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CachedImage } from '@/components/CachedImage';

/**
 * Mitra Catalog Page (Server Component)
 *
 * - Requires authenticated Mitra session
 * - Displays active sweets for the Mitra's sale center
 * - Shows basic sweet information (name, variants, price)
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

          {/* Sweets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sweetsResult.data.map((sweet) => (
              <div key={sweet.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {sweet.imageUrl && (
                  <div className="w-full h-48 bg-slate-100 overflow-hidden">
                    <CachedImage
                      src={sweet.imageUrl}
                      alt={hi ? sweet.nameHi : sweet.nameEn}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-slate-900">
                    {hi ? sweet.nameHi : sweet.nameEn}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {hi ? sweet.descriptionHi : sweet.descriptionEn}
                  </p>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-amber-900">
                      ₹{sweet.pricePerKg}
                    </span>
                    <span className="text-sm text-slate-500">
                      {hi ? 'प्रति किग्रा' : 'per kg'}
                    </span>
                  </div>
                  {sweet.variants && sweet.variants.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {hi ? 'वेरिएंट' : 'Variants'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sweet.variants.map((variant, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-amber-50 text-amber-900 text-xs rounded border border-amber-200"
                          >
                            {variant.label} ({variant.weightInKg}kg)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sweet.isPureVeg && (
                    <div className="mt-3 text-xs text-green-700 font-semibold">
                      {hi ? '🌱 शुद्ध शाकाहारी' : '🌱 Pure Veg'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
