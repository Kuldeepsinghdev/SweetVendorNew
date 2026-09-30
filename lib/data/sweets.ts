import 'server-only';
import { db } from '@/lib/db';
import { schema } from '@/lib/db';
import { eq, and, sql, inArray } from 'drizzle-orm';

/**
 * Fetch all active sweets for the Mitra catalog.
 * Includes pricing information from the specified sale center.
 *
 * @param saleCenterId - The sale center ID to fetch pricing for
 * @returns Array of sweets with pricing info
 */
export async function getActiveSweetsForCatalog(saleCenterId: string) {
  try {
    const result = await db
      .select({
        id: schema.masterSweets.id,
        nameHi: schema.masterSweets.nameHi,
        nameEn: schema.masterSweets.nameEn,
        category: schema.masterSweets.category,
        descriptionHi: schema.masterSweets.descriptionHi,
        descriptionEn: schema.masterSweets.descriptionEn,
        imageUrl: schema.masterSweets.imageUrl,
        variants: schema.masterSweets.variants,
        pricePerKg: schema.saleCenterSweets.pricePerKg,
        isPureVeg: schema.masterSweets.isPureVeg,
      })
      .from(schema.masterSweets)
      .innerJoin(
        schema.saleCenterSweets,
        and(
          eq(schema.saleCenterSweets.sweetId, schema.masterSweets.id),
          eq(schema.saleCenterSweets.saleCenterId, saleCenterId)
        )
      )
      .where(
        and(
          eq(schema.saleCenterSweets.isActive, true)
        )
      )
      .orderBy(schema.masterSweets.nameHi);

    return {
      ok: true,
      data: result,
      error: null,
    };
  } catch (error) {
    console.error('Failed to fetch sweets:', error);
    return {
      ok: false,
      data: [],
      error: 'Could not load sweets catalog. Please try again.',
    };
  }
}

/**
 * Fetch a single sweet with its pricing for a sale center.
 * Used for product detail pages and cart operations.
 *
 * @param sweetId - The sweet ID
 * @param saleCenterId - The sale center ID
 * @returns Sweet with pricing or null if not found/inactive
 */
export async function getSweetForSaleCenter(
  sweetId: string,
  saleCenterId: string
) {
  try {
    const result = await db
      .select({
        id: schema.masterSweets.id,
        nameHi: schema.masterSweets.nameHi,
        nameEn: schema.masterSweets.nameEn,
        category: schema.masterSweets.category,
        descriptionHi: schema.masterSweets.descriptionHi,
        descriptionEn: schema.masterSweets.descriptionEn,
        imageUrl: schema.masterSweets.imageUrl,
        variants: schema.masterSweets.variants,
        pricePerKg: schema.saleCenterSweets.pricePerKg,
        isPureVeg: schema.masterSweets.isPureVeg,
        gstPercent: schema.masterSweets.gstPercent,
      })
      .from(schema.masterSweets)
      .innerJoin(
        schema.saleCenterSweets,
        and(
          eq(schema.saleCenterSweets.sweetId, schema.masterSweets.id),
          eq(schema.saleCenterSweets.saleCenterId, saleCenterId)
        )
      )
      .where(
        and(
          eq(schema.masterSweets.id, sweetId),
          eq(schema.saleCenterSweets.isActive, true)
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch sweet:', error);
    return null;
  }
}

/**
 * Validate that a sweet exists and is available at a given sale center.
 * Used before adding to cart or creating bookings.
 *
 * @param sweetId - The sweet ID
 * @param saleCenterId - The sale center ID
 * @returns Price per kg if available, null otherwise
 */
export async function getSweetPrice(
  sweetId: string,
  saleCenterId: string
): Promise<number | null> {
  try {
    const result = await db
      .select({ pricePerKg: schema.saleCenterSweets.pricePerKg })
      .from(schema.saleCenterSweets)
      .where(
        and(
          eq(schema.saleCenterSweets.sweetId, sweetId),
          eq(schema.saleCenterSweets.saleCenterId, saleCenterId),
          eq(schema.saleCenterSweets.isActive, true)
        )
      )
      .limit(1);

    return result[0]?.pricePerKg ?? null;
  } catch (error) {
    console.error('Failed to fetch sweet price:', error);
    return null;
  }
}

/**
 * Get multiple sweet prices in a single query.
 * Used for cart recalculation and pricing validation.
 *
 * @param sweetIds - Array of sweet IDs
 * @param saleCenterId - The sale center ID
 * @returns Map of sweetId -> pricePerKg
 */
export async function getSweetPrices(
  sweetIds: string[],
  saleCenterId: string
): Promise<Record<string, number>> {
  if (sweetIds.length === 0) return {};

  try {
    const results = await db
      .select({
        sweetId: schema.saleCenterSweets.sweetId,
        pricePerKg: schema.saleCenterSweets.pricePerKg,
      })
      .from(schema.saleCenterSweets)
      .where(
        and(
          inArray(schema.saleCenterSweets.sweetId, sweetIds),
          eq(schema.saleCenterSweets.saleCenterId, saleCenterId),
          eq(schema.saleCenterSweets.isActive, true)
        )
      );

    return Object.fromEntries(
      results.map(r => [r.sweetId, r.pricePerKg])
    );
  } catch (error) {
    console.error('Failed to fetch sweet prices:', error);
    return {};
  }
}

/**
 * Check if a sale center has active sweets available.
 * Used to verify that a sale center is operational.
 *
 * @param saleCenterId - The sale center ID
 * @returns true if sale center has active sweets
 */
export async function hasSaleCenterActiveSweets(
  saleCenterId: string
): Promise<boolean> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.saleCenterSweets)
      .where(
        and(
          eq(schema.saleCenterSweets.saleCenterId, saleCenterId),
          eq(schema.saleCenterSweets.isActive, true)
        )
      );

    return (result[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error('Failed to check sale center sweets:', error);
    return false;
  }
}
