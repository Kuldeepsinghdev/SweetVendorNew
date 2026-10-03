import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/src/db/schema';
import { createMockDb } from './mockDb';

/**
 * Canonical database client for the whole app.
 *
 * If a real DATABASE_URL is configured, uses PostgreSQL via postgres-js and Drizzle.
 * Otherwise, falls back to the in-memory mock store populated with the Sahakar Bharati
 * reference catalog and seed users, allowing the application to run smoothly in ephemeral
 * environments without external database dependencies.
 */

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  '';

const isSupabase = dbUrl.includes('supabase');

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
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: !isPooled,
    });
  }
  return null;
}

const globalForDb = globalThis as unknown as {
  __sahakarPgClient?: ReturnType<typeof postgres> | null;
  __sahakarMockDb?: any;
};

let dbInstance: any;

if (dbUrl) {
  try {
    const client = globalForDb.__sahakarPgClient ?? createClient();
    globalForDb.__sahakarPgClient = client;
    if (client) {
      dbInstance = drizzle(client, { schema });
    }
  } catch (err) {
    console.warn('[AI Studio] PostgreSQL client init error — falling back to mock:', err);
  }
}

if (!dbInstance) {
  if (!globalForDb.__sahakarMockDb) {
    globalForDb.__sahakarMockDb = createMockDb();
  }
  dbInstance = globalForDb.__sahakarMockDb;
}

export const db = dbInstance as unknown as PostgresJsDatabase<typeof schema>;
export { schema };
