import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { isLocale } from '@/src/lib/locale';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { db, schema } from '@/lib/db';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MitraPortalClient } from './MitraPortalClient';

/**
 * Protected Mitra dashboard (Server Component).
 *
 * Requires an authenticated session with role === 'mitra'. Loads bookings,
 * festivals, and cities in parallel, then passes them to the client island.
 */
export default async function MitraPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getCustomerSession();
  if (!session || session.role !== 'mitra') {
    redirect(`/${locale}/login?next=/${locale}/mitra/portal`);
  }

  const [bookings, festivals, cities] = await Promise.all([
    db.select().from(schema.bookings).where(eq(schema.bookings.mitraUserId, session.sub)),
    db.select().from(schema.festivals),
    db.select().from(schema.cities),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-950 to-amber-950/90">
      <SiteHeader locale={locale} customerName={session.name} />

      <main className="flex-1">
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
          checkoutHref={`/${locale}/checkout`}
        />
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
