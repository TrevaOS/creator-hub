import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL environment variable.');
}

if (!supabaseAnonKey) {
  console.warn('[Supabase] Missing VITE_SUPABASE_ANON_KEY environment variable.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type SupabaseClient = typeof supabase;
