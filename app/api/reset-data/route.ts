import { seedDatabase } from '@/src/db/seed';
import { ensureTablesExist } from '@/src/db/initDb';
import { handle, ok } from '@/lib/api/handler';

/** Alias of /api/seed — force reseed of the database. */
export async function POST() {
  return handle(async () => {
    await ensureTablesExist();
    await seedDatabase(true);
    return ok({ success: true, message: 'Database initialized & seeded successfully' });
  });
}
