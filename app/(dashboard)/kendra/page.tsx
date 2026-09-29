import { requireRole } from '@/lib/auth/rbac';
import { db, schema } from '@/lib/db';
import KendraClient from './KendraClient';
import { getLocale } from '@/lib/locale/server';
import type { Locale } from '@/src/lib/locale';

export const dynamic = 'force-dynamic';

export default async function KendraPage() {
  const locale = await getLocale();
  const session = await requireRole('kendra');

  let bookings: (typeof schema.bookings.$inferSelect)[] = [];
  let centers: (typeof schema.saleCenters.$inferSelect)[] = [];
  let festivals: (typeof schema.festivals.$inferSelect)[] = [];

  try {
    [bookings, centers, festivals] = await Promise.all([
      db.select().from(schema.bookings),
      db.select().from(schema.saleCenters),
      db.select().from(schema.festivals),
    ]);
  } catch (e) {
    console.error('KendraPage: DB load failed:', e);
  }

  return (
    <KendraClient
      session={session}
      bookings={bookings}
      centers={centers}
      festivals={festivals}
      locale={locale as Locale}
    />
  );
}
