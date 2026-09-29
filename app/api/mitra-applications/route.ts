import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { mitraApplications } from '@/src/db/schema';
import { handle, ok, requireApiRole } from '@/lib/api/handler';

export async function GET() {
  return handle(async () => {
    await requireApiRole('city_admin');
    const data = await db.select().from(mitraApplications);
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    // Public mitra application submission — no auth required. Replaced by
    // submitMitraApplicationAction Server Action for the ported mitra/apply
    // flow; this route is kept as a fallback for compatibility.
    const appData = await request.json();
    const result = await db
      .insert(mitraApplications)
      .values(appData)
      .onConflictDoUpdate({ target: mitraApplications.id, set: appData })
      .returning();
    return ok(result[0]);
  });
}
