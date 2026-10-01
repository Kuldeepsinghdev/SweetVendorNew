import 'server-only';
import postgres from 'postgres';

/**
 * Self-healing creation of the auth-support tables the password-reset flow
 * depends on (currently `password_resets` and `login_otps`).
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

      // Create login_otps table for Mitra OTP authentication
      await sql`
        CREATE TABLE IF NOT EXISTS login_otps (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id),
          email_address TEXT NOT NULL,
          otp_code VARCHAR(6) NOT NULL,
          method VARCHAR(32) NOT NULL DEFAULT 'email',
          attempts INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 5,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          verified_at TEXT,
          CONSTRAINT otp_code_format CHECK (otp_code ~ '^[0-9]{6}$')
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS login_otps_user_method_idx ON login_otps(user_id, method);`;
      await sql`CREATE INDEX IF NOT EXISTS login_otps_expires_at_idx ON login_otps(expires_at);`;
      await sql`CREATE INDEX IF NOT EXISTS login_otps_user_active_idx ON login_otps(user_id, verified_at DESC NULLS FIRST, expires_at DESC);`;
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
