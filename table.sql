-- ─────────────────────────────────────────────────────────────────────────────
-- Influencer Discovery Schema
-- Follows the architecture in table.txt
-- global_contacts is pre-existing; the 4 tables below are new.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. global_contacts  (extend if not already present)
--    Universal human identity — one row per real person.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.global_contacts (
  id           bigserial primary key,
  name         text not null,
  phone        text,
  email        text,
  gender       text,
  avatar_url   text,
  city         text,
  state        text,
  address      text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. influencer_profiles
--    Discovery engine core — one row per influencer/platform account.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.influencer_profiles (
  id                  bigserial primary key,
  global_contact_id   bigint references public.global_contacts(id) on delete set null,

  -- Instagram identity
  instagram_handle    text,                        -- @username
  instagram_id        text,                        -- IG numeric ID
  profile_url         text,

  -- Content
  bio                 text,
  primary_niche       text,                        -- 'Food' | 'Fashion' | 'Travel' …
  niches              text[],                      -- ['Food','Lifestyle']

  -- Reach
  followers_exact     bigint  default 0,           -- sortable number
  followers_count     text,                        -- display string "250K"
  avg_plays_raw       text,                        -- "35k"
  impressions_raw     text,

  -- Platform
  platform            text    default 'instagram'
                        check (platform in ('instagram','youtube','facebook','tiktok','twitter')),
  is_verified         boolean default false,

  -- Deal
  deal_type           text    default 'unpaid'
                        check (deal_type in ('paid','barter','unpaid')),
  cost                text,                        -- "17k" | "Barter" | "On request"

  -- Location
  area                text,                        -- "Indiranagar"
  lat                 double precision,
  lng                 double precision,

  -- Meta
  source              text,                        -- "CSV" | "Manual" | "Scraped"
  scraped             boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_influencer_profiles_contact    on public.influencer_profiles (global_contact_id);
create index idx_influencer_profiles_niches     on public.influencer_profiles using gin(niches);
create index idx_influencer_profiles_deal_type  on public.influencer_profiles (deal_type);
create index idx_influencer_profiles_platform   on public.influencer_profiles (platform);
create index idx_influencer_profiles_followers  on public.influencer_profiles (followers_exact desc);
create index idx_influencer_profiles_area       on public.influencer_profiles (area);
create index idx_influencer_profiles_latlng     on public.influencer_profiles (lat, lng);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. influencer_posts
--    IG reels / posts linked to an influencer profile.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.influencer_posts (
  id                    bigserial primary key,
  influencer_profile_id bigint not null references public.influencer_profiles(id) on delete cascade,

  post_url              text,
  thumbnail_url         text,
  caption               text,
  hashtags              text[],
  likes_count           int default 0,
  comments_count        int default 0,
  views_count           int default 0,
  posted_at             timestamptz
);

create index idx_influencer_posts_profile on public.influencer_posts (influencer_profile_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. brand_influencer_actions
--    Per-brand star ⭐ / heart ❤️ actions on an influencer.
--    Replaces discover_actions. Scoped to organization + user.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.brand_influencer_actions (
  id                    bigserial primary key,
  organization_id       bigint not null references public.organizations(id) on delete cascade,
  influencer_profile_id bigint not null references public.influencer_profiles(id) on delete cascade,
  created_by            bigint references public.organization_users(id) on delete set null,

  starred               boolean default false,
  hearted               boolean default false,
  notes                 text,

  created_at            timestamptz default now(),

  unique (organization_id, influencer_profile_id, created_by)
);

create index idx_brand_inf_actions_org        on public.brand_influencer_actions (organization_id);
create index idx_brand_inf_actions_influencer on public.brand_influencer_actions (influencer_profile_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. brand_influencer_filters
--    Persists a brand user's last-used Discover filter state.
--    Replaces discover_filters.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.brand_influencer_filters (
  id               bigserial primary key,
  organization_id  bigint not null references public.organizations(id) on delete cascade,
  user_id          bigint references public.organization_users(id) on delete cascade,

  deal_types       text[],                  -- ['paid','barter']
  niches           text[],                  -- ['Food','Travel']
  platforms        text[],                  -- ['instagram','youtube']
  regions          text[],                  -- ['Indiranagar','Koramangala']
  radius_km        int default 9999,
  search_query     text,

  updated_at       timestamptz default now(),

  unique (organization_id, user_id)
);
