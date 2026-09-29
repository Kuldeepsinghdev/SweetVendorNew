/**
 * Seed the real Sahakar Bharati reference data:
 *   1 dummy admin user, 2 cities, 3 sale centres, 8 distribution centres,
 *   11 master sweets, and per-sale-centre sweet menus (33 rows).
 *
 * Usage: npx tsx scripts/seed-sahakar-data.ts
 *
 * Idempotent (onConflictDoUpdate). Runs parent -> child to satisfy FKs.
 * Also removes stale rows (sale_center_sweets, distribution_centers,
 * sale_centers, cities) whose IDs are NOT in the desired set — without
 * touching master_sweets that may exist outside this seed.
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { notInArray } from 'drizzle-orm';
import { db } from '../src/db/index';
import * as schema from '../src/db/schema';

// ─── Constants ───────────────────────────────────────────────────────────────

const PLACEHOLDER_PHONE = '-';
const PLACEHOLDER_EMAIL = '';
const DEFAULT_TIMING    = '10:00 AM - 07:00 PM';
const SWEET_HSN         = '1704';
const DEFAULT_GST       = 5;

const DUMMY_ADMIN_ID    = 'usr_dummy_admin';

// ─── Keep-sets (used for cleanup) ────────────────────────────────────────────

const KEEP_CITY_IDS: string[] = [
  'jaipur',
  'sawai-madhopur',
];

const KEEP_SALE_CENTER_IDS: string[] = [
  'sc-sawai-madhopur',
  'sc-aastha-swadeshi-jaipur',
  'sc-aastha-bhandar-jaipur',
];

const KEEP_DC_IDS: string[] = [
  'dc-sawai-madhopur-1',
  'dc-aastha-swadeshi-1',
  'dc-aastha-bhandar-1',
  'dc-aastha-bhandar-2',
  'dc-aastha-bhandar-3',
  'dc-aastha-bhandar-4',
  'dc-aastha-bhandar-5',
  'dc-aastha-bhandar-6',
];

// ─── Data ────────────────────────────────────────────────────────────────────

const cities = [
  {
    id: 'sawai-madhopur',
    nameHi: 'सवाई माधोपुर',
    nameEn: 'Sawai Madhopur',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'सवाई माधोपुर',
    adminName: 'Mr. Sushil Malpani',
    adminPhone: PLACEHOLDER_PHONE,
    adminUserId: DUMMY_ADMIN_ID,
    isActive: true,
    sweets: [] as { sweetId: string; pricePerKg: number; isActive: boolean }[],
  },
  {
    id: 'jaipur',
    nameHi: 'जयपुर',
    nameEn: 'Jaipur',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'जयपुर',
    adminName: PLACEHOLDER_PHONE,   // no named admin yet; '-' satisfies NOT NULL
    adminPhone: PLACEHOLDER_PHONE,
    adminUserId: DUMMY_ADMIN_ID,
    isActive: true,
    sweets: [] as { sweetId: string; pricePerKg: number; isActive: boolean }[],
  },
];

const saleCenters = [
  {
    id: 'sc-sawai-madhopur',
    cityId: 'sawai-madhopur',
    nameHi: 'आस्था स्वदेशी भंडार सवाई माधोपुर',
    nameEn: 'Aastha Swadeshi Bhandar',
    type: 'organization',
    ownerName: 'Mr. Sushil Malpani',
    ownerPhone: PLACEHOLDER_PHONE,
    ownerEmail: PLACEHOLDER_EMAIL,
    ownerUserId: DUMMY_ADMIN_ID,
    addressHi: 'टोंक रोड, बजारीया, सवाई माधोपुर, राजस्थान, 322001',
    addressEn: 'TONK ROAD, BAZARIA, Sawai Madhopur, Rajasthan, 322001',
    pincode: '322001',
    timing: DEFAULT_TIMING,
    isActive: true,
  },
  {
    id: 'sc-aastha-swadeshi-jaipur',
    cityId: 'jaipur',
    nameHi: 'आस्था स्वदेशी भंडार',
    nameEn: 'Aastha Swadeshi Bhandar',
    type: 'store',
    ownerName: 'Mr. Sushil Malpani',
    ownerPhone: PLACEHOLDER_PHONE,
    ownerEmail: PLACEHOLDER_EMAIL,
    ownerUserId: DUMMY_ADMIN_ID,
    addressHi: 'सेंट विलफ्रेड पीजी कॉलेज, सेक्टर-10, मीरा मार्ग, मध्यम मार्ग, मानसरोवर, जयपुर, राजस्थान 302020',
    addressEn: "St. Wilfred's PG College, Sector-10, Meera Marg, Madhyam Marg, Mansarovar, Jaipur, Rajasthan 302020",
    pincode: '302020',
    timing: DEFAULT_TIMING,
    isActive: true,
  },
  {
    id: 'sc-aastha-bhandar-jaipur',
    cityId: 'jaipur',
    nameHi: 'आस्था भंडार',
    nameEn: 'Aastha Bhandar',
    type: 'store',
    ownerName: PLACEHOLDER_PHONE,   // '-' satisfies NOT NULL until real name is known
    ownerPhone: '9460726856',
    ownerEmail: PLACEHOLDER_EMAIL,
    ownerUserId: DUMMY_ADMIN_ID,
    addressHi: '46/194-195, रजत पथ, मध्यम मार्ग, मानसरोवर, जयपुर, राजस्थान 302020',
    addressEn: '46/194-195, Rajat Path, Madhyam Marg, Mansarovar, Jaipur, Rajasthan 302020',
    pincode: '302020',
    timing: DEFAULT_TIMING,
    isActive: true,
  },
];

const distributionCenters = [
  // ── Sawai Madhopur ──────────────────────────────────────────────────────────
  {
    id: 'dc-sawai-madhopur-1',
    saleCenterId: 'sc-sawai-madhopur',
    cityId: 'sawai-madhopur',
    nameHi: 'सवाई माधोपुर वितरण केंद्र',
    nameEn: 'Sawai Madhopur Distribution Center',
    addressHi: 'टोंक रोड, बजारीया, सवाई माधोपुर, राजस्थान, 322001',
    addressEn: 'TONK ROAD, BAZARIA, Sawai Madhopur, Rajasthan, 322001',
    pincode: '322001',
    timing: DEFAULT_TIMING,
    phone: PLACEHOLDER_PHONE,
    isActive: true,
  },

  // ── Aastha Swadeshi Bhandar (Jaipur) ────────────────────────────────────────
  {
    id: 'dc-aastha-swadeshi-1',
    saleCenterId: 'sc-aastha-swadeshi-jaipur',
    cityId: 'jaipur',
    nameHi: 'आस्था स्वदेशी वितरण केंद्र',
    nameEn: 'Aastha Swadeshi Distribution Center',
    addressHi: 'सेंट विलफ्रेड पीजी कॉलेज, सेक्टर-10, मीरा मार्ग, मध्यम मार्ग, मानसरोवर, जयपुर, राजस्थान 302020',
    addressEn: "St. Wilfred's PG College, Sector-10, Meera Marg, Madhyam Marg, Mansarovar, Jaipur, Rajasthan 302020",
    pincode: '302020',
    timing: DEFAULT_TIMING,
    phone: PLACEHOLDER_PHONE,
    isActive: true,
  },

  // ── Aastha Bhandar (Jaipur) — 6 distribution centers ────────────────────────
  {
    id: 'dc-aastha-bhandar-1',
    saleCenterId: 'sc-aastha-bhandar-jaipur',
    cityId: 'jaipur',
    nameHi: 'सामुदायिक केंद्र, सचिवालय विहार',
    nameEn: 'Community Center, Sachivalaya Vihar',
    addressHi: 'सामुदायिक केंद्र, सचिवालय विहार, मानसरोवर, जयपुर',
    addressEn: 'Community Center, Sachivalaya Vihar, Mansarovar, Jaipur',
    pincode: '302020',
    timing: DEFAULT_TIMING,
    phone: PLACEHOLDER_PHONE,
    isActive: true,
  },
  {
    id: 'dc-aastha-bhandar-2',
    saleCenterId: 'sc-aastha-bhandar-jaipur',
    cityId: 'jaipur',
    nameHi: 'आस्था भंडार',
    nameEn: 'Aastha Bhandar',
    addressHi: '46/194-195, रजत पथ, मध्यम मार्ग, मानसरोवर, जयपुर',
    addressEn: '46/194-195, Rajat Path, Madhyam Marg, Mansarovar, Jaipur',
    pincode: '302020',
    timing: DEFAULT_TIMING,
    phone: '9460726856',
    isActive: true,
  },
  {
    id: 'dc-aastha-bhandar-3',
    saleCenterId: 'sc-aastha-bhandar-jaipur',
    cityId: 'jaipur',
    nameHi: 'स्वास्तिक गृह उद्योग',
    nameEn: 'Swastik Grah Udhyog',
    addressHi: '84/149, स्वास्तिक गृह उद्योग, संत नामदेव मार्ग, इंडियन बैंक के पास, मानसरोवर, जयपुर',
    addressEn: '84/149, Swastik Grah Udhyog, Sant Namdev Marg, Near Indian Bank, Mansarovar, Jaipur',
    pincode: '302020',
    timing: DEFAULT_TIMING,
    phone: '9414045505',
    isActive: true,
  },
  {
    id: 'dc-aastha-bhandar-4',
    saleCenterId: 'sc-aastha-bhandar-jaipur',
    cityId: 'jaipur',
    nameHi: 'बिग माउंटेन फीस्ट बेकरी एंड ईटरी',
    nameEn: 'Big Mountain Feast Bakery and Eatery',
    addressHi: '182, गोपाल नगर, खरवास पथ, मांगियावास, मानसरोवर, जयपुर',
    addressEn: '182, Gopal Nagar, Kharbas Path, Mangyawas, Mansarovar, Jaipur',
    pincode: '302020',
    timing: DEFAULT_TIMING,
    phone: PLACEHOLDER_PHONE,
    isActive: true,
  },
  {
    id: 'dc-aastha-bhandar-5',
    saleCenterId: 'sc-aastha-bhandar-jaipur',
    cityId: 'jaipur',
    nameHi: 'पार्थ स्वामी (मालवीय नगर)',
    nameEn: 'Parth Swamy (Malviya Nagar)',
    addressHi: 'पार्थ स्वामी, पुत्र श्री अरविंद स्वामी, गिर्धारी मार्ग, मालवीय नगर, घिया अस्पताल के सामने, जयपुर',
    addressEn: 'Parth Swamy S/O Sh Arvind Swamy, Girdhae Marg, Malviya Nagar, Infront of Ghiya Hospital, Jaipur',
    pincode: '302017',
    timing: DEFAULT_TIMING,
    phone: '9509595179',
    isActive: true,
  },
  {
    id: 'dc-aastha-bhandar-6',
    saleCenterId: 'sc-aastha-bhandar-jaipur',
    cityId: 'jaipur',
    nameHi: 'प्रिया युक्ति किराना एंड जनरल स्टोर',
    nameEn: 'Priya Yukti Kirana and General Store',
    addressHi: 'प्रिया युक्ति किराना एंड जनरल स्टोर, सतगुरु तेयूं राम गौशाला के पास, ग्राम- गणपतपुरा, भारतमाता सर्किल, जयपुर',
    addressEn: 'Priya Yukti Kirana and General Store, Near Sadguru Teyun Ram Gosala, Vill- Ganpatpura, Bharatmata Circle, Jaipur',
    pincode: '302020',
    timing: DEFAULT_TIMING,
    phone: PLACEHOLDER_PHONE,
    isActive: true,
  },
];

type Variant = { label: string; weightInKg: number; price: number };
const v = (label: string, grams: number, price: number): Variant => ({
  label,
  weightInKg: grams / 1000,
  price,
});

const masterSweets = [
  { id: 'kaju-katli',             nameHi: 'काजू कतली',                                              nameEn: 'Kaju Katli',                                          category: 'sweets',     basePrice: 700, variants: [v('1 kg', 1000, 700),        v('500 g', 500, 360)],        isPureVeg: true },
  { id: 'kaju-katli-chandi-vark', nameHi: 'काजू कतली चांदी वर्क सहित',                              nameEn: 'Kaju Katli with Chandi Vark',                          category: 'sweets',     basePrice: 850, variants: [v('1 kg', 1000, 850),        v('500 g', 500, 435)],        isPureVeg: true },
  { id: 'kaju-katli-gur',         nameHi: 'काजू कतली (गुड़)',                                        nameEn: 'Kaju Katli (Jaggery)',                                 category: 'sweets',     basePrice: 850, variants: [v('1 kg', 1000, 850),        v('500 g', 500, 435)],        isPureVeg: true },
  { id: 'badam-katli',            nameHi: 'बादाम कतली',                                              nameEn: 'Badam Katli',                                          category: 'sweets',     basePrice: 900, variants: [v('1 kg', 1000, 900),        v('500 g', 500, 460)],        isPureVeg: true },
  { id: 'makkhan-bada',           nameHi: 'मक्खन बड़ा',                                              nameEn: 'Makkhan Bada',                                         category: 'sweets',     basePrice: 500, variants: [v('800 g', 800, 400),        v('400 g', 400, 220)],        isPureVeg: true },
  { id: 'mohan-thal',             nameHi: 'मोहन थाल',                                                nameEn: 'Mohan Thal',                                           category: 'sweets',     basePrice: 450, variants: [v('1 kg', 1000, 450),        v('500 g', 500, 230)],        isPureVeg: true },
  { id: 'moong-barfi',            nameHi: 'मूंग की बर्फी',                                           nameEn: 'Moong Ki Barfi',                                       category: 'sweets',     basePrice: 480, variants: [v('1 kg', 1000, 480),        v('500 g', 500, 250)],        isPureVeg: true },
  { id: 'mathri',                 nameHi: 'मठरी',                                                    nameEn: 'Mathri',                                               category: 'namkeen',    basePrice: 310, variants: [v('800 g', 800, 250),        v('400 g', 400, 130)],        isPureVeg: true },
  { id: 'mixed-sweet',            nameHi: 'मिश्रित मिठाई (काजू, मूंग दाल, माखन बड़ा, मठरी)',       nameEn: 'Mixed Sweet (Kaju, Moong Dal, Makkhan Bada, Mathri)',   category: 'sweets',     basePrice: 650, variants: [v('1 kg', 1000, 650)],                                     isPureVeg: true },
  { id: 'dry-fruit-pack-4',       nameHi: 'ड्राई फ्रूट - 04 प्रकार की मेवा (500 ग्राम)',           nameEn: 'Dry Fruit Box - 4 Varieties (500g)',                   category: 'dry_fruits', basePrice: 720, variants: [v('1 packet (500g)', 500, 720)],                            isPureVeg: true },
  { id: 'roasted-seed-namkeen',   nameHi: 'भुने बीज मेवा की नमकीन (200 ग्राम)',                    nameEn: 'Roasted Seeds & Nuts Namkeen (200g)',                  category: 'namkeen',    basePrice: 225, variants: [v('1 packet (200g)', 200, 225)],                            isPureVeg: true },
];

// All 3 sale centers share the same menu and pricing.
const baseMenu: { sweetId: string; pricePerKg: number }[] = [
  { sweetId: 'kaju-katli',           pricePerKg: 700 },
  { sweetId: 'kaju-katli-chandi-vark', pricePerKg: 850 },
  { sweetId: 'kaju-katli-gur',       pricePerKg: 850 },
  { sweetId: 'badam-katli',          pricePerKg: 900 },
  { sweetId: 'makkhan-bada',         pricePerKg: 500 },
  { sweetId: 'mohan-thal',           pricePerKg: 450 },
  { sweetId: 'moong-barfi',          pricePerKg: 480 },
  { sweetId: 'mathri',               pricePerKg: 310 },
  { sweetId: 'mixed-sweet',          pricePerKg: 650 },
  { sweetId: 'dry-fruit-pack-4',     pricePerKg: 720 },
  { sweetId: 'roasted-seed-namkeen', pricePerKg: 225 },
];

const saleCenterSweets = KEEP_SALE_CENTER_IDS.flatMap((saleCenterId) =>
  baseMenu.map((m) => ({ saleCenterId, sweetId: m.sweetId, pricePerKg: m.pricePerKg, isActive: true }))
);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date().toISOString();

  // ── 0. Dummy admin user (upsert) ──────────────────────────────────────────
  console.log('0. Upserting dummy admin user...');
  const dummyPinHash = await bcrypt.hash('dummy1234', 10);
  await db.insert(schema.users).values({
    id: DUMMY_ADMIN_ID,
    name: 'Dummy Admin',
    phone: '0000000000',
    email: 'dummy-admin@sahakar.local',
    role: 'admin',
    pinHash: dummyPinHash,
    cityId: null,
    distributionCenterId: null,
    pincode: null,
    address: null,
    mustResetPin: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: schema.users.id,
    set: { name: 'Dummy Admin', isActive: true, updatedAt: now },
  });
  console.log('   dummy admin: upserted');

  // ── 1. Cleanup — remove rows not in the desired sets (child → parent) ─────
  //
  // Deletion order must respect FK constraints:
  //   bookings → distribution_centers (centerId)
  //   bookings → sale_centers         (saleCenterId)
  //   sale_center_sweets → sale_centers
  //   distribution_centers → sale_centers / cities
  //   sale_centers → cities
  //
  // We delete bookings that reference stale DCs / SCs first so the DC/SC
  // rows become free to remove.
  console.log('1. Cleaning up stale rows...');

  // 1a. Remove bookings referencing DCs / SCs that are being removed.
  await db.delete(schema.bookings).where(
    notInArray(schema.bookings.centerId, KEEP_DC_IDS)
  );
  // Also cover bookings whose saleCenterId references a stale sale center.
  // (saleCenterId is nullable in bookings, so only delete where it is set and stale)
  const allKeepSCsForBookings = [...KEEP_SALE_CENTER_IDS];
  // We can't use notInArray on a nullable column directly; use raw SQL workaround:
  await db.delete(schema.bookings).where(
    notInArray(schema.bookings.saleCenterId, allKeepSCsForBookings)
  );
  console.log('   stale bookings removed');

  // 1b. Stale sale_center_sweets (child of sale_centers)
  await db.delete(schema.saleCenterSweets).where(
    notInArray(schema.saleCenterSweets.saleCenterId, KEEP_SALE_CENTER_IDS)
  );
  console.log('   stale sale_center_sweets removed');

  // 1c. Stale distribution_centers
  await db.delete(schema.distributionCenters).where(
    notInArray(schema.distributionCenters.id, KEEP_DC_IDS)
  );
  console.log('   stale distribution_centers removed');

  // 1d. Stale sale_centers
  await db.delete(schema.saleCenters).where(
    notInArray(schema.saleCenters.id, KEEP_SALE_CENTER_IDS)
  );
  console.log('   stale sale_centers removed');

  // 1e. Stale cities
  await db.delete(schema.cities).where(
    notInArray(schema.cities.id, KEEP_CITY_IDS)
  );
  console.log('   stale cities removed');

  // ── 2. Cities ──────────────────────────────────────────────────────────────
  console.log('2. Upserting cities...');
  for (const c of cities) {
    await db.insert(schema.cities).values(c).onConflictDoUpdate({
      target: schema.cities.id,
      set: {
        nameHi: c.nameHi,
        nameEn: c.nameEn,
        stateHi: c.stateHi,
        stateEn: c.stateEn,
        districtHi: c.districtHi,
        adminName: c.adminName,
        adminPhone: c.adminPhone,
        adminUserId: c.adminUserId,
        isActive: c.isActive,
        sweets: c.sweets,
      },
    });
  }
  console.log(`   cities: ${cities.length}`);

  // ── 3. Master sweets ───────────────────────────────────────────────────────
  console.log('3. Upserting master sweets...');
  for (const s of masterSweets) {
    await db.insert(schema.masterSweets).values({
      id: s.id,
      nameHi: s.nameHi,
      nameEn: s.nameEn,
      category: s.category,
      hsnCode: SWEET_HSN,
      gstPercent: DEFAULT_GST,
      descriptionHi: s.nameHi,
      descriptionEn: s.nameEn,
      imageUrl: '',
      basePrice: s.basePrice,
      variants: s.variants,
      isPureVeg: s.isPureVeg,
    }).onConflictDoUpdate({
      target: schema.masterSweets.id,
      set: {
        nameHi: s.nameHi,
        nameEn: s.nameEn,
        category: s.category,
        basePrice: s.basePrice,
        variants: s.variants,
        isPureVeg: s.isPureVeg,
      },
    });
  }
  console.log(`   master_sweets: ${masterSweets.length}`);

  // ── 4. Sale centers ────────────────────────────────────────────────────────
  console.log('4. Upserting sale centers...');
  for (const sc of saleCenters) {
    await db.insert(schema.saleCenters).values(sc).onConflictDoUpdate({
      target: schema.saleCenters.id,
      set: {
        cityId: sc.cityId,
        nameHi: sc.nameHi,
        nameEn: sc.nameEn,
        type: sc.type,
        ownerName: sc.ownerName,
        ownerPhone: sc.ownerPhone,
        ownerEmail: sc.ownerEmail,
        ownerUserId: sc.ownerUserId,
        addressHi: sc.addressHi,
        addressEn: sc.addressEn,
        pincode: sc.pincode,
        timing: sc.timing,
        isActive: sc.isActive,
      },
    });
  }
  console.log(`   sale_centers: ${saleCenters.length}`);

  // ── 5. Distribution centers ────────────────────────────────────────────────
  console.log('5. Upserting distribution centers...');
  for (const dc of distributionCenters) {
    await db.insert(schema.distributionCenters).values(dc).onConflictDoUpdate({
      target: schema.distributionCenters.id,
      set: {
        saleCenterId: dc.saleCenterId,
        cityId: dc.cityId,
        nameHi: dc.nameHi,
        nameEn: dc.nameEn,
        addressHi: dc.addressHi,
        addressEn: dc.addressEn,
        pincode: dc.pincode,
        timing: dc.timing,
        phone: dc.phone,
        isActive: dc.isActive,
      },
    });
  }
  console.log(`   distribution_centers: ${distributionCenters.length}`);

  // ── 6. Sale center sweets ──────────────────────────────────────────────────
  console.log('6. Upserting sale center sweets...');
  for (const scs of saleCenterSweets) {
    await db.insert(schema.saleCenterSweets).values(scs).onConflictDoUpdate({
      target: [schema.saleCenterSweets.saleCenterId, schema.saleCenterSweets.sweetId],
      set: { pricePerKg: scs.pricePerKg, isActive: scs.isActive },
    });
  }
  console.log(`   sale_center_sweets: ${saleCenterSweets.length} (${masterSweets.length} sweets × ${KEEP_SALE_CENTER_IDS.length} centers)`);

  console.log('\n✓ Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
