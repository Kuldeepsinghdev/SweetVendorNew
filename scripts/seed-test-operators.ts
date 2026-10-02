/**
 * Seed script: create / upsert all 5 test operator accounts for development.
 *
 * Each account supports BOTH login methods:
 *   1. Phone + PIN  → verified against `pin_hash`
 *   2. Email + Password → verified against `password_hash`
 *
 * Credentials are read from environment variables (TEST_* prefix). If the env
 * vars are not set, the script exits with an error — plaintext credentials are
 * NEVER hardcoded in source.
 *
 * Usage (run once after checkout or after a DB reset):
 *   npx tsx scripts/seed-test-operators.ts
 *
 * Prerequisites:
 *   1. Run the migration first:
 *      npx tsx scripts/migrate-add-password-hash.ts
 *   2. Ensure the following env vars are set in .env:
 *      TEST_SUPER_ADMIN_PHONE / _PIN_HASH / _EMAIL / _PASSWORD_HASH / _NAME
 *      TEST_CITY_ADMIN_PHONE  / _PIN_HASH / _EMAIL / _PASSWORD_HASH / _NAME / _CITY_ID
 *      TEST_KENDRA_PHONE      / _PIN_HASH / _EMAIL / _PASSWORD_HASH / _NAME / _CITY_ID / _CENTER_ID
 *      TEST_MITRA_PHONE       / _PIN_HASH / _EMAIL / _PASSWORD_HASH / _NAME / _CITY_ID / _CENTER_ID / _DC_ID
 *      TEST_CUSTOMER_PHONE    / _PIN_HASH / _EMAIL / _PASSWORD_HASH / _NAME
 *
 * The script is IDEMPOTENT: re-running it updates existing test accounts (by
 * phone) rather than creating duplicates.
 */

import { config } from 'dotenv';
config();

import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// ── helpers ──────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
  return val;
}

function optionalEnv(key: string): string | null {
  return process.env[key] ?? null;
}

// ── test operator definitions (all credentials come from env) ─────────────────

interface TestOperator {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  pinHash: string;
  passwordHash: string;
  cityId: string | null;
  distributionCenterId: string | null;
  mustResetPin: boolean;
  isActive: boolean;
}

function buildOperators(): TestOperator[] {
  return [
    {
      id:           'usr_test_super_admin',
      name:         requireEnv('TEST_SUPER_ADMIN_NAME'),
      phone:        requireEnv('TEST_SUPER_ADMIN_PHONE'),
      email:        requireEnv('TEST_SUPER_ADMIN_EMAIL'),
      role:         'super_admin',
      pinHash:      requireEnv('TEST_SUPER_ADMIN_PIN_HASH'),
      passwordHash: requireEnv('TEST_SUPER_ADMIN_PASSWORD_HASH'),
      cityId:       null,
      distributionCenterId: null,
      mustResetPin: false,
      isActive:     true,
    },
    {
      id:           'usr_test_city_admin',
      name:         requireEnv('TEST_CITY_ADMIN_NAME'),
      phone:        requireEnv('TEST_CITY_ADMIN_PHONE'),
      email:        requireEnv('TEST_CITY_ADMIN_EMAIL'),
      role:         'city_admin',
      pinHash:      requireEnv('TEST_CITY_ADMIN_PIN_HASH'),
      passwordHash: requireEnv('TEST_CITY_ADMIN_PASSWORD_HASH'),
      cityId:       optionalEnv('TEST_CITY_ADMIN_CITY_ID'),
      distributionCenterId: null,
      mustResetPin: false,
      isActive:     true,
    },
    {
      id:           'usr_test_kendra',
      name:         requireEnv('TEST_KENDRA_NAME'),
      phone:        requireEnv('TEST_KENDRA_PHONE'),
      email:        requireEnv('TEST_KENDRA_EMAIL'),
      role:         'kendra',
      pinHash:      requireEnv('TEST_KENDRA_PIN_HASH'),
      passwordHash: requireEnv('TEST_KENDRA_PASSWORD_HASH'),
      cityId:       optionalEnv('TEST_KENDRA_CITY_ID'),
      distributionCenterId: null,
      mustResetPin: false,
      isActive:     true,
    },
    {
      id:           'usr_test_mitra',
      name:         requireEnv('TEST_MITRA_NAME'),
      phone:        requireEnv('TEST_MITRA_PHONE'),
      email:        requireEnv('TEST_MITRA_EMAIL'),
      role:         'mitra',
      pinHash:      requireEnv('TEST_MITRA_PIN_HASH'),
      passwordHash: requireEnv('TEST_MITRA_PASSWORD_HASH'),
      cityId:       optionalEnv('TEST_MITRA_CITY_ID'),
      distributionCenterId: optionalEnv('TEST_MITRA_DC_ID'),
      mustResetPin: false,
      isActive:     true,
    },
    {
      id:           'usr_test_customer',
      name:         requireEnv('TEST_CUSTOMER_NAME'),
      phone:        requireEnv('TEST_CUSTOMER_PHONE'),
      email:        requireEnv('TEST_CUSTOMER_EMAIL'),
      role:         'customer',
      pinHash:      requireEnv('TEST_CUSTOMER_PIN_HASH'),
      passwordHash: requireEnv('TEST_CUSTOMER_PASSWORD_HASH'),
      cityId:       null,
      distributionCenterId: null,
      mustResetPin: false,
      isActive:     true,
    },
  ];
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Sahakar Bharati — Seed Test Operators');
  console.log('═══════════════════════════════════════════════════');

  const operators = buildOperators();
  const now = new Date().toISOString();

  for (const op of operators) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, op.phone))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(users)
        .set({
          name:                 op.name,
          email:                op.email,
          role:                 op.role,
          pinHash:              op.pinHash,
          passwordHash:         op.passwordHash,
          cityId:               op.cityId,
          distributionCenterId: op.distributionCenterId,
          mustResetPin:         op.mustResetPin,
          isActive:             op.isActive,
          updatedAt:            now,
        })
        .where(eq(users.phone, op.phone));

      console.log(`  ✔ updated  [${op.role.padEnd(11)}]  ${op.phone}  ${op.email}`);
    } else {
      // Insert new record
      await db.insert(users).values({
        id:                   op.id,
        name:                 op.name,
        phone:                op.phone,
        email:                op.email,
        role:                 op.role,
        pinHash:              op.pinHash,
        passwordHash:         op.passwordHash,
        cityId:               op.cityId,
        distributionCenterId: op.distributionCenterId,
        distributionCenterIds: [],
        mustResetPin:         op.mustResetPin,
        isActive:             op.isActive,
        createdAt:            now,
        updatedAt:            now,
      });

      console.log(`  ✔ created  [${op.role.padEnd(11)}]  ${op.phone}  ${op.email}`);
    }
  }

  console.log('');
  console.log('All test operators seeded. See TEST-ACCOUNTS.md for login instructions.');
  console.log('═══════════════════════════════════════════════════');

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
