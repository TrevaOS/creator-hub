import { useEffect, useState } from 'react';

// ── types ──────────────────────────────────────────────────────────────────────

export interface ExternalLink {
  title: string;
  url: string;
}

export interface SocialLinks {
  youtube?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  snapchat?: string;
  linkedin?: string;
  website?: string;
}

export interface InstagramPost {
  id: string;
  shortCode: string;
  url: string;
  type: string;           // 'Image' | 'Video'
  productType: string;    // 'clips' | 'igtv' | 'feed'
  thumbLocal: string;     // /data/posts/username_1.jpg  (permanent local)
  thumbCdn: string;       // original CDN url (may expire)
  displayUrl: string;     // thumbLocal || thumbCdn
  videoUrl: string;
  images: string[];
  caption: string;
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  videoViewCount: number;
  timestamp: string;
  locationName: string;
  locationId: string;
  isPinned: boolean;
  isCommentsDisabled: boolean;
  alt: string;
  dimensionsH: number;
  dimensionsW: number;
  musicArtist: string;
  musicSong: string;
  usesOriginalAudio: boolean;
}

export interface InfluencerProfile {
  // identity
  id: string;
  instagramId: string;
  fbid: string;
  name: string;
  handle: string;
  profileId: string;
  profileUrl: string;

  // CSV data
  gender: string;
  followers: string;        // raw string from CSV e.g. "226k"
  followersExact: number;   // real number from scraper
  followingCount: number;
  postsCount: number;
  igtvCount: number;
  highlightReelCount: number;
  category: string;
  categories: string[];
  primaryCategory: string;
  avgPlays: string;
  impressions: string;
  areaOrCity: string;
  influencerType: string;
  response: string;
  cost: string;
  phone: string;
  email: string;
  notes: string;
  source: string;
  sourceTags: string[];

  // scraped profile data
  avatarUrl: string;        // local path first, then unavatar fallback
  profilePicLocal: string;  // /data/avatars/username.jpg
  bio: string;
  isVerified: boolean;
  isPrivate: boolean;
  isBusinessAccount: boolean;
  joinedRecently: boolean;
  businessCategory: string;
  externalUrl: string;
  externalUrls: ExternalLink[];
  socialLinks: SocialLinks;

  // scraped posts (max 3, local thumbnails)
  latestPosts: InstagramPost[];

  // meta
  scraped: boolean;
}

// ── constants ──────────────────────────────────────────────────────────────────

const CSV_URL      = '/data/influencers.csv';
const PROFILES_URL = '/data/profiles.json';

let cache: InfluencerProfile[] | null = null;
let inflight: Promise<InfluencerProfile[]> | null = null;

// ── public hooks ───────────────────────────────────────────────────────────────

export async function loadInfluencers(): Promise<InfluencerProfile[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = doLoad()
      .then(r => { cache = r; inflight = null; return r; })
      .catch(e => { inflight = null; throw e; });
  }
  return inflight;
}

