-- =========================================================
-- ENUMS & TYPES
-- =========================================================

create type marketing_status as enum ('active', 'upcoming', 'paused', 'completed');
create type marketing_pipeline_stage as enum ('brief', 'shortlist', 'negotiation', 'live', 'wrap');
create type chat_stage as enum ('match', 'negotiating', 'booked', 'content', 'done');
create type chat_message_type as enum ('text', 'profile_card', 'offer', 'counter', 'calendar');
create type chat_actor as enum ('brand', 'creator');
create type activity_category as enum ('pitch', 'like', 'star', 'negotiation', 'profile', 'note', 'support');
create type support_ticket_status as enum ('open', 'in_progress', 'waiting', 'resolved');
create type support_ticket_channel as enum ('email', 'in_product', 'whatsapp');
create type support_ticket_type as enum ('dispute', 'payout', 'bug', 'feature', 'general');
create type support_ticket_priority as enum ('high', 'medium', 'low');
create type admin_alert_severity as enum ('info', 'warning', 'critical');
create type portfolio_item_type as enum ('case_study', 'video', 'press', 'post', 'link');

-- =========================================================
-- USERS & AUTH
-- =========================================================

create table public.app_users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    name text,
    avatar_url text,
    google_sub text unique,
    email_verified boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_login_at timestamptz
);

create table public.auth_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.app_users(id) on delete cascade,
    session_jti uuid unique not null,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    ip_address text,
    user_agent text,
    created_at timestamptz default now(),
    last_seen_at timestamptz
);

-- =========================================================
-- ORGANIZATIONS
-- =========================================================

create table public.organizations (
    id bigserial primary key,
    name text not null,
    slug text unique,
    logo_url text,
    organization_type text,
    created_at timestamptz default now()
);

create table public.organization_users (
    id bigserial primary key,
    organization_id bigint references public.organizations(id) on delete cascade,
    user_id uuid references public.app_users(id) on delete cascade,
    role text not null,
    joined_at timestamptz default now()
);

-- =========================================================
-- CREATORS (GLOBAL)
-- =========================================================

