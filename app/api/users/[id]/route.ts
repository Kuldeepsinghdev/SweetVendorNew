import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, fail, normPhone, normEmail, nowStamp } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) || {};
    const updates: Record<string, any> = { ...body, updatedAt: nowStamp() };
    if (updates.phone) updates.phone = normPhone(updates.phone);

    // Normalize email if present. Only touch the column when the caller sent an
    // `email` key so we never blank it out on unrelated updates.
    if ('email' in body) {
      const email = normEmail(body.email);
      updates.email = email;

      // Email is a unique login credential — refuse to move it to another user.
      if (email) {
        const all = await db.select().from(users);
        const emailOwner = all.find(
          (u: any) => normEmail(u.email) === email && u.id !== id
        );
        if (emailOwner) {
          return fail('This email is already registered to another account', 409);
        }
      }
    }

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
