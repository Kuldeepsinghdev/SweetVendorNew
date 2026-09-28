import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { mitraApplications, users } from '@/src/db/schema';
import { indexUsersById, populateMitraApplication } from '@/src/db/populate';
import { handle, ok } from '@/lib/api/handler';

export async function GET() {
  return handle(async () => {
    const [data, allUsers] = await Promise.all([
      db.select().from(mitraApplications),
      db.select().from(users),
    ]);
    const usersById = indexUsersById(allUsers as any);
    return ok(data.map((m) => populateMitraApplication(m, usersById)));
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const appData = await request.json();
    const result = await db
      .insert(mitraApplications)
      .values(appData)
      .onConflictDoUpdate({ target: mitraApplications.id, set: appData })
      .returning();
    return ok(result[0]);
  });
}
