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
// The Supabase connection pooler (supavisor / pgBouncer) runs in transaction
// mode and does NOT support prepared statements. It is reachable both on the
// transaction port 6543 and via the pooler hostname on 5432 — so detect it by
// the `pooler.supabase.com` host and the `pgbouncer` flag as well as :6543.
// If prepared statements are left on against the pooler, a burst of parallel
// queries (e.g. every data route firing on page load after a server restart)
// fails and surfaces as 500s across the app.
const isPooled =
  dbUrl.includes('pgbouncer') ||
  dbUrl.includes(':6543') ||
  dbUrl.includes('pooler.supabase.com');

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
      // Fail fast on a dead/half-open connection (e.g. one recycled by the
      // pooler while our cached client still references it after a dev restart)
      // so postgres-js reconnects instead of the request hanging then 500'ing.
      connect_timeout: 10, // seconds
      // The Supabase pooler uses transaction pooling, which is incompatible with
      // prepared statements. Turning prepare OFF also means there are no
      // server-side prepared-statement names to go stale across reconnects —
      // the exact condition that produced app-wide 500s after a server restart.
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
    connect_timeout: 10,
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
