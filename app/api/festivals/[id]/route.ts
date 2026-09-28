import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { festivals } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const festival = await request.json();
    const result = await db.update(festivals).set(festival).where(eq(festivals.id, id)).returning();
    return ok(result[0]);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await db.delete(festivals).where(eq(festivals.id, id));
    return ok({ success: true, id });
  });
}
