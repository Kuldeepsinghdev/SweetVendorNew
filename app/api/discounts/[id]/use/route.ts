import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { discounts } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, fail } from '@/lib/api/handler';

/** Increment a coupon's usage counter when it is redeemed on a booking. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const existing = await db.select().from(discounts).where(eq(discounts.id, id));
    if (existing.length === 0) {
      return fail('Coupon not found', 404);
    }
    const nextUsed = (existing[0].timesUsed || 0) + 1;
    const result = await db
      .update(discounts)
      .set({ timesUsed: nextUsed })
      .where(eq(discounts.id, id))
      .returning();
    return ok(result[0]);
  });
}
