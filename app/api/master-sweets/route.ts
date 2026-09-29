import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { masterSweets } from '@/src/db/schema';
import { handle, ok, cached, requireApiRole } from '@/lib/api/handler';

// Back the GET response with Next's data cache (ISR-style) for 5 min, alongside
// the CDN Cache-Control headers. POST/mutations bypass this (dynamic).
export const revalidate = 300;

export async function GET() {
  return handle(async () => {
    const data = await db.select().from(masterSweets);
    // Master catalog changes rarely — cache at the edge for 5 min.
    return cached(data, { sMaxAge: 300, staleWhileRevalidate: 600 });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireApiRole('super_admin');
    const sweet = await request.json();
    const result = await db
      .insert(masterSweets)
      .values(sweet)
      .onConflictDoUpdate({ target: masterSweets.id, set: sweet })
      .returning();
    return ok(result[0]);
  });
}
