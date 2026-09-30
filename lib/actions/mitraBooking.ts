'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, and, sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { requireMitraOrThrow, MitraAuthorizationError } from '@/lib/auth/mitraGuards';
import {
  priceCart,
  computeDiscount,
  incrementCouponUsage,
  type RequestedItem,
} from '@/lib/data/pricing';
import { pickActiveFestival, computeBookingWindowOpen } from '@/lib/data/catalog';
import type { PricedCart } from '@/lib/data/pricing';
import { getSweetPrice } from '@/lib/data/sweets';
import { genId } from '@/lib/security/id';

/**
 * Generate invoice number for Mitra booking
 */
async function generateInvoiceNumber(cityId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  // Use Drizzle to count invoices created today
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.invoices)
    .where(
      sql`DATE(${schema.invoices.createdAt}) = CURRENT_DATE`
    );

  const count = (result[0]?.count ?? 0) as number;
  const num = String(count + 1).padStart(4, '0');
  return `INV-${today}-${num}`;
}

/**
 * Create invoice for Mitra booking
 */
async function generateInvoiceForMitraBooking(
  bookingId: string,
  booking: typeof schema.bookings.$inferSelect,
  saleCenter: typeof schema.saleCenters.$inferSelect,
  pickupCenter: typeof schema.distributionCenters.$inferSelect,
  mitraSession: Awaited<ReturnType<typeof requireMitraOrThrow>>,
  priced: PricedCart,
  discountAmount: number
): Promise<{ ok: true; invoiceId: string } | { ok: false; error: string }> {
  try {
    const invoiceNumber = await generateInvoiceNumber(saleCenter.cityId);
    const invoiceId = genId('inv');
    const invoiceDate = new Date().toISOString();

    // For udhar payments, set due date 30 days from now
    const dueDate =
      booking.paymentMethod === 'udhar'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const invoicePayload: typeof schema.invoices.$inferInsert = {
      id: invoiceId,
      invoiceNumber,
      bookingId,

      // Customer details (from booking)
      customerName: booking.customer.name,
      customerPhone: booking.customer.phone,
      customerEmail: booking.customer.email || null,
      customerAddress: booking.customer.address || null,
      customerPincode: booking.customer.pincode || null,

      // Mitra info
      mitraName: mitraSession.name,
      mitraUserId: mitraSession.sub,

      // Order details
      festivalName: booking.festivalNameHi,
      saleCenterName: saleCenter.nameHi,
      pickupCenterName: pickupCenter.nameHi,

      // Items from priced cart
      items: priced.items.map((item) => ({
        sweetId: item.sweetId,
        sweetNameHi: item.sweetNameHi,
        sweetNameEn: item.sweetNameEn,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        unitPrice: item.pricePerKg,
        lineTotal: item.totalAmount,
      })),

      // Pricing
      subtotalAmount: priced.subtotalAmount,
      discountCode: booking.discountCode || null,
      discountAmount: discountAmount > 0 ? discountAmount : 0,
      totalAmount: booking.totalAmount,

      // Tax
      gstAmount: 0, // TODO: Calculate if applicable

      // Payment
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,

      // Dates
      invoiceDate,
      dueDate,
      status: 'active',
      createdAt: invoiceDate,
    };

    await db.insert(schema.invoices).values(invoicePayload);

    return { ok: true, invoiceId };
  } catch (e) {
    console.error('Invoice generation error:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Validate cart item quantities and prices server-side
 */
const CartItemSchema = z.object({
  sweetId: z.string().min(1).max(64),
  variantLabel: z.string().min(1).max(64),
  quantity: z.number().int().positive().max(999),
});

const MitraCheckoutSchema = z.object({
  saleCenterId: z.string().min(1).max(64),
  centerId: z.string().min(1).max(64),
  items: z.array(CartItemSchema).min(1),
  couponCode: z.string().max(64).optional().or(z.literal('')),
  paymentMethod: z.enum(['cash', 'udhar']),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().regex(/^\d{10}$/, 'Invalid phone number'),
    email: z.string().trim().email().max(254).optional().or(z.literal('')),
    address: z.string().trim().max(500).optional().or(z.literal('')),
    pincode: z.string().trim().max(16).optional().or(z.literal('')),
  }),
});

export type MitraCheckoutInput = z.infer<typeof MitraCheckoutSchema>;

export type CreateMitraBookingResult =
  | {
      ok: true;
      bookingId: string;
      invoiceId?: string;
      subtotalAmount: number;
      discountAmount: number;
      totalAmount: number;
      deliveryOtp: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Create a booking as an authenticated Mitra
 *
 * Server-authoritative: all prices, quantities, and discounts are validated
 * and computed server-side. The client sends only the request shape; the server
 * computes all monetary values from the database before writing.
 *
 * Enforces:
 * - Only approved Mitras (role='mitra') may book
 * - Payment method is 'cash' or 'udhar' only — NO online payment
 * - All prices are fetched from DB, never trusted from client
 * - Booking window is open for the active festival
 * - Discount coupon is validated server-side
 * - Data isolation: Mitra can only access their own bookings
 */
export async function createMitraBookingAction(
  raw: MitraCheckoutInput
): Promise<CreateMitraBookingResult> {
  // 1) Authorize — only an authenticated Mitra
  let session;
  try {
    session = await requireMitraOrThrow();
  } catch (e) {
    if (e instanceof MitraAuthorizationError) {
      return { ok: false, error: 'केवल अधिकृत सहकार मित्र बुकिंग कर सकते हैं। / Only authorized Sahakar Mitras may place bookings.' };
    }
    throw e;
  }

  // 2) Validate request shape at boundary
  const parsed = MitraCheckoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid booking request.' };
  }
  const input = parsed.data;

  // 3) Verify sale centre and pickup centre exist and are valid
  const [centerRows, distRows, festivals] = await Promise.all([
    db.select().from(schema.saleCenters).where(eq(schema.saleCenters.id, input.saleCenterId)).limit(1),
    db.select().from(schema.distributionCenters).where(eq(schema.distributionCenters.id, input.centerId)).limit(1),
    db.select().from(schema.festivals),
  ]);

  const saleCenter = centerRows[0];
  if (!saleCenter || !saleCenter.isActive) {
    return { ok: false, error: 'Selected shop is not available.' };
  }

  const pickup = distRows[0];
  if (!pickup || !pickup.isActive || pickup.saleCenterId !== saleCenter.id) {
    return { ok: false, error: 'Selected pickup centre is not valid for this shop.' };
  }

  // 4) Check booking window
  const activeFestival = pickActiveFestival(festivals);
  if (!computeBookingWindowOpen(activeFestival)) {
    return { ok: false, error: 'The booking window is closed.' };
  }

  // 5) Recompute all prices from DB — NEVER trust client amounts
  let priced;
  try {
    priced = await priceCart(input.saleCenterId, input.items as RequestedItem[]);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not price the cart.' };
  }

  // 6) Validate and compute discount server-side
  const discount = await computeDiscount(input.couponCode, priced.subtotalAmount, {
    cityId: saleCenter.cityId,
    centerId: pickup.id,
  });
  const discountAmount = discount.valid ? discount.discountAmount : 0;
  const totalAmount = Math.max(0, priced.subtotalAmount - discountAmount);

  // 7) Create booking record with SERVER-computed money
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
    bookedByRole: 'mitra',
    mitraUserId: session.sub,
    customerUserId: null,
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

  // 8) Generate invoice
  const invoiceResult = await generateInvoiceForMitraBooking(
    bookingId,
    payload as typeof schema.bookings.$inferSelect,
    saleCenter,
    pickup,
    session,
    priced,
    discountAmount
  );

  if (!invoiceResult.ok) {
    console.warn('Invoice generation failed (non-fatal):', invoiceResult.error);
  }

  // 9) Increment coupon usage
  if (discount.valid && discount.coupon) {
    try {
      await incrementCouponUsage(discount.coupon.id);
    } catch (e) {
      console.warn('Coupon usage increment failed:', e);
    }
  }

  // 10) Audit log
  try {
    await db.insert(schema.auditLogs).values({
      id: genId('log'),
      actor: `${session.name} (mitra)`,
      actorUserId: session.sub,
      actionHi: `मित्र बुकिंग ${bookingId} बनाई — ₹${totalAmount}${
        discountAmount > 0 ? ` (छूट ₹${discountAmount})` : ''
      }`,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    });
  } catch (e) {
    console.warn('Audit log failed:', e);
  }

  revalidatePath('/[locale]/mitra/portal', 'page');
  revalidatePath('/[locale]/mitra/invoices', 'page');

  return {
    ok: true,
    bookingId,
    invoiceId: invoiceResult.ok ? invoiceResult.invoiceId : undefined,
    subtotalAmount: priced.subtotalAmount,
    discountAmount,
    totalAmount,
    deliveryOtp: String(bookingNum),
  };
}

/**
 * Fetch a single booking as an authenticated Mitra
 * Returns null if booking not found or Mitra doesn't own it
 */
export async function getMitraBookingAction(
  bookingId: string
): Promise<(typeof schema.bookings.$inferSelect) | null> {
  try {
    const session = await requireMitraOrThrow();

    const result = await db
      .select()
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.id, bookingId),
          eq(schema.bookings.mitraUserId, session.sub)
        )
      )
      .limit(1);

    return result[0] || null;
  } catch {
    return null;
  }
}

/**
 * Fetch all bookings for the authenticated Mitra
 */
export async function getMitraBookingsAction(): Promise<
  (typeof schema.bookings.$inferSelect)[] | { error: string }
> {
  try {
    const session = await requireMitraOrThrow();

    const results = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.mitraUserId, session.sub))
      .orderBy(schema.bookings.createdAt);

    return results;
  } catch (e) {
    if (e instanceof MitraAuthorizationError) {
      return { error: 'Not authorized.' };
    }
    throw e;
  }
}
