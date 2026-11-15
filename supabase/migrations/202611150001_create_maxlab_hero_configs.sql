create table if not exists public.maxlab_hero_configs (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null unique references public.maxlab_websites(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.maxlab_hero_configs enable row level security;
revoke all on table public.maxlab_hero_configs from anon, authenticated;
grant all on table public.maxlab_hero_configs to service_role;
comment on table public.maxlab_hero_configs is 'MaxLab Hero section configuration; rendered server-side for each website.';
