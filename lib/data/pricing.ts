import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Server-authoritative pricing and discount computation (migration Task 7/8).
 *
 * The client may only tell the server WHAT it wants to buy (sweetId, variant,
 * quantity, an optional coupon code and the sale-centre). The server recomputes
 * every rupee from the database — line prices from `sale_center_sweets` (+ the
 * master sweet's variant weights) and any discount from the `discounts` table.
 * Client-sent amounts are NEVER trusted for a booking/charge write, per the
 * steering rule "money is server-authoritative".
 */

/** A requested line item as sent by the client — quantities/ids ONLY, no price. */
export interface RequestedItem {
  sweetId: string;
  variantLabel: string;
  quantity: number;
}

/** A fully server-priced line item. */
export interface PricedItem {
  sweetId: string;
  sweetNameHi: string;
  sweetNameEn: string;
  variantLabel: string;
  variantKg: number;
  pricePerKg: number;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  imageUrl: string;
}

export interface PricedCart {
  items: PricedItem[];
  totalKg: number;
  subtotalAmount: number;
}

/** Fallback price per kg when a sale centre has no explicit price row. */
const FALLBACK_PRICE_PER_KG = 700;

type MasterSweetRow = typeof schema.masterSweets.$inferSelect;
type SaleCenterSweetRow = typeof schema.saleCenterSweets.$inferSelect;
type DiscountRow = typeof schema.discounts.$inferSelect;

/**
 * Price a requested cart against a specific sale centre, entirely from the DB.
 * Throws on invalid input (unknown sweet, sweet not offered by the centre,
 * unknown variant, non-positive quantity) so a booking can never be written
 * with a fabricated or stale price.
 */
export async function priceCart(
  saleCenterId: string,
  requested: RequestedItem[]
): Promise<PricedCart> {
  if (!saleCenterId) throw new Error('A sale centre is required to price a cart.');
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new Error('Cart is empty.');
  }

  const sweetIds = [...new Set(requested.map((r) => r.sweetId))];

  // Load the master sweets and this centre's price/availability rows.
  const [sweets, centerSweets] = await Promise.all([
    db.select().from(schema.masterSweets),
    db
      .select()
      .from(schema.saleCenterSweets)
      .where(eq(schema.saleCenterSweets.saleCenterId, saleCenterId)),
  ]);

  const sweetById = new Map<string, MasterSweetRow>(sweets.map((s) => [s.id, s]));
  const centerBySweetId = new Map<string, SaleCenterSweetRow>(
    centerSweets.filter((c) => c.isActive).map((c) => [c.sweetId, c])
  );

  let subtotalAmount = 0;
  let totalKg = 0;
  const items: PricedItem[] = [];

  for (const r of requested) {
    const qty = Math.floor(Number(r.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Invalid quantity for sweet ${r.sweetId}.`);
    }

    const sweet = sweetById.get(r.sweetId);
    if (!sweet) throw new Error(`Unknown sweet: ${r.sweetId}.`);

    // The sweet MUST be offered (and active) at this sale centre.
    const centerRow = centerBySweetId.get(r.sweetId);
    if (!centerRow) {
      throw new Error(`Sweet ${r.sweetId} is not available at the selected shop.`);
    }

    const variants = (sweet.variants ?? []) as { label: string; weightInKg: number; price?: number }[];
    const variant = variants.find((v) => v.label === r.variantLabel);
    if (!variant) {
      throw new Error(`Unknown variant "${r.variantLabel}" for sweet ${r.sweetId}.`);
    }

    const pricePerKg = centerRow.pricePerKg || sweet.basePrice || FALLBACK_PRICE_PER_KG;
    // A variant may carry a fixed price; otherwise price by weight.
    const unitPrice =
      typeof variant.price === 'number'
        ? variant.price
        : Math.round(pricePerKg * variant.weightInKg);
    const lineTotal = unitPrice * qty;

    subtotalAmount += lineTotal;
    totalKg += variant.weightInKg * qty;

    items.push({
      sweetId: sweet.id,
      sweetNameHi: sweet.nameHi,
      sweetNameEn: sweet.nameEn,
      variantLabel: variant.label,
      variantKg: variant.weightInKg,
      pricePerKg,
      unitPrice,
      quantity: qty,
      totalAmount: lineTotal,
      imageUrl: sweet.imageUrl,
    });
  }

  return { items, totalKg, subtotalAmount };
}

export interface DiscountResult {
  valid: boolean;
  discountAmount: number;
  message: string;
  coupon?: DiscountRow;
}

/**
 * Validate a coupon and compute its discount SERVER-SIDE against the DB, given
 * a server-computed subtotal. Mirrors the SPA's validateCoupon rules (active,
 * city/centre scope, expiry, usage limit, min order) but authoritative here.
 */
export async function computeDiscount(
  code: string | undefined | null,
  subtotal: number,
  scope: { cityId?: string | null; centerId?: string | null }
): Promise<DiscountResult> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return { valid: false, discountAmount: 0, message: 'No coupon applied.' };

  const rows = await db
    .select()
    .from(schema.discounts)
    .where(eq(schema.discounts.code, cleanCode))
    .limit(1);
  const coupon = rows[0];

  if (!coupon) return { valid: false, discountAmount: 0, message: 'Invalid coupon code.' };
  if (!coupon.isActive) return { valid: false, discountAmount: 0, message: 'Coupon is inactive.' };

  if (coupon.cityId !== 'all' && scope.cityId && coupon.cityId !== scope.cityId) {
    return { valid: false, discountAmount: 0, message: 'Coupon not valid for this city.' };
  }
  if (
    coupon.centerId &&
    coupon.centerId !== 'all' &&
    scope.centerId &&
    coupon.centerId !== scope.centerId
  ) {
    return { valid: false, discountAmount: 0, message: 'Coupon not valid for this centre.' };
  }
  if (coupon.expiryDate) {
    const today = new Date().toISOString().split('T')[0];
    if (today > coupon.expiryDate) {
      return { valid: false, discountAmount: 0, message: 'Coupon has expired.' };
    }
  }
  if (coupon.usageLimit != null && (coupon.timesUsed || 0) >= coupon.usageLimit) {
    return { valid: false, discountAmount: 0, message: 'Coupon usage limit reached.' };
  }
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of ₹${coupon.minOrderAmount} required.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  return { valid: true, discountAmount, message: `Coupon '${coupon.code}' applied.`, coupon };
}

/**
 * Increment a coupon's usage counter atomically at the DB level (times_used =
 * times_used + 1), avoiding a read-modify-write race between concurrent
 * bookings.
 */
export async function incrementCouponUsage(couponId: string): Promise<void> {
  await db
    .update(schema.discounts)
    .set({ timesUsed: sql`${schema.discounts.timesUsed} + 1` })
    .where(eq(schema.discounts.id, couponId));
}
