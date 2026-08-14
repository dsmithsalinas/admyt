-- Canonical Admyt schema baseline.
--
-- This migration intentionally uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so
-- it can repair the historical repository (whose original dashboard-created
-- tables were never captured) without replacing data in an existing project.
-- A fresh `supabase db reset` and an existing linked project therefore converge
-- on the same table, grant, index, and RLS-policy shape.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.colleges (
  id text primary key,
  name text not null,
  location text,
  city text,
  state text,
  zip text,
  url text,
  locale text,
  type text,
  degrees_predominant integer,
  religious_affiliation integer,
  setting integer,
  size text,
  enrollment numeric,
  acceptance_rate numeric,
  avg_gpa numeric,
  avg_sat numeric,
  avg_act numeric,
  tuition_in_state numeric,
  tuition_out_state numeric,
  graduation_rate numeric,
  description text,
  majors jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);

alter table public.colleges add column if not exists name text;
alter table public.colleges add column if not exists location text default '';
alter table public.colleges add column if not exists city text;
alter table public.colleges add column if not exists state text default '';
alter table public.colleges add column if not exists zip text;
alter table public.colleges add column if not exists url text;
alter table public.colleges add column if not exists locale text;
alter table public.colleges add column if not exists type text default 'private';
alter table public.colleges add column if not exists degrees_predominant integer;
alter table public.colleges add column if not exists religious_affiliation integer;
alter table public.colleges add column if not exists setting integer;
alter table public.colleges add column if not exists size text default 'medium';
alter table public.colleges add column if not exists enrollment integer;
alter table public.colleges add column if not exists acceptance_rate numeric;
alter table public.colleges add column if not exists avg_gpa numeric;
alter table public.colleges add column if not exists avg_sat integer;
alter table public.colleges add column if not exists avg_act numeric;
alter table public.colleges add column if not exists tuition_in_state integer;
alter table public.colleges add column if not exists tuition_out_state integer;
alter table public.colleges add column if not exists graduation_rate numeric;
alter table public.colleges add column if not exists description text;
alter table public.colleges add column if not exists majors jsonb default '[]'::jsonb;
alter table public.colleges add column if not exists created_at timestamptz default now();
alter table public.colleges add column if not exists updated_at timestamptz default now();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hearted_schools (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  college_id text not null,
  college_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, college_id)
);

create table if not exists public.saved_vibes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  college_id text not null,
  college_name text not null,
  fit_score integer not null check (fit_score between 1 and 100),
  dimensions jsonb not null default '[]'::jsonb,
  overall_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, college_id)
);

alter table public.saved_vibes add column if not exists updated_at timestamptz default now();

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  preferred_states text[] default '{}',
  max_tuition numeric,
  preferred_majors text[] default '{}',
  heart_action_count integer not null default 0,
  sage_profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences add column if not exists preferred_states text[] default '{}';
alter table public.user_preferences add column if not exists max_tuition integer;
alter table public.user_preferences add column if not exists preferred_majors text[] default '{}';
alter table public.user_preferences add column if not exists heart_action_count integer default 0;
alter table public.user_preferences add column if not exists sage_profile jsonb;
alter table public.user_preferences add column if not exists created_at timestamptz default now();
alter table public.user_preferences add column if not exists updated_at timestamptz default now();

create table if not exists public.college_deadlines (
  college_id text primary key,
  deadlines jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at);
create unique index if not exists hearted_schools_user_college_idx
  on public.hearted_schools (user_id, college_id);
create index if not exists hearted_schools_user_created_idx
  on public.hearted_schools (user_id, created_at desc);
create unique index if not exists saved_vibes_user_college_idx
  on public.saved_vibes (user_id, college_id);
create index if not exists saved_vibes_user_created_idx
  on public.saved_vibes (user_id, created_at desc);
create unique index if not exists user_preferences_user_idx
  on public.user_preferences (user_id);

alter table public.colleges enable row level security;
alter table public.chat_messages enable row level security;
alter table public.hearted_schools enable row level security;
alter table public.saved_vibes enable row level security;
alter table public.user_preferences enable row level security;
alter table public.college_deadlines enable row level security;
alter table public.rate_limits enable row level security;

-- Remove dashboard-era policies so no permissive policy can survive this repair.
DO $$
DECLARE
  target_table text;
  target_policy text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'colleges', 'chat_messages', 'hearted_schools', 'saved_vibes',
    'user_preferences', 'college_deadlines', 'rate_limits'
  ]
  LOOP
    FOR target_policy IN
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = target_table
    LOOP
      execute format('drop policy %I on public.%I', target_policy, target_table);
    END LOOP;
  END LOOP;
END
$$;

create policy "colleges are publicly readable"
  on public.colleges for select to anon, authenticated using (true);
create policy "deadlines are publicly readable"
  on public.college_deadlines for select to anon, authenticated using (true);

create policy "users can read their chat messages"
  on public.chat_messages for select to authenticated
  using ((select auth.uid())::text = user_id);
create policy "users can insert their chat messages"
  on public.chat_messages for insert to authenticated
  with check ((select auth.uid())::text = user_id);
create policy "users can update their chat messages"
  on public.chat_messages for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);
create policy "users can delete their chat messages"
  on public.chat_messages for delete to authenticated
  using ((select auth.uid())::text = user_id);

create policy "users can read their hearted schools"
  on public.hearted_schools for select to authenticated
  using ((select auth.uid())::text = user_id);
create policy "users can insert their hearted schools"
  on public.hearted_schools for insert to authenticated
  with check ((select auth.uid())::text = user_id);
create policy "users can update their hearted schools"
  on public.hearted_schools for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);
create policy "users can delete their hearted schools"
  on public.hearted_schools for delete to authenticated
  using ((select auth.uid())::text = user_id);

create policy "users can read their saved vibes"
  on public.saved_vibes for select to authenticated
  using ((select auth.uid())::text = user_id);
create policy "users can insert their saved vibes"
  on public.saved_vibes for insert to authenticated
  with check ((select auth.uid())::text = user_id);
create policy "users can update their saved vibes"
  on public.saved_vibes for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);
create policy "users can delete their saved vibes"
  on public.saved_vibes for delete to authenticated
  using ((select auth.uid())::text = user_id);

create policy "users can read their preferences"
  on public.user_preferences for select to authenticated
  using ((select auth.uid())::text = user_id);
create policy "users can insert their preferences"
  on public.user_preferences for insert to authenticated
  with check ((select auth.uid())::text = user_id);
create policy "users can update their preferences"
  on public.user_preferences for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);
create policy "users can delete their preferences"
  on public.user_preferences for delete to authenticated
  using ((select auth.uid())::text = user_id);

-- Explicit grants are required for new Supabase projects that no longer expose
-- public-schema tables automatically. RLS remains the row-level authorization.
revoke all on public.colleges, public.chat_messages, public.hearted_schools,
  public.saved_vibes, public.user_preferences, public.college_deadlines,
  public.rate_limits from anon, authenticated;

grant select on public.colleges, public.college_deadlines to anon, authenticated;
grant select, insert, update, delete on public.chat_messages, public.hearted_schools,
  public.saved_vibes, public.user_preferences to authenticated;
grant select, insert, update, delete on public.colleges, public.chat_messages,
  public.hearted_schools, public.saved_vibes, public.user_preferences,
  public.college_deadlines, public.rate_limits to service_role;
