'use client';

/**
 * Client wrapper for the checkout page.
 *
 * The pickup centres depend on which sale centre the cart is scoped to, and the
 * cart lives only on the client (CartProvider). So this shell reads the cart,
 * filters the full distribution-centre list down to the cart's sale centre, and
 * hands the result to CheckoutClient. The page passes the full active
 * distribution-centre list from the server.
 */

import { useMemo } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import type { Locale } from '@/src/lib/locale';

interface PickupCenter {
  id: string;
  saleCenterId: string;
  nameHi: string;
  nameEn: string;
  addressHi: string;
  addressEn: string;
}

export function CheckoutShell({
  locale,
  allPickupCenters,
  defaultName,
  defaultPhone,
  homeHref,
}: {
  locale: Locale;
  allPickupCenters: PickupCenter[];
  defaultName: string;
  defaultPhone: string;
  homeHref: string;
}) {
  const cart = useCart();

  const pickupCenters = useMemo(
    () =>
      cart.saleCenterId
        ? allPickupCenters
            .filter((c) => c.saleCenterId === cart.saleCenterId)
            .map(({ id, nameHi, nameEn, addressHi, addressEn }) => ({
              id,
              nameHi,
              nameEn,
              addressHi,
              addressEn,
            }))
        : [],
    [cart.saleCenterId, allPickupCenters]
  );

  return (
    <CheckoutClient
      locale={locale}
      pickupCenters={pickupCenters}
      defaultName={defaultName}
      defaultPhone={defaultPhone}
      homeHref={homeHref}
    />
  );
}
