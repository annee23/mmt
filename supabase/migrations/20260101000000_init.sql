-- JIN SARANG — Music Therapy & Didgeridoo
-- Schema, row level security and helper functions.
-- Applications, sensitive notes, subscribers and audit logs are NEVER readable by anon.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Private helpers (schema "private" is not exposed through the Data API)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'viewer' check (role in ('owner', 'manager', 'viewer')),
  can_view_sensitive boolean not null default false,
  created_at timestamptz not null default now()
);

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles where user_id = (select auth.uid()));
$$;

create function private.can_write() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles
                 where user_id = (select auth.uid()) and role in ('owner', 'manager'));
$$;

create function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles
                 where user_id = (select auth.uid()) and role = 'owner');
$$;

create function private.can_view_sensitive() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles
                 where user_id = (select auth.uid()) and can_view_sensitive);
$$;

grant execute on all functions in schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Programs & sessions
-- ---------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort_order int not null default 0,
  is_published boolean not null default true,
  recruit_status text not null default 'open' check (recruit_status in ('open', 'closed', 'upcoming')),
  apply_deadline timestamptz,
  cover_image text,
  default_capacity int check (default_capacity is null or default_capacity >= 0),
  fee_amount int check (fee_amount is null or fee_amount >= 0),
  name_ko text not null default '',
  name_en text not null default '',
  format_ko text not null default '',
  format_en text not null default '',
  summary_ko text not null default '',
  summary_en text not null default '',
  description_ko text not null default '',
  description_en text not null default '',
  composition_ko text not null default '',
  composition_en text not null default '',
  target_ko text not null default '',
  target_en text not null default '',
  duration_ko text not null default '',
  duration_en text not null default '',
  location_ko text not null default '',
  location_en text not null default '',
  fee_note_ko text not null default '',
  fee_note_en text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  title_ko text not null default '',
  title_en text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  time_note_ko text not null default '',
  time_note_en text not null default '',
  location_ko text not null default '',
  location_en text not null default '',
  fee_amount int check (fee_amount is null or fee_amount >= 0),
  fee_note_ko text not null default '',
  fee_note_en text not null default '',
  capacity int check (capacity is null or capacity >= 0),
  apply_deadline timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index program_sessions_program_idx on public.program_sessions (program_id, starts_at);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create sequence public.application_no_seq;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  application_no text not null unique
    default ('MMT-' || to_char(now() at time zone 'Asia/Seoul', 'YYYY') || '-' ||
             lpad(nextval('public.application_no_seq')::text, 5, '0')),
  program_id uuid not null references public.programs (id),
  session_id uuid references public.program_sessions (id) on delete set null,
  name text not null default '',
  age_group text not null check (age_group in ('10s', '20s', '30s', '40s', '50s', '60s', '70s_plus')),
  gender text not null check (gender in ('female', 'male', 'other')),
  contact text not null,
  heard_didgeridoo text check (heard_didgeridoo in ('never', 'media', 'live', 'both')),
  reason text not null default '',
  expectations text not null default '',
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'confirmed', 'waitlist', 'rejected', 'cancelled')),
  internal_memo text not null default '',
  consent_privacy boolean not null check (consent_privacy),
  consent_privacy_at timestamptz not null default now(),
  consent_version text not null default '',
  consent_sensitive boolean not null default false,
  lang text not null default 'ko',
  source text not null default 'web' check (source in ('web', 'import')),
  import_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_created_idx on public.applications (created_at desc);
create index applications_program_idx on public.applications (program_id);
create index applications_session_status_idx on public.applications (session_id, status);

-- Health-related answers live in their own table with stricter access.
create table public.application_sensitive_notes (
  application_id uuid primary key references public.applications (id) on delete cascade,
  health_note text not null,
  consent_sensitive_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_by_email text,
  created_at timestamptz not null default now()
);
create index application_status_history_idx on public.application_status_history (application_id, created_at);

-- ---------------------------------------------------------------------------
-- Newsletter, content, settings, audit
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  lang text not null default 'ko',
  unsubscribe_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create unique index newsletter_subscribers_email_uidx on public.newsletter_subscribers (lower(email));

