create table if not exists public.maxlab_quote_image_configs (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null unique references public.maxlab_websites(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'saved' check (status in ('draft','saved','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.maxlab_quote_image_configs enable row level security;
grant all on public.maxlab_quote_image_configs to service_role;
