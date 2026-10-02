'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@/lib/db';
import { requireCustomerRoleOrThrow } from '@/lib/auth/customerGuards';
import { AuthorizationError } from '@/lib/auth/rbac';

/**
 * Mitra-related Server Actions (Task 9).
 * Replaces the SPA's submitMitraApplication / deliverBooking context calls.
 */

// ── Mitra application (public, no auth required) ──────────────────────────────

const MitraApplicationSchema = z.object({
  cityId: z.string().min(1).max(64),
  cityNameHi: z.string().trim().max(120),
  centerId: z.string().trim().max(64).optional().or(z.literal('')),
  distributionCenterIds: z.array(z.string().trim().min(1).max(64)).max(30).default([]),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().trim().email('Enter a valid email address').max(254),
  pincode: z.string().trim().max(16),
  address: z.string().trim().max(500),
  agreedToCenter: z.boolean(),
});

export type MitraApplicationState = { error?: string; appId?: string };

export async function submitMitraApplicationAction(
  _prev: MitraApplicationState,
  formData: FormData
): Promise<MitraApplicationState> {
  const parsed = MitraApplicationSchema.safeParse({
    cityId: formData.get('cityId'),
    cityNameHi: formData.get('cityNameHi') ?? '',
    centerId: formData.get('centerId') ?? '',
    distributionCenterIds: formData.getAll('distributionCenterIds').map(String),
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    pincode: formData.get('pincode'),
    address: formData.get('address'),
    agreedToCenter:
      formData.get('agreedToCenter') === 'true' || formData.get('agreedToCenter') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const d = parsed.data;
  const selectedDistributionCenterIds = [...new Set(
    d.distributionCenterIds.length > 0
      ? d.distributionCenterIds
      : d.centerId ? [d.centerId] : []
  )];
  const activeCityCenters = await db
    .select({ id: schema.distributionCenters.id })
    .from(schema.distributionCenters)
    .where(
      and(
        eq(schema.distributionCenters.cityId, d.cityId),
        eq(schema.distributionCenters.isActive, true)
      )
    );
  const activeCenterIds = new Set(activeCityCenters.map((center) => center.id));
  if (selectedDistributionCenterIds.some((id) => !activeCenterIds.has(id))) {
    return { error: 'Select only active distribution centers from the chosen city.' };
  }
  if (activeCityCenters.length > 0 && selectedDistributionCenterIds.length === 0) {
    return { error: 'Select at least one distribution center.' };
  }

  const appId = `SM-${(d.cityId || 'XX').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  await db.insert(schema.mitraApplications).values({
    id: appId,
    cityId: d.cityId,
    cityNameHi: d.cityNameHi,
    centerId: selectedDistributionCenterIds[0] ?? null,
    distributionCenterIds: selectedDistributionCenterIds,
    fullName: d.fullName,
    phone: d.phone,
    email: d.email.toLowerCase(),
    pincode: d.pincode,
    address: d.address,
    agreedToCenter: d.agreedToCenter,
    status: 'pending',
    createdAt: new Date().toISOString(),
    creditLimit: 25000,
  });

  // Audit log (best-effort).
  try {
    await db.insert(schema.auditLogs).values({
      id: `log_mitra_${Date.now()}`,
      actor: `सहकार मित्र (आवेदक): ${d.fullName}`,
      actionHi: `नया सहकार मित्र आवेदन ${appId} प्राप्त हुआ — ${d.fullName}, ${d.phone}`,
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    });
  } catch {
    // non-fatal
  }

  revalidatePath('/[locale]/mitra', 'page');
  return { appId };
}

// ── Deliver booking (Kendra OTP handover) ─────────────────────────────────────

export type DeliverBookingState = { error?: string; invoiceId?: string; bookingId?: string };

const DeliverSchema = z.object({
  bookingId: z.string().min(1).max(64),
  otp: z.string().trim().min(4).max(16),
});

export async function deliverBookingAction(
  _prev: DeliverBookingState,
  formData: FormData
): Promise<DeliverBookingState> {
  // Requires an authenticated mitra session
  let session;
  try {
    session = await requireCustomerRoleOrThrow('mitra');
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: 'Please sign in to continue.' };
    throw e;
  }

  const parsed = DeliverSchema.safeParse({
    bookingId: formData.get('bookingId'),
    otp: formData.get('otp'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const { bookingId, otp } = parsed.data;

  const rows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, bookingId))
    .limit(1);

  const booking = rows[0];
  if (!booking) return { error: 'बुकिंग नहीं मिली (Booking not found).' };
  if (booking.status === 'delivered') return { error: 'यह बुकिंग पहले ही डिलीवर हो चुकी है।' };
  if (booking.deliveryOtp !== otp.trim()) return { error: 'गलत OTP दर्ज किया गया।' };

  // ✨ SECURITY: Verify that the booking belongs to this Mitra
  if (booking.mitraUserId !== session.sub) {
    return { error: 'You are not authorized to deliver this booking.' };
  }

  const deliveredAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // ✨ CHANGE: No longer generate invoice here — it was created at booking time
  // Just mark the booking as delivered
  await db
    .update(schema.bookings)
    .set({ status: 'delivered', paymentStatus: 'paid', deliveredAt })
    .where(eq(schema.bookings.id, bookingId));

  // Audit log.
  try {
    await db.insert(schema.auditLogs).values({
      id: `log_deliver_${Date.now()}`,
      actor: `${session.name} (mitra)`,
      actorUserId: session.sub,
      actionHi: `बुकिंग ${bookingId} — OTP सत्यापन सफल, डिलीवरी पूर्ण।`,
      timestamp: deliveredAt,
    });
  } catch {
    // non-fatal
  }

  revalidatePath('/[locale]/(dashboard)', 'layout');
  // Return the existing invoice ID from the booking (may be null if generation failed)
  return { invoiceId: booking.invoiceId ?? undefined, bookingId };
}
