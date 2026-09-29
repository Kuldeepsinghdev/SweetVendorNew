import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/src/lib/locale';
import { requireRole } from '@/lib/auth/rbac';
import { db, schema } from '@/lib/db';
import { desc } from 'drizzle-orm';
import SuperAdminClient from './SuperAdminClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireRole('super_admin');

  let festivals: (typeof schema.festivals.$inferSelect)[] = [];
  let cities: (typeof schema.cities.$inferSelect)[] = [];
  let masterSweets: (typeof schema.masterSweets.$inferSelect)[] = [];
  let saleCenters: (typeof schema.saleCenters.$inferSelect)[] = [];
  let bookings: (typeof schema.bookings.$inferSelect)[] = [];
  let auditLogs: (typeof schema.auditLogs.$inferSelect)[] = [];

  try {
    [festivals, cities, masterSweets, saleCenters, bookings, auditLogs] = await Promise.all([
      db.select().from(schema.festivals),
      db.select().from(schema.cities),
      db.select().from(schema.masterSweets),
      db.select().from(schema.saleCenters),
      db.select().from(schema.bookings),
      db
        .select()
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(100),
    ]);
  } catch (e) {
    console.error('SuperAdminPage: DB load failed:', e);
  }

  return (
    <SuperAdminClient
      session={session}
      festivals={festivals}
      cities={cities}
      masterSweets={masterSweets}
      saleCenters={saleCenters}
      bookings={bookings}
      auditLogs={auditLogs}
      locale={locale as Locale}
    />
  );
}
