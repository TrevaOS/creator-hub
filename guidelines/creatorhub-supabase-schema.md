# CreatorHub Supabase Integration Schema

> This document maps the current in-memory Creator Hub data (TypeScript constants under `src/app/data/creatorHubData.ts`) to a relational schema you can apply to a Supabase Postgres instance. It captures every entity used in Creator Home, Inbox, Profile, and Admin views so you can replace mock data with SQL-backed tables.

---

## 1. Entity-to-table overview

| TypeScript source | Purpose in UI | Supabase tables |
| --- | --- | --- |
| `BRAND_CAMPAIGNS` | Creator Home cards, Map view, Inbox pipeline | `brands`, `brand_marketing`, `brand_deliverables`, `brand_gallery_images`, `brand_marketing_tags` |
| `MARKETING_STATUS_META` | Status label & tone badges | `marketing_status_meta` |
| `MARKETING_PIPELINE_META` | Pipeline label & tone badges | `marketing_pipeline_meta` |
| `CREATOR_ACTIVITY_EVENTS` | Creator Home activity feed | `campaign_activity_events` |
| `SUPPORT_TICKETS` | Admin dashboard support desk | `support_tickets` |
| `ADMIN_ALERTS` | Admin dashboard alerts | `admin_alerts` |
| `CREATOR` (and profile UI) | Creator profile header | `creators`, `creator_profiles`, `creator_niches`, `creator_highlights`, `creator_portfolio_items`, `creator_gallery_images` |
| Inbox chat mocks | Messages drawer & chat threads | `chat_threads`, `chat_messages` |

---

## 2. Enumerations

To keep the schema expressive while staying friendly for Supabase RLS policies, define enums first. The enum values are lower snake case versions of the strings currently rendered in the UI.

```sql
-- Marketing lifecycle
create type marketing_status as enum ('active', 'upcoming', 'paused', 'completed');
create type marketing_pipeline_stage as enum ('brief', 'shortlist', 'negotiation', 'live', 'wrap');

-- Inbox / chat
create type chat_stage as enum ('match', 'negotiating', 'booked', 'content', 'done');
create type chat_message_type as enum ('text', 'profile_card', 'offer', 'counter', 'calendar');
create type chat_actor as enum ('brand', 'creator');

-- Activity + support desk
create type activity_category as enum ('pitch', 'like', 'star', 'negotiation', 'profile', 'note', 'support');
create type support_ticket_status as enum ('open', 'in_progress', 'waiting', 'resolved');
create type support_ticket_channel as enum ('email', 'in_product', 'whatsapp');
create type support_ticket_type as enum ('dispute', 'payout', 'bug', 'feature', 'general');
create type support_ticket_priority as enum ('high', 'medium', 'low');
create type admin_alert_severity as enum ('info', 'warning', 'critical');

-- Creator profile
create type portfolio_item_type as enum ('case_study', 'video', 'press', 'post', 'link');
```

> **Frontend note:** the UI can continue to display Title Case by joining against the `*_meta` tables or by mapping enum values in TypeScript.

---

## 3. Core tables

Below is the recommended DDL (trim or extend as needed). All timestamp columns default to `now()` so you can audit later ingestion.

```sql
-- Creators
create table public.creators (
  id uuid primary key default uuid_generate_v4(),
  handle text unique not null,
  display_name text not null,
  avatar_url text,
  location_label text,
  reach_count integer,
  engagement_rate numeric(5,2),
  created_at timestamptz not null default now()
);

create table public.creator_profiles (
  creator_id uuid primary key references public.creators(id) on delete cascade,
  tagline text,
  bio text,
  about text,
  spotify_playlist_url text,
  spotify_playlist_title text,
  spotify_playlist_description text,
  spotify_playlist_followers integer,
  updated_at timestamptz not null default now()
);

create table public.creator_niches (
  id bigserial primary key,
  creator_id uuid references public.creators(id) on delete cascade,
  niche text not null,
  constraint creator_niches_unique unique (creator_id, niche)
);

create table public.creator_highlights (
  id bigserial primary key,
  creator_id uuid references public.creators(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order smallint default 0
);

create table public.creator_portfolio_items (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade,
  item_type portfolio_item_type not null,
  title text not null,
  url text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.creator_gallery_images (
  id bigserial primary key,
  creator_id uuid references public.creators(id) on delete cascade,
  image_url text not null,
  sort_order smallint default 0
);

-- Brands & campaigns
create table public.brands (
  id bigserial primary key,
  name text not null,
  tagline text,
  category text,
  location_label text,
  latitude numeric(10,6) not null,
  longitude numeric(10,6) not null,
  average_ticket_amount integer,
  average_ticket_currency text default 'INR',
  rating numeric(2,1),
  offer_copy text,
  audience_fit integer,
  fit_grade text,
  brief text,
  created_at timestamptz not null default now()
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

-- Inbox & chat
create table public.chat_threads (
  id bigserial primary key,
  brand_id bigint references public.brands(id) on delete cascade,
  creator_id uuid references public.creators(id) on delete cascade,
  stage chat_stage not null,
  unread_count smallint not null default 0,
  last_message_preview text,
  last_message_at timestamptz,
  matched_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id bigint references public.chat_threads(id) on delete cascade,
  sender chat_actor not null,
  message_type chat_message_type not null,
  body text,
  monetary_amount integer,
  monetary_currency text default 'INR',
  deliverables text[],
  label text,
  extra jsonb,
  created_at timestamptz not null default now()
);

-- Creator activity & admin data
create table public.campaign_activity_events (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete set null,
  brand_id bigint references public.brands(id) on delete set null,
  category activity_category not null,
  title text not null,
  description text,
  amount integer,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

create table public.admin_alerts (
  id text primary key,
  label text not null,
  detail text,
  severity admin_alert_severity not null,
  created_at timestamptz not null default now()
);
```

