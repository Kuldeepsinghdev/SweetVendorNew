import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/src/db/schema';

/**
 * Canonical database client for the whole app.
 *
 * All reads (RSC/Server Actions) and the interim API route handlers import the
 * `db` exported here. There must be exactly ONE postgres-js pool per process:
 * Next.js dev mode hot-reloads modules frequently and serverless (Vercel) warm
 * instances reuse module scope across invocations, so without a global cache
 * every reload/invocation opens a fresh pool and quickly exhausts the database
 * connection ceiling (surfacing as app-wide "Failed query" 500s). We therefore
 * cache the client on globalThis.
 */

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
// queries (e.g. many data routes firing on page load after a server restart)
// fails and surfaces as 500s across the app.
const isPooled =
  dbUrl.includes('pgbouncer') ||
  dbUrl.includes(':6543') ||
  dbUrl.includes('pooler.supabase.com');

function createClient() {
  if (dbUrl) {
    return postgres(dbUrl, {
      ssl:
        isSupabase || process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      max: 5, // keep well under the per-role connection ceiling
      idle_timeout: 20, // release idle connections quickly (seconds)
      // Fail fast on a dead/half-open connection (e.g. one recycled by the
      // pooler while our cached client still references it after a dev restart)
      // so postgres-js reconnects instead of the request hanging then 500'ing.
      connect_timeout: 10, // seconds
      // Transaction pooling is incompatible with prepared statements. Turning
      // prepare OFF also means there are no server-side prepared-statement names
      // to go stale across reconnects — the exact condition that produced
      // app-wide 500s after a server restart.
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

// Cache across hot reloads / module re-evaluations in dev AND across warm
// serverless invocations in production.
const globalForDb = globalThis as unknown as {
  __sahakarPgClient?: ReturnType<typeof postgres>;
};

const client = globalForDb.__sahakarPgClient ?? createClient();
globalForDb.__sahakarPgClient = client;

export const db = drizzle(client, { schema });
export { schema };
