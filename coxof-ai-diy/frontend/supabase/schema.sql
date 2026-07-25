create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  name text not null,
  product_id integer not null,
  product_name text not null,
  prompt text not null check (char_length(prompt) between 1 and 2000),
  generation_mode text not null check (generation_mode in ('text', 'image')),
  style text not null,
  outputs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_workspace_created_idx
  on public.projects (workspace_id, created_at desc);

alter table public.projects enable row level security;
revoke all on public.projects from anon, authenticated;
grant select, insert, update, delete on public.projects to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-assets',
  'generated-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

revoke all on storage.objects from anon, authenticated;
grant select, insert, update, delete on storage.objects to service_role;
