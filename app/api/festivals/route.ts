import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { festivals } from '@/src/db/schema';
import { handle, ok } from '@/lib/api/handler';

export async function GET() {
  return handle(async () => {
    const data = await db.select().from(festivals);
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const festival = await request.json();
    const result = await db
      .insert(festivals)
      .values(festival)
      .onConflictDoUpdate({ target: festivals.id, set: festival })
      .returning();
    return ok(result[0]);
  });
}
