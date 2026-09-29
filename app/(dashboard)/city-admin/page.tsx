import { requireRole } from '@/lib/auth/rbac';
import { db, schema } from '@/lib/db';
import CityAdminClient from './CityAdminClient';
import { getLocale } from '@/lib/locale/server';
import type { Locale } from '@/src/lib/locale';

export const dynamic = 'force-dynamic';

export default async function CityAdminPage() {
  const locale = await getLocale();
  const session = await requireRole('city_admin');

  let mitraApps: (typeof schema.mitraApplications.$inferSelect)[] = [];
  let saleCenters: (typeof schema.saleCenters.$inferSelect)[] = [];
  let masterSweets: (typeof schema.masterSweets.$inferSelect)[] = [];
  let bookings: (typeof schema.bookings.$inferSelect)[] = [];
  let discounts: (typeof schema.discounts.$inferSelect)[] = [];
  let cities: (typeof schema.cities.$inferSelect)[] = [];
  let distributionCenters: (typeof schema.distributionCenters.$inferSelect)[] = [];

  try {
    [mitraApps, saleCenters, masterSweets, bookings, discounts, cities, distributionCenters] =
      await Promise.all([
        db.select().from(schema.mitraApplications),
        db.select().from(schema.saleCenters),
        db.select().from(schema.masterSweets),
        db.select().from(schema.bookings),
        db.select().from(schema.discounts),
        db.select().from(schema.cities),
        db.select().from(schema.distributionCenters),
      ]);
  } catch (e) {
    console.error('CityAdminPage: DB load failed:', e);
  }

  return (
    <CityAdminClient
      session={session}
      mitraApps={mitraApps}
      saleCenters={saleCenters}
      masterSweets={masterSweets}
      bookings={bookings}
      discounts={discounts}
      cities={cities}
      distributionCenters={distributionCenters}
      locale={locale as Locale}
    />
  );
}
