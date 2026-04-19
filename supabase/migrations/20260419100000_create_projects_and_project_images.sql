-- Base schema for the portfolio app (run this before add_gallery_media if the table is missing).
-- Matches src/services/projects.ts expectations.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  categories text[] not null default '{}',
  embed_type text not null,
  embed_url text not null,
  thumbnail_url text not null default '',
  is_hidden boolean not null default false,
  is_featured boolean not null default false,
  featured_order integer null,
  description text null,
  year text null,
  sort_order integer null,
  gallery_media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint projects_embed_type_check check (embed_type in ('youtube', 'vimeo'))
);

create index if not exists projects_slug_idx on public.projects (slug);
create index if not exists projects_is_hidden_idx on public.projects (is_hidden);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0
);

create index if not exists project_images_project_id_idx on public.project_images (project_id);

comment on table public.projects is 'Portfolio projects; hero embed uses embed_type + embed_url.';
comment on column public.projects.gallery_media is
  'Ordered JSON: [{type:"image",url}, {type:"video",embedType,embedUrl}, …]. Stills also mirrored in project_images.';
