import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { cities, users } from '@/src/db/schema';
import { indexUsersById, populateCity } from '@/src/db/populate';
import { handle, ok } from '@/lib/api/handler';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const cityId = request.nextUrl.searchParams.get('cityId');
    const [data, allUsers] = await Promise.all([
      db.select().from(cities),
      db.select().from(users),
    ]);
    const usersById = indexUsersById(allUsers as any);
    // Optional city scoping: a city_admin only needs their own city.
    const scoped = cityId ? data.filter((c: any) => c.id === cityId) : data;
    return ok(scoped.map((c) => populateCity(c, usersById)));
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const city = await request.json();
    const result = await db
      .insert(cities)
      .values(city)
      .onConflictDoUpdate({ target: cities.id, set: city })
      .returning();
    return ok(result[0]);
  });
}
