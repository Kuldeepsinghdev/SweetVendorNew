import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/src/db/schema';

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  '';

/**
 * Next.js dev mode hot-reloads modules frequently. Without caching, every reload
 * opens a new postgres connection pool and exhausts the DB. Cache the client on
 * globalThis so a single pool survives reloads. In production a fresh module
 * graph is created once, so the cache is effectively a no-op there.
 */
const globalForDb = globalThis as unknown as {
  __sahakarPgClient?: ReturnType<typeof postgres>;
};

function createClient() {
  return dbUrl
    ? postgres(dbUrl, {
        ssl:
          dbUrl.includes('supabase') || process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      })
    : postgres({
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });
}

const client = globalForDb.__sahakarPgClient ?? createClient();
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__sahakarPgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
