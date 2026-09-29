import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { bookings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, requireApiRole } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireApiRole('kendra');
    const { id } = await params;
    const booking = await request.json();
    const result = await db.update(bookings).set(booking).where(eq(bookings.id, id)).returning();
    return ok(result[0]);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireApiRole('kendra');
    const { id } = await params;
    await db.delete(bookings).where(eq(bookings.id, id));
    return ok({ success: true, id });
  });
}
