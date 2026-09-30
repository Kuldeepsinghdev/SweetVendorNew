// Quick script to create admin user
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { config } from 'dotenv';

config();

async function main() {
  const sql = postgres(process.env.DATABASE_URL || '', {
    ssl: { rejectUnauthorized: false },
  });

  try {
    const phone = '7737691749';
    const pin = '4729';
    const name = 'Super Admin';
    const email = 'superadmin@sahakar.local';
    const id = `usr_superadmin_${phone}`;
    const now = new Date().toISOString();

    const pinHash = await bcrypt.hash(pin, 10);

    console.log('Creating admin user...');
    console.log(`Phone: ${phone}`);
    console.log(`PIN: ${pin}`);

    await sql`
      INSERT INTO users (
        id, name, phone, email, role, pin_hash, city_id, 
        pincode, address, must_reset_pin, is_active, created_at, updated_at
      ) VALUES (
        ${id}, ${name}, ${phone}, ${email}, 'super_admin',
        ${pinHash}, null, null, null, false, true, ${now}, ${now}
      )
    `;

    console.log('\n✅ Admin user created successfully!');
    console.log(`User ID: ${id}`);
    console.log(`You can now login with:`);
    console.log(`  Phone: ${phone}`);
    console.log(`  PIN: ${pin}`);
    
    await sql.end();
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

main();
