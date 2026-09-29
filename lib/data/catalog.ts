import 'server-only';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * Server-side catalog reads for the public landing page.
 *
 * Per the migration steering, initial data is queried directly from the DB in
 * Server Components via Drizzle — NOT bootstrapped through client `fetch('/api/*')`.
 * These helpers return plain, serializable data that RSC pages pass to client
 * islands as props.
 */

export type CatalogSweet = typeof schema.masterSweets.$inferSelect;
export type CatalogCity = typeof schema.cities.$inferSelect;
export type CatalogSaleCenter = typeof schema.saleCenters.$inferSelect;
export type CatalogDistributionCenter = typeof schema.distributionCenters.$inferSelect;
export type CatalogSaleCenterSweet = typeof schema.saleCenterSweets.$inferSelect;
export type CatalogFestival = typeof schema.festivals.$inferSelect;

export interface CatalogData {
  sweets: CatalogSweet[];
  cities: CatalogCity[];
  saleCenters: CatalogSaleCenter[];
  distributionCenters: CatalogDistributionCenter[];
  saleCenterSweets: CatalogSaleCenterSweet[];
  festivals: CatalogFestival[];
  activeFestival: CatalogFestival | null;
  /**
   * Whether the booking window is open. Computed on the server (today <=
   * cutoff) so the client cannot spoof an open window. Mirrors the SPA's
   * `isBookingWindowOpen` (minus the admin-only forceCutoffClosed override).
   */
  isBookingWindowOpen: boolean;
}

/**
 * Pick the active festival: the one flagged `active`, else the first available.
 * Matches the SPA's `festivals.find(f => f.status === 'active') || festivals[0]`.
 */
export function pickActiveFestival(
  festivals: CatalogFestival[]
): CatalogFestival | null {
  return festivals.find((f) => f.status === 'active') || festivals[0] || null;
}

/**
 * Server-authoritative booking-window check: open when today is on or before
 * the active festival's cutoff date. Dates are compared as ISO `YYYY-MM-DD`
 * strings, matching the SPA's comparison semantics.
 */
export function computeBookingWindowOpen(
  activeFestival: CatalogFestival | null
): boolean {
  if (!activeFestival) return true;
  const today = new Date().toISOString().split('T')[0];
  const isPastCutoff = today > activeFestival.cutoffDate;
  return !isPastCutoff;
}

/**
 * Load everything the public landing page needs in one place. Queries run in
 * parallel against the single pooled client.
 */
export async function getCatalogData(): Promise<CatalogData> {
  const [
    sweets,
    cities,
    saleCenters,
    distributionCenters,
    saleCenterSweets,
    festivals,
  ] = await Promise.all([
    db.select().from(schema.masterSweets),
    db.select().from(schema.cities),
    db.select().from(schema.saleCenters),
    db.select().from(schema.distributionCenters),
    db.select().from(schema.saleCenterSweets),
    db.select().from(schema.festivals),
  ]);

  const activeFestival = pickActiveFestival(festivals);

  return {
    sweets,
    cities,
    saleCenters,
    distributionCenters,
    saleCenterSweets,
    festivals,
    activeFestival,
    isBookingWindowOpen: computeBookingWindowOpen(activeFestival),
  };
}

/** Sweets (menu + pricing) offered by a given sale centre. */
export async function getSaleCenterSweets(
  saleCenterId: string
): Promise<CatalogSaleCenterSweet[]> {
  if (!saleCenterId) return [];
  return db
    .select()
    .from(schema.saleCenterSweets)
    .where(eq(schema.saleCenterSweets.saleCenterId, saleCenterId));
}
