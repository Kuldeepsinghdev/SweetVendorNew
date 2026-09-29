import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/src/lib/locale';
import { requireRole } from '@/lib/auth/rbac';
import { db, schema } from '@/lib/db';
import CityAdminClient from './CityAdminClient';

export const dynamic = 'force-dynamic';

export default async function CityAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireRole('city_admin');

  let mitraApps: (typeof schema.mitraApplications.$inferSelect)[] = [];
  let saleCenters: (typeof schema.saleCenters.$inferSelect)[] = [];
  let masterSweets: (typeof schema.masterSweets.$inferSelect)[] = [];
  let bookings: (typeof schema.bookings.$inferSelect)[] = [];
  let discounts: (typeof schema.discounts.$inferSelect)[] = [];
  let cities: (typeof schema.cities.$inferSelect)[] = [];

  try {
    [mitraApps, saleCenters, masterSweets, bookings, discounts, cities] = await Promise.all([
      db.select().from(schema.mitraApplications),
      db.select().from(schema.saleCenters),
      db.select().from(schema.masterSweets),
      db.select().from(schema.bookings),
      db.select().from(schema.discounts),
      db.select().from(schema.cities),
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
      locale={locale as Locale}
    />
  );
}
