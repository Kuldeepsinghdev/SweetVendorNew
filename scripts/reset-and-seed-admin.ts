/**
 * DESTRUCTIVE: wipe every table, then create a single super_admin user.
 *
 * Usage:
 *   npx tsx scripts/reset-and-seed-admin.ts --confirm
 *   (or) CONFIRM=yes npx tsx scripts/reset-and-seed-admin.ts
 *
 * Optional env overrides for the super admin:
 *   ADMIN_NAME, ADMIN_PHONE (10 digits), ADMIN_EMAIL
 *   ADMIN_PASSWORD (>= 8 chars, primary email login) and/or ADMIN_PIN (4 digits)
 *
 * Credential precedence:
 *   - Email + ADMIN_PASSWORD is the primary login. If ADMIN_PASSWORD is set it
 *     becomes the stored credential (bcrypt) and the login password.
 *   - If ADMIN_PASSWORD is not set, a 4-digit ADMIN_PIN (or random) is used so
 *     phone login still works. The same hash backs both email and phone login.
 *
 * Safety:
 *   - Refuses to run without explicit confirmation.
 *   - Takes a full JSON backup of all tables (backups/) before deleting.
 *   - Deletes in FK-safe child -> parent order.
 *   - The credential is stored as a bcrypt hash; the plaintext is printed once.
 */

import './../src/env';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { db } from '../src/db/index';
import * as schema from '../src/db/schema';

const CONFIRMED =
  process.argv.includes('--confirm') || (process.env.CONFIRM || '').toLowerCase() === 'yes';

const normPhone = (p: string) => (p || '').replace(/\D/g, '').slice(-10);
const normEmail = (e: string) => (e || '').trim().toLowerCase();

// Delete order respects the enforced foreign keys (children before parents).
// `users` is last because cities/sale_centers/bookings/etc. reference it.
const DELETE_ORDER: [string, any][] = [
  ['bookings', schema.bookings],
  ['sale_center_sweets', schema.saleCenterSweets],
  ['distribution_centers', schema.distributionCenters],
  ['mitra_applications', schema.mitraApplications],
  ['discounts', schema.discounts],
  ['sale_centers', schema.saleCenters],
  ['cities', schema.cities],
  ['master_sweets', schema.masterSweets],
  ['festivals', schema.festivals],
  ['audit_logs', schema.auditLogs],
  ['notification_templates', schema.notificationTemplates],
  ['users', schema.users],
];

const ALL_TABLES: [string, any][] = [
  ['users', schema.users],
  ['master_sweets', schema.masterSweets],
  ['cities', schema.cities],
  ['sale_centers', schema.saleCenters],
  ['distribution_centers', schema.distributionCenters],
  ['sale_center_sweets', schema.saleCenterSweets],
  ['festivals', schema.festivals],
  ['mitra_applications', schema.mitraApplications],
  ['bookings', schema.bookings],
  ['discounts', schema.discounts],
  ['audit_logs', schema.auditLogs],
  ['notification_templates', schema.notificationTemplates],
];

async function backup() {
  const dump: Record<string, any[]> = {};
  for (const [name, table] of ALL_TABLES) {
    try {
      dump[name] = await db.select().from(table);
    } catch (e) {
      dump[name] = [];
      console.warn(`  backup: skipped ${name}: ${(e as Error).message}`);
    }
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `db-backup-before-reset-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(dump, null, 2));
  console.log(`Backup written to: ${file}`);
}

async function main() {
  if (!CONFIRMED) {
    console.error(
      'Refusing to run: this DELETES ALL DATA in every table.\n' +
      'Re-run with --confirm (or CONFIRM=yes) once you are sure.'
    );
    process.exit(1);
  }

  // --- Super admin details (overridable via env) ---
  const name = process.env.ADMIN_NAME || 'Super Admin';
  const phone = normPhone(process.env.ADMIN_PHONE || '9000000001');
  const email = normEmail(process.env.ADMIN_EMAIL || 'superadmin@sahakar.local');

  if (phone.length !== 10) {
    console.error(`Invalid ADMIN_PHONE "${process.env.ADMIN_PHONE}" — need 10 digits.`);
    process.exit(1);
  }
  if (!email.includes('@')) {
    console.error(`Invalid ADMIN_EMAIL "${process.env.ADMIN_EMAIL}" — need a valid email.`);
    process.exit(1);
  }

  // Credential: prefer ADMIN_PASSWORD (email login, >= 8 chars). Otherwise fall
  // back to a 4-digit PIN (phone login). The same bcrypt hash backs both.
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const usingPassword = adminPassword.length > 0;
  const pin = (process.env.ADMIN_PIN || '').replace(/\D/g, '') ||
    String(Math.floor(1000 + Math.random() * 9000)); // random 4-digit if unset

  if (usingPassword && adminPassword.length < 8) {
    console.error('Invalid ADMIN_PASSWORD — use at least 8 characters.');
    process.exit(1);
  }
  if (!usingPassword && !/^\d{4}$/.test(pin)) {
    console.error(`Invalid ADMIN_PIN "${pin}" — need exactly 4 digits.`);
    process.exit(1);
  }

  const credential = usingPassword ? adminPassword : pin;

  console.log('Backing up current data before wipe...');
  await backup();

  console.log('Deleting all rows (child -> parent order)...');
  for (const [tableName, table] of DELETE_ORDER) {
    try {
      await db.delete(table);
      console.log(`  cleared ${tableName}`);
    } catch (e) {
      console.error(`  FAILED clearing ${tableName}: ${(e as Error).message}`);
      throw e;
    }
  }

  console.log('Creating super_admin user...');
  const now = new Date().toISOString();
  const pinHash = await bcrypt.hash(credential, 10);
  const id = `usr_superadmin_${phone}`;

  await db.insert(schema.users).values({
    id,
    name,
    phone,
    email,
    role: 'super_admin',
    pinHash,
    cityId: null,
    pincode: null,
    address: null,
    mustResetPin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log('\n========================================');
  console.log(' DATABASE RESET COMPLETE — SUPER ADMIN CREATED');
  console.log('========================================');
  console.log(`  Name   : ${name}`);
  console.log(`  Role   : super_admin`);
  console.log(`  Email  : ${email}   <-- primary login username`);
  if (usingPassword) {
    console.log(`  Password: ${adminPassword}   <-- primary login password`);
  } else {
    console.log(`  Password: (not set — using 4-digit PIN below)`);
  }
  console.log(`  Phone  : ${phone}   <-- alternate login username`);
  console.log(`  PIN    : ${pin}     <-- phone login PIN (4-digit)`);
  console.log(`  User ID: ${id}`);
  console.log('========================================');
  console.log('Store the credential now; it is stored only as a bcrypt hash in the DB.');
  if (!usingPassword) {
    console.log('Tip: set ADMIN_PASSWORD to provision an email/password login directly.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
