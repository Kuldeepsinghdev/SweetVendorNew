import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { handle, ok, fail, normPhone, requireApiRole } from '@/lib/api/handler';

/** Look up a single user by (normalized) phone — used by login to resolve identity. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  return handle(async () => {
    await requireApiRole('city_admin');
    const { phone: raw } = await params;
    const phone = normPhone(raw);
    const all = await db.select().from(users);
    const match = all.find((u: any) => normPhone(u.phone) === phone);
    if (!match) return fail('User not found', 404);
    return ok(match);
  });
}
