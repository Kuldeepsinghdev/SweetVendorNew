import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { distributionCenters } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const center = await request.json();
    const result = await db
      .update(distributionCenters)
      .set(center)
      .where(eq(distributionCenters.id, id))
      .returning();
    return ok(result[0]);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await db.delete(distributionCenters).where(eq(distributionCenters.id, id));
    return ok({ success: true, id });
  });
}
