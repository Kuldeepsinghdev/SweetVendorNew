import { eq } from 'drizzle-orm';
import { getCatalogData, pickActiveFestival } from '@/lib/data/catalog';
import { db, schema } from '@/lib/db';
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

  const [catalog, mitraAccounts] = await Promise.all([
    getCatalogData(),
    session.role === 'mitra'
      ? db
          .select({
            distributionCenterId: schema.users.distributionCenterId,
            distributionCenterIds: schema.users.distributionCenterIds,
          })
          .from(schema.users)
          .where(eq(schema.users.id, session.sub))
          .limit(1)
      : Promise.resolve([]),
  ]);
  const activeFestival = pickActiveFestival(catalog.festivals);

  const mitraAccount = mitraAccounts[0];
  const assignedDistributionCenterIds = mitraAccount?.distributionCenterIds?.length
    ? mitraAccount.distributionCenterIds
    : [mitraAccount?.distributionCenterId ?? (session.role === 'mitra' ? session.distributionCenterId : null)].filter(Boolean);
  const assignedDistributionCenters = session.role === 'mitra'
    ? catalog.distributionCenters.filter(
        (distributionCenter) =>
          distributionCenter.isActive &&
          assignedDistributionCenterIds.includes(distributionCenter.id) &&
          catalog.saleCenters.some(
            (saleCenter) => saleCenter.id === distributionCenter.saleCenterId && saleCenter.isActive
          )
      )
    : undefined;

  const defaultCity =
    catalog.cities.find((c) => c.isActive) || catalog.cities[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      {/* Show authenticated user's name in header */}
      <SiteHeader customerName={session.name} isMitra={session.role === 'mitra'} />

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
            showCenterDirectory={session.role !== 'mitra'}
            showRolePortals={session.role !== 'mitra'}
            assignedDistributionCenters={assignedDistributionCenters}
          />
        </CartProvider>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
