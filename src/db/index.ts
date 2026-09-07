import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '';

const client = dbUrl
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

export const db = drizzle(client, { schema });
