import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { bookings, users } from '@/src/db/schema';
import { handle, ok, requireApiRole } from '@/lib/api/handler';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireApiRole('kendra');
    const cityId = request.nextUrl.searchParams.get('cityId');
    const centerId = request.nextUrl.searchParams.get('centerId');
    const data = await db.select().from(bookings);
    // Optional scoping: city_admin -> ?cityId=, kendra owner -> ?centerId=.
    let scoped = data as any[];
    if (centerId) scoped = scoped.filter((b: any) => b.centerId === centerId);
    else if (cityId) scoped = scoped.filter((b: any) => b.cityId === cityId);
    return ok(scoped);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    // TODO(migration Task 7): customer-reachable booking write. Replaced by a server-authoritative Server Action (recompute totals/discounts server-side, then require a customer/admin session). Left open here so the running SPA checkout keeps working until then.
    const booking = await request.json();
    const result = await db
      .insert(bookings)
      .values(booking)
      .onConflictDoUpdate({ target: bookings.id, set: booking })
      .returning();
    return ok(result[0]);
  });
}
