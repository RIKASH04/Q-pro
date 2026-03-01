-- ============================================================
-- Q-Pro: Feature Expansion Migration
-- Adds user authentication support and improved queue tracking
-- ============================================================

-- Add user_id to queue_tokens
alter table queue_tokens add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Add index for performance when users check their active tokens
create index if not exists idx_queue_tokens_user_id on queue_tokens(user_id);

-- Enforce only one active token per user per office
create unique index if not exists idx_queue_tokens_user_active_per_office 
  on queue_tokens(user_id, office_id) 
  where status in ('waiting', 'serving');

-- 2. Update policies for queue_tokens to support logged-in users
drop policy if exists "queue_tokens_public_insert" on queue_tokens;
create policy "queue_tokens_insert_all" on queue_tokens
  for insert with check (
    (auth.uid() is null) or (auth.uid() = user_id)
  );

create policy "queue_tokens_user_read" on queue_tokens
  for select using (
    (auth.uid() = user_id) or (user_id is null)
  );

-- 3. Ensure realtime is enabled for needed tables
-- (Already enabled in original schema, but re-confirming here for completeness)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'queue_tokens'
  ) then
    alter publication supabase_realtime add table queue_tokens;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'office_queue_state'
  ) then
    alter publication supabase_realtime add table office_queue_state;
  end if;
end $$;
