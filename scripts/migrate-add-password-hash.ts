/**
 * Migration: add `password_hash` column to the `users` table.
 *
 * This separates the email+password credential from the phone+PIN credential.
 * Previously both login methods shared a single `pin_hash` column. After this
 * migration:
 *   - Phone + PIN login → checks `pin_hash`
 *   - Email + Password login → checks `password_hash` (falls back to `pin_hash`
 *     for existing accounts that haven't set a separate email password yet)
 *
 * Idempotent: safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
 *
 * Usage:
 *   npx tsx scripts/migrate-add-password-hash.ts
 */

import postgres from 'postgres';
import { config } from 'dotenv';

config();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

  try {
    console.log('Running migration: add password_hash column to users...');

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash text
    `;

    console.log('✅ Migration complete: users.password_hash column is ready.');
  } catch (err) {
    console.error('Migration failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
