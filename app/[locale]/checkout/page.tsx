import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/src/lib/locale';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { CartProvider } from '@/components/cart/CartProvider';
import { SiteHeader } from '@/components/SiteHeader';
import { CheckoutShell } from './CheckoutShell';

/**
 * Checkout page (Server Component).
 *
 * Requires a customer/mitra session — anonymous visitors are redirected to
 * login with checkout as the post-login destination. The active pickup centres
 * are loaded here on the server; the client shell filters them to the cart's
 * sale centre. All money is recomputed server-side by the checkout Server
 * Actions (previewBookingAction / createBookingAction) — nothing here trusts a
 * client-supplied amount.
 */
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getCustomerSession();
  if (!session) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/checkout`)}`);
  }

  const centers = await db
    .select()
    .from(schema.distributionCenters)
    .where(eq(schema.distributionCenters.isActive, true));

  const allPickupCenters = centers.map((c) => ({
    id: c.id,
    saleCenterId: c.saleCenterId,
    nameHi: c.nameHi,
    nameEn: c.nameEn,
    addressHi: c.addressHi,
    addressEn: c.addressEn,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader locale={locale} customerName={session.name} />
      <CartProvider>
        <CheckoutShell
          locale={locale}
          allPickupCenters={allPickupCenters}
          defaultName={session.name}
          defaultPhone={session.phone}
          homeHref={`/${locale}`}
        />
      </CartProvider>
    </div>
  );
}
