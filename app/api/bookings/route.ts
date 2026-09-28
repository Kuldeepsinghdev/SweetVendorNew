import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { bookings, users } from '@/src/db/schema';
import { indexUsersById, populateBooking } from '@/src/db/populate';
import { handle, ok } from '@/lib/api/handler';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const cityId = request.nextUrl.searchParams.get('cityId');
    const centerId = request.nextUrl.searchParams.get('centerId');
    const [data, allUsers] = await Promise.all([
      db.select().from(bookings),
      db.select().from(users),
    ]);
    const usersById = indexUsersById(allUsers as any);
    // Optional scoping: city_admin -> ?cityId=, kendra owner -> ?centerId=.
    let scoped = data as any[];
    if (centerId) scoped = scoped.filter((b: any) => b.centerId === centerId);
    else if (cityId) scoped = scoped.filter((b: any) => b.cityId === cityId);
    return ok(scoped.map((b) => populateBooking(b, usersById)));
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const booking = await request.json();
    const result = await db
      .insert(bookings)
      .values(booking)
      .onConflictDoUpdate({ target: bookings.id, set: booking })
      .returning();
    return ok(result[0]);
  });
}
