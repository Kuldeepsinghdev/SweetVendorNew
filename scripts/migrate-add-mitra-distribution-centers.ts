import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  console.log('Running migration: add Mitra distribution-center arrays…');

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS distribution_center_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
  `;
  await sql`
    ALTER TABLE mitra_applications
    ADD COLUMN IF NOT EXISTS distribution_center_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
  `;

  await sql`
    UPDATE users
    SET distribution_center_ids = jsonb_build_array(distribution_center_id)
    WHERE distribution_center_id IS NOT NULL
      AND distribution_center_ids = '[]'::jsonb;
  `;
  await sql`
    UPDATE mitra_applications
    SET distribution_center_ids = jsonb_build_array(center_id)
    WHERE center_id IS NOT NULL
      AND distribution_center_ids = '[]'::jsonb;
  `;

  console.log('  ✓ users.distribution_center_ids');
  console.log('  ✓ mitra_applications.distribution_center_ids');
  console.log('Migration complete.');
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
