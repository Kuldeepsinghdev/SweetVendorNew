import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { mitraApplications } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, requireApiRole } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireApiRole('city_admin');
    const { id } = await params;
    const appData = await request.json();
    const result = await db
      .update(mitraApplications)
      .set(appData)
      .where(eq(mitraApplications.id, id))
      .returning();
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
    await db.delete(mitraApplications).where(eq(mitraApplications.id, id));
    return ok({ success: true, id });
  });
}
