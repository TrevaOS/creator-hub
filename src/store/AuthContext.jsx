import { createContext, useContext, useReducer, useEffect } from 'react';
import { isDemoMode, supabase, createCreatorProfileViaFunction } from '../services/supabase';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  profile: null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const normalizeUsername = (value) => value?.trim()?.toLowerCase()?.replace(/\s+/g, '_') || '';

  async function assertUsernameAvailable(username, excludeUserId = null) {
    const clean = normalizeUsername(username);
    if (!clean) throw new Error('Username is required');
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('auth_user_id')
      .eq('username', clean)
      .limit(1);
    if (error) throw error;
    const takenByAnother = (data || []).some((row) => row.auth_user_id !== excludeUserId);
    if (takenByAnother) throw new Error('Username already exists. Please choose a different username.');
    return clean;
  }

  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('creator_hub_demo_user');
      if (saved) {
        try {
          dispatch({ type: 'SET_USER', payload: JSON.parse(saved) });
        } catch {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user });
        fetchProfile(session.user.id);
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }).catch(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          dispatch({ type: 'SET_USER', payload: session.user });
          fetchProfile(session.user.id);
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (data) {
        const mapped = {
          ...data,
          profile_id: data.id,
          id: data.auth_user_id,
          name: data.display_name,
          location: data.base_city,
        };
        dispatch({ type: 'SET_PROFILE', payload: mapped });
      }
    } catch (e) {
      // Profile may not exist yet
    }
  }

  const signUp = async (email, password, username) => {
    if (isDemoMode) {
      const demoUser = {
        id: 'demo-user',
        email,
        user_metadata: { username: username || email?.split('@')[0] || 'demo_user' },
      };
      localStorage.setItem('creator_hub_demo_user', JSON.stringify(demoUser));
      dispatch({ type: 'SET_USER', payload: demoUser });
      dispatch({
        type: 'SET_PROFILE',
        payload: { id: demoUser.id, username: demoUser.user_metadata.username, name: 'Demo User' },
      });
      return { user: demoUser };
    }

    const cleanUsername = await assertUsernameAvailable(username || email.split('@')[0]);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      try {
        await createCreatorProfileViaFunction({
          authUserId: data.user.id,
          displayName: username || email.split('@')[0],
          username: cleanUsername,
        });
      } catch (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }
    }

    return data;
  };

  const signIn = async (email, password) => {
    if (isDemoMode) {
      if (!email || !password) {
        throw new Error('Enter email and password');
      }
      const demoUser = {
        id: 'demo-user',
        email,
        user_metadata: { username: email.split('@')[0] || 'demo_user' },
      };
      localStorage.setItem('creator_hub_demo_user', JSON.stringify(demoUser));
      dispatch({ type: 'SET_USER', payload: demoUser });
      dispatch({
        type: 'SET_PROFILE',
        payload: { id: demoUser.id, username: demoUser.user_metadata.username, name: 'Demo User' },
      });
      return { user: demoUser };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem('creator_hub_demo_user');
      dispatch({ type: 'LOGOUT' });
      return;
    }

    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (updates) => {
    if (!state.user) return;
    if (isDemoMode) {
      const profile = { ...(state.profile || {}), ...updates, updated_at: new Date().toISOString() };
      dispatch({ type: 'UPDATE_PROFILE', payload: profile });
      return profile;
    }

    const dbUpdates = { ...updates, updated_at: new Date().toISOString() };
    if ('username' in dbUpdates) {
      dbUpdates.username = await assertUsernameAvailable(dbUpdates.username, state.user.id);
    }
    if ('name' in dbUpdates) { dbUpdates.display_name = dbUpdates.name; delete dbUpdates.name; }
    if ('location' in dbUpdates) { dbUpdates.base_city = dbUpdates.location; delete dbUpdates.location; }

    const { data, error } = await supabase
      .from('creator_profiles')
      .upsert({ auth_user_id: state.user.id, ...dbUpdates }, { onConflict: 'auth_user_id' })
      .select()
      .single();
    if (error) throw error;
    const mapped = { ...data, profile_id: data.id, id: data.auth_user_id, name: data.display_name, location: data.base_city };
    dispatch({ type: 'UPDATE_PROFILE', payload: mapped });
    return mapped;
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, updateProfile, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
