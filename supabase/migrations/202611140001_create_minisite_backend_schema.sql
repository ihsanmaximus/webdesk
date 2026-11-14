-- Webdesk Minisite backend schema
create extension if not exists pgcrypto;

create table if not exists public.minisites (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  description text,
  theme jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint minisites_title_max_three_words check (
    cardinality(regexp_split_to_array(trim(title), '\s+')) <= 3
  ),
  constraint minisites_slug_format check (
    slug = lower(slug) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

create table if not exists public.minisite_sections (
  id uuid primary key default gen_random_uuid(),
  minisite_id uuid not null references public.minisites(id) on delete cascade,
  section_key text not null,
  section_type text not null check (section_type in (
    'navbar','hero','hero_image','materi_acara','schedule',
    'speakers','pricing','registration','footer','sticky_cta'
  )),
  title text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (minisite_id, section_key)
);

create table if not exists public.minisite_registrations (
  id uuid primary key default gen_random_uuid(),
  minisite_id uuid not null references public.minisites(id) on delete cascade,
  full_name text not null,
  whatsapp text not null,
  email text,
  education text,
  selected_package text,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_minisites_status on public.minisites(status);
create index if not exists idx_minisite_sections_minisite_order on public.minisite_sections(minisite_id, sort_order);
create index if not exists idx_minisite_registrations_minisite_created on public.minisite_registrations(minisite_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_minisites_updated_at before update on public.minisites
for each row execute function public.set_updated_at();
create trigger trg_minisite_sections_updated_at before update on public.minisite_sections
for each row execute function public.set_updated_at();

alter table public.minisites enable row level security;
alter table public.minisite_sections enable row level security;
alter table public.minisite_registrations enable row level security;

create policy "Published minisites are publicly readable"
on public.minisites for select to anon, authenticated using (status = 'published');

create policy "Sections of published minisites are publicly readable"
on public.minisite_sections for select to anon, authenticated
using (exists (
  select 1 from public.minisites m
  where m.id = minisite_sections.minisite_id and m.status = 'published'
));

create policy "Public can submit registration to published minisites"
on public.minisite_registrations for insert to anon, authenticated
with check (exists (
  select 1 from public.minisites m
  where m.id = minisite_registrations.minisite_id and m.status = 'published'
));

revoke all on public.minisites from anon, authenticated;
revoke all on public.minisite_sections from anon, authenticated;
revoke all on public.minisite_registrations from anon, authenticated;
grant select on public.minisites to anon, authenticated;
grant select on public.minisite_sections to anon, authenticated;
grant insert on public.minisite_registrations to anon, authenticated;
