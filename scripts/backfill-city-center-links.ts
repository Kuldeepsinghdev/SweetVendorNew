/**
 * Backfill city/center association links.
 *
 * Usage: npx tsx scripts/backfill-city-center-links.ts
 *
 * This script establishes the authoritative user <-> city/center links used for
 * city-scoping (Slice C):
 *   1. cities.adminUserId       <- users matched by cities.adminPhone
 *   2. saleCenters.ownerUserId  <- users matched by saleCenters.ownerPhone
 *   3. users.cityId             <- filled for kendra owners from their center's cityId
 *
 * It matches on the normalized (last-10-digit) phone number and is idempotent:
 * rows that already have a link are left untouched.
 */

import 'dotenv/config';
import { db } from '../src/db';
import { users, cities, saleCenters } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const normPhone = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-10);

async function main() {
  console.log('Backfilling city/center association links...\n');

  const allUsers = await db.select().from(users);
  const userByPhone = new Map<string, (typeof allUsers)[number]>();
  for (const u of allUsers) {
    const p = normPhone(u.phone);
    if (p.length === 10) userByPhone.set(p, u);
  }

  // 1. cities.adminUserId
  const allCities = await db.select().from(cities);
  let cityLinks = 0;
  for (const c of allCities) {
    if (c.adminUserId) continue;
    const admin = userByPhone.get(normPhone(c.adminPhone));
    if (admin) {
      await db.update(cities).set({ adminUserId: admin.id }).where(eq(cities.id, c.id));
      console.log(`  [CITY]   ${c.id} -> adminUserId=${admin.id} (${admin.phone})`);
      cityLinks++;
    } else {
      console.log(`  [CITY]   ${c.id} -> no matching admin user for phone ${c.adminPhone}`);
    }
  }

  // 2. saleCenters.ownerUserId  (and collect city for each owner)
  const allCenters = await db.select().from(saleCenters);
  let centerLinks = 0;
  const ownerCityByUserId = new Map<string, string>();
  for (const c of allCenters) {
    const owner = userByPhone.get(normPhone(c.ownerPhone));
    if (owner) {
      // Remember the city of this owner's center for the users.cityId backfill.
      if (c.cityId && !ownerCityByUserId.has(owner.id)) {
        ownerCityByUserId.set(owner.id, c.cityId);
      }
    }
    if (c.ownerUserId) continue;
    if (owner) {
      await db.update(saleCenters).set({ ownerUserId: owner.id }).where(eq(saleCenters.id, c.id));
      console.log(`  [CENTER] ${c.id} -> ownerUserId=${owner.id} (${owner.phone})`);
      centerLinks++;
    } else {
      console.log(`  [CENTER] ${c.id} -> no matching owner user for phone ${c.ownerPhone}`);
    }
  }

  // 3. users.cityId for kendra owners missing a city
  let userCityLinks = 0;
  for (const u of allUsers) {
    if (u.role !== 'kendra') continue;
    if (u.cityId) continue;
    const cityId = ownerCityByUserId.get(u.id);
    if (cityId) {
      await db.update(users).set({ cityId }).where(eq(users.id, u.id));
      console.log(`  [USER]   ${u.id} (kendra) -> cityId=${cityId}`);
      userCityLinks++;
    }
  }

  console.log(`\nDone. Linked ${cityLinks} cities, ${centerLinks} centers, ${userCityLinks} kendra users.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
