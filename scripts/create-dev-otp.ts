/**
 * Development script: Create a dummy OTP for a Mitra user.
 *
 * Usage: npx tsx scripts/create-dev-otp.ts [email] [otp-code]
 *
 * Example: npx tsx scripts/create-dev-otp.ts aanchalsg11@gmail.com 123456
 *
 * This script is for local development and testing only.
 * It creates or updates an OTP record in the login_otps table.
 */

import 'dotenv/config';
import { db } from '../src/db/index';
import { users, loginOtps } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import postgres from 'postgres';

async function ensureLoginOtpsTable() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    '';

  const sql = dbUrl
    ? postgres(dbUrl, {
        ssl:
          dbUrl.includes('supabase') || process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        max: 1,
      })
    : postgres({
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 1,
      });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS login_otps (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id),
        email_address TEXT NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        method VARCHAR(32) NOT NULL DEFAULT 'email',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        verified_at TEXT,
        CONSTRAINT otp_code_format CHECK (otp_code ~ '^[0-9]{6}$')
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS login_otps_user_method_idx ON login_otps(user_id, method);`;
    console.log('✓ login_otps table ensured');
  } finally {
    await sql.end();
  }
}

async function createDevOtp() {
  const email = process.argv[2] || 'aanchalsg11@gmail.com';
  const otpCode = process.argv[3] || '123456';

  // Validate OTP format
  if (!/^\d{6}$/.test(otpCode)) {
    console.error('❌ OTP must be exactly 6 digits');
    process.exit(1);
  }

  console.log(`📧 Creating OTP for: ${email}`);
  console.log(`🔐 OTP Code: ${otpCode}`);

  try {
    // Ensure table exists
    await ensureLoginOtpsTable();

    // Find user with this email (case-insensitive), role='mitra', isActive=true
    const userResults = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email.toLowerCase()),
          eq(users.role, 'mitra'),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (userResults.length === 0) {
      console.error(`❌ No active Mitra user found with email: ${email}`);
      console.error('   Make sure the user exists and has role="mitra" and isActive=true');
      process.exit(1);
    }

    const user = userResults[0];
    console.log(`✓ Found Mitra user: ${user.name} (${user.id})`);

    // Generate OTP record ID and timestamps
    const now = new Date();
    const otpId = `otp_dev_${Date.now()}`;
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    // Delete old OTPs for this user to avoid confusion
    await db.delete(loginOtps).where(eq(loginOtps.userId, user.id));

    // Insert new OTP
    await db.insert(loginOtps).values({
      id: otpId,
      userId: user.id,
      emailAddress: email.toLowerCase(),
      otpCode,
      method: 'email',
      attempts: 0,
      maxAttempts: 5,
      createdAt,
      expiresAt,
      verifiedAt: null,
    });

    console.log(`\n✅ OTP created successfully!\n`);
    console.log(`   OTP ID:     ${otpId}`);
    console.log(`   Created At: ${createdAt}`);
    console.log(`   Expires At: ${expiresAt}`);
    console.log(`   Attempts:   0/5`);
    console.log(`\n📝 Test the login flow:`);
    console.log(`   1. Navigate to the OTP login page`);
    console.log(`   2. Enter email: ${email}`);
    console.log(`   3. Enter OTP: ${otpCode}`);
  } catch (error) {
    console.error('❌ Error creating OTP:', error);
    process.exit(1);
  }
}

createDevOtp();
