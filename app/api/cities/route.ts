import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { cities } from '@/src/db/schema';
import { handle, ok, cached, requireApiRole } from '@/lib/api/handler';

// Reads request query params (?cityId=) so Next treats it as dynamic; the CDN
// Cache-Control headers (via cached()) provide the edge caching. Kept for intent.
export const revalidate = 60;

export async function GET(request: NextRequest) {
  return handle(async () => {
    const cityId = request.nextUrl.searchParams.get('cityId');
    const data = await db.select().from(cities);
    const scoped = cityId ? data.filter((c: any) => c.id === cityId) : data;
    return cached(scoped, { sMaxAge: 60, staleWhileRevalidate: 300 });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireApiRole('city_admin');
    const city = await request.json();
    const result = await db
      .insert(cities)
      .values(city)
      .onConflictDoUpdate({ target: cities.id, set: city })
      .returning();
    return ok(result[0]);
  });
}
