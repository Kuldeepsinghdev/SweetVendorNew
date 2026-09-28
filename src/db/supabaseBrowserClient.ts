import { createClient } from '@supabase/supabase-js';

/**
 * Browser-safe Supabase client.
 *
 * Uses ONLY NEXT_PUBLIC_* values so no server secret is ever bundled into the
 * client. Intended for anon-permitted operations from the browser, such as
 * uploading images to the public `sweets` storage bucket.
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xuujzjcdikgpijbephok.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
