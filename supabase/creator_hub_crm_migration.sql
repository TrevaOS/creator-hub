-- Creator Hub CRM: core schema upgrade (idempotent)
-- Run this in Supabase SQL editor.

begin;

-- ------------------------------------------------------------
-- 1) Extend org role model for Creator Hub (admin / creator / brand)
-- ------------------------------------------------------------
alter table public.org_users
  drop constraint if exists org_users_role_type_check;

alter table public.org_users
  add constraint org_users_role_type_check
  check (
    role_type = any (
      array[
        'org_admin'::text,
        'outlet_staff'::text,
        'crm_staff'::text,
        'superadmin'::text,
        'creator'::text,
        'brand'::text
      ]
    )
  );

-- ------------------------------------------------------------
-- 2) Brand profiles (1:1 to auth user)
-- ------------------------------------------------------------
create table if not exists public.brand_profiles (
  id bigserial primary key,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id bigint references public.organizations(id) on delete set null,
  brand_name text not null,
  industry text,
  website text,
  logo_url text,
  about text,
  city text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brand_profiles_auth_user_id on public.brand_profiles(auth_user_id);

-- ------------------------------------------------------------
-- 3) Deals: brand ownership + assignment lifecycle
-- ------------------------------------------------------------
alter table public.creator_hub_deals
  add column if not exists brand_user_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_creator_user_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists updated_at timestamptz default now();

alter table public.creator_hub_deals
  drop constraint if exists creator_hub_deals_status_check;

alter table public.creator_hub_deals
  add constraint creator_hub_deals_status_check
  check (status = any (array['open'::text, 'pending'::text, 'assigned'::text, 'closed'::text]));

create index if not exists idx_creator_hub_deals_brand_user_id on public.creator_hub_deals(brand_user_id);
create index if not exists idx_creator_hub_deals_assigned_creator on public.creator_hub_deals(assigned_creator_user_id);
create index if not exists idx_creator_hub_deals_status on public.creator_hub_deals(status);

-- ------------------------------------------------------------
-- 4) Applications: one creator can apply once per deal
-- ------------------------------------------------------------
alter table public.creator_hub_accepted_deals
  add column if not exists pitch text,
  add column if not exists updated_at timestamptz default now();

alter table public.creator_hub_accepted_deals
  drop constraint if exists creator_hub_accepted_deals_status_check;

alter table public.creator_hub_accepted_deals
  add constraint creator_hub_accepted_deals_status_check
  check (status = any (array['pending'::text, 'active'::text, 'completed'::text, 'rejected'::text]));

create unique index if not exists idx_creator_hub_accepted_unique
  on public.creator_hub_accepted_deals(deal_id, user_id);

create index if not exists idx_creator_hub_accepted_user_id
  on public.creator_hub_accepted_deals(user_id);

-- ------------------------------------------------------------
-- 5) Unified conversations + messages (global inbox + deal chat)
-- ------------------------------------------------------------
create table if not exists public.creator_hub_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id bigint references public.organizations(id) on delete set null,
  deal_id uuid references public.creator_hub_deals(id) on delete set null,
  conversation_type text not null default 'deal'
    check (conversation_type = any (array['deal'::text, 'direct'::text, 'support'::text])),
  creator_user_id uuid references auth.users(id) on delete set null,
  brand_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ch_conversations_deal_id on public.creator_hub_conversations(deal_id);
create index if not exists idx_ch_conversations_creator on public.creator_hub_conversations(creator_user_id);
create index if not exists idx_ch_conversations_brand on public.creator_hub_conversations(brand_user_id);

create table if not exists public.creator_hub_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.creator_hub_conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ch_conv_messages_conversation
  on public.creator_hub_conversation_messages(conversation_id, created_at);

-- ------------------------------------------------------------
-- 6) Backfill conversations from legacy deal messages
-- ------------------------------------------------------------
insert into public.creator_hub_conversations (deal_id, conversation_type, creator_user_id, brand_user_id, created_by)
select distinct
  m.deal_id,
  'deal'::text,
  null,
  d.brand_user_id,
  d.brand_user_id
from public.creator_hub_messages m
join public.creator_hub_deals d on d.id = m.deal_id
where not exists (
  select 1 from public.creator_hub_conversations c where c.deal_id = m.deal_id
);