export function useInfluencers() {
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    loadInfluencers()
      .then(r  => { if (active) { setInfluencers(r); setError(null); } })
      .catch(e  => { if (active) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { influencers, loading, error };
}

// ── loader ─────────────────────────────────────────────────────────────────────

async function doLoad(): Promise<InfluencerProfile[]> {
  try {
    const res = await fetch(PROFILES_URL, { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0)
        return json.map((p, i) => fromScraped(p, i)).filter(Boolean) as InfluencerProfile[];
    }
  } catch { /* fall through to CSV */ }

  const res = await fetch(CSV_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Unable to load influencer data (${res.status})`);
  return buildFromCsv(parseCsv(await res.text()));
}

// ── map scraped profile (profiles.json) → InfluencerProfile ───────────────────

function fromScraped(p: Record<string, any>, index: number): InfluencerProfile {
  const handle   = (p.handle || p.username || '').toLowerCase();
  const category = p.category || '';
  const categories = splitTags(category);

  // Profile pic: local file first (permanent), then unavatar
  const profilePicLocal = p.profilePicLocal || '';
  const avatarUrl = profilePicLocal
    || (handle ? `https://unavatar.io/instagram/${encodeURIComponent(handle)}` : '');

  // Map posts — local thumbnail takes priority over CDN
  const latestPosts: InstagramPost[] = (p.latestPosts || []).slice(0, 3).map((post: Record<string, any>): InstagramPost => ({
    id:                 post.id            || '',
    shortCode:          post.shortCode     || '',
    url:                post.url           || `https://www.instagram.com/p/${post.shortCode || ''}/`,
    type:               post.type          || 'Image',
    productType:        post.productType   || '',
    thumbLocal:         post.thumbLocal    || '',
    thumbCdn:           post.thumbCdn      || post.displayUrl || '',
    displayUrl:         post.thumbLocal    || post.thumbCdn || post.displayUrl || '',
    videoUrl:           post.videoUrl      || '',
    images:             post.images        || [],
    caption:            post.caption       || '',
    hashtags:           post.hashtags      || [],
    mentions:           post.mentions      || [],
    likesCount:         post.likesCount    || 0,
    commentsCount:      post.commentsCount || 0,
    videoViewCount:     post.videoViewCount|| 0,
    timestamp:          post.timestamp     || '',
    locationName:       post.locationName  || '',
    locationId:         post.locationId    || '',
    isPinned:           !!post.isPinned,
    isCommentsDisabled: !!post.isCommentsDisabled,
    alt:                post.alt           || '',
    dimensionsH:        post.dimensionsH   || 0,
    dimensionsW:        post.dimensionsW   || 0,
    musicArtist:        post.musicArtist   || '',
    musicSong:          post.musicSong     || '',
    usesOriginalAudio:  !!post.usesOriginalAudio,
  }));

  const externalUrls: ExternalLink[] = (p.externalUrls || []).map((e: any) => ({
    title: e.title || '',
    url:   e.url   || '',
  }));

  return {
    id:                p.instagramId || handle || `influencer-${index + 1}`,
    instagramId:       p.instagramId || '',
    fbid:              p.fbid || '',
    name:              p.fullName || capitalizeWords(handle) || 'Creator',
    handle:            handle ? `@${handle}` : '',
    profileId:         handle,
    profileUrl:        p.profileUrl || `https://www.instagram.com/${handle}/`,

    gender:            p.gender          || '',
    followers:         p.followersRaw    || (p.followersCount ? fmtNum(p.followersCount) : ''),
    followersExact:    p.followersCount  || 0,
    followingCount:    p.followsCount    || 0,
    postsCount:        p.postsCount      || 0,
    igtvCount:         p.igtvVideoCount  || 0,
    highlightReelCount:p.highlightReelCount || 0,
    category,
    categories,
    primaryCategory:   categories[0] || category || 'Lifestyle',
    avgPlays:          p.avgPlaysRaw    || '',
    impressions:       p.impressionsRaw || '',
    areaOrCity:        p.area           || '',
    influencerType:    p.influencerType || '',
    response:          p.response       || '',
    cost:              p.cost           || '',
    phone:             '',
    email:             p.email          || '',
    notes:             p.notes          || '',
    source:            p.source         || '',
    sourceTags:        splitTags(p.source || ''),

    avatarUrl,
    profilePicLocal,
    bio:               p.bio            || '',
    isVerified:        !!p.isVerified,
    isPrivate:         !!p.isPrivate,
    isBusinessAccount: !!p.isBusinessAccount,
    joinedRecently:    !!p.joinedRecently,
    businessCategory:  p.businessCategory || '',
    externalUrl:       p.externalUrl      || '',
    externalUrls,
    socialLinks:       p.socialLinks      || {},

    latestPosts,
    scraped:           !!p.scraped,
  };
}

// ── CSV fallback ───────────────────────────────────────────────────────────────

function buildFromCsv(rows: string[][]): InfluencerProfile[] {
  if (!rows.length) return [];
  const header = rows[0];
  const idx = new Map<string, number>();
  header.forEach((l, i) => idx.set(normalizeHeader(l), i));
  return rows.slice(1).map((row, i) => csvRow(row, idx, i)).filter(Boolean) as InfluencerProfile[];
}

function csvRow(row: string[], idx: Map<string, number>, index: number): InfluencerProfile | null {
  const get = (l: string) => normalizeValue(row[idx.get(normalizeHeader(l)) ?? -1] ?? '');
  const name = get('Name'), profileId = get('Profile ID'), profileUrl = get('Profile URL');
  if (![name, profileId, profileUrl].some(Boolean)) return null;

  const handleCore = extractHandle(profileId, profileUrl);
  const handle     = handleCore ? `@${handleCore}` : '';
  const category   = get('Category');
  const categories = splitTags(category);
  const source     = get('Source');
  const avatarUrl  = handleCore ? `https://unavatar.io/instagram/${encodeURIComponent(handleCore)}` : '';

  return {
    id: buildId(handleCore, profileUrl, name, index),
    instagramId: '', fbid: '',
    name:           name || capitalizeWords(handleCore || '') || 'Creator',
    handle, profileId: profileId || handleCore || '', profileUrl,
    gender:         get('Gender'),
    followers:      get('Followers'),
    followersExact: 0, followingCount: 0, postsCount: 0, igtvCount: 0, highlightReelCount: 0,
    category, categories,
    primaryCategory: categories[0] || category || 'Lifestyle',
    avgPlays:       get('Avg. Plays'),
    impressions:    get('Impressions'),
    areaOrCity:     get('Area/City'),
    influencerType: get('Influencer Type'),
    response:       get('Response'),
    cost:           get('Cost'),
    phone:          get('Phone'),
    email:          get('Email'),
    notes:          get('Notes'),
    source, sourceTags: splitTags(source),
    avatarUrl,
    profilePicLocal: '',
    bio: '', isVerified: false, isPrivate: false, isBusinessAccount: false,
    joinedRecently: false, businessCategory: '', externalUrl: '', externalUrls: [],
    socialLinks: {}, latestPosts: [], scraped: false,
  };
}

// ── CSV parser ─────────────────────────────────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], cell = '', inQ = false;
  const pushCell = () => { cur.push(normalizeValue(cell)); cell = ''; };
  const pushRow  = () => {
    if (!cur.length || cur.every(v => !v)) { cur = []; return; }
    rows.push(cur); cur = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (inQ && text[i+1] === '"') { cell += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) pushCell();
    else if ((c === '\n' || c === '\r') && !inQ) { if (c === '\r' && text[i+1] === '\n') i++; pushCell(); pushRow(); }
    else cell += c;
  }
  if (cell || cur.length) { pushCell(); pushRow(); }
  return rows;
}

// ── utilities ─────────────────────────────────────────────────────────────────

function normalizeHeader(v: string) {
  return v.replace(/﻿/g,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
}
function normalizeValue(v: string) {
  const c = (v||'').replace(/﻿/g,'').trim().replace(/\s+/g,' ');
  return ['na','n/a','profile not available'].includes(c.toLowerCase()) ? '' : c;
}
function splitTags(v: string): string[] {
  const n = normalizeValue(v); if (!n) return [];
  const seen = new Set<string>(); const out: string[] = [];
  n.split(/[,/|]+/).map(p=>p.trim()).filter(Boolean).forEach(p => {
    const k = p.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(p); }
  });
  return out;
}
function extractHandle(profileId: string, profileUrl: string): string | null {
  let c = profileId.replace(/^@/,'').trim();
  if (!c && profileUrl) { const m = profileUrl.match(/instagram\.com\/([^/?#\s]+)/i); if (m) c = m[1].trim().replace(/\/$/,''); }
  const s = c.replace(/\s+/g,'').replace(/[^a-z0-9._]/gi,'');
  return s || null;
}
function buildId(handle: string|null, profileUrl: string, name: string, index: number): string {
  const base = handle ?? profileUrl ?? name;
  if (!base) return `influencer-${index+1}`;
  const slug = base.toLowerCase().replace(/^https?:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return slug || `influencer-${index+1}`;
}
function capitalizeWords(v: string) {
  return v.split(/[\s_]+/).filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ');
}
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(0)}K`;
  return String(n);
}
