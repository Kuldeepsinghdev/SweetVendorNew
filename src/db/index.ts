import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  '';

const isSupabase = dbUrl.includes('supabase');
// pgBouncer (Supabase pooler, port 6543) does not support prepared statements.
const isPooled = dbUrl.includes('pgbouncer') || dbUrl.includes(':6543');

/**
 * Build a single postgres-js client. In the Next.js dev server every route
 * module can be re-evaluated on hot reload; without a global singleton each
 * reload opens a fresh pool and quickly exhausts Supabase's connection limit
 * (manifesting as "Failed query" 500s). We therefore cache the client on
 * globalThis and cap the pool small.
 */
function createClient() {
  if (dbUrl) {
    return postgres(dbUrl, {
      ssl: isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5, // keep well under Supabase's per-role connection ceiling
      idle_timeout: 20, // release idle connections quickly (seconds)
      // pgBouncer transaction pooling is incompatible with prepared statements.
      prepare: !isPooled,
    });
  }
  return postgres({
    host: process.env.SQL_HOST || 'localhost',
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 5,
    idle_timeout: 20,
  });
}

// Cache across hot reloads / module re-evaluations in dev.
const globalForDb = globalThis as unknown as {
  __sahakarPgClient?: ReturnType<typeof postgres>;
};

// Cache the client in ALL environments. On serverless (Vercel), a warm instance
// reuses module scope across invocations, so caching avoids opening a new pool
// on every request and keeps us well under Supabase's connection ceiling during
// the burst of parallel data-route calls on page load.
const client = globalForDb.__sahakarPgClient ?? createClient();
globalForDb.__sahakarPgClient = client;

export const db = drizzle(client, { schema });
