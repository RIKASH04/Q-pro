-- ============================================================
-- Q-Pro: Complete Supabase SQL Schema (FIXED - No Infinite Recursion)
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. OFFICES TABLE
-- ============================================================
create table if not exists offices (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  type         text not null check (type in ('hospital','government','post_office','ration_shop','aadhaar_center','other')),
  description  text,
  address      text,
  phone        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 2. DEPARTMENTS TABLE
-- ============================================================
create table if not exists departments (
  id                    uuid primary key default uuid_generate_v4(),
  office_id             uuid not null references offices(id) on delete cascade,
  name                  text not null,
  avg_service_time_mins int  not null default 5,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- 3. USER ROLES TABLE
-- ============================================================
create table if not exists user_roles (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('super_admin', 'office_admin', 'public')),
  office_id  uuid references offices(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- ============================================================
-- 4. QUEUE TOKENS TABLE
-- ============================================================
create table if not exists queue_tokens (
  id                  uuid primary key default uuid_generate_v4(),
  office_id           uuid not null references offices(id) on delete cascade,
  department_id       uuid references departments(id) on delete set null,
  token_number        int not null,
  user_name           text not null,
  user_phone          text,
  user_id             uuid references auth.users(id) on delete set null,
  status              text not null default 'waiting' check (status in ('waiting','serving','served','skipped')),
  joined_at           timestamptz not null default now(),
  served_at           timestamptz,
  estimated_wait_mins int not null default 0
);

create index if not exists idx_queue_tokens_office_date
  on queue_tokens(office_id, joined_at);

create index if not exists idx_queue_tokens_status
  on queue_tokens(office_id, status);

create index if not exists idx_queue_tokens_user_id
  on queue_tokens(user_id);

-- Enforce only one active token per user per office
create unique index if not exists idx_queue_tokens_user_active_per_office 
  on queue_tokens(user_id, office_id) 
  where status in ('waiting', 'serving');

-- ============================================================
-- 5. OFFICE QUEUE STATE TABLE
-- ============================================================
create table if not exists office_queue_state (
  id            uuid primary key default uuid_generate_v4(),
  office_id     uuid not null references offices(id) on delete cascade unique,
  current_token int not null default 0,
  is_paused     boolean not null default false,
  is_closed     boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS
-- These are evaluated OUTSIDE the RLS context, preventing
-- infinite recursion when policies reference user_roles.
-- ============================================================

-- Returns the role of the currently logged-in user
create or replace function get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid() limit 1;
$$;

-- Returns the office_id assigned to the current user
create or replace function get_my_office_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select office_id from public.user_roles where user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- 7. ROW LEVEL SECURITY POLICIES (Recursion-free)
-- ============================================================

-- Enable RLS on all tables
alter table offices             enable row level security;
alter table departments         enable row level security;
alter table user_roles          enable row level security;
alter table queue_tokens        enable row level security;
alter table office_queue_state  enable row level security;

-- -------------------------------------------------------
-- Drop any existing policies to start clean
-- -------------------------------------------------------
drop policy if exists "offices_public_read"         on offices;
drop policy if exists "offices_super_admin_all"     on offices;
drop policy if exists "offices_admin_read_own"      on offices;

drop policy if exists "departments_public_read"     on departments;
drop policy if exists "departments_super_admin_all" on departments;
drop policy if exists "departments_admin_all_own"   on departments;

drop policy if exists "user_roles_self_read"        on user_roles;
drop policy if exists "user_roles_self_insert"      on user_roles;
drop policy if exists "user_roles_super_admin_all"  on user_roles;

drop policy if exists "queue_tokens_public_insert"  on queue_tokens;
drop policy if exists "queue_tokens_public_read"    on queue_tokens;
drop policy if exists "queue_tokens_admin_update"   on queue_tokens;

drop policy if exists "queue_state_public_read"     on office_queue_state;
drop policy if exists "queue_state_admin_all"       on office_queue_state;

-- -------------------------------------------------------
-- OFFICES policies
-- -------------------------------------------------------

-- Anyone can read active offices (public queue directory)
create policy "offices_public_read" on offices
  for select using (is_active = true);

-- Super admin: full control (uses security definer function — no recursion)
create policy "offices_super_admin_all" on offices
  for all using (get_my_role() = 'super_admin');

-- Office admin: read their own office
create policy "offices_admin_read_own" on offices
  for select using (
    get_my_role() = 'office_admin'
    and id = get_my_office_id()
  );

-- -------------------------------------------------------
-- DEPARTMENTS policies
-- -------------------------------------------------------

-- Anyone can read active departments
create policy "departments_public_read" on departments
  for select using (is_active = true);

-- Super admin: full control
create policy "departments_super_admin_all" on departments
  for all using (get_my_role() = 'super_admin');

-- Office admin: manage departments of their own office
create policy "departments_admin_all_own" on departments
  for all using (
    get_my_role() = 'office_admin'
    and office_id = get_my_office_id()
  );

-- -------------------------------------------------------
-- USER ROLES policies (the tricky table — must NOT self-reference)
-- Using auth.uid() direct comparison only — no sub-selects on user_roles
-- -------------------------------------------------------

-- Users can read their own role record
create policy "user_roles_self_read" on user_roles
  for select using (user_id = auth.uid());

-- Users can insert their own initial role (set by auth callback)
create policy "user_roles_self_insert" on user_roles
  for insert with check (user_id = auth.uid());

-- Super admin: full control
-- Uses JWT claim check instead of querying user_roles to avoid recursion
create policy "user_roles_super_admin_all" on user_roles
  for all using (get_my_role() = 'super_admin');

-- Office admins: read their own row only
create policy "user_roles_admin_read_own" on user_roles
  for select using (user_id = auth.uid());

-- -------------------------------------------------------
-- QUEUE TOKENS policies
-- -------------------------------------------------------

-- Anyone can insert a token (if logged in, user_id must match)
create policy "queue_tokens_insert" on queue_tokens
  for insert with check (
    (auth.uid() is null) or (auth.uid() = user_id)
  );

-- Anyone can read tokens (to see queue status)
create policy "queue_tokens_public_read" on queue_tokens
  for select using (true);

-- Logged-in users can read their own tokens
create policy "queue_tokens_user_read" on queue_tokens
  for select using (
    (auth.uid() = user_id) or (user_id is null)
  );

-- Admins can update tokens (serve/skip)
create policy "queue_tokens_admin_update" on queue_tokens
  for update using (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'office_admin' and office_id = get_my_office_id())
  );

-- -------------------------------------------------------
-- OFFICE QUEUE STATE policies
-- -------------------------------------------------------

-- Anyone can read queue state (pause/close status)
create policy "queue_state_public_read" on office_queue_state
  for select using (true);

-- Admins can insert/update queue state
create policy "queue_state_admin_upsert" on office_queue_state
  for all using (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'office_admin' and office_id = get_my_office_id())
  );

-- ============================================================
-- 8. ENABLE REALTIME (safe to re-run — checks before adding)
-- ============================================================
do $$
begin
  -- Add queue_tokens to realtime if not already added
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'queue_tokens'
  ) then
    alter publication supabase_realtime add table queue_tokens;
  end if;

  -- Add office_queue_state to realtime if not already added
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'office_queue_state'
  ) then
    alter publication supabase_realtime add table office_queue_state;
  end if;
end $$;

-- ============================================================
-- OPTIONAL: Seed test data
-- Uncomment to create sample offices
-- ============================================================
/*
insert into offices (name, slug, type, description, address, phone) values
  ('City General Hospital',     'city-general-hospital',     'hospital',     'Government general hospital',         '123 Main Road, City Center',  '+91 98765 43210'),
  ('District Collector Office', 'district-collector-office', 'government',   'District administration and services', '45 Civil Lines, District HQ', '+91 11234 56789'),
  ('Central Post Office',       'central-post-office',       'post_office',  'Main city post office',               '7 Post Road, Town Hall',      '+91 33456 78901');
*/
