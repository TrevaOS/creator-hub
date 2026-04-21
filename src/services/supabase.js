import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://');
const hasValidAnonKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 20;

export const isSupabaseEnabled = hasValidUrl && hasValidAnonKey;
export const isDemoMode = !isSupabaseEnabled || import.meta.env.VITE_DISABLE_SUPABASE === 'true';
export const supabaseConfigError = isSupabaseEnabled
  ? null
  : 'Supabase not configured. Running in demo mode.';

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

export async function createCreatorProfileViaFunction({ authUserId, displayName, username }) {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not enabled');
  }

  const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-creator-profile`;
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ auth_user_id: authUserId, display_name: displayName, username }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to call creator profile function');
  }
  return result;
}

export default supabase;
