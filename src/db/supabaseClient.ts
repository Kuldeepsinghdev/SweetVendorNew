import { createClient } from '@supabase/supabase-js';

const nodeEnv = typeof process !== 'undefined' ? process.env : {};
const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

const supabaseUrl = nodeEnv.SUPABASE_URL || viteEnv.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co';
const supabaseKey = nodeEnv.SUPABASE_SECRET_KEY || nodeEnv.SUPABASE_PUBLISHABLE_KEY || viteEnv.VITE_SUPABASE_ANON_KEY || 'REMOVED_SUPABASE_SECRET_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