---

## 4. Seed data blueprint

Supabase allows SQL seed scripts via `supabase db seed`. Below is a pattern you can use to migrate the existing mock data (repeat for the remaining 20 brands and supporting lists).

```sql
-- 1. Creator
insert into public.creators (handle, display_name, avatar_url, location_label, reach_count, engagement_rate)
values ('foodie_blr', 'Maya Rao', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80&crop=faces', 'Bangalore, India', 142000, 7.2)
returning id into creator_id;

insert into public.creator_profiles (creator_id, tagline, bio)
values (creator_id, 'Food & lifestyle storyteller', 'Bangalore-based food & lifestyle creator telling flavorful stories.');

insert into public.creator_niches (creator_id, niche) values (creator_id, 'Food'), (creator_id, 'Lifestyle');

-- 2. Brand (Smokehouse Bar example)
insert into public.brands (
  name, tagline, category, location_label, latitude, longitude, average_ticket_amount,
  rating, offer_copy, audience_fit, fit_grade, brief
) values (
  'The Smokehouse Bar',
  'Weekend smokehouse brunch & craft cocktails',
  'Smokehouse',
  'Indiranagar · 2.5 km',
  12.9716, 77.6412,
  1800,
  4.6,
  'Free Meal + ₹5,000 stipend',
  92,
  'A+',
  'Capture our new smoked brisket board and bourbon cocktails with warm, editorial vibes.'
) returning id into brand_id;

insert into public.brand_gallery_images (brand_id, image_url, sort_order) values
  (brand_id, 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?auto=format&fit=crop&w=900&q=80', 1),
  (brand_id, 'https://images.unsplash.com/photo-1555992336-cbf8e70f7317?auto=format&fit=crop&w=900&q=80', 2),
  (brand_id, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80', 3);

insert into public.brand_deliverables (brand_id, label, sort_order) values
  (brand_id, '1 Reel', 1),
  (brand_id, '2 Stories', 2),
  (brand_id, '15 Photos', 3);

insert into public.brand_marketing (
  brand_id, status, pipeline_stage, budget_amount, spend_to_date, target_launch,
  campaign_objective, owner_name, owner_role, owner_email, owner_phone, inbound_leads, notes
) values (
  brand_id,
  'active',
  'live',
  85000,
  42000,
  '2026-05-20',
  'Drive brunch reservations & cocktail bookings',
  'Rhea Mathews',
  'Brand Manager',
  'rhea@smokehouse.in',
  '+91 99802 33441',
  18,
  'High intent audience from Koramangala and Indiranagar.'
);

insert into public.brand_marketing_tags (brand_id, tag) values (brand_id, 'Brunch'), (brand_id, 'Cocktails'), (brand_id, 'Premium');

-- 3. Activity feed
insert into public.campaign_activity_events (id, brand_id, category, title, description, occurred_at)
values ('act-1001', brand_id, 'pitch', 'Pitch sent to Bayleaf Thali House', 'Shared profile preview and quoted ₹38,000 package.', '2026-05-12T14:32:00+05:30');
```

Repeat the pattern for the remaining brands, support tickets, alerts, and any chat transcripts you want in production.

> **Tip:** for larger imports, transform the TypeScript arrays to JSON and pipe them through `COPY ... FROM STDIN` using Supabase CLI, or build a lightweight Node script that uses the Supabase Admin API.

---

## 5. Connecting the frontend

1. **Install and configure Supabase client** if you have not already:
   ```bash
   npm install @supabase/supabase-js
   ```
   Create a single Supabase client (e.g. `src/lib/supabaseClient.ts`) using your project URL and anon key.

2. **Replace the mock arrays** in React components with hooks that read from the database. For example:
   - `CreatorHome` → fetch from `brands` joined with `brand_marketing`, `brand_deliverables`, and `brand_gallery_images`.
   - `CreatorInbox` → fetch `chat_threads` filtered by `creator_id`, join `brands`, and lazy-load `chat_messages` when opening a thread.
   - `CreatorProfile` → fetch `creators` + `creator_profiles` + `creator_portfolio_items` for the signed-in creator.

3. **Create lightweight metadata loaders** that hydrate `MARKETING_STATUS_META` and `MARKETING_PIPELINE_META` from the respective meta tables at app boot, caching the tone colors client side.

4. **Enable RLS in Supabase** and add policies so that creators only see their own threads, activity, and profile rows. Admin dashboards can either use a service role key server-side or a dedicated role with broader access.

5. **Backfill images**: since the mock data references Unsplash, you can keep the URLs as-is during migration. Longer term, consider uploading to Supabase Storage and storing the signed URLs in `brand_gallery_images`.

---

## 6. Next steps & optional enhancements

- **Migrations**: Add future columns (e.g., `campaign_metrics`, `budget_currency`) via standard SQL migrations so Supabase can version-control them.
- **Derived views**: Build SQL views for quick reads, e.g. `brands_with_meta` that pre-joins marketing rows for Creator Home.
- **Search indexes**: Add `gin_trgm_ops` index on `brands(name)` and `brands(tagline)` to power fuzzy search in Inbox/Discover.
- **Automation**: Use Supabase Functions or Edge Functions to update `chat_threads.last_message_preview` whenever new messages are inserted.

With this schema in place you can safely migrate all mock data to Supabase, wire the React app to live queries, and keep the same UI flows with real persistence.
