'use server';

import { eq, and } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { requireMitraOrThrow, MitraAuthorizationError } from '@/lib/auth/mitraGuards';

/**
 * Fetch a single invoice as an authenticated Mitra
 * Returns null if invoice not found or Mitra doesn't own it
 */
export async function getMitraInvoiceAction(
  invoiceId: string
): Promise<(typeof schema.invoices.$inferSelect) | null> {
  try {
    const session = await requireMitraOrThrow();

    const result = await db
      .select()
      .from(schema.invoices)
      .innerJoin(
        schema.bookings,
        eq(schema.invoices.bookingId, schema.bookings.id)
      )
      .where(
        and(
          eq(schema.invoices.id, invoiceId),
          eq(schema.bookings.mitraUserId, session.sub)
        )
      )
      .limit(1);

    return result[0]?.invoices || null;
  } catch (e) {
    if (e instanceof MitraAuthorizationError) {
      return null;
    }
    throw e;
  }
}

/**
 * Fetch all invoices for the authenticated Mitra
 */
export async function getMitraInvoicesAction(): Promise<
  (typeof schema.invoices.$inferSelect)[] | { error: string }
> {
  try {
    const session = await requireMitraOrThrow();

    const results = await db
      .select({ invoice: schema.invoices })
      .from(schema.invoices)
      .innerJoin(
        schema.bookings,
        eq(schema.invoices.bookingId, schema.bookings.id)
      )
      .where(eq(schema.bookings.mitraUserId, session.sub))
      .orderBy(schema.invoices.invoiceDate);

    return results.map(r => r.invoice);
  } catch (e) {
    if (e instanceof MitraAuthorizationError) {
      return { error: 'Not authorized.' };
    }
    throw e;
  }
}

/**
 * Fetch invoice with associated booking details for display
 */
export async function getMitraInvoiceWithDetails(
  invoiceId: string
): Promise<
  | {
      invoice: typeof schema.invoices.$inferSelect;
      booking: typeof schema.bookings.$inferSelect;
    }
  | null
> {
  try {
    const session = await requireMitraOrThrow();

    const result = await db
      .select({
        invoice: schema.invoices,
        booking: schema.bookings,
      })
      .from(schema.invoices)
      .innerJoin(
        schema.bookings,
        eq(schema.invoices.bookingId, schema.bookings.id)
      )
      .where(
        and(
          eq(schema.invoices.id, invoiceId),
          eq(schema.bookings.mitraUserId, session.sub)
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (e) {
    if (e instanceof MitraAuthorizationError) {
      return null;
    }
    throw e;
  }
}
