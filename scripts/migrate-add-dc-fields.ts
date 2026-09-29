/**
 * Migration: add contact_person to distribution_centers
 *             add distribution_center_id to users
 *
 * Run once against the live database:
 *   npx tsx scripts/migrate-add-dc-fields.ts
 *
 * Safe to run multiple times — uses IF NOT EXISTS / idempotent ALTER.
 */
import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  console.log('Running migration: add DC fields…');

  await sql`
    ALTER TABLE distribution_centers
    ADD COLUMN IF NOT EXISTS contact_person TEXT;
  `;
  console.log('  ✓ distribution_centers.contact_person');

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS distribution_center_id VARCHAR(64);
  `;
  console.log('  ✓ users.distribution_center_id');

  console.log('Migration complete.');
  await sql.end();
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
