import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { festivals } from '@/src/db/schema';
import { handle, ok, cached, requireApiRole } from '@/lib/api/handler';

// Back the GET response with Next's data cache (ISR-style) for 5 min.
export const revalidate = 300;

export async function GET() {
  return handle(async () => {
    const data = await db.select().from(festivals);
    // Festival config changes rarely — cache at the edge for 5 min.
    return cached(data, { sMaxAge: 300, staleWhileRevalidate: 600 });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireApiRole('super_admin');
    const festival = await request.json();
    const result = await db
      .insert(festivals)
      .values(festival)
      .onConflictDoUpdate({ target: festivals.id, set: festival })
      .returning();
    return ok(result[0]);
  });
}