insert into public.creator_hub_conversation_messages (conversation_id, sender_user_id, body, attachment_url, created_at)
select
  c.id,
  m.sender_id,
  m.content,
  m.attachment_url,
  m.created_at
from public.creator_hub_messages m
join public.creator_hub_conversations c on c.deal_id = m.deal_id
where not exists (
  select 1
  from public.creator_hub_conversation_messages cm
  where cm.conversation_id = c.id
    and cm.sender_user_id = m.sender_id
    and cm.created_at = m.created_at
    and cm.body = m.content
);

-- ------------------------------------------------------------
-- 7) Trigger helpers
-- ------------------------------------------------------------
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_creator_hub_deals_updated_at on public.creator_hub_deals;
create trigger trg_creator_hub_deals_updated_at
before update on public.creator_hub_deals
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_creator_hub_conversations_updated_at on public.creator_hub_conversations;
create trigger trg_creator_hub_conversations_updated_at
before update on public.creator_hub_conversations
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_brand_profiles_updated_at on public.brand_profiles;
create trigger trg_brand_profiles_updated_at
before update on public.brand_profiles
for each row execute function public.set_updated_at_timestamp();

-- ------------------------------------------------------------
-- 8) RLS baseline
-- ------------------------------------------------------------
alter table public.brand_profiles enable row level security;
alter table public.creator_hub_conversations enable row level security;
alter table public.creator_hub_conversation_messages enable row level security;

drop policy if exists "brand_profiles_select_own_or_admin" on public.brand_profiles;
create policy "brand_profiles_select_own_or_admin"
on public.brand_profiles
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.org_users ou
    where ou.user_id = auth.uid()
      and ou.role_type in ('superadmin', 'org_admin')
  )
);

drop policy if exists "brand_profiles_upsert_own_or_admin" on public.brand_profiles;
create policy "brand_profiles_upsert_own_or_admin"
on public.brand_profiles
for all
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.org_users ou
    where ou.user_id = auth.uid()
      and ou.role_type in ('superadmin', 'org_admin')
  )
)
with check (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.org_users ou
    where ou.user_id = auth.uid()
      and ou.role_type in ('superadmin', 'org_admin')
  )
);

drop policy if exists "conversations_participant_or_admin" on public.creator_hub_conversations;
create policy "conversations_participant_or_admin"
on public.creator_hub_conversations
for select
to authenticated
using (
  auth.uid() = creator_user_id
  or auth.uid() = brand_user_id
  or exists (
    select 1 from public.org_users ou
    where ou.user_id = auth.uid()
      and ou.role_type in ('superadmin', 'org_admin')
  )
);

drop policy if exists "conversations_insert_participant_or_admin" on public.creator_hub_conversations;
create policy "conversations_insert_participant_or_admin"
on public.creator_hub_conversations
for insert
to authenticated
with check (
  auth.uid() = creator_user_id
  or auth.uid() = brand_user_id
  or exists (
    select 1 from public.org_users ou
    where ou.user_id = auth.uid()
      and ou.role_type in ('superadmin', 'org_admin')
  )
);

drop policy if exists "messages_select_participant_or_admin" on public.creator_hub_conversation_messages;
create policy "messages_select_participant_or_admin"
on public.creator_hub_conversation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.creator_hub_conversations c
    where c.id = creator_hub_conversation_messages.conversation_id
      and (
        c.creator_user_id = auth.uid()
        or c.brand_user_id = auth.uid()
        or exists (
          select 1 from public.org_users ou
          where ou.user_id = auth.uid()
            and ou.role_type in ('superadmin', 'org_admin')
        )
      )
  )
);

drop policy if exists "messages_insert_participant_or_admin" on public.creator_hub_conversation_messages;
create policy "messages_insert_participant_or_admin"
on public.creator_hub_conversation_messages
for insert
to authenticated
with check (
  auth.uid() = sender_user_id
  and exists (
    select 1
    from public.creator_hub_conversations c
    where c.id = creator_hub_conversation_messages.conversation_id
      and (
        c.creator_user_id = auth.uid()
        or c.brand_user_id = auth.uid()
        or exists (
          select 1 from public.org_users ou
          where ou.user_id = auth.uid()
            and ou.role_type in ('superadmin', 'org_admin')
        )
      )
  )
);

commit;
