import { handle, ok, requireApiRole } from '@/lib/api/handler';

/**
 * Database seed endpoint — restricted to super_admin.
 *
 * The legacy seedDatabase/ensureTablesExist functions (src/db/seed.ts,
 * src/db/initDb.ts) were part of the retired SPA. The DB schema is now
 * maintained via drizzle-kit migrations. This endpoint is kept as a
 * no-op placeholder until a new seed utility is wired up if needed.
 */
export async function POST() {
  return handle(async () => {
    await requireApiRole('super_admin');
    return ok({ success: true, message: 'Seed endpoint placeholder — schema is managed via drizzle-kit migrations.' });
  });
}
