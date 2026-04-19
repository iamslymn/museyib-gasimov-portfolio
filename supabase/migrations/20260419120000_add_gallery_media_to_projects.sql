-- Safe if you already created projects without gallery_media (older DBs).
-- No-op when the column already exists (e.g. after 20260419100000_create_projects_and_project_images.sql).

alter table if exists public.projects
  add column if not exists gallery_media jsonb not null default '[]'::jsonb;

comment on column public.projects.gallery_media is
  'JSON array of {type: "image", url} | {type: "video", embedType, embedUrl} in display order.';
