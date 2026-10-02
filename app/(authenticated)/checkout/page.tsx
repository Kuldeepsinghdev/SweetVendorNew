import { redirect } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { CartProvider } from '@/components/cart/CartProvider';
import { SiteHeader } from '@/components/SiteHeader';
import { CheckoutShell } from './CheckoutShell';
import { getLocale } from '@/lib/locale/server';

/**
 * Checkout page (Server Component).
 *
 * Requires an authenticated Sahakar Mitra session. Anonymous visitors and
 * non-mitra users (role: 'customer') are redirected to login.
 */
export default async function CheckoutPage() {
  const locale = await getLocale();

  const session = await getCustomerSession();
  if (!session || session.role !== 'mitra') {
    redirect(`/login?next=${encodeURIComponent('/checkout')}`);
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
      <SiteHeader customerName={session.name} isMitra />
      <CartProvider>
        <CheckoutShell
          locale={locale}
          allPickupCenters={allPickupCenters}
          defaultName={session.name}
          defaultPhone={session.phone}
          homeHref="/"
        />
      </CartProvider>
    </div>
  );
}
