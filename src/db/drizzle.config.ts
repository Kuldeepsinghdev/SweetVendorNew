import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
    ? {
        url: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL!,
      }
    : {
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_USER || 'app_user',
        password: process.env.SQL_PASSWORD || '',
        database: process.env.SQL_DB_NAME || 'app_db',
        ssl: false,
      },
});
