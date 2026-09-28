import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { handle, ok, fail, normPhone, nowStamp } from '@/lib/api/handler';

export async function GET() {
  return handle(async () => {
    const data = await db.select().from(users);
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = (await request.json().catch(() => ({}))) || {};
    const phone = normPhone(body.phone);
    if (phone.length !== 10) {
      return fail('A valid 10-digit phone is required', 400);
    }

    // Resolve-or-create by normalized phone so a person is a single row.
    const all = await db.select().from(users);
    const existing = all.find((u: any) => normPhone(u.phone) === phone);
    if (existing) {
      return ok(existing);
    }

    const id = body.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
      id,
      name: body.name || 'ग्राहक',
      phone,
      email: body.email || null,
      role: body.role || 'customer',
      pinHash: body.pinHash || null,
      cityId: body.cityId || null,
      pincode: body.pincode || null,
      address: body.address || null,
      mustResetPin: body.mustResetPin ?? false,
      isActive: body.isActive ?? true,
      createdAt: body.createdAt || nowStamp(),
      updatedAt: null,
    };
    const result = await db
      .insert(users)
      .values(payload)
      .onConflictDoUpdate({ target: users.id, set: payload })
      .returning();
    return ok(result[0]);
  });
}
