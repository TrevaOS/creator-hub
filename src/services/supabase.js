import { createClient } from '@supabase/supabase-js';

function readEnv(...keys) {
  for (const key of keys) {
    const value = import.meta.env?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function parseBool(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

// Browser apps always expose Supabase URL + anon key in shipped JS.
// These fallback values prevent accidental "demo mode" deploys when CI forgets env vars.
const FALLBACK_SUPABASE_URL = 'https://ibdpadsrjvuptpetvpki.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZHBhZHNyanZ1cHRwZXR2cGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjY2OTIsImV4cCI6MjA4ODQ0MjY5Mn0.zXtIH0thuJaN69RCboKJlAQB1EvbZvniymNJ86gaPx8';

const supabaseUrl = readEnv('VITE_SUPABASE_URL', 'VITE_PUBLIC_SUPABASE_URL') || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = readEnv(
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_PUBLIC_SUPABASE_ANON_KEY',
) || FALLBACK_SUPABASE_ANON_KEY;
const disableSupabase = parseBool(import.meta.env.VITE_DISABLE_SUPABASE);
const allowDemoMode = parseBool(import.meta.env.VITE_ALLOW_DEMO_MODE);

const hasValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://');
const hasValidAnonKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 20;

export const isSupabaseEnabled = hasValidUrl && hasValidAnonKey;
export const isDemoMode = allowDemoMode && (!isSupabaseEnabled || disableSupabase);
const envAdminEmails = readEnv('VITE_SUPER_ADMIN_EMAILS')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
export const SUPER_ADMIN_EMAILS = Array.from(new Set([
  'fgdhanush@gmail.com',
  'admin@creatorhub.dev',
  ...envAdminEmails,
]));
export const supabaseConfigError = isSupabaseEnabled
  ? null
  : `Supabase env missing/invalid: ${
      !hasValidUrl ? 'VITE_SUPABASE_URL' : 'VITE_SUPABASE_ANON_KEY'
    }. Configure build env vars in Cloudflare and redeploy.`;

function createNoopQueryBuilder() {
  const state = { single: false, action: 'select' };

  const builder = {
    select() {
      state.action = 'select';
      return builder;
    },
    insert() {
      state.action = 'insert';
      return builder;
    },
    upsert() {
      state.action = 'upsert';
      return builder;
    },
    update() {
      state.action = 'update';
      return builder;
    },
    delete() {
      state.action = 'delete';
      return builder;
    },
    eq() {
      return builder;
    },
    order() {
      return builder;
    },
    single() {
      state.single = true;
      return builder;
    },
    then(resolve) {
      const data =
        state.action === 'select'
          ? (state.single ? null : [])
          : null;
      return Promise.resolve(resolve({ data, error: null }));
    },
    catch() {
      return builder;
    },
  };

  return builder;
}

function createNoopSupabaseClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signInWithPassword() {
        return { data: null, error: null };
      },
      async signUp() {
        return { data: { user: null }, error: null };
      },
      async signOut() {
        return { error: null };
      },
    },
    from() {
      return createNoopQueryBuilder();
    },
    channel() {
      return {
        on() {
          return this;
        },
        subscribe() {
          return this;
        },
      };
    },
    removeChannel() {},
    storage: {
      from() {
        return {
          async upload() {
            return { data: null, error: null };
          },
          getPublicUrl(path = '') {
            return { data: { publicUrl: path ? `/mock-storage/${path}` : '' } };
          },
        };
      },
    },
  };
}

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopSupabaseClient();

export function createEphemeralAnonClient() {
  if (!isSupabaseEnabled) return createNoopSupabaseClient();
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function isSuperAdminEmail(email) {
  const clean = String(email || '').trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.includes(clean);
}

export async function resolveOrgUserForAuthUser({ userId, email, autoLink = true } = {}) {
  if (!isSupabaseEnabled) return null;

  let orgUser = null;

  if (userId) {
    const { data } = await supabase
      .from('org_users')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) orgUser = data;
  }

  if (!orgUser && email) {
    const cleanEmail = String(email).trim().toLowerCase();
    const { data: byEmail } = await supabase
      .from('org_users')
      .select('*')
      .eq('email', cleanEmail);

    orgUser = Array.isArray(byEmail) && byEmail.length > 0 ? byEmail[0] : null;

    if (orgUser && autoLink && userId && !orgUser.user_id) {
      const { data: linked } = await supabase
        .from('org_users')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('id', orgUser.id)
        .select()
        .single();
      if (linked) orgUser = linked;
    }
  }

  return orgUser || null;
}

export async function createCreatorProfile({ authUserId, displayName, username }) {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const cleanUsername = username?.trim()?.toLowerCase().replace(/\s+/g, '_');
  if (!authUserId || !displayName || !cleanUsername) {
    throw new Error('authUserId, displayName, and username are required');
  }

  const { data, error } = await supabase
    .from('creator_profiles')
    .upsert(
      { auth_user_id: authUserId, display_name: displayName, username: cleanUsername },
      { onConflict: 'auth_user_id' },
    )
    .select()
    .single();

  if (!error && data) {
    return data;
  }

  console.warn('[createCreatorProfile] direct upsert failed, falling back to edge function:', error);
  return createCreatorProfileViaFunction({ authUserId, displayName, username: cleanUsername });
}

export async function ensureCreatorScaffold({ userId, email, displayName, username }) {
  if (!isSupabaseEnabled || !userId) return null;

  const cleanUsername = String(username || '').trim().toLowerCase().replace(/\s+/g, '_');
  const cleanDisplayName = String(displayName || cleanUsername || email?.split('@')[0] || 'Creator').trim();

  const profile = await createCreatorProfile({
    authUserId: userId,
    displayName: cleanDisplayName,
    username: cleanUsername || cleanDisplayName.toLowerCase().replace(/\s+/g, '_'),
  });

  const profileId = profile?.id || null;

  if (profileId) {
    await supabase.from('creator_dashboard_modules').upsert(
      { user_id: userId, creator_profile_id: profileId },
      { onConflict: 'user_id' },
    );
  }

  await resolveOrgUserForAuthUser({ userId, email, autoLink: true });
  return profile;
}

export async function createCreatorProfileViaFunction({ authUserId, displayName, username }) {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-creator-profile`;
  console.log('[createCreatorProfile] calling', functionUrl, { authUserId, displayName, username });

  let response;
  try {
    response = await fetch(functionUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ auth_user_id: authUserId, display_name: displayName, username }),
    });
  } catch (networkErr) {
    console.error('[createCreatorProfile] network error (fetch threw):', networkErr);
    throw new Error(`Network error calling creator profile function: ${networkErr.message}`);
  }

  console.log('[createCreatorProfile] response status:', response.status);

  let result;
  try {
    result = await response.json();
  } catch (err) {
    const text = await response.text().catch(() => 'Unable to read response');
    throw new Error(`Creator function returned ${response.status}: ${text}`);
  }

  console.log('[createCreatorProfile] response body:', result);

  if (!response.ok) {
    throw new Error(result?.error || `Failed to call creator profile function (${response.status})`);
  }

  return result.data || result;
}

export default supabase;
