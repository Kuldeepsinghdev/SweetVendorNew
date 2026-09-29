import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { masterSweets } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, requireApiRole } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireApiRole('super_admin');
    const { id } = await params;
    const sweet = await request.json();
    const result = await db.update(masterSweets).set(sweet).where(eq(masterSweets.id, id)).returning();
    return ok(result[0]);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    await requireApiRole('super_admin');
    const { id } = await params;
    await db.delete(masterSweets).where(eq(masterSweets.id, id));
    return ok({ success: true, id });
  });
}
