import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { saleCenters, users } from '@/src/db/schema';
import { indexUsersById, populateSaleCenter } from '@/src/db/populate';
import { handle, ok } from '@/lib/api/handler';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const cityId = request.nextUrl.searchParams.get('cityId');
    const centerId = request.nextUrl.searchParams.get('centerId');
    const [data, allUsers] = await Promise.all([
      db.select().from(saleCenters),
      db.select().from(users),
    ]);
    const usersById = indexUsersById(allUsers as any);
    // Optional scoping: city_admin -> ?cityId=, kendra owner -> ?centerId=.
    let scoped = data as any[];
    if (centerId) scoped = scoped.filter((c: any) => c.id === centerId);
    else if (cityId) scoped = scoped.filter((c: any) => c.cityId === cityId);
    return ok(scoped.map((c) => populateSaleCenter(c, usersById)));
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const center = await request.json();
    const result = await db
      .insert(saleCenters)
      .values(center)
      .onConflictDoUpdate({ target: saleCenters.id, set: center })
      .returning();
    return ok(result[0]);
  });
}
