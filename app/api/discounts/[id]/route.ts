import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { discounts } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, requireApiRole } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireApiRole('city_admin');
    const { id } = await params;
    const updates = await request.json();
    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }
    const result = await db.update(discounts).set(updates).where(eq(discounts.id, id)).returning();
    return ok(result[0]);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireApiRole('city_admin');
    const { id } = await params;
    await db.delete(discounts).where(eq(discounts.id, id));
    return ok({ success: true, id });
  });
}
