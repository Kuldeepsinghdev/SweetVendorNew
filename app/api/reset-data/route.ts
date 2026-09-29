import { handle, ok, requireApiRole } from '@/lib/api/handler';

/**
 * Data reset endpoint — restricted to super_admin.
 *
 * The legacy seedDatabase/ensureTablesExist functions (src/db/seed.ts,
 * src/db/initDb.ts) were part of the retired SPA. This endpoint is kept
 * as a no-op placeholder until a new seed utility is wired up if needed.
 */
export async function POST() {
  return handle(async () => {
    await requireApiRole('super_admin');
    return ok({ success: true, message: 'Reset endpoint placeholder — schema is managed via drizzle-kit migrations.' });
  });
}
