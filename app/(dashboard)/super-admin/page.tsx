import { requireRole } from '@/lib/auth/rbac';
import { db, schema } from '@/lib/db';
import { desc } from 'drizzle-orm';
import SuperAdminClient from './SuperAdminClient';
import { getLocale } from '@/lib/locale/server';
import type { Locale } from '@/src/lib/locale';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const locale = await getLocale();
  const session = await requireRole('super_admin');

  let festivals: (typeof schema.festivals.$inferSelect)[] = [];
  let cities: (typeof schema.cities.$inferSelect)[] = [];
  let masterSweets: (typeof schema.masterSweets.$inferSelect)[] = [];
  let saleCenters: (typeof schema.saleCenters.$inferSelect)[] = [];
  let bookings: (typeof schema.bookings.$inferSelect)[] = [];
  let auditLogs: (typeof schema.auditLogs.$inferSelect)[] = [];
  let distributionCenters: (typeof schema.distributionCenters.$inferSelect)[] = [];
  let mitraApplications: (typeof schema.mitraApplications.$inferSelect)[] = [];

  try {
    [festivals, cities, masterSweets, saleCenters, bookings, auditLogs, distributionCenters, mitraApplications] =
      await Promise.all([
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
        db.select().from(schema.distributionCenters),
        db.select().from(schema.mitraApplications),
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
      distributionCenters={distributionCenters}
      mitraApplications={mitraApplications}
      locale={locale as Locale}
    />
  );
}
