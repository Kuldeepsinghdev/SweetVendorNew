/**
 * Test fixtures — user accounts and reference data.
 *
 * These match the seeded data in the Supabase database.
 * Do NOT use production credentials here. These are test/dev accounts only.
 *
 * To recreate test data:
 *   npm run db:reset-admin  (wipes all data, creates super admin)
 *   npx tsx scripts/seed-sahakar-data.ts  (seeds cities, DCs, sweets)
 *
 * Credentials come from environment variables when running in CI.
 * For local dev, the values below match the seeded test state.
 */

export const TEST_USERS = {
  superAdmin: {
    phone: process.env.TEST_SUPER_ADMIN_PHONE || '7737691749',
    pin: process.env.TEST_SUPER_ADMIN_PIN || '',
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'superadmin@sahakar.local',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || '',
    role: 'super_admin' as const,
  },
  cityAdminSawai: {
    phone: process.env.TEST_CITY_ADMIN_PHONE || '9413753383',
    pin: process.env.TEST_CITY_ADMIN_PIN || '',
    email: process.env.TEST_CITY_ADMIN_EMAIL || 'aastha.bhandar.swm@gmail.com',
    password: process.env.TEST_CITY_ADMIN_PASSWORD || '',
    role: 'city_admin' as const,
    cityId: 'sawai_madhopur',
  },
  approvedMitra: {
    phone: process.env.TEST_MITRA_PHONE || '9875186011',
    pin: process.env.TEST_MITRA_PIN || '',
    email: process.env.TEST_MITRA_EMAIL || 'dinesh.swm@gmail.com',
    password: process.env.TEST_MITRA_PASSWORD || '',
    role: 'mitra' as const,
    name: 'दिनेश शर्मा',
    cityId: 'sawai_madhopur',
  },
} as const;

export const TEST_DATA = {
  cities: {
    jaipur: { id: 'jaipur', nameHi: 'जयपुर', nameEn: 'Jaipur' },
    sawaiMadhopur: { id: 'sawai_madhopur', nameHi: 'सवाई माधोपुर', nameEn: 'Sawai Madhopur' },
  },
  saleCenters: {
    rajapark: { id: 'kendra_rajapark_jaipur', nameHi: 'सहकार केंद्र — राजापार्क' },
    malviya: { id: 'kendra_malviya_nagar_jaipur', nameHi: 'सहकार केंद्र — मालवीय नगर' },
    bajariya: { id: 'kendra_bajariya_sawaimadhopur', nameHi: 'सहकार केंद्र — बजरिया' },
    aastha: { id: 'kendra_aastha_sawaimadhopur', nameHi: 'आस्था उपभोक्ता भण्डार' },
  },
  distributionCenters: {
    tilakNagar: { id: 'dc_rajapark_tilaknagar', nameHi: 'वितरण केंद्र — तिलक नगर', saleCenterId: 'kendra_rajapark_jaipur' },
    sector3: { id: 'dc_malviya_sector3', nameHi: 'वितरण केंद्र — सेक्टर 3', saleCenterId: 'kendra_malviya_nagar_jaipur' },
    bajariyaMain: { id: 'dc_bajariya_mainmarket', nameHi: 'वितरण केंद्र — मुख्य बाजार', saleCenterId: 'kendra_bajariya_sawaimadhopur' },
  },
  sweets: {
    kajuKatli: { id: 'kaju-katli', nameHi: 'काजू कतली', basePrice: 700 },
    badamKatli: { id: 'badam-katli', nameHi: 'बादाम कतली', basePrice: 900 },
  },
  festival: {
    id: 'diwali_2026',
    nameHi: 'दीपावली 2026',
    status: 'active',
  },
} as const;

/** A new mitra registration payload for use in registration tests */
export function newMitraPayload() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return {
    phone: `9${random}${random}`, // generates a unique-ish 10-digit phone
    fullName: `Test Mitra ${random}`,
    email: `test.mitra.${random}@example.com`,
    pincode: '302020',
    address: 'Test Address, Test Colony, Jaipur',
    cityId: 'jaipur',
    cityDcId: 'dc_rajapark_tilaknagar',
  };
}
