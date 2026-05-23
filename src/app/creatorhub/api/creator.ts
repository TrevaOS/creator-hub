import { supabase } from '../../../lib/supabaseClient';

export interface CreatorBasics {
  id: number;
  display_name: string;
  username: string | null;
  tagline: string | null;
  base_city: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  primary_niche: string | null;
  niche_tags: string[] | null;
}

export interface CreatorProfileDetails extends CreatorBasics {
  creator_profiles?: {
    about: string | null;
    spotify_playlist_url: string | null;
    spotify_playlist_title: string | null;
  } | null;
}

export async function fetchCreatorBasics(creatorId: number): Promise<CreatorProfileDetails | null> {
  const { data, error } = await supabase
    .from('creators')
    .select(
      `id, display_name, username, tagline, base_city, avatar_url, cover_url, primary_niche, niche_tags,
       creator_profiles ( about, spotify_playlist_url, spotify_playlist_title )`
    )
    .eq('id', creatorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as unknown as CreatorProfileDetails) ?? null;
}

export async function updateCreatorCoverUrl(creatorId: number, coverUrl: string | null): Promise<string | null> {
  const { data, error } = await supabase
    .from('creators')
    .update({ cover_url: coverUrl ?? null, updated_at: new Date().toISOString() })
    .eq('id', creatorId)
    .select('cover_url')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.cover_url ?? null) as string | null;
}

export async function uploadCreatorCoverImage(
  creatorId: number,
  file: File,
  bucket: string,
): Promise<string> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
  const ext = sanitizedName.includes('.') ? sanitizedName.split('.').pop() : 'jpg';
  const filePath = `creator-covers/${creatorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Unable to obtain public URL for uploaded cover image');
  }

  return data.publicUrl;
}
