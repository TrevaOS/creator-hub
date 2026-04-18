import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasValidUrl =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder.supabase.co');

const hasValidAnonKey =
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('placeholder-key');

export const supabaseConfigError =
  hasValidUrl && hasValidAnonKey
    ? null
    : 'Supabase is not configured for this deployment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your host build environment and redeploy.';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
