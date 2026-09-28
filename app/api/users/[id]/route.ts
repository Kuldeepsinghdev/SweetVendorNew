import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, normPhone, nowStamp } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) || {};
    const updates: Record<string, any> = { ...body, updatedAt: nowStamp() };
    if (updates.phone) updates.phone = normPhone(updates.phone);
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return ok(result[0]);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await db.delete(users).where(eq(users.id, id));
    return ok({ success: true, id });
  });
}
