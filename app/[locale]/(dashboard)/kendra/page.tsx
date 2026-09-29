import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/src/lib/locale';
import { requireRole } from '@/lib/auth/rbac';
import { db, schema } from '@/lib/db';
import KendraClient from './KendraClient';

export const dynamic = 'force-dynamic';

export default async function KendraPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Scoped role check — layout already guards at 'kendra' level, but we recheck.
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
