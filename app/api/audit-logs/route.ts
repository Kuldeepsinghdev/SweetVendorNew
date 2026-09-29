import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { auditLogs } from '@/src/db/schema';
import { handle, ok, requireApiRole } from '@/lib/api/handler';

export async function GET() {
  return handle(async () => {
    await requireApiRole('city_admin');
    const data = await db.select().from(auditLogs);
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireApiRole('kendra');
    const log = await request.json();
    const result = await db.insert(auditLogs).values(log).returning();
    return ok(result[0]);
  });
}
