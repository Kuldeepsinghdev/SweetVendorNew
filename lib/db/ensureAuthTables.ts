import 'server-only';
import postgres from 'postgres';

/**
 * Self-healing creation of the auth-support tables the password-reset flow
 * depends on (currently `password_resets`).
 *
 * The main schema is created by src/db/initDb.ts's ensureTablesExist(), which
 * only runs on POST /api/seed or /api/reset-data. To avoid requiring a manual
 * seed step after deploy, the reset routes call this once so the table always
 * exists before they query it. It is idempotent (CREATE TABLE IF NOT EXISTS)
 * and cached per process so it runs at most once per cold start.
 */

let ensured: Promise<void> | null = null;

function makeClient() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    '';

  return dbUrl
    ? postgres(dbUrl, {
        ssl:
          dbUrl.includes('supabase') || process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        max: 1,
      })
    : postgres({
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 1,
      });
}

export function ensureAuthTables(): Promise<void> {
  if (ensured) return ensured;

  ensured = (async () => {
    const sql = makeClient();
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS password_resets (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          email TEXT NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS password_resets_token_idx ON password_resets (token_hash);`;
    } catch (err) {
      // Reset the memo so a later request can retry; rethrow so the caller can
      // decide how to respond.
      ensured = null;
      throw err;
    } finally {
      await sql.end();
    }
  })();

  return ensured;
}
