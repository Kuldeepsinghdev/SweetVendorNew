import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { masterSweets } from '@/src/db/schema';
import { handle, ok } from '@/lib/api/handler';

export async function GET() {
  return handle(async () => {
    const data = await db.select().from(masterSweets);
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const sweet = await request.json();
    const result = await db
      .insert(masterSweets)
      .values(sweet)
      .onConflictDoUpdate({ target: masterSweets.id, set: sweet })
      .returning();
    return ok(result[0]);
  });
}
