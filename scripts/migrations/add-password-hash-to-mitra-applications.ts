/**
 * Migration: Add password_hash column to mitra_applications table
 * 
 * This migration adds support for password-based authentication for Mitra applicants.
 * The password is hashed (bcrypt) during application submission and transferred to
 * the users.pin_hash field upon admin approval.
 * 
 * Run: npx tsx scripts/migrations/add-password-hash-to-mitra-applications.ts
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Adding password_hash column to mitra_applications...');

  try {
    // Add password_hash column (nullable for backward compatibility with existing applications)
    await db.execute(sql`
      ALTER TABLE mitra_applications 
      ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `);

    console.log('✅ Migration completed successfully!');
    console.log('   - Added password_hash column to mitra_applications table');
    console.log('   - Existing applications without passwords remain valid');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Self-executing migration
runMigration()
  .then(() => {
    console.log('\n✅ All migrations applied successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
