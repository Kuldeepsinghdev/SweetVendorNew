import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { distributionCenters } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, cached, requireApiRole } from '@/lib/api/handler';

// This route reads request query params (?saleCenterId=), so Next treats it as
// dynamic and the data cache does not engage — the CDN Cache-Control headers
// (set via cached()) provide the edge caching instead. Kept for intent.
export const revalidate = 120;

export async function GET(request: NextRequest) {
  return handle(async () => {
    const saleCenterId = request.nextUrl.searchParams.get('saleCenterId');
    const data = saleCenterId
      ? await db
          .select()
          .from(distributionCenters)
          .where(eq(distributionCenters.saleCenterId, saleCenterId))
      : await db.select().from(distributionCenters);
    // Location data changes infrequently — short edge cache (keyed per URL, so
    // the ?saleCenterId= variants cache independently).
    return cached(data, { sMaxAge: 120, staleWhileRevalidate: 300 });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireApiRole('city_admin');
    const center = await request.json();
    const result = await db
      .insert(distributionCenters)
      .values(center)
      .onConflictDoUpdate({ target: distributionCenters.id, set: center })
      .returning();
    return ok(result[0]);
  });
}
