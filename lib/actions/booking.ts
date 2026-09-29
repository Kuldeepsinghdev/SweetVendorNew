'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { requireCustomerOrThrow, requireCustomerRoleOrThrow } from '@/lib/auth/customerGuards';
import { AuthorizationError } from '@/lib/auth/rbac';
import {
  priceCart,
  computeDiscount,
  incrementCouponUsage,
  type RequestedItem,
} from '@/lib/data/pricing';
import { pickActiveFestival, computeBookingWindowOpen } from '@/lib/data/catalog';

/**
 * Server-authoritative booking creation (migration Task 7).
 *
 * Replaces the client-trust `POST /api/bookings` path. The client sends only
 * WHAT it wants (sale centre, item ids/variants/quantities, an optional coupon
 * code, payment method, and customer contact). The server:
 *   1. requires a customer/mitra session (deny by default),
 *   2. re-checks the booking window from the active festival,
 *   3. recomputes every price from the DB (priceCart) — client amounts are
 *      never trusted,
 *   4. validates + computes any discount from the DB (computeDiscount),
 *   5. writes the booking with the server-computed totals,
 *   6. increments coupon usage atomically and audit-logs.
 *
 * NOTE: 'online' payment is NOT supported — Sahakar Bharati uses cash/udhar only.
 * The Zod schema enforces this at the boundary.
 */

const RequestedItemSchema = z.object({
  sweetId: z.string().min(1).max(64),
  variantLabel: z.string().min(1).max(64),
  quantity: z.number().int().positive().max(999),
});

const CustomerInfoSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  pincode: z.string().trim().max(16).optional().or(z.literal('')),
});

const CreateBookingSchema = z.object({
  saleCenterId: z.string().min(1).max(64),
  centerId: z.string().min(1).max(64), // distribution/pickup centre
  items: z.array(RequestedItemSchema).min(1).max(50),
  couponCode: z.string().trim().max(64).optional().or(z.literal('')),
  paymentMethod: z.enum(['cash', 'udhar']),
  customer: CustomerInfoSchema,
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export type CreateBookingResult =
  | {
      ok: true;
      bookingId: string;
      subtotalAmount: number;
      discountAmount: number;
      totalAmount: number;
      deliveryOtp: string;
    }
  | { ok: false; error: string };

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createBookingAction(
  raw: CreateBookingInput
): Promise<CreateBookingResult> {
  // 1) Authorize — only a signed-in mitra may book.
  let session;
  try {
    session = await requireCustomerRoleOrThrow('mitra');
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { ok: false, error: 'केवल अधिकृत सहकार मित्र बुकिंग कर सकते हैं। / Only authorized Sahakar Mitras may place bookings.' };
    }
    throw e;
  }

  // 2) Validate the request shape at the boundary.
  const parsed = CreateBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid booking request.' };
  }
  const input = parsed.data;

  // 3) Resolve the sale centre + festival server-side; re-check booking window.
  const [centerRows, festivals, distRows] = await Promise.all([
    db.select().from(schema.saleCenters).where(eq(schema.saleCenters.id, input.saleCenterId)).limit(1),
    db.select().from(schema.festivals),
    db.select().from(schema.distributionCenters).where(eq(schema.distributionCenters.id, input.centerId)).limit(1),
  ]);

  const saleCenter = centerRows[0];
  if (!saleCenter || !saleCenter.isActive) {
    return { ok: false, error: 'Selected shop is not available.' };
  }
  const pickup = distRows[0];
  if (!pickup || !pickup.isActive || pickup.saleCenterId !== saleCenter.id) {
    return { ok: false, error: 'Selected pickup centre is not valid for this shop.' };
  }

  const activeFestival = pickActiveFestival(festivals);
  if (!computeBookingWindowOpen(activeFestival)) {
    return { ok: false, error: 'The booking window is closed.' };
  }

  // 4) Recompute all prices from the DB — never trust client amounts.
  let priced;
  try {
    priced = await priceCart(input.saleCenterId, input.items as RequestedItem[]);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not price the cart.' };
  }

  // 5) Validate + compute discount server-side.
  const discount = await computeDiscount(input.couponCode, priced.subtotalAmount, {
    cityId: saleCenter.cityId,
    centerId: pickup.id,
  });
  // A bad/expired coupon is non-fatal: proceed without a discount rather than
  // silently applying a client-claimed amount.
  const discountAmount = discount.valid ? discount.discountAmount : 0;
  const totalAmount = Math.max(0, priced.subtotalAmount - discountAmount);

  // 6) Compose and write the booking with SERVER-computed money.
  // Only cash and udhar are supported — no online payment.
  const bookingId = genId('bk');
  const bookingNum = Math.floor(1000 + Math.random() * 9000);

  const payload: typeof schema.bookings.$inferInsert = {
    id: bookingId,
    festivalId: activeFestival?.id ?? 'unknown',
    festivalNameHi: activeFestival?.nameHi ?? '',
    cityId: saleCenter.cityId,
    cityNameHi: '',
    centerId: pickup.id,
    saleCenterId: saleCenter.id,
    centerNameHi: pickup.nameHi,
    centerAddressHi: pickup.addressHi,
    centerPhone: pickup.phone,
    bookedByRole: session.role,
    mitraUserId: session.role === 'mitra' ? session.sub : null,
    customerUserId: session.role === 'customer' ? session.sub : null,
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email || undefined,
      address: input.customer.address || undefined,
      pincode: input.customer.pincode || undefined,
    },
    items: priced.items,
    totalKg: priced.totalKg,
    totalAmount,
    subtotalAmount: priced.subtotalAmount,
    discountCode: discount.valid ? discount.coupon?.code ?? null : null,
    discountAmount: discountAmount > 0 ? discountAmount : null,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === 'udhar' ? 'udhar_outstanding' : 'paid',
    status: 'confirmed',
    pickupDate: activeFestival?.distributionStartDate ?? '',
    deliveryOtp: String(bookingNum),
    createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
  };

  try {
    await db.insert(schema.bookings).values(payload);
  } catch (e) {
    console.error('Booking insert failed:', e);
    return { ok: false, error: 'Could not save the booking. Please try again.' };
  }

  // 7) Increment coupon usage (atomic) + audit log — best-effort, non-fatal.
  if (discount.valid && discount.coupon) {
    try {
      await incrementCouponUsage(discount.coupon.id);
    } catch (e) {
      console.warn('Coupon usage increment failed:', e);
    }
  }
  try {
    await db.insert(schema.auditLogs).values({
      id: genId('log'),
      actor: `${session.name} (${session.role})`,
      actorUserId: session.sub,
      actionHi: `बुकिंग ${bookingId} बनाई — ₹${totalAmount}${
        discountAmount > 0 ? ` (छूट ₹${discountAmount})` : ''
      }`,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    });
  } catch (e) {
    console.warn('Audit log failed:', e);
  }

  revalidatePath('/[locale]', 'page');

  return {
    ok: true,
    bookingId,
    subtotalAmount: priced.subtotalAmount,
    discountAmount,
    totalAmount,
    deliveryOtp: String(bookingNum),
  };
}