create table public.creators (
    id bigserial primary key,
    auth_user_id uuid references public.app_users(id) on delete cascade,
    username text unique,
    display_name text not null,
    tagline text,
    bio text,
    primary_niche text,
    niche_tags text[],
    base_city text,
    avatar_url text,
    cover_url text,
    follower_count integer default 0,
    following_count integer default 0,
    posts_count integer default 0,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.creator_social_links (
    id bigserial primary key,
    creator_id bigint references public.creators(id) on delete cascade,
    platform text not null,
    handle text,
    profile_url text,
    is_visible boolean default true,
    created_at timestamptz default now()
);

create table public.creator_gallery_images (
    id bigserial primary key,
    creator_id bigint references public.creators(id) on delete cascade,
    image_url text not null,
    caption text,
    sort_order integer default 0,
    is_public boolean default true,
    created_at timestamptz default now()
);

create table public.creator_dashboard_settings (
    id bigserial primary key,
    creator_id bigint references public.creators(id) on delete cascade,
    carousel_enabled boolean default false,
    spotify_enabled boolean default false,
    spotify_url text,
    reels_enabled boolean default false,
    collab_badges_enabled boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.creator_followers (
    id bigserial primary key,
    follower_id bigint references public.creators(id) on delete cascade,
    following_id bigint references public.creators(id) on delete cascade,
    created_at timestamptz default now()
);

create table public.creator_oauth_accounts (
    id bigserial primary key,
    creator_id bigint references public.creators(id) on delete cascade,
    platform text not null,
    access_token text,
    refresh_token text,
    platform_user_id text,
    expires_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =========================================================
-- CREATOR HUB PROFILE (UI-SPECIFIC)
-- =========================================================

create table public.creator_profiles (
    creator_id bigint primary key references public.creators(id) on delete cascade,
    about text,
    spotify_playlist_url text,
    spotify_playlist_title text,
    spotify_playlist_description text,
    spotify_playlist_followers integer,
    updated_at timestamptz default now()
);

create table public.creator_highlights (
    id bigserial primary key,
    creator_id bigint references public.creators(id) on delete cascade,
    label text not null,
    value text not null,
    sort_order smallint default 0
);

create table public.creator_portfolio_items (
    id uuid primary key default gen_random_uuid(),
    creator_id bigint references public.creators(id) on delete cascade,
    item_type portfolio_item_type not null,
    title text not null,
    url text not null,
    description text,
    created_at timestamptz default now()
);

create table public.creator_profile_gallery (
    id bigserial primary key,
    creator_id bigint references public.creators(id) on delete cascade,
    image_url text not null,
    sort_order smallint default 0
);

-- =========================================================
-- BRANDS & MARKETING DATA
-- =========================================================

create table public.brands (
    id bigserial primary key,
    organization_id bigint references public.organizations(id),
    name text not null,
    tagline text,
    category text,
    location_label text,
    latitude numeric(10,6),
    longitude numeric(10,6),
    average_ticket_amount integer,
    average_ticket_currency text default 'INR',
    audience text,
    voice_tone text,
    usp text,
    offers_events text,
    visual_identity text,
    status text default 'draft',
    rating numeric(2,1),
    offer_copy text,
    brief text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.brand_gallery_images (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    image_url text not null,
    sort_order smallint default 0
);

create table public.brand_deliverables (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    label text not null,
    sort_order smallint default 0
);

create table public.brand_marketing (
    brand_id bigint primary key references public.brands(id) on delete cascade,
    status marketing_status not null,
    pipeline_stage marketing_pipeline_stage not null,
    budget_amount integer,
    spend_to_date integer,
    target_launch date,
    campaign_objective text,
    owner_name text,
    owner_role text,
    owner_email text,
    owner_phone text,
    inbound_leads integer,
    notes text
);

create table public.brand_marketing_tags (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    tag text not null,
    constraint brand_marketing_tags_unique unique (brand_id, tag)
);

create table public.marketing_status_meta (
    status marketing_status primary key,
    label text not null,
    tone text not null
);

create table public.marketing_pipeline_meta (
    stage marketing_pipeline_stage primary key,
    label text not null,
    tone text not null
);

create table public.brand_assets (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    asset_type text,
    title text,
    asset_url text,
    thumbnail_url text,
    caption_excerpt text,
    mime_type text,
    file_size bigint,
    created_at timestamptz default now()
);

create table public.brand_sources (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    source_type text,
    source_label text,
    source_url text,
    handle text,
    sync_status text,
    created_at timestamptz default now()
);

create table public.brand_insights (
    id bigserial primary key,
    brand_id bigint unique references public.brands(id) on delete cascade,
    summary text,
    do_list jsonb,
    avoid_list jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =========================================================
-- CAMPAIGNS & CREATIVE
-- =========================================================

create table public.campaign_briefs (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    title text not null,
    objective text,
    goal text,
    theme text,
    content_type text,
    concept_description text,
    creative_direction text,
    marketing_objective text,
    tone_style text,
    status text default 'draft',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.campaign_comments (
    id bigserial primary key,
    campaign_id bigint references public.campaign_briefs(id) on delete cascade,
    author_id uuid references public.app_users(id),
    comment text not null,
    visibility_scope text,
    resolution_status text,
    created_at timestamptz default now()
);

create table public.campaign_calendar_events (
    id bigserial primary key,
    campaign_id bigint references public.campaign_briefs(id) on delete cascade,
    title text not null,
    notes text,
    event_type text,
    status text,
    scheduled_at timestamptz,
    reminder text,
    label_color text,
    created_at timestamptz default now()
);

create table public.ai_generation_jobs (
    id bigserial primary key,
    campaign_id bigint references public.campaign_briefs(id) on delete cascade,
    website_url text,
    extracted_dna jsonb,
    generated_prompt text,
    reviewed_prompt text,
    status text default 'queued',
    current_step integer default 0,
    total_steps integer default 7,
    error_message text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.creative_variant_sets (
    id bigserial primary key,
    campaign_id bigint references public.campaign_briefs(id) on delete cascade,
    status text default 'draft',
    selected_variant_id bigint,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.creative_variants (
    id bigserial primary key,
    variant_set_id bigint references public.creative_variant_sets(id) on delete cascade,
    variant_name text,
    hook text,
    cta text,
    hashtags text,
    visual_prompt text,
    storyboard text,
    display_order integer default 0,
    created_at timestamptz default now()
);

create table public.creative_review_notes (
    id bigserial primary key,
    variant_id bigint references public.creative_variants(id) on delete cascade,
    author_id uuid references public.app_users(id),
    note text not null,
    visibility_scope text,
    created_at timestamptz default now()
);

create table public.editor_tasks (
    id bigserial primary key,
    campaign_id bigint references public.campaign_briefs(id) on delete cascade,
    assigned_editor_name text,
    title text,
    status text default 'queued',
    due_at timestamptz,
    notes text,
    created_at timestamptz default now()
);

create table public.editor_revisions (
    id bigserial primary key,
    editor_task_id bigint references public.editor_tasks(id) on delete cascade,
    note text not null,
    created_at timestamptz default now()
);

-- =========================================================
-- CREATOR DEALS & COLLABORATIONS
-- =========================================================

create table public.creator_deals (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    title text,
    category text,
    location text,
    niche_tags text[],
    requirement text,
    deliverables text,
    platform text,
    payout_min integer default 0,
    payout_max integer default 0,
    status text default 'open',
    created_at timestamptz default now()
);

create table public.creator_deal_acceptances (
    id bigserial primary key,
    deal_id bigint references public.creator_deals(id) on delete cascade,
    creator_id bigint references public.creators(id) on delete cascade,
    status text default 'pending',
    created_at timestamptz default now()
);

-- =========================================================
-- CHAT / INBOX (UI-SPECIFIC)
-- =========================================================

create table public.chat_threads (
    id bigserial primary key,
    brand_id bigint references public.brands(id) on delete cascade,
    creator_id bigint references public.creators(id) on delete cascade,
    stage chat_stage not null,
    unread_count smallint default 0,
    last_message_preview text,
    last_message_at timestamptz,
    matched_at timestamptz,
    created_at timestamptz default now()
);

create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    thread_id bigint references public.chat_threads(id) on delete cascade,
    sender chat_actor not null,
    message_type chat_message_type not null,
    body text,
    monetary_amount integer,
    monetary_currency text default 'INR',
    deliverables text[],
    label text,
    extra jsonb,
    created_at timestamptz default now()
);

-- =========================================================
-- CREATOR HUB ACTIVITY & SUPPORT
-- =========================================================

create table public.campaign_activity_events (
    id uuid primary key default gen_random_uuid(),
    creator_id bigint references public.creators(id) on delete set null,
    brand_id bigint references public.brands(id) on delete set null,
    category activity_category not null,
    title text not null,
    description text,
    amount integer,
    occurred_at timestamptz not null,
    created_at timestamptz default now()
);

create table public.support_tickets (
    id text primary key,
    brand_id bigint references public.brands(id) on delete set null,
    title text not null,
    summary text,
    status support_ticket_status not null,
    submitted_at timestamptz not null,
    owner_name text,
    owner_role text,
    channel support_ticket_channel,
    ticket_type support_ticket_type,
    priority support_ticket_priority,
    created_at timestamptz default now()
);

create table public.admin_alerts (
    id text primary key,
    label text not null,
    detail text,
    severity admin_alert_severity not null,
    created_at timestamptz default now()
);

-- =========================================================
-- NOTIFICATIONS & AUDIT
-- =========================================================

create table public.notifications (
    id bigserial primary key,
    organization_id bigint references public.organizations(id) on delete cascade,
    type text,
    title text not null,
    body text,
    is_read boolean default false,
    created_at timestamptz default now()
);

create table public.audit_logs (
    id bigserial primary key,
    organization_id bigint references public.organizations(id) on delete cascade,
    user_id uuid references public.app_users(id),
    action text,
    entity_type text,
    entity_id bigint,
    old_value jsonb,
    new_value jsonb,
    created_at timestamptz default now()
);
