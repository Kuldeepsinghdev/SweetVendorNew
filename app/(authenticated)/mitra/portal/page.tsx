import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { db, schema } from '@/lib/db';
import { MitraPortalClient } from './MitraPortalClient';
import { getLocale } from '@/lib/locale/server';

/**
 * Protected Mitra dashboard (Server Component).
 *
 * Requires an authenticated session with role === 'mitra'. Loads bookings,
 * festivals, and cities in parallel, then passes them to the client island.
 */
export default async function MitraPortalPage() {
  const locale = await getLocale();

  const session = await getCustomerSession();
  if (!session || session.role !== 'mitra') {
    redirect('/login?next=/mitra/portal');
  }

  const [bookings, festivals, cities, distributionCenters, mitraAccounts] = await Promise.all([
    db.select().from(schema.bookings).where(eq(schema.bookings.mitraUserId, session.sub)),
    db.select().from(schema.festivals),
    db.select().from(schema.cities),
    db.select().from(schema.distributionCenters),
    db
      .select({
        distributionCenterId: schema.users.distributionCenterId,
        distributionCenterIds: schema.users.distributionCenterIds,
      })
      .from(schema.users)
      .where(eq(schema.users.id, session.sub))
      .limit(1),
  ]);

  const mitraAccount = mitraAccounts[0];
  const assignedDcIds = mitraAccount?.distributionCenterIds?.length
    ? mitraAccount.distributionCenterIds
    : [mitraAccount?.distributionCenterId ?? session.distributionCenterId].filter(Boolean);
  const assignedDcs = distributionCenters.filter(
    (dc) => dc.isActive && assignedDcIds.includes(dc.id)
  );

  return (
    <MitraPortalClient
      locale={locale}
      session={{
        sub: session.sub,
        name: session.name,
        phone: session.phone,
        centerId: session.centerId,
        cityId: session.cityId,
      }}
      bookings={bookings}
      festivals={festivals}
      cities={cities}
      checkoutHref="/checkout"
      assignedDcNamesHi={assignedDcs.map((dc) => dc.nameHi)}
      assignedDcNamesEn={assignedDcs.map((dc) => dc.nameEn)}
    />
  );
}