/** A server-priced preview for the checkout UI (no write). */
export type PreviewResult =
  | {
      ok: true;
      items: import('@/lib/data/pricing').PricedItem[];
      totalKg: number;
      subtotalAmount: number;
      discountValid: boolean;
      discountAmount: number;
      discountMessage: string;
      totalAmount: number;
    }
  | { ok: false; error: string };

const PreviewSchema = z.object({
  saleCenterId: z.string().min(1).max(64),
  centerId: z.string().min(1).max(64),
  items: z.array(RequestedItemSchema).min(1).max(50),
  couponCode: z.string().trim().max(64).optional().or(z.literal('')),
});

export type PreviewInput = z.infer<typeof PreviewSchema>;

/**
 * Recompute cart totals (and optionally a coupon) on the server for display in
 * the checkout UI. This is the ONLY source of truth the UI should show for
 * money — it must not compute its own totals. Requires a customer session.
 */
export async function previewBookingAction(raw: PreviewInput): Promise<PreviewResult> {
  try {
    await requireCustomerOrThrow();
  } catch (e) {
    if (e instanceof AuthorizationError) return { ok: false, error: 'Please sign in to continue.' };
    throw e;
  }

  const parsed = PreviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' };
  }
  const input = parsed.data;

  const [centerRows, distRows] = await Promise.all([
    db.select().from(schema.saleCenters).where(eq(schema.saleCenters.id, input.saleCenterId)).limit(1),
    db.select().from(schema.distributionCenters).where(eq(schema.distributionCenters.id, input.centerId)).limit(1),
  ]);
  const saleCenter = centerRows[0];
  const pickup = distRows[0];
  if (!saleCenter) return { ok: false, error: 'Selected shop is not available.' };

  let priced;
  try {
    priced = await priceCart(input.saleCenterId, input.items as RequestedItem[]);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not price the cart.' };
  }

  const discount = await computeDiscount(input.couponCode, priced.subtotalAmount, {
    cityId: saleCenter.cityId,
    centerId: pickup?.id ?? null,
  });
  const discountAmount = discount.valid ? discount.discountAmount : 0;

  return {
    ok: true,
    items: priced.items,
    totalKg: priced.totalKg,
    subtotalAmount: priced.subtotalAmount,
    discountValid: discount.valid,
    discountAmount,
    discountMessage: discount.message,
    totalAmount: Math.max(0, priced.subtotalAmount - discountAmount),
  };
}
