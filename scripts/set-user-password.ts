/**
 * Provision or update a user's email + password (the primary login credential).
 *
 * Email is the main login method for the app. This script lets an operator set
 * or reset the password for an existing user, and optionally set/normalize the
 * user's email so they can log in with it.
 *
 * The credential is stored as a bcrypt hash in `users.pin_hash` — the same
 * column that backs both email/password and phone/PIN login. The plaintext is
 * never persisted; it is only echoed once to the console for handoff.
 *
 * Usage:
 *   npx tsx scripts/set-user-password.ts --email user@example.com --password 'S3cret!!'
 *   npx tsx scripts/set-user-password.ts --phone 9829098245 --password 'S3cret!!'
 *   npx tsx scripts/set-user-password.ts --phone 9829098245 \
 *       --set-email user@example.com --password 'S3cret!!'
 *
 * Flags:
 *   --email <email>        Look up the user by this (normalized) email.
 *   --phone <phone>        Look up the user by this (normalized 10-digit) phone.
 *   --password <password>  New password (>= 8 chars). Mutually usable with --pin.
 *   --pin <4-digit>        New 4-digit PIN (alternative to --password).
 *   --set-email <email>    Also set/replace the user's email (normalized).
 *
 * Exactly one lookup flag (--email or --phone) is required, and one of
 * --password / --pin must be provided.
 */

import './../src/env';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import * as schema from '../src/db/schema';

const normPhone = (p: string) => (p || '').replace(/\D/g, '').slice(-10);
const normEmail = (e: string) => (e || '').trim().toLowerCase();

/** Minimal --flag value parser. */
function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const emailLookup = getArg('email');
  const phoneLookup = getArg('phone');
  const password = (getArg('password') || '').trim();
  const pin = (getArg('pin') || '').replace(/\D/g, '');
  const setEmail = getArg('set-email');

  // --- Validate lookup selectors ---
  if (!emailLookup && !phoneLookup) {
    console.error('Provide a lookup selector: --email <email> or --phone <phone>.');
    process.exit(1);
  }
  if (emailLookup && phoneLookup) {
    console.error('Provide only one lookup selector (--email OR --phone).');
    process.exit(1);
  }

  // --- Validate credential ---
  const usingPassword = password.length > 0;
  const usingPin = pin.length > 0;
  if (!usingPassword && !usingPin) {
    console.error('Provide a new credential: --password <password> or --pin <4-digit>.');
    process.exit(1);
  }
  if (usingPassword && password.length < 8) {
    console.error('Invalid --password — use at least 8 characters.');
    process.exit(1);
  }
  if (usingPin && !/^\d{4}$/.test(pin)) {
    console.error('Invalid --pin — need exactly 4 digits.');
    process.exit(1);
  }
  const credential = usingPassword ? password : pin;

  // --- Resolve the target user ---
  const all = await db.select().from(schema.users);

  let user;
  if (emailLookup) {
    const target = normEmail(emailLookup);
    user = all.find((u) => normEmail(u.email || '') === target);
  } else {
    const target = normPhone(phoneLookup as string);
    if (target.length !== 10) {
      console.error(`Invalid --phone "${phoneLookup}" — need 10 digits.`);
      process.exit(1);
    }
    user = all.find((u) => normPhone(u.phone) === target);
  }

  if (!user) {
    console.error('No matching user found for the given selector.');
    process.exit(1);
  }

  // --- Optionally set/replace the email (normalized, unique) ---
  const updates: Record<string, unknown> = {
    pinHash: await bcrypt.hash(credential, 10),
    updatedAt: new Date().toISOString(),
  };

  let finalEmail = user.email;
  if (setEmail !== undefined) {
    const nextEmail = normEmail(setEmail);
    if (!nextEmail.includes('@')) {
      console.error(`Invalid --set-email "${setEmail}" — need a valid email.`);
      process.exit(1);
    }
    const clash = all.find(
      (u) => normEmail(u.email || '') === nextEmail && u.id !== user!.id
    );
    if (clash) {
      console.error(`Email "${nextEmail}" is already registered to another account.`);
      process.exit(1);
    }
    updates.email = nextEmail;
    finalEmail = nextEmail;
  }

  await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id));

  console.log('\n========================================');
  console.log(' USER CREDENTIAL UPDATED');
  console.log('========================================');
  console.log(`  Name    : ${user.name}`);
  console.log(`  Role    : ${user.role}`);
  console.log(`  Email   : ${finalEmail || '(none)'}   <-- primary login username`);
  console.log(`  Phone   : ${user.phone}`);
  if (usingPassword) {
    console.log(`  Password: ${password}   <-- new password`);
  } else {
    console.log(`  PIN     : ${pin}   <-- new 4-digit PIN`);
  }
  console.log(`  User ID : ${user.id}`);
  console.log('========================================');
  console.log('Stored only as a bcrypt hash. Share the credential securely, then discard.');

  process.exit(0);
}

main().catch((err) => {
  console.error('set-user-password failed:', err);
  process.exit(1);
});
