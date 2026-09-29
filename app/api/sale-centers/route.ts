import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { saleCenters } from '@/src/db/schema';
import { handle, ok, cached, requireApiRole } from '@/lib/api/handler';

// Reads request query params (?cityId=/?centerId=) so Next treats it as dynamic;
// the CDN Cache-Control headers (via cached()) provide the edge caching. Kept for intent.
export const revalidate = 60;

export async function GET(request: NextRequest) {
  return handle(async () => {
    const cityId = request.nextUrl.searchParams.get('cityId');
    const centerId = request.nextUrl.searchParams.get('centerId');
    const data = await db.select().from(saleCenters);
    let scoped = data as any[];
    if (centerId) scoped = scoped.filter((c: any) => c.id === centerId);
    else if (cityId) scoped = scoped.filter((c: any) => c.cityId === cityId);
    return cached(scoped, { sMaxAge: 60, staleWhileRevalidate: 300 });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireApiRole('city_admin');
    const center = await request.json();
    const result = await db
      .insert(saleCenters)
      .values(center)
      .onConflictDoUpdate({ target: saleCenters.id, set: center })
      .returning();
    return ok(result[0]);
  });
}
