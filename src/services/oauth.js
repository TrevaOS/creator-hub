/**
 * OAuth Service — Instagram Business Login + YouTube (Google OAuth)
 *
 * Instagram uses Meta's Business Login (Instagram Graph API).
 * YouTube uses Google OAuth 2.0 with YouTube Data API v3.
 *
 * SETUP REQUIRED (add to your .env file):
 *   VITE_INSTAGRAM_APP_ID=<your Meta Instagram App ID>
 *   VITE_INSTAGRAM_REDIRECT_URI=<e.g. https://yourapp.com/oauth/instagram>
 *   VITE_GOOGLE_CLIENT_ID=<your Google Cloud OAuth client_id>
 *   VITE_GOOGLE_REDIRECT_URI=<e.g. https://yourapp.com/oauth/youtube>
 *
 * Token exchange (code → access_token) MUST happen on the backend to keep
 * app secrets private. This file contains the frontend OAuth redirect + a
 * backend proxy path (/api/oauth/*) that you should implement in your
 * server (Node/Express) or as Supabase Edge Functions.
 */

import { supabase } from './supabase';

/* ── INSTAGRAM ─────────────────────────────────────────────── */
const INSTAGRAM_APP_ID      = import.meta.env.VITE_INSTAGRAM_APP_ID      || '';
const INSTAGRAM_REDIRECT_URI = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI || `${window.location.origin}/oauth/instagram`;
const INSTAGRAM_SCOPE = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
].join(',');

export function isInstagramOAuthConfigured() {
  return Boolean(INSTAGRAM_APP_ID) && !INSTAGRAM_APP_ID.includes('your_');
}

export function getInstagramAuthURL() {
  if (!isInstagramOAuthConfigured()) return '';
  const params = new URLSearchParams({
    client_id:     INSTAGRAM_APP_ID,
    redirect_uri:  INSTAGRAM_REDIRECT_URI,
    response_type: 'code',
    scope:         INSTAGRAM_SCOPE,
  });
  return `https://www.instagram.com/oauth/authorize?${params}`;
}

/** Called from the /oauth/instagram callback page with `code` from URL. */
export async function exchangeInstagramCode(code, userId) {
  // Exchange code for token via your backend proxy
  const res = await fetch('/api/oauth/instagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: INSTAGRAM_REDIRECT_URI }),
  });
  if (!res.ok) throw new Error('Instagram token exchange failed');
  const { access_token, user_id: ig_user_id } = await res.json();

  // Store long-lived token in Supabase
  await supabase.from('creator_oauth_tokens').upsert({
    user_id:      userId,
    platform:     'instagram',
    access_token,
    platform_user_id: String(ig_user_id),
    expires_at:   new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'user_id,platform' });

  return { access_token, ig_user_id };
}

/* ── YOUTUBE (Google) ──────────────────────────────────────── */
const GOOGLE_CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID    || '';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth/youtube`;
const GOOGLE_SCOPE = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
  'profile',
  'email',
].join(' ');

export function isYouTubeOAuthConfigured() {
  return Boolean(GOOGLE_CLIENT_ID) && !GOOGLE_CLIENT_ID.includes('your_');
}

export function getYouTubeAuthURL() {
  if (!isYouTubeOAuthConfigured()) return '';
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope:         GOOGLE_SCOPE,
    access_type:   'offline',
    prompt:        'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Called from the /oauth/youtube callback page with `code` from URL. */
export async function exchangeYouTubeCode(code, userId) {
  const res = await fetch('/api/oauth/youtube', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: GOOGLE_REDIRECT_URI }),
  });
  if (!res.ok) throw new Error('YouTube token exchange failed');
  const { access_token, refresh_token, expires_in } = await res.json();

  await supabase.from('creator_oauth_tokens').upsert({
    user_id:       userId,
    platform:      'youtube',
    access_token,
    refresh_token,
    expires_at:    new Date(Date.now() + expires_in * 1000).toISOString(),
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'user_id,platform' });

  return { access_token };
}

/* ── DISCONNECT ─────────────────────────────────────────────── */
export async function disconnectPlatform(userId, platform) {
  await supabase
    .from('creator_oauth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('platform', platform);
}

/* ── STATUS CHECK ───────────────────────────────────────────── */
export async function getConnectedPlatforms(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('creator_oauth_tokens')
    .select('platform, expires_at')
    .eq('user_id', userId);
  return (data || []).filter(r => {
    if (!r.expires_at) return true;
    return new Date(r.expires_at) > new Date();
  }).map(r => r.platform);
}
