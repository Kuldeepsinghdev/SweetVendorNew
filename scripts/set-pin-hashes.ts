/**
 * Script to set PIN hashes for admin users in the database.
 * 
 * Usage: npx tsx scripts/set-pin-hashes.ts
 * 
 * This script:
 * 1. Finds all users with admin roles (kendra, city_admin, super_admin)
 * 2. Sets their PIN hash to the default PIN '1000'
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';

const ADMIN_ROLES = ['kendra', 'city_admin', 'super_admin'];
const MITRA_ROLE = 'mitra';
const DEFAULT_PIN = '1000';

async function main() {
  console.log('Setting PIN hashes for admin and mitra users...');
  
  // Hash the default PIN
  const pinHash = await bcrypt.hash(DEFAULT_PIN, 10);
  
  // Find all admin users without a PIN hash
  const adminUsers = await db
    .select()
    .from(users)
    .where(inArray(users.role, [...ADMIN_ROLES, MITRA_ROLE]));
  
  console.log(`Found ${adminUsers.length} admin/mitra users`);
  
  for (const user of adminUsers) {
    if (user.pinHash) {
      console.log(`  [SKIP] ${user.phone} (${user.role}) - already has PIN`);
      continue;
    }
    
    await db
      .update(users)
      .set({ pinHash, updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));
    
    console.log(`  [UPDATED] ${user.phone} (${user.role}) - PIN set to '${DEFAULT_PIN}'`);
  }
  
  console.log('\nDone! All admin/mitra users now have PIN hashes.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
