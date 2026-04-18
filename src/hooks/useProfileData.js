import { useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useProfile } from '../store/ProfileContext';
import { supabase } from '../services/supabase';

export function useProfileData() {
  const { user } = useAuth();
  const { socialAccounts, dashboardModules, carouselImages, collabBrands, loading, dispatch } = useProfile();

  const fetchAll = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_SOCIAL_ACCOUNTS', payload: [] });
      dispatch({ type: 'SET_DASHBOARD_MODULES', payload: null });
      dispatch({ type: 'SET_CAROUSEL_IMAGES', payload: [] });
      dispatch({ type: 'SET_COLLAB_BRANDS', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });

    const [socials, modules, images, brands] = await Promise.all([
      supabase.from('creator_social_accounts').select('*').eq('user_id', user.id),
      supabase.from('creator_dashboard_modules').select('*').eq('user_id', user.id).single(),
      supabase.from('creator_carousel_images').select('*').eq('user_id', user.id).order('order'),
      supabase.from('creator_collab_brands').select('*').eq('user_id', user.id),
    ]);

    if (socials.data) dispatch({ type: 'SET_SOCIAL_ACCOUNTS', payload: socials.data });
    if (modules.data) dispatch({ type: 'SET_DASHBOARD_MODULES', payload: modules.data });
    if (images.data) dispatch({ type: 'SET_CAROUSEL_IMAGES', payload: images.data });
    if (brands.data) dispatch({ type: 'SET_COLLAB_BRANDS', payload: brands.data });

    dispatch({ type: 'SET_LOADING', payload: false });
  }, [user, dispatch]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { socialAccounts, dashboardModules, carouselImages, collabBrands, loading, refetch: fetchAll };
}
