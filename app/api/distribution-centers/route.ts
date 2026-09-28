import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { distributionCenters } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok } from '@/lib/api/handler';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const saleCenterId = request.nextUrl.searchParams.get('saleCenterId');
    const data = saleCenterId
      ? await db
          .select()
          .from(distributionCenters)
          .where(eq(distributionCenters.saleCenterId, saleCenterId))
      : await db.select().from(distributionCenters);
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const center = await request.json();
    const result = await db
      .insert(distributionCenters)
      .values(center)
      .onConflictDoUpdate({ target: distributionCenters.id, set: center })
      .returning();
    return ok(result[0]);
  });
}
