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

  const [bookings, festivals, cities, distributionCenters] = await Promise.all([
    db.select().from(schema.bookings).where(eq(schema.bookings.mitraUserId, session.sub)),
    db.select().from(schema.festivals),
    db.select().from(schema.cities),
    db.select().from(schema.distributionCenters),
  ]);

  const assignedDc =
    distributionCenters.find((dc) => dc.id === session.distributionCenterId) ?? null;

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
      assignedDcNameHi={assignedDc?.nameHi ?? null}
      assignedDcNameEn={assignedDc?.nameEn ?? null}
    />
  );
}