create table public.site_content (
  lang text primary key check (lang in ('ko', 'en')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- Keep updated_at fresh
create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger programs_touch before update on public.programs
  for each row execute function private.touch_updated_at();
create trigger program_sessions_touch before update on public.program_sessions
  for each row execute function private.touch_updated_at();
create trigger applications_touch before update on public.applications
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Public seat availability (counts only, no personal data)
-- ---------------------------------------------------------------------------
create view public.session_availability as
  select s.id as session_id,
         s.program_id,
         coalesce(s.capacity, p.default_capacity) as capacity,
         count(a.id) filter (where a.status = 'confirmed')::int as confirmed_count
  from public.program_sessions s
  join public.programs p on p.id = s.program_id
  left join public.applications a on a.session_id = s.id
  where s.is_published and p.is_published
  group by s.id, s.program_id, s.capacity, p.default_capacity;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.admin_profiles enable row level security;
alter table public.programs enable row level security;
alter table public.program_sessions enable row level security;
alter table public.applications enable row level security;
alter table public.application_sensitive_notes enable row level security;
alter table public.application_status_history enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Start from zero: no direct table privileges for the API roles.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- Public, non-personal data
grant select on public.programs, public.program_sessions, public.site_content,
  public.site_settings, public.session_availability to anon, authenticated;
create policy programs_public_read on public.programs
  for select to anon, authenticated using (is_published);
create policy sessions_public_read on public.program_sessions
  for select to anon, authenticated
  using (is_published and exists (select 1 from public.programs p where p.id = program_id and p.is_published));
create policy content_public_read on public.site_content for select to anon, authenticated using (true);
create policy settings_public_read on public.site_settings for select to anon, authenticated using (true);

-- Admin access (authenticated + a row in admin_profiles)
grant select, insert, update, delete on public.programs, public.program_sessions to authenticated;
create policy programs_admin_read on public.programs for select to authenticated using (private.is_admin());
create policy programs_admin_write on public.programs for all to authenticated
  using (private.can_write()) with check (private.can_write());
create policy sessions_admin_read on public.program_sessions for select to authenticated using (private.is_admin());
create policy sessions_admin_write on public.program_sessions for all to authenticated
  using (private.can_write()) with check (private.can_write());

grant insert, update on public.site_content, public.site_settings to authenticated;
create policy content_admin_write on public.site_content for insert to authenticated with check (private.can_write());
create policy content_admin_update on public.site_content for update to authenticated
  using (private.can_write()) with check (private.can_write());
create policy settings_admin_write on public.site_settings for insert to authenticated with check (private.can_write());
create policy settings_admin_update on public.site_settings for update to authenticated
  using (private.can_write()) with check (private.can_write());

grant select, update (status, internal_memo, session_id) on public.applications to authenticated;
create policy applications_admin_read on public.applications for select to authenticated using (private.is_admin());
create policy applications_admin_update on public.applications for update to authenticated
  using (private.can_write()) with check (private.can_write());

-- Health data: only admins explicitly granted can_view_sensitive; deletion limited to owners.
grant select, delete on public.application_sensitive_notes to authenticated;
create policy sensitive_read on public.application_sensitive_notes for select to authenticated
  using (private.can_view_sensitive());
create policy sensitive_delete on public.application_sensitive_notes for delete to authenticated
  using (private.can_view_sensitive() and private.is_owner());

grant select on public.application_status_history to authenticated;
create policy history_admin_read on public.application_status_history for select to authenticated
  using (private.is_admin());

grant select, update on public.newsletter_subscribers to authenticated;
create policy subscribers_admin_read on public.newsletter_subscribers for select to authenticated
  using (private.is_admin());
create policy subscribers_admin_update on public.newsletter_subscribers for update to authenticated
  using (private.can_write()) with check (private.can_write());

grant select on public.admin_profiles to authenticated;
create policy admin_profiles_self on public.admin_profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.is_owner());

grant select on public.audit_logs to authenticated;
create policy audit_owner_read on public.audit_logs for select to authenticated using (private.is_owner());

-- service_role (server only) bypasses RLS but still needs table privileges.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket for admin-uploaded images (skipped when Storage is absent)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('site-images', 'site-images', true, 8388608,
            array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
    on conflict (id) do nothing;

    execute $p$ create policy "site images are public"
      on storage.objects for select using (bucket_id = 'site-images') $p$;
    execute $p$ create policy "site images written by editors"
      on storage.objects for all to authenticated
      using (bucket_id = 'site-images' and private.can_write())
      with check (bucket_id = 'site-images' and private.can_write()) $p$;
  end if;
end $$;
