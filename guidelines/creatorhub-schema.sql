-- =========================================================
-- CREATORHUB DATABASE SCHEMA (extension tables only)
-- Scope: only NEW tables needed by src/app/creatorhub/**
-- Everything below references the EXISTING live schema:
--   organizations, modules, subscriptions, org_users,
--   support_tickets, ticket_messages, influencer_profiles
-- No existing table is redefined or altered.
-- =========================================================

-- =========================================================
-- HOW IDENTITY MAPS ONTO THE EXISTING SCHEMA
-- =========================================================
-- Creator (logged-in CreatorHub user)
--   -> a row in public.org_users where role_type = 'creator'
--      (org_users already supports this role_type value)
--
-- Brand (swipe-discovery campaign cards)
--   -> a row in public.organizations that has the
--      "Creator Marketing" module enabled, i.e. an active row
--      in public.subscriptions for that organization_id where
--      modules.slug = 'creator-marketing'
--
-- Support tickets / alerts
--   -> existing public.support_tickets + public.ticket_messages,
--      scoped by organization_id and module_id (creator-marketing)
-- =========================================================

-- =========================================================
-- ENUMS
-- =========================================================

create type marketing_status as enum ('active', 'upcoming', 'paused', 'completed');
create type marketing_pipeline_stage as enum ('brief', 'shortlist', 'negotiation', 'live', 'wrap');
create type chat_stage as enum ('match', 'negotiating', 'booked', 'content', 'done');
create type chat_message_type as enum ('text', 'profile_card', 'offer', 'counter', 'calendar');
create type chat_actor as enum ('brand', 'creator');
create type activity_category as enum ('pitch', 'like', 'star', 'negotiation', 'profile', 'note', 'support');
create type portfolio_item_type as enum ('case_study', 'video', 'press', 'post', 'link');

-- =========================================================
-- CREATOR PROFILE EXTENSION
-- One row per org_user with role_type = 'creator'
-- =========================================================

create table public.creator_profile_ext (
    org_user_id bigint primary key references public.org_users(id) on delete cascade,
    handle text unique,
    tagline text,
    bio text,
    about text,
    base_city text,
    primary_niche text,
    niche_tags text[],
    cover_url text,
    follower_count integer default 0,
    following_count integer default 0,
    posts_count integer default 0,
    is_verified boolean default false,
    spotify_playlist_url text,
    spotify_playlist_title text,
    spotify_playlist_description text,
    spotify_playlist_followers integer,
    updated_at timestamptz default now()
);

create table public.creator_social_links (
    id bigserial primary key,
    org_user_id bigint references public.org_users(id) on delete cascade,
    platform text not null check (platform in ('instagram', 'facebook', 'spotify', 'youtube')),
    handle text,
    profile_url text,
    followers_label text,
    is_visible boolean default true,
    created_at timestamptz default now()
);

create table public.creator_highlights (
    id bigserial primary key,
    org_user_id bigint references public.org_users(id) on delete cascade,
    label text not null,
    value text not null,
    sort_order smallint default 0
);

create table public.creator_portfolio_items (
    id uuid primary key default gen_random_uuid(),
    org_user_id bigint references public.org_users(id) on delete cascade,
    item_type portfolio_item_type not null,
    title text not null,
    url text not null,
    description text,
    created_at timestamptz default now()
);

create table public.creator_gallery_images (
    id bigserial primary key,
    org_user_id bigint references public.org_users(id) on delete cascade,
    image_url text not null,
    sort_order integer default 0,
    created_at timestamptz default now()
);

-- =========================================================
-- BRAND MARKETING EXTENSION (campaign discovery / swipe cards)
-- One row per organization that has Creator Marketing enabled
-- =========================================================

create table public.brand_marketing_ext (
    organization_id bigint primary key references public.organizations(id) on delete cascade,
    tagline text,
    category text,
    location_label text,
    latitude numeric(10,6),
    longitude numeric(10,6),
    average_ticket_amount integer,
    average_ticket_currency text default 'INR',
    rating numeric(2,1),
    offer_copy text,
    brief text,
    status marketing_status not null default 'active',
    pipeline_stage marketing_pipeline_stage not null default 'brief',
    audience_fit smallint,
    fit_grade text,
    budget_amount integer,
    spend_to_date integer,
    target_launch date,
    campaign_objective text,
    owner_name text,
    owner_role text,
    owner_email text,
    owner_phone text,
    inbound_leads integer default 0,
    notes text,
    updated_at timestamptz default now()
);

create table public.brand_gallery_images (
    id bigserial primary key,
    organization_id bigint references public.organizations(id) on delete cascade,
    image_url text not null,
    sort_order smallint default 0
);

create table public.brand_deliverables (
    id bigserial primary key,
    organization_id bigint references public.organizations(id) on delete cascade,
    label text not null,
    sort_order smallint default 0
);

create table public.brand_marketing_tags (
    id bigserial primary key,
    organization_id bigint references public.organizations(id) on delete cascade,
    tag text not null,
    constraint brand_marketing_tags_unique unique (organization_id, tag)
);

-- =========================================================
-- CHAT / INBOX (creator <-> brand organization)
-- =========================================================

create table public.chat_threads (
    id bigserial primary key,
    organization_id bigint references public.organizations(id) on delete cascade,
    creator_org_user_id bigint references public.org_users(id) on delete cascade,
    stage chat_stage not null default 'match',
    unread_count smallint default 0,
    last_message_preview text,
    last_message_at timestamptz,
    matched_at timestamptz default now(),
    created_at timestamptz default now(),
    constraint chat_threads_unique_pair unique (organization_id, creator_org_user_id)
);

create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    thread_id bigint references public.chat_threads(id) on delete cascade,
    sender chat_actor not null,
    message_type chat_message_type not null default 'text',
    body text,
    monetary_amount integer,
    monetary_currency text default 'INR',
    deliverables text[],
    label text,
    extra jsonb,
    created_at timestamptz default now()
);

create index idx_chat_messages_thread on public.chat_messages (thread_id, created_at);

-- =========================================================
-- CREATOR ACTIVITY FEED
-- =========================================================

create table public.creator_activity_events (
    id uuid primary key default gen_random_uuid(),
    org_user_id bigint references public.org_users(id) on delete cascade,
    organization_id bigint references public.organizations(id) on delete set null,
    category activity_category not null,
    title text not null,
    description text,
    amount integer,
    occurred_at timestamptz not null default now(),
    created_at timestamptz default now()
);

-- =========================================================
-- CREATOR SAVED / LIKED BRANDS (Favorites & Liked queue)
-- =========================================================

create table public.creator_brand_actions (
    id bigserial primary key,
    creator_org_user_id bigint not null references public.org_users(id) on delete cascade,
    organization_id bigint not null references public.organizations(id) on delete cascade,
    starred boolean default false,
    liked boolean default false,
    created_at timestamptz default now(),
    constraint creator_brand_actions_unique unique (creator_org_user_id, organization_id)
);

-- =========================================================
-- SUPPORT TICKETS & ALERTS
-- Reuse existing public.support_tickets / public.ticket_messages.
-- When creating a CreatorHub ticket, set:
--   support_tickets.module_id  = (select id from modules where slug = 'creator-marketing')
--   support_tickets.organization_id = the brand organization (if applicable)
--   support_tickets.raised_by  = the creator's org_users.id
-- No new tables required.
-- =========================================================

-- =========================================================
-- INDEXES
-- =========================================================

create index idx_creator_social_links_user on public.creator_social_links (org_user_id);
create index idx_creator_gallery_images_user on public.creator_gallery_images (org_user_id);
create index idx_brand_marketing_ext_status on public.brand_marketing_ext (status);
create index idx_brand_marketing_ext_pipeline on public.brand_marketing_ext (pipeline_stage);
create index idx_chat_threads_creator on public.chat_threads (creator_org_user_id);
create index idx_creator_activity_user on public.creator_activity_events (org_user_id, occurred_at desc);
create index idx_creator_brand_actions_creator on public.creator_brand_actions (creator_org_user_id);
