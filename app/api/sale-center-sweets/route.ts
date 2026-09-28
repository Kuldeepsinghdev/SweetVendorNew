import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { saleCenterSweets } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { handle, ok, fail } from '@/lib/api/handler';

// Per-sale-centre sweet menu + pricing. Composite key (sale_center_id, sweet_id),
// so mutations key on both columns rather than a single `[id]` path param.

export async function GET(request: NextRequest) {
  return handle(async () => {
    const saleCenterId = request.nextUrl.searchParams.get('saleCenterId');
    const data = saleCenterId
      ? await db
          .select()
          .from(saleCenterSweets)
          .where(eq(saleCenterSweets.saleCenterId, saleCenterId))
      : await db.select().from(saleCenterSweets);
    return ok(data);
  });
}

// Upsert a single (sale_center_id, sweet_id) price/availability row.
export async function POST(request: NextRequest) {
  return handle(async () => {
    const row = await request.json();
    const result = await db
      .insert(saleCenterSweets)
      .values(row)
      .onConflictDoUpdate({
        target: [saleCenterSweets.saleCenterId, saleCenterSweets.sweetId],
        set: { pricePerKg: row.pricePerKg, isActive: row.isActive },
      })
      .returning();
    return ok(result[0]);
  });
}

export async function DELETE(request: NextRequest) {
  return handle(async () => {
    const saleCenterId = request.nextUrl.searchParams.get('saleCenterId');
    const sweetId = request.nextUrl.searchParams.get('sweetId');
    if (!saleCenterId || !sweetId) {
      return fail('saleCenterId and sweetId are required', 400);
    }
    await db
      .delete(saleCenterSweets)
      .where(
        and(
          eq(saleCenterSweets.saleCenterId, saleCenterId),
          eq(saleCenterSweets.sweetId, sweetId)
        )
      );
    return ok({ success: true, saleCenterId, sweetId });
  });
}
