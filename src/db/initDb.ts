import postgres from 'postgres';
import { seedDatabase } from './seed';

export async function ensureTablesExist() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    '';

  const sql = dbUrl
    ? postgres(dbUrl, {
        ssl: dbUrl.includes('supabase') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      })
    : postgres({
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });

  try {
    console.log('Ensuring Supabase Postgres tables exist...');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name TEXT NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email TEXT,
        role VARCHAR(32) DEFAULT 'customer' NOT NULL,
        pin_hash TEXT,
        city_id VARCHAR(64),
        pincode VARCHAR(16),
        address TEXT,
        must_reset_pin BOOLEAN DEFAULT false NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS users_phone_norm_uidx
        ON users ( right(regexp_replace(phone, '\\D', '', 'g'), 10) );
    `;
    // --- One-time email normalization + dedupe (runs before the unique index) ---
    // Email is becoming the primary login credential, so the unique index below
    // must be able to build. Existing data may have mixed-case, blank, or
    // duplicate emails. Normalize and de-duplicate first so index creation
    // succeeds; without this, CREATE UNIQUE INDEX would silently fail on dirty
    // data and the constraint would never take effect.
    try {
      // 1. Blank / whitespace-only emails -> NULL.
      await sql`UPDATE users SET email = NULL WHERE email IS NOT NULL AND btrim(email) = '';`;

      // 2. Trim + lowercase every remaining email.
      await sql`UPDATE users SET email = lower(btrim(email)) WHERE email IS NOT NULL AND email <> lower(btrim(email));`;

      // 3. Collapse duplicates: within each normalized-email group keep the
      //    email on a single "winner" row and NULL it on the others. Winner
      //    preference: active accounts first, then most recently updated, then
      //    oldest created, then id — deterministic and stable.
      const demoted = await sql<{ id: string; email: string }[]>`
        WITH ranked AS (
          SELECT
            id,
            email,
            row_number() OVER (
              PARTITION BY lower(email)
              ORDER BY is_active DESC, updated_at DESC NULLS LAST, created_at ASC, id ASC
            ) AS rn
          FROM users
          WHERE email IS NOT NULL
        )
        UPDATE users u
          SET email = NULL
          FROM ranked r
          WHERE u.id = r.id AND r.rn > 1
          RETURNING u.id, r.email AS email;
      `;
      if (demoted.length > 0) {
        console.warn(
          `Email dedupe: cleared duplicate email on ${demoted.length} user row(s) so the unique index can apply. ` +
          `Affected ids: ${demoted.map((d) => d.id).join(', ')}`
        );
      }
    } catch (dedupeErr) {
      console.warn('Email normalization/dedupe pass failed (continuing):', dedupeErr);
    }

    // Email is the primary login credential — enforce case-insensitive
    // uniqueness across all non-null emails. Partial + functional index so
    // rows without an email (NULL) are exempt and mixed-case duplicates are
    // rejected. Mirrors the normalized phone unique index above. The dedupe
    // pass above guarantees this can build on existing data.
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_norm_uidx
        ON users ( lower(email) )
        WHERE email IS NOT NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);`;
    await sql`CREATE INDEX IF NOT EXISTS users_city_idx ON users (city_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS master_sweets (
        id VARCHAR(64) PRIMARY KEY,
        name_hi TEXT NOT NULL,
        name_en TEXT NOT NULL,
        category VARCHAR(32) NOT NULL,
        hsn_code VARCHAR(32) NOT NULL,
        gst_percent REAL NOT NULL,
        description_hi TEXT NOT NULL,
        description_en TEXT NOT NULL,
        image_url TEXT NOT NULL,
        images JSONB,
        base_price REAL,
        discount_percent REAL,
        shelf_life_days INTEGER,
        pack_size_info TEXT,
        variants JSONB NOT NULL,
        is_pure_veg BOOLEAN DEFAULT true NOT NULL,
        ingredients_hi TEXT
      );

    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cities (
        id VARCHAR(64) PRIMARY KEY,
        name_hi TEXT NOT NULL,
        name_en TEXT NOT NULL,
        state_hi TEXT NOT NULL,
        state_en TEXT NOT NULL,
        district_hi TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        admin_phone VARCHAR(32) NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        sweets JSONB NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sale_centers (
        id VARCHAR(64) PRIMARY KEY,
        city_id VARCHAR(64) NOT NULL,
        name_hi TEXT NOT NULL,
        name_en TEXT NOT NULL,
        type VARCHAR(32) NOT NULL,
        owner_name TEXT NOT NULL,
        owner_phone VARCHAR(32) NOT NULL,
        owner_email TEXT NOT NULL,
        address_hi TEXT NOT NULL,
        address_en TEXT NOT NULL,
        pincode VARCHAR(16) NOT NULL,
        timing TEXT NOT NULL,
        map_url TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        gstin VARCHAR(32)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS distribution_centers (
        id VARCHAR(64) PRIMARY KEY,
        sale_center_id VARCHAR(64) NOT NULL,
        city_id VARCHAR(64) NOT NULL,
        name_hi TEXT NOT NULL,
        name_en TEXT NOT NULL,
        address_hi TEXT NOT NULL,
        address_en TEXT NOT NULL,
        pincode VARCHAR(16) NOT NULL,
        timing TEXT NOT NULL,
        phone VARCHAR(32) NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS distribution_centers_sale_center_idx ON distribution_centers (sale_center_id);`;
    await sql`CREATE INDEX IF NOT EXISTS distribution_centers_city_idx ON distribution_centers (city_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS sale_center_sweets (
        sale_center_id VARCHAR(64) NOT NULL,
        sweet_id VARCHAR(64) NOT NULL,
        price_per_kg REAL NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        PRIMARY KEY (sale_center_id, sweet_id)
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS sale_center_sweets_sale_center_idx ON sale_center_sweets (sale_center_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS festivals (
        id VARCHAR(64) PRIMARY KEY,
        name_hi TEXT NOT NULL,
        name_en TEXT NOT NULL,
        status VARCHAR(32) NOT NULL,
        start_date VARCHAR(32) NOT NULL,
        cutoff_date VARCHAR(32) NOT NULL,
        distribution_start_date VARCHAR(32) NOT NULL,
        distribution_end_date VARCHAR(32) NOT NULL,
        max_kg_per_booking REAL NOT NULL,
        default_mitra_credit_limit REAL NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS mitra_applications (
        id VARCHAR(64) PRIMARY KEY,
        city_id VARCHAR(64) NOT NULL,
        city_name_hi TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email TEXT NOT NULL,
        pincode VARCHAR(16) NOT NULL,
        address TEXT NOT NULL,
        agreed_to_center BOOLEAN NOT NULL,
        status VARCHAR(32) NOT NULL,
        rejection_reason TEXT,
        created_at TEXT NOT NULL,
        temp_password TEXT,
        credit_limit REAL NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(64) PRIMARY KEY,
        festival_id VARCHAR(64) NOT NULL,
        festival_name_hi TEXT NOT NULL,
        city_id VARCHAR(64) NOT NULL,
        city_name_hi TEXT NOT NULL,
        center_id VARCHAR(64) NOT NULL,
        center_name_hi TEXT NOT NULL,
        center_address_hi TEXT NOT NULL,
        center_phone VARCHAR(32) NOT NULL,
        booked_by_role VARCHAR(32) NOT NULL,
        mitra_id VARCHAR(64),
        mitra_name TEXT,
        customer JSONB NOT NULL,
        items JSONB NOT NULL,
        total_kg REAL NOT NULL,
        total_amount REAL NOT NULL,
        payment_method VARCHAR(32) NOT NULL,
        payment_status VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL,
        pickup_date VARCHAR(32) NOT NULL,
        delivery_otp VARCHAR(16) NOT NULL,
        created_at TEXT NOT NULL,
        delivered_at TEXT,
        invoice_id VARCHAR(64),
        zoho_payment_id TEXT,
        zoho_payment_session_id TEXT,
        zoho_order_id TEXT,
        zoho_payment_mode TEXT
      );
    `;

    // Safe migrations for existing tables
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS zoho_payment_id TEXT;`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS zoho_payment_session_id TEXT;`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS zoho_order_id TEXT;`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS zoho_payment_mode TEXT;`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS subtotal_amount REAL;`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code VARCHAR(64);`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount REAL;`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_mode VARCHAR(16);`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_mitra_id VARCHAR(64);`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_mitra_name TEXT;`;
    await sql`ALTER TABLE mitra_applications ADD COLUMN IF NOT EXISTS center_id VARCHAR(64);`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sale_center_id VARCHAR(64);`;

    // Users-table FK reference columns (additive; backfilled by the users migration).
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_user_id VARCHAR(64);`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mitra_user_id VARCHAR(64);`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_mitra_user_id VARCHAR(64);`;
    await sql`ALTER TABLE cities ADD COLUMN IF NOT EXISTS admin_user_id VARCHAR(64);`;
    await sql`ALTER TABLE sale_centers ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(64);`;
    await sql`ALTER TABLE mitra_applications ADD COLUMN IF NOT EXISTS user_id VARCHAR(64);`;
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_user_id VARCHAR(64);`;

    // Location-hierarchy foreign keys (City -> Sale Centre -> Distribution Centre -> Booking).
    // Added as guarded, idempotent constraints so re-running startup never fails.
    // Data is validated to satisfy these before they are applied.
    const addFk = async (
      constraint: string,
      table: string,
      column: string,
      refTable: string,
      refColumn = 'id'
    ) => {
      await sql.unsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
          ) THEN
            ALTER TABLE ${table}
              ADD CONSTRAINT ${constraint}
              FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn});
          END IF;
        END $$;
      `);
    };

    try {
      await addFk('sale_centers_city_id_fkey', 'sale_centers', 'city_id', 'cities');
      await addFk('distribution_centers_sale_center_id_fkey', 'distribution_centers', 'sale_center_id', 'sale_centers');
      await addFk('distribution_centers_city_id_fkey', 'distribution_centers', 'city_id', 'cities');
      await addFk('bookings_sale_center_id_fkey', 'bookings', 'sale_center_id', 'sale_centers');
      await addFk('bookings_center_id_fkey', 'bookings', 'center_id', 'distribution_centers');
      await addFk('sale_center_sweets_sale_center_id_fkey', 'sale_center_sweets', 'sale_center_id', 'sale_centers');
      await addFk('sale_center_sweets_sweet_id_fkey', 'sale_center_sweets', 'sweet_id', 'master_sweets');
    } catch (fkErr) {
      // Never block startup on FK creation; log so it can be resolved (e.g. stale data).
      console.warn('Could not add location-hierarchy foreign keys:', fkErr);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS discounts (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        title_hi TEXT NOT NULL,
        title_en TEXT NOT NULL,
        description_hi TEXT,
        city_id VARCHAR(64) NOT NULL,
        center_id VARCHAR(64) DEFAULT 'all',
        discount_type VARCHAR(32) NOT NULL,
        discount_value REAL NOT NULL,
        min_order_amount REAL DEFAULT 0 NOT NULL,
        max_discount_amount REAL,
        start_date VARCHAR(32),
        expiry_date VARCHAR(32),
        usage_limit INTEGER,
        times_used INTEGER DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        actor TEXT NOT NULL,
        action_hi TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS password_resets (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        email TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS password_resets_token_idx ON password_resets (token_hash);`;

    await sql`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id VARCHAR(64) PRIMARY KEY,
        event_hi TEXT NOT NULL,
        sms_enabled BOOLEAN NOT NULL,
        email_enabled BOOLEAN NOT NULL,
        template_text_hi TEXT NOT NULL,
        dlt_approved BOOLEAN NOT NULL
      );
    `;

    console.log('Tables created or already exist in Supabase Postgres!');
    await sql.end();

    // Non-destructive seed on startup: upserts reference/master data without
    // deleting existing rows, so test/manual data is preserved across restarts.
    // Use POST /api/seed or /api/reset-data for an explicit full reset.
    await seedDatabase(false);
  } catch (err) {
    console.error('Error in ensureTablesExist:', err);
    await sql.end();
  }
}
